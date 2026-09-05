// Read-only exact-corpus diagnostic. Prints JSON; writes no repository state.
// Run from this checkout: node .orch/runs/2026-09-05-policy-grounding/inspect.cjs
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { candidateIndex, readRecordings, replay } = require(path.join(root, 'solver/recording-replay'));
const { playBot } = require(path.join(root, 'solver/human-benchmark'));
const { createLevelState, makeRng } = require(path.join(root, 'solver/engine'));
const { LEVELS } = require(path.join(root, 'src/game'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const entries = [];
const index = candidateIndex();
const pilots = new Map();
const dirs = ['recordings'];
for (const name of fs.readdirSync(path.join(root, 'pilots')).sort()) {
  const dir = `pilots/${name}`;
  if (!fs.existsSync(path.join(root, dir, 'recordings'))) continue;
  dirs.push(`${dir}/recordings`);
  if (!fs.existsSync(path.join(root, dir, 'candidate.json'))) continue;
  const store = read(`${dir}/candidate.json`);
  const receipt = read(`${dir}/execution-receipt.json`);
  for (const candidate of store.candidates || [store]) {
    pilots.set(receipt.candidateIdentity, { candidate, source: `${dir}/candidate.json` });
  }
}
for (const dir of dirs) {
  for (const entry of readRecordings(path.join(root, dir))) {
    const found = index.get(entry.recording.candidateIdentity) || pilots.get(entry.recording.candidateIdentity);
    if (!found) throw new Error(`Unresolved ${dir}/${entry.file}`);
    entries.push({ ...entry, ...found, file: `${dir}/${entry.file}`, corpus: 'benchmark' });
  }
}
for (const entry of readRecordings(path.join(root, 'play-sessions'))) {
  const candidate = LEVELS.find(level => level.level === entry.recording.candidateLevel);
  if (!candidate) throw new Error(`Unresolved ordinary play ${entry.file}`);
  entries.push({ ...entry, candidate, source: 'src/game.js current LEVELS',
    file: `play-sessions/${entry.file}`, corpus: 'ordinary-play' });
}
const cache = new Map();
function bot(candidate, seed, uncapped, moves = candidate.moves) {
  const key = JSON.stringify([candidate, seed, uncapped, moves]);
  if (!cache.has(key)) cache.set(key, playBot({ ...candidate, moves }, seed, { uncapped }));
  return cache.get(key);
}
const rows = entries.map(({ file, corpus, source, candidate, recording }) => {
  const r = recording;
  const checked = replay(candidate, r);
  let cumulative = 0;
  let firstWinMove = null;
  r.chains.forEach((chain, i) => {
    cumulative += chain.points;
    if (firstWinMove === null && cumulative >= candidate.target) firstWinMove = i + 1;
  });
  const game = { gridW: candidate.gridW, gridH: candidate.gridH,
    tileScale: candidate.tileScale, minChain: candidate.minChain,
    moves: candidate.moves, target: candidate.target, blockers: candidate.blockers };
  const asShipped = bot(candidate, r.seed, false);
  const fullBudget = bot(candidate, r.seed, true);
  const matchedMoves = bot(candidate, r.seed, true, r.movesUsed);
  const pct = score => 100 * (score / r.score - 1);
  return {
    file, corpus, source, fileSha256: hash(fs.readFileSync(path.join(root, file))),
    candidateIdentity: r.candidateIdentity, candidateSha256: hash(JSON.stringify(candidate)),
    subjectKey: `${r.candidateIdentity || hash(JSON.stringify(game))}:${r.seed}`,
    gameKey: hash(JSON.stringify([game, r.seed])),
    startingGridSha256: hash(JSON.stringify(createLevelState(candidate, makeRng(r.seed)).grid)),
    level: candidate.level, seed: r.seed, dimensions: [candidate.gridW, candidate.gridH],
    target: candidate.target, budget: candidate.moves,
    human: { score: r.score, moves: r.movesUsed, outcome: r.outcome,
      firstWinMove, movesAfterFirstWin: firstWinMove === null ? null : r.movesUsed - firstWinMove,
      sumOfChainPoints: cumulative, replayProblems: checked.problems },
    botTarget: asShipped, botFullBudget: fullBudget, botMatchedMoves: matchedMoves,
    fullBudgetPct: pct(fullBudget.score), matchedMovesPct: pct(matchedMoves.score),
    targetStopPct: pct(asShipped.score),
  };
});
function summarize(selected) {
  const groups = new Map();
  for (const row of selected) {
    if (!groups.has(row.subjectKey)) groups.set(row.subjectKey, []);
    groups.get(row.subjectKey).push(row);
  }
  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  const bothWon = selected.filter(r => r.human.firstWinMove !== null && r.botTarget.outcome === 'win');
  return {
    recordings: selected.length, candidateSeedSubjects: groups.size,
    distinctGameConfigurationsAndSeeds: new Set(selected.map(r => r.gameKey)).size,
    distinctStartingGrids: new Set(selected.map(r => r.startingGridSha256)).size,
    duplicateGroups: [...groups.values()].filter(group => group.length > 1)
      .map(group => group.map(r => r.file)),
    replayProblems: selected.flatMap(r => r.human.replayProblems.map(problem => ({ file: r.file, problem }))),
    humanStopsOnFirstTargetCrossing: selected.filter(r => r.human.movesAfterFirstWin === 0).length,
    humanUsesLessThanFullBudget: selected.filter(r => r.human.moves < r.budget).length,
    humanWins: selected.filter(r => r.human.outcome === 'win').length,
    botWins: selected.filter(r => r.botTarget.outcome === 'win').length,
    scoring: Object.fromEntries(['fullBudgetPct', 'matchedMovesPct', 'targetStopPct'].map(field => [field, {
      botHigher: selected.filter(r => r[field] > 0).length,
      humanHigher: selected.filter(r => r[field] < 0).length,
      ties: selected.filter(r => r[field] === 0).length,
      meanPerRecordingPct: mean(selected.map(r => r[field])),
      meanWithEqualSubjectWeightPct: mean([...groups.values()].map(group => mean(group.map(r => r[field])))),
    }])),
    firstTargetCrossingBothWon: { pairs: bothWon.length,
      botFaster: bothWon.filter(r => r.botTarget.moves < r.human.firstWinMove).length,
      humanFaster: bothWon.filter(r => r.botTarget.moves > r.human.firstWinMove).length,
      ties: bothWon.filter(r => r.botTarget.moves === r.human.firstWinMove).length,
      meanHumanMinusBotMoves: mean(bothWon.map(r => r.human.firstWinMove - r.botTarget.moves)) },
  };
}
const sources = ['src/game.js', 'solver/engine.js', 'solver/bot.js',
  'solver/human-benchmark.js', 'solver/recording-replay.js'];
console.log(JSON.stringify({ kind: 'exact-recording-diagnostic',
  sourceSha256: Object.fromEntries(sources.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])),
  methodology: 'Existing live playBot with original target; with target Infinity/full budget; with target Infinity/human recorded move count. Human replay through existing replay(). No fitting, policy edits, or population claim.',
  summary: { benchmark: summarize(rows.filter(r => r.corpus === 'benchmark')),
    ordinaryPlay: summarize(rows.filter(r => r.corpus === 'ordinary-play')) }, rows }, null, 2));
