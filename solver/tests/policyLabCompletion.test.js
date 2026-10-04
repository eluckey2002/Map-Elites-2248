'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { completionProblems } = require('../policy-lab/completion');

function complete() {
  const blocks = Array.from({ length: 12 }, (_, i) => `C${i + 1}`);
  return { panels: blocks.flatMap(block => ['champion', 'zero', 'handicap10', 'handicap5'].map(arm => ({ block, arm, games: Array(580).fill({}) }))),
    counts: { controls: 27840 }, headlines: { controls: blocks.map(block => ({ block })), bars: {}, path: 'C' } };
}

test('completion fence refuses dispatched but unretained games even with a claimed verdict', () => {
  const raw = complete();
  assert.deepEqual(completionProblems(raw), []);
  raw.panels.pop();
  assert.match(completionProblems(raw).join('\n'), /charged controls 27840 differ from retained 27260/);
  assert.match(completionProblems(raw).join('\n'), /C12\/handicap5: expected exactly one retained panel/);
});

test('completion fence cannot certify a two-block interruption or duplicated reference', () => {
  const raw = complete();
  raw.panels = raw.panels.slice(0, 8);
  raw.counts.controls = 4640;
  raw.headlines.controls = raw.headlines.controls.slice(0, 2);
  delete raw.headlines.bars; delete raw.headlines.path;
  assert.match(completionProblems(raw).join('\n'), /complete control summaries 2, required 12/);
  const duplicate = complete(); duplicate.panels[1] = duplicate.panels[0];
  assert.match(completionProblems(duplicate).join('\n'), /C1\/champion: expected exactly one retained panel/);
});
