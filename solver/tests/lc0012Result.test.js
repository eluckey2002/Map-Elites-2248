const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { summaryFromArtifact } = require('../../tools/diagnose-lc0012-early-ready-timing-panel');

const ROOT = path.join(__dirname, '..', '..');
const cycles = path.join(ROOT, 'docs', 'learning-cycles');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(cycles, name), 'utf8'));
}

test('closed LC-0012 panel retains its mixed target effect', () => {
  const closure = read('LC-0012-early-ready-timing-panel-closure.json');
  const raw = read('LC-0012-early-ready-timing-panel-raw.json');
  const summary = summaryFromArtifact(raw);

  assert.equal(closure.closure_status, 'CLOSED');
  assert.equal(closure.primary_outcome, 'MIXED_TARGET_EFFECT');
  assert.equal(raw.artifactIdentity, 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff');
  assert.equal(raw.disposition, 'MIXED_TARGET_EFFECT');
  assert.equal(summary.sourceCount, 24);
  assert.equal(summary.selectedCount, 14);
  assert.equal(summary.selectedLevelCount, 9);
  assert.deepEqual(summary.pairClasses, {
    OBSERVED_WAIT_ONLY_WIN: 0,
    CASH_NOW_ONLY_WIN: 0,
    OBSERVED_WAIT_FASTER: 3,
    CASH_NOW_FASTER: 10,
    TARGET_COST_TIE: 1,
    NEITHER_WINS: 0,
  });
});

test('all selected pairs reach target and retain the registered paired effect', () => {
  const summary = summaryFromArtifact(read('LC-0012-early-ready-timing-panel-raw.json'));
  assert.equal(summary.pairs.length, 14);
  assert.equal(summary.pairs.every(({ observedWait, cashNow }) => (
    observedWait.outcome === 'win' && cashNow.outcome === 'win'
  )), true);
  assert.equal(summary.mutualWinEffect.count, 14);
  assert.equal(summary.mutualWinEffect.meanCashMinusWait, -22 / 14);
  assert.equal(summary.mutualWinEffect.medianCashMinusWait, -2);
  assert.equal(summary.mutualWinEffect.populationInference, false);
});

test('registered primary recomputation is byte-identical to the live summary', () => {
  const raw = read('LC-0012-early-ready-timing-panel-raw.json');
  const expected = fs.readFileSync(path.join(cycles, 'LC-0012-early-ready-timing-panel-recomputed.json'));
  const observed = Buffer.from(`${JSON.stringify(summaryFromArtifact(raw), null, 2)}\n`);
  assert.deepEqual(observed, expected);
});

test('qualification did not execute the corpus cash-now arm before the reportable matrix', () => {
  const qualification = read('LC-0012-early-ready-timing-panel-qualification.json');
  assert.equal(qualification.status, 'PASS');
  assert.equal(qualification.cashNowCorpusExecuted, false);
  assert.equal(qualification.controls.length, 9);
  assert.equal(qualification.controls.every(({ pass }) => pass), true);
});

test('protected gameplay sources retain their frozen identities', () => {
  const expected = {
    'solver/bot.js': '3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65',
    'solver/engine.js': '0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873',
    'src/game.js': '3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1',
  };
  for (const [relative, identity] of Object.entries(expected)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
    assert.equal(actual, identity, relative);
  }
});
