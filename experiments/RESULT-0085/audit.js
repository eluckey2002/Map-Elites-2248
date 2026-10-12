#!/usr/bin/env node
// Post-run steps of RESULT-0085, run exactly as its protocol names them. Reads the archive; never changes it.
//   node experiments/RESULT-0085/audit.js deep     deep verify of the 2 largest-fitness entries (ties by cell key)
//   node experiments/RESULT-0085/audit.js uniform  P3 diagnostic: 200 uniform samples, seed 208501, same evaluate/config
//   node experiments/RESULT-0085/audit.js sources  bind the archive to the registered freeze (writes output/source-freeze.json)
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

// A recheck prints only. The retained receipts in output/ are rewritten solely with --write.
function save(name, value) {
  if (!process.argv.includes('--write')) return;
  fs.writeFileSync(path.join(__dirname, 'output', name), JSON.stringify(value, null, 1) + '\n');
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
  save('deep-verify.json', { chosen, results: out });
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
  save('uniform-sample.json', result);
  return 0;
}

// The gate reads `sources` (role -> sha256 prefix) and checks each against the protocol's version_freeze. The archive
// itself records only SHA-1 under `versions`, so this step confirms those SHA-1s still match the frozen files, then
// emits the sha256 prefixes the gate can read. It fails if any frozen file moved since the run.
function sources() {
  const crypto = require('node:crypto');
  const root = path.join(__dirname, '..', '..');
  const hex = (alg, rel) => crypto.createHash(alg).update(fs.readFileSync(path.join(root, rel))).digest('hex');
  const roles = {
    sharedSearch: 'prototypes/sampler/shared-search.js', model: 'prototypes/sampler/model.js',
    search: 'prototypes/sampler/search.js', engine: 'solver/engine.js',
  };
  const out = {};
  let ok = true;
  for (const [role, rel] of Object.entries(roles)) {
    const same = hex('sha1', rel) === archive.versions[role];
    if (!same) { ok = false; console.log(`FAIL ${role}: ${rel} no longer matches the archive's recorded SHA-1`); }
    out[role] = hex('sha256', rel).slice(0, 16);
  }
  const protocol = fs.readFileSync(path.join(__dirname, 'protocol.md'), 'utf8');
  for (const [role, h] of Object.entries(out)) {
    if (!protocol.includes(h)) { ok = false; console.log(`FAIL ${role}: ${h} is not in the protocol's version_freeze`); }
  }
  console.log(ok ? 'PASS archive SHA-1s match the frozen files' : 'FAIL');
  save('source-freeze.json', {
    note: 'Written by audit.js sources: sha256 prefixes of the files whose SHA-1s the archive recorded, each also named in protocol.md version_freeze.',
    sources: out,
  });
  return ok ? 0 : 1;
}

const mode = process.argv[2];
if (mode === 'deep') process.exitCode = deep();
else if (mode === 'sources') process.exitCode = sources();
else if (mode === 'uniform') process.exitCode = uniform();
else { console.error('usage: audit.js deep|uniform|sources [--write]'); process.exitCode = 2; }
