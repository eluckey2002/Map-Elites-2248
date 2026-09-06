const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  CONTRACT_SHA256,
  INPUTS_SHA256,
  canonicalJson,
  fileSha256,
  loadFrozenInputs,
  subjectKey,
  validateSeed,
  verifyPinnedFile,
} = require('../benchmark-inputs');
const { compareCases, scoreDiagnostic } = require('../benchmark-metrics');

const ROOT = path.join(__dirname, '..', '..');

function outcome(outcomeName, moves = null) {
  return { outcome: outcomeName, moves: outcomeName === 'win' ? moves : null };
}

function comparison(cases) {
  return compareCases(cases.map((entry, index) => ({
    caseKey: `case-${index}`,
    reference: entry.reference,
    comparisons: entry.comparisons,
  })));
}

test('the accepted frozen package is read by byte identity', () => {
  const frozen = loadFrozenInputs({ root: ROOT });
  assert.equal(frozen.contractSha256, CONTRACT_SHA256);
  assert.equal(frozen.inputsSha256, INPUTS_SHA256);
  assert.equal(frozen.manifest.contractId, 'POLICY-EVAL-0001');
  assert.equal(frozen.manifest.requiredAttemptSources.length, 15);
  assert.equal(frozen.manifest.shippedSubjects.length, 58);
});

test('a real pinned file passes and a filesystem-mutated twin fails by hash', () => {
  const source = path.join(ROOT, 'recordings', '1352aa7a02cdf868c92b47ecb492528c699692699ecfd0da54b990836aef4aea.json');
  const expected = fileSha256(source);
  assert.deepEqual(verifyPinnedFile(source, expected), { ok: true, actualSha256: expected });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-eval-bad-file-'));
  const twin = path.join(dir, 'recording.json');
  fs.copyFileSync(source, twin);
  fs.appendFileSync(twin, ' ');
  const verdict = verifyPinnedFile(twin, expected);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, 'sha256-mismatch');
  assert.notEqual(verdict.actualSha256, expected);
});

test('seed validation refuses aliases outside uint32 instead of normalizing them', () => {
  assert.equal(validateSeed(0), 0);
  assert.equal(validateSeed(4294967295), 4294967295);
  for (const seed of [-1, 4294967296, 1.5, '1']) {
    assert.throws(() => validateSeed(seed), /integer from 0 through 4294967295/);
  }
});

test('subject identity ignores labels but distinguishes target and budget', () => {
  const base = { gridW: 5, gridH: 8, minChain: 3, tileScale: 32, target: 100, moves: 20, blockers: [] };
  assert.equal(subjectKey({ ...base, level: 51, name: 'a' }), subjectKey({ ...base, level: 99, name: 'b' }));
  assert.notEqual(subjectKey(base), subjectKey({ ...base, target: 101 }));
  assert.notEqual(subjectKey(base), subjectKey({ ...base, moves: 21 }));
});

test('subject identity sorts blockers and rejects duplicate coordinates or unsupported types', () => {
  const base = { gridW: 4, gridH: 5, minChain: 3, target: 100, moves: 20 };
  const blockers = [{ type: 'bomb', x: 2, y: 3, timer: 4 }, { type: 'ice', x: 0, y: 1, duration: 2 }];
  assert.equal(subjectKey({ ...base, blockers }), subjectKey({ ...base, blockers: blockers.slice().reverse() }));
  assert.throws(() => subjectKey({ ...base, blockers: [{ type: 'stone', x: 1, y: 1 }, { type: 'ice', x: 1, y: 1, duration: 2 }] }), /duplicate blocker coordinate/);
  assert.throws(() => subjectKey({ ...base, blockers: [{ type: 'lock', x: 1, y: 1 }] }), /unsupported blocker type/);
});

test('canonical JSON sorts object keys recursively but preserves array order', () => {
  assert.equal(canonicalJson({ z: [{ b: 2, a: 1 }], a: 0 }), '{"a":0,"z":[{"a":1,"b":2}]}');
  assert.notEqual(canonicalJson({ a: [1, 2] }), canonicalJson({ a: [2, 1] }));
});

test('E01-E05 and E18 enforce reliability then wins then fixed-set speed', () => {
  assert.deepEqual(comparison([{ reference: outcome('win', 12), comparisons: [outcome('win', 10)] }]).ranking,
    { eligibility: 'ELIGIBLE', verdict: 'FASTER_ON_THIS_SET', convertedWins: 0, meanMovesSaved: 2 });
  assert.equal(comparison([
    { reference: outcome('win', 12), comparisons: [outcome('win', 8)] },
    { reference: outcome('win', 12), comparisons: [outcome('lose')] },
  ]).ranking.verdict, 'INELIGIBLE');
  const e03 = comparison([
    { reference: outcome('win', 10), comparisons: [outcome('win', 12)] },
    { reference: outcome('lose'), comparisons: [outcome('win', 20)] },
  ]).ranking;
  assert.deepEqual(e03, { eligibility: 'ELIGIBLE', verdict: 'BETTER_ON_THIS_SET_BY_WINS', convertedWins: 1, meanMovesSaved: -2 });
  assert.equal(comparison([{ reference: outcome('win', 10), comparisons: [outcome('win', 10)] }]).ranking.verdict, 'TIED_ON_THIS_SET');
  assert.deepEqual(comparison([{ reference: outcome('lose'), comparisons: [outcome('lose')] }]).ranking,
    { eligibility: 'ELIGIBLE', verdict: 'NO_SUCCESS_OBSERVED', convertedWins: 0, meanMovesSaved: null });
  assert.deepEqual(comparison([{ reference: outcome('lose'), comparisons: [outcome('win', 9)] }]).ranking,
    { eligibility: 'ELIGIBLE', verdict: 'BETTER_ON_THIS_SET_BY_WINS', convertedWins: 1, meanMovesSaved: null });
});

test('E06 weights attempts within a case before weighting cases', () => {
  const result = comparison([
    { reference: outcome('win', 12), comparisons: [outcome('win', 8), outcome('win', 10), outcome('win', 12)] },
    { reference: outcome('win', 10), comparisons: [outcome('win', 14)] },
  ]);
  assert.equal(result.ranking.meanMovesSaved, -1);
  assert.deepEqual(result.speedCounts, { faster: 1, slower: 1, tied: 0 });
});

test('E08 unresolved evidence blocks a full-panel verdict', () => {
  const result = compareCases([{
    caseKey: 'a', reference: outcome('win', 10), comparisons: [outcome('win', 9)], unresolved: ['missing trace'],
  }]);
  assert.equal(result.ranking.eligibility, 'UNRESOLVED');
  assert.equal(result.ranking.verdict, 'UNRESOLVED');
});

test('E16 percentages use the reference score and zero reference yields null', () => {
  assert.deepEqual(scoreDiagnostic(0, 20), { referenceScore: 0, comparisonScore: 20, rawDelta: 20, percentOfReference: null });
  assert.deepEqual(scoreDiagnostic(100, 120), { referenceScore: 100, comparisonScore: 120, rawDelta: 20, percentOfReference: 20 });
});
