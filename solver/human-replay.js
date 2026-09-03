// What did the human actually do, move by move, against the exact best move?
//
// The recordings in `recordings/` are the only primary record of human play in
// this project. Each stores every chain the player selected, tile by tile. This
// replays them against `solver/engine.js`, and at every position enumerates all
// legal chains with `enumerateLegalChains` (the verified enumerator behind
// RESULT-0003) to establish what the best available move was.
//
// Replay fidelity is a gate, not a formality: a recording that does not
// reproduce its own recorded score and per-move points is dropped, because
// every number downstream would be measured against the wrong board.
//
//   node solver/human-replay.js                 # report only
//   node solver/human-replay.js --out <path>    # also write the per-move table
//
// Cost note: a full 5x7 opening holds over 8 million distinct actions and takes
// ~17s to enumerate. A whole run is roughly half an hour.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs, chainValue, chainMultiplier, cloneState,
} = require('./engine');
const { enumerateLegalChains } = require('./exact-score');
const { chooseMove } = require('./bot');
const { identity } = require('./level-author');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const OUT = flag('out', null);
// Re-analyse a saved table instead of re-enumerating. The enumeration is the
// expensive half and its output is fixed, so grouping questions can be re-asked
// in a second rather than half an hour.
const FROM = flag('from', null);

// The lookahead draw for the bot arm. Fixed so the comparison is reproducible;
// it is ONE draw of the bot's lookahead, not its median over draws.
const LOOKAHEAD_BASE = 777000;

const points = (chain) => Math.floor(chainValue(chain) * chainMultiplier(chain.length));
const isMergeable = (sum, scale) => {
  if (sum <= 0 || sum % scale !== 0) return false;
  const n = sum / scale;
  return (n & (n - 1)) === 0;
};

// Recordings name their level by candidate identity, so the config is resolved
// by hashing every candidate the repo still carries. A recording whose config
// has since been deleted cannot be replayed and is reported as such.
function loadConfigs() {
  const configs = {};
  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(p); continue; }
      if (!entry.name.endsWith('.json')) continue;
      let data; try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
      const list = data.candidates || (Array.isArray(data) ? data : null);
      if (!list) continue;
      for (const c of (Array.isArray(list) ? list : Object.values(list))) {
        if (!c || typeof c !== 'object' || !c.gridW) continue;
        let id; try { id = identity(c); } catch { continue; }
        if (!configs[id]) configs[id] = c;
      }
    }
  }(path.join(ROOT, 'solver')));
  return configs;
}

// Replays one recording. `capture` is called with the state BEFORE each move.
// Returns ok:false the moment the replay diverges from what was recorded.
function replay(rec, level, capture) {
  const rng = makeRng(rec.seed);
  const state = createLevelState(level, rng);
  state.maxMoves = level.moves;
  for (let i = 0; i < rec.chains.length; i++) {
    const recorded = rec.chains[i];
    const chain = [];
    for (const t of recorded.tiles) {
      const tile = state.grid[t.y] && state.grid[t.y][t.x];
      if (!tile) return { ok: false, why: `move ${i}: no tile at ${t.x},${t.y}` };
      if (tile.value !== t.value) {
        return { ok: false, why: `move ${i}: ${t.x},${t.y} is ${tile.value}, recorded ${t.value}` };
      }
      chain.push(tile);
    }
    if (capture) capture(i, state, chain);
    const got = executeChain(state, chain);
    if (got !== recorded.points) {
      return { ok: false, why: `move ${i}: scored ${got}, recorded ${recorded.points}` };
    }
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) break;
  }
  return { ok: true, score: state.score, moves: state.moves };
}

function main() {
  if (FROM) {
    const saved = JSON.parse(fs.readFileSync(FROM, 'utf8'));
    report(saved.rows, saved.dropped || []);
    return;
  }
  const configs = loadConfigs();
  const dir = path.join(ROOT, 'recordings');
  const rows = [];
  const dropped = [];

  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const game = f.slice(0, 8);
    const level = configs[rec.candidateIdentity];
    if (!level) { dropped.push(`${game}: candidate config ${String(rec.candidateIdentity).slice(0, 12)} no longer in repo`); continue; }
    const scale = level.tileScale || 1;
    const pending = [];

    const result = replay(rec, level, (i, state, humanChain) => {
      let best = 0; let bestLen = 0; let count = 0; let threw = false;
      try {
        for (const c of enumerateLegalChains(state)) {
          count++;
          const p = points(c);
          if (p > best) { best = p; bestLen = c.length; }
        }
      } catch { threw = true; }
      let botPts = null; let botLen = null; let botMergeable = null;
      try {
        const bc = chooseMove(cloneState(state), {
          lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i),
        });
        if (bc) { botPts = points(bc); botLen = bc.length; botMergeable = isMergeable(chainValue(bc), scale); }
      } catch { /* leave null */ }
      pending.push({
        game, level: rec.candidateLevel, seed: rec.seed, outcome: rec.outcome,
        move: i, movesTotal: rec.chains.length,
        humanPts: points(humanChain), humanLen: humanChain.length,
        humanSum: chainValue(humanChain),
        humanMergeable: isMergeable(chainValue(humanChain), scale),
        botPts, botLen, botMergeable,
        best: threw ? null : best, bestLen: threw ? null : bestLen,
        actions: threw ? null : count,
      });
      process.stderr.write(`${game} move ${String(i).padStart(2)}: human ${points(humanChain)} bot ${botPts} best ${threw ? 'n/a' : best}\n`);
    });

    if (!result.ok) { dropped.push(`${game}: replay diverged — ${result.why}`); continue; }
    if (result.score !== rec.score) { dropped.push(`${game}: final score ${result.score} != recorded ${rec.score}`); continue; }
    rows.push(...pending);
  }

  report(rows, dropped);
  if (OUT) {
    fs.writeFileSync(OUT, JSON.stringify({ schemaVersion: 1, lookaheadBase: LOOKAHEAD_BASE, dropped, rows }, null, 1));
    console.log(`\nwrote ${rows.length} moves to ${OUT}`);
  }
}

function report(rows, dropped) {
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  const third = (r) => (r.move / r.movesTotal < 1 / 3 ? 'early' : r.move / r.movesTotal < 2 / 3 ? 'mid' : 'late');
  const usable = rows.filter((r) => r.best > 0 && r.botPts !== null);
  const games = [...new Set(rows.map((r) => r.game))];

  console.log(`\nHuman play against the exact best available move`);
  console.log(`${rows.length} replayed moves across ${games.length} games.`);
  if (dropped.length) { console.log('\ndropped:'); for (const d of dropped) console.log(`  ${d}`); }

  console.log('\nshare of the best available chain taken, by position in the game');
  console.log('           human     bot     n');
  for (const t of ['early', 'mid', 'late']) {
    const g = usable.filter((r) => third(r) === t);
    console.log(`  ${t.padEnd(6)}   ${mean(g.map((r) => r.humanPts / r.best)).toFixed(3)}   ${mean(g.map((r) => r.botPts / r.best)).toFixed(3)}   ${String(g.length).padStart(3)}`);
  }
  console.log(`  ${'all'.padEnd(6)}   ${mean(usable.map((r) => r.humanPts / r.best)).toFixed(3)}   ${mean(usable.map((r) => r.botPts / r.best)).toFixed(3)}   ${usable.length}`);

  console.log('\nshare of moves landing on a power-of-two sum');
  console.log('           human     bot');
  for (const t of ['early', 'mid', 'late']) {
    const g = usable.filter((r) => third(r) === t);
    console.log(`  ${t.padEnd(6)}    ${(100 * g.filter((r) => r.humanMergeable).length / g.length).toFixed(0).padStart(3)}%    ${(100 * g.filter((r) => r.botMergeable).length / g.length).toFixed(0).padStart(3)}%`);
  }

  // Setup moves come in RUNS -- up to six consecutive -- so "the move after a
  // setup move" is the wrong bucket: on this data 19 of 41 such moves are
  // themselves setup moves, which drags the payoff average down and makes the
  // strategy look like it produces shorter chains. The payoff is the first
  // ordinary move that ENDS a run, and the honest comparison is against
  // ordinary moves that no run preceded.
  const isSetup = (r) => r.humanPts / r.best < 0.25;
  const setup = []; const payoff = []; const baseline = [];
  for (const game of [...new Set(rows.map((r) => r.game))]) {
    let run = 0;
    for (const r of rows.filter((x) => x.game === game).sort((a, b) => a.move - b.move)) {
      if (isSetup(r)) { setup.push(r); run += 1; continue; }
      if (run > 0) payoff.push({ ...r, runLength: run }); else baseline.push(r);
      run = 0;
    }
  }
  const line = (name, a) => console.log(
    `  ${name.padEnd(24)} n=${String(a.length).padStart(3)}   length ${mean(a.map((r) => r.humanLen)).toFixed(1).padStart(5)}`
    + `   sum ${Math.round(mean(a.map((r) => r.humanSum))).toLocaleString().padStart(7)}`
    + `   points ${Math.round(mean(a.map((r) => r.humanPts))).toLocaleString().padStart(7)}`,
  );
  console.log(`\nbuild-then-harvest (a setup move takes under 25% of what was available)`);
  line('setup moves', setup);
  line('payoff (ends a run)', payoff);
  line('ordinary (no run before)', baseline);
  console.log(`  setup moves landing on a power-of-two sum: ${setup.filter((r) => r.humanMergeable).length}/${setup.length}`);
  console.log(`  payoff vs ordinary: length ${(mean(payoff.map((r) => r.humanLen)) - mean(baseline.map((r) => r.humanLen))).toFixed(1)} tiles,`
    + ` sum x${(mean(payoff.map((r) => r.humanSum)) / mean(baseline.map((r) => r.humanSum))).toFixed(2)},`
    + ` points x${(mean(payoff.map((r) => r.humanPts)) / mean(baseline.map((r) => r.humanPts))).toFixed(2)}`);
  // Reported with n because the tail is single observations: any "the longer
  // the build the bigger the harvest" reading rests on them, and one of them
  // moves against it.
  console.log('  payoff sum by how long the build ran (n matters here):');
  for (const k of [...new Set(payoff.map((r) => r.runLength))].sort((a, b) => a - b)) {
    const g = payoff.filter((r) => r.runLength === k);
    console.log(`    ${k} setup move${k > 1 ? 's' : ''}  n=${g.length}   sum ${Math.round(mean(g.map((r) => r.humanSum))).toLocaleString()}   points ${Math.round(mean(g.map((r) => r.humanPts))).toLocaleString()}`);
  }

  // The definition above conditions on the enumerated best move, which is large
  // exactly when a big chain is nearby -- so it partly selects for the harvest
  // it then measures. These two never reference the optimum at all: a chain
  // below nine tiles has forgone the maximum multiplier by construction. If the
  // ratio collapses here, the pattern was the detector's and not the player's.
  console.log('\n  same grouping under definitions that never see the best move:');
  for (const [label, test] of [
    ['under 25% of best (above)', (r) => r.humanPts / r.best < 0.25],
    ['chain under 9 tiles', (r) => r.humanLen < 9],
    ['chain under 7 tiles', (r) => r.humanLen < 7],
  ]) {
    const S = []; const P = []; const B = [];
    for (const game of [...new Set(rows.map((r) => r.game))]) {
      let run = 0;
      for (const r of rows.filter((x) => x.game === game).sort((a, b) => a.move - b.move)) {
        if (test(r)) { S.push(r); run += 1; continue; }
        if (run > 0) P.push(r); else B.push(r);
        run = 0;
      }
    }
    console.log(`    ${label.padEnd(26)} payoff sum x${(mean(P.map((r) => r.humanSum)) / mean(B.map((r) => r.humanSum))).toFixed(2)}`
      + `   length diff ${(mean(P.map((r) => r.humanLen)) - mean(B.map((r) => r.humanLen))).toFixed(1)}   (n=${P.length})`);
  }

}

main();
