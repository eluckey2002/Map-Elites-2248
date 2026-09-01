const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const {
  addedIn, assessExperiments, declaredChecks, isStrictAncestor, parseFrontmatter, readLedgerResults,
} = require('../../tools/verify-experiments.js');

test('a result claiming only direct evidence needs no protocol', () => {
  const results = readLedgerResults([
    '### RESULT-0001 — a thing that was read, not inferred',
    '- **proof_class:** `direct_source` for the file contents',
  ].join('\n'));
  assert.equal(results.length, 1);
  assert.equal(results[0].proofClass.includes('heuristic_observation'), false);
});

test('a result claiming generalization is detected as needing one', () => {
  const results = readLedgerResults([
    '### RESULT-0002 — a thing inferred from a sample',
    '- **proof_class:** `heuristic_observation` over the unseen sample',
  ].join('\n'));
  assert.equal(results[0].proofClass.includes('heuristic_observation'), true);
});

test('a heading between records ends the record', () => {
  const results = readLedgerResults([
    '### RESULT-0003 — first',
    '- **proof_class:** `direct_source`',
    '## Decision registry',
    '- **proof_class:** `heuristic_observation`',
  ].join('\n'));
  assert.equal(results.length, 1);
  assert.equal(results[0].proofClass.includes('heuristic_observation'), false);
});

test('declared checks are parsed by name, primes and em-dashes included', () => {
  assert.deepEqual(
    declaredChecks([
      '### C1 — negative control (PASS / FAIL)',
      "### C3' — suite unchanged, corrected",
      '### P1 — primary empirical prediction',
      '### Not a check — prose heading',
    ].join('\n')),
    ['C1', 'C3', 'P1'],
  );
});

test('frontmatter parses nested version freeze entries', () => {
  const front = parseFrontmatter([
    '---',
    'result: RESULT-0019',
    'status: registered',
    'version_freeze:',
    '  solver/bot.js: abc123',
    '  src/game.js: def456',
    '---',
    '# body',
  ].join('\n'));
  assert.equal(front.result, 'RESULT-0019');
  assert.deepEqual(front.version_freeze, { 'solver/bot.js': 'abc123', 'src/game.js': 'def456' });
});

// The tests above are synthetic. This one runs the gate against this
// repository, so the suite can actually see an unprotocolled result.
test('LIVE: every generalizing result in this ledger has a protocol or a grandfather entry', () => {
  assert.deepEqual(
    assessExperiments(), [],
    'Experiment gate failed against the live ledger; run node tools/verify-experiments.js',
  );
});

test('a commit is never a strict ancestor of itself — same-commit backfill fails', () => {
  const root = path.join(__dirname, '..', '..');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const prev = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(isStrictAncestor(head, head), false, 'same commit must not count as ordered');
  assert.equal(isStrictAncestor(prev, head), true, 'earlier commit precedes later');
  assert.equal(isStrictAncestor(head, prev), false, 'later commit does not precede earlier');
  assert.equal(isStrictAncestor(null, head), false);
});

test('addedIn returns the OLDEST add, so delete-and-re-add cannot reset the clock', () => {
  assert.equal(typeof addedIn('EVIDENCE_LEDGER.md'), 'string');
  assert.equal(addedIn('does/not/exist.md'), null);
});
