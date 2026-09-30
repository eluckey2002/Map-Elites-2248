const assert = require('node:assert/strict');
const test = require('node:test');
const { LEVELS } = require('../../src/game');
const { chooseMove } = require('../../solver/bot');
const { chooseBombLatticeMove } = require('../../solver/bomb-lattice-challenger');
const { buildCorpus, evaluatePair, summarize, validateCorpus } = require('./subject');

const level = LEVELS.find(({ level: number }) => number === 58);
const registration = { exploratory: false, protocol: 'RESULT-0078', protocolCommit: 'a'.repeat(40) };

test('A/A control is deterministic through the production evaluator seam', () => {
  const cell = evaluatePair(level, 42_000_001, { championChooser: chooseMove, challengerChooser: chooseMove });
  assert.equal(cell.champion.traceIdentity, cell.challenger.traceIdentity);
  assert.equal(summarize({ cells: [cell], panel: { levelNumbers: [58], seeds: [42_000_001] } }).primaryOutcome, 'INCONCLUSIVE');
});

test('positive control exposes the bomb-lattice challenger on the already-opened Level 58 board', () => {
  const cell = evaluatePair(level, 42_000_001, { championChooser: chooseMove, challengerChooser: chooseBombLatticeMove });
  assert.notEqual(cell.champion.traceIdentity, cell.challenger.traceIdentity);
});

test('validator rejects a missing paired cell', () => {
  const cell = evaluatePair(level, 42_000_001);
  const corpus = buildCorpus([cell], registration, { levelNumbers: [58], seeds: [42_000_001] });
  validateCorpus(corpus, { levelNumbers: [58], seeds: [42_000_001] });
  const { artifactIdentity, ...body } = corpus;
  assert.throws(() => validateCorpus({ ...body, cells: [], artifactIdentity }, { levelNumbers: [58], seeds: [42_000_001] }), /corpus panel mismatch/);
});

test('known slower-challenger mutation falsifies the strict safety rule', () => {
  const cell = evaluatePair(level, 42_000_001, { championChooser: chooseMove, challengerChooser: chooseMove });
  cell.challenger.movesToTarget = cell.champion.movesToTarget + 1;
  const summary = summarize({ cells: [cell], panel: { levelNumbers: [58], seeds: [42_000_001] } });
  assert.equal(summary.primaryOutcome, 'FALSIFIED');
  assert.equal(summary.claims.P1.outcome, 'FAIL');
});
