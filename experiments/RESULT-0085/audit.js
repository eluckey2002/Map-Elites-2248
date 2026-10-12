#!/usr/bin/env node
// Post-run steps of RESULT-0085, run exactly as its protocol names them. Reads the archive; never changes it.
//   node experiments/RESULT-0085/audit.js deep     deep verify of the 2 largest-fitness entries (ties by cell key)
//   node experiments/RESULT-0085/audit.js uniform  P3 diagnostic: 200 uniform samples, seed 208501, same evaluate/config
const fs = require('node:fs');
const path = require('node:path');
const S = require('../../prototypes/sampler/shared-search.js');

const ARCHIVE = path.join(__dirname, 'output', 'archive.json');
const archive = JSON.parse(fs.readFileSync(ARCHIVE, 'utf8'));

// copied verbatim from prototypes/sampler/shared-search.js (not exported); pick/int are its helpers lines 59-60
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
function randomTarget(rng,i){
  // round-robin over orders x spare, so the start set covers the X and Y axes; blobs and tightness vary the setup distance
  const orders=2+(i%2),spare=[0,1,2,3][Math.floor(i/2)%4],tight=[0,0.25,0.5,0.75][int(rng,0,3)],minBlobs=int(rng,3,6);
  return {orders,spare,tight,minBlobs,noFill:rng()<0.5};
}

function deep() {
  const keys = Object.keys(archive.cells).sort((a, b) => archive.cells[b].fitness - archive.cells[a].fitness || (a < b ? -1 : 1));
  const chosen = keys.slice(0, 2), out = {};
  for (const k of chosen) {
    const t0 = Date.now();
    const fails = S.verifyEntry(k, archive.cells[k], { deep: true });
    out[k] = { fitness: archive.cells[k].fitness, fails, seconds: (Date.now() - t0) / 1000 };
    console.log(`${k} fitness ${archive.cells[k].fitness}: ${fails.length ? 'FAIL ' + fails.join('; ') : 'PASS'} (${out[k].seconds.toFixed(1)}s)`);
  }
  fs.writeFileSync(path.join(__dirname, 'output', 'deep-verify.json'), JSON.stringify({ chosen, results: out }, null, 1) + '\n');
  return chosen.every(k => out[k].fails.length === 0) ? 0 : 1;
}

function uniform() {
  const rng = S.makeRng(208501), N = 200, rejected = {}, kept = [];
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const genome = S.sampleBoard(rng, randomTarget(rng, i));
    const r = S.evaluate(genome, S.DEFAULT_CFG);
    if (r.ok) kept.push({ i, cell: r.entry.cell, fitness: r.entry.fitness, best: r.entry.best });
    else rejected[r.reason] = (rejected[r.reason] || 0) + 1;
    if ((i + 1) % 20 === 0) console.log(`${i + 1}/${N} samples, ${kept.length} keepers, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  const st = archive.stats, loopKeepers = st.kept + st.replaced + (st.rejected['lost its cell'] || 0);
  const result = {
    seed: 208501, samples: N, keepers: kept.length, keeperRate: kept.length / N, rejected, keptBoards: kept,
    seconds: (Date.now() - t0) / 1000,
    loop: { evaluated: st.evaluated, keepers: loopKeepers, kept: st.kept, replaced: st.replaced, lostItsCell: st.rejected['lost its cell'] || 0, keeperRate: loopKeepers / st.evaluated },
  };
  console.log(JSON.stringify(result));
  fs.writeFileSync(path.join(__dirname, 'output', 'uniform-sample.json'), JSON.stringify(result, null, 1) + '\n');
  return 0;
}

const mode = process.argv[2];
if (mode === 'deep') process.exitCode = deep();
else if (mode === 'uniform') process.exitCode = uniform();
else { console.error('usage: audit.js deep|uniform'); process.exitCode = 2; }
