const {
  makeRng, createLevelState, cloneState, executeChain, applyGravity,
  spawnNewTiles, tickBlockers, checkBombs,
} = require('../engine');

function boardSnapshot(state) {
  return state.grid.map(row => row.map(tile => tile ? [
    tile.value, tile.blocker, tile.blockerDuration, tile.bombTimer,
  ] : null));
}

function createPuzzle(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const draws = Array.from({ length: level.moves * (level.gridW * level.gridH - 1) }, rng);
  return { state, draws, cursor: 0, parent: null, action: null };
}

function transition(node, chain, draws) {
  const state = cloneState(node.state);
  const tiles = chain.map(({ x, y }) => state.grid[y][x]);
  const action = { tiles: tiles.map(({ x, y, value }) => ({ x, y, value })) };
  action.points = executeChain(state, tiles);
  applyGravity(state);
  let cursor = node.cursor;
  spawnNewTiles(state, () => {
    if (cursor >= draws.length) throw new Error('oracle spawn stream exhausted');
    return draws[cursor++];
  });
  tickBlockers(state);
  const terminal = checkBombs(state) ? 'lose'
    : state.score >= state.targetScore ? 'win'
      : state.moves >= state.maxMoves ? 'lose' : null;
  return { state, cursor, parent: node, action, terminal };
}

function stateKey(node) {
  return `${node.cursor}|${node.state.moves}|${JSON.stringify(boardSnapshot(node.state))}`;
}

function witness(node) {
  const chains = [];
  const trace = [];
  for (let current = node; current.parent; current = current.parent) {
    chains.push(current.action);
    trace.push({ board: boardSnapshot(current.state), score: current.state.score, cursor: current.cursor });
  }
  return { score: node.state.score, movesUsed: node.state.moves, chains: chains.reverse(), trace: trace.reverse() };
}

module.exports = { boardSnapshot, createPuzzle, transition, stateKey, witness };
