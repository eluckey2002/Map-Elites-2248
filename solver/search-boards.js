#!/usr/bin/env node
// Searches for a BOARD, given a shape.
//
// This is the thing fixing the seed buys. While the board was drawn at random,
// the only search space was six shape parameters, and measurement had to
// average over draws that shared nothing - the number of distinct opening moves
// ranged 124 to 1363 across seeds of one shape, against 536 vs 467 between two
// different shapes. Now the seed is part of the level, every board is a
// concrete artifact that can be measured on its own terms, and there are
// billions of them per shape.
//
// What it ranks on: SKILL SPREAD, the ratio of a good player's score to a poor
// one's on that exact board. Both are the same bot with different lookahead, so
// the ratio is not confounded by which board each faced - it isolates how much
// the outcome depends on play. A board where every line scores the same is a
// board with nothing to work out; a board where the spread is wide has
// something to find. That measurement was impossible while the board moved
// under the player, which is why the two earlier attempts at a fun-proxy (score
// curve shape, then bot win rate) both failed.
//
// It is still a proxy for difficulty, not for fun. Nothing here knows what is
// fun. But unlike its predecessors it measures the level rather than the
// player, and it can be checked against a human playthrough because the human
// and the bot now face the same board.

const fs = require('node:fs');
const path = require('node:path');

const { makeRng, createLevelState, findTopChains } = require('./engine');
const { DEFAULT_GATES, serialize } = require('./level-author');
const { deriveFixedCandidate, verifyFixedCandidate } = require('./fixed-board');

// Measured before any game is played: how much room the opening position has.
// Cheap, and the one board statistic that visibly tracked the difference
// between the two boards a human played (470 options / 14-tile longest chain on
// the board that felt tight, 1053 / 21 on the one that felt open).
function openingShape(candidate) {
  const state = createLevelState(candidate, makeRng(candidate.seed));
  const chains = findTopChains(state, { limit: 50000 });
  return {
    options: chains.length,
    longest: chains.reduce((best, entry) => Math.max(best, entry.chain.length), 0),
  };
}

function gateVerdict(receipt) {
  const counts = receipt.holdout.terminalCounts;
  const winRate = counts.win / counts.total;
  const bombRate = counts.bombExploded / counts.total;
  const failures = [];
  if (counts.noValidMoves !== 0) failures.push(`${counts.noValidMoves} lockouts`);
  if (bombRate > DEFAULT_GATES.maxBombRate) failures.push(`bomb rate ${(bombRate * 100).toFixed(1)}%`);
  if (winRate < DEFAULT_GATES.minWinRate) failures.push(`win rate ${(winRate * 100).toFixed(1)}%`);
  return { pass: failures.length === 0, winRate, failures, counts };
}

// p75 over p25 rather than max over min: the extremes are single runs and one
// freak line would dominate the ranking.
function skillSpread(fitting) {
  const q = fitting.scoreQuantiles;
  return q.p25 > 0 ? q.p75 / q.p25 : 0;
}

function searchBoards(shape, { seedStart = 0, seedCount = 100, onBoard = () => {} } = {}) {
  const boards = [];
  for (let offset = 0; offset < seedCount; offset++) {
    const seed = seedStart + offset;
    const named = { ...shape, name: `${shape.name}-s${seed}`, seed };
    let authored;
    try {
      authored = deriveFixedCandidate(named);
    } catch (error) {
      onBoard({ seed, error: error.message });
      continue;
    }
    const verdict = gateVerdict(authored.receipt);
    const entry = {
      seed,
      candidate: authored.store.candidates[0],
      receipt: authored.receipt,
      verdict,
      spread: skillSpread(authored.receipt.fitting),
      opening: openingShape(authored.store.candidates[0]),
    };
    boards.push(entry);
    onBoard(entry);
  }
  return boards;
}

function parseArgs(argv) {
  const args = { shape: null, seedStart: 0, seedCount: 100, top: 5, out: null };
  const paths = new Set(['shape', 'out']);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in args)) throw new Error(`unknown option ${argv[i]}`);
    args[key] = paths.has(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  if (!args.shape) throw new Error('usage: search-boards.js --shape <shape.json> [--seedCount N] [--top K] [--out file]');
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const shapeFile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.shape), 'utf8'));
  const { seed, ...shape } = shapeFile; // a searched shape must not pin its own board
  const started = Date.now();

  process.stdout.write(`Searching ${args.seedCount} boards from seed ${args.seedStart} for shape ${shape.name}\n`);
  process.stdout.write(`${shape.gridW}x${shape.gridH} moves=${shape.moves} chain=${shape.minChain} demand=${shape.demand}\n\n`);

  let scanned = 0;
  const boards = searchBoards(shape, {
    seedStart: args.seedStart,
    seedCount: args.seedCount,
    onBoard: () => {
      scanned += 1;
      if (scanned % 25 === 0) process.stdout.write(`  ...${scanned} boards\n`);
    },
  });

  const passing = boards.filter((b) => b.verdict.pass);
  process.stdout.write(`\n${passing.length} of ${boards.length} boards pass every gate\n`);

  const ranked = [...passing].sort((a, b) => b.spread - a.spread).slice(0, args.top);
  process.stdout.write(`\nTop ${ranked.length} by skill spread (how much better play pays off on that board):\n`);
  process.stdout.write('  spread  botwin  target   opening  longest  seed\n');
  for (const entry of ranked) {
    process.stdout.write(
      `  ${entry.spread.toFixed(2).padStart(6)}  ${(entry.verdict.winRate * 100).toFixed(0).padStart(5)}%  ` +
      `${String(entry.candidate.target).padStart(7)}  ${String(entry.opening.options).padStart(7)}  ` +
      `${String(entry.opening.longest).padStart(7)}  ${entry.seed}\n`,
    );
  }

  // Only the boards about to be offered to a human get the expensive re-check.
  process.stdout.write(`\nConfirming the top ${ranked.length} with the fixed-board verifier\n`);
  for (const entry of ranked) {
    try {
      verifyFixedCandidate({ schemaVersion: 1, candidates: [entry.candidate] }, entry.receipt);
      entry.confirmed = true;
    } catch (error) {
      entry.confirmed = false;
      process.stdout.write(`  DISAGREES seed ${entry.seed}: ${error.message}\n`);
    }
  }
  process.stdout.write(ranked.every((e) => e.confirmed) ? '  all confirmed\n' : '  some rejected - do not ship those\n');

  const spreads = passing.map((b) => b.spread).sort((a, b) => a - b);
  if (spreads.length > 0) {
    process.stdout.write(
      `\nSpread across passing boards: min ${spreads[0].toFixed(2)}, ` +
      `median ${spreads[Math.floor(spreads.length / 2)].toFixed(2)}, ` +
      `max ${spreads[spreads.length - 1].toFixed(2)}\n`,
    );
  }
  process.stdout.write(`Total ${((Date.now() - started) / 1000).toFixed(1)}s\n`);

  if (args.out) {
    fs.writeFileSync(path.resolve(process.cwd(), args.out), serialize({
      schemaVersion: 1,
      shape,
      search: { seedStart: args.seedStart, seedCount: args.seedCount },
      boards: boards.map((b) => ({
        seed: b.seed,
        spread: b.spread,
        opening: b.opening,
        verdict: { pass: b.verdict.pass, winRate: b.verdict.winRate, failures: b.verdict.failures },
        candidate: b.candidate,
        receipt: b.receipt,
      })),
    }));
    process.stdout.write(`Wrote ${args.out}\n`);
  }

  return { boards, ranked };
}

module.exports = { searchBoards, skillSpread, openingShape, main };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}
