const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  canExtendChain,
  isValidChain,
} = require('./engine');

const SOLVER_DIR = __dirname;
const ARCHIVE_DIR = path.join(SOLVER_DIR, 'candidates-archive');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function indexStores(index, dir) {
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('candidate-levels') || !name.endsWith('.json') || name.endsWith('.receipt.json')) continue;
    const receiptPath = path.join(dir, name.replace(/\.json$/, '.receipt.json'));
    if (!fs.existsSync(receiptPath)) continue;
    index.set(readJson(receiptPath).candidateIdentity, {
      candidate: readJson(path.join(dir, name)).candidates[0],
      source: name,
    });
  }
}

function indexBatches(index, dir) {
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('generated-batch') || !name.endsWith('.json')) continue;
    const results = readJson(path.join(dir, name)).results;
    if (!Array.isArray(results)) continue;
    for (const entry of results) {
      const candidateIdentity = entry && entry.receipt && entry.receipt.candidateIdentity;
      if (typeof candidateIdentity !== 'string' || !entry.candidate || index.has(candidateIdentity)) continue;
      index.set(candidateIdentity, { candidate: entry.candidate, source: `${name} (${entry.candidate.name})` });
    }
  }
}

function candidateIndex(dirs = [SOLVER_DIR, ARCHIVE_DIR]) {
  const index = new Map();
  const present = dirs.filter((dir) => fs.existsSync(dir));
  for (const dir of present) indexStores(index, dir);
  for (const dir of present) indexBatches(index, dir);
  return index;
}

function readRecordings(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()
    .map((name) => ({ file: name, recording: readJson(path.join(dir, name)) }));
}

function partition(recordings, index) {
  const replayable = [];
  const orphans = [];
  for (const entry of recordings) {
    const found = index.get(entry.recording.candidateIdentity);
    if (found) replayable.push({ ...entry, ...found });
    else orphans.push(entry);
  }
  return { replayable, orphans };
}

function chainLegality(tiles, minChain) {
  const problems = [];
  const seen = new Set();
  tiles.forEach((tile, i) => {
    const key = `${tile.x},${tile.y}`;
    if (seen.has(key)) problems.push(`revisits (${tile.x},${tile.y})`);
    seen.add(key);
    if (i === 0) return;
    const prev = tiles[i - 1];
    if (Math.abs(tile.x - prev.x) > 1 || Math.abs(tile.y - prev.y) > 1) {
      problems.push(`jumps (${prev.x},${prev.y}) -> (${tile.x},${tile.y}), not adjacent`);
    }
    if (!canExtendChain(tiles.slice(0, i), tile)) {
      problems.push(`value ${tile.value} at (${tile.x},${tile.y}) cannot follow ${prev.value}`);
    }
  });
  if (!isValidChain(tiles, minChain)) problems.push(`chain of ${tiles.length} is not valid at minChain ${minChain}`);
  return problems;
}

function replay(candidate, recording) {
  const problems = [];
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  recording.chains.forEach((chain, index) => {
    const move = index + 1;
    const live = chain.tiles.map((tileClaim) => {
      const row = state.grid[tileClaim.y];
      const tile = row && row[tileClaim.x];
      if (!tile) {
        problems.push(`move ${move}: no tile at (${tileClaim.x},${tileClaim.y})`);
        return null;
      }
      if (tile.value !== tileClaim.value) {
        problems.push(`move ${move}: tile (${tileClaim.x},${tileClaim.y}) holds ${tile.value}, recording claims ${tileClaim.value}`);
      }
      return tile;
    });
    if (live.some((tile) => !tile)) return;
    for (const issue of chainLegality(chain.tiles, candidate.minChain)) problems.push(`move ${move}: illegal chain — ${issue}`);
    const points = executeChain(state, live);
    if (points !== chain.points) problems.push(`move ${move}: chain scored ${points}, recording claims ${chain.points}`);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  });
  if (state.score !== recording.score) problems.push(`final score ${state.score}, recording claims ${recording.score}`);
  if (state.moves !== recording.movesUsed) problems.push(`used ${state.moves} moves, recording claims ${recording.movesUsed}`);
  const reachedTarget = state.score >= candidate.target;
  if (recording.outcome === 'win' && !reachedTarget) problems.push(`claims a win, but replay reached ${state.score} of target ${candidate.target}`);
  if (recording.outcome === 'lose' && reachedTarget) problems.push(`claims a loss, but replay reached the target at ${state.score}`);
  return { problems, score: state.score, moves: state.moves };
}

module.exports = { candidateIndex, chainLegality, partition, readRecordings, replay };
