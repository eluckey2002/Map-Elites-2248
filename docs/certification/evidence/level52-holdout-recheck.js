const path = require('path');
// Level 52 300-seed holdout re-run, current bot and calib-1.
// Usage: node level52-holdout-recheck.js <checkout of main at fee0858 or later>
const ROOT = require('path').resolve(process.argv[2]);
const { LEVELS } = require(path.join(ROOT, 'src/game'));
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require(path.join(ROOT, 'solver/engine'));

const LOOKAHEAD_BASE = 987654321;
const level52 = LEVELS.find((l) => l.level === 52);

function run(chooseMove, seedStart, seedCount) {
  let wins = 0, lockouts = 0, bombs = 0, outOfMoves = 0, total = 0;
  for (let i = 0; i < seedCount; i++) {
    const seed = seedStart + i;
    const rng = makeRng(seed);
    const state = createLevelState(level52, rng);
    const hardCap = level52.moves + 5;
    let outcome = null;
    for (let m = 0; m < hardCap; m++) {
      const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + m) });
      if (!chain) { outcome = 'lockout'; break; }
      executeChain(state, chain);
      applyGravity(state);
      spawnNewTiles(state, rng);
      tickBlockers(state);
      if (checkBombs(state)) { outcome = 'bomb'; break; }
      if (state.score >= state.targetScore) { outcome = 'win'; break; }
      if (state.moves >= state.maxMoves) { outcome = 'outOfMoves'; break; }
    }
    if (!outcome) outcome = 'incomplete';
    total += 1;
    if (outcome === 'win') wins += 1;
    else if (outcome === 'lockout') lockouts += 1;
    else if (outcome === 'bomb') bombs += 1;
    else if (outcome === 'outOfMoves') outOfMoves += 1;
  }
  return { wins, lockouts, bombs, outOfMoves, total };
}

const { chooseMove: currentBot } = require(path.join(ROOT, 'solver/bot'));
const { chooseMove: calib1 } = require(path.join(ROOT, 'solver/calibrations/calib-1'));

const currentResult = run(currentBot, 100000, 300);
const calib1Result = run(calib1, 100000, 300);

console.log('current bot:', JSON.stringify(currentResult));
console.log('calib-1 frozen:', JSON.stringify(calib1Result));
console.log('recorded (RESULT-0012, commit 0a73bf5, inside bug window): wins 290/300, lockouts 0');
