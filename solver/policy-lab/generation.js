'use strict';

// Inspect historical human positions only. No fresh experimental seed is used.
const fs = require('node:fs');
const path = require('node:path');
const { analyzeMove, DEFAULT_PARAMS } = require('../bot');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../engine');
const { candidateIndex, replay } = require('../recording-replay');
const { resolveRecordedBoard } = require('../human-benchmark');
const ROOT = path.resolve(__dirname, '../..');
const key = chain => chain.map(t => `${t.x},${t.y}`).join('|');
const setKey = chain => chain.map(t => `${t.x},${t.y}`).sort().join('|');

function inspect() {
  const benchmark = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs/human-benchmark.json'), 'utf8'));
  const dirs = ['recordings', 'play-sessions'];
  for (const pilot of fs.readdirSync(path.join(ROOT, 'pilots'))) {
    const dir = `pilots/${pilot}/recordings`;
    if (fs.existsSync(path.join(ROOT, dir))) dirs.push(dir);
  }
  const index = candidateIndex();
  const moves = [], sessions = [], failures = [];
  let bombExcluded = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(path.join(ROOT, dir))) continue;
    for (const name of fs.readdirSync(path.join(ROOT, dir)).filter(n => n.endsWith('.json')).sort()) {
      const file = `${dir}/${name}`;
      const recording = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
      const resolved = resolveRecordedBoard(recording, index);
      if (!resolved) { failures.push({ file, problem: 'board unresolved' }); continue; }
      const checked = replay(resolved.candidate, recording);
      if (checked.problems.length) { failures.push({ file, problems: checked.problems }); continue; }
      const paired = benchmark.rows.find(r => r.file === name.slice(0, 8) && r.level === recording.candidateLevel && r.seed === recording.seed);
      if (!paired) throw new Error(`benchmark lacks ${file}`);
      const ownerFaster = paired.human.outcome === 'win' && paired.bot.outcome === 'win' && paired.human.moves < paired.bot.moves;
      const rng = makeRng(recording.seed);
      const state = createLevelState(resolved.candidate, rng);
      sessions.push({ file, level: recording.candidateLevel, seed: recording.seed, ownerFaster, replay: 'PASS' });
      for (let moveIndex = 0; moveIndex < recording.chains.length; moveIndex++) {
        const claimed = recording.chains[moveIndex];
        const human = claimed.tiles.map(t => state.grid[t.y][t.x]);
        const analysis = analyzeMove(state, { params: DEFAULT_PARAMS,
          lookaheadRngFactory: () => makeRng(987654321 + moveIndex) });
        if (analysis.reason === 'bomb-priority') bombExcluded++;
        else {
          const ranked = [...analysis.candidates].sort((a, b) => b.policyScore - a.policyScore);
          const humanKey = key(human);
          const humanRank = ranked.findIndex(c => c.id === humanKey) + 1;
          const selected = analysis.candidates.find(c => c.id === analysis.selectedId);
          let category = 'not in the pool';
          if (humanKey === analysis.selectedId) category = "owner's chain is the bot's choice";
          else if (humanRank) category = humanRank < 4 ? `in pool at rank ${humanRank}` : 'in pool at rank 4+';
          else if (ranked.some(c => setKey(c.chain) === setKey(human))) category = 'same tiles in another order';
          else if (ranked.some(c => c.id.startsWith(humanKey + '|') || humanKey.startsWith(c.id + '|'))) category = 'a prefix';
          const poolBestPoints = ranked.length ? Math.max(...ranked.map(c => c.immediatePoints)) : 0;
          const botChoicePoints = selected ? selected.immediatePoints : 0;
          const ownerPoints = claimed.points;
          moves.push({ file, level: recording.candidateLevel, move: moveIndex + 1, category, humanRank,
            ownerPoints, poolBestPoints, botChoicePoints, ownerFaster,
            diagnostic: ownerFaster && ownerPoints > botChoicePoints,
            board: state.grid.map(row => row.map(t => t ? { value: t.value, blocker: t.blocker || null } : null)),
            humanChain: claimed.tiles });
        }
        executeChain(state, human); applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
      }
    }
  }
  function summary(rows) {
    const categories = {};
    for (const r of rows) categories[r.category] = (categories[r.category] || 0) + 1;
    return { n: rows.length, categories, ownerMoreThanPoolBest: rows.filter(r => r.ownerPoints > r.poolBestPoints).length,
      ownerMoreThanBotChoice: rows.filter(r => r.ownerPoints > r.botChoicePoints).length,
      points: rows.map(({ file, level, move, ownerPoints, poolBestPoints, botChoicePoints }) => ({ file, level, move, ownerPoints, poolBestPoints, botChoicePoints })) };
  }
  const diagnostic = moves.filter(r => r.diagnostic);
  const subset = summary(diagnostic);
  const branch = subset.n < 30 ? 'INCONCLUSIVE_SUBSET_SMALL' : subset.ownerMoreThanPoolBest * 2 >= subset.n ? 'GENERATION' : 'RANKING_FIRST';
  return { sessions, failures, bombExcluded, overall: summary(moves), late: summary(moves.filter(r => r.level >= 56 && r.level <= 58)),
    diagnostic: subset, N_MIN: 30, branch, moves };
}
if (require.main === module) {
  const result = inspect();
  fs.writeFileSync(path.join(__dirname, 'runs/generation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('GENERATION CHECK: historical recorded positions, no fresh games');
  console.log('sessions', result.sessions.length, 'failed replays', result.failures.length, 'bomb-priority moves excluded', result.bombExcluded);
  for (const tag of ['overall', 'late', 'diagnostic']) console.log(tag, JSON.stringify(result[tag]));
  if (result.diagnostic.n < result.N_MIN) console.log(`diagnosis inconclusive: subset too small (n = ${result.diagnostic.n})`);
  else if (result.branch === 'GENERATION') console.log('candidate coverage is a bottleneck on this evidence');
  else console.log('coverage is not the bottleneck on this evidence');
  console.log('branch', result.branch, result.branch === 'GENERATION' ? 'generation proposals only' : 'ranking terms and lookahead first; restrict nothing');
  for (const fail of result.failures) console.log('UNVERIFIED', JSON.stringify(fail));
  if (result.failures.length) process.exitCode = 1;
}
module.exports = { inspect };
