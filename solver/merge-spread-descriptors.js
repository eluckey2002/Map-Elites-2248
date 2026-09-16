const crypto = require('node:crypto');

const {
  applyGravity,
  canExtendChain,
  cloneState,
  createLevelState,
  executeChain,
  isBlockedTile,
  isValidChain,
  makeRng,
} = require('./engine');
const { searchWitness } = require('./choice-recovery-descriptors');

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

function makeSpawnStream(level, rng) {
  const scale = level.tileScale || 1;
  const length = level.moves * (level.gridW * level.gridH - 1);
  return Array.from({ length }, () => {
    const draw = rng();
    if (draw < 0.6) return 2 * scale;
    if (draw < 0.9) return 4 * scale;
    return 8 * scale;
  });
}

function decorateInitialState(state) {
  const decorated = cloneState(state);
  for (const tile of decorated.grid.flat()) {
    if (!tile || isBlockedTile(tile)) continue;
    tile.mergeDepth = 0;
    tile.sourceCells = [[tile.x, tile.y]];
  }
  return decorated;
}

function validateChain(state, coordinates) {
  const chain = coordinates.map(([x, y]) => state.grid[y] && state.grid[y][x]);
  if (chain.some((tile) => !tile || isBlockedTile(tile))) {
    throw new Error('witness selects an unavailable tile');
  }
  if (new Set(chain).size !== chain.length) throw new Error('witness selects a tile more than once');
  for (let index = 1; index < chain.length; index += 1) {
    const previous = chain[index - 1];
    const current = chain[index];
    if (Math.max(Math.abs(previous.x - current.x), Math.abs(previous.y - current.y)) !== 1) {
      throw new Error('witness contains non-adjacent tiles');
    }
    if (!canExtendChain(chain.slice(0, index), current)) {
      throw new Error('witness contains an illegal value extension');
    }
  }
  if (!isValidChain(chain, state.minChain)) throw new Error('witness chain is too short');
  return chain;
}

function spawnTrackedValues(state, values, cursor) {
  let nextCursor = cursor;
  for (let x = 0; x < state.gridWidth; x += 1) {
    for (let y = 0; y < state.gridHeight; y += 1) {
      if (state.grid[y][x]) continue;
      if (nextCursor >= values.length) throw new Error('frozen spawn stream exhausted');
      state.grid[y][x] = {
        x, y, value: values[nextCursor], blocker: null, blockerDuration: 0, bombTimer: 0,
        mergeDepth: 0, sourceCells: [[x, y]],
      };
      nextCursor += 1;
    }
  }
  return nextCursor;
}

function coordinateSpan(coordinates, state) {
  let span = 0;
  for (const [x1, y1] of coordinates) {
    for (const [x2, y2] of coordinates) {
      span = Math.max(span, Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)));
    }
  }
  const diameter = Math.max(state.gridWidth - 1, state.gridHeight - 1, 1);
  return { cells: span, normalized: span / diameter };
}

function applyTrackedChain(state, coordinates, spawnValues, cursor) {
  const next = cloneState(state);
  const chain = validateChain(next, coordinates);
  const mergeDepth = 1 + Math.max(...chain.map((tile) => tile.mergeDepth || 0));
  const sourceCells = chain.flatMap((tile) => tile.sourceCells || [[tile.x, tile.y]]);
  const finalTile = chain[chain.length - 1];
  const span = coordinateSpan(coordinates, next);
  executeChain(next, chain);
  finalTile.mergeDepth = mergeDepth;
  finalTile.sourceCells = sourceCells;
  applyGravity(next);
  const nextCursor = spawnTrackedValues(next, spawnValues, cursor);
  return { state: next, cursor: nextCursor, mergeDepth, span };
}

function measureWitness({ state, spawnValues, witness }) {
  let current = decorateInitialState(state);
  let cursor = 0;
  const trace = [];
  let peakMergeDepth = 0;
  for (const coordinates of witness) {
    const transition = applyTrackedChain(current, coordinates, spawnValues, cursor);
    peakMergeDepth = Math.max(peakMergeDepth, transition.mergeDepth);
    trace.push({
      move: trace.length + 1,
      mergeDepth: transition.mergeDepth,
      chainSpanCells: transition.span.cells,
      normalizedChainSpan: transition.span.normalized,
      scoreAfter: transition.state.score,
    });
    current = transition.state;
    cursor = transition.cursor;
  }
  const meanNormalizedChainSpan = trace.length
    ? trace.reduce((sum, row) => sum + row.normalizedChainSpan, 0) / trace.length
    : null;
  return {
    finalScore: current.score,
    moves: current.moves,
    cursor,
    descriptors: { peakMergeDepth, meanNormalizedChainSpan },
    trace,
  };
}

function puzzleRecord(level, seed, state, spawnValues) {
  return {
    level: level.level,
    seed,
    target: level.target,
    moves: level.moves,
    minChain: level.minChain,
    tileScale: level.tileScale || 1,
    gridW: level.gridW,
    gridH: level.gridH,
    blockers: level.blockers,
    initialGridIdentity: identity(state.grid.map((row) => row.map((tile) => ({
      value: tile && tile.value,
      blocker: tile && tile.blocker,
      blockerDuration: tile && tile.blockerDuration,
      bombTimer: tile && tile.bombTimer,
    })))),
    spawnStreamIdentity: identity(spawnValues),
  };
}

function analyzeMergeSpread({
  level,
  seed,
  search = { width: 24, actionsPerState: 16, pathWidth: 2 },
}) {
  const rng = makeRng(seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeSpawnStream(level, rng);
  const puzzle = puzzleRecord(level, seed, initialState, spawnValues);
  const reference = searchWitness({ state: initialState, cursor: 0, spawnValues, ...search });
  if (!reference.reachesTarget || reference.witness.length === 0) {
    return {
      standing: 'UNKNOWN', seed, puzzle, puzzleIdentity: identity(puzzle),
      descriptors: null, trace: [], reference,
    };
  }
  const measured = measureWitness({ state: initialState, spawnValues, witness: reference.witness });
  if (measured.finalScore !== reference.score) throw new Error('tracked replay score mismatch');
  return {
    standing: 'replayed_witness_proxy',
    seed,
    puzzle,
    puzzleIdentity: identity(puzzle),
    descriptors: measured.descriptors,
    trace: measured.trace,
    reference,
  };
}

function replayMergeSpread(level, analysis) {
  const rng = makeRng(analysis.seed);
  const state = createLevelState(level, rng);
  const spawnValues = makeSpawnStream(level, rng);
  const puzzle = puzzleRecord(level, analysis.seed, state, spawnValues);
  if (analysis.puzzleIdentity !== identity(puzzle)) throw new Error('puzzle identity mismatch');
  const measured = measureWitness({ state, spawnValues, witness: analysis.reference.witness });
  if (measured.finalScore !== analysis.reference.score) throw new Error('reference score mismatch');
  if (analysis.standing === 'UNKNOWN') return true;
  if (canonicalJson(measured.descriptors) !== canonicalJson(analysis.descriptors)) {
    throw new Error('descriptor replay mismatch');
  }
  if (canonicalJson(measured.trace) !== canonicalJson(analysis.trace)) {
    throw new Error('descriptor trace mismatch');
  }
  return true;
}

module.exports = {
  analyzeMergeSpread,
  applyTrackedChain,
  coordinateSpan,
  measureWitness,
  replayMergeSpread,
};
