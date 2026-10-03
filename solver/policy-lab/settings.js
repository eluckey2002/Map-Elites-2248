'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PLAN = 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md';
const ROOT = path.resolve(__dirname, '../..');
function settings() {
  const text = fs.readFileSync(path.join(ROOT, PLAN), 'utf8');
  const match = /```json\n([\s\S]*?)\n```/.exec(text);
  if (!match) throw new Error('exploration plan lacks machine-readable settings');
  return JSON.parse(match[1]);
}
module.exports = { PLAN, ROOT, settings };
