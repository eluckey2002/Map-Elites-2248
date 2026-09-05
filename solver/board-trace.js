#!/usr/bin/env node
// Renders a recorded game as text boards, move by move, with the human's chain
// and the bot's chosen chain drawn on the same starting position.
//
// Chain shape strings ("2-2-4-8") hide the thing this game is actually about:
// where the tiles are. Two chains with identical values can be completely
// different moves. This prints the board so a divergence can be looked at
// rather than inferred.
//
//   node solver/board-trace.js                          # the pilot game
//   node solver/board-trace.js --moves 14,15,20         # only those moves
//   node solver/board-trace.js --recording <file.json>  # any recording
const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers,
} = require('./engine');
const { chooseMove } = require('./bot');
const { candidateIndex } = require('./recording-replay');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 || i === process.argv.length - 1 ? fallback : process.argv[i + 1];
}

// A cell is 5 wide: the scaled tile value, or a marker showing chain order.
// Blockers print as their own glyph so geometry reads at a glance.
function renderBoard(state, chain, scale) {
  const order = new Map();
  (chain || []).forEach((tile, i) => order.set(`${tile.x},${tile.y}`, i + 1));
  const lines = [];
  for (let y = 0; y < state.gridHeight; y++) {
    let row = '';
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      const pos = `${x},${y}`;
      if (!tile) { row += '  .  '; continue; }
      if (tile.blocker === 'stone') { row += ' ### '; continue; }
      const value = tile.value / scale;
      const label = tile.blocker === 'bomb' ? `b${tile.bombTimer}` : tile.blocker === 'ice' ? `i${tile.blockerDuration}` : String(value);
      if (order.has(pos)) row += `[${String(order.get(pos)).padStart(2)}]`.padStart(5);
      else row += label.padStart(4) + ' ';
    }
    lines.push(row);
  }
  return lines;
}

function sideBySide(left, right, leftTitle, rightTitle, width) {
  const out = [`  ${leftTitle.padEnd(width)}    ${rightTitle}`];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    out.push(`  ${(left[i] || '').padEnd(width)}    ${right[i] || ''}`);
  }
  return out.join('\n');
}

function main() {
  const recordingArg = arg('recording');
  let recording;
  let candidate;
  if (recordingArg) {
    recording = JSON.parse(fs.readFileSync(recordingArg, 'utf8'));
    const indexed = candidateIndex().get(recording.candidateIdentity);
    candidate = indexed && indexed.candidate;
  } else {
    const dir = path.join(ROOT, 'pilots', 'HUMAN-PILOT-0002');
    candidate = JSON.parse(fs.readFileSync(path.join(dir, 'candidate.json'), 'utf8')).candidates[0];
    const file = fs.readdirSync(path.join(dir, 'recordings'))[0];
    recording = JSON.parse(fs.readFileSync(path.join(dir, 'recordings', file), 'utf8'));
  }
  if (!candidate) throw new Error('could not resolve the recording to a board');

  const only = arg('moves');
  const wanted = only ? new Set(only.split(',').map((n) => Number(n.trim()))) : null;
  const scale = candidate.tileScale;
  const width = candidate.gridW * 5;

  console.log(`level ${candidate.level}, seed ${recording.seed}, target ${candidate.target}, scale ${scale}`);
  console.log(`human: ${recording.score} in ${recording.movesUsed} moves (${recording.outcome})`);
  console.log('values shown divided by tile scale; ### stone, bN bomb timer, iN ice\n');

  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);

  recording.chains.forEach((chain, i) => {
    const move = i + 1;
    const opts = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) };
    const botChain = chooseMove(state, opts);
    const humanLive = chain.tiles.map((t) => state.grid[t.y][t.x]);

    if (!wanted || wanted.has(move)) {
      const humanSum = chain.tiles.reduce((s, t) => s + t.value, 0);
      const botSum = (botChain || []).reduce((s, t) => s + t.value, 0);
      const botPoints = botChain
        ? Math.floor(botSum * (botChain.length >= 9 ? 5 : botChain.length >= 7 ? 3 : botChain.length >= 5 ? 2 : botChain.length >= 3 ? 1.5 : 1))
        : 0;
      console.log(`── move ${move} ${'─'.repeat(60)}`);
      console.log(sideBySide(
        renderBoard(state, humanLive, scale),
        renderBoard(state, botChain, scale),
        `HUMAN  ${chain.tiles.length} tiles, sum ${humanSum / scale}, ${chain.points} pts`,
        `BOT    ${botChain ? botChain.length : 0} tiles, sum ${botSum / scale}, ${botPoints} pts`,
        width,
      ));
      console.log('');
    }

    executeChain(state, humanLive);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  });
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { renderBoard };
