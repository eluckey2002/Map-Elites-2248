#!/usr/bin/env node
// Re-runs the `reverify` command of every current ledger record and reports
// which ones no longer pass. Read-only with respect to the ledger: it never
// changes a record's status. A new failure is a lead for a person or a
// separate agent to investigate and, if warranted, record as a correction.
//
// What it runs: backticked commands in `reverify` of the form `node --test ...`
// or `node <script> [args]`, split on spaces and executed without a shell.
// What it never runs:
//   - inline `node -e` scripts or anything with shell syntax (listed as manual)
//   - commands that produce evidence rather than check it (`--confirm`,
//     `--out`, `--protocol`, `--exploratory`, a `write` argument)
// Known failures documented in AGENTS.md are reported as known, not new.
// Commands slower than the time limit are listed as too slow, not failed.
// It checks exit codes only; the record's prose expectation is printed next to
// the output tail for a reader to compare.
//
// Run it on a clean checkout of origin/main. On a Windows clone made before the
// LF rule, run tools/refresh-line-endings.sh first or source hashes will differ.
//
// Usage: node tools/ledger-recheck.js [--out report.md] [--timeout-min 5]

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseLedgerRecords } = require('./ledger-index.js');

const ROOT = path.join(__dirname, '..');
const CURRENT = ['accepted', 'narrowed'];
const SHELL_CHARS = /[;&|<>$`"'\\]/;
const PRODUCES_EVIDENCE = /(^|\s)(--confirm|--out|--protocol|--exploratory|write)(\s|=|$)/;

// Failures AGENTS.md documents as known and decided. A command whose only
// failures are these is reported as KNOWN; any other failure is NEW.
const KNOWN_TEST_FAILURES = [
  'candidate-levels-52.json has a receipt that verifies against the current bot',
  'candidate-levels-54.json has a receipt that verifies against the current bot',
  'the builder is byte-stable and the committed generated views are current',
];
const KNOWN_COMMANDS = {
  'node tools/verify-universe-map.js': 'AGENTS.md: the Universe Map is a 2026-08-28 snapshot and its staleness failure is true',
};

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
}

// Commands current records ask to be run, sorted into what this loop may run.
function plan(records) {
  const runnable = new Map(); // command -> [record ids]
  const producesEvidence = new Map();
  const manual = [];
  for (const r of records.filter((x) => CURRENT.includes(x.fields.status))) {
    const reverify = r.fields.reverify || '';
    const cmds = [...reverify.matchAll(/`(node [^`]+)`/g)].map((m) => m[1].trim());
    const safe = cmds.filter((c) => !c.startsWith('node -e') && !SHELL_CHARS.test(c));
    for (const c of safe) {
      const target = PRODUCES_EVIDENCE.test(c) ? producesEvidence : runnable;
      target.set(c, [...(target.get(c) || []), r.id]);
    }
    if (!safe.length && !/not.applicable/i.test(reverify)) manual.push({ id: r.id, reverify });
  }
  return { runnable, producesEvidence, manual };
}

function failingTests(output) {
  return [...output.matchAll(/^✖ (.+?) \([\d.]+ms\)$/gm)].map((m) => m[1]);
}

// Verifiers that pin the source files an experiment ran on fail once the code
// moves on. That says the check needs the recorded commit, not that the claim
// is wrong, so it is reported separately rather than as a new failure.
const CODE_CHANGED = /source identity closure mismatch|protected file changed|identity mismatch/i;

function classify(command, res, output) {
  if (res.error?.code === 'ETIMEDOUT') return 'TOO_SLOW';
  if (res.status === 0) return 'PASS';
  if (KNOWN_COMMANDS[command]) return 'KNOWN';
  if (CODE_CHANGED.test(output)) return 'CODE_CHANGED';
  const failed = failingTests(output).filter((t) => t !== 'failing tests:');
  if (failed.length && failed.every((t) => KNOWN_TEST_FAILURES.includes(t))) return 'KNOWN';
  return 'NEW_FAILURE';
}

function run(command, timeoutMs) {
  const [bin, ...args] = command.split(/\s+/);
  const started = Date.now();
  const res = spawnSync(bin === 'node' ? process.execPath : bin, args, {
    cwd: ROOT, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 1 << 26,
  });
  const output = `${res.stdout || ''}${res.stderr || ''}`.trim();
  return {
    status: classify(command, res, output),
    exit: res.status,
    seconds: Math.round((Date.now() - started) / 1000),
    tail: output.split('\n').slice(-8).join('\n'),
  };
}

function expectation(records, id) {
  const r = records.find((x) => x.id === id);
  const m = /expect(.*)$/i.exec(r?.fields.reverify || '');
  return m ? `expect${m[1]}` : '(no stated expectation)';
}

function render(records, results, producesEvidence, manual, head, timeoutMin) {
  const by = (s) => results.filter((r) => r.status === s);
  const newFailures = by('NEW_FAILURE');
  const list = (rows, fmt) => (rows.length ? rows.map(fmt) : ['None.']);
  return [
    `# Ledger re-check ${new Date().toISOString().slice(0, 10)} at ${head}`,
    '',
    `**${newFailures.length} new failures.** ${by('PASS').length} passed, ${by('KNOWN').length} known failures, `
      + `${by('CODE_CHANGED').length} need the commit they were recorded at, `
      + `${by('TOO_SLOW').length} too slow (over ${timeoutMin} min), ${producesEvidence.size} not run because they produce evidence, `
      + `${manual.length} records need a manual check.`,
    '',
    'Exit codes only. A new failure is a lead, not a verdict: open the record, compare the output with its',
    'expectation, and record a correction only after an independent check. This report changes nothing.',
    '',
    '## New failures',
    '',
    ...(newFailures.length ? newFailures.flatMap((r) => [
      `### ${r.ids.join(', ')} (exit ${r.exit}, ${r.seconds}s)`,
      '', `Command: \`${r.command}\``, '', `Record says: ${expectation(records, r.ids[0])}`, '',
      '```', r.tail, '```', '',
    ]) : ['None.', '']),
    '## Known failures (documented in AGENTS.md)',
    '',
    ...list(by('KNOWN'), (r) => `- ${r.ids.join(', ')}: \`${r.command}\`${KNOWN_COMMANDS[r.command] ? ` (${KNOWN_COMMANDS[r.command]})` : ''}`),
    '',
    '## Code changed since recorded',
    '',
    'These verifiers pin the source an experiment ran on. Today\'s code differs, so they cannot pass here;',
    're-check them at the commit the result was recorded at.',
    '',
    ...list(by('CODE_CHANGED'), (r) => `- ${r.ids.join(', ')}: \`${r.command}\``),
    '',
    '## Too slow for this run',
    '',
    ...list(by('TOO_SLOW'), (r) => `- ${r.ids.join(', ')}: \`${r.command}\``),
    '',
    '## Not run: these commands produce evidence',
    '',
    ...list([...producesEvidence], ([c, ids]) => `- ${ids.join(', ')}: \`${c}\``),
    '',
    '## Manual check needed',
    '',
    ...list(manual, (m) => `- ${m.id}: ${m.reverify}`),
    '',
    '## Passed',
    '',
    ...list(by('PASS'), (r) => `- ${r.ids.join(', ')}: \`${r.command}\` (${r.seconds}s)`),
    '',
  ].join('\n');
}

function main() {
  const timeoutMin = Number(arg('--timeout-min', 5));
  const records = parseLedgerRecords(fs.readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8'));
  const { runnable, producesEvidence, manual } = plan(records);
  const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  const results = [];
  for (const [command, ids] of runnable) {
    process.stderr.write(`running: ${command}\n`);
    results.push({ command, ids, ...run(command, timeoutMin * 60_000) });
  }
  const report = render(records, results, producesEvidence, manual, head, timeoutMin);
  const out = arg('--out');
  if (out) fs.writeFileSync(out, report); else process.stdout.write(report);
  process.exitCode = results.some((r) => r.status === 'NEW_FAILURE') ? 1 : 0;
}

if (require.main === module) main();

module.exports = { plan, run, classify, failingTests, KNOWN_TEST_FAILURES };
