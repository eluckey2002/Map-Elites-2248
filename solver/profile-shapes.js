#!/usr/bin/env node
// Measures the *shape of a game* rather than whether it was won.
//
// Every gate in the authoring pipeline asks "is this level fair and winnable".
// None asks whether it is interesting. A human playthrough of gen-0010 on a
// blind seed supplied the missing definition: the score arrived late and
// arrived in a spike (23% of it in the first half of the game, 36% of it in a
// single chain on move 12), because the early moves were spent setting up
// rather than cashing in.
//
// Those two things are measurable from bot play, which already exists for
// every candidate, so this reads them back out:
//
//   backload - share of the score earned in the second half of the moves
//   spike    - the biggest single chain as a share of the score
//
// Both are read with no target set, so every run spends its whole move budget.
// A run that stopped at its target would have its curve cut off exactly where
// the interesting part happens, and candidates with different targets would
// not be comparable.
//
// This measures the board's own dynamics, not skill. The bot plans two moves
// ahead and cannot deliberately set up a late chain, so a high backload here
// means the *board* trends that way on its own - which is the precondition for
// a human being able to play it deliberately, not evidence that one did.

const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs } = require('./engine');
const { chooseMove } = require('./bot');

const LOOKAHEAD_BASE = 987654321;

// Same loop as level-author.js's playMeasured, but keeping the per-move score
// deltas instead of only the total.
function playRecorded(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState({ ...level, target: Infinity }, rng);
  const gains = [];
  const lengths = [];
  let previous = 0;

  for (let moveIndex = 0; moveIndex < level.moves + 5; moveIndex++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) return { gains, lengths, score: state.score, ended: 'noValidMoves' };
    lengths.push(chain.length);
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    gains.push(state.score - previous);
    previous = state.score;
    if (checkBombs(state)) return { gains, lengths, score: state.score, ended: 'bombExploded' };
    if (state.moves >= state.maxMoves) return { gains, lengths, score: state.score, ended: 'outOfMoves' };
  }
  return { gains, lengths, score: state.score, ended: 'hardCap' };
}

function curve(gains) {
  const total = gains.reduce((a, b) => a + b, 0);
  if (total <= 0 || gains.length === 0) return null;
  const half = Math.ceil(gains.length / 2);
  const late = gains.slice(half).reduce((a, b) => a + b, 0);
  return {
    backload: late / total,
    spike: Math.max(...gains) / total,
    moves: gains.length,
    total,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function profile(level, seedStart, seedCount) {
  const backloads = [];
  const spikes = [];
  const openings = [];
  const cells = level.gridW * level.gridH;
  for (let offset = 0; offset < seedCount; offset++) {
    const run = playRecorded(level, seedStart + offset);
    if (run.lengths.length > 0) openings.push(run.lengths[0]);
    const shape = curve(run.gains);
    if (!shape) continue;
    backloads.push(shape.backload);
    spikes.push(shape.spike);
  }
  const opening = median(openings);
  return {
    seeds: backloads.length,
    backload: median(backloads),
    spike: median(spikes),
    // How much of the board the very first chain can swallow. This is a
    // property of the board rather than of the player's plan: the human game
    // that felt like a real fight opened at 9 tiles, the one that felt easy
    // opened at 16. Reported as a share of the board too, since 9 tiles means
    // something different on 25 cells than on 56.
    opening,
    openingShare: opening / cells,
  };
}

module.exports = { playRecorded, curve, profile };

if (require.main === module) {
  const batch = require('./generated-batch-01.json');
  const seedStart = 200000; // disjoint from fitting (0-149) and holdout (100000-100299)
  const seedCount = Number(process.argv[2] || 40);

  const rows = batch.results
    .filter((r) => r.verdict.pass)
    .map((r) => {
      const at = Date.now();
      const shape = profile(r.candidate, seedStart, seedCount);
      return {
        name: r.shape.name,
        winRate: r.verdict.winRate,
        gridW: r.candidate.gridW,
        gridH: r.candidate.gridH,
        moves: r.candidate.moves,
        seconds: (Date.now() - at) / 1000,
        ...shape,
      };
    });

  rows.sort((a, b) => b.backload - a.backload);
  process.stdout.write(`Bot score curve over ${seedCount} seeds from ${seedStart}, no target (full move budget)\n\n`);
  process.stdout.write('  backload  spike   botwin  shape\n');
  for (const row of rows) {
    process.stdout.write(
      `  ${(row.backload * 100).toFixed(0).padStart(7)}%  ${(row.spike * 100).toFixed(0).padStart(4)}%  ${(row.winRate * 100).toFixed(0).padStart(5)}%  ` +
      `${row.name} ${row.gridW}x${row.gridH} moves=${row.moves}\n`,
    );
  }
}
