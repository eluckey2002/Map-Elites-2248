'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Fail closed on missing dispatch results. This reducer never launches games
// or authorizes reuse of a burned block after an execution interruption.
function completionProblems(raw) {
  const problems = [];
  const blocks = Array.from({ length: 12 }, (_, i) => `C${i + 1}`);
  const expected = blocks.flatMap(block => ['champion', 'zero', 'handicap10', 'handicap5'].map(arm => `${block}/${arm}`));
  const actual = raw.panels.filter(p => /^C\d+$/.test(p.block)).map(p => `${p.block}/${p.arm}`);
  for (const key of expected) if (actual.filter(k => k === key).length !== 1) problems.push(`${key}: expected exactly one retained panel`);
  if (actual.length !== expected.length) problems.push(`control panel count ${actual.length}, required ${expected.length}`);
  for (const p of raw.panels.filter(p => /^C\d+$/.test(p.block))) if (p.games.length !== 580) problems.push(`${p.block}/${p.arm}: ${p.games.length} games, required 580`);
  const rows = raw.headlines.controls || [];
  if (JSON.stringify(rows.map(r => r.block)) !== JSON.stringify(blocks)) problems.push(`complete control summaries ${rows.length}, required 12 in order`);
  const retained = raw.panels.filter(p => /^C\d+$/.test(p.block)).reduce((n, p) => n + p.games.length, 0);
  if (retained !== raw.counts.controls) problems.push(`charged controls ${raw.counts.controls} differ from retained ${retained}`);
  if (!raw.headlines.bars) problems.push('aggregate control bars absent');
  if (!['C', 'CONTROLS_PASSED'].includes(raw.headlines.path)) problems.push('no completed control disposition');
  return problems;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs/controls-raw.json'), 'utf8'));
  const problems = completionProblems(raw);
  if (problems.length) {
    console.log('REFUSE COMPLETE CLOSURE: UNVERIFIED');
    for (const problem of problems) console.log(problem);
    process.exitCode = 1;
  } else console.log('PASS complete retained controls; aggregate disposition', raw.headlines.path);
}
if (require.main === module) main();
module.exports = { completionProblems };
