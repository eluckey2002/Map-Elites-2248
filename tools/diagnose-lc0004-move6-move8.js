#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyGravity,
  checkBombs,
  cloneState,
  createLevelState,
  executeChain,
  isBlockedTile,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { replay } = require('../solver/recording-replay');
const { normalizedBuiltReservoirHarvest } = require('../solver/built-reservoir-probe');
const {
  LOOKAHEAD_BASE,
  stateDiagnostics,
} = require('../solver/sequence-value-probe');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const SHORT_HORIZON = 3;
const MOVES = [6, 8];
const INTERVENTIONS = Object.freeze({
  6: [
    {
      id: 'M6-CONNECT',
      a: { x: 3, y: 6, value: 32 },
      b: { x: 2, y: 6, value: 8 },
    },
    {
      id: 'M6-DISCONNECT',
      a: { x: 1, y: 4, value: 32 },
      b: { x: 3, y: 0, value: 4 },
    },
  ],
  8: [
    {
      id: 'M8-CONNECT',
      a: { x: 0, y: 2, value: 32 },
      b: { x: 0, y: 4, value: 2 },
    },
    {
      id: 'M8-DISCONNECT',
      a: { x: 2, y: 5, value: 32 },
      b: { x: 3, y: 0, value: 4 },
    },
  ],
});

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function artifactWithIdentity(body) {
  return { ...body, artifactIdentity: sha256Bytes(JSON.stringify(body)) };
}

function verifyArtifactIdentity(artifact) {
  const { artifactIdentity, ...body } = artifact;
  return typeof artifactIdentity === 'string'
    && artifactIdentity === sha256Bytes(JSON.stringify(body));
}

function stateIdentity(state) {
  return sha256Bytes(JSON.stringify({
    score: state.score,
    moves: state.moves,
    maxMoves: state.maxMoves,
    targetScore: state.targetScore,
    tileScale: state.tileScale,
    grid: state.grid.map((row) => row.map((tile) => (
      tile ? {
        value: tile.value,
        blocker: tile.blocker,
        blockerDuration: tile.blockerDuration,
        bombTimer: tile.bombTimer,
      } : null
    ))),
  }));
}

function tileMultiset(state) {
  return state.grid.flat().map((tile) => (
    tile ? {
      value: tile.value,
      blocker: tile.blocker || null,
      blockerDuration: tile.blockerDuration || 0,
      bombTimer: tile.bombTimer || 0,
    } : null
  )).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function builtComponentSizes(state) {
  const cutoff = 16 * (state.tileScale || 1);
  const built = new Set();
  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      if (tile && !isBlockedTile(tile) && tile.value > cutoff) built.add(`${x},${y}`);
    }
  }

  const sizes = [];
  while (built.size > 0) {
    const first = built.values().next().value;
    built.delete(first);
    const queue = [first];
    let size = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      size += 1;
      const [x, y] = current.split(',').map(Number);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const key = `${x + dx},${y + dy}`;
          if (!built.has(key)) continue;
          built.delete(key);
          queue.push(key);
        }
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a, b) => b - a);
}

function tileAt(state, point) {
  const tile = state.grid[point.y] && state.grid[point.y][point.x];
  if (!tile) throw new Error(`${point.x},${point.y} has no tile`);
  if (isBlockedTile(tile)) throw new Error(`${point.x},${point.y} is blocked`);
  return tile;
}

function swapNormalizedTiles(state, specification) {
  const scale = state.tileScale || 1;
  const aTile = tileAt(state, specification.a);
  const bTile = tileAt(state, specification.b);
  const observedA = aTile.value / scale;
  const observedB = bTile.value / scale;
  if (observedA !== specification.a.value) {
    throw new Error(`${specification.id} endpoint ${specification.a.x},${specification.a.y} expected ${specification.a.value}, observed ${observedA}`);
  }
  if (observedB !== specification.b.value) {
    throw new Error(`${specification.id} endpoint ${specification.b.x},${specification.b.y} expected ${specification.b.value}, observed ${observedB}`);
  }

  state.grid[specification.a.y][specification.a.x] = bTile;
  state.grid[specification.b.y][specification.b.x] = aTile;
  aTile.x = specification.b.x;
  aTile.y = specification.b.y;
  bTile.x = specification.a.x;
  bTile.y = specification.a.y;
  return {
    id: specification.id,
    a: { ...specification.a, observed: observedA },
    b: { ...specification.b, observed: observedB },
  };
}

function trackedRng(seed) {
  const base = makeRng(seed);
  let calls = 0;
  const rng = () => {
    calls += 1;
    return base();
  };
  rng.calls = () => calls;
  return rng;
}

function snapshotClaims(claims) {
  return claims.map(({ x, y, value }) => ({ x, y, value }));
}

function liveChain(state, claims) {
  return claims.map(({ x, y, value }) => {
    const tile = state.grid[y] && state.grid[y][x];
    if (!tile) throw new Error(`chain names missing tile at ${x},${y}`);
    if (tile.value !== value) {
      throw new Error(`chain value mismatch at ${x},${y}: expected ${value}, observed ${tile.value}`);
    }
    return tile;
  });
}

function advance(state, rng, claims) {
  const chain = liveChain(state, claims);
  const snapshot = snapshotClaims(chain);
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return {
    points,
    length: snapshot.length,
    sum: snapshot.reduce((total, tile) => total + tile.value, 0),
    chain: snapshot,
  };
}

function stateStatus(state) {
  if (checkBombs(state)) return { status: 'loss', reason: 'bomb' };
  if (state.score >= state.targetScore) return { status: 'win', reason: 'target' };
  if (state.moves >= state.maxMoves) return { status: 'loss', reason: 'move-budget' };
  return { status: 'active', reason: 'continuing' };
}

function selectedChampion(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  if (!analysis.selectedChain) return { claims: null, summary: null };
  const selected = analysis.candidates.find(({ id }) => id === analysis.selectedId);
  if (!selected) throw new Error(`selected candidate ${analysis.selectedId} missing`);
  return {
    claims: snapshotClaims(analysis.selectedChain),
    summary: {
      reason: analysis.reason,
      chainLength: selected.chainLength,
      chainSum: selected.chainSum,
      immediatePoints: selected.immediatePoints,
      twoMovePoints: selected.twoMovePoints,
      raw: selected.raw,
      chain: snapshotClaims(selected.chain),
    },
  };
}

function prefixState(candidate, recording, length) {
  const rng = trackedRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < length; index++) {
    advance(state, rng, recording.chains[index].tiles);
  }
  return { state, rng };
}

function reconstructCutoff(candidate, recording, move, arm) {
  const decisionIndex = move - 1;
  const { state, rng } = prefixState(candidate, recording, decisionIndex);
  const candidateClaims = arm === 'owner'
    ? snapshotClaims(recording.chains[decisionIndex].tiles)
    : selectedChampion(state).claims;
  if (!candidateClaims) throw new Error(`${arm} has no candidate at move ${move}`);

  const trace = [{ phase: 'candidate', absoluteMove: move, ...advance(state, rng, candidateClaims) }];
  for (let continuation = 1; continuation <= SHORT_HORIZON; continuation++) {
    const terminal = stateStatus(state);
    if (terminal.status !== 'active') {
      throw new Error(`${arm} move ${move} terminated before frozen cutoff at continuation ${continuation}`);
    }
    const selected = selectedChampion(state);
    if (!selected.claims) throw new Error(`${arm} move ${move} has no champion continuation`);
    trace.push({
      phase: 'continuation',
      continuation,
      absoluteMove: state.moves + 1,
      selected: selected.summary,
      ...advance(state, rng, selected.claims),
    });
  }
  return { state, rng, trace };
}

function normalizedGrid(state) {
  const scale = state.tileScale || 1;
  return state.grid.map((row) => row.map((tile) => {
    if (!tile) return null;
    if (tile.blocker === 'stone') return 'stone';
    return tile.value / scale;
  }));
}

function summarizeState(state) {
  return {
    stateIdentity: stateIdentity(state),
    score: state.score,
    moves: state.moves,
    maxMoves: state.maxMoves,
    targetScore: state.targetScore,
    targetGap: Math.max(0, state.targetScore - state.score),
    diagnostics: stateDiagnostics(state),
    builtComponentSizes: builtComponentSizes(state),
    tileMultiset: tileMultiset(state),
    grid: normalizedGrid(state),
    nextChampionDecision: stateStatus(state).status === 'active'
      ? selectedChampion(state).summary
      : null,
  };
}

function finishFromCutoff(state, rng) {
  const startMoves = state.moves;
  const startScore = state.score;
  const trace = [];
  while (stateStatus(state).status === 'active') {
    const selected = selectedChampion(state);
    if (!selected.claims) break;
    const absoluteMove = state.moves + 1;
    const choice = advance(state, rng, selected.claims);
    trace.push({ absoluteMove, selected: selected.summary, ...choice, scoreAfter: state.score });
  }
  const terminal = stateStatus(state);
  return {
    status: terminal.status,
    reason: terminal.status === 'active' ? 'no-legal-move' : terminal.reason,
    targetCost: terminal.status === 'win' ? state.moves : state.maxMoves + 1,
    continuationMoves: state.moves - startMoves,
    scoreGain: state.score - startScore,
    finalScore: state.score,
    trace,
  };
}

function armFromCutoff(candidate, recording, move, intervention = null) {
  const reconstructed = reconstructCutoff(candidate, recording, move, 'owner');
  const before = summarizeState(reconstructed.state);
  const rngCallsBefore = reconstructed.rng.calls();
  let swap = null;
  if (intervention) swap = swapNormalizedTiles(reconstructed.state, intervention);
  const after = summarizeState(reconstructed.state);
  const rngCallsAfter = reconstructed.rng.calls();
  const invariants = {
    scorePreserved: before.score === after.score,
    movesPreserved: before.moves === after.moves,
    targetPreserved: before.targetScore === after.targetScore,
    maxMovesPreserved: before.maxMoves === after.maxMoves,
    tileMultisetPreserved: JSON.stringify(before.tileMultiset) === JSON.stringify(after.tileMultiset),
    rngPositionPreserved: rngCallsBefore === rngCallsAfter,
    placementChanged: intervention ? before.stateIdentity !== after.stateIdentity : before.stateIdentity === after.stateIdentity,
  };
  const invariantPass = Object.values(invariants).every(Boolean);
  if (!invariantPass) {
    throw new Error(`${intervention ? intervention.id : `M${move}-BASELINE`} invariant failure: ${JSON.stringify(invariants)}`);
  }
  const terminal = finishFromCutoff(reconstructed.state, reconstructed.rng);
  return {
    id: intervention ? intervention.id : `M${move}-BASELINE`,
    move,
    intervention: swap,
    cutoffTrace: reconstructed.trace,
    before,
    after,
    invariants,
    terminal,
  };
}

function expectedReference(panel, move) {
  const cell = panel.panel.cells.find((candidate) => candidate.move === move);
  if (!cell) throw new Error(`LC-0003 panel has no move ${move}`);
  return {
    owner: {
      score: cell.arms.owner.sequence.finalScore,
      reservoir: cell.arms.owner.sequence.finalDiagnostics.normalizedBuiltReservoirHarvest.rawPoints,
      targetCost: cell.takeoverAfter.targetCost,
    },
    champion: {
      score: cell.arms.champion.sequence.finalScore,
      reservoir: cell.arms.champion.sequence.finalDiagnostics.normalizedBuiltReservoirHarvest.rawPoints,
      targetCost: cell.takeoverBefore.targetCost,
    },
  };
}

function observedReference(candidate, recording, move, arm) {
  const reconstructed = reconstructCutoff(candidate, recording, move, arm);
  const state = summarizeState(reconstructed.state);
  const terminal = finishFromCutoff(reconstructed.state, reconstructed.rng);
  return {
    score: state.score,
    reservoir: state.diagnostics.normalizedBuiltReservoirHarvest.rawPoints,
    targetCost: terminal.targetCost,
    cutoffStateIdentity: state.stateIdentity,
    continuationMoves: terminal.continuationMoves,
  };
}

function runPersistenceControl() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0004-persist-'));
  const file = path.join(directory, 'raw.json');
  const artifact = { complete: true, arms: ['baseline', 'intervention'] };
  let threw = false;
  try {
    persistBeforeVerdict({
      file,
      artifact,
      evaluate() { throw new Error('planted interpretation failure'); },
    });
  } catch (error) {
    threw = /planted interpretation failure/.test(error.message);
  }
  const retained = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  return {
    id: 'C6-persistence-before-interpretation',
    expected: 'complete disposable artifact exists before planted interpretation failure',
    observed: { threw, retained },
    pass: threw && JSON.stringify(retained) === JSON.stringify(artifact),
  };
}

function runPreflightControls({ candidate, recording, panel }) {
  const replayed = replay(candidate, recording);
  const references = [];
  let referencePass = replayed.problems.length === 0;
  for (const move of MOVES) {
    const expected = expectedReference(panel, move);
    const observed = {
      owner: observedReference(candidate, recording, move, 'owner'),
      champion: observedReference(candidate, recording, move, 'champion'),
    };
    references.push({ move, expected, observed });
    for (const arm of ['owner', 'champion']) {
      for (const field of ['score', 'reservoir', 'targetCost']) {
        if (expected[arm][field] !== observed[arm][field]) referencePass = false;
      }
    }
  }

  const aa = MOVES.map((move) => {
    const left = observedReference(candidate, recording, move, 'owner');
    const right = observedReference(candidate, recording, move, 'owner');
    return { move, equal: JSON.stringify(left) === JSON.stringify(right), left, right };
  });

  const planted = reconstructCutoff(candidate, recording, 6, 'owner');
  let plantedRefused = false;
  let plantedMessage = null;
  try {
    swapNormalizedTiles(planted.state, {
      id: 'PLANTED-BAD-ENDPOINT',
      a: { x: 3, y: 6, value: 16 },
      b: { x: 2, y: 6, value: 8 },
    });
  } catch (error) {
    plantedRefused = true;
    plantedMessage = error.message;
  }

  return [
    {
      id: 'C1-deterministic-replay-and-identity',
      expected: 'clean replay and exact LC-0003 score, reservoir, and target-cost reproduction',
      observed: { replayProblems: replayed.problems, references },
      pass: referencePass,
    },
    {
      id: 'C2-reference-aa',
      expected: 'byte-identical reconstruction and finish for each owner cutoff',
      observed: aa,
      pass: aa.every(({ equal }) => equal),
    },
    {
      id: 'C3-planted-swap-endpoint',
      expected: 'false normalized endpoint is refused before continuation',
      observed: { refused: plantedRefused, message: plantedMessage },
      pass: plantedRefused && /expected 16, observed 32/.test(plantedMessage),
    },
    runPersistenceControl(),
  ];
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    game: path.join(ROOT, 'src', 'game.js'),
    builtProbe: path.join(ROOT, 'solver', 'built-reservoir-probe.js'),
    sequenceProbe: path.join(ROOT, 'solver', 'sequence-value-probe.js'),
    lc0003Harness: path.join(ROOT, 'tools', 'qualify-three-step-target-progress.js'),
    lc0003Manifest: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-manifest.json'),
    lc0003Panel: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-raw.json'),
    fourMissRaw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-four-miss-diagnostic-raw.json'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0004CausalContrast.test.js'),
  };
  const identities = Object.fromEntries(
    Object.entries(files).map(([name, file]) => [name, sha256File(file)]),
  );
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of [
    'recording', 'bot', 'engine', 'game', 'builtProbe', 'sequenceProbe',
    'lc0003Harness', 'lc0003Manifest', 'lc0003Panel', 'fourMissRaw',
  ]) {
    if (!contract.includes(identities[name])) {
      throw new Error(`contract does not freeze ${name} identity ${identities[name]}`);
    }
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0004-move6-move8-causal-contrast-manifest',
    paths: Object.fromEntries(
      Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)]),
    ),
    identities,
  });
}

function validateManifest(manifest) {
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.kind !== 'lc0004-move6-move8-causal-contrast-manifest') {
    throw new Error(`unexpected manifest kind ${manifest.kind}`);
  }
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    const observed = sha256File(file);
    if (observed !== manifest.identities[name]) {
      throw new Error(`${name} identity mismatch: expected ${manifest.identities[name]}, observed ${observed}`);
    }
    paths[name] = file;
  }
  return paths;
}

function collectFromManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');
  const candidate = resolved.candidate;
  const panel = JSON.parse(fs.readFileSync(paths.lc0003Panel, 'utf8'));
  const controls = runPreflightControls({ candidate, recording, panel });

  const common = {
    schemaVersion: 1,
    kind: 'lc0004-move6-move8-causal-contrast',
    sources: {
      manifestArtifactIdentity: manifest.artifactIdentity,
      identities: manifest.identities,
    },
    bounds: {
      moves: MOVES,
      shortHorizon: SHORT_HORIZON,
      interventions: Object.values(INTERVENTIONS).flat().map(({ id }) => id),
      purpose: 'exact-case diagnostic only; no measure, population, policy, or adoption claim',
    },
    controls,
  };

  if (controls.some(({ pass }) => !pass)) {
    return artifactWithIdentity({ ...common, status: 'UNVERIFIED', arms: [] });
  }

  const arms = [];
  for (const move of MOVES) {
    arms.push(armFromCutoff(candidate, recording, move));
    for (const intervention of INTERVENTIONS[move]) {
      arms.push(armFromCutoff(candidate, recording, move, intervention));
    }
  }
  return artifactWithIdentity({ ...common, status: 'COMPLETE', arms });
}

function summarizeExactChanges(artifact) {
  if (artifact.status !== 'COMPLETE') return { status: artifact.status };
  const changes = [];
  for (const move of MOVES) {
    const baseline = artifact.arms.find(({ id }) => id === `M${move}-BASELINE`);
    for (const arm of artifact.arms.filter(({ move: candidateMove, intervention }) => (
      candidateMove === move && intervention
    ))) {
      changes.push({
        id: arm.id,
        move,
        targetCostChange: arm.terminal.targetCost - baseline.terminal.targetCost,
        continuationMoveChange: arm.terminal.continuationMoves - baseline.terminal.continuationMoves,
        componentSizesBefore: arm.before.builtComponentSizes,
        componentSizesAfter: arm.after.builtComponentSizes,
        reservoirBefore: arm.before.diagnostics.normalizedBuiltReservoirHarvest.rawPoints,
        reservoirAfter: arm.after.diagnostics.normalizedBuiltReservoirHarvest.rawPoints,
      });
    }
  }
  return { status: artifact.status, changes };
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) throw new Error(`--${name} is required`);
  return process.argv[index + 1];
}

function optionalArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 || index === process.argv.length - 1 ? null : process.argv[index + 1];
}

function main() {
  const manifestOut = optionalArg('write-manifest');
  if (manifestOut) {
    const manifest = createManifest({ contractPath: arg('contract') });
    writeJsonOnce(path.resolve(manifestOut), manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }

  const artifact = collectFromManifest(path.resolve(arg('manifest')));
  const summary = persistBeforeVerdict({
    file: path.resolve(arg('out')),
    artifact,
    validate(value) {
      if (!verifyArtifactIdentity(value)) throw new Error('raw artifact identity mismatch');
    },
    evaluate: summarizeExactChanges,
  });
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    output: path.relative(ROOT, path.resolve(arg('out'))),
    ...summary,
  }, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  INTERVENTIONS,
  MOVES,
  artifactWithIdentity,
  builtComponentSizes,
  collectFromManifest,
  createManifest,
  stateIdentity,
  summarizeExactChanges,
  swapNormalizedTiles,
  tileMultiset,
  validateManifest,
  verifyArtifactIdentity,
};
