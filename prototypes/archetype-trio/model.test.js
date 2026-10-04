const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('./model');
const witnesses = require('./witnesses.json');

for (const [id, chains] of Object.entries(witnesses)) {
  test(`${id}: authored winning route replays and cannot continue after winning`, () => {
    const actions = chains.map(chain => ({type:'move', chain, swapped:false}));
    const result = game.replay(id, actions);
    assert.equal(result.outcome, 'won');
    assert.equal(result.moves, chains.length);
    assert.deepEqual(game.replay(id, actions), result);
    assert.throws(() => game.move(result, chains[0]), /finished/);
    const undone = game.replay(id, [...actions, {type:'undo'}]);
    assert.equal(undone.outcome, 'playing');
    assert.equal(undone.moves, chains.length - 1);
  });
}

test('closed passages and parcels cannot be selected', () => {
  assert.equal(game.valid(game.create('gates'), [[2,1],[3,1],[4,1]]), false);
  assert.equal(game.valid(game.create('delivery'), [[2,1]], false), false);
  assert.throws(() => game.create('__proto__'), /Unknown level/);
});

test('a switch endpoint exchanges passages without deleting a tile', () => {
  const before = game.create('gates');
  const beforeJSON = JSON.stringify(before);
  const next = game.move(before, [[0,2],[0,3],[1,2]]);
  assert.equal(next.gate, 'upper');
  assert.equal(game.blocked(next, 3,1), false);
  assert.equal(game.blocked(next, 3,4), true);
  assert.equal(next.grid[4][3].value, before.grid[4][3].value);
  assert.equal(JSON.stringify(before), beforeJSON, 'preview cannot mutate live state');
});

test('crossing a switch without ending there does not toggle it', () => {
  const state=game.create('gates');
  const next=game.move(state,[[0,2],[0,3],[1,2],[2,2]]);
  assert.equal(next.gate, 'lower');
});

test('ending outside the delivery shaft drops cargo farther', () => {
  const state=game.create('delivery');
  const inside=game.move(state,[[1,2],[2,2],[2,3]]);
  const outside=game.move(state,[[2,3],[2,2],[1,2]]);
  const cargoY=s=>s.grid.flat().find(t=>t?.cargo)?.y ?? s.gridHeight;
  assert.ok(cargoY(outside)>cargoY(inside));
});

test('packet allocation changes exact refill, retains unused entries, and replays', () => {
  const state=game.create('feeders');
  const chain=[[1,0],[1,1],[2,1]];
  const normal=game.move(state,chain,false);
  const swapped=game.move(state,chain,true);
  assert.notDeepEqual(normal.grid,swapped.grid);
  assert.deepEqual(normal.packetCursors,[2,0]);
  assert.deepEqual(swapped.packetCursors,[0,2]);
  const smallBuild=[[0,1],[1,1],[1,0],[2,0]];
  const largeBuild=[[1,0],[1,1],[2,1],[2,2],[2,3],[3,3]];
  assert.equal(game.valid(normal,smallBuild),true);
  assert.equal(game.valid(swapped,smallBuild),false);
  assert.equal(game.valid(normal,largeBuild),false);
  assert.equal(game.valid(swapped,largeBuild),true);
  assert.deepEqual(game.replay('feeders',[{type:'move',chain,swapped:true}]),swapped);
});

test('illegal jumps, repeats and bad value transitions are rejected', () => {
  const state=game.create('gates');
  for(const chain of [[[0,0],[6,5],[1,0]],[[0,0],[1,0],[0,0]],[[0,0],[1,1],[2,1]]]) {
    assert.throws(()=>game.move(state,chain),/chain/i);
  }
});

test('undo restores packet cursors and full board deterministically', () => {
  const actions=[{type:'move',chain:[[1,0],[1,1],[2,1]],swapped:true},{type:'undo'}];
  assert.deepEqual(game.replay('feeders',actions),game.create('feeders'));
});
