const { test } = require('node:test');
const assert = require('node:assert/strict');

const { makeRng } = require('../engine');
const { validateShape, DEFAULT_GATES } = require('../level-author');
const {
  sampleShape,
  shapeSignature,
  screenVerdict,
  gateVerdict,
  rankShortlist,
  SPACE,
  SCREEN_SEEDS,
} = require('../generate-levels');

// The sampler invents shapes with no human reading them before the pipeline
// does, so the one invariant that matters is that it can never emit a shape the
// pipeline's own validator would reject.
test('every sampled shape is legal input to the authoring pipeline', () => {
  const rng = makeRng(20260817);
  for (let i = 0; i < 500; i++) {
    const shape = sampleShape(rng, 52, i);
    assert.doesNotThrow(() => validateShape(shape), `shape ${i}: ${JSON.stringify(shape)}`);
  }
});

test('sampled shapes stay inside the declared sampling space', () => {
  const rng = makeRng(7);
  for (let i = 0; i < 200; i++) {
    const shape = sampleShape(rng, 52, i);
    assert.ok(shape.gridW >= SPACE.gridW[0] && shape.gridW <= SPACE.gridW[1]);
    assert.ok(shape.gridH >= SPACE.gridH[0] && shape.gridH <= SPACE.gridH[1]);
    assert.ok(shape.minChain >= SPACE.minChain[0] && shape.minChain <= SPACE.minChain[1]);
    assert.ok(shape.demand >= SPACE.demand[0] - 1e-9 && shape.demand <= SPACE.demand[1] + 1e-9);
    assert.ok(shape.blockers.length <= SPACE.blockerCount[1]);
    const cells = shape.gridW * shape.gridH;
    assert.ok(shape.moves >= Math.round(cells * SPACE.movesPerCell[0]));
    assert.ok(shape.moves <= Math.round(cells * SPACE.movesPerCell[1]));
  }
});

test('the sampler is reproducible from its seed', () => {
  const a = makeRng(99);
  const b = makeRng(99);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(sampleShape(a, 52, i), sampleShape(b, 52, i));
  }
});

// A signature exists to stop the same level being presented twice under two
// names, so it must ignore the name and the order blockers were drawn in.
test('the signature ignores name and blocker order', () => {
  const base = {
    schemaVersion: 1,
    name: 'gen-0001',
    level: 52,
    demand: 0.7,
    demandStatus: 'provisional-proposal',
    moves: 24,
    minChain: 4,
    gridW: 5,
    gridH: 7,
    blockers: [{ type: 'stone', x: 2, y: 3 }, { type: 'ice', x: 1, y: 1, duration: 5 }],
  };
  const reordered = {
    ...base,
    name: 'gen-0099',
    blockers: [base.blockers[1], base.blockers[0]],
  };
  assert.equal(shapeSignature(base), shapeSignature(reordered));
});

test('the signature separates shapes that differ in any knob', () => {
  const base = {
    gridW: 5, gridH: 7, moves: 24, minChain: 4, demand: 0.7, blockers: [],
  };
  const signature = shapeSignature(base);
  assert.notEqual(shapeSignature({ ...base, gridW: 6 }), signature);
  assert.notEqual(shapeSignature({ ...base, moves: 25 }), signature);
  assert.notEqual(shapeSignature({ ...base, minChain: 5 }), signature);
  assert.notEqual(shapeSignature({ ...base, demand: 0.75 }), signature);
  assert.notEqual(shapeSignature({ ...base, blockers: [{ type: 'stone', x: 0, y: 0 }] }), signature);
});

test('the screen drops a board that locks up and keeps a clean one', () => {
  assert.equal(screenVerdict({ lockouts: 0, bombs: 0, medianScore: 1000, minScore: 500 }), null);
  assert.match(screenVerdict({ lockouts: 1, bombs: 0, medianScore: 1000 }), /lockout/);
  assert.match(screenVerdict({ lockouts: 0, bombs: 0, medianScore: 0 }), /scores nothing/);
  const tooManyBombs = Math.floor(SCREEN_SEEDS.count * DEFAULT_GATES.maxBombRate) + 1;
  assert.match(screenVerdict({ lockouts: 0, bombs: tooManyBombs, medianScore: 1000 }), /bomb/);
});

// gateVerdict must read the holdout exactly the way the pipeline's own
// verifyCandidate does; a generator that graded itself leniently would hand
// over candidates the real gate then rejects.
test('the gate verdict matches the pipeline thresholds', () => {
  const holdout = (counts) => ({ holdout: { terminalCounts: { win: 0, noValidMoves: 0, bombExploded: 0, outOfMoves: 0, incomplete: 0, total: 300, ...counts } } });

  const clean = gateVerdict(holdout({ win: 200, outOfMoves: 100 }));
  assert.equal(clean.pass, true);

  const oneLockout = gateVerdict(holdout({ win: 200, noValidMoves: 1, outOfMoves: 99 }));
  assert.equal(oneLockout.pass, false, 'a single dead board must fail');

  const atWinFloor = gateVerdict(holdout({ win: 300 * DEFAULT_GATES.minWinRate, outOfMoves: 240 }));
  assert.equal(atWinFloor.pass, true, 'the win rate floor is inclusive, as in verifyCandidate');

  const belowWinFloor = gateVerdict(holdout({ win: 300 * DEFAULT_GATES.minWinRate - 1, outOfMoves: 241 }));
  assert.equal(belowWinFloor.pass, false);

  const atBombCeiling = gateVerdict(holdout({ win: 200, bombExploded: 300 * DEFAULT_GATES.maxBombRate, outOfMoves: 85 }));
  assert.equal(atBombCeiling.pass, true, 'the bomb ceiling is inclusive, as in verifyCandidate');

  const overBombCeiling = gateVerdict(holdout({ win: 200, bombExploded: 300 * DEFAULT_GATES.maxBombRate + 1, outOfMoves: 84 }));
  assert.equal(overBombCeiling.pass, false);
});

// The shortlist order is the whole recommendation. A batch's top entry is what
// a human is asked to spend an evening on, so the direction of this sort is
// load-bearing and silently reversible.
test('the shortlist puts the hardest level for the bot first', () => {
  const entry = (name, winRate, pass = true) => ({ shape: { name }, verdict: { pass, winRate } });
  const ranked = rankShortlist([
    entry('easy', 1.0),
    entry('hardest', 0.42),
    entry('middling', 0.9),
  ]);
  assert.deepEqual(ranked.map((e) => e.shape.name), ['hardest', 'middling', 'easy']);
});

test('the shortlist drops anything that failed a gate, however hard it was', () => {
  const entry = (name, winRate, pass) => ({ shape: { name }, verdict: { pass, winRate } });
  const ranked = rankShortlist([
    entry('passed', 0.8, true),
    entry('failed-but-hardest', 0.21, false),
  ]);
  assert.deepEqual(ranked.map((e) => e.shape.name), ['passed'], 'a gate failure is not a ranking penalty, it is an exclusion');
});
