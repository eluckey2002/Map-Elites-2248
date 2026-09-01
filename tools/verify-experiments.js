#!/usr/bin/env node
// Gate: a claim that generalizes beyond what it measured must have said, in
// advance and in writing, what it was testing and what would falsify it.
//
// A result whose proof_class is only direct_source / exact_result /
// owner_decision is an observation or a ruling, not an experiment, and needs
// no protocol. A result carrying heuristic_observation does.
//
// Deliberately NOT checked here: whether a registered protocol's version
// freeze still holds. solver/experiment-guard.js checks that at run time,
// before any compute — which is strictly better, because a freeze that broke
// after the run is a fact about the past, not something a report can fix.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const LEDGER = path.join(ROOT, 'EVIDENCE_LEDGER.md');
const EXPERIMENTS = path.join(ROOT, 'experiments');
const GRANDFATHER = path.join(EXPERIMENTS, 'GRANDFATHERED.md');

const REQUIRES_PROTOCOL = 'heuristic_observation';

function readLedgerResults(text) {
  const results = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const heading = /^### (RESULT-\d+)\b/.exec(line);
    if (heading) {
      current = { id: heading[1], body: [] };
      results.push(current);
      continue;
    }
    if (/^#{2,3} /.test(line)) { current = null; continue; }
    if (current) current.body.push(line);
  }
  return results.map(({ id, body }) => {
    const joined = body.join('\n');
    const pc = /^- \*\*proof_class:\*\*(.*)$/m.exec(joined);
    return { id, proofClass: pc ? pc[1] : '', body: joined };
  });
}

function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const top = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (top) { key = top[1]; out[key] = top[2] === '' ? {} : top[2]; continue; }
    const nested = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (nested && key && typeof out[key] === 'object') out[key][nested[1].trim()] = nested[2].trim();
  }
  return out;
}

function declaredChecks(text) {
  return [...text.matchAll(/^### ([CP]\d+)(?:['′])?\s*[—-]/gm)].map((m) => m[1]);
}

// Paths a ledger record cites as evidence. Only artifacts we can open are
// checked; prose citations are the ordering check's job, not this one.
function citedArtifacts(body) {
  return [...body.matchAll(/`([A-Za-z0-9._/\-]+\.json)`/g)].map((m) => m[1]);
}

// An --exploratory run is allowed to exist; it is not allowed to be the
// evidence under a claim that generalizes. Without this the --exploratory
// hatch has no teeth, and the guard's own error message promises it does.
function assessArtifactStamps(result, exempt) {
  const problems = [];
  if (exempt.has(result.id)) return problems;
  for (const rel of citedArtifacts(result.body)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    let artifact;
    try { artifact = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { continue; }
    const stamp = artifact.registration;
    if (!stamp) {
      problems.push(`${result.id}: ${rel} carries no registration stamp; it cannot back a ${REQUIRES_PROTOCOL} claim`);
    } else if (stamp.exploratory) {
      problems.push(`${result.id}: ${rel} was produced by an --exploratory run and cannot back a ${REQUIRES_PROTOCOL} claim. Register a protocol and re-run.`);
    } else if (stamp.protocol && stamp.protocol !== result.id) {
      problems.push(`${result.id}: ${rel} was produced under ${stamp.protocol}, not ${result.id}`);
    }
  }
  return problems;
}

function grandfathered() {
  if (!fs.existsSync(GRANDFATHER)) return new Set();
  const text = fs.readFileSync(GRANDFATHER, 'utf8');
  return new Set([...text.matchAll(/^- (RESULT-\d+)\b/gm)].map((m) => m[1]));
}

// The commit that FIRST added a path (oldest), so delete-and-re-add cannot
// reset the clock. Null when the path is not committed yet.
function addedIn(relPath) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', relPath], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split('\n').filter(Boolean);
    return out.length ? out[out.length - 1] : null;
  } catch { return null; }
}

function isStrictAncestor(a, b) {
  if (!a || !b || a === b) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function sha16(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

function assessExperiments() {
  const problems = [];
  if (!fs.existsSync(LEDGER)) return ['EVIDENCE_LEDGER.md is missing'];
  const results = readLedgerResults(fs.readFileSync(LEDGER, 'utf8'));
  const exempt = grandfathered();

  for (const result of results) {
    const needs = result.proofClass.includes(REQUIRES_PROTOCOL);
    const dir = path.join(EXPERIMENTS, result.id);
    const protocolPath = path.join(dir, 'protocol.md');
    const hasProtocol = fs.existsSync(protocolPath);

    if (needs) problems.push(...assessArtifactStamps(result, exempt));

    if (needs && !hasProtocol && !exempt.has(result.id)) {
      problems.push(`${result.id} claims ${REQUIRES_PROTOCOL} with no experiments/${result.id}/protocol.md and no grandfather entry`);
      continue;
    }
    if (!hasProtocol) continue;

    const protocol = fs.readFileSync(protocolPath, 'utf8');
    const front = parseFrontmatter(protocol);
    if (!front) { problems.push(`${result.id}: protocol.md has no frontmatter`); continue; }
    if (front.result !== result.id) {
      problems.push(`${result.id}: protocol declares result ${front.result}`);
    }

    // Every check declared before the outcome must be answered by name.
    const reportPath = path.join(dir, 'report.md');
    if (fs.existsSync(reportPath)) {
      const report = fs.readFileSync(reportPath, 'utf8');
      for (const check of declaredChecks(protocol)) {
        if (!new RegExp(`\\b${check}\\b`).test(report)) {
          problems.push(`${result.id}: declared check ${check} is not resolved in report.md`);
        }
      }
      // A protocol is a PRE-registration only if it was committed before the
      // report it justifies. Same commit means no ordering was ever recorded.
      const protoCommit = addedIn(path.join('experiments', result.id, 'protocol.md'));
      const reportCommit = addedIn(path.join('experiments', result.id, 'report.md'));
      if (protoCommit && reportCommit && !isStrictAncestor(protoCommit, reportCommit)) {
        problems.push(
          `${result.id}: protocol.md was not committed before report.md `
          + `(protocol ${protoCommit.slice(0, 8)}, report ${reportCommit.slice(0, 8)}). `
          + 'A protocol committed with or after its results is a reconstruction.',
        );
      }
    } else if (front.status === 'complete') {
      problems.push(`${result.id}: protocol is complete but has no report.md`);
    }
  }
  return problems;
}

function main() {
  const problems = assessExperiments();
  if (problems.length) {
    console.error('EXPERIMENT GATE FAILED');
    for (const p of problems) console.error(`- ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('EXPERIMENT GATE PASS');
}

if (require.main === module) main();

module.exports = {
  REQUIRES_PROTOCOL, addedIn, assessArtifactStamps, assessExperiments, citedArtifacts,
  declaredChecks, isStrictAncestor,
  parseFrontmatter, readLedgerResults, sha16,
};
