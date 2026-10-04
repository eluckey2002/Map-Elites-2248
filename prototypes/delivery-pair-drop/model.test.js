const {test} = require('node:test');
const assert = require('node:assert/strict');
const original = require('../archetype-trio/model');
const game = require('./model');

const buildLow = [[0,2],[0,3],[1,3]];
const buildHigh = [[0,2],[0,3],[1,2]];
const clearShaft = [[0,3],[1,3],[2,4],[3,4]];
const witness = [buildLow, [[2,3],[2,2],[3,1]], clearShaft, [[2,5],[1,5],[0,5]]];

test('lower endpoint aligns a built 64 with the falling 64; upper endpoint misses the route', () => {
  const initial = game.create('delivery');
  assert.equal(initial.grid[1][0].value,64);
  const low = game.move(initial,buildLow), high = game.move(initial,buildHigh);
  assert.equal(low.grid[3][0].value,64);
  assert.equal(low.grid[3][1].value,64);
  assert.equal(high.grid[2][1].value,64);
  assert.equal(game.valid(low,clearShaft),true);
  assert.equal(game.valid(high,clearShaft),false);
  assert.equal(low.last.points,high.last.points,'Same immediate score, different usable route');
  assert.equal(initial.grid[1][0].value,64,'Preview leaves original state untouched');
});

test('four-move witness delivers the parcel and undo restores the unfinished board', () => {
  const actions = witness.map(chain => ({type:'move',chain,swapped:false}));
  const result = game.replay('delivery',actions);
  assert.equal(result.outcome,'won');
  assert.equal(result.delivered,1);
  assert.equal(result.moves,4);
  const undone = game.replay('delivery',[...actions,{type:'undo'}]);
  assert.equal(undone.delivered,0);
  assert.equal(undone.outcome,'playing');
  assert.equal(undone.grid[4][2].cargo,true);
  assert.deepEqual(game.replay('delivery',actions),result);
});

test('building a variant never changes the original Delivery board', () => {
  assert.equal(original.LEVELS.delivery.seed,208);
  assert.equal(original.create('delivery').grid[1][0].value,2);
  assert.equal(game.create('delivery').grid[1][0].value,64);
  const before = JSON.stringify(original.create('delivery'));
  game.move(game.create('delivery'),buildLow);
  assert.equal(JSON.stringify(original.create('delivery')),before);
});
