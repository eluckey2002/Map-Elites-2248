#!/usr/bin/env node
'use strict';

// Read-only comparison of two independently generated complete statistics files.
// No producer module is imported, and the sealed game source is hashed directly.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const resultDir = path.join(__dirname, '..', '..', 'experiments', 'RESULT-0058');
const produced = JSON.parse(fs.readFileSync(process.argv[2] || path.join(resultDir, 'full-summary.json')));
const independent = JSON.parse(fs.readFileSync(process.argv[3] || path.join(resultDir, 'independent-full-summary.json')));
const source = fs.readFileSync(process.argv[4] || path.join(resultDir, 'raw-games.json'));
const hash = crypto.createHash('sha256').update(source).digest('hex');
const differences = [];
function compare(a, b, label) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > 1e-9) differences.push(label);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) differences.push(label + '.length');
    a.forEach((value, index) => compare(value, b[index], label + '[' + index + ']'));
  } else if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a).sort();
    if (JSON.stringify(keys) !== JSON.stringify(Object.keys(b).sort())) differences.push(label + '.keys');
    for (const key of keys) compare(a[key], b[key], label + '.' + key);
  } else if (a !== b) differences.push(label);
}
compare(produced, independent, 'statistics');
if (produced.sourceRawSha256 !== hash || independent.sourceRawSha256 !== hash) differences.push('sealed source identity');
const raw = JSON.parse(source);
if (produced.panels.length !== raw.panels.filter((panel) => panel.arm === 'candidate').length) {
  differences.push('candidate panel coverage');
}
if (differences.length) {
  for (const label of differences) console.log('DIFF FULL STATISTICS ' + label);
  process.exitCode = 1;
} else {
  console.log('MATCH FULL STATISTICS panels=' + produced.panels.length + ' raw_games=' + raw.games.length
    + ' win_and_move_axes=level,seed source_sha256=' + hash);
}
