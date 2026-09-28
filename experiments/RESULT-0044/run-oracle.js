// One oracle attempt per board, pinned implementation 5205535, 30 s budget.
// Inputs: shipped level rules, seed, budget. No human data is passed.
const fs = require('node:fs');
const path = require('node:path');
const PIN = 'C:/OOO/wt-oracle-5205535';
const EXP = 'C:/OOO/wt-0044';
const { LEVELS } = require(`${PIN}/src/game`);
const { runPuzzle } = require(`${PIN}/solver/oracle/cli`);
const { verifyWitness } = require(`${PIN}/solver/oracle/verify`);
const { replayRecording } = require(`${PIN}/solver/benchmark-replay`);
const ruleLevel = (n) => { const s = LEVELS.find(l => l.level === n); return Object.fromEntries(['gridW','gridH','moves','minChain','target','tileScale','blockers'].map(k => [k, k === 'tileScale' ? s[k] || 1 : structuredClone(s[k])])); };
const boards = JSON.parse(fs.readFileSync(`${EXP}/experiments/RESULT-0044/fresh-boards.json`, 'utf8')).boards;
const captures = { 'board-1': 'play-sessions/b1a0c4c76835db2a0745aa54875ab8b3c1f75d2adc05c15546bd5b038f7fa8c2.json', 'board-2': 'play-sessions/a84100a4db7ab04b4740cc4fb2b04f99f8387e0595251ca83ecd6e80631c97ce.json' };
(async () => {
  const out = `${EXP}/experiments/RESULT-0044/oracle-run.json`;
  if (fs.existsSync(out)) throw new Error('refusing to repeat the oracle attempt');
  const rows = [];
  for (const b of boards) {
    const level = ruleLevel(b.level);
    const rec = JSON.parse(fs.readFileSync(`${EXP}/${captures[b.id]}`, 'utf8'));
    const human = replayRecording(level, rec, { expectedSeed: b.seed });
    const startedAt = new Date().toISOString();
    const result = await runPuzzle({ level, seed: b.seed }, 30000);
    let witness = 'none';
    if (result.best) { const r = verifyWitness({ level, seed: b.seed }, result.best); witness = `${r.validity} ${r.outcome}`; }
    rows.push({ boardId: b.id, level: b.level, seed: b.seed, startedAt,
      human: { captureFile: captures[b.id], replay: human.validity, outcome: human.outcome, moves: human.moves ?? rec.movesUsed, score: rec.score },
      oracle: { searchMs: result.searchMs, standing: result.standing, bestOutcome: result.best?.outcome ?? null, bestMoves: result.best?.movesUsed ?? null, bestScore: result.best?.score ?? null, baselineOutcome: result.baseline?.outcome ?? null, baselineMoves: result.baseline?.movesUsed ?? null, witness }, raw: result });
    console.log(b.id, JSON.stringify(rows.at(-1).human), JSON.stringify(rows.at(-1).oracle));
  }
  fs.writeFileSync(out, JSON.stringify({ result: 'RESULT-0044', implementationCommit: '5205535', budgetMs: 30000, attemptsPerBoard: 1, runtime: { node: process.version, platform: process.platform }, rows }, null, 2) + '\n', { flag: 'wx' });
})().catch(e => { console.error(e); process.exit(1); });
