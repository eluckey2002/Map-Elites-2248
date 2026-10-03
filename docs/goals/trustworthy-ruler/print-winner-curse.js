#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const artifact = process.argv[2]
  || path.resolve(__dirname, '../../../experiments/RESULT-0058/raw-games.json');
if (!fs.existsSync(artifact)) {
  console.log('UNVERIFIED: complete raw per-game artifact is not available: ' + artifact);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(artifact, 'utf8'));
const rows = raw.headlines.curse.rows;
const number = (value) => value === null ? 'NA' : value.toFixed(6);
console.log('WINNER CURSE variants=' + rows.length + ' paired_cells_per_panel=72');
console.log('variant screen_gained screen_lost screen_moves_saved fresh_gained fresh_lost fresh_moves_saved screen_pct fresh_pct fresh_minus_screen_pct');
for (const row of rows) {
  console.log(row.name + ' ' + row.screen.winsGained + ' ' + row.screen.winsLost
    + ' ' + number(row.screen.meanMovesSaved) + ' ' + row.fresh.winsGained
    + ' ' + row.fresh.winsLost + ' ' + number(row.fresh.meanMovesSaved)
    + ' ' + number(row.screenPct) + ' ' + number(row.freshPct) + ' ' + number(row.gapPct));
}
console.log('WINNER CURSE mean_fresh_minus_screen_pct=' + number(raw.headlines.curse.meanGapPct));
