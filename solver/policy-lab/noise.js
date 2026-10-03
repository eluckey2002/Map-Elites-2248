'use strict';

// Historical data only. This command never creates or plays a board.
const fs = require('node:fs');
const path = require('node:path');
const { twoAxis } = require('../ruler/core');
const ROOT = path.resolve(__dirname, '../..');
const levels = Array.from({ length: 58 }, (_, i) => i + 1);
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const variance = a => a.length < 2 ? null : a.reduce((s, v) => s + (v - mean(a)) ** 2, 0) / (a.length - 1);

function historicalNoise() {
  const files = ['experiments/RESULT-0049/corpus.json', 'experiments/RESULT-0058/raw-games.json'];
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, files[0]), 'utf8'));
  const cross = JSON.parse(fs.readFileSync(path.join(ROOT, files[1]), 'utf8'));
  const panels = cross.panels.filter(p => p.tag === 'positive3000');
  const games = cross.games.filter(g => g.stage === 'positive3000');
  const keyed = new Map(games.map(g => [`${g.arm}/${g.level}/${g.seed}`, g.outcome]));
  const candidatePanel = panels.find(p => p.arm === 'candidate');
  const perLevel = levels.map(level => {
    const observed = old.cells.filter(c => c.level === level && c.base.win && c.champion.win)
      .map(c => c.base.movesToTarget - c.champion.movesToTarget);
    const crossValues = !candidatePanel.levels.includes(level) ? [] : candidatePanel.seeds.flatMap(seed => {
      const c = keyed.get(`candidate/${level}/${seed}`);
      const b = keyed.get(`reference/${level}/${seed}`) || keyed.get(`champion/${level}/${seed}`);
      if (!c || !b) throw new Error('historical cross-check pair missing');
      return c.win && b.win ? [b.movesToTarget - c.movesToTarget] : [];
    });
    return { level, source: observed.length ? files[0] : 'UNCOVERED', mutualWins: observed.length,
      mean: mean(observed), pairedVariance: variance(observed),
      crossCheckSource: crossValues.length ? files[1] : 'not covered',
      crossCheckMutualWins: crossValues.length, crossCheckVariance: variance(crossValues) };
  });
  const designs = [10, 30, 150, 300].map(seedCount => {
    const selectedSeeds = old.panel.seeds.slice(0, seedCount);
    const values = old.cells.filter(c => selectedSeeds.includes(c.seed)).map(c => (
      c.base.win && c.champion.win ? c.base.movesToTarget - c.champion.movesToTarget : null
    ));
    const axes = twoAxis(values, 58, seedCount);
    return { levels: 58, seeds: seedCount, permittedForExploration: seedCount === 10,
      empiricalHistoricalSubset: 'first N frozen RESULT-0049 seeds', ...axes,
      halfWidth95: 1.96 * axes.se, smallestDetectableGain80: 2.8 * axes.se };
  });
  return { contrasts: 'champion versus base; no challenger variability claim',
    sources: files, perLevel, designs,
    caveat: 'Adding seeds does not shrink the level-axis error. Estimates from different empirical subsets can fluctuate. Detectable gains are conditional on historical champion-versus-base variance, not a challenger calibration.' };
}

if (require.main === module) {
  const result = historicalNoise();
  fs.writeFileSync(path.join(__dirname, 'runs/noise.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('NOISE TABLE: no new games; champion versus base');
  console.log('level primary_n paired_variance crosscheck_n crosscheck_variance source');
  for (const r of result.perLevel) console.log(r.level, r.mutualWins, r.pairedVariance, r.crossCheckMutualWins, r.crossCheckVariance, r.source, r.crossCheckSource);
  console.log('design permitted se_level se_seed se 95_half_width smallest_detectable_gain_80pct');
  for (const d of result.designs) console.log(`58x${d.seeds}`, d.permittedForExploration, d.seLevel, d.seSeed, d.se, d.halfWidth95, d.smallestDetectableGain80);
  console.log('alpha=0.05; power=0.80; smallest detectable gain = 2.8 x SE');
  console.log(result.caveat);
}
module.exports = { historicalNoise };
