#!/usr/bin/env node
// Bot against the owner, on the owner's own boards.
//
// Every shipped level is won by the bot 70-100% of the time, so win rate on
// shipped content cannot tell a good policy from a great one. The recorded
// human sessions are the one benchmark in this repo that is not saturated:
// each one pins a real board, a real seed, and a score a person actually
// achieved on it. Replaying the bot against those exact seeds gives a paired
// comparison per board.
//
// This exists because of a measurement mistake worth not repeating. A single
// human session (140,544 on the HUMAN-PILOT-0002 board) was compared against
// the bot's MEDIAN over 150 unrelated seeds (105,664) and read as the human
// being 33% stronger. On the same seed the bot scores 136,832 -- a 2.6% gap,
// in the bot's favour on move count. Comparing one seed against a median over
// other seeds measures the seed, not the player.
//
//   node solver/human-benchmark.js                         # paired table
//   node solver/human-benchmark.js --json                  # machine-readable
//   node solver/human-benchmark.js --recording <file.json> # one capture
const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');
const { candidateIndex, replay } = require('./recording-replay');
const { LEVELS } = require('../src/game.js');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;

// Every recorded session in the repo, wherever it lives.
function recordingSources() {
  const dirs = [path.join(ROOT, 'recordings'), path.join(ROOT, 'play-sessions')];
  const pilotsDir = path.join(ROOT, 'pilots');
  if (fs.existsSync(pilotsDir)) {
    for (const pilot of fs.readdirSync(pilotsDir)) {
      const dir = path.join(pilotsDir, pilot, 'recordings');
      if (fs.existsSync(dir)) dirs.push(dir);
    }
  }
  return dirs;
}

function recordingEntries(recordingPath = null) {
  if (recordingPath) {
    const absolute = path.resolve(recordingPath);
    return [{ dir: path.dirname(absolute), name: path.basename(absolute) }];
  }
  return recordingSources().flatMap((dir) => (
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()
        .map((name) => ({ dir, name }))
      : []
  ));
}

// A pilot directory carries its own candidate; the shared corpus is indexed by
// candidate identity. Both are needed to resolve every recording to a board.
function pilotCandidates() {
  const byIdentity = new Map();
  const pilotsDir = path.join(ROOT, 'pilots');
  if (!fs.existsSync(pilotsDir)) return byIdentity;
  for (const pilot of fs.readdirSync(pilotsDir)) {
    const file = path.join(pilotsDir, pilot, 'candidate.json');
    if (!fs.existsSync(file)) continue;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const candidate of parsed.candidates || [parsed]) {
      const receipt = path.join(pilotsDir, pilot, 'execution-receipt.json');
      if (fs.existsSync(receipt)) {
        byIdentity.set(JSON.parse(fs.readFileSync(receipt, 'utf8')).candidateIdentity, candidate);
      }
    }
  }
  return byIdentity;
}

function resolveRecordedBoard(recording, index = candidateIndex(), pilots = pilotCandidates()) {
  const indexed = typeof recording.candidateIdentity === 'string'
    ? index.get(recording.candidateIdentity)
    : null;
  if (indexed) return { candidate: indexed.candidate, source: indexed.source };
  const pilot = typeof recording.candidateIdentity === 'string'
    ? pilots.get(recording.candidateIdentity)
    : null;
  if (pilot) return { candidate: pilot, source: 'pilot' };
  if (recording.candidateIdentity === null && Number.isInteger(recording.candidateLevel)) {
    const shipped = LEVELS.find((level) => level.level === recording.candidateLevel);
    if (shipped) return { candidate: shipped, source: 'shipped-level' };
  }
  return null;
}

// The two players do not share an objective, and comparing their scores
// without saying so measures the objective, not the skill. The shipped policy
// is target-aware immediate-finish: it stops the move it crosses the target.
// A human playing on past the target is not beating it, just answering a
// different question. `uncapped` removes the target so the bot spends its full
// move budget on score, which is the arm that compares like with like.
function playBot(candidate, seed, { uncapped = false } = {}) {
  const level = uncapped ? { ...candidate, target: Infinity } : candidate;
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  for (let moveIndex = 0; moveIndex < level.moves; moveIndex++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) return { score: state.score, moves: state.moves, outcome: 'lose', reason: 'no valid moves' };
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score, moves: state.moves, outcome: 'lose', reason: 'bomb exploded' };
    if (state.score >= state.targetScore) return { score: state.score, moves: state.moves, outcome: 'win' };
    if (state.moves >= state.maxMoves) return { score: state.score, moves: state.moves, outcome: 'lose', reason: 'out of moves' };
  }
  return { score: state.score, moves: state.moves, outcome: 'lose', reason: 'out of moves' };
}

function collect({ recordingPath = null } = {}) {
  const index = candidateIndex();
  const pilots = pilotCandidates();
  const rows = [];
  const unresolved = [];
  for (const { dir, name } of recordingEntries(recordingPath)) {
    if (!name.endsWith('.json')) continue;
    const recording = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    const resolved = resolveRecordedBoard(recording, index, pilots);
    if (!resolved) {
      unresolved.push({ file: name, level: recording.candidateLevel, identity: recording.candidateIdentity });
      continue;
    }
    const { candidate, source } = resolved;
    const replayResult = replay(candidate, recording);
    if (replayResult.problems.length) {
      unresolved.push({ file: name, level: recording.candidateLevel, identity: recording.candidateIdentity, problems: replayResult.problems });
      continue;
    }
    const bot = playBot(candidate, recording.seed);
    const scoring = playBot(candidate, recording.seed, { uncapped: true });
    rows.push({
      file: name.slice(0, 8),
      level: recording.candidateLevel,
      seed: recording.seed,
      source,
      target: candidate.target,
      human: { score: recording.score, moves: recording.movesUsed, outcome: recording.outcome },
      bot,
      scoring,
      scoreDelta: bot.score - recording.score,
      scorePct: ((bot.score - recording.score) / recording.score) * 100,
      scoringDelta: scoring.score - recording.score,
      scoringPct: ((scoring.score - recording.score) / recording.score) * 100,
    });
  }
  return { rows, unresolved };
}

function main() {
  const recordingIndex = process.argv.indexOf('--recording');
  const recordingPath = recordingIndex === -1 ? null : process.argv[recordingIndex + 1];
  if (recordingIndex !== -1 && !recordingPath) throw new Error('--recording requires a file path');
  const { rows, unresolved } = collect({ recordingPath });
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ rows, unresolved }, null, 2)}\n`);
    return unresolved.length ? 1 : 0;
  }

  console.log('board     lvl     seed      human            bot (stops at target)      bot (plays for score)');
  for (const r of rows) {
    const h = `${r.human.score} / ${r.human.moves}mv ${r.human.outcome === 'win' ? 'W' : 'L'}`;
    const b = `${r.bot.score} / ${r.bot.moves}mv ${r.bot.outcome === 'win' ? 'W' : 'L'}`;
    const s = `${r.scoring.score} (${(r.scoringPct >= 0 ? '+' : '') + r.scoringPct.toFixed(0)}%)`;
    console.log(
      `${r.file}  ${String(r.level).padStart(3)}  ${String(r.seed).padStart(7)}  `
      + `${h.padStart(18)}  ${b.padStart(18)} ${((r.scoreDelta >= 0 ? '+' : '') + r.scoreDelta).padStart(8)}  ${s.padStart(18)}`,
    );
  }

  const botWins = rows.filter((r) => r.bot.outcome === 'win').length;
  const humanWins = rows.filter((r) => r.human.outcome === 'win').length;
  const botAhead = rows.filter((r) => r.scoreDelta > 0).length;
  const meanPct = rows.reduce((s, r) => s + r.scorePct, 0) / (rows.length || 1);
  console.log(`\n${rows.length} paired boards`);
  console.log(`  outcome:  human won ${humanWins}, bot won ${botWins}`);
  console.log(`  score, same objective as the human (bot plays its full budget): bot ahead on `
    + `${rows.filter((r) => r.scoringDelta > 0).length}/${rows.length} boards, `
    + `mean ${(rows.reduce((s2, r) => s2 + r.scoringPct, 0) / (rows.length || 1)).toFixed(1)}%`);
  console.log(`  score, as shipped (bot stops at the target): bot ahead on ${botAhead}/${rows.length}, `
    + `mean ${meanPct.toFixed(1)}% -- this arm compares different objectives and is kept only to show that`);
  if (unresolved.length) {
    console.log(`\n${unresolved.length} recording(s) could not be resolved to a board:`);
    for (const u of unresolved) {
      const identity = typeof u.identity === 'string' ? u.identity.slice(0, 12) : 'shipped-level';
      const problems = u.problems && u.problems.length ? ` · ${u.problems.join('; ')}` : '';
      console.log(`  ${u.file.slice(0, 8)} level ${u.level} identity ${identity}${problems}`);
    }
  }
  return unresolved.length ? 1 : 0;
}

if (require.main === module) process.exit(main());

module.exports = { collect, playBot, resolveRecordedBoard };
