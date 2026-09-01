#!/usr/bin/env node
// Gate: a claim that generalizes beyond what it measured must have said, in
// advance and in writing, what it was testing and what would falsify it.
//
// A result whose proof_class is only direct_source / exact_result /
// owner_decision is an observation or a ruling, not an experiment, and needs
// no protocol. A result carrying heuristic_observation does.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

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

function grandfathered() {
  if (!fs.existsSync(GRANDFATHER)) return new Set();
  const text = fs.readFileSync(GRANDFATHER, 'utf8');
  return new Set([...text.matchAll(/^- (RESULT-\d+)\b/gm)].map((m) => m[1]));
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

    // While a protocol is registered but not yet complete, its version freeze
    // must still hold. This is what invalidated chain-offer-v1.
    if (front.status === 'registered' && front.version_freeze && typeof front.version_freeze === 'object') {
      for (const [file, expected] of Object.entries(front.version_freeze)) {
        if (expected.startsWith('<')) continue;
        const abs = path.join(ROOT, file);
        if (!fs.existsSync(abs)) { problems.push(`${result.id}: frozen file ${file} is missing`); continue; }
        const actual = sha16(abs);
        if (actual !== expected) {
          problems.push(`${result.id}: version freeze broken — ${file} is ${actual}, registered as ${expected}. Supersede this record; do not edit it.`);
        }
      }
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
  REQUIRES_PROTOCOL, assessExperiments, declaredChecks, parseFrontmatter, readLedgerResults, sha16,
};
