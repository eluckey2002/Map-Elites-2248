const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  MAX_GAME_BUDGET,
  PINNED,
  PROTOCOL,
  allFamilyKeys,
  buildPlan,
  evaluateCoverage,
  familyForShape,
  partitionForFamily,
  preflight,
  runCorpus,
  selectForFullMeasurement,
  serializePlan,
} = require('../generated-level-corpus');

function shape(overrides = {}) {
  return {
    schemaVersion: 1,
    name: 'fixture-shape',
    level: 54,
    demand: 0.8,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 4,
    gridH: 5,
    blockers: [],
    ...overrides,
  };
}

test('the dry plan is exactly the frozen 480 slots and is byte deterministic', () => {
  let screenCalls = 0;
  let authorCalls = 0;
  const forbidden = {
    screen: () => { screenCalls += 1; throw new Error('screen called during planning'); },
    deriveCandidate: () => { authorCalls += 1; throw new Error('authoring called during planning'); },
  };
  const first = buildPlan(forbidden);
  const second = buildPlan(forbidden);

  assert.equal(first.protocol, PROTOCOL.name);
  assert.equal(first.rawDraws.length, 480);
  assert.deepEqual(first.samplerSeeds, [2026082901, 2026082902, 2026082903, 2026082904]);
  assert.equal(first.familyMap.length, 72);
  assert.equal(screenCalls, 0);
  assert.equal(authorCalls, 0);
  assert.equal(serializePlan(first), serializePlan(second));
});

test('family boundaries and the complete big-endian partition map are frozen', () => {
  assert.equal(familyForShape(shape({ gridW: 4, gridH: 7, moves: 17 })).key, 'compact/middle/3/none');
  assert.equal(familyForShape(shape({ gridW: 5, gridH: 6, moves: 17 })).key, 'medium/tight/3/none');
  assert.equal(familyForShape(shape({ gridW: 6, gridH: 7, moves: 28, minChain: 4 })).key, 'large/middle/4/none');
  assert.equal(familyForShape(shape({ blockers: [{ type: 'stone', x: 0, y: 0 }] })).blockerClass, 'static-only');
  assert.equal(familyForShape(shape({ blockers: [{ type: 'ice', x: 0, y: 0, duration: 3 }] })).blockerClass, 'timed-no-bomb');
  assert.equal(familyForShape(shape({ blockers: [{ type: 'ice', x: 0, y: 0, duration: 3 }, { type: 'bomb', x: 1, y: 1, timer: 8 }] })).blockerClass, 'bomb-present');

  const keys = allFamilyKeys();
  assert.equal(keys.length, 72);
  assert.equal(new Set(keys).size, 72);
  const counts = { optimization: 0, 'development-check': 0, audit: 0 };
  for (const key of keys) counts[partitionForFamily(key).name] += 1;
  assert.deepEqual(counts, { optimization: 40, 'development-check': 15, audit: 17 });
});

test('global deduplication ignores display names and blocker order', () => {
  const blockerA = { type: 'stone', x: 0, y: 0 };
  const blockerB = { type: 'ice', x: 1, y: 1, duration: 4 };
  const plan = buildPlan({
    sampleShape: (_rng, level, index) => shape({
      name: `source-${index}`,
      level,
      blockers: index % 2 ? [blockerA, blockerB] : [blockerB, blockerA],
    }),
  });

  assert.equal(plan.rawDraws.length, 480);
  assert.equal(plan.uniqueShapes.length, 1);
  assert.equal(plan.rawDraws[0].duplicateOf, null);
  assert.equal(plan.rawDraws.filter((entry) => entry.duplicateOf !== null).length, 479);
  assert.ok(plan.rawDraws.slice(1).every((entry) => entry.duplicateOf === plan.rawDraws[0].slotId));
});

test('the sampler seed list is load-bearing plan input', () => {
  const original = buildPlan();
  const changed = buildPlan({ samplerSeeds: [2026082901, 2026082902, 2026082903, 2026082999] });
  assert.notEqual(serializePlan(original), serializePlan(changed));
});

function screenedEntries(cleanCount, rejectedCount) {
  const keys = allFamilyKeys();
  const entries = [];
  for (let index = 0; index < cleanCount + rejectedCount; index++) {
    const familyKey = keys[index % keys.length];
    const rejected = index >= cleanCount;
    entries.push({
      slotId: `slot-${String(index).padStart(3, '0')}`,
      signature: `signature-${index}`,
      familyKey,
      partition: partitionForFamily(familyKey),
      duplicateOf: null,
      screen: { medianScore: 1000 + index, minScore: index, winRate: index / 100 },
      screenRejection: rejected ? '1/24 lockouts' : null,
      target: 100000 + index,
      gateMargin: index,
      incumbentBehavior: `behavior-${index}`,
    });
  }
  return entries;
}

test('selection is family-first, quota exact, and insensitive to outcome fields', () => {
  const entries = screenedEntries(90, 25);
  const first = selectForFullMeasurement(entries);
  const changedOutcomes = entries.map((entry, index) => ({
    ...entry,
    screen: { medianScore: 9_000_000 - index, minScore: -index, winRate: 1 - index / 1000 },
    target: 1,
    gateMargin: -999,
    incumbentBehavior: 'changed',
  }));
  const second = selectForFullMeasurement(changedOutcomes);

  assert.equal(first.clean.length, 60);
  assert.equal(first.stressProbe.length, 12);
  assert.deepEqual(first.clean.map((entry) => entry.slotId), second.clean.map((entry) => entry.slotId));
  assert.deepEqual(first.stressProbe.map((entry) => entry.slotId), second.stressProbe.map((entry) => entry.slotId));
  assert.ok(first.clean.every((entry) => entry.screenRejection === null));
  assert.ok(first.stressProbe.every((entry) => entry.screenRejection !== null));
  assert.ok([...first.clean, ...first.stressProbe].every((entry) => entry.partition.name === partitionForFamily(entry.familyKey).name));
});

test('unused clean and stress-probe quota never transfers between pools', () => {
  const fewClean = selectForFullMeasurement(screenedEntries(3, 30));
  assert.equal(fewClean.clean.length, 3);
  assert.equal(fewClean.stressProbe.length, 12);
  assert.equal(fewClean.selected.length, 15);

  const fewRejected = selectForFullMeasurement(screenedEntries(80, 2));
  assert.equal(fewRejected.clean.length, 60);
  assert.equal(fewRejected.stressProbe.length, 2);
  assert.equal(fewRejected.selected.length, 62);
});

test('duplicates cannot enter full measurement selection', () => {
  const entries = screenedEntries(70, 20);
  entries[0] = { ...entries[0], duplicateOf: 'earlier-slot' };
  const selected = selectForFullMeasurement(entries).selected;
  assert.ok(!selected.some((entry) => entry.slotId === entries[0].slotId));
});

test('current pinned sources, protocol, calibration, champion, and seed ranges pass preflight', () => {
  const result = preflight({ declaredSeedRanges: [] });
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.failures, []);
  assert.equal(result.protocolIdentity, PINNED.protocolIdentity);
});

test('every preflight mismatch invalidates before a single game seam is called', async () => {
  const current = preflight({ declaredSeedRanges: [] });
  const cases = [
    { sourceHashes: { ...current.sourceHashes, 'solver/engine.js': 'wrong' }, declaredSeedRanges: [] },
    { calibration: { ...current.calibration, solverIdentity: 'wrong' }, declaredSeedRanges: [] },
    { championExists: false, declaredSeedRanges: [] },
    { protocolIdentity: 'wrong', declaredSeedRanges: [] },
    { declaredSeedRanges: [{ name: 'new-overlap', start: 20_000_005, count: 1 }] },
  ];

  for (const preflightOptions of cases) {
    const calls = { screen: 0, derive: 0, replay: 0 };
    const result = await runCorpus({
      preflightOptions,
      dependencies: {
        screen: () => { calls.screen += 1; throw new Error('screen must not run'); },
        deriveCandidate: () => { calls.derive += 1; throw new Error('derive must not run'); },
        verifyCandidate: () => { calls.replay += 1; throw new Error('replay must not run'); },
      },
    });
    assert.equal(result.status, 'INVALIDATED');
    assert.deepEqual(calls, { screen: 0, derive: 0, replay: 0 });
  }
});

function measuredRecord(familyKey, index, overrides = {}) {
  return {
    slotId: `measured-${index}`,
    familyKey,
    demandStratum: [0.8, 0.85, 0.9, 0.95][index % 4],
    partition: partitionForFamily(familyKey),
    candidateIdentity: `candidate-${index}`,
    receiptIdentity: `receipt-${index}`,
    replayIntegrity: 'PASS',
    admissionLabel: 'playable-core',
    ...overrides,
  };
}

test('coverage passes only with the frozen family, axis, demand, partition, and integrity bars', () => {
  const passing = allFamilyKeys().map((familyKey, index) => measuredRecord(familyKey, index));
  const result = evaluateCoverage(passing);
  assert.equal(result.status, 'PASS');
  assert.ok(result.conditions.every((condition) => condition.pass));

  const tooNarrow = evaluateCoverage(passing.slice(0, 35));
  assert.equal(tooNarrow.status, 'INCONCLUSIVE');
  assert.equal(tooNarrow.conditions.find((condition) => condition.id === 'family-count').pass, false);

  const stressCannotFill = evaluateCoverage(passing.map((record, index) => (
    index < 40 ? { ...record, admissionLabel: 'adversarial-stress' } : record
  )));
  assert.equal(stressCannotFill.status, 'INCONCLUSIVE');

  const duplicateIdentity = [...passing, { ...passing[0], slotId: 'duplicate-record' }];
  assert.equal(evaluateCoverage(duplicateIdentity).conditions.find((condition) => condition.id === 'identity-integrity').pass, false);
});

test('stubbed execution accounts for all slots, selection origins, dispositions, and budget', async () => {
  let screenCalls = 0;
  let deriveCalls = 0;
  let replayCalls = 0;
  const result = await runCorpus({
    preflightOptions: { declaredSeedRanges: [] },
    dependencies: {
      screen: (candidateShape) => {
        screenCalls += 1;
        const index = Number(candidateShape.name.slice(-4));
        return { lockouts: index < 3 ? 1 : 0, bombs: 0, medianScore: 1000, minScore: 500 };
      },
      deriveCandidate: (candidateShape) => {
        deriveCalls += 1;
        const index = deriveCalls;
        return {
          store: { schemaVersion: 1, candidates: [{ ...candidateShape, target: 1000, tileScale: 32, sourceShapeIdentity: `shape-${index}` }] },
          receipt: {
            receiptIdentity: `receipt-${index}`,
            candidateIdentity: `candidate-${index}`,
            holdout: { terminalCounts: { win: index % 5 === 0 ? 30 : 240, noValidMoves: 0, bombExploded: 0, outOfMoves: index % 5 === 0 ? 270 : 60, incomplete: 0, total: 300 } },
          },
        };
      },
      verifyCandidate: () => { replayCalls += 1; },
    },
  });

  assert.equal(result.manifest.rawDraws.length, 480);
  assert.equal(screenCalls, result.manifest.uniqueShapeCount);
  assert.equal(deriveCalls, result.manifest.selection.clean.length + result.manifest.selection.stressProbe.length);
  assert.equal(replayCalls, deriveCalls);
  assert.ok(result.manifest.selection.clean.length <= 60);
  assert.ok(result.manifest.selection.stressProbe.length <= 12);
  assert.ok(result.manifest.measurements.some((entry) => entry.admissionLabel === 'playable-core'));
  assert.ok(result.manifest.measurements.some((entry) => entry.admissionLabel === 'adversarial-stress'));
  assert.ok(result.manifest.measurements.every((entry) => ['clean', 'stress-probe'].includes(entry.selectionOrigin)));
  assert.ok(result.manifest.gameBudget.maximum <= MAX_GAME_BUDGET);
  assert.ok(['PASS', 'INCONCLUSIVE'].includes(result.status));
});

test('a replay failure is unverified and a planning crash is BLOCKED', async () => {
  let derived = 0;
  const unverified = await runCorpus({
    preflightOptions: { declaredSeedRanges: [] },
    planOptions: {
      sampleShape: (_rng, level, index) => shape({ name: `stub-${index}`, level, demand: [0.8, 0.85, 0.9, 0.95][index % 4], moves: 10 + (index % 5) }),
    },
    dependencies: {
      screen: () => ({ lockouts: 0, bombs: 0, medianScore: 1000, minScore: 500 }),
      deriveCandidate: (candidateShape) => {
        derived += 1;
        return {
          store: { schemaVersion: 1, candidates: [{ ...candidateShape, target: 1000, tileScale: 32 }] },
          receipt: { receiptIdentity: `r-${derived}`, candidateIdentity: `c-${derived}`, holdout: { terminalCounts: { win: 240, noValidMoves: 0, bombExploded: 0, outOfMoves: 60, incomplete: 0, total: 300 } } },
        };
      },
      verifyCandidate: () => { throw new Error('wrong replay'); },
    },
  });
  assert.ok(unverified.manifest.measurements.every((entry) => entry.admissionLabel === 'unverified'));
  assert.equal(unverified.status, 'INCONCLUSIVE');

  const blocked = await runCorpus({
    preflightOptions: { declaredSeedRanges: [] },
    dependencies: { planBuilder: () => { throw new Error('cannot materialize plan'); } },
  });
  assert.equal(blocked.status, 'BLOCKED');
  assert.match(blocked.reason, /cannot materialize plan/);
});
