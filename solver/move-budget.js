// The spawn experiment showed that raising spawned value 50% lifts score only
// ~7%, so input value is not the binding constraint -- re-chaining the value
// already on the board is. Move count is the direct lever on that: each extra
// move is another chance to re-chain. This prices it.
const ROOT = require('path').join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs } = require(`${ROOT}/solver/engine`);
const { chooseMove } = require(`${ROOT}/solver/bot`);
const LOOKAHEAD_BASE = 987654321;
const SEEDS = 200;

function median(level) {
  const scores = [];
  for (let seed = 0; seed < SEEDS; seed++) {
    const rng = makeRng(seed);
    const state = createLevelState(level, rng);
    for (let i = 0; i < level.moves + 5; i++) {
      const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) });
      if (!chain) break;
      executeChain(state, chain); applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
      if (checkBombs(state)) break;
      if (state.moves >= state.maxMoves) break;
    }
    scores.push(state.score);
  }
  scores.sort((a, b) => a - b);
  return scores[Math.floor(scores.length / 2)];
}

console.log('lvl  target  shippedMv  ' + [1, 1.5, 2, 3].map((m) => `x${m}`.padStart(9)).join(''));
for (const num of [26, 40, 50]) {
  const shipped = LEVELS.find((l) => l.level === num);
  const cells = [1, 1.5, 2, 3].map((mult) => {
    const moves = Math.round(shipped.moves * mult);
    return String(median({ ...shipped, target: Infinity, moves })).padStart(9);
  });
  console.log(`${String(num).padStart(3)}  ${String(shipped.target).padStart(6)}  ${String(shipped.moves).padStart(9)}  ${cells.join('')}`);
}
