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
const stages = { map72: 'stage1', map600: 'stage2', map3000: 'stage3',
  mapFresh: 'fresh', mapHoldout: 'final-holdout' };
const panels = raw.panels.filter((panel) => panel.arm === 'candidate' && stages[panel.tag]);
const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
console.log('TIMING UNITS: wallSeconds is elapsed panel time; cpuSeconds is the sum of elapsed worker times measured with performance.now().');
console.log('stage policy_id candidate_games wall_seconds summed_worker_elapsed_seconds');
for (const panel of panels) {
  console.log(stages[panel.tag] + ' ' + panel.policyId + ' ' + panel.games
    + ' ' + panel.wallSeconds.toFixed(3) + ' ' + panel.cpuSeconds.toFixed(3));
}
console.log('stage candidates games_per_candidate mean_wall_seconds mean_summed_worker_elapsed_seconds');
for (const [tag, stage] of Object.entries(stages)) {
  const entries = panels.filter((panel) => panel.tag === tag);
  if (!entries.length) {
    console.log(stage + ' 0 NOT_RUN NOT_RUN NOT_RUN');
  } else {
    console.log(stage + ' ' + entries.length + ' ' + entries[0].games
      + ' ' + average(entries.map((panel) => panel.wallSeconds)).toFixed(3)
      + ' ' + average(entries.map((panel) => panel.cpuSeconds)).toFixed(3));
  }
}
