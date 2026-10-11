#!/usr/bin/env node
// Bounded landmark-route probe.
//
//   node solver/landmark-frontier.js --level 58 --seed 4255346895 --landmark 2048
//   node solver/landmark-frontier.js --input replayable-position.json --landmark 2048 --json
//
// An input position contains { state, spawnValues, spawnCursor }. Found routes
// are replayed before the CLI reports them. Counts are lower bounds; a miss is
// UNKNOWN unless an exact finite search completed.

const fs = require('node:fs');
const crypto = require('node:crypto');

const { LEVELS } = require('../src/game');
const {
  makeRng,
  createLevelState,
  cloneState,
  executeChain,
  applyGravity,
  tickBlockers,
  checkBombs,
  findGreedyChains,
  isBlockedTile,
  canExtendChain,
  isValidChain,
} = require('./engine');
const {
  ExactChainEnumerationLimitError,
  enumerateLegalChainsWithStats,
} = require('./exact-score');
const { makeScaledFrozenSpawnValues } = require('./puzzle-descriptor-witness');

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

function boardSnapshot(state) {
  return state.grid.map((row) => row.map((tile) => (tile ? {
    value: tile.value,
    blocker: tile.blocker,
    blockerDuration: tile.blockerDuration,
    bombTimer: tile.bombTimer,
  } : null)));
}

function boardIdentity(state) {
  return identity(boardSnapshot(state));
}

function searchStateIdentity(node) {
  return identity({
    board: boardSnapshot(node.state),
    cursor: node.cursor,
    moves: node.state.moves,
  });
}

function hasLandmark(state, landmark) {
  return state.grid.some((row) => row.some((tile) => tile && tile.value === landmark));
}

function snapshotChain(chain) {
  return chain.map(({ x, y, value }) => ({ x, y, value }));
}

function actionIdentity(chain) {
  const final = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map(({ x, y }) => `${x},${y}`)
    .sort()
    .join('|');
  return `${final.x},${final.y};${removed}`;
}

function boundedCandidates(state, { actionsPerState, pathWidth }) {
  const candidates = new Map();
  for (const preferMergeableSum of [true, false]) {
    for (const result of findGreedyChains(state, {
      limit: actionsPerState,
      pathWidth,
      preferMergeableSum,
    })) {
      const key = actionIdentity(result.chain);
      if (!candidates.has(key)) candidates.set(key, result.chain);
    }
  }
  return [...candidates.values()]
    .sort((a, b) => {
      const sumA = a.reduce((sum, tile) => sum + tile.value, 0);
      const sumB = b.reduce((sum, tile) => sum + tile.value, 0);
      return sumB - sumA || actionIdentity(a).localeCompare(actionIdentity(b));
    })
    .slice(0, actionsPerState);
}

// Enumerate actions that create the named tile directly. Positive tile values
// let the walk stop as soon as its sum reaches or exceeds the landmark. This
// keeps the probe aimed at the authored choice instead of hoping a generic
// high-score candidate generator happens to include it.
function directLandmarkChains(state, landmark, maxPathStates) {
  const actions = new Map();
  const pathStates = new Set();
  const stack = [];

  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      if (!tile || isBlockedTile(tile) || tile.value >= landmark) continue;
      const bit = 1n << BigInt(y * state.gridWidth + x);
      stack.push({ chain: [tile], mask: bit, sum: tile.value });
      pathStates.add(`${y * state.gridWidth + x}:${bit}`);
    }
  }

  let capped = false;
  while (stack.length) {
    if (pathStates.size >= maxPathStates) { capped = true; break; }
    const path = stack.pop();
    if (path.chain.length >= state.minChain && path.sum === landmark) {
      const key = actionIdentity(path.chain);
      if (!actions.has(key)) actions.set(key, path.chain);
      continue;
    }
    if (path.sum >= landmark) continue;
    const last = path.chain[path.chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = last.x + dx;
        const y = last.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const tile = state.grid[y][x];
        if (!tile || isBlockedTile(tile) || !canExtendChain(path.chain, tile)) continue;
        const bit = 1n << BigInt(y * state.gridWidth + x);
        if (path.mask & bit) continue;
        const mask = path.mask | bit;
        const key = `${y * state.gridWidth + x}:${mask}`;
        if (pathStates.has(key)) continue;
        pathStates.add(key);
        stack.push({ chain: [...path.chain, tile], mask, sum: path.sum + tile.value });
      }
    }
  }
  return { actions: [...actions.values()], visitedPathStates: pathStates.size, capped };
}

function candidateChains(state, landmark, options, diagnostics) {
  if (options.mode === 'bounded') {
    const direct = directLandmarkChains(state, landmark, options.maxPathStates);
    diagnostics.directLandmarkCalls += 1;
    if (!direct.capped) diagnostics.completeDirectLandmarkCalls += 1;
    diagnostics.visitedPathStates += direct.visitedPathStates;
    if (direct.capped) diagnostics.capReasons.add('landmark-path-states');
    const combined = new Map(direct.actions.map((chain) => [actionIdentity(chain), chain]));
    for (const chain of boundedCandidates(state, options)) {
      const key = actionIdentity(chain);
      if (!combined.has(key)) combined.set(key, chain);
    }
    return [...combined.values()];
  }
  try {
    const enumerated = enumerateLegalChainsWithStats(state, {
      maxPathStates: options.maxPathStates,
    });
    diagnostics.visitedPathStates += enumerated.visitedPathStates;
    return enumerated.actions;
  } catch (error) {
    if (!(error instanceof ExactChainEnumerationLimitError)) throw error;
    diagnostics.capReasons.add('path-states');
    diagnostics.visitedPathStates += error.visitedPathStates;
    return [];
  }
}

function spawnFrozenValues(state, values, cursor) {
  let nextCursor = cursor;
  for (let x = 0; x < state.gridWidth; x++) {
    for (let y = 0; y < state.gridHeight; y++) {
      if (state.grid[y][x]) continue;
      if (nextCursor >= values.length) throw new Error('frozen spawn stream exhausted');
      state.grid[y][x] = {
        x, y, value: values[nextCursor], blocker: null, blockerDuration: 0, bombTimer: 0,
      };
      nextCursor += 1;
    }
  }
  return nextCursor;
}

function applyAction(state, chainSnapshot, spawnValues, cursor) {
  const next = cloneState(state);
  const chain = chainSnapshot.map(({ x, y }) => next.grid[y] && next.grid[y][x]);
  if (chain.some((tile) => !tile)) throw new Error('route selects an unavailable tile');
  if (chain.some(isBlockedTile)) throw new Error('route selects a blocked tile');
  if (!isValidChain(chain, next.minChain)) throw new Error('route chain is shorter than the minimum');
  for (let index = 1; index < chain.length; index++) {
    const previous = chain[index - 1];
    const tile = chain[index];
    if (Math.abs(previous.x - tile.x) > 1 || Math.abs(previous.y - tile.y) > 1) {
      throw new Error('route contains a non-adjacent step');
    }
    if (!canExtendChain(chain.slice(0, index), tile)) {
      throw new Error('route violates the value-extension rule');
    }
  }
  const points = executeChain(next, chain);
  applyGravity(next);
  const nextCursor = spawnFrozenValues(next, spawnValues, cursor);
  tickBlockers(next);
  return { state: next, cursor: nextCursor, points };
}

function terminalReason(state) {
  if (checkBombs(state)) return 'bomb exploded';
  if (state.score >= state.targetScore) return 'target reached';
  if (state.moves >= state.maxMoves) return 'out of moves';
  return null;
}

function maximumTile(state) {
  return Math.max(...state.grid.flat().filter(Boolean).map(({ value }) => value), 0);
}

function rankNode(node, landmark) {
  const values = node.state.grid.flat().filter(Boolean).map(({ value }) => value);
  const closest = Math.max(...values.filter((value) => value <= landmark), 0);
  const exactIngredients = values.filter((value) => landmark % value === 0).reduce((sum, value) => sum + value, 0);
  return closest * 1_000_000 + exactIngredients * 100 + node.state.score;
}

function normalizeOptions(options = {}) {
  const normalized = {
    mode: options.mode || 'bounded',
    maxNodes: options.maxNodes === undefined ? 2_000 : options.maxNodes,
    beamWidth: options.beamWidth === undefined ? 64 : options.beamWidth,
    actionsPerState: options.actionsPerState === undefined ? 32 : options.actionsPerState,
    pathWidth: options.pathWidth === undefined ? 2 : options.pathWidth,
    maxPathStates: options.maxPathStates === undefined ? 100_000 : options.maxPathStates,
    maxResults: options.maxResults === undefined ? 32 : options.maxResults,
    maxMoves: options.maxMoves,
  };
  if (!['exact', 'bounded'].includes(normalized.mode)) throw new Error('mode must be exact or bounded');
  for (const name of ['maxNodes', 'beamWidth', 'actionsPerState', 'pathWidth', 'maxPathStates', 'maxResults']) {
    if (!Number.isSafeInteger(normalized[name]) || normalized[name] < 1) {
      throw new Error(`${name} must be a positive integer`);
    }
  }
  if (normalized.maxMoves !== undefined
    && (!Number.isSafeInteger(normalized.maxMoves) || normalized.maxMoves < 0)) {
    throw new Error('maxMoves must be a non-negative integer');
  }
  return normalized;
}

function analyzeLandmarkFrontier({ state, spawnValues, spawnCursor = 0, landmark, options = {} }) {
  if (!state || !Array.isArray(state.grid)) throw new Error('state with a grid is required');
  if (!Array.isArray(spawnValues)) throw new Error('spawnValues are required');
  if (!Number.isFinite(landmark) || landmark <= 0) throw new Error('landmark must be positive');
  const limits = normalizeOptions(options);
  const moveLimit = Math.min(
    state.maxMoves - state.moves,
    limits.maxMoves === undefined ? state.maxMoves - state.moves : limits.maxMoves,
  );
  const diagnostics = {
    expandedNodes: 0,
    generatedActions: 0,
    landmarkActions: 0,
    visitedPathStates: 0,
    directLandmarkCalls: 0,
    completeDirectLandmarkCalls: 0,
    capReasons: new Set(),
  };
  const outcomes = new Map();
  let frontier = [{ state: cloneState(state), cursor: spawnCursor, actions: [] }];

  if (hasLandmark(state, landmark)) {
    outcomes.set(boardIdentity(state), {
      outcomeIdentity: boardIdentity(state), moves: 0, score: state.score,
      maximumTile: maximumTile(state), chains: [], board: boardSnapshot(state),
    });
  }

  for (let depth = 0; depth < moveLimit && frontier.length && outcomes.size < limits.maxResults; depth++) {
    const nextByState = new Map();
    for (const node of frontier) {
      if (diagnostics.expandedNodes >= limits.maxNodes) {
        diagnostics.capReasons.add('nodes');
        break;
      }
      diagnostics.expandedNodes += 1;
      const chains = candidateChains(node.state, landmark, limits, diagnostics);
      diagnostics.generatedActions += chains.length;
      for (const liveChain of chains) {
        const chain = snapshotChain(liveChain);
        const transition = applyAction(node.state, chain, spawnValues, node.cursor);
        const actions = [...node.actions, chain];
        if (hasLandmark(transition.state, landmark)) {
          diagnostics.landmarkActions += 1;
          const key = boardIdentity(transition.state);
          const route = {
            outcomeIdentity: key,
            moves: transition.state.moves - state.moves,
            score: transition.state.score,
            maximumTile: maximumTile(transition.state),
            chains: actions,
            board: boardSnapshot(transition.state),
          };
          const previous = outcomes.get(key);
          if (!previous || route.moves < previous.moves || (route.moves === previous.moves && route.score > previous.score)) {
            outcomes.set(key, route);
          }
          if (outcomes.size >= limits.maxResults) {
            diagnostics.capReasons.add('results');
            break;
          }
          continue;
        }
        if (terminalReason(transition.state) || depth + 1 >= moveLimit) continue;
        const next = { state: transition.state, cursor: transition.cursor, actions };
        const key = searchStateIdentity(next);
        const previous = nextByState.get(key);
        if (!previous || next.state.score > previous.state.score) nextByState.set(key, next);
      }
      if (diagnostics.capReasons.has('nodes') || diagnostics.capReasons.has('results')) break;
    }
    frontier = [...nextByState.values()]
      .sort((a, b) => rankNode(b, landmark) - rankNode(a, landmark)
        || searchStateIdentity(a).localeCompare(searchStateIdentity(b)))
      .slice(0, limits.beamWidth);
    if (nextByState.size > limits.beamWidth) diagnostics.capReasons.add('beam-width');
    if (diagnostics.capReasons.has('nodes') || diagnostics.capReasons.has('results')) break;
  }

  const routes = [...outcomes.values()]
    .sort((a, b) => a.moves - b.moves || b.score - a.score
      || a.outcomeIdentity.localeCompare(b.outcomeIdentity));
  const targetedOneMoveComplete = limits.mode === 'bounded'
    && moveLimit === 1
    && diagnostics.expandedNodes === 1
    && diagnostics.directLandmarkCalls === 1
    && diagnostics.completeDirectLandmarkCalls === 1
    && !diagnostics.capReasons.has('results');
  const bounded = (limits.mode === 'bounded' && !targetedOneMoveComplete)
    || diagnostics.capReasons.size > 0;
  return {
    landmark,
    standing: routes.length ? 'replayed_lower_bound' : bounded ? 'UNKNOWN' : 'exact_result',
    complete: !bounded,
    distinctOutcomeCountLowerBound: routes.length,
    routes,
    diagnostics: {
      ...diagnostics,
      capReasons: [...diagnostics.capReasons].sort(),
      duplicateLandmarkOutcomes: diagnostics.landmarkActions - routes.length,
      limits,
    },
  };
}

function replayLandmarkRoute({ state, spawnValues, spawnCursor = 0, landmark }, route) {
  let replay = cloneState(state);
  let cursor = spawnCursor;
  for (const chain of route.chains) {
    const transition = applyAction(replay, chain, spawnValues, cursor);
    replay = transition.state;
    cursor = transition.cursor;
  }
  if (!hasLandmark(replay, landmark)) throw new Error('route does not produce the landmark');
  if (boardIdentity(replay) !== route.outcomeIdentity) throw new Error('route outcome identity mismatch');
  if (replay.score !== route.score) throw new Error('route score mismatch');
  if (route.moves !== route.chains.length) throw new Error('route move count mismatch');
  return { board: boardSnapshot(replay), score: replay.score, moves: route.chains.length, cursor };
}

function initialPuzzle(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  return { state, spawnValues: makeScaledFrozenSpawnValues(level, rng), spawnCursor: 0 };
}

function parseArgs(argv) {
  const args = { landmark: 2048, json: false, options: {} };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const [rawKey, inline] = arg.split('=', 2);
    const key = rawKey.replace(/^--/, '');
    if (key === 'json') { args.json = true; continue; }
    const value = inline === undefined ? argv[++index] : inline;
    if (value === undefined) throw new Error(`--${key} requires a value`);
    if (key === 'input') args.input = value;
    else if (key === 'level') args.level = Number(value);
    else if (key === 'seed') args.seed = Number(value);
    else if (key === 'landmark') args.landmark = Number(value);
    else if (key === 'mode') args.options.mode = value;
    else if (['max-nodes', 'beam-width', 'actions-per-state', 'path-width', 'max-path-states', 'max-results', 'max-moves'].includes(key)) {
      const camel = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      args.options[camel] = Number(value);
    } else throw new Error(`unknown option --${key}`);
  }
  return args;
}

function loadPuzzle(args) {
  if (args.input) {
    const input = JSON.parse(fs.readFileSync(args.input, 'utf8'));
    return { state: input.state, spawnValues: input.spawnValues, spawnCursor: input.spawnCursor || 0 };
  }
  if (!Number.isInteger(args.level) || !Number.isInteger(args.seed)) {
    throw new Error('usage: landmark-frontier.js --level N --seed N [--landmark 2048] [--json]');
  }
  const level = LEVELS.find((candidate) => candidate.level === args.level);
  if (!level) throw new Error(`no such level: ${args.level}`);
  return initialPuzzle(level, args.seed);
}

function printReadable(result) {
  console.log(`landmark ${result.landmark}: ${result.distinctOutcomeCountLowerBound} distinct verified outcome(s) [${result.standing}]`);
  for (const [index, route] of result.routes.entries()) {
    console.log(`  ${index + 1}. ${route.moves} move(s), score ${route.score}, outcome ${route.outcomeIdentity.slice(0, 12)}`);
    route.chains.forEach((chain, move) => {
      console.log(`     move ${move + 1}: ${chain.map(({ x, y, value }) => `${value}@${x},${y}`).join(' -> ')}`);
    });
  }
  if (!result.routes.length) console.log('  No route found within the bounded search; this is not proof of absence.');
  console.log(`  expanded ${result.diagnostics.expandedNodes} node(s), generated ${result.diagnostics.generatedActions} action(s)`);
  if (result.diagnostics.capReasons.length) console.log(`  bounds reached: ${result.diagnostics.capReasons.join(', ')}`);
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const puzzle = loadPuzzle(args);
    const result = analyzeLandmarkFrontier({ ...puzzle, landmark: args.landmark, options: args.options });
    for (const route of result.routes) replayLandmarkRoute({ ...puzzle, landmark: args.landmark }, route);
    if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else printReadable(result);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  analyzeLandmarkFrontier,
  boardSnapshot,
  directLandmarkChains,
  initialPuzzle,
  replayLandmarkRoute,
};
