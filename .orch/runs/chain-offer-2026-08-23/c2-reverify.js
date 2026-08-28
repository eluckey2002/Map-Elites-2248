// Re-verifies C2 (positive control) against the CURRENT bot -- specifically
// against CHAIN_PATH_WIDTH=8's beam search, which did not exist when the
// original C2 measurement in stop-record.md was taken. Does offering the
// untrimmed walk still add real candidates the beam doesn't already have?
//
// Mirrors solver/bot.js's collectCandidates() exactly (merge on the same key,
// same options), but calls solver/engine.js's findGreedyChains directly so
// nothing in bot.js needs to be touched or exported for this check.
//
// Same seed convention as the original C1/C2 (stop-record.md): 53 levels x 10
// seeds, 9,000,000-9,000,009 -- disjoint from every reportable seed set, and
// never used for pilot/confirmation.
const path = require('node:path');
const REPO = '/Users/eluckey/Developer/research and games/2248-challenge';
const { LEVELS } = require(path.join(REPO, 'src', 'game.js'));
const { DEFAULT_PARAMS } = require(path.join(REPO, 'solver', 'bot.js'));
const { makeRng, createLevelState, findGreedyChains } = require(path.join(REPO, 'solver', 'engine.js'));

const SEED_BASE = 9e6;
const SEED_COUNT = 10;
const { width, tieBreak, pathWidth } = DEFAULT_PARAMS;

function keyOf(c) {
  const last = c.chain[c.chain.length - 1];
  return `${last.x},${last.y},${c.chain.length},${c.points}`;
}

let boards = 0;
let gained = 0;
let newBestBeatsOld = 0;
let totalExtra = 0;
let openingMoveChanges = 0;

for (const level of LEVELS) {
  for (let s = 0; s < SEED_COUNT; s++) {
    const seed = SEED_BASE + s;
    const state = createLevelState(level, makeRng(seed));
    const trimmed = findGreedyChains(state, { limit: width, tieBreak, pathWidth });
    const untrimmed = findGreedyChains(state, { limit: width, tieBreak, pathWidth, preferMergeableSum: false });

    const seen = new Set(trimmed.map(keyOf));
    const merged = trimmed.slice();
    for (const c of untrimmed) {
      const k = keyOf(c);
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(c);
    }

    boards += 1;
    const extra = merged.length - trimmed.length;
    if (extra > 0) { gained += 1; totalExtra += extra; }

    const oldBest = trimmed.reduce((m, c) => Math.max(m, c.points), 0);
    const newBest = merged.reduce((m, c) => Math.max(m, c.points), 0);
    if (newBest > oldBest) newBestBeatsOld += 1;

    const oldTop = trimmed.reduce((best, c) => (c.points > best.points ? c : best), trimmed[0]);
    const newTop = merged.reduce((best, c) => (c.points > best.points ? c : best), merged[0]);
    if (keyOf(oldTop) !== keyOf(newTop)) openingMoveChanges += 1;
  }
}

console.log(`C2 re-verification against current bot (pathWidth=${pathWidth}, width=${width}, tieBreak=${tieBreak})`);
console.log(`boards sampled: ${boards} (53 levels x ${SEED_COUNT} seeds, ${SEED_BASE}-${SEED_BASE + SEED_COUNT - 1})`);
console.log(`boards gaining >=1 candidate: ${gained} (${(100 * gained / boards).toFixed(1)}%)  -- threshold was >=10%`);
console.log(`mean extra candidates where gained: ${(totalExtra / Math.max(1, gained)).toFixed(1)}`);
console.log(`boards where the new best beats the old best: ${newBestBeatsOld} (${(100 * newBestBeatsOld / boards).toFixed(1)}%)`);
console.log(`opening move (top-scoring candidate) actually changes: ${openingMoveChanges} (${(100 * openingMoveChanges / boards).toFixed(1)}%)`);
console.log(`\nC2: ${gained / boards >= 0.10 ? 'PASS' : 'FAIL'} (${(100 * gained / boards).toFixed(1)}% >= 10% threshold)`);
