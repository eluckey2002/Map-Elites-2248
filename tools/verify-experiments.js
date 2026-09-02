#!/usr/bin/env node
// Gate: a claim that generalizes beyond what it measured must have said, in
// advance and in writing, what it was testing and what would falsify it.
//
// A result whose proof_class is only direct_source / exact_result /
// owner_decision is an observation or a ruling, not an experiment, and needs
// no protocol. A result carrying heuristic_observation does.
//
// The version freeze is checked here in the two forms that stay true forever:
// while a protocol is still `registered` its frozen files must match the tree
// (this is what experiments/README.md item 4 has always claimed), and once it
// is `complete` every source hash its ARTIFACT recorded must be one the
// protocol froze. solver/experiment-guard.js additionally re-checks the tree at
// run time, before any compute. What is deliberately NOT checked is a frozen
// file moving after a completed run: that is a fact about the present, not
// about the evidence, and clause (b) already pins what the evidence was made
// from.

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
function addedIn(relPath, cwd = ROOT) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', relPath], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
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

// Duplicated from solver/target-aware-evaluation.js rather than imported:
// solver/experiment-guard.js requires THIS file, so requiring solver code from
// here would close a cycle that runs on every worker thread of every run.
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

// Reachable from HEAD, not merely present in the object store: an amended-away
// commit still resolves locally and would not exist in a fresh clone.
function reachableFromHead(sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function pathExistsAtCommit(sha, relPath) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}:${relPath}`], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch { return false; }
}

// The file as it was at a commit, or null. The registration commit is the only
// copy of a protocol that carries a point in time, so it is the only copy whose
// freeze means anything; the working tree is whatever the experimenter last
// wrote.
function showAtCommit(sha, relPath, cwd = ROOT) {
  try {
    return execFileSync('git', ['show', `${sha}:${relPath}`], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch { return null; }
}

// A freeze that is missing, empty, or still holds TEMPLATE.md placeholders
// enforces nothing: every hash comparison is skipped and the protocol passes
// as if it had frozen the code. Only tools/new-experiment.js writes real
// hashes; a hand-copied template is the way a protocol ends up like this.
function freezeProblem(freeze) {
  if (!freeze || typeof freeze !== 'object' || Object.keys(freeze).length === 0) {
    return 'freezes nothing: version_freeze is missing or empty';
  }
  const placeholders = Object.entries(freeze).filter(([, value]) => String(value).startsWith('<'));
  if (placeholders.length) {
    return `still holds template placeholders in version_freeze (${placeholders.map(([file]) => file).join(', ')})`;
  }
  return null;
}

// One read per cited artifact, shared by every artifact-level assertion below,
// because the holdouts are 6.5 MB each.
function openCitedArtifacts(result) {
  return citedArtifacts(result.body).map((rel) => {
    const abs = path.join(ROOT, rel);
    const exists = fs.existsSync(abs);
    let artifact = null;
    let parseError = null;
    if (exists) {
      try { artifact = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (error) { parseError = error.message; }
    }
    // A citation with no slash is a filename named in prose, not a path into
    // the repo. Four such exist in the ledger today ("-52.receipt.json"), and
    // reading them as paths would make this gate red on English.
    return { rel, abs, looksLikePath: rel.includes('/'), exists, artifact, parseError };
  });
}

// A path-shaped citation that does not resolve is a dead receipt. This is the
// exact failure experiments/README.md cites as motivating the gate — "two
// ledger citations rotted to paths that never resolved" — and that nothing
// checked. Grandfathering waives the protocol requirement, never the
// requirement that a receipt be a real file.
function assessCitationsResolve(result, opened) {
  const problems = [];
  for (const { rel, looksLikePath, exists, parseError } of opened) {
    if (looksLikePath && !exists) {
      problems.push(`${result.id}: cited artifact ${rel} does not exist; a citation that resolves to nothing is not evidence`);
    }
    if (exists && parseError) {
      problems.push(`${result.id}: cited artifact ${rel} is not parseable JSON (${parseError})`);
    }
  }
  return problems;
}

// An artifact that publishes its own identity must still hash to it. The ledger
// cites these identities as direct_source facts; until now nothing recomputed
// one, so any cell could be edited and every gate stayed green.
function assessArtifactIdentity(result, opened) {
  const problems = [];
  for (const { rel, artifact } of opened) {
    if (!artifact || typeof artifact.artifactIdentity !== 'string') continue;
    const { artifactIdentity, registration, ...body } = artifact;
    const actual = crypto.createHash('sha256').update(canonicalJson(body)).digest('hex');
    if (actual !== artifactIdentity) {
      problems.push(
        `${result.id}: ${rel} does not hash to its own artifactIdentity `
        + `(recomputed ${actual.slice(0, 16)}…, recorded ${artifactIdentity.slice(0, 16)}…)`,
      );
    }
  }
  return problems;
}

// The stamp is the entire provenance argument: a commit sha that did not exist
// when the run started cannot be inside the artifact. Nothing checked that the
// sha is a real commit, that it carries this protocol, or that it precedes the
// report — so all three could be false and the gate passed.
function assessStampProvenance(result, opened, reportCommit) {
  const problems = [];
  const protocolRel = `experiments/${result.id}/protocol.md`;
  for (const { rel, artifact } of opened) {
    const stamp = artifact && artifact.registration;
    if (!stamp || stamp.exploratory) continue;
    const sha = stamp.protocolCommit;
    if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit is not a full commit sha (${sha === undefined ? 'absent' : JSON.stringify(sha)})`);
      continue;
    }
    if (!reachableFromHead(sha)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} is not a commit reachable from HEAD`);
      continue;
    }
    if (!pathExistsAtCommit(sha, protocolRel)) {
      problems.push(`${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} does not contain ${protocolRel}`);
    }
    if (reportCommit && !isStrictAncestor(sha, reportCommit)) {
      problems.push(
        `${result.id}: ${rel} registration.protocolCommit ${sha.slice(0, 8)} does not strictly precede `
        + `the commit adding report.md (${reportCommit.slice(0, 8)}). The artifact was not produced under this registration.`,
      );
    }
  }
  return problems;
}

// (a) While `status: registered`, the frozen files must still match the tree.
//     experiments/README.md item 4 has always said the gate enforces this; it
//     did not.
// (b) Once complete, every source hash the ARTIFACT recorded must be one the
//     protocol froze. That is the durable half: it stays checkable after a
//     frozen file legitimately moves on, and it goes red if the freeze list
//     never covered the files that carried the measurement.
// `registeredFront` is the frontmatter at the protocol's registration commit.
// When given, the freeze is read from there, not from `front` (the working
// tree): a freeze rewritten after registration is a reconstruction, and the
// registration commit is the only copy that cannot have been written after
// the data. Callers without git access pass nothing and get the old behaviour.
function assessVersionFreeze(result, front, opened, registeredFront = null) {
  const problems = [];
  const registered = registeredFront || front;
  const freeze = registered.version_freeze;
  if (!freeze || typeof freeze !== 'object') return problems;
  const emptiness = freezeProblem(freeze);
  if (emptiness) {
    problems.push(`${result.id}: protocol ${emptiness}. Register with tools/new-experiment.js, which records real hashes.`);
    return problems;
  }
  if (registeredFront && canonicalJson(front.version_freeze || null) !== canonicalJson(freeze)) {
    problems.push(
      `${result.id}: protocol.md version_freeze on disk differs from the copy at its registration commit. `
      + 'A freeze rewritten after registration is a reconstruction; supersede the record instead of editing it.',
    );
  }
  const frozenValues = new Set(Object.values(freeze).map((value) => String(value)));

  if (front.status === 'registered') {
    for (const [file, expected] of Object.entries(freeze)) {
      const target = path.join(ROOT, file);
      if (!fs.existsSync(target)) {
        problems.push(`${result.id}: version_freeze names ${file}, which is missing`);
        continue;
      }
      const actual = sha16(target);
      if (actual !== expected) {
        problems.push(
          `${result.id}: version_freeze broken while status: registered — ${file} is ${actual}, registered as ${expected}. `
          + 'Supersede this record with a new protocol; do not edit it.',
        );
      }
    }
  }

  for (const { rel, artifact } of opened) {
    const sources = artifact && artifact.sources;
    if (!sources || typeof sources !== 'object') continue;
    for (const [role, hash] of Object.entries(sources)) {
      if (typeof hash !== 'string') continue;
      if (!frozenValues.has(hash.slice(0, 16))) {
        problems.push(
          `${result.id}: ${rel} was produced against ${role} ${hash.slice(0, 16)}…, which no version_freeze entry covers. `
          + 'Either the run used an unfrozen file or the freeze list misses a file that carries the measurement.',
        );
      }
    }
  }
  return problems;
}

// A check is answered when it has a section of its own that states an outcome.
// The previous test was `\bC1\b` anywhere in the report, which a report could
// satisfy by naming the check and answering nothing — and which the real
// RESULT-0020 report satisfied for P1, P2 and P4 from incidental sentences in
// a different section, so those three could have been deleted wholesale.
const VERDICT = /\b(PASS|FAIL|SUPPORTED|FALSIFIED|INCONCLUSIVE|BREACH)\b/i;

function reportSection(report, check) {
  const heading = new RegExp(`^#{2,6}[ \\t]*${check}\\b`, 'm');
  const match = heading.exec(report);
  if (!match) return null;
  const rest = report.slice(match.index);
  const nextHeading = /\n#{1,6}[ \t]/.exec(rest);
  return nextHeading ? rest.slice(0, nextHeading.index) : rest;
}

function assessReportAnswers(result, protocol, report) {
  const problems = [];
  for (const check of declaredChecks(protocol)) {
    const section = reportSection(report, check);
    if (section === null) {
      problems.push(
        `${result.id}: declared check ${check} has no section of its own in report.md. `
        + 'Naming a check in passing is not answering it.',
      );
    } else if (!VERDICT.test(section)) {
      problems.push(
        `${result.id}: declared check ${check} has a section but states no outcome. `
        + 'Expected one of PASS / FAIL / SUPPORTED / FALSIFIED / INCONCLUSIVE / BREACH.',
      );
    }
  }
  return problems;
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
    const opened = openCitedArtifacts(result);

    // Universal, including grandfathered records: being exempt from the
    // protocol requirement never exempts a citation from resolving or an
    // artifact from hashing to the identity it publishes.
    problems.push(...assessCitationsResolve(result, opened));
    problems.push(...assessArtifactIdentity(result, opened));

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

    const protoRel = path.join('experiments', result.id, 'protocol.md');
    const protoCommit = addedIn(protoRel);
    const registeredFront = protoCommit ? parseFrontmatter(showAtCommit(protoCommit, protoRel) || '') : null;
    problems.push(...assessVersionFreeze(result, front, opened, registeredFront));

    const reportPath = path.join(dir, 'report.md');
    if (fs.existsSync(reportPath)) {
      const report = fs.readFileSync(reportPath, 'utf8');
      // Every check declared before the outcome must be answered, not just named.
      problems.push(...assessReportAnswers(result, protocol, report));
      // A protocol is a PRE-registration only if it was committed before the
      // report it justifies. Same commit means no ordering was ever recorded.
      const reportCommit = addedIn(path.join('experiments', result.id, 'report.md'));
      if (needs && !exempt.has(result.id)) {
        problems.push(...assessStampProvenance(result, opened, reportCommit));
      }
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
  assessArtifactIdentity, assessCitationsResolve, assessReportAnswers, assessStampProvenance,
  assessVersionFreeze, canonicalJson, freezeProblem, openCitedArtifacts, reachableFromHead, reportSection,
  showAtCommit,
};
