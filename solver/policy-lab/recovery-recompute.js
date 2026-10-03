'use strict';
// Independent arithmetic re-implementation by the same author. No producer,
// statistics, chooser, worker or play-loop module is imported. Plays no games.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const PLAN = 'docs/goals/policy-terms-loop/RECOVERY_PLAN.md';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
const average = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
function axis(values, levels, seeds) {
  if (values.length !== levels * seeds) throw new Error('incomplete independent grid');
  const observed = values.filter(x => x !== null);
  if (!observed.length) return {mean: null, se: null, seLevel: null, seSeed: null, ci95: [null, null], n: 0};
  const groups = [Array.from({length: levels}, (_, l) => values.slice(l * seeds, (l + 1) * seeds)),
    Array.from({length: seeds}, (_, s) => Array.from({length: levels}, (_, l) => values[l * seeds + s]))]
    .map(gs => gs.map(g => g.filter(x => x !== null)).filter(g => g.length).map(average));
  const error = xs => xs.length < 2 ? null : Math.sqrt(xs.reduce((s, x) => s + (x - average(xs)) ** 2, 0) / (xs.length - 1)) / Math.sqrt(xs.length);
  const seLevel = error(groups[0]), seSeed = error(groups[1]);
  const se = seLevel === null || seSeed === null ? null : Math.max(seLevel, seSeed);
  const mean = average(observed);
  return {mean, se, seLevel, seSeed, ci95: se === null ? [null, null] : [mean - 1.96 * se, mean + 1.96 * se], n: observed.length};
}
function summarize(cells, levels, seeds) {
  if (cells.length !== levels.length * seeds.length) throw new Error('wrong independent grid size');
  let winsGained = 0, winsLost = 0, bothWin = 0, bothLose = 0, candidateFaster = 0, championFaster = 0, sameSpeed = 0, referenceMoves = 0;
  const winDiffs = [], moveDiffs = [];
  cells.forEach((cell, i) => {
    if (cell.level !== levels[Math.floor(i / seeds.length)] || cell.seed !== seeds[i % seeds.length]) throw new Error('independent grid address mismatch');
    const a = cell.candidate, b = cell.champion;
    for (const o of [a, b]) if (!o || typeof o.win !== 'boolean' || !Number.isInteger(o.moveBudget) || o.moveBudget < 1
      || (o.win && (!Number.isInteger(o.movesToTarget) || o.movesToTarget < 1 || o.movesToTarget > o.moveBudget))
      || (!o.win && o.movesToTarget !== null)) throw new Error('malformed independent outcome');
    if (a.moveBudget !== b.moveBudget) throw new Error('independent budgets differ');
    const w = Number(a.win) - Number(b.win); winDiffs.push(w);
    winsGained += Number(w > 0); winsLost += Number(w < 0);
    if (a.win && b.win) {
      bothWin++; const saved = b.movesToTarget - a.movesToTarget; moveDiffs.push(saved); referenceMoves += b.movesToTarget;
      candidateFaster += Number(saved > 0); championFaster += Number(saved < 0); sameSpeed += Number(saved === 0);
    } else { moveDiffs.push(null); bothLose += Number(!a.win && !b.win); }
  });
  const w = axis(winDiffs, levels.length, seeds.length), m = axis(moveDiffs, levels.length, seeds.length);
  return {cells: cells.length, winsGained, winsLost, netWins: winsGained - winsLost, bothWin, bothLose,
    candidateFaster, championFaster, sameSpeed, winRateDifference: w.mean, winSe: w.se, winSeLevel: w.seLevel,
    winSeSeed: w.seSeed, winCi95: w.ci95, meanMovesSaved: m.mean, moveSe: m.se, moveSeLevel: m.seLevel,
    moveSeSeed: m.seSeed, moveCi95: m.ci95, mutualWins: m.n,
    relativeMovesPct: bothWin ? 100 * m.mean / (referenceMoves / bothWin) : null};
}
function compare(expected, actual, label = 'value') {
  if (typeof expected === 'number') {
    if (!Number.isFinite(actual) || Math.abs(expected - actual) > 1e-10 * Math.max(1, Math.abs(expected))) throw new Error(`${label}: ${expected} != ${actual}`);
  } else if (expected && typeof expected === 'object') {
    if (!actual || Object.keys(expected).sort().join() !== Object.keys(actual).sort().join()) throw new Error(`${label}: keys differ`);
    for (const key of Object.keys(expected)) compare(expected[key], actual[key], `${label}.${key}`);
  } else if (expected !== actual) throw new Error(`${label}: ${expected} != ${actual}`);
}
function main() {
  const input = process.argv[2] || 'solver/policy-lab/runs/recovery/controls-raw.json';
  const artifact = path.resolve(ROOT, input);
  if (!fs.existsSync(artifact)) { console.log('UNVERIFIED_NOT_RUN: recovery raw artifact absent'); return; }
  const raw = JSON.parse(fs.readFileSync(artifact));
  const git = args => execFileSync('git', args, {cwd: ROOT, encoding: 'utf8'});
  const first = git(['log', '--diff-filter=A', '--format=%H', '--', PLAN]).trim().split('\n').at(-1);
  if (raw.registration.recoveryPlanCommit !== first) throw new Error('independent registration identity differs');
  git(['merge-base', '--is-ancestor', first, 'HEAD']);
  const text = fs.readFileSync(path.join(ROOT, PLAN), 'utf8');
  if (git(['show', `${first}:${PLAN}`]) !== text) throw new Error('independent registration body drift');
  const config = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]);
  if(raw.result!==config.result)throw new Error('independent result identity differs');
  compare(config, raw.config, 'registered config');
  for (const [file, hash] of Object.entries({...config.harnessFreeze, ...config.carryForward.sourceHashes})) if (sha(file) !== hash) throw new Error(`independent source drift ${file}`);
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'solver/policy-lab/runs/controls-raw.json')));
  compare(old.counts, config.carryForward.counts, 'carried charges');
  compare(old.panels.filter(p=>p.block==='C3').map(p=>({block:p.block,arm:p.arm,games:p.games.length})),raw.excludedOriginalPanels,'excluded failed-run panels');
  compare(old.parity, raw.parity, 'carried parity'); compare(old.inert, raw.inert, 'carried inert');
  const seen = new Set();
  for (const p of raw.panels) {
    const key = `${p.block}/${p.arm}`;
    if (seen.has(key)) throw new Error(`duplicate panel ${key}`); seen.add(key);
    const b = config.blocks[p.block]; if (!b) throw new Error(`unknown block ${p.block}`);
    let addresses;
    if (p.arm.startsWith('parity-')) addresses = Array.from({length: 200}, (_, i) => ({level: i % 58 + 1, seed: config.blocks.G.start + Math.floor(i / 58)})).sort((a,b) => a.level-b.level || a.seed-b.seed);
    else addresses = config.levels.flatMap(level => Array.from({length: b.count}, (_, i) => ({level, seed: b.start + i})));
    compare(addresses, p.games.map(g => ({level: g.level, seed: g.seed})), `${key} addresses`);
    if (p.filesRead.some(f => /(^|\/)(recordings|play-sessions)\//.test(f))) throw new Error(`recording read ${key}`);
    if (p.arm.startsWith('parity-') && p.games.some(g => g.outcome.traceIdentity !== g.parityOutcome.traceIdentity)) throw new Error('independent parity mismatch');
    console.log('COVERAGE',key,'PASS',p.games.length,'declared cells');
  }
  for (const p of old.panels.filter(p => p.block !== 'C3')) compare(p, raw.panels.find(x => x.block === p.block && x.arm === p.arm), `carried panel ${p.block}/${p.arm}`);
  const expectedCounts = structuredClone(config.carryForward.counts);
  const dispatchKeys = new Set();
  for (const d of raw.dispatches) {
    const key = `${d.block}/${d.arm}`;
    if (dispatchKeys.has(key) || ['C1','C2'].includes(d.block) || d.budget !== 'controls' || d.games !== 580) throw new Error('invalid recovery dispatch accounting');
    dispatchKeys.add(key); expectedCounts[d.budget] += d.games;
  }
  compare(expectedCounts, raw.counts, 'charged accounting');
  for (const [budget, used] of Object.entries(raw.counts)) if (used > config.budgets[budget]) throw new Error(`budget exceeded ${budget}`);
  if (Object.values(raw.counts).reduce((a,b) => a+b,0) > config.maxGames) throw new Error('total budget exceeded');
  const derived = [];
  for (const row of raw.headlines.controls) {
    const champion = raw.panels.find(p => p.block === row.block && p.arm === 'champion');
    if (!champion) throw new Error('missing independent reference');
    const result = {block: row.block};
    for (const [key, arm] of [['zero','zero'],['mild','handicap10'],['strong','handicap5']]) {
      const candidate = raw.panels.find(p => p.block === row.block && p.arm === arm);
      if (!candidate) throw new Error('missing independent candidate');
      const cells = candidate.games.map((g,i) => ({level:g.level,seed:g.seed,candidate:g.outcome,champion:champion.games[i].outcome}));
      result[key] = summarize(cells, config.levels, champion.seeds);
      compare(result[key], row[key], `${row.block}/${key}`);
    }
    derived.push(result); console.log('INDEPENDENT_CONTROL', JSON.stringify(result));
    const loss=s=>({meanMovesLost:-s.meanMovesSaved,lostCi95:[-s.moveCi95[1],-s.moveCi95[0]],detected:s.moveCi95[1]<0});
    console.log('INDEPENDENT_HANDICAP_LOSS',JSON.stringify({block:result.block,every10:loss(result.mild),every5:loss(result.strong)}));
  }
  if (raw.status === 'CONTROLS_COMPLETE') {
    compare(Array.from({length:12},(_,i)=>`C${i+1}`), derived.map(r=>r.block), 'complete block order');
    if (raw.panels.filter(p=>/^C\d+$/.test(p.block)).length !== 48 || raw.dispatches.length !== 40) throw new Error('incomplete aggregate panel/dispatch count');
    const zeroAccepted=derived.filter(r=>r.zero.netWins>=0 && r.zero.meanMovesSaved>0 && r.zero.moveCi95[0]>0).length;
    const strongDetected=derived.filter(r=>r.strong.moveCi95[1]!==null && r.strong.moveCi95[1]<0).length;
    const mildDetected=derived.filter(r=>r.mild.moveCi95[1]!==null && r.mild.moveCi95[1]<0).length;
    const zeroMdes=derived.map(r=>({block:r.block,se:r.zero.moveSe,smallestDetectableGain80:2.8*r.zero.moveSe}));
    const zeroMde=Math.max(...zeroMdes.map(r=>r.smallestDetectableGain80));
    const bars={zeroAccepted,zeroCeiling:1,strongDetected,strongTotal:12,strongRequired:0.8,mildDetected,zeroMdes,
      historicalMde:config.historicalMde,zeroMde,reportedDetectableGain:Math.max(config.historicalMde,zeroMde)};
    compare(bars,raw.headlines.bars,'aggregate bars');
    compare(zeroAccepted>1 || strongDetected/12<0.8 ? 'C':'CONTROLS_PASSED',raw.headlines.path,'aggregate disposition');
    const journal=path.join(ROOT,'solver/policy-lab/runs/recovery/control-journal');
    const completed=fs.readdirSync(journal).filter(f=>f.endsWith('.completed.json'));
    if(completed.length!==40*58)throw new Error('incomplete completed-job journal');
    const jobKeys=new Set();
    for(const f of completed){
      const j=JSON.parse(fs.readFileSync(path.join(journal,f)));
      const d=raw.dispatches.find(d=>JSON.stringify(d.policy)===JSON.stringify(j.job.policy)&&JSON.stringify(d.seeds)===JSON.stringify(j.job.seeds));
      if(!d)throw new Error('journal job has no dispatch');
      const key=`${d.block}/${d.arm}/${j.job.levelData.level}`;
      if(jobKeys.has(key))throw new Error('duplicate completed journal job');jobKeys.add(key);
      const panel=raw.panels.find(p=>p.block===d.block&&p.arm===d.arm);
      compare(panel.games.filter(g=>g.level===j.job.levelData.level),j.result.games,'journal outcomes');
    }
    console.log('INDEPENDENT_AGGREGATE',JSON.stringify(bars),'PATH',raw.headlines.path);
    console.log('PASS complete journal jobs',completed.length);
  } else console.log('UNVERIFIED aggregate: retained complete controls',derived.length,'/12; status',raw.status);
  const ranges=Object.values(config.blocks).sort((a,b)=>a.start-b.start);
  for(let i=0;i<ranges.length;i++)if(ranges[i].start<60000000||ranges[i].start+ranges[i].count-1>69999999||(i&&ranges[i-1].start+ranges[i-1].count>ranges[i].start))throw new Error('registered ranges overlap or escape allocation');
  console.log('PASS registered source identities, exact panels, inherited parity/inert and disjoint registered blocks');
  for(const block of Object.keys(config.blocks))if(!raw.panels.some(p=>p.block===block))console.log(block,'not run');
  if(raw.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('recording path in measurement input manifest');
  console.log('FILES_READ',JSON.stringify(raw.filesRead));
  console.log('ACCOUNTING',JSON.stringify({charged:raw.counts,carried:config.carryForward.counts}));
  console.log('MATCH retained arithmetic; independent re-implementation by the same author, not independent verification');
}
if(require.main===module){try{main();}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={axis,summarize,compare};
