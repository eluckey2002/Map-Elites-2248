'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function assertions(config, raw) {
  const result = [];
  const add = (name, pass, detail) => result.push({ name, pass, detail });
  const ranges = Object.entries(config.blocks).map(([name, b]) => ({ name, first: b.start, last: b.start + b.count - 1 }));
  add('all reserved ranges inside allocation', ranges.every(r => r.first >= 60000000 && r.last <= 69999999 && r.first <= r.last), ranges);
  add('all reserved blocks pairwise disjoint', ranges.every((r, i) => ranges.slice(i + 1).every(s => r.last < s.first || s.last < r.first)), 'shared references reuse a block, not a fresh range');
  const expectedLevels = Array.from({ length: 58 }, (_, i) => i + 1);
  for (const name of Object.keys(config.blocks)) {
    const refs = raw.panels.filter(p => p.block === name && p.arm === 'champion');
    add(`${name}: at most one shared champion reference`, refs.length <= 1, refs.length);
  }
  for (const p of raw.panels) {
    if (p.arm.startsWith('parity-')) continue;
    const block = config.blocks[p.block];
    const seedCount = p.block === 'F' ? block.count : 10;
    const expected = expectedLevels.flatMap(level => Array.from({ length: seedCount }, (_, i) => `${level}/${block.start + i}`));
    const actual = p.games.map(g => `${g.level}/${g.seed}`);
    add(`${p.block}/${p.arm}: complete 58 x ${seedCount}`, actual.length === expected.length && actual.every((k, i) => k === expected[i]), actual.length);
    add(`${p.block}/${p.arm}: declared seeds only`, p.games.every(g => g.seed >= block.start && g.seed <= block.start + block.count - 1), `${block.start}-${block.start + block.count - 1}`);
  }
  const reads = [...new Set([...raw.filesRead, ...Object.keys(config.harnessFreeze)])].sort();
  add('experimental panel paths never read recording files', reads.every(f => !/(^|\/)(recordings|play-sessions)(\/|$)/.test(f)), reads);
  for (const name of Object.keys(config.blocks)) if (!raw.panels.some(p => p.block === name)) result.push({ name, notRun: true });
  return result;
}

function main() {
  const root = path.resolve(__dirname, '../..');
  const file = 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md';
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const config = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]);
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs/controls-raw.json'), 'utf8'));
  const checks = assertions(config, raw);
  for (const c of checks) console.log(c.notRun ? 'not run' : c.pass ? 'PASS' : 'FAIL', c.name, c.detail === undefined ? '' : JSON.stringify(c.detail));
  const protocol = path.join(root, `experiments/${config.result}/protocol.md`);
  console.log('confirmation protocol', fs.existsSync(protocol) ? 'registered; additional F assertions required for Path A' : 'not registered; Path A not reached');
  console.log('FILES_READ');
  for (const f of [...new Set([file, 'solver/policy-lab/runs/controls-raw.json', ...raw.filesRead, ...Object.keys(config.harnessFreeze)])].sort()) console.log(f);
  const failed = checks.filter(c => !c.notRun && !c.pass);
  const output = { checks, failed: failed.length, rawSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'runs/controls-raw.json'))).digest('hex') };
  fs.writeFileSync(path.join(__dirname, 'runs/coverage.json'), JSON.stringify(output, null, 2) + '\n');
  if (failed.length) process.exitCode = 1;
}
if (require.main === module) main();
module.exports = { assertions };
