const crypto = require('node:crypto');
const { REGRET_BINS, regretBin } = require('./board-regret');

const GRID_SIZE = 7;
const CELL_CAPACITY = 3;

const SOURCE_PATHS = Object.freeze([
  'solver/board-map-elites-core.js',
  'solver/board-map-elites.js',
  'solver/verify-board-map-elites.js',
  'solver/landmark-frontier.js',
  'solver/puzzle-descriptor-witness.js',
  'solver/board-regret.js',
  'solver/human-benchmark.js',
  'solver/recording-replay.js',
  'solver/oracle/harvest-policy.js',
  'solver/oracle/search.js',
  'solver/oracle/simulation.js',
  'solver/oracle/verify.js',
  'solver/generate-levels.js',
  'solver/level-author.js',
  'solver/calibrations/calib-1.js',
  'solver/bot.js',
  'solver/benchmark-replay.js',
  'solver/engine.js',
  'solver/experiment-guard.js',
  'src/game.js',
]);

// Frozen before the reportable board run. Breadth is a replayed lower bound,
// so the last bin means "at least 128", never "exactly 128 or more".
const BREADTH_BINS = Object.freeze([
  { index: 0, minimum: 0, maximum: 1, label: '0 verified routes (may be UNKNOWN)' },
  { index: 1, minimum: 1, maximum: 2, label: '1 route' },
  { index: 2, minimum: 2, maximum: 4, label: '2–3 routes' },
  { index: 3, minimum: 4, maximum: 8, label: '4–7 routes' },
  { index: 4, minimum: 8, maximum: 16, label: '8–15 routes' },
  { index: 5, minimum: 16, maximum: 32, label: '16–31 routes' },
  { index: 6, minimum: 32, maximum: Number.MAX_SAFE_INTEGER, label: '32+ routes' },
]);

// Positive values mean the harvesting ranker reached the target with lower
// paired move cost. A no-witness cell receives maxMoves + 1 as a bounded-search
// penalty; it is still labelled UNKNOWN, not treated as proof of no solution.
const HARVEST_BINS = Object.freeze([
  { index: 0, minimum: -1, maximum: -0.15, label: 'immediate ≥15% better' },
  { index: 1, minimum: -0.15, maximum: -0.05, label: 'immediate 5–15% better' },
  { index: 2, minimum: -0.05, maximum: -0.01, label: 'immediate 1–5% better' },
  { index: 3, minimum: -0.01, maximum: 0.01, label: 'within 1%' },
  { index: 4, minimum: 0.01, maximum: 0.05, label: 'harvesting 1–5% better' },
  { index: 5, minimum: 0.05, maximum: 0.15, label: 'harvesting 5–15% better' },
  { index: 6, minimum: 0.15, maximum: 1.000000000001, label: 'harvesting ≥15% better' },
]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function boardDefinition(candidate) {
  return {
    level: candidate.level,
    target: candidate.target,
    tileScale: candidate.tileScale,
    moves: candidate.moves,
    minChain: candidate.minChain,
    gridW: candidate.gridW,
    gridH: candidate.gridH,
    blockers: candidate.blockers,
  };
}

function boardIdentity(candidate) {
  return identity(boardDefinition(candidate));
}

function binFor(value, bins, name) {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  const bin = bins.find(({ minimum, maximum }) => value >= minimum && value < maximum);
  if (!bin) throw new Error(`${name} ${value} is outside the frozen axis`);
  return bin;
}

function breadthBin(value) {
  return binFor(value, BREADTH_BINS, 'successful plan breadth');
}

function harvestBin(value) {
  return binFor(value, HARVEST_BINS, 'harvesting advantage');
}

function median(values) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error('median requires finite values');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarizeBreadth(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('breadth rows are required');
  if (rows.some((row) => row.distinctOutcomeCountLowerBound < 0)) throw new Error('breadth lower bounds cannot be negative');
  const counts = rows.map(({ distinctOutcomeCountLowerBound }) => distinctOutcomeCountLowerBound);
  const value = median(counts);
  const hasUnknown = rows.some(({ standing }) => standing === 'UNKNOWN');
  return {
    standing: rows.every(({ complete }) => complete) ? 'exact_result'
      : hasUnknown ? 'bounded_lower_bound_with_UNKNOWN_rows' : 'replayed_lower_bound',
    value,
    aggregation: 'median distinct verified outcome lower bound across the fixed seed panel',
    bin: breadthBin(value),
  };
}

function pairedHarvestAdvantage(rows, maxMoves) {
  if (!Number.isInteger(maxMoves) || maxMoves < 1) throw new Error('maxMoves must be positive');
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('harvest rows are required');
  const bySeed = new Map();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.seed)) throw new Error('harvest row seed is required');
    if (!['immediate', 'harvest'].includes(row.policy)) throw new Error(`unknown harvest policy ${row.policy}`);
    const pair = bySeed.get(row.seed) || {};
    if (pair[row.policy]) throw new Error(`duplicate ${row.policy} row for seed ${row.seed}`);
    pair[row.policy] = row;
    bySeed.set(row.seed, pair);
  }
  const pairs = [...bySeed.entries()].sort((a, b) => a[0] - b[0]).map(([seed, pair]) => {
    if (!pair.immediate || !pair.harvest) throw new Error(`unpaired harvest comparison at seed ${seed}`);
    const immediateCost = pair.immediate.moves ?? maxMoves + 1;
    const harvestCost = pair.harvest.moves ?? maxMoves + 1;
    return {
      seed,
      immediateStanding: pair.immediate.moves === null ? 'UNKNOWN' : 'replayed_win',
      harvestStanding: pair.harvest.moves === null ? 'UNKNOWN' : 'replayed_win',
      immediateCost,
      harvestCost,
      normalizedAdvantage: (immediateCost - harvestCost) / maxMoves,
    };
  });
  const value = pairs.reduce((sum, pair) => sum + pair.normalizedAdvantage, 0) / pairs.length;
  return {
    standing: 'paired_bounded_search_proxy',
    value,
    aggregation: 'mean paired normalized move-cost advantage; no-witness costs maxMoves + 1 and remains UNKNOWN',
    pairs,
    bin: harvestBin(value),
  };
}

function qualityCompare(a, b) {
  return a.quality.winRate - b.quality.winRate
    || a.boardIdentity.localeCompare(b.boardIdentity);
}

// The map is breadth (x) by baseline regret (y), the owner's choice on
// 2026-10-11. Harvest stays recorded: regret is built from its witnesses and
// the protocol reports how far the two axes agree.
function cellFor(evaluation) {
  if (!evaluation.descriptors?.breadth?.bin || !Number.isInteger(evaluation.descriptors?.regret?.bin)) {
    throw new Error('eligible evaluation needs both descriptor bins');
  }
  return `${evaluation.descriptors.breadth.bin.index},${evaluation.descriptors.regret.bin}`;
}

function placeElite(archive, evaluation, capacity = CELL_CAPACITY) {
  if (!(archive instanceof Map)) throw new Error('archive must be a Map');
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity must be positive');
  const cell = cellFor(evaluation);
  const current = archive.get(cell) || [];
  const duplicate = current.find(({ boardIdentity: candidate }) => candidate === evaluation.boardIdentity);
  if (duplicate) return { admitted: false, reason: 'duplicate-board', cell };
  const ranked = [...current, evaluation].sort(qualityCompare).slice(0, capacity);
  archive.set(cell, ranked);
  return {
    admitted: ranked.some(({ boardIdentity: candidate }) => candidate === evaluation.boardIdentity),
    reason: ranked.length === current.length ? 'not-top-three' : 'admitted',
    cell,
  };
}

function buildArchive(evaluations, capacity = CELL_CAPACITY) {
  const archive = new Map();
  const seen = new Set();
  for (const evaluation of evaluations) {
    if (!evaluation.eligible) continue;
    if (seen.has(evaluation.boardIdentity)) throw new Error(`duplicate evaluated board ${evaluation.boardIdentity}`);
    seen.add(evaluation.boardIdentity);
    placeElite(archive, evaluation, capacity);
  }
  return [...archive.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([cell, elites]) => ({
      cell,
      elites: elites.map((entry, rank) => ({
        boardIdentity: entry.boardIdentity,
        candidate: entry.candidate,
        quality: entry.quality,
        descriptors: {
          breadth: {
            standing: entry.descriptors.breadth.standing,
            value: entry.descriptors.breadth.value,
            bin: entry.descriptors.breadth.bin,
          },
          regret: {
            standing: entry.descriptors.regret.standing,
            value: entry.descriptors.regret.value,
            bin: entry.descriptors.regret.bin,
          },
          harvest: {
            standing: entry.descriptors.harvest.standing,
            value: entry.descriptors.harvest.value,
            bin: entry.descriptors.harvest.bin,
          },
        },
        rank: rank + 1,
      })),
    }));
}

function ranks(values) {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array(values.length);
  for (let start = 0; start < order.length;) {
    let end = start;
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end++;
    for (let k = start; k <= end; k++) result[order[k].index] = (start + end) / 2 + 1;
    start = end + 1;
  }
  return result;
}

// Spearman rank correlation with average ranks for ties; null when either
// side is constant or there are fewer than three pairs.
function spearman(xs, ys) {
  if (xs.length !== ys.length) throw new Error('spearman needs paired values');
  if (xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mean = (xs.length + 1) / 2;
  let num = 0; let dx = 0; let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (rx[i] - mean) * (ry[i] - mean);
    dx += (rx[i] - mean) ** 2;
    dy += (ry[i] - mean) ** 2;
  }
  return dx === 0 || dy === 0 ? null : num / Math.sqrt(dx * dy);
}

// Frozen with the protocol: at least five occupied cells spanning at least
// two breadth bins and two regret bins. The regret/harvest rank correlation
// is the redundancy control, reported and never part of the premise.
function summarizeRun(screened, evaluations, archive) {
  const eligible = evaluations.filter((entry) => entry.eligible);
  const occupiedBreadthBins = new Set(archive.map(({ cell }) => cell.split(',')[0])).size;
  const occupiedRegretBins = new Set(archive.map(({ cell }) => cell.split(',')[1])).size;
  const rho = spearman(eligible.map(({ descriptors }) => descriptors.regret.value),
    eligible.map(({ descriptors }) => descriptors.harvest.value));
  return {
    screened: screened.length,
    screenSurvivors: screened.filter(({ rejection }) => !rejection).length,
    evaluated: evaluations.length,
    eligible: eligible.length,
    occupiedCells: archive.length,
    occupiedBreadthBins,
    occupiedRegretBins,
    regretHarvestSpearman: rho === null ? null : Number(rho.toFixed(6)),
    premise: archive.length >= 5 && occupiedBreadthBins >= 2 && occupiedRegretBins >= 2
      ? 'SUPPORTED_AT_BOUNDED_SCOPE' : 'DISCONFIRMED_AT_BOUNDED_SCOPE',
  };
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function renderMapHtml(artifact) {
  const byCell = new Map(artifact.archive.map((entry) => [entry.cell, entry.elites]));
  const cells = [];
  for (let y = GRID_SIZE - 1; y >= 0; y--) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = `${x},${y}`;
      const elites = byCell.get(cell) || [];
      const cards = elites.map((elite) => `<li><b>#${elite.rank} ${escapeHtml(elite.candidate.name)}</b><span>bot wins ${(elite.quality.winRate * 100).toFixed(1)}%</span><span>breadth ≥${elite.descriptors.breadth.value}</span><span>bot behind ${(elite.descriptors.regret.value * 100).toFixed(1)}%</span><span>harvest ${(elite.descriptors.harvest.value * 100).toFixed(1)}%</span><code>${elite.boardIdentity.slice(0, 10)}</code></li>`).join('');
      cells.push(`<article class="cell ${elites.length ? 'occupied' : 'empty'}" data-cell="${cell}"><h3>${cell}</h3>${elites.length ? `<ol>${cards}</ol>` : '<p>Empty</p>'}</article>`);
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Board MAP-Elites</title><style>
body{font:14px system-ui;margin:24px;background:#f4f6f8;color:#172033}h1{margin-bottom:6px}.note{max-width:80ch}.grid{display:grid;grid-template-columns:repeat(7,minmax(150px,1fr));gap:8px;min-width:1080px}.wrap{overflow:auto}.cell{min-height:150px;border:1px solid #ccd3dc;border-radius:10px;padding:10px;background:white}.empty{border-style:dashed;color:#7b8491}.cell h3{margin:0 0 8px}.cell ol{margin:0;padding-left:22px}.cell li{margin-bottom:8px}.cell span,.cell code{display:block;font-size:12px}code{color:#53606f}.axis{font-weight:700;margin:14px 0 8px}
</style></head><body><h1>7×7 Board MAP-Elites</h1><p class="note">Each cell retains up to three distinct viable board designs. X: successful plan breadth (verified 2048-outcome lower bound). Y: baseline regret (moves the shipped bot gives away against the cheapest replayed plan, as a share of the move budget; a lower bound). Empty cells are evidence, not errors.</p><p>Archive <code>${escapeHtml(artifact.artifactIdentity)}</code></p><div class="axis">Baseline regret ↑</div><div class="wrap"><div class="grid">${cells.join('')}</div></div><div class="axis">Successful plan breadth →</div></body></html>\n`;
}

module.exports = {
  BREADTH_BINS,
  CELL_CAPACITY,
  GRID_SIZE,
  HARVEST_BINS,
  REGRET_BINS,
  SOURCE_PATHS,
  boardDefinition,
  boardIdentity,
  breadthBin,
  buildArchive,
  canonicalJson,
  cellFor,
  harvestBin,
  identity,
  pairedHarvestAdvantage,
  placeElite,
  qualityCompare,
  regretBin,
  renderMapHtml,
  spearman,
  summarizeBreadth,
  summarizeRun,
};
