const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  applyGravity,
  checkBombs,
  executeChain,
  findGreedyChains,
  makeRng,
} = require('../../solver/engine');

const RESULT = 'RESULT-0048';
const ROOT = path.join(__dirname, '..', '..');
const WIDTH = 5;
const HEIGHT = 8;
const MOVE_LIMIT = 16;
const BOARD_COUNT = 4096;
const FIRST_SEED = 44000000;
const FAMILIES = Object.freeze([3, 5, 7, 9]);
const SPAWN_ARMS = Object.freeze([
  Object.freeze({ id: 'blue-only', familyRate: 0 }),
  Object.freeze({ id: 'mixed-25', familyRate: 0.25 }),
  Object.freeze({ id: 'mixed-50', familyRate: 0.5 }),
  Object.freeze({ id: 'mixed-75', familyRate: 0.75 }),
]);
const TEMPLATES = Object.freeze([
  Object.freeze({ id: 'horizontal-2', separatorRows: [3], separatorCols: [] }),
  Object.freeze({ id: 'horizontal-3', separatorRows: [2, 5], separatorCols: [] }),
  Object.freeze({ id: 'horizontal-4', separatorRows: [1, 3, 5], separatorCols: [] }),
  Object.freeze({ id: 'vertical-2', separatorRows: [], separatorCols: [2] }),
  Object.freeze({ id: 'vertical-3', separatorRows: [], separatorCols: [1, 3] }),
]);
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0048/subject.js',
  'experiments/RESULT-0048/run.js',
  'experiments/RESULT-0048/recompute.js',
  'experiments/RESULT-0048/verify.js',
  'experiments/RESULT-0048/subject.test.js',
  'experiments/RESULT-0048/verify.test.js',
  'solver/engine.js',
  'src/game.js',
  'solver/experiment-guard.js',
  'tools/verify-experiments.js',
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

function fileHash(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function familyRoot(value) {
  let root = Math.abs(Math.trunc(value));
  while (root > 1 && root % 2 === 0) root /= 2;
  return root === 1 ? 2 : root;
}

function stageMultiplier(rng) {
  const draw = rng();
  if (draw < 0.6) return 1;
  if (draw < 0.9) return 2;
  return 4;
}

function makeTile(x, y, value, origin) {
  return {
    x, y, value, origin, conversionId: null,
    blocker: null, blockerDuration: 0, bombTimer: 0,
  };
}

function isSeparator(template, x, y) {
  return template.separatorRows.includes(y) || template.separatorCols.includes(x);
}

function createOpening(seed, targetFamily, template) {
  const rng = makeRng(seed);
  const grid = [];
  for (let y = 0; y < HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      const separator = isSeparator(template, x, y);
      const root = separator ? 2 : targetFamily;
      grid[y][x] = makeTile(
        x,
        y,
        root * stageMultiplier(rng),
        separator ? 'opening-blue' : 'opening-target',
      );
    }
  }
  return {
    grid,
    gridWidth: WIDTH,
    gridHeight: HEIGHT,
    score: 0,
    moves: 0,
    maxMoves: MOVE_LIMIT,
    targetScore: Number.MAX_SAFE_INTEGER,
    minChain: 2,
    tileScale: 1,
  };
}

function targetComponents(state, targetFamily) {
  const visited = new Set();
  const components = [];
  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      const key = `${x}:${y}`;
      if (!tile || familyRoot(tile.value) !== targetFamily || visited.has(key)) continue;
      const queue = [tile];
      const members = [];
      visited.add(key);
      while (queue.length) {
        const current = queue.shift();
        members.push(current);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (nx < 0 || nx >= state.gridWidth || ny < 0 || ny >= state.gridHeight) continue;
            const neighbor = state.grid[ny][nx];
            const neighborKey = `${nx}:${ny}`;
            if (!neighbor || familyRoot(neighbor.value) !== targetFamily || visited.has(neighborKey)) continue;
            visited.add(neighborKey);
            queue.push(neighbor);
          }
        }
      }
      let equalPair = false;
      for (const member of members) {
        for (let dy = -1; dy <= 1 && !equalPair; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = state.grid[member.y + dy]?.[member.x + dx];
            if (neighbor && neighbor.value === member.value && familyRoot(neighbor.value) === targetFamily) {
              equalPair = true;
              break;
            }
          }
        }
      }
      components.push({ size: members.length, viable: equalPair });
    }
  }
  return components;
}

function measureState(state, targetFamily) {
  const counts = { target: 0, blue: 0, otherRecognized: 0, neutral: 0 };
  for (const row of state.grid) {
    for (const tile of row) {
      if (!tile) continue;
      const root = familyRoot(tile.value);
      if (root === targetFamily) counts.target += 1;
      else if (root === 2) counts.blue += 1;
      else if (FAMILIES.includes(root)) counts.otherRecognized += 1;
      else counts.neutral += 1;
    }
  }
  const components = targetComponents(state, targetFamily);
  return {
    ...counts,
    componentCount: components.length,
    viableComponents: components.filter(({ viable }) => viable).length,
    largestComponent: components.length ? Math.max(...components.map(({ size }) => size)) : 0,
  };
}

function spawnMixed(state, rng, targetFamily, familyRate) {
  let familySpawned = 0;
  let blueSpawned = 0;
  for (let x = 0; x < state.gridWidth; x++) {
    for (let y = 0; y < state.gridHeight; y++) {
      if (state.grid[y][x]) continue;
      const familyDraw = rng();
      const root = familyDraw < familyRate ? targetFamily : 2;
      const value = root * stageMultiplier(rng);
      state.grid[y][x] = makeTile(x, y, value, root === 2 ? 'blue-spawn' : 'family-spawn');
      if (root === 2) blueSpawned += 1;
      else familySpawned += 1;
    }
  }
  return { familySpawned, blueSpawned };
}

function chooseScreenMove(state) {
  return findGreedyChains(state, {
    limit: 1,
    preferMergeableSum: false,
    tieBreak: 'degree',
    pathWidth: 1,
  })[0]?.chain || null;
}

function summarizeChain(chain, targetFamily, move) {
  const values = chain.map(({ value }) => value);
  const roots = values.map(familyRoot);
  const sum = values.reduce((total, value) => total + value, 0);
  const conversion = roots.every((root) => root === 2) && familyRoot(sum) === targetFamily;
  const reusesConversion = chain.some(({ conversionId }) => conversionId !== null);
  return { move, values, roots, sum, outputRoot: familyRoot(sum), conversion, reusesConversion };
}

function simulateOpening({ seed, targetFamily, template, arm }) {
  const state = createOpening(seed, targetFamily, template);
  const spawnRng = makeRng((seed ^ 0x9e3779b9) >>> 0);
  const initial = measureState(state, targetFamily);
  const trace = [];
  let conversionCount = 0;
  let conversionRejoinCount = 0;

  for (let move = 1; move <= MOVE_LIMIT; move++) {
    const chain = chooseScreenMove(state);
    if (!chain) break;
    const chainSummary = summarizeChain(chain, targetFamily, move);
    const inheritedConversionIds = chain.map(({ conversionId }) => conversionId).filter(Boolean);
    executeChain(state, chain);
    const survivor = chain[chain.length - 1];
    if (chainSummary.conversion) {
      conversionCount += 1;
      survivor.origin = 'blue-conversion';
      survivor.conversionId = `${seed}:${arm.id}:${move}`;
    } else if (inheritedConversionIds.length) {
      conversionRejoinCount += 1;
      survivor.origin = 'conversion-rejoin';
      survivor.conversionId = inheritedConversionIds[0];
    }
    applyGravity(state);
    const spawned = spawnMixed(state, spawnRng, targetFamily, arm.familyRate);
    const measure = measureState(state, targetFamily);
    trace.push({
      move,
      score: state.score,
      chain: chainSummary,
      spawned,
      ...measure,
      conversionCount,
      conversionRejoinCount,
    });
    if (checkBombs(state)) break;
  }

  const afterTwo = trace[1] || trace[trace.length - 1] || { viableComponents: 0, target: 0 };
  const moveSix = trace[5] || trace[trace.length - 1] || { viableComponents: 0, target: 0 };
  const notWipedAfterTwo = afterTwo.viableComponents >= 2;
  const sustainedAtSix = trace.length >= 6 && moveSix.viableComponents >= 2 && moveSix.target >= 8;
  const firstRejoin = trace.find(({ conversionRejoinCount: count }) => count > 0) || null;
  const recommended = firstRejoin
    ? { moves: firstRejoin.move, target: firstRejoin.score }
    : sustainedAtSix
      ? { moves: 6, target: moveSix.score }
      : null;
  const familyArea = trace.reduce((sum, row) => sum + row.target, 0);

  return {
    arm: arm.id,
    familyRate: arm.familyRate,
    initial,
    movesPlayed: trace.length,
    finalScore: state.score,
    notWipedAfterTwo,
    sustainedAtSix,
    conversionCount,
    conversionRejoinCount,
    familyArea,
    recommended,
    trace,
  };
}

function boardSpec(index) {
  const seed = FIRST_SEED + index;
  const targetFamily = FAMILIES[index % FAMILIES.length];
  const template = TEMPLATES[Math.floor(index / FAMILIES.length) % TEMPLATES.length];
  return { index, seed, targetFamily, template };
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  BOARD_COUNT,
  FAMILIES,
  FIRST_SEED,
  HEIGHT,
  MOVE_LIMIT,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  SPAWN_ARMS,
  TEMPLATES,
  WIDTH,
  artifactWithIdentity,
  boardSpec,
  canonicalJson,
  createOpening,
  familyRoot,
  identity,
  measureState,
  simulateOpening,
  sourceHashes,
  spawnMixed,
  targetComponents,
};
