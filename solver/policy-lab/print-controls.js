'use strict';
const fs = require('node:fs');
const path = require('node:path');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs/controls-raw.json'), 'utf8'));
console.log('CONTROL TABLE: every value below is read from retained paired summaries');
console.log('block arm net_wins mean_moves_lost loss_CI95 detected_correct_sign worker_CPU_ratio_to_reference');
for (const r of raw.headlines.controls || []) {
  const reference = raw.panels.find(p => p.block === r.block && p.arm === 'champion');
  for (const [label, field, arm] of [['every10', 'mild', 'handicap10'], ['every5', 'strong', 'handicap5']]) {
    const s = r[field], p = raw.panels.find(p => p.block === r.block && p.arm === arm);
    console.log(r.block, label, s.netWins, -s.meanMovesSaved, JSON.stringify([-s.moveCi95[1], -s.moveCi95[0]]), s.moveCi95[1] < 0,
      p.threadCpuSeconds / reference.threadCpuSeconds);
  }
  console.log(r.block, 'zero-effect', r.zero.netWins, 'mean_saved', r.zero.meanMovesSaved, 'CI95', JSON.stringify(r.zero.moveCi95),
    'would_be_ACCEPTED', r.zero.netWins >= 0 && r.zero.meanMovesSaved > 0 && r.zero.moveCi95[0] > 0,
    'detectable_gain80', 2.8 * r.zero.moveSe);
}
if (raw.headlines.bars) console.log('FINAL BARS', JSON.stringify(raw.headlines.bars));
else {
  const rows = raw.headlines.controls || [];
  if (rows.length) console.log('PARTIAL observed detectable gain', Math.max(raw.config.historicalMde, ...rows.map(r => 2.8 * r.zero.moveSe)), 'maximum of historical and completed blocks only; all-12 estimate UNVERIFIED');
  console.log('aggregate control bars UNVERIFIED_INCOMPLETE_RUN');
}
