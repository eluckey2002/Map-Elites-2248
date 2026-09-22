#!/usr/bin/env node
// Nemesis: every shipped board you have played, with the shipped bot's
// race-to-target result on the identical seed, so you know the number to beat
// before the first move (BL-0014).
//
//   node tools/nemesis.js          # table
//   node tools/nemesis.js --json
const fs = require('node:fs');
const path = require('node:path');

const { playBot, resolveRecordedBoard } = require('../solver/human-benchmark');
const { candidateIndex, replay } = require('../solver/recording-replay');
const { LEVELS } = require('../src/game.js');

const ROOT = path.join(__dirname, '..');
const BOARD_FIELDS = ['gridW', 'gridH', 'blockers', 'minChain', 'moves', 'target', 'tileScale'];

function defaultSources() {
  const dirs = [path.join(ROOT, 'play-sessions'), path.join(ROOT, 'recordings')];
  const pilots = path.join(ROOT, 'pilots');
  if (fs.existsSync(pilots)) {
    for (const pilot of fs.readdirSync(pilots)) dirs.push(path.join(pilots, pilot, 'recordings'));
  }
  return dirs;
}

function shippedLevel(level) {
  return LEVELS.find((entry) => entry.level === level) || null;
}

// A recording made on a candidate board counts only if that board is exactly
// the shipped one; otherwise `?level=N&seed=S` would serve a different game.
function sameBoard(candidate, shipped) {
  return BOARD_FIELDS.every((field) => JSON.stringify(candidate[field]) === JSON.stringify(shipped[field]));
}

function playable(level, seed) {
  const shipped = shippedLevel(level);
  return Boolean(shipped) && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;
}

function botResult(level, seed, cache) {
  const key = `${level}:${seed}`;
  if (!cache.has(key)) cache.set(key, playBot(shippedLevel(level), seed));
  return cache.get(key);
}

function humanAttempts(sources) {
  const index = candidateIndex();
  const attempts = [];
  for (const dir of sources) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith('.json')).sort()) {
      let recording;
      try { recording = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } catch { continue; }
      const resolved = resolveRecordedBoard(recording, index);
      if (!resolved || !playable(recording.candidateLevel, recording.seed)) continue;
      if (!sameBoard(resolved.candidate, shippedLevel(recording.candidateLevel))) continue;
      if (replay(resolved.candidate, recording).problems.length) continue;
      attempts.push({
        level: recording.candidateLevel,
        seed: recording.seed,
        outcome: recording.outcome,
        moves: recording.movesUsed,
        score: recording.score,
        capturedAt: recording.capturedAt || null,
      });
    }
  }
  return attempts;
}

// Race to the target: fewer moves wins, equal is a tie, and only a win counts.
function verdict(you, bot) {
  if (you.outcome !== 'win') return 'loss';
  if (bot.outcome !== 'win' || you.moves < bot.moves) return 'beat';
  return you.moves === bot.moves ? 'tie' : 'loss';
}

function board(level, seed, attempts, cache) {
  const bot = botResult(level, seed, cache);
  const mine = attempts.filter((a) => a.level === level && a.seed === seed);
  const wins = mine.filter((a) => a.outcome === 'win');
  const best = wins.length ? wins.reduce((a, b) => (b.moves < a.moves ? b : a)) : null;
  const latest = mine.filter((a) => a.capturedAt).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).pop()
    || mine[mine.length - 1] || null;
  return {
    level,
    seed,
    target: shippedLevel(level).target,
    moveBudget: shippedLevel(level).moves,
    bot,
    attempts: mine.length,
    best,
    latest: latest && { ...latest, verdict: verdict(latest, bot) },
    status: best ? verdict(best, bot) : 'open',
  };
}

const ORDER = { open: 0, loss: 0, tie: 1, beat: 2 };

function listChallenges({ sources = defaultSources(), cache = new Map() } = {}) {
  const attempts = humanAttempts(sources);
  const keys = [...new Set(attempts.map((a) => `${a.level}:${a.seed}`))];
  return keys
    .map((key) => { const [level, seed] = key.split(':').map(Number); return board(level, seed, attempts, cache); })
    .map((entry) => ({ ...entry, status: entry.status === 'loss' ? 'open' : entry.status }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.level - b.level || a.seed - b.seed);
}

function oneChallenge(level, seed, { sources = defaultSources(), cache = new Map() } = {}) {
  if (!playable(level, seed)) return null;
  const entry = board(level, seed, humanAttempts(sources), cache);
  return { ...entry, status: entry.status === 'loss' ? 'open' : entry.status };
}

function main() {
  const challenges = listChallenges();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(challenges, null, 2)}\n`);
    return;
  }
  console.log('status  lvl  seed         bot         your best   tries');
  for (const c of challenges) {
    const bot = c.bot.outcome === 'win' ? `${c.bot.moves} moves` : 'lost';
    const best = c.best ? `${c.best.moves} moves` : '-';
    console.log(`${c.status.padEnd(7)} ${String(c.level).padStart(3)}  ${String(c.seed).padEnd(12)} ${bot.padEnd(11)} ${best.padEnd(11)} ${c.attempts}`);
  }
}

if (require.main === module) main();

module.exports = { listChallenges, oneChallenge, sameBoard, verdict };
