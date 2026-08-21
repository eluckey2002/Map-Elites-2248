const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');
const { LEVELS } = require(`${ROOT}/src/game`);

// Same fixed rollout base sweep.js uses, so a recorded session picks the
// same moves a sweepLevel pass would for the same level/seed.
const LOOKAHEAD_BASE = 987654321;

function snapshotBoard(state) {
  return state.grid.map((row) => row.map((tile) => (tile ? {
    value: tile.value,
    blocker: tile.blocker,
    blockerDuration: tile.blockerDuration,
    bombTimer: tile.bombTimer,
  } : null)));
}

// Plays one level to completion like sweep.js's playLevel, but keeps the
// board before every move and the chain the bot picked, so the full session
// can be replayed/viewed afterward instead of just its win/loss outcome.
function recordSession(levelData, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const hardCap = levelData.moves + 5;
  const moves = [];
  let moveIndex = 0;
  let outcome = null;

  for (let i = 0; i < hardCap; i++) {
    const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + moveIndex);
    const boardBefore = snapshotBoard(state);
    const chain = chooseMove(state, { lookaheadRngFactory });
    moveIndex += 1;

    if (!chain) {
      outcome = { result: 'lose', reason: 'no valid moves', movesUsed: state.moves };
      break;
    }

    const chainSnapshot = chain.map((tile) => ({ x: tile.x, y: tile.y, value: tile.value }));
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);

    moves.push({
      index: moves.length,
      boardBefore,
      chain: chainSnapshot,
      points,
      scoreAfter: state.score,
    });

    if (checkBombs(state)) {
      outcome = { result: 'lose', reason: 'bomb exploded', movesUsed: state.moves };
      break;
    }
    if (state.score >= state.targetScore) {
      outcome = { result: 'win', movesUsed: state.moves };
      break;
    }
    if (state.moves >= state.maxMoves) {
      outcome = { result: 'lose', reason: 'out of moves', movesUsed: state.moves };
      break;
    }
  }

  if (!outcome) {
    outcome = { result: 'lose', reason: 'hard cap exceeded (engine bug?)', movesUsed: state.moves };
  }

  return {
    level: levelData.level,
    seed,
    gridW: levelData.gridW,
    gridH: levelData.gridH,
    minChain: levelData.minChain,
    maxMoves: levelData.moves,
    targetScore: levelData.target,
    tileScale: levelData.tileScale || 1,
    moves,
    finalBoard: snapshotBoard(state),
    outcome: { ...outcome, finalScore: state.score },
  };
}

function parseArgs(argv) {
  const args = { level: 26, seeds: [0, 1, 2], out: null };
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'level') args.level = Number(value);
    else if (key === 'seeds') args.seeds = value.split(',').map(Number);
    else if (key === 'out') args.out = value;
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const levelData = LEVELS.find((l) => l.level === args.level);
  if (!levelData) {
    console.error(`No such level: ${args.level}`);
    process.exit(1);
  }

  const sessions = args.seeds.map((seed) => recordSession(levelData, seed));

  const outPath = args.out || path.join(ROOT, 'solver', `.session-level${args.level}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ level: args.level, sessions }, null, 1));

  for (const session of sessions) {
    const { outcome } = session;
    const summary = outcome.result === 'win'
      ? `win in ${outcome.movesUsed} moves`
      : `lose (${outcome.reason}) after ${outcome.movesUsed} moves`;
    console.log(`seed ${session.seed}: ${summary}, score ${outcome.finalScore}/${session.targetScore}`);
  }
  console.log(`Wrote ${sessions.length} session(s) to ${outPath}`);
}

module.exports = { recordSession, snapshotBoard };
