'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { LEVELS } = require('../../src/game');
const { summarizePairs } = require('../ruler/core');
const { accepted } = require('./decision');
const { createJournaledPool } = require('./journaled-pool');
const { assertRegistration } = require('./registration');
const { atomicJson, charge, assertPanel, paired, initialRaw, completionProblems } = require('./recovery-core');
const ROOT = path.resolve(__dirname, '../..');
const PLAN = 'docs/goals/policy-terms-loop/RECOVERY_PLAN.md';
const OUT = path.join(__dirname, 'runs/recovery');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');

function registeredConfiguration() {
  const commit = execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', PLAN], {cwd: ROOT, encoding: 'utf8'}).trim().split('\n').at(-1);
  const text = fs.readFileSync(path.join(ROOT, PLAN), 'utf8');
  if (assertRegistration(ROOT, commit, PLAN) !== text) throw new Error('recovery registration drift');
  const config = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]);
  for (const [file, expected] of Object.entries(config.harnessFreeze)) if (sha(file) !== expected) throw new Error(`frozen source drift: ${file}`);
  for (const [file, expected] of Object.entries(config.carryForward.sourceHashes)) if (sha(file) !== expected) throw new Error(`carried evidence drift: ${file}`);
  if (JSON.stringify(LEVELS.map(l => l.level)) !== JSON.stringify(config.levels)) throw new Error('level coverage drift');
  if (config.workers !== 4 || config.maxGames !== 120000 || config.maxProposalRounds !== 20) throw new Error('effort/concurrency drift');
  return { config, commit };
}

async function run() {
  const { config, commit } = registeredConfiguration();
  if (fs.existsSync(OUT)) throw new Error('burned recovery run: output directory already exists');
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'solver/policy-lab/runs/controls-raw.json')));
  const closure = JSON.parse(fs.readFileSync(path.join(ROOT, 'experiments/RESULT-0080/closure.json')));
  fs.mkdirSync(OUT);
  const raw = initialRaw(old, closure, config, { exploratory: true, recoveryPlanCommit: commit,
    originalPlanCommit: old.registration.explorationPlanCommit });
  raw.filesRead = [PLAN, ...Object.keys(config.harnessFreeze), ...Object.keys(config.carryForward.sourceHashes)].sort();
  const file = path.join(OUT, 'controls-raw.json');
  const checkpoint = () => atomicJson(file, raw);
  checkpoint();
  const pool = createJournaledPool(4, { directory: path.join(OUT, 'control-journal'), runId: config.runId });
  const progress = detail => execFileSync('python', ['.blackboard/board.py', 'progress', '--actor', config.actor,
    '--id', config.task, '--detail', detail], { cwd: ROOT, stdio: 'inherit' });
  async function panel(block, arm, policy) {
    if (raw.panels.some(p => p.block === block && p.arm === arm) || raw.dispatches.some(p => p.block === block && p.arm === arm)) throw new Error('burned panel cannot be replayed');
    const seeds = Array.from({ length: config.blocks[block].count }, (_, i) => config.blocks[block].start + i);
    charge(raw.counts, 'controls', 580, config);
    raw.dispatches.push({ block, arm, budget: 'controls', games: 580, policy, seeds }); checkpoint();
    const start = performance.now();
    const responses = await Promise.all(LEVELS.map(levelData => pool.run({ levelData, seeds, policy })));
    const value = { block, arm, policy, levels: config.levels, seeds,
      games: responses.flatMap(r => r.games).sort((a, b) => a.level - b.level || a.seed - b.seed),
      workerElapsedSeconds: responses.reduce((s, r) => s + r.workerElapsedSeconds, 0),
      threadCpuSeconds: responses.reduce((s, r) => s + r.threadCpuSeconds, 0), wallSeconds: (performance.now() - start) / 1000,
      filesRead: [...new Set(responses.flatMap(r => r.filesRead).map(f => path.relative(ROOT, f).replaceAll('\\', '/')))].sort() };
    assertPanel(value, config);
    if (value.filesRead.some(f => /(^|\/)(recordings|play-sessions)\//.test(f))) throw new Error('recording read during measurement');
    raw.panels.push(value); raw.filesRead = [...new Set([...raw.filesRead, ...value.filesRead])].sort(); checkpoint();
    console.log('PANEL', block, arm, value.games.length, 'wall_seconds', value.wallSeconds, 'thread_cpu_seconds', value.threadCpuSeconds);
    return value;
  }
  const summary = (candidate, champion) => summarizePairs(paired(candidate, champion, config), config.levels, champion.seeds);
  try {
    console.log('RECOVERY_REGISTRATION', commit);
    console.log('CARRIED_ACCOUNTING', JSON.stringify(raw.counts));
    for (const row of raw.headlines.controls) console.log('CARRIED_CONTROL', JSON.stringify(row));
    for (let i = 3; i <= 12; i++) {
      const block = `C${i}`;
      const champion = await panel(block, 'champion', {kind: 'champion'});
      const zero = await panel(block, 'zero', {kind: 'zero', lookaheadBase: config.zeroLookaheadBase});
      const mild = await panel(block, 'handicap10', {kind: 'handicap', every: 10});
      const strong = await panel(block, 'handicap5', {kind: 'handicap', every: 5});
      const row = { block, zero: summary(zero, champion), mild: summary(mild, champion), strong: summary(strong, champion) };
      raw.headlines.controls.push(row); checkpoint(); console.log('CONTROL', JSON.stringify(row));
      progress(`Recovery ${block} complete: zero ACCEPTED=${accepted(row.zero)}, strong harm detected=${row.strong.moveCi95[1] < 0}; carried plus new charges=${JSON.stringify(raw.counts)}`);
    }
    const rows = raw.headlines.controls;
    const zeroAccepted = rows.filter(r => accepted(r.zero)).length;
    const strongDetected = rows.filter(r => r.strong.moveCi95[1] < 0).length;
    const mildDetected = rows.filter(r => r.mild.moveCi95[1] < 0).length;
    const zeroMdes = rows.map(r => ({block: r.block, se: r.zero.moveSe, smallestDetectableGain80: 2.8 * r.zero.moveSe}));
    const zeroMde = Math.max(...zeroMdes.map(r => r.smallestDetectableGain80));
    raw.headlines.bars = {zeroAccepted, zeroCeiling: 1, strongDetected, strongTotal: 12, strongRequired: 0.8,
      mildDetected, zeroMdes, historicalMde: config.historicalMde, zeroMde, reportedDetectableGain: Math.max(config.historicalMde, zeroMde)};
    raw.headlines.path = zeroAccepted > 1 || strongDetected / 12 < 0.8 ? 'C' : 'CONTROLS_PASSED';
    const problems = completionProblems(raw);
    if (problems.length) throw new Error(`incomplete recovery: ${problems.join('; ')}`);
    raw.status = 'CONTROLS_COMPLETE'; checkpoint();
    console.log('ZERO-EFFECT ACCEPTED', zeroAccepted, '/ 12; ceiling 1');
    console.log('12 blocks can only catch a false-accept rate of roughly 17% or more: sanity check, not calibration.');
    console.log('SMALL-HARM DETECTED every10', mildDetected, '/ 12; every5', strongDetected, '/ 12; required every5 at least 80%');
    console.log('DETECTABLE_GAIN', JSON.stringify(raw.headlines.bars));
    console.log('CLOSURE_PATH', raw.headlines.path, 'COUNTS', JSON.stringify(raw.counts));
    progress(`Recovery controls complete: disposition=${raw.headlines.path}; zero accepted=${zeroAccepted}/12; strong detected=${strongDetected}/12. No proposal judged yet.`);
  } catch (error) {
    raw.status = error.budget ? 'BUDGET_STOP' : 'UNVERIFIED';
    raw.error = {message: error.message, budget: error.budget || null}; checkpoint();
    console.error(error.stack); progress(`Recovery stopped ${raw.status}: ${error.message}`); throw error;
  } finally { await pool.close(); }
}
if (require.main === module) run().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { registeredConfiguration, run };
