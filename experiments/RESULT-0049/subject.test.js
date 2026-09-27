const assert = require('node:assert/strict');
const test = require('node:test');

const { LEVELS } = require('../../src/game');
const { chooseBaseMove } = require('../../solver/bot');
const {
  artifactWithIdentity,
  buildCorpus,
  evaluatePair,
  sourceHashes,
  summarize,
  validateCorpus,
} = require('./subject');

const registration = { exploratory: false, protocol: 'RESULT-0049', protocolCommit: 'a'.repeat(40) };

function outcome({ win = true, moves = 10, score = 100, trace = '1' } = {}) {
  return {
    win,
    movesToTarget: win ? moves : null,
    movesUsed: moves,
    moveBudget: 20,
    score,
    reason: win ? 'target' : 'out_of_moves',
    traceIdentity: trace.repeat(64),
  };
}

function corpusFor(cell) {
  return buildCorpus([{ level: 1, seed: 45_000_000, ...cell }], registration, {
    levelNumbers: [1],
    seeds: [45_000_000],
  });
}

test('A/A through the real collector is exactly inconclusive', () => {
  const level = LEVELS.find(({ level: number }) => number === 1);
  const pair = evaluatePair(level, 1, { baseChooser: chooseBaseMove, championChooser: chooseBaseMove });
  const corpus = buildCorpus([pair], registration, { levelNumbers: [1], seeds: [1] });
  validateCorpus(corpus, { levelNumbers: [1], seeds: [1] });
  const summary = summarize(corpus);
  assert.equal(summary.primaryOutcome, 'INCONCLUSIVE');
  assert.equal(summary.counts.changedTrace, 0);
});

test('the production seam sees a real target-aware decision difference', () => {
  const level = LEVELS.find(({ level: number }) => number === 51);
  const pair = evaluatePair(level, 1);
  assert.notEqual(pair.base.traceIdentity, pair.champion.traceIdentity);
  assert.equal(pair.base.movesToTarget, pair.champion.movesToTarget);
});

test('a planted safety regression produces DOES_NOT_SUPPORT_CURRENT_CHAMPION', () => {
  const corpus = corpusFor({
    base: outcome({ moves: 9, trace: '2' }),
    champion: outcome({ moves: 10, trace: '3' }),
  });
  const summary = summarize(corpus);
  assert.equal(summary.primaryOutcome, 'DOES_NOT_SUPPORT_CURRENT_CHAMPION');
  assert.equal(summary.counts.baseFaster, 1);
});

test('a safe earlier finish produces SUPPORTS_CURRENT_CHAMPION', () => {
  const corpus = corpusFor({
    base: outcome({ moves: 10, trace: '4' }),
    champion: outcome({ moves: 9, trace: '5' }),
  });
  assert.equal(summarize(corpus).primaryOutcome, 'SUPPORTS_CURRENT_CHAMPION');
});

test('same-speed crossing-score differences are diagnostic, not regressions', () => {
  const corpus = corpusFor({
    base: outcome({ moves: 10, score: 100, trace: '6' }),
    champion: outcome({ moves: 10, score: 120, trace: '7' }),
  });
  const summary = summarize(corpus);
  assert.equal(summary.primaryOutcome, 'INCONCLUSIVE');
  assert.equal(summary.counts.sameSpeedDifferentScore, 1);
});

test('missing pairs and coherent source substitution are rejected', () => {
  const valid = corpusFor({ base: outcome({ trace: '8' }), champion: outcome({ trace: '9' }) });
  assert.equal(validateCorpus(valid, { levelNumbers: [1], seeds: [45_000_000] }).pairs, 1);

  const missing = structuredClone(valid);
  missing.cells = [];
  const { artifactIdentity: _missingIdentity, registration: missingRegistration, ...missingBody } = missing;
  assert.throws(() => validateCorpus(artifactWithIdentity(missingBody, missingRegistration), {
    levelNumbers: [1], seeds: [45_000_000],
  }), /incomplete paired matrix/);

  const substituted = structuredClone(valid);
  substituted.sources['solver/bot.js'] = '0'.repeat(64);
  substituted.finalSubjectIdentity = require('./subject').identity(substituted.sources);
  const { artifactIdentity: _old, registration: substitutedRegistration, ...substitutedBody } = substituted;
  assert.notDeepEqual(substituted.sources, sourceHashes());
  assert.throws(() => validateCorpus(artifactWithIdentity(substitutedBody, substitutedRegistration), {
    levelNumbers: [1], seeds: [45_000_000],
  }), /source identity closure mismatch/);
});
