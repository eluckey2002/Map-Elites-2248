'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { LEVELS } = require('../../src/game');
const { summarizePairs } = require('../ruler/core');
const { DEFAULT_PARAMS } = require('../bot');
const { accepted } = require('./decision');
const { createPool } = require('./pool');
const { settings, ROOT, PLAN } = require('./settings');
const OUT = path.join(__dirname, 'runs');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');

async function run() {
  const config = settings();
  const registrationCommit = execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', PLAN], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').at(-1);
  if (!registrationCommit) throw new Error('commit exploration plan before any new game');
  const registered = execFileSync('git', ['show', `${registrationCommit}:${PLAN}`], { cwd: ROOT, encoding: 'utf8' });
  if (registered !== fs.readFileSync(path.join(ROOT, PLAN), 'utf8')) throw new Error('exploration plan drift');
  for (const [file, expected] of Object.entries(config.harnessFreeze)) if (sha(file) !== expected) throw new Error(`harness drift: ${file}`);
  if (fs.existsSync(path.join(OUT, 'controls-raw.json'))) throw new Error('burned blocks: control run cannot be restarted');
  const pool = createPool(4);
  const raw = { kind: 'exploration-diagnostic', result: config.result,
    registration: { exploratory: true, explorationPlanCommit: registrationCommit },
    levelDefinitions: LEVELS, config, panels: [], parity: [], counts: { controls: 0, proposals: 0, jointSearch: 0, confirmation: 0, replays: config.historicalReplayGames, buffer: 0 },
    inert: { identical: 0, total: 0 }, filesRead: [PLAN, 'src/game.js', 'solver/bot.js', 'solver/engine.js'], headlines: {} };
  const checkpoint = () => fs.writeFileSync(path.join(OUT, 'controls-raw.json'), JSON.stringify(raw, null, 2) + '\n');
  const recordProgress = detail => execFileSync('python', ['.blackboard/board.py', 'progress', '--actor', config.actor, '--id', config.task, '--detail', detail], { cwd: ROOT, stdio: 'inherit' });
  function charge(budget, games) {
    const used = Object.values(raw.counts).reduce((a, b) => a + b, 0);
    if (raw.counts[budget] + games > config.budgets[budget] || used + games > 120000) throw new Error(`BUDGET_STOP ${budget}`);
    raw.counts[budget] += games; checkpoint();
  }
  async function panel(block, arm, policy, budget, { parity = false, selectedCells = null, inert = false } = {}) {
    const seeds = Array.from({ length: config.blocks[block].count }, (_, i) => config.blocks[block].start + i);
    const cells = selectedCells || LEVELS.flatMap(l => seeds.map(seed => ({ level: l.level, seed })));
    charge(budget, cells.length * (parity ? 2 : 1));
    const start = performance.now();
    const jobs = LEVELS.flatMap(levelData => {
      const selected = cells.filter(c => c.level === levelData.level).map(c => c.seed);
      return selected.length ? [pool.run({ levelData, seeds: selected, policy, parity, inert })] : [];
    });
    const responses = await Promise.all(jobs);
    const games = responses.flatMap(r => r.games).sort((a, b) => a.level - b.level || a.seed - b.seed);
    const value = { block, arm, policy, levels: cells.map(c => c.level).filter((x, i, a) => a.indexOf(x) === i), seeds,
      games, workerElapsedSeconds: responses.reduce((s, r) => s + r.workerElapsedSeconds, 0),
      threadCpuSeconds: responses.reduce((s, r) => s + r.threadCpuSeconds, 0), wallSeconds: (performance.now() - start) / 1000,
      filesRead: [...new Set(responses.flatMap(r => r.filesRead).map(f => path.relative(ROOT, f).replaceAll('\\', '/')))].sort() };
    raw.panels.push(value); raw.filesRead = [...new Set([...raw.filesRead, ...value.filesRead])].sort();
    for (const r of responses) { raw.inert.total += r.inertTotal; raw.inert.identical += r.inertIdentical; }
    checkpoint();
    console.log('PANEL', block, arm, games.length, 'wall_seconds', value.wallSeconds, 'thread_cpu_seconds', value.threadCpuSeconds);
    return value;
  }
  function paired(candidate, champion) {
    return candidate.games.map((g, i) => {
      const c = champion.games[i];
      if (g.level !== c.level || g.seed !== c.seed) throw new Error('unpaired panel');
      return { level: g.level, seed: g.seed, candidate: g.outcome, champion: c.outcome };
    });
  }
  function summary(candidate, champion) { return summarizePairs(paired(candidate, champion), LEVELS.map(l => l.level), champion.seeds); }
  try {
    // This is the single reusable G reference. Ruler replays count separately.
    const reference = await panel('G', 'champion', { kind: 'champion' }, 'proposals', { inert: true });
    const selected = Array.from({ length: 200 }, (_, i) => ({ level: i % 58 + 1, seed: config.blocks.G.start + Math.floor(i / 58) }));
    // Replay G's 200 selected champion cells through the ruler, using the
    // parity job's lab outcome as a counted replay, never as a second panel.
    const champParity = await panel('G', 'parity-champion-replays', { kind: 'champion' }, 'replays', { parity: true, selectedCells: selected });
    const baseParity = await panel('G', 'parity-base', { kind: 'base' }, 'replays', { parity: true, selectedCells: selected });
    const variantParity = await panel('G', 'parity-variant', { kind: 'variant', params: { ...DEFAULT_PARAMS, wRoll: 1.3 } }, 'replays', { parity: true, selectedCells: selected });
    for (const p of [champParity, baseParity, variantParity]) {
      const identical = p.games.filter(g => g.outcome.traceIdentity === g.parityOutcome.traceIdentity).length;
      raw.parity.push({ policy: p.policy.kind, identical, total: p.games.length });
      console.log('PARITY', p.policy.kind, identical, '/', p.games.length);
      if (identical !== p.games.length) throw new Error('parity mismatch');
    }
    console.log('INERT', raw.inert.identical, '/', raw.inert.total);
    if (raw.inert.total < 1000 || raw.inert.total !== raw.inert.identical) throw new Error('inert ranker mismatch');
    checkpoint();
    // Controls always complete all twelve disjoint blocks; references are shared.
    const rows = [];
    for (let i = 1; i <= 12; i++) {
      const block = `C${i}`;
      const champion = await panel(block, 'champion', { kind: 'champion' }, 'controls');
      const zero = await panel(block, 'zero', { kind: 'zero', lookaheadBase: config.zeroLookaheadBase }, 'controls');
      const mild = await panel(block, 'handicap10', { kind: 'handicap', every: 10 }, 'controls');
      const strong = await panel(block, 'handicap5', { kind: 'handicap', every: 5 }, 'controls');
      const row = { block, zero: summary(zero, champion), mild: summary(mild, champion), strong: summary(strong, champion) };
      rows.push(row); raw.headlines.controls = rows; checkpoint();
      console.log('CONTROL', JSON.stringify(row));
      recordProgress(`Control ${block} complete: zero ACCEPTED=${accepted(row.zero)}, strong harm detected=${row.strong.moveCi95[1] < 0}; actual charged games=${JSON.stringify(raw.counts)}`);
    }
    const zeroAccepted = rows.filter(r => accepted(r.zero)).length;
    const strongDetected = rows.filter(r => r.strong.moveCi95[1] < 0).length;
    const mildDetected = rows.filter(r => r.mild.moveCi95[1] < 0).length;
    // Compute an MDE for each actual permitted fresh zero-effect panel.
    const zeroMdes = rows.map(r => ({ block: r.block, se: r.zero.moveSe, smallestDetectableGain80: 2.8 * r.zero.moveSe }));
    const historicalMde = config.historicalMde;
    const zeroMde = Math.max(...zeroMdes.map(r => r.smallestDetectableGain80));
    raw.headlines.bars = { zeroAccepted, zeroCeiling: 1, strongDetected, strongTotal: 12, strongRequired: 0.8,
      mildDetected, zeroMdes, historicalMde, zeroMde, reportedDetectableGain: Math.max(historicalMde, zeroMde) };
    raw.headlines.path = zeroAccepted > 1 || strongDetected / 12 < 0.8 ? 'C' : 'CONTROLS_PASSED';
    console.log('ZERO-EFFECT ACCEPTED', zeroAccepted, '/ 12; ceiling 1');
    console.log('12 blocks can only catch a false-accept rate of roughly 17% or more: sanity check, not calibration.');
    console.log('SMALL-HARM DETECTED every10', mildDetected, '/ 12; every5', strongDetected, '/ 12; required every5 at least 80%');
    console.log('DETECTABLE_GAIN', JSON.stringify(raw.headlines.bars));
    console.log('CLOSURE_PATH', raw.headlines.path, 'COUNTS', JSON.stringify(raw.counts));
    checkpoint();
  } finally { await pool.close(); }
}
if (require.main === module) run().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { run };
