'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { charge, assertPanel, initialRaw, completionProblems } = require('../policy-lab/recovery-core');
const root = path.resolve(__dirname, '../..');
const old = JSON.parse(fs.readFileSync(path.join(root, 'solver/policy-lab/runs/controls-raw.json')));
const closure = JSON.parse(fs.readFileSync(path.join(root, 'experiments/RESULT-0080/closure.json')));
function config() { const c = structuredClone(old.config); c.blocks.C3.start = 60052000; c.carryForward = {counts: structuredClone(old.counts)}; return c; }

test('recovery excludes partial C3 while retaining all burned-game charges and completed controls', () => {
  const c = config(); const raw = initialRaw(old, closure, c, {synthetic: true});
  assert.equal(raw.counts.controls, 6380);
  assert.equal(Object.values(raw.counts).reduce((a, b) => a + b, 0), 8340);
  assert.equal(raw.panels.filter(p => p.block === 'C3').length, 0);
  assert.equal(raw.panels.filter(p => /^C/.test(p.block)).length, 8);
  assert.deepEqual(raw.excludedOriginalPanels.map(p => p.arm), ['champion', 'zero']);
  assert.deepEqual(raw.headlines.controls, old.headlines.controls);
  const bad = config(); bad.carryForward.counts.controls -= 580;
  assert.throws(() => initialRaw(old, closure, bad, {}), /carried charges changed/);
});
test('carried accounting reaches 29580 and cannot exceed the unchanged control cap', () => {
  const c = config(); const counts = structuredClone(old.counts);
  for (let i = 0; i < 40; i++) charge(counts, 'controls', 580, c);
  assert.equal(counts.controls, 29580);
  assert.throws(() => charge(counts, 'controls', 580, c), /BUDGET_STOP/);
  assert.equal(counts.controls, 29580);
  assert.equal(counts.confirmation, 0);
});
test('fresh C3 validation refuses the old burned C3, duplicated addresses, and missing rows', () => {
  const c = config(); const oldPanel = old.panels.find(p => p.block === 'C3');
  assert.throws(() => assertPanel(oldPanel, c), /substituted panel/);
  const fresh = structuredClone(oldPanel);
  fresh.seeds = Array.from({length: 10}, (_, i) => 60052000 + i);
  fresh.games.forEach(g => { g.seed += 10000; });
  assert.doesNotThrow(() => assertPanel(fresh, c));
  const duplicate = structuredClone(fresh); duplicate.games[1] = duplicate.games[0];
  assert.throws(() => assertPanel(duplicate, c), /substituted panel/);
  fresh.games.pop(); assert.throws(() => assertPanel(fresh, c), /substituted panel/);
});
test('recovery completion refuses a missing arm, lost-game discount, or weakened aggregate bar', () => {
  const c = config(); const raw = initialRaw(old, closure, c, {synthetic: true});
  const template = old.panels.find(p => p.block === 'C1' && p.arm === 'champion');
  for (let i = 3; i <= 12; i++) {
    const block = `C${i}`;
    for (const arm of ['champion', 'zero', 'handicap10', 'handicap5']) {
      const p = structuredClone(template); p.block = block; p.arm = arm; p.policy = {synthetic: true, arm};
      p.seeds = Array.from({length: 10}, (_, n) => c.blocks[block].start + n);
      p.games.forEach(g => { g.seed = c.blocks[block].start + g.seed - c.blocks.C1.start; });
      raw.panels.push(p); raw.dispatches.push({block, arm, budget: 'controls', games: 580, policy: p.policy, seeds: p.seeds});
      charge(raw.counts, 'controls', 580, c);
    }
    raw.headlines.controls.push({...structuredClone(old.headlines.controls[0]), block});
  }
  raw.headlines.bars = {zeroAccepted: 0, zeroCeiling: 1, strongDetected: 12, strongTotal: 12, strongRequired: 0.8, mildDetected: 1};
  raw.headlines.path = 'CONTROLS_PASSED';
  assert.deepEqual(completionProblems(raw), []);
  const missing = structuredClone(raw); missing.panels.pop();
  assert.ok(completionProblems(missing).some(p => /exactly one panel/.test(p)));
  const discounted = structuredClone(raw); discounted.counts.controls -= 580;
  assert.ok(completionProblems(discounted).some(p => /accounting mismatch/.test(p)));
  raw.headlines.bars.strongRequired = 0.5;
  assert.ok(completionProblems(raw).some(p => /aggregate bars/.test(p)));
});
