const crypto = require('node:crypto');

// Pure MAP-Elites archive mechanics. Game evaluation and CLI concerns live in
// map-elites.js; keeping replacement here makes the quality-diversity contract
// directly testable without running a game.

function placeElite(archive, candidate) {
  const current = archive.get(candidate.cell);
  if (!current || candidate.fitness > current.fitness
    || (candidate.fitness === current.fitness && candidate.policyId < current.policyId)) {
    archive.set(candidate.cell, candidate);
    return true;
  }
  return false;
}

function policyIdentity(params) {
  const ordered = Object.fromEntries(Object.keys(params).sort().map((key) => [key, params[key]]));
  return crypto.createHash('sha256').update(JSON.stringify(ordered)).digest('hex').slice(0, 12);
}

function buildAxis(name, minimum, maximum, count) {
  if (!(maximum > minimum) || !Number.isInteger(count) || count < 2) {
    throw new Error(`invalid ${name} axis`);
  }
  const step = (maximum - minimum) / count;
  const bins = Array.from({ length: count }, (_, index) => {
    const from = minimum + step * index;
    const to = index === count - 1 ? maximum : minimum + step * (index + 1);
    return { index, from, to, label: `${from.toFixed(2)}–${to.toFixed(2)}` };
  });
  return { name, minimum, maximum, count, bins };
}

function binFor(value, axis) {
  const scaled = (value - axis.minimum) / (axis.maximum - axis.minimum);
  const index = Math.max(0, Math.min(axis.count - 1, Math.floor(scaled * axis.count)));
  return axis.bins[index];
}

function cellForBehavior(behavior, axes) {
  const chainBin = binFor(behavior.meanChainLength, axes.chainStyle);
  const patienceBin = binFor(behavior.lateScoreShare, axes.patience);
  return { cell: `${chainBin.index},${patienceBin.index}`, chainBin, patienceBin };
}

function axesFromPilot(behaviors, {
  count = 5, minimumChainRange = 0.15, minimumPatienceRange = 0.02,
} = {}) {
  const chains = behaviors.map((b) => b.meanChainLength);
  const patience = behaviors.map((b) => b.lateScoreShare);
  const chainMinimum = Math.min(...chains);
  const chainMaximum = Math.max(...chains);
  const patienceMinimum = Math.min(...patience);
  const patienceMaximum = Math.max(...patience);
  const chainRange = Number((chainMaximum - chainMinimum).toFixed(12));
  const patienceRange = Number((patienceMaximum - patienceMinimum).toFixed(12));
  if (chainRange < minimumChainRange || patienceRange < minimumPatienceRange) {
    throw new Error(
      `DESCRIPTORS INVALID: chain range ${chainRange.toFixed(3)} (need ${minimumChainRange}), `
      + `patience range ${patienceRange.toFixed(3)} (need ${minimumPatienceRange})`,
    );
  }
  return {
    chainStyle: buildAxis('Mean chain length', chainMinimum, chainMaximum, count),
    patience: buildAxis('Late-score share', patienceMinimum, patienceMaximum, count),
    pilot: {
      chainMinimum, chainMaximum, chainRange,
      patienceMinimum, patienceMaximum, patienceRange,
      minimumChainRange, minimumPatienceRange,
    },
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function pctFromLog(value) {
  return `${Math.expm1(value) >= 0 ? '+' : ''}${(Math.expm1(value) * 100).toFixed(2)}%`;
}

function renderMapHtml(artifact) {
  const byCell = new Map(artifact.archive.map((elite) => [elite.cell, elite]));
  const representativeById = new Map(
    (artifact.representatives || []).map((representative) => [representative.policyId, representative]),
  );
  const chainBins = artifact.axes.chainStyle.bins;
  const patienceBins = [...artifact.axes.patience.bins].reverse();
  const cells = [];
  for (const patienceBin of patienceBins) {
    for (const chainBin of chainBins) {
      const cell = `${chainBin.index},${patienceBin.index}`;
      const elite = byCell.get(cell);
      if (!elite) {
        cells.push(`<div class="cell empty" data-cell="${cell}"><strong>Empty cell</strong><span>${chainBin.label} tiles</span><span>${patienceBin.label} late</span></div>`);
        continue;
      }
      const representative = representativeById.get(elite.policyId);
      const holdout = representative && representative.holdout
        ? `<span><b>Holdout fitness:</b> ${pctFromLog(representative.holdout.fitness)}</span>`
        : '<span class="muted">Holdout: not a representative</span>';
      cells.push(`<div class="cell occupied" data-cell="${cell}">
        <strong>${escapeHtml(elite.policyId)}</strong>
        <span><b>Selection fitness:</b> ${pctFromLog(elite.fitness)}</span>
        ${holdout}
        <span>Mean chain ${elite.behavior.meanChainLength.toFixed(2)}</span>
        <span>Late score ${(elite.behavior.lateScoreShare * 100).toFixed(1)}%</span>
      </div>`);
    }
  }
  const representatives = (artifact.representatives || []).map((representative) => {
    const elite = artifact.archive.find((entry) => entry.policyId === representative.policyId);
    return `<article><h3>${escapeHtml(representative.policyId)} · cell ${escapeHtml(elite.cell)}</h3>
      <p>Mean chain ${elite.behavior.meanChainLength.toFixed(2)} · late-score share ${(elite.behavior.lateScoreShare * 100).toFixed(1)}%</p>
      <p>Selection fitness ${pctFromLog(elite.fitness)} · Holdout fitness ${pctFromLog(representative.holdout.fitness)} · holdout win rate ${(representative.holdout.winRate * 100).toFixed(1)}%</p>
      <pre>${escapeHtml(JSON.stringify(elite.params, null, 2))}</pre></article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>2248 MAP-Elites learning map</title>
<style>
:root{font-family:ui-sans-serif,system-ui,sans-serif;color:#172033;background:#f4f6fb}body{max-width:1200px;margin:0 auto;padding:32px}h1{margin-bottom:8px}.lede{max-width:75ch;color:#46516a}.axis{font-weight:700;margin:18px 0 8px}.grid{display:grid;grid-template-columns:repeat(${chainBins.length},minmax(150px,1fr));gap:10px}.cell{min-height:120px;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;border:1px solid #cad1df}.occupied{background:#e8f5eb;border-color:#7cb889}.empty{background:#fff;color:#7a8499;border-style:dashed}.muted{color:#7a8499}section{margin-top:34px}article{background:#fff;border:1px solid #d6dce7;border-radius:12px;padding:16px;margin:12px 0}pre{overflow:auto;background:#f4f6fb;padding:10px;border-radius:8px}@media(max-width:800px){.grid{grid-template-columns:1fr 1fr}body{padding:18px}}
</style></head><body>
<h1>2248 MAP-Elites learning map</h1>
<p class="lede">Each square is one style of play. MAP-Elites keeps the highest-fitness policy found inside every square, even when another style has a higher global score. Selection fitness comes from fixed screen games. Holdout fitness is separate and appears only for representative elites.</p>
<div class="axis">Patience: late-score share (higher rows score more in the final third)</div>
<div class="grid">${cells.join('\n')}</div>
<div class="axis">Chain style: mean chain length (left = many smaller chains, right = fewer larger chains)</div>
<section><h2>Representative elites</h2>${representatives}</section>
</body></html>`;
}

function validateArtifact(artifact) {
  const screenSeeds = artifact.config && artifact.config.screen && artifact.config.screen.seeds;
  const holdoutSeeds = artifact.config && artifact.config.holdout && artifact.config.holdout.seeds;
  if (!Array.isArray(screenSeeds) || !Array.isArray(holdoutSeeds)) throw new Error('screen and holdout seeds are required');
  const screenSet = new Set(screenSeeds);
  if (holdoutSeeds.some((seed) => screenSet.has(seed))) throw new Error('screen and holdout seeds overlap');
  if (!Array.isArray(artifact.archive) || artifact.archive.length < 3) throw new Error('archive needs at least three occupied cells');
  const chainBins = new Set(artifact.archive.map((elite) => elite.cell.split(',')[0]));
  const patienceBins = new Set(artifact.archive.map((elite) => elite.cell.split(',')[1]));
  if (chainBins.size < 2 || patienceBins.size < 2) throw new Error('archive does not span both behavior axes');
  if (!Array.isArray(artifact.representatives) || artifact.representatives.length < 3) {
    throw new Error('at least three representatives are required');
  }
  const representativeCells = new Set();
  for (const representative of artifact.representatives) {
    if (!representative.holdout || !Number.isFinite(representative.holdout.fitness)) {
      throw new Error(`representative ${representative.policyId} is missing holdout evidence`);
    }
    const elite = artifact.archive.find((entry) => entry.policyId === representative.policyId);
    if (!elite || elite.cell !== representative.cell) throw new Error(`representative ${representative.policyId} is not its archived elite`);
    representativeCells.add(representative.cell);
  }
  if (representativeCells.size < 3) throw new Error('representatives must occupy distinct cells');
  return {
    occupiedCells: artifact.archive.length,
    chainBins: chainBins.size,
    patienceBins: patienceBins.size,
    representatives: artifact.representatives.length,
  };
}

module.exports = {
  axesFromPilot, buildAxis, cellForBehavior, placeElite, policyIdentity, renderMapHtml,
  validateArtifact,
};
