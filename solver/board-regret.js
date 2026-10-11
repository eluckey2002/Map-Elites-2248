// Baseline regret: how many moves the owner's usual build-and-harvest play
// gives away on a board, against the best plan this measurement can replay.
//
// The baseline is the shipped bot's target-stop rollout (human-benchmark's
// playBot). PDL-008 ties build-and-harvest to the owner's captured play; the
// bot is a proxy for it, not the owner, and the owner has beaten it on every
// captured board-search playtest. The best plan is the cheapest of the
// baseline itself and the two replayed oracle witnesses that the harvest axis
// already searches for, so regret is never negative and is a replayed lower
// bound on true regret: a better unfound plan can only raise it.
const { playBot } = require('./human-benchmark');

// Frozen before the reportable run. Fractions of the move budget.
const REGRET_BINS = Object.freeze([
  { index: 0, minimum: 0, maximum: 0.01, label: 'baseline within 1% of the best found' },
  { index: 1, minimum: 0.01, maximum: 0.03, label: 'baseline 1–3% behind' },
  { index: 2, minimum: 0.03, maximum: 0.06, label: 'baseline 3–6% behind' },
  { index: 3, minimum: 0.06, maximum: 0.1, label: 'baseline 6–10% behind' },
  { index: 4, minimum: 0.1, maximum: 0.15, label: 'baseline 10–15% behind' },
  { index: 5, minimum: 0.15, maximum: 0.25, label: 'baseline 15–25% behind' },
  { index: 6, minimum: 0.25, maximum: 1.000000000001, label: 'baseline ≥25% behind' },
]);

function regretBin(value) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`regret must be a finite non-negative number, got ${value}`);
  const bin = REGRET_BINS.find(({ minimum, maximum }) => value >= minimum && value < maximum);
  if (!bin) throw new Error(`regret ${value} is outside the frozen bins`);
  return bin.index;
}

// baselineRows: [{seed, outcome, moves}] from playBot.
// harvestPairs: pairedHarvestAdvantage(...).pairs (immediateCost, harvestCost per seed).
function baselineRegret(baselineRows, harvestPairs, maxMoves) {
  if (!Number.isInteger(maxMoves) || maxMoves < 1) throw new Error('maxMoves must be positive');
  if (!Array.isArray(baselineRows) || !baselineRows.length) throw new Error('baseline rows are required');
  const pairsBySeed = new Map(harvestPairs.map((pair) => [pair.seed, pair]));
  if (pairsBySeed.size !== harvestPairs.length) throw new Error('duplicate harvest pair seed');
  const seen = new Set();
  const rows = [...baselineRows].sort((a, b) => a.seed - b.seed).map((row) => {
    if (seen.has(row.seed)) throw new Error(`duplicate baseline row for seed ${row.seed}`);
    seen.add(row.seed);
    const pair = pairsBySeed.get(row.seed);
    if (!pair) throw new Error(`no harvest pair for baseline seed ${row.seed}`);
    const baselineCost = row.outcome === 'win' ? row.moves : maxMoves + 1;
    const bestCost = Math.min(baselineCost, pair.immediateCost, pair.harvestCost);
    return {
      seed: row.seed,
      baselineOutcome: row.outcome,
      baselineCost,
      bestCost,
      bestSource: bestCost === baselineCost ? 'baseline' : bestCost === pair.harvestCost ? 'harvest witness' : 'immediate witness',
      regret: (baselineCost - bestCost) / maxMoves,
    };
  });
  if (rows.length !== pairsBySeed.size) throw new Error('baseline and harvest seed panels differ');
  const value = rows.reduce((sum, row) => sum + row.regret, 0) / rows.length;
  return {
    standing: 'replayed_lower_bound_against_bot_proxy',
    value,
    aggregation: 'mean over seeds of (baseline cost − cheapest of baseline, immediate witness, harvest witness) / move budget; a loss costs maxMoves + 1',
    rows,
    bin: regretBin(value),
  };
}

function measureRegret(candidate, seeds, harvest, play = playBot) {
  const baselineRows = seeds.map((seed) => {
    const result = play(candidate, seed);
    return { seed, outcome: result.outcome, moves: result.moves, score: result.score, reason: result.reason ?? null };
  });
  return { ...baselineRegret(baselineRows, harvest.pairs, candidate.moves), baselineRows };
}

module.exports = { REGRET_BINS, regretBin, baselineRegret, measureRegret };
