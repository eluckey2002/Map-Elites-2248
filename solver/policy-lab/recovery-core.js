'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { syncDirectory } = require('./journaled-pool');
const { accepted } = require('./decision');

function atomicJson(file, value) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
  syncDirectory(path.dirname(file));
}
function charge(counts, budget, games, config) {
  if (!Number.isSafeInteger(games) || games < 1 || !Object.hasOwn(config.budgets, budget)) throw new Error('invalid charge');
  if (Object.keys(counts).sort().join() !== Object.keys(config.budgets).sort().join()
      || Object.values(counts).some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('invalid budget counters');
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (counts[budget] + games > config.budgets[budget] || total + games > config.maxGames) {
    const error = new Error(`BUDGET_STOP ${budget}: used=${counts[budget]} requested=${games} total=${total}`);
    error.budget = budget; throw error;
  }
  counts[budget] += games;
}
function assertPanel(panel, config) {
  const block = config.blocks[panel.block];
  if (!block) throw new Error(`unknown block ${panel.block}`);
  const expected = config.levels.flatMap(level => Array.from({ length: block.count }, (_, i) => `${level}:${block.start + i}`));
  const actual = panel.games.map(g => `${g.level}:${g.seed}`);
  if (actual.length !== expected.length || new Set(actual).size !== actual.length
      || actual.some((key, i) => key !== expected[i])) throw new Error(`incomplete or substituted panel ${panel.block}/${panel.arm}`);
  if (JSON.stringify(panel.seeds) !== JSON.stringify(Array.from({length: block.count}, (_, i) => block.start + i))) throw new Error('panel seed declaration mismatch');
}
function paired(candidate, champion, config) {
  assertPanel(candidate, config); assertPanel(champion, config);
  if (candidate.block !== champion.block) throw new Error('cross-block pairing');
  return candidate.games.map((g, i) => ({ level: g.level, seed: g.seed, candidate: g.outcome, champion: champion.games[i].outcome }));
}
function initialRaw(old, closure, config, registration) {
  if (JSON.stringify(old.counts) !== JSON.stringify(config.carryForward.counts)
      || JSON.stringify(closure.chargedAccounting) !== JSON.stringify(old.counts)) throw new Error('carried charges changed');
  if (closure.completeControlBlocks !== 2 || closure.proposalRounds !== 0) throw new Error('unexpected original run boundary');
  for (const block of ['C1', 'C2']) {
    const panels = old.panels.filter(p => p.block === block);
    if (panels.length !== 4 || panels.map(p => p.arm).sort().join() !== ['champion', 'zero', 'handicap10', 'handicap5'].sort().join()) throw new Error('incomplete carried control');
    for (const panel of panels) assertPanel(panel, config);
  }
  return { kind: 'exploration-diagnostic-recovery', result: config.result, registration, config,
    levelDefinitions: old.levelDefinitions, panels: structuredClone(old.panels.filter(p => p.block !== 'C3')),
    excludedOriginalPanels: old.panels.filter(p => p.block === 'C3').map(p => ({ block: p.block, arm: p.arm, games: p.games.length })),
    counts: structuredClone(old.counts), dispatches: [],
    parity: structuredClone(old.parity), inert: structuredClone(old.inert),
    filesRead: [], headlines: { controls: structuredClone(old.headlines.controls) }, status: 'RUNNING' };
}
function completionProblems(raw) {
  const problems = [];
  const blocks = Array.from({length: 12}, (_, i) => `C${i + 1}`);
  const panels = raw.panels.filter(p => /^C\d+$/.test(p.block));
  for (const block of blocks) for (const arm of ['champion', 'zero', 'handicap10', 'handicap5']) {
    const selected = panels.filter(p => p.block === block && p.arm === arm);
    if (selected.length !== 1) problems.push(`${block}/${arm}: expected exactly one panel`);
    else try { assertPanel(selected[0], raw.config); } catch (e) { problems.push(e.message); }
  }
  if (panels.length !== 48) problems.push('expected exactly 48 control panels');
  if (JSON.stringify((raw.headlines.controls || []).map(r => r.block)) !== JSON.stringify(blocks)) problems.push('twelve ordered summaries required');
  const retainedNew = panels.filter(p => !['C1', 'C2'].includes(p.block)).reduce((s, p) => s + p.games.length, 0);
  if (raw.counts.controls !== raw.config.carryForward.counts.controls + retainedNew) problems.push('carried/new control accounting mismatch');
  const dispatches = raw.dispatches.filter(d => d.budget === 'controls');
  if (dispatches.length !== 40 || new Set(dispatches.map(d => `${d.block}/${d.arm}`)).size !== 40
      || dispatches.some(d => d.games !== 580 || ['C1', 'C2'].includes(d.block))) problems.push('forty distinct new control dispatches required');
  for (const p of panels.filter(p => !['C1', 'C2'].includes(p.block))) {
    const dispatched = dispatches.filter(d => d.block === p.block && d.arm === p.arm);
    if (dispatched.length !== 1 || JSON.stringify(dispatched[0].policy) !== JSON.stringify(p.policy)
        || JSON.stringify(dispatched[0].seeds) !== JSON.stringify(p.seeds)) problems.push(`dispatch does not identify retained panel ${p.block}/${p.arm}`);
  }
  const bars = raw.headlines.bars;
  if (!bars || !['C', 'CONTROLS_PASSED'].includes(raw.headlines.path)) problems.push('aggregate control disposition absent');
  else {
    const rows = raw.headlines.controls || [];
    try {
      const zeroAccepted = rows.filter(r => accepted(r.zero)).length;
      const strongDetected = rows.filter(r => Number.isFinite(r.strong.moveCi95[1]) && r.strong.moveCi95[1] < 0).length;
      const mildDetected = rows.filter(r => Number.isFinite(r.mild.moveCi95[1]) && r.mild.moveCi95[1] < 0).length;
      const expectedPath = zeroAccepted > 1 || strongDetected / 12 < 0.8 ? 'C' : 'CONTROLS_PASSED';
      if (bars.zeroCeiling !== 1 || bars.strongRequired !== 0.8 || bars.strongTotal !== 12
          || bars.zeroAccepted !== zeroAccepted || bars.strongDetected !== strongDetected
          || bars.mildDetected !== mildDetected || raw.headlines.path !== expectedPath) problems.push('aggregate bars or disposition changed');
    } catch { problems.push('malformed control summaries'); }
  }
  return problems;
}
module.exports = { atomicJson, charge, assertPanel, paired, initialRaw, completionProblems };
