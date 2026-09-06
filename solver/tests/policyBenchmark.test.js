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
  buildCandidateIndex,
  resolveAttemptSource,
  valueIdentity,
} = require('../benchmark-inputs');
const { compareCases, scoreDiagnostic } = require('../benchmark-metrics');
const { classifyTerminal, replayRecording } = require('../benchmark-replay');
const { findBestChain, findTopChains } = require('../engine');
const { playBot } = require('../human-benchmark');

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
  assert.deepEqual(frozen.referenceDefaults, frozen.manifest.reference.params);
  assert.deepEqual(Object.keys(frozen.behaviorSources).sort(), ['solver/bot.js', 'solver/engine.js', 'src/game.js']);
});

test('E07 canonical captured payload dedupes key order but not distinct session content', () => {
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'recordings', '1352aa7a02cdf868c92b47ecb492528c699692699ecfd0da54b990836aef4aea.json'), 'utf8'));
  const reordered = Object.fromEntries(Object.entries(source).reverse());
  assert.equal(valueIdentity(source), valueIdentity(reordered));
  assert.notEqual(valueIdentity(source), valueIdentity({ ...source, sessionId: 'distinct-session' }));
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

test('E17 subject identity ignores labels but distinguishes target and budget', () => {
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
  assert.equal(result.ranking.meanMovesSaved, null);
});

test('E02 keeps losing-attempt moves out of primary D and labels a joint-win diagnostic', () => {
  const result = comparison([
    { reference: outcome('win', 12), comparisons: [outcome('win', 8)] },
    { reference: outcome('win', 12), comparisons: [outcome('lose')] },
  ]);
  assert.equal(result.ranking.verdict, 'INELIGIBLE');
  assert.equal(result.ranking.meanMovesSaved, null);
  assert.deepEqual(result.jointWinDiagnostic, {
    label: 'joint-win diagnostic; cannot rescue eligibility or replace D',
    meanMovesSaved: 4,
    jointWinAttempts: 1,
    totalAttempts: 2,
    affectedCases: 1,
    totalCases: 2,
  });
});

test('E16 percentages use the reference score and zero reference yields null', () => {
  assert.deepEqual(scoreDiagnostic(0, 20), { referenceScore: 0, comparisonScore: 20, rawDelta: 20, percentOfReference: null });
  assert.deepEqual(scoreDiagnostic(100, 120), { referenceScore: 100, comparisonScore: 120, rawDelta: 20, percentOfReference: 20 });
});

test('E11 unequal score horizons are explicitly non-comparable', () => {
  assert.deepEqual(scoreDiagnostic(150, 100, { referenceHorizon: 20, comparisonHorizon: 10 }), {
    referenceScore: 150,
    comparisonScore: 100,
    rawDelta: -50,
    percentOfReference: null,
    referenceHorizon: 20,
    comparisonHorizon: 10,
    comparability: 'unequal-horizon-no-inference',
  });
});

test('all 15 frozen attempts resolve through content-bound subjects in their separate provenance panels', () => {
  const { manifest } = loadFrozenInputs({ root: ROOT });
  const index = buildCandidateIndex({ root: ROOT });
  const resolved = manifest.requiredAttemptSources.map((source) => resolveAttemptSource(source, manifest, { root: ROOT, index }));
  assert.equal(resolved.length, 15);
  assert.equal(resolved.filter((entry) => entry.ok).length, 15, JSON.stringify(resolved.filter((entry) => !entry.ok), null, 2));
  assert.equal(resolved.filter((entry) => entry.panel === 'receipt-bound').length, 12);
  assert.equal(resolved.filter((entry) => entry.panel === 'current-subject').length, 3);
  for (const entry of resolved.filter((item) => item.panel === 'receipt-bound')) {
    assert.equal(entry.candidateIdentity, entry.expected.candidateIdentity);
    assert.equal(entry.candidateIdentity, entry.contentIdentity);
    assert.ok(entry.receiptSource, `${entry.expected.path}: receipt provenance missing`);
  }
});

test('a forged candidate receipt key does not resolve content under that identity', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-eval-candidate-'));
  const solverDir = path.join(dir, 'solver');
  fs.mkdirSync(solverDir);
  const candidate = { schemaVersion: 1, name: 'forged', level: 1, target: 10, tileScale: 1, moves: 2, minChain: 2, gridW: 2, gridH: 2, blockers: [] };
  fs.writeFileSync(path.join(solverDir, 'candidate-levels.json'), JSON.stringify({ schemaVersion: 1, candidates: [candidate] }));
  fs.writeFileSync(path.join(solverDir, 'candidate-levels.receipt.json'), JSON.stringify({ schemaVersion: 1, candidateIdentity: 'f'.repeat(64) }));
  const index = buildCandidateIndex({ root: dir });
  assert.equal(index.candidates.size, 0);
  assert.match(index.invalid[0].reason, /candidate content identity mismatch/);
});

test('a real recording replays exactly; altered coordinates and missing traces become unresolved', () => {
  const { manifest } = loadFrozenInputs({ root: ROOT });
  const expected = manifest.requiredAttemptSources.find((entry) => entry.path.startsWith('recordings/'));
  const resolved = resolveAttemptSource(expected, manifest, { root: ROOT });
  const valid = replayRecording(resolved.candidate, resolved.recording, { expectedSeed: expected.seed, expectedCandidateIdentity: expected.candidateIdentity });
  assert.equal(valid.validity, 'valid');
  assert.equal(valid.outcome, 'win');
  assert.equal(valid.score, resolved.recording.score);
  assert.equal(valid.moves, resolved.recording.movesUsed);

  const altered = structuredClone(resolved.recording);
  altered.chains[0].tiles[0].x = resolved.candidate.gridW + 1;
  const badCoordinate = replayRecording(resolved.candidate, altered, { expectedSeed: expected.seed, expectedCandidateIdentity: expected.candidateIdentity });
  assert.equal(badCoordinate.validity, 'unresolved');
  assert.match(badCoordinate.reasons.join('\n'), /coordinate .* out of bounds/);

  const missing = { ...resolved.recording };
  delete missing.chains;
  const missingTrace = replayRecording(resolved.candidate, missing, { expectedSeed: expected.seed, expectedCandidateIdentity: expected.candidateIdentity });
  assert.equal(missingTrace.validity, 'unresolved');
  assert.match(missingTrace.reasons.join('\n'), /missing trace/);
});

test('seed and subject-binding mismatches are unresolved without crashing', () => {
  const { manifest } = loadFrozenInputs({ root: ROOT });
  const expected = manifest.requiredAttemptSources[0];
  const resolved = resolveAttemptSource(expected, manifest, { root: ROOT });
  assert.match(replayRecording(resolved.candidate, { ...resolved.recording, seed: expected.seed + 1 }, {
    expectedSeed: expected.seed, expectedCandidateIdentity: expected.candidateIdentity,
  }).reasons.join('\n'), /seed mismatch/);
  assert.match(replayRecording(resolved.candidate, { ...resolved.recording, candidateIdentity: '0'.repeat(64) }, {
    expectedSeed: expected.seed, expectedCandidateIdentity: expected.candidateIdentity,
  }).reasons.join('\n'), /candidate identity mismatch/);
});

test('false win, premature loss, and continuation after terminal are unresolved', () => {
  const { manifest } = loadFrozenInputs({ root: ROOT });
  const index = buildCandidateIndex({ root: ROOT });
  const winningExpected = manifest.requiredAttemptSources.find((entry) => entry.path.startsWith('recordings/1352'));
  const losingExpected = manifest.requiredAttemptSources.find((entry) => entry.path.startsWith('recordings/8ac6'));
  const winning = resolveAttemptSource(winningExpected, manifest, { root: ROOT, index });
  const losing = resolveAttemptSource(losingExpected, manifest, { root: ROOT, index });
  const prematureLoss = replayRecording(winning.candidate, { ...winning.recording, outcome: 'lose', reason: 'out of moves' }, {
    expectedSeed: winningExpected.seed, expectedCandidateIdentity: winningExpected.candidateIdentity,
  });
  assert.equal(prematureLoss.validity, 'unresolved');
  assert.match(prematureLoss.reasons.join('\n'), /recording claims lose, replay is win/);
  const falseWin = replayRecording(losing.candidate, { ...losing.recording, outcome: 'win', reason: 'target reached' }, {
    expectedSeed: losingExpected.seed, expectedCandidateIdentity: losingExpected.candidateIdentity,
  });
  assert.equal(falseWin.validity, 'unresolved');
  assert.match(falseWin.reasons.join('\n'), /recording claims win, replay is lose/);
  const continued = structuredClone(winning.recording);
  continued.chains.push(continued.chains[0]);
  const postTerminal = replayRecording(winning.candidate, continued, {
    expectedSeed: winningExpected.seed, expectedCandidateIdentity: winningExpected.candidateIdentity,
  });
  assert.equal(postTerminal.validity, 'unresolved');
  assert.match(postTerminal.reasons.join('\n'), /continuation after terminal target reached/);
});

test('E09-E10 terminal precedence is bomb then target then budget then no-legal-move', () => {
  const base = { score: 100, targetScore: 100, moves: 20, maxMoves: 20 };
  assert.deepEqual(classifyTerminal(base, { bomb: true, hasLegalMove: false, targetEnabled: true }),
    { outcome: 'lose', reason: 'bomb exploded', firstCrossing: null });
  assert.deepEqual(classifyTerminal(base, { bomb: false, hasLegalMove: false, targetEnabled: true }),
    { outcome: 'win', reason: 'target reached', firstCrossing: 20 });
  assert.deepEqual(classifyTerminal({ ...base, score: 99 }, { bomb: false, hasLegalMove: false, targetEnabled: true }),
    { outcome: 'lose', reason: 'out of moves', firstCrossing: null });
  assert.deepEqual(classifyTerminal({ ...base, score: 99, moves: 19 }, { bomb: false, hasLegalMove: false, targetEnabled: true }),
    { outcome: 'lose', reason: 'no legal moves', firstCrossing: null });
});

test('target-disabled external horizon keeps original B visible and labels completion, E12-E14', () => {
  const candidate = { gridW: 3, gridH: 3, minChain: 2, tileScale: 1, target: 1, moves: 20, blockers: [] };
  const observed = [];
  const chooseMoveFn = (state) => {
    observed.push({ maxMoves: state.maxMoves, targetScore: state.targetScore });
    return findBestChain(state).chain;
  };
  const result = playBot(candidate, 4, { targetDisabled: true, externalHorizon: 1, chooseMoveFn });
  assert.deepEqual(observed, [{ maxMoves: 20, targetScore: Infinity }]);
  assert.equal(result.outcome, 'horizon-complete');
  assert.equal(result.reason, 'external horizon reached');
  assert.equal(result.moves, 1);
  assert.equal(result.originalBudget, 20);
  assert.equal(result.externalHorizon, 1);
  assert.equal(result.objective, 'target-disabled score diagnostic');
  assert.equal(result.liveRngDrawsAfterInitialization, candidate.gridW * candidate.gridH);
  assert.equal(result.initialGrid.length, candidate.gridH);
});

test('E13 B equal to H is horizon completion, not target-disabled out-of-moves loss', () => {
  const candidate = { gridW: 2, gridH: 2, minChain: 2, tileScale: 1, target: 100000, moves: 1, blockers: [] };
  const result = playBot(candidate, 1, {
    targetDisabled: true,
    externalHorizon: 1,
    chooseMoveFn: (state) => findBestChain(state).chain,
  });
  assert.equal(result.outcome, 'horizon-complete');
  assert.equal(result.reason, 'external horizon reached');
});

test('E14 a score-mode bomb retains its terminal score as the absorbing score', () => {
  const candidate = {
    gridW: 3, gridH: 3, minChain: 2, tileScale: 1, target: 100000, moves: 3,
    blockers: [{ type: 'bomb', x: 0, y: 0, timer: 1 }],
  };
  const result = playBot(candidate, 1, {
    targetDisabled: true,
    externalHorizon: 2,
    chooseMoveFn: (state) => findTopChains(state).find(({ chain }) => chain.every((tile) => tile.x !== 0 || tile.y !== 0)).chain,
  });
  assert.equal(result.outcome, 'lose');
  assert.equal(result.reason, 'bomb exploded');
  assert.equal(result.moves, 1);
  assert.ok(result.score > 0, 'the real terminal score is retained rather than replaced by zero');
});

test('lookahead factories cannot consume the live refill RNG', () => {
  const candidate = { gridW: 3, gridH: 3, minChain: 2, tileScale: 1, target: 999999, moves: 4, blockers: [] };
  const quiet = playBot(candidate, 7, {
    targetDisabled: true,
    externalHorizon: 2,
    chooseMoveFn: (state) => findBestChain(state).chain,
  });
  const noisy = playBot(candidate, 7, {
    targetDisabled: true,
    externalHorizon: 2,
    chooseMoveFn: (state, options) => {
      for (let i = 0; i < 100; i++) options.lookaheadRngFactory()();
      return findBestChain(state).chain;
    },
  });
  assert.deepEqual(noisy, quiet);
});

test('no choice on a valid live input is policy-failure, not proof of no legal move', () => {
  const candidate = { gridW: 3, gridH: 3, minChain: 2, tileScale: 1, target: 999999, moves: 4, blockers: [] };
  const result = playBot(candidate, 7, { chooseMoveFn: () => null });
  assert.equal(result.validity, 'valid');
  assert.equal(result.outcome, 'policy-failure');
  assert.equal(result.reason, 'policy returned no choice while a legal move exists');
});

test('an illegal policy chain is reproduced as policy-failure before it can score', () => {
  const candidate = { gridW: 2, gridH: 2, minChain: 3, tileScale: 1, target: 1, moves: 1, blockers: [] };
  const result = playBot(candidate, 1, {
    chooseMoveFn: (state) => [state.grid[0][0], state.grid[0][0], state.grid[0][0]],
  });
  assert.equal(result.outcome, 'policy-failure');
  assert.equal(result.score, 0);
  assert.match(result.reason, /illegal choice/);
});

test('E15 a thrown measurement path is unresolved, not a detected bad policy', () => {
  const candidate = { gridW: 2, gridH: 2, minChain: 2, tileScale: 1, target: 100, moves: 2, blockers: [] };
  const result = playBot(candidate, 1, { chooseMoveFn: () => { throw new Error('harness fault'); } });
  assert.equal(result.validity, 'unresolved');
  assert.equal(result.outcome, null);
  assert.match(result.reason, /measurement fault: harness fault/);
});
