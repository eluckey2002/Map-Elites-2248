const { test } = require('node:test');
const assert = require('node:assert/strict');

const { makeRng } = require('../../solver/engine');
const {
  SPAWN_ARMS,
  TEMPLATES,
  createOpening,
  familyRoot,
  measureState,
  simulateOpening,
  spawnMixed,
} = require('./subject');

test('family classifier keeps exact recognized lattices and sends 54/60 to neutral roots', () => {
  assert.deepEqual([6, 12, 24, 48].map(familyRoot), [3, 3, 3, 3]);
  assert.deepEqual([10, 20, 40, 80].map(familyRoot), [5, 5, 5, 5]);
  assert.equal(familyRoot(54), 27);
  assert.equal(familyRoot(60), 15);
});

test('island templates create the declared high-ratio disconnected openings', () => {
  const expected = {
    'horizontal-2': [35, 2],
    'horizontal-3': [30, 3],
    'horizontal-4': [25, 4],
    'vertical-2': [32, 2],
    'vertical-3': [24, 3],
  };
  for (const template of TEMPLATES) {
    const state = createOpening(43999999, 5, template);
    const measured = measureState(state, 5);
    assert.equal(measured.target, expected[template.id][0], template.id);
    assert.equal(measured.componentCount, expected[template.id][1], template.id);
  }
});

test('spawn arms traverse the same seam and p=0/p=1 produce only the intended family', () => {
  const template = TEMPLATES[0];
  const makeHoles = () => {
    const state = createOpening(43999999, 7, template);
    for (let x = 0; x < state.gridWidth; x++) state.grid[0][x] = null;
    return state;
  };
  const blue = makeHoles();
  const blueCounts = spawnMixed(blue, makeRng(123), 7, 0);
  assert.deepEqual(blueCounts, { familySpawned: 0, blueSpawned: 5 });
  assert.ok(blue.grid[0].every(({ value }) => familyRoot(value) === 2));

  const family = makeHoles();
  const familyCounts = spawnMixed(family, makeRng(123), 7, 1);
  assert.deepEqual(familyCounts, { familySpawned: 5, blueSpawned: 0 });
  assert.ok(family.grid[0].every(({ value }) => familyRoot(value) === 7));
});

test('simulation is deterministic and the arm manipulation reaches production refill', () => {
  const input = { seed: 43999999, targetFamily: 5, template: TEMPLATES[1] };
  const blueA = simulateOpening({ ...input, arm: SPAWN_ARMS[0] });
  const blueB = simulateOpening({ ...input, arm: SPAWN_ARMS[0] });
  const mixed = simulateOpening({ ...input, arm: SPAWN_ARMS[3] });
  assert.deepEqual(blueA, blueB);
  assert.equal(blueA.trace.reduce((sum, row) => sum + row.spawned.familySpawned, 0), 0);
  assert.ok(mixed.trace.reduce((sum, row) => sum + row.spawned.familySpawned, 0) > 0);
});
