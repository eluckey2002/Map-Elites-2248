const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { summaryFromArtifact } = require('../../tools/diagnose-lc0011-cashout-timing');

const ROOT = path.join(__dirname, '..', '..');
const cycles = path.join(ROOT, 'docs', 'learning-cycles');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(cycles, name), 'utf8'));
}

test('closed LC-0011 comparison is an exact target-cost tie', () => {
  const closure = read('LC-0011-cashout-timing-closure.json');
  const raw = read('LC-0011-cashout-timing-raw.json');
  assert.equal(closure.closure_status, 'CLOSED');
  assert.equal(closure.primary_outcome, 'TARGET_COST_TIE');
  assert.equal(raw.artifactIdentity, 'e50f53500b527c20af6d0d670e7f827b23b4b7ed3a9caac63f068bb052381f3c');
  assert.equal(raw.disposition, 'TARGET_COST_TIE');
  assert.equal(raw.arms.WAIT_ONE.reachedTarget, true);
  assert.equal(raw.arms.CASH_NOW.reachedTarget, true);
  assert.equal(raw.arms.WAIT_ONE.movesToTarget, 2);
  assert.equal(raw.arms.CASH_NOW.movesToTarget, 2);
});

test('first actions and second-move finishes remain distinct', () => {
  const raw = read('LC-0011-cashout-timing-raw.json');
  assert.deepEqual(raw.arms.WAIT_ONE.trace.map(({ points }) => points), [3072, 56320]);
  assert.deepEqual(raw.arms.CASH_NOW.trace.map(({ points }) => points), [56320, 10240]);
  assert.equal(raw.arms.WAIT_ONE.trace.at(-1).score, 126144);
  assert.equal(raw.arms.CASH_NOW.trace.at(-1).score, 133312);
});

test('registered primary recomputation is byte-identical to the live summary', () => {
  const raw = read('LC-0011-cashout-timing-raw.json');
  const expected = fs.readFileSync(path.join(cycles, 'LC-0011-cashout-timing-recomputed.json'));
  const observed = Buffer.from(`${JSON.stringify(summaryFromArtifact(raw), null, 2)}\n`);
  assert.deepEqual(observed, expected);
});

test('qualification did not execute cash-now before the reportable pair', () => {
  const qualification = read('LC-0011-cashout-timing-qualification.json');
  assert.equal(qualification.status, 'PASS');
  assert.equal(qualification.cashNowExecuted, false);
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
