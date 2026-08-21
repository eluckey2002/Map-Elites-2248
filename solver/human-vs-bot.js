// The human margin over the reference bot, from recorded play.
//
// This exists because the claim "the owner beat 41 of 43 and 48 of 48 winning
// bot players on moves-to-target" has been carried in handoff prose since
// 2026-08-18 with no receipt behind it. It is the most decision-relevant
// number in the project -- every target is calibrated as a share of what the
// BOT can score, so if the bot is materially weaker than the player, every
// level is pitched for someone weaker than the person playing it.
//
// Method: for each replay-verified human recording, play the identical level
// definition on the identical seed with the current bot, and compare
// moves-to-target. Comparing on one board removes spawn luck entirely -- the
// same pairing trick policy-eval.js uses -- so a handful of recordings say
// something a thousand unpaired games could not.
//
//   node solver/human-vs-bot.js
//   node solver/human-vs-bot.js --recordings <dir> --candidates <dir>
//
// Note this UNDERSTATES the margin: the bot it runs against is the current one,
// which RESULT-0011 made about 5% stronger than the bot in play when these
// sessions were recorded.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');
const { LEVELS } = require(`${ROOT}/src/game`);

const argv = process.argv.slice(2);
const strFlag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };

const TRACER = path.join(ROOT, '.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo');
const RECORDINGS = strFlag('recordings', path.join(TRACER, 'recordings'));
const CANDIDATES = strFlag('candidates', path.join(TRACER, 'solver'));
const LOOKAHEAD_BASE = 987654321; // must match solver/sweep.js

// A recording names its level by identity, not by number: generated candidates
// reuse slot numbers across batches, so `candidateLevel: 52` names two
// unrelated levels. Identity is the only safe key.
function candidateIndex() {
  const byIdentity = new Map();
  const add = (identity, candidate) => {
    if (identity && candidate && !byIdentity.has(identity)) byIdentity.set(identity, candidate);
  };
  if (!fs.existsSync(CANDIDATES)) return byIdentity;
  for (const file of fs.readdirSync(CANDIDATES)) {
    if (!file.endsWith('.json')) continue;
    let blob;
    try { blob = JSON.parse(fs.readFileSync(path.join(CANDIDATES, file), 'utf8')); } catch { continue; }
    const receipts = [].concat(blob.receipts ?? (Array.isArray(blob) ? blob : []), blob.candidateIdentity ? [blob] : []);
    for (const r of receipts) add(r.candidateIdentity, r.candidate ?? r);
    // Stores hold the definitions; their sibling receipts hold the identities.
    for (const c of blob.candidates ?? []) add(c.candidateIdentity, c);
    for (const row of blob.shortlist ?? blob.boards ?? []) {
      add(row.receipt?.candidateIdentity, row.candidate);
    }
  }
  return byIdentity;
}

// Pairs a store with its receipt so a definition can be found by identity.
function pairStoresWithReceipts(index) {
  if (!fs.existsSync(CANDIDATES)) return;
  for (const file of fs.readdirSync(CANDIDATES)) {
    if (!file.endsWith('.receipt.json')) continue;
    const storeFile = file.replace('.receipt.json', '.json');
    const storePath = path.join(CANDIDATES, storeFile);
    if (!fs.existsSync(storePath)) continue;
    try {
      const receipt = JSON.parse(fs.readFileSync(path.join(CANDIDATES, file), 'utf8'));
      const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const rs = [].concat(Array.isArray(receipt) ? receipt : (receipt.receipts ?? [receipt]));
      const cs = store.candidates ?? [];
      rs.forEach((r, i) => {
        if (r.candidateIdentity && cs[i]) index.set(r.candidateIdentity, cs[i]);
      });
    } catch { /* skip malformed */ }
  }
}

function playBot(levelData, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  let moveIndex = 0;
  let movesToTarget = null;
  for (let i = 0; i < levelData.moves + 5; i++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    moveIndex += 1;
    if (!chain) break;
    executeChain(state, chain);
    applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
    if (checkBombs(state)) break;
    if (movesToTarget === null && state.score >= state.targetScore) movesToTarget = state.moves;
    if (state.moves >= state.maxMoves) break;
  }
  return { movesToTarget, score: state.score };
}

const index = candidateIndex();
pairStoresWithReceipts(index);

const rows = [];
const unresolved = [];
for (const file of fs.readdirSync(RECORDINGS).filter((n) => n.endsWith('.json'))) {
  const rec = JSON.parse(fs.readFileSync(path.join(RECORDINGS, file), 'utf8'));
  const levelData = index.get(rec.candidateIdentity)
    ?? LEVELS.find((l) => l.level === rec.candidateLevel && l.target === rec.targetScore);
  if (!levelData) { unresolved.push({ file, rec }); continue; }
  rows.push({ file, rec, bot: playBot(levelData, rec.seed), levelData });
}

console.log('Human sessions against the current bot, same level and same seed.\n');
console.log('recording   level                    seed | human           | bot             | margin');
console.log('---------   ----------------------   ---- | --------------- | --------------- | ------');
let humanFaster = 0; let compared = 0;
for (const { file, rec, bot, levelData } of rows) {
  const name = (levelData.name ?? `level ${levelData.level}`).slice(0, 22);
  const h = rec.outcome === 'win' ? `${String(rec.movesUsed).padStart(2)}mv ${String(rec.score).padStart(7)}` : `LOST ${String(rec.score).padStart(7)}`;
  const b = bot.movesToTarget !== null ? `${String(bot.movesToTarget).padStart(2)}mv ${String(bot.score).padStart(7)}` : `LOST ${String(bot.score).padStart(7)}`;
  let margin = '  --';
  if (rec.outcome === 'win') {
    compared += 1;
    if (bot.movesToTarget === null) { margin = 'human only'; humanFaster += 1; }
    else {
      const d = bot.movesToTarget - rec.movesUsed;
      if (d > 0) humanFaster += 1;
      margin = `${d > 0 ? '+' : ''}${d}mv`;
    }
  }
  console.log(`${file.slice(0, 8)}    ${name.padEnd(22)}   ${String(rec.seed).padStart(4)} | ${h} | ${b} | ${margin}`);
}
console.log(`\nOn ${compared} winning human sessions the human reached the target in fewer moves than the bot on ${humanFaster}.`);
for (const { file, rec } of unresolved) {
  console.log(`unresolved: ${file.slice(0, 8)} (identity ${rec.candidateIdentity.slice(0, 16)}) — its candidate store was never saved`);
}
