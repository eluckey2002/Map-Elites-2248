const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const { DEFAULT_PARAMS } = require('../bot');
const { identity, recordSession } = require('../record-session');
const {
  auditSessionArtifact,
  classifyAttribution,
  searchImmediateWin,
  verifySessionArtifact,
} = require('../trajectory-audit');

function writeSession(session) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trajectory-audit-'));
  const artifactPath = path.join(directory, 'session.json');
  fs.writeFileSync(artifactPath, JSON.stringify(session));
  return artifactPath;
}

function rehash(session) {
  const copy = structuredClone(session);
  delete copy.sessionIdentity;
  copy.sessionIdentity = identity(copy);
  return copy;
}

test('a real recordSession artifact is independently replayed and verified', () => {
  const subject = LEVELS.find(({ level }) => level === 1);
  const artifactPath = writeSession(recordSession(subject, 3));
  const result = verifySessionArtifact(artifactPath, subject);

  assert.equal(result.status, 'VERIFIED', result.reasons.join('; '));
  assert.equal(result.session.seed, 3);
  assert.deepEqual(result.session.params, DEFAULT_PARAMS);
  assert.equal(result.positions.length, result.session.moves);
  assert.ok(result.positions.length > 0, 'missing positions must not pass vacuously');
});

test('self-rehashed tampering and invalid intake remain unresolved', () => {
  const subject = LEVELS.find(({ level }) => level === 1);
  const original = recordSession(subject, 3);
  const mutations = [
    ['spawn', (session) => { session.moves[0].spawnDelta[0].value *= 2; }],
    ['chain', (session) => { session.moves[0].chain[0].x = subject.gridW + 1; }],
    ['score', (session) => { session.moves[0].scoreAfter += 1; }],
    ['outcome', (session) => { session.outcome.result = session.outcome.result === 'win' ? 'lose' : 'win'; }],
    ['source', (session) => { session.identities.code.engine.sha256 = 'f'.repeat(64); }],
    ['params', (session) => { session.policy.params.width += 1; session.policy.identity = identity(session.policy.params); }],
    ['continuation', (session) => { session.moves.push(structuredClone(session.moves[0])); }],
  ];

  for (const [name, mutate] of mutations) {
    const bad = structuredClone(original);
    mutate(bad);
    const result = verifySessionArtifact(writeSession(rehash(bad)), subject);
    assert.equal(result.status, 'UNRESOLVED', `${name} unexpectedly passed`);
    assert.ok(result.reasons.length > 0, `${name} produced no reason`);
  }

  assert.equal(verifySessionArtifact('/definitely/missing/session.json', subject).status, 'UNRESOLVED');
  assert.equal(verifySessionArtifact(writeSession('{not-json'), subject).status, 'UNRESOLVED');

  for (const mutate of [
    (session) => { session.seed += 1; },
    (session) => { session.level += 1; },
    (session) => { session.moves = []; },
    (session) => { session.moves.pop(); },
  ]) {
    const bad = structuredClone(original);
    mutate(bad);
    assert.equal(verifySessionArtifact(writeSession(rehash(bad)), subject).status, 'UNRESOLVED');
  }
});

function stateFrom(values, options = {}) {
  const grid = values.map((row, y) => row.map((value, x) => (
    value === null ? null : {
      x, y, value: typeof value === 'number' ? value : value.value,
      blocker: typeof value === 'number' ? null : value.blocker || null,
      blockerDuration: 0,
      bombTimer: typeof value === 'number' ? 0 : value.bombTimer || 0,
    }
  )));
  return {
    grid,
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    minChain: options.minChain || 2,
    tileScale: 1,
    score: options.score || 0,
    moves: options.moves || 0,
    maxMoves: options.maxMoves || 3,
    targetScore: options.targetScore || 4,
  };
}

test('bounded search finds a replayed move-B win and reports explicit limits', () => {
  const state = stateFrom([[2, 2], [4, 8]], { moves: 1, maxMoves: 2 });
  const result = searchImmediateWin(state, { seed: 5, draws: 4 }, {
    maxNodes: 100,
    maxElapsedMs: 100,
    now: () => 0,
  });

  assert.equal(result.disposition, 'FOUND');
  assert.equal(result.witness.transition.outcome.reason, 'target reached');
  assert.equal(result.witness.transition.outcome.firstCrossing, 2);
  assert.equal(result.complete, false, 'FOUND proves existence, not enumeration');
  assert.deepEqual(result.limits, { maxNodes: 100, maxElapsedMs: 100 });
  assert.ok(result.nodes > 0);
  assert.equal(result.searchElapsedMs, 0);
});

test('search keeps transition-distinct actions that coarse endpoint/length/score dedup drops', () => {
  const state = stateFrom([[2, 2, 2]], { targetScore: 1_000 });
  const result = searchImmediateWin(state, { seed: 7, draws: 4 }, {
    maxNodes: 1_000,
    maxElapsedMs: 100,
    now: () => 0,
  });

  assert.equal(result.disposition, 'NONE');
  assert.ok(result.testedActionIdentities.includes('1,0;0,0'));
  assert.ok(result.testedActionIdentities.includes('1,0;2,0'));
});

test('bomb-before-target makes a crossing invalid and exhaustive no-win is NONE', () => {
  const bomb = stateFrom([[2, 2, { value: 8, blocker: 'bomb', bombTimer: 1 }]]);
  const bombResult = searchImmediateWin(bomb, { seed: 1, draws: 4 }, {
    maxNodes: 1_000, maxElapsedMs: 100, now: () => 0,
  });
  assert.equal(bombResult.disposition, 'NONE');
  assert.equal(bombResult.complete, true);

  const noWin = stateFrom([[2, 2], [4, 8]], { targetScore: 1_000 });
  assert.equal(searchImmediateWin(noWin, { seed: 1, draws: 4 }, {
    maxNodes: 1_000, maxElapsedMs: 100, now: () => 0,
  }).disposition, 'NONE');
});

test('node and injected-time limits fail closed as UNKNOWN', () => {
  const state = stateFrom([[2, 2], [2, 2]]);
  const zero = searchImmediateWin(state, { seed: 1, draws: 4 }, {
    maxNodes: 0, maxElapsedMs: 100, now: () => 0,
  });
  assert.equal(zero.disposition, 'UNKNOWN');
  assert.equal(zero.nodes, 0);
  assert.deepEqual(zero.capReasons, ['maxNodes']);

  const capped = searchImmediateWin(state, { seed: 1, draws: 4 }, {
    maxNodes: 1, maxElapsedMs: 100, now: () => 0,
  });
  assert.equal(capped.disposition, 'UNKNOWN');
  assert.deepEqual(capped.capReasons, ['maxNodes']);
  assert.equal(capped.complete, false);

  let tick = 0;
  const timed = searchImmediateWin(state, { seed: 1, draws: 4 }, {
    maxNodes: 100, maxElapsedMs: 1, now: () => tick++,
  });
  assert.equal(timed.disposition, 'UNKNOWN');
  assert.deepEqual(timed.capReasons, ['maxElapsedMs']);
});

test('search leaves the supplied state and RNG descriptor unchanged', () => {
  const state = stateFrom([[2, 2], [4, 8]]);
  const rngState = { seed: 9, draws: 4 };
  const before = structuredClone({ state, rngState });
  searchImmediateWin(state, rngState, { maxNodes: 100, maxElapsedMs: 100, now: () => 0 });
  assert.deepEqual({ state, rngState }, before);
});

test('attribution uses offered action identity and preserves ambiguous control flow', () => {
  const witness = { actionIdentity: 'winner' };
  assert.equal(classifyAttribution(witness, {
    reason: 'normal-weighted-ranking', selectedChain: [{ x: 9, y: 9 }],
    candidates: [{ chain: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }],
  }, { selectedActionIdentity: 'other', offeredActionIdentities: ['winner'] }), 'ranking');
  assert.equal(classifyAttribution(witness, { reason: 'normal-weighted-ranking' }, {
    selectedActionIdentity: 'other', offeredActionIdentities: [],
  }), 'generation');
  assert.equal(classifyAttribution(witness, { reason: 'bomb-priority' }, {
    selectedActionIdentity: 'other', offeredActionIdentities: [],
  }), 'control-flow');
  assert.equal(classifyAttribution(witness, { reason: 'unexpected' }, {
    selectedActionIdentity: 'other', offeredActionIdentities: [],
  }), 'unresolved');
});

test('public consumer admits only verified sessions and retains complete/capped/invalid denominators', () => {
  const subject = {
    level: 9001, target: 4, tileScale: 1, moves: 1, minChain: 2,
    gridW: 2, gridH: 2, blockers: [],
  };
  const session = recordSession(subject, 11);
  const artifactPath = writeSession(session);
  const complete = auditSessionArtifact(artifactPath, subject, {
    maxNodes: 1_000, maxElapsedMs: 100, searchNow: () => 0, replayNow: () => 0,
  });
  assert.equal(complete.status, 'COMPLETE');
  assert.equal(complete.denominators.sessionsRequested, 1);
  assert.equal(complete.denominators.sessionsVerified, 1);
  assert.equal(complete.denominators.positionsRequested, session.moves.length);
  assert.equal(complete.denominators.positionsReported, session.moves.length);
  assert.ok(complete.positions.every(({ sessionIdentity, precedingMoves }) => (
    sessionIdentity === session.sessionIdentity && Number.isSafeInteger(precedingMoves)
  )));
  assert.equal(complete.timing.searchMs,
    complete.positions.reduce((sum, position) => sum + position.search.searchElapsedMs, 0));
  assert.ok(!Object.hasOwn(complete, 'promotionVerdict'));

  const capped = auditSessionArtifact(artifactPath, subject, {
    maxNodes: 1, maxElapsedMs: 100, searchNow: () => 0, replayNow: () => 0,
  });
  assert.equal(capped.status, 'COMPLETE');
  assert.ok(capped.denominators.unknownPositions > 0);
  assert.ok(capped.positions.some(({ search }) => search.disposition === 'UNKNOWN'));

  const bad = structuredClone(session);
  bad.moves[0].scoreAfter += 1;
  const invalid = auditSessionArtifact(writeSession(rehash(bad)), subject, {
    maxNodes: 1_000, maxElapsedMs: 100, searchNow: () => 0, replayNow: () => 0,
  });
  assert.equal(invalid.status, 'UNRESOLVED');
  assert.deepEqual(invalid.positions, []);
  assert.equal(invalid.denominators.sessionsVerified, 0);
  assert.equal(invalid.denominators.positionsRequested, null);
});
