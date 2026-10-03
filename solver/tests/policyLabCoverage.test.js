'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assertions } = require('../policy-lab/coverage');
const config = { blocks: { G: { start: 60000000, count: 10 }, R1: { start: 60001000, count: 10 } }, harnessFreeze: {} };
const panel = () => ({ block: 'G', arm: 'candidate', games: Array.from({ length: 58 }, (_, i) => Array.from({ length: 10 }, (_, j) => ({ level: i + 1, seed: 60000000 + j }))).flat() });
const failures = (cfg, raw) => assertions(cfg, raw).filter(c => !c.notRun && !c.pass);

test('policy panel audit rejects incomplete late levels and repeated cells', () => {
  const raw = { panels: [panel()], filesRead: [] };
  assert.equal(failures(config, raw).length, 0);
  raw.panels[0].games.pop();
  assert.match(JSON.stringify(failures(config, raw)), /complete 58 x 10/);
  raw.panels[0] = panel(); raw.panels[0].games[579] = raw.panels[0].games[578];
  assert.match(JSON.stringify(failures(config, raw)), /complete 58 x 10/);
});

test('policy panel audit rejects reused ranges, out-of-allocation seeds and recording reads', () => {
  assert.match(JSON.stringify(failures({ ...config, blocks: { ...config.blocks, R1: { start: 60000005, count: 10 } } }, { panels: [], filesRead: [] })), /pairwise disjoint/);
  assert.match(JSON.stringify(failures({ ...config, blocks: { G: { start: 70000000, count: 10 } } }, { panels: [], filesRead: [] })), /inside allocation/);
  assert.match(JSON.stringify(failures(config, { panels: [], filesRead: ['play-sessions/example.json'] })), /never read recording/);
});

test('policy panel audit reports unused blocks as not run without fabricating failures', () => {
  const result = assertions(config, { panels: [], filesRead: [] });
  assert.equal(result.filter(c => c.notRun).length, 2);
  assert.equal(result.filter(c => !c.notRun && !c.pass).length, 0);
});
