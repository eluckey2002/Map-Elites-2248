#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng,
  findGreedyChains,
} = require('../../solver/engine');
const { candidates } = require('../../solver/oracle/search');
const { transition, stateKey, witness } = require('../../solver/oracle/simulation');
const { rankState: harvestRankState } = require('../../solver/oracle/harvest-policy');
const {
  analyzeLandmarkFrontier,
  replayLandmarkRoute,
} = require('../../solver/landmark-frontier');
const { makeScaledFrozenSpawnValues } = require('../../solver/puzzle-descriptor-witness');
const {
  BREADTH_BINS,
  CELL_CAPACITY,
  GRID_SIZE,
  HARVEST_BINS,
  breadthBin,
  harvestBin,
  identity,
  pairedHarvestAdvantage,
  renderMapHtml,
  summarizeBreadth,
} = require('../../solver/board-map-elites-core');

const ROOT = path.resolve(__dirname, '../..');
const WIDTH = 5;
const HEIGHT = 8;
const MOVES = 16;
const MIN_CHAIN = 2;
const DEFAULT_COUNT = 80;
const FIRST_OPENING_SEED = 45_000_000;
const DESCRIPTOR_SEEDS = Object.freeze([45_100_000, 45_100_001, 45_100_002]);
const FAMILIES = Object.freeze([3, 5, 7, 9]);
const TEMPLATES = Object.freeze([
  Object.freeze({ id: 'horizontal-2', separatorRows: [3], separatorCols: [] }),
  Object.freeze({ id: 'horizontal-3', separatorRows: [2, 5], separatorCols: [] }),
  Object.freeze({ id: 'horizontal-4', separatorRows: [1, 3, 5], separatorCols: [] }),
  Object.freeze({ id: 'vertical-2', separatorRows: [], separatorCols: [2] }),
  Object.freeze({ id: 'vertical-3', separatorRows: [], separatorCols: [1, 3] }),
]);
const LANDMARK_OPTIONS = Object.freeze({
  mode: 'bounded', maxNodes: 1, beamWidth: 1, actionsPerState: 32,
  pathWidth: 3, maxPathStates: 100000, maxResults: 128, maxMoves: 1,
});
const ORACLE_MAX_EXPANDED_STATES = 600;

function makeTile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stageMultiplier(rng) {
  const draw = rng();
  if (draw < 0.6) return 1;
  if (draw < 0.9) return 2;
  return 4;
}

function isSeparator(template, x, y) {
  return template.separatorRows.includes(y) || template.separatorCols.includes(x);
}

function candidateSpec(index) {
  const family = FAMILIES[index % FAMILIES.length];
  const template = TEMPLATES[Math.floor(index / FAMILIES.length) % TEMPLATES.length];
  const openingSeed = FIRST_OPENING_SEED + index;
  return {
    name: `family-${family}-${template.id}-${String(index).padStart(3, '0')}`,
    level: 6_100 + index,
    target: family * 160,
    tileScale: 1,
    moves: MOVES,
    minChain: MIN_CHAIN,
    gridW: WIDTH,
    gridH: HEIGHT,
    blockers: [],
    family,
    template: template.id,
    openingSeed,
    landmark: family * 16,
  };
}

function openingValues(candidate) {
  const template = TEMPLATES.find(({ id }) => id === candidate.template);
  if (!template) throw new Error(`unknown template ${candidate.template}`);
  const rng = makeRng(candidate.openingSeed);
  return Array.from({ length: HEIGHT }, (_, y) => Array.from({ length: WIDTH }, (_, x) => {
    const root = isSeparator(template, x, y) ? 2 : candidate.family;
    return root * stageMultiplier(rng);
  }));
}

function createOpeningState(candidate) {
  const values = openingValues(candidate);
  return {
    grid: values.map((row, y) => row.map((value, x) => makeTile(x, y, value))),
    gridWidth: WIDTH,
    gridHeight: HEIGHT,
    score: 0,
    moves: 0,
    maxMoves: candidate.moves,
    targetScore: candidate.target,
    minChain: candidate.minChain,
    tileScale: candidate.tileScale,
  };
}

function createRoot(candidate, spawnSeed) {
  const rng = makeRng(spawnSeed);
  const state = createOpeningState(candidate);
  const draws = Array.from({ length: candidate.moves * (WIDTH * HEIGHT - 1) }, rng);
  return { state, draws, cursor: 0, parent: null, action: null };
}

function immediateRankState(state) {
  return state.score;
}

function retainBeam(nodes, width, weight, rankStateFn) {
  const all = [...nodes.values()];
  const scoreOrder = (a, b) => b.state.score - a.state.score;
  const result = all.slice().sort(scoreOrder).slice(0, Math.ceil(width / 3));
  const kept = new Set(result);
  for (const node of all) node.rank = rankStateFn(node.state, { potentialWeight: weight });
  all.sort((a, b) => b.rank - a.rank || scoreOrder(a, b));
  for (const node of all) {
    if (result.length >= width) break;
    if (!kept.has(node)) { result.push(node); kept.add(node); }
  }
  return result;
}

function searchOpening(candidate, spawnSeed, rankStateFn) {
  const root = createRoot(candidate, spawnSeed);
  const stats = { expandedStates: 0, generatedActions: 0, completedPasses: 0 };
  let best = null;
  for (const width of [16, 48, 128, 256]) {
    for (const variant of [0, 1, 2]) {
      let frontier = [root];
      for (let depth = 0; depth < (best ? best.movesUsed - 1 : candidate.moves); depth++) {
        const next = new Map();
        for (const current of frontier) {
          if (stats.expandedStates >= ORACLE_MAX_EXPANDED_STATES) break;
          stats.expandedStates += 1;
          for (const action of candidates(current.state, 48, variant)) {
            stats.generatedActions += 1;
            const successor = transition(current, action.chain, root.draws);
            if (successor.terminal === 'win') {
              if (!best || successor.state.moves < best.movesUsed) {
                best = { ...witness(successor), outcome: 'win' };
              }
              continue;
            }
            if (successor.terminal) continue;
            const key = stateKey(successor);
            const previous = next.get(key);
            if (!previous || previous.state.score < successor.state.score) next.set(key, successor);
          }
        }
        if (stats.expandedStates >= ORACLE_MAX_EXPANDED_STATES || next.size === 0) break;
        frontier = retainBeam(next, width, variant ? 4 : 1, rankStateFn);
      }
      if (stats.expandedStates < ORACLE_MAX_EXPANDED_STATES) stats.completedPasses += 1;
    }
  }
  return {
    best,
    stats,
    terminationReason: stats.expandedStates >= ORACLE_MAX_EXPANDED_STATES
      ? 'work-budget' : 'portfolio-complete',
  };
}

function replayOpeningWitness(candidate, spawnSeed, recorded) {
  let node = createRoot(candidate, spawnSeed);
  const draws = node.draws;
  for (const action of recorded.chains) {
    const chain = action.tiles.map(({ x, y, value }) => {
      const tile = node.state.grid[y]?.[x];
      if (!tile || tile.value !== value) throw new Error('witness diverged from family opening');
      return tile;
    });
    node = transition(node, chain, draws);
  }
  if (node.terminal !== 'win') throw new Error('witness does not reach the target');
  if (node.state.score !== recorded.score || node.state.moves !== recorded.movesUsed) {
    throw new Error('witness result mismatch');
  }
}

function measureBreadth(candidate) {
  const rows = DESCRIPTOR_SEEDS.map((seed) => {
    const rng = makeRng(seed);
    const puzzle = {
      state: createOpeningState(candidate),
      spawnValues: makeScaledFrozenSpawnValues(candidate, rng),
      spawnCursor: 0,
    };
    const result = analyzeLandmarkFrontier({
      ...puzzle,
      landmark: candidate.landmark,
      options: LANDMARK_OPTIONS,
    });
    for (const route of result.routes) {
      replayLandmarkRoute({ ...puzzle, landmark: candidate.landmark }, route);
    }
    return {
      seed,
      standing: result.standing,
      complete: result.complete,
      distinctOutcomeCountLowerBound: result.distinctOutcomeCountLowerBound,
      routes: result.routes,
      diagnostics: result.diagnostics,
    };
  });
  return { ...summarizeBreadth(rows), landmark: candidate.landmark, rows };
}

function measureHarvest(candidate) {
  const policies = [
    { id: 'immediate', rankStateFn: immediateRankState },
    { id: 'harvest', rankStateFn: harvestRankState },
  ];
  const rows = [];
  for (const seed of DESCRIPTOR_SEEDS) {
    for (const policy of policies) {
      const result = searchOpening(candidate, seed, policy.rankStateFn);
      if (result.best) replayOpeningWitness(candidate, seed, result.best);
      rows.push({
        seed,
        policy: policy.id,
        standing: result.best ? 'replayed_win' : 'UNKNOWN',
        moves: result.best?.movesUsed ?? null,
        score: result.best?.score ?? null,
        expandedStates: result.stats.expandedStates,
        generatedActions: result.stats.generatedActions,
        terminationReason: result.terminationReason,
        witness: result.best,
      });
    }
  }
  return { ...pairedHarvestAdvantage(rows, candidate.moves), rows };
}

function evaluateCandidate(candidate) {
  const breadth = measureBreadth(candidate);
  const harvest = measureHarvest(candidate);
  const immediateRows = harvest.rows.filter(({ policy }) => policy === 'immediate');
  const immediateWins = immediateRows.filter(({ moves }) => moves !== null).length;
  const boardIdentity = identity({
    family: candidate.family,
    template: candidate.template,
    openingSeed: candidate.openingSeed,
    openingValues: openingValues(candidate),
    target: candidate.target,
    moves: candidate.moves,
  });
  return {
    candidate: { ...candidate, openingValues: openingValues(candidate) },
    boardIdentity,
    eligible: true,
    quality: {
      rule: 'lower bounded immediate-policy win rate ranks first; exploratory only',
      winRate: immediateWins / DESCRIPTOR_SEEDS.length,
    },
    descriptors: { breadth, harvest },
  };
}

function cellFor(evaluation) {
  return `${evaluation.descriptors.breadth.bin.index},${evaluation.descriptors.harvest.bin.index}`;
}

function buildArchive(evaluations) {
  const cells = new Map();
  for (const evaluation of evaluations) {
    const cell = cellFor(evaluation);
    const current = cells.get(cell) || [];
    current.push(evaluation);
    current.sort((a, b) => a.quality.winRate - b.quality.winRate
      || a.boardIdentity.localeCompare(b.boardIdentity));
    cells.set(cell, current.slice(0, CELL_CAPACITY));
  }
  return [...cells.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([cell, elites]) => ({
      cell,
      elites: elites.map((entry, index) => ({
        boardIdentity: entry.boardIdentity,
        candidate: entry.candidate,
        quality: entry.quality,
        descriptors: {
          breadth: {
            standing: entry.descriptors.breadth.standing,
            value: entry.descriptors.breadth.value,
            bin: breadthBin(entry.descriptors.breadth.value),
          },
          harvest: {
            standing: entry.descriptors.harvest.standing,
            value: entry.descriptors.harvest.value,
            bin: harvestBin(entry.descriptors.harvest.value),
          },
        },
        rank: index + 1,
      })),
    }));
}

function parseCount(argv) {
  const index = argv.indexOf('--count');
  if (index === -1) return DEFAULT_COUNT;
  const count = Number(argv[index + 1]);
  if (!Number.isInteger(count) || count < 1 || count > 400) throw new Error('--count must be 1-400');
  return count;
}

function main(argv = process.argv.slice(2)) {
  const count = parseCount(argv);
  const evaluations = [];
  for (let index = 0; index < count; index++) {
    const candidate = candidateSpec(index);
    process.stderr.write(`family map ${index + 1}/${count}: ${candidate.name}\n`);
    evaluations.push(evaluateCandidate(candidate));
  }
  const archive = buildArchive(evaluations);
  const baselinePath = path.join(ROOT, 'experiments/RESULT-0046/output/archive.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const baselineCells = new Set(baseline.archive.map(({ cell }) => cell));
  const familyCells = new Set(archive.map(({ cell }) => cell));
  const newCells = [...familyCells].filter((cell) => !baselineCells.has(cell)).sort();
  const unionCells = new Set([...baselineCells, ...familyCells]);
  const body = {
    schemaVersion: 1,
    kind: 'exploratory-family-board-map-elites',
    proofStanding: 'exploratory prototype; not registered evidence or a gameplay adoption',
    config: {
      gridSize: GRID_SIZE,
      cellCapacity: CELL_CAPACITY,
      axes: { breadth: BREADTH_BINS, harvest: HARVEST_BINS },
      candidateCount: count,
      dimensions: `${WIDTH}x${HEIGHT}`,
      moves: MOVES,
      minChain: MIN_CHAIN,
      families: FAMILIES,
      templates: TEMPLATES.map(({ id }) => id),
      openingSeedRange: [FIRST_OPENING_SEED, FIRST_OPENING_SEED + count - 1],
      descriptorSeeds: DESCRIPTOR_SEEDS,
      spawning: 'ordinary blue-only 2/4/8 refills',
      targetRule: 'family root × 160',
      landmarkRule: 'family root × 16',
      baselineStrategy: 'owner build-and-harvest; immediate and harvest bounded rankers are map instruments, not human proxies',
    },
    evaluations,
    archive,
    comparison: {
      baselineArtifactIdentity: baseline.artifactIdentity,
      baselineOccupiedCells: baselineCells.size,
      familyOccupiedCells: familyCells.size,
      newCells,
      unionOccupiedCells: unionCells.size,
    },
  };
  const artifact = { ...body, artifactIdentity: identity(body) };
  const out = path.join(__dirname, 'output');
  if (fs.existsSync(out)) throw new Error('refusing to overwrite prototypes/family-map-elites/output');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'archive.json'), `${JSON.stringify(artifact)}\n`);
  fs.writeFileSync(path.join(out, 'map.html'), renderMapHtml(artifact));
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    evaluated: evaluations.length,
    familyOccupiedCells: familyCells.size,
    newCells,
    unionOccupiedCells: unionCells.size,
  })}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; }
}

module.exports = {
  buildArchive,
  candidateSpec,
  createOpeningState,
  evaluateCandidate,
  openingValues,
  replayOpeningWitness,
  searchOpening,
};
