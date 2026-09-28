#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
} = require('../solver/engine');
const { chooseMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { replay } = require('../solver/recording-replay');
const {
  normalizedBuiltReservoirHarvest,
} = require('../solver/built-reservoir-probe');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;
const HELPFUL_MOVES = [2, 6, 10, 11, 13];
const HARMFUL_MOVES = [1, 4, 8, 9, 12];
const NEUTRAL_MOVES = [3, 5, 7, 14, 15];

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

function requireIdentity(label, file, expected) {
  if (!expected || !/^[0-9a-f]{64}$/.test(expected)) {
    throw new Error(`${label} expected identity must be a full SHA-256`);
  }
  const observed = sha256File(file);
  if (observed !== expected) {
    throw new Error(`${label} identity mismatch: expected ${expected}, observed ${observed}`);
  }
  return observed;
}

function createManifest({ recordingPath, contractPath }) {
  const absoluteRecording = path.resolve(recordingPath);
  const absoluteContract = path.resolve(contractPath);
  const files = {
    recording: absoluteRecording,
    contract: absoluteContract,
    bot: path.join(ROOT, 'solver', 'bot.js'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    probe: path.join(ROOT, 'solver', 'built-reservoir-probe.js'),
    harness: __filename,
  };
  const identities = Object.fromEntries(
    Object.entries(files).map(([name, file]) => [name, sha256File(file)]),
  );
  const contract = fs.readFileSync(absoluteContract, 'utf8');
  for (const name of ['recording', 'bot', 'engine']) {
    if (!contract.includes(identities[name])) {
      throw new Error(`contract does not freeze the observed ${name} identity ${identities[name]}`);
    }
  }

  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'built-reservoir-proxy-manifest',
    paths: {
      recording: path.relative(ROOT, absoluteRecording),
      contract: path.relative(ROOT, absoluteContract),
    },
    identities,
  });
}

function collectFromManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.kind !== 'built-reservoir-proxy-manifest') {
    throw new Error(`unexpected manifest kind ${manifest.kind}`);
  }
  return collectQualification({
    recordingPath: path.join(ROOT, manifest.paths.recording),
    contractPath: path.join(ROOT, manifest.paths.contract),
    expectedRecordingSha256: manifest.identities.recording,
    expectedBotSha256: manifest.identities.bot,
    expectedEngineSha256: manifest.identities.engine,
    expectedContractSha256: manifest.identities.contract,
    expectedProbeSha256: manifest.identities.probe,
    expectedHarnessSha256: manifest.identities.harness,
    manifestIdentity: manifest.artifactIdentity,
  });
}

function fixture(points, { scale = 1, width = 5, height = 5, minChain = 3 } = {}) {
  const grid = Array.from({ length: height }, () => Array(width).fill(null));
  for (const [x, y, value] of points) {
    grid[y][x] = { x, y, value: value * scale, blocker: null };
  }
  return {
    grid,
    gridWidth: width,
    gridHeight: height,
    minChain,
    tileScale: scale,
  };
}

function runSyntheticControls() {
  const positive = normalizedBuiltReservoirHarvest(fixture([
    [0, 0, 32], [1, 0, 32], [2, 0, 64],
  ]));
  const removed = normalizedBuiltReservoirHarvest(fixture([
    [0, 0, 32], [1, 0, 32],
  ]));
  const scaled = normalizedBuiltReservoirHarvest(fixture([
    [0, 0, 32], [1, 0, 32], [2, 0, 64],
  ], { scale: 32 }));
  const isolated = normalizedBuiltReservoirHarvest(fixture([
    [0, 0, 32], [1, 0, 32], [2, 0, 64], [4, 4, 128],
  ]));
  const initialBoundary = normalizedBuiltReservoirHarvest(fixture([
    [0, 0, 16], [1, 0, 16], [2, 0, 16],
  ]));

  return [
    {
      id: 'positive-topology',
      expected: { positive: 192, removed: 0 },
      observed: { positive: positive.normalizedPoints, removed: removed.normalizedPoints },
      pass: positive.status === 'MEASURED'
        && removed.status === 'MEASURED'
        && positive.normalizedPoints === 192
        && removed.normalizedPoints === 0,
    },
    {
      id: 'scale-negative',
      expected: 192,
      observed: scaled.normalizedPoints,
      pass: scaled.status === 'MEASURED' && scaled.normalizedPoints === 192,
    },
    {
      id: 'isolated-mass',
      expected: 192,
      observed: isolated.normalizedPoints,
      pass: isolated.status === 'MEASURED' && isolated.normalizedPoints === 192,
    },
    {
      id: 'initial-value-boundary',
      expected: 0,
      observed: initialBoundary.normalizedPoints,
      pass: initialBoundary.status === 'MEASURED' && initialBoundary.normalizedPoints === 0,
    },
  ];
}

function realInputIntegrityControl(candidate, recording) {
  const clean = replay(candidate, recording);
  const corrupted = structuredClone(recording);
  corrupted.chains[0].tiles[0].value += candidate.tileScale || 1;
  const planted = replay(candidate, corrupted);
  return {
    id: 'real-input-integrity',
    expected: 'clean replay and planted false value rejected',
    observed: {
      cleanProblems: clean.problems,
      plantedProblems: planted.problems,
    },
    pass: clean.problems.length === 0
      && planted.problems.some((problem) => /recording claims/.test(problem)),
  };
}

function liveRecordedChain(state, recordedChain) {
  return recordedChain.tiles.map(({ x, y, value }) => {
    const tile = state.grid[y] && state.grid[y][x];
    if (!tile) throw new Error(`recorded chain names missing tile at ${x},${y}`);
    if (tile.value !== value) {
      throw new Error(`recorded chain value mismatch at ${x},${y}: expected ${value}, observed ${tile.value}`);
    }
    return tile;
  });
}

function advance(state, rng, chain) {
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return points;
}

function prefixState(candidate, recording, prefixLength) {
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < prefixLength; index++) {
    advance(state, rng, liveRecordedChain(state, recording.chains[index]));
  }
  return { state, rng };
}

function finishAfterPrefix(candidate, recording, prefixLength) {
  const { state, rng } = prefixState(candidate, recording, prefixLength);
  if (state.score >= state.targetScore) {
    return { outcome: 'win', moves: state.moves, targetCost: state.moves, score: state.score };
  }

  while (state.moves < state.maxMoves) {
    const moveIndex = state.moves;
    const chain = chooseMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) break;
    advance(state, rng, chain);
    if (checkBombs(state)) {
      return {
        outcome: 'loss', reason: 'bomb', moves: state.moves,
        targetCost: state.maxMoves + 1, score: state.score,
      };
    }
    if (state.score >= state.targetScore) {
      return { outcome: 'win', moves: state.moves, targetCost: state.moves, score: state.score };
    }
  }

  return {
    outcome: 'loss', reason: 'budget-or-no-move', moves: state.moves,
    targetCost: state.maxMoves + 1, score: state.score,
  };
}

function expectedLabel(move) {
  if (HELPFUL_MOVES.includes(move)) return 'helpful';
  if (HARMFUL_MOVES.includes(move)) return 'harmful';
  if (NEUTRAL_MOVES.includes(move)) return 'neutral';
  return null;
}

function observedLabel(gain) {
  if (gain > 0) return 'helpful';
  if (gain < 0) return 'harmful';
  return 'neutral';
}

function collectPanel(candidate, recording) {
  const finishes = [];
  for (let prefix = 0; prefix <= recording.chains.length; prefix++) {
    finishes.push(finishAfterPrefix(candidate, recording, prefix));
  }

  const cells = [];
  for (let index = 0; index < recording.chains.length; index++) {
    const move = index + 1;
    const arms = {};
    for (const arm of ['owner', 'champion']) {
      const { state, rng } = prefixState(candidate, recording, index);
      const chain = arm === 'owner'
        ? liveRecordedChain(state, recording.chains[index])
        : chooseMove(state, {
          lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + index),
        });
      if (!chain) throw new Error(`${arm} has no legal move at decision ${move}`);
      const length = chain.length;
      const sum = chain.reduce((total, tile) => total + tile.value, 0);
      const survivor = { x: chain[length - 1].x, y: chain[length - 1].y };
      const points = advance(state, rng, chain);
      arms[arm] = {
        choice: { length, sum, points, survivor },
        proxy: normalizedBuiltReservoirHarvest(state),
      };
    }

    const takeoverGain = finishes[index].targetCost - finishes[index + 1].targetCost;
    cells.push({
      move,
      expectedLabel: expectedLabel(move),
      observedLabel: observedLabel(takeoverGain),
      takeoverGain,
      takeoverBefore: finishes[index],
      takeoverAfter: finishes[index + 1],
      arms,
    });
  }
  return { finishes, cells };
}

function collectQualification({
  recordingPath,
  contractPath,
  expectedRecordingSha256,
  expectedBotSha256,
  expectedEngineSha256,
  expectedContractSha256,
  expectedProbeSha256 = null,
  expectedHarnessSha256 = null,
  manifestIdentity = null,
}) {
  const absoluteRecording = path.resolve(recordingPath);
  const absoluteContract = path.resolve(contractPath);
  const sources = {
    recording: requireIdentity('recording', absoluteRecording, expectedRecordingSha256),
    bot: requireIdentity('champion', path.join(ROOT, 'solver', 'bot.js'), expectedBotSha256),
    engine: requireIdentity('ruleset', path.join(ROOT, 'solver', 'engine.js'), expectedEngineSha256),
    contract: requireIdentity('contract', absoluteContract, expectedContractSha256),
    probe: expectedProbeSha256
      ? requireIdentity('probe', path.join(ROOT, 'solver', 'built-reservoir-probe.js'), expectedProbeSha256)
      : sha256File(path.join(ROOT, 'solver', 'built-reservoir-probe.js')),
    harness: expectedHarnessSha256
      ? requireIdentity('harness', __filename, expectedHarnessSha256)
      : sha256File(__filename),
  };

  const recording = JSON.parse(fs.readFileSync(absoluteRecording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording to a board');
  const candidate = resolved.candidate;
  const controls = [
    ...runSyntheticControls(),
    realInputIntegrityControl(candidate, recording),
  ];
  if (controls.some(({ pass }) => !pass)) {
    return artifactWithIdentity({
      schemaVersion: 1,
      kind: 'built-reservoir-proxy-qualification',
      sources,
      manifestIdentity,
      controls,
      panel: null,
    });
  }

  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'built-reservoir-proxy-qualification',
    sources,
    manifestIdentity,
    controls,
    panel: collectPanel(candidate, recording),
  });
}

function qualify(artifact) {
  const problems = [];
  if (!verifyArtifactIdentity(artifact)) problems.push('artifact identity mismatch');
  for (const control of artifact.controls || []) {
    if (!control.pass) problems.push(`control ${control.id} failed`);
  }
  if (!artifact.panel) problems.push('decision panel was not collected');

  const cells = artifact.panel ? artifact.panel.cells : [];
  const expectedMoves = [...HELPFUL_MOVES, ...HARMFUL_MOVES, ...NEUTRAL_MOVES].sort((a, b) => a - b);
  const observedMoves = cells.map(({ move }) => move);
  if (JSON.stringify(observedMoves) !== JSON.stringify(expectedMoves)) {
    problems.push(`decision matrix mismatch: expected ${expectedMoves.join(',')}, observed ${observedMoves.join(',')}`);
  }
  for (const cell of cells) {
    if (cell.expectedLabel !== cell.observedLabel) {
      problems.push(`move ${cell.move} takeover label drifted from ${cell.expectedLabel} to ${cell.observedLabel}`);
    }
    for (const arm of ['owner', 'champion']) {
      if (cell.arms[arm].proxy.status !== 'MEASURED') {
        problems.push(`move ${cell.move} ${arm} proxy is ${cell.arms[arm].proxy.status}`);
      }
    }
  }
  if (problems.length) {
    return { qualification: 'UNVERIFIED', problems, failures: [] };
  }

  const decisionCells = cells.filter(({ expectedLabel: label }) => label !== 'neutral');
  const failures = decisionCells.flatMap((cell) => {
    const owner = cell.arms.owner.proxy.normalizedPoints;
    const champion = cell.arms.champion.proxy.normalizedPoints;
    const pass = cell.expectedLabel === 'helpful' ? owner > champion : owner <= champion;
    return pass ? [] : [{
      move: cell.move,
      label: cell.expectedLabel,
      owner,
      champion,
      reason: cell.expectedLabel === 'helpful'
        ? 'helpful move did not strictly increase the proxy'
        : 'harmful move strictly increased the proxy',
    }];
  });

  return {
    qualification: failures.length === 0 ? 'PASS' : 'FAIL',
    decisionCells: decisionCells.length,
    passingCells: decisionCells.length - failures.length,
    failures,
    problems: [],
  };
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) {
    throw new Error(`--${name} is required`);
  }
  return process.argv[index + 1];
}

function optionalArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 || index === process.argv.length - 1 ? null : process.argv[index + 1];
}

function main() {
  const manifestOut = optionalArg('write-manifest');
  if (manifestOut) {
    const manifest = createManifest({
      recordingPath: arg('recording'),
      contractPath: arg('contract'),
    });
    writeJsonOnce(path.resolve(manifestOut), manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return 0;
  }

  const out = path.resolve(arg('out'));
  const artifact = collectFromManifest(path.resolve(arg('manifest')));
  const result = persistBeforeVerdict({
    file: out,
    artifact,
    validate(value) {
      if (!verifyArtifactIdentity(value)) throw new Error('refusing to persist invalid artifact identity');
    },
    evaluate: qualify,
  });
  process.stdout.write(`${JSON.stringify({
    ...result,
    artifactIdentity: artifact.artifactIdentity,
    rawArtifact: path.relative(ROOT, out),
  }, null, 2)}\n`);
  return result.qualification === 'UNVERIFIED' ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  HELPFUL_MOVES,
  HARMFUL_MOVES,
  NEUTRAL_MOVES,
  artifactWithIdentity,
  collectPanel,
  collectFromManifest,
  collectQualification,
  createManifest,
  qualify,
  realInputIntegrityControl,
  runSyntheticControls,
  verifyArtifactIdentity,
};
