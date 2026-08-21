// How much of the board's best move does the chain walk actually find?
//
// `buildGreedyChain` takes ONE path from each start tile and never backtracks,
// so it can wall itself off from tiles it could still have used. This scores
// that loss against ground truth: every legal chain on the board, enumerated
// with `enumerateLegalChains` (the verified enumerator behind RESULT-0003).
//
// The comparison is against the best chain the bot would ACCEPT, not the
// highest-scoring chain that exists. `findGreedyChains` deliberately trades
// points for a chain whose sum stays on the mergeable lattice (FACT-0006), so
// judging it against the raw maximum would score a design choice as a defect.
//
//   node solver/chain-coverage.js
//   node solver/chain-coverage.js --levels 11,26,51 --seeds 5
//
// Boards too large to enumerate report `n/a` and are excluded from the means;
// a 5x7 opening can hold over 8 million distinct chains.
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, findGreedyChains, chainValue, chainMultiplier,
} = require('./engine');
const { enumerateLegalChains } = require('./exact-score');
const { LEVELS } = require(`${ROOT}/src/game`);

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };

const LEVEL_NUMBERS = String(flag('levels', '11,20,26,35,40,51')).split(',').map(Number);
const SEED_COUNT = Number(flag('seeds', 3));

const points = (chain) => Math.floor(chainValue(chain) * chainMultiplier(chain.length));

// FACT-0006: only a sum equal to the tile scale times a power of two can ever
// be matched again. Same test as engine.js's isMergeableSum.
function isMergeableSum(sum, scale) {
  if (sum <= 0 || sum % scale !== 0) return false;
  const n = sum / scale;
  return (n & (n - 1)) === 0;
}

function bestGreedy(state, tieBreak) {
  const chains = findGreedyChains(state, { tieBreak });
  return chains.reduce((best, c) => (c.points > best ? c.points : best), 0);
}

// The best chain on the board that lands on a mergeable sum. Returns null when
// the board holds more chains than a Set can index.
function bestAvailable(state) {
  const scale = state.tileScale || 1;
  try {
    let best = 0;
    for (const chain of enumerateLegalChains(state)) {
      if (!isMergeableSum(chainValue(chain), scale)) continue;
      const p = points(chain);
      if (p > best) best = p;
    }
    return best || null;
  } catch (e) {
    return null; // board too large to enumerate; no ground truth here
  }
}

const shares = { none: [], degree: [] };
console.log('lvl seed |  shipped   tieBreak      truth |  shipped  tieBreak   (share of the best available)');
console.log('--------   -------   --------   --------    -------  --------');
for (const level of LEVEL_NUMBERS) {
  const levelData = LEVELS.find((l) => l.level === level);
  if (!levelData) continue;
  for (let seed = 1; seed <= SEED_COUNT; seed++) {
    const state = createLevelState(levelData, makeRng(seed));
    const plain = bestGreedy(state, 'none');
    const degree = bestGreedy(state, 'degree');
    const truth = bestAvailable(state);
    if (truth) { shares.none.push(plain / truth); shares.degree.push(degree / truth); }
    const s = (x) => (truth ? (x / truth).toFixed(2).padStart(7) : '   n/a ');
    console.log(
      `${String(level).padStart(3)} ${String(seed).padStart(4)} | ${String(plain).padStart(8)}`
      + `   ${String(degree).padStart(8)}   ${String(truth ?? 'n/a').padStart(8)}`
      + ` | ${s(plain)}  ${s(degree)}`,
    );
  }
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
console.log(`\nMean share of the best available chain, over ${shares.none.length} boards with ground truth:`);
console.log(`  shipped walk            ${mean(shares.none).toFixed(3)}`);
console.log(`  + degree tie-break      ${mean(shares.degree).toFixed(3)}`);
