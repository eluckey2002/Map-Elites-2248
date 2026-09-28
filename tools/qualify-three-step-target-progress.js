#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
  findBestChain,
} = require('../solver/engine');
const { chooseMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { replay } = require('../solver/recording-replay');
const {
  LOOKAHEAD_BASE,
  THREE_STEP_HORIZON,
  measureThreeStepTargetCost,
  sequenceCostFromOutcome,
  stateDiagnostics,
} = require('../solver/sequence-value-probe');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
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

function snapshotChoice(chain, points) {
  return {
    length: chain.length,
    sum: chain.reduce((total, tile) => total + tile.value, 0),
    points,
    survivor: { x: chain[chain.length - 1].x, y: chain[chain.length - 1].y },
  };
}

function advance(state, rng, chain) {
  const choice = snapshotChoice(chain, 0);
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  choice.points = points;
  return choice;
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
  if (checkBombs(state)) {
    return { outcome: 'loss', reason: 'bomb', moves: state.moves, targetCost: state.maxMoves + 1, score: state.score };
  }
  if (state.score >= state.targetScore) {
    return { outcome: 'win', moves: state.moves, targetCost: state.moves, score: state.score };
  }
  while (state.moves < state.maxMoves) {
    const chain = chooseMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
    });
    if (!chain) break;
    advance(state, rng, chain);
    if (checkBombs(state)) {
      return { outcome: 'loss', reason: 'bomb', moves: state.moves, targetCost: state.maxMoves + 1, score: state.score };
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

function measureArm(candidate, recording, decisionIndex, arm) {
  const { state, rng } = prefixState(candidate, recording, decisionIndex);
  const before = {
    score: state.score,
    moves: state.moves,
    targetScore: state.targetScore,
    maxMoves: state.maxMoves,
    diagnostics: stateDiagnostics(state),
  };
  const chain = arm === 'owner'
    ? liveRecordedChain(state, recording.chains[decisionIndex])
    : chooseMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + decisionIndex),
    });
  if (!chain) throw new Error(`${arm} has no candidate move at decision ${decisionIndex + 1}`);
  const choice = advance(state, rng, chain);
  const afterCandidate = {
    score: state.score,
    moves: state.moves,
    diagnostics: stateDiagnostics(state),
  };
  const sequence = measureThreeStepTargetCost(state, rng, {
    absoluteMoveIndex: decisionIndex + 1,
  });
  return { before, choice, afterCandidate, sequence };
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
    const owner = measureArm(candidate, recording, index, 'owner');
    const champion = measureArm(candidate, recording, index, 'champion');
    const takeoverGain = finishes[index].targetCost - finishes[index + 1].targetCost;
    cells.push({
      move,
      expectedLabel: expectedLabel(move),
      observedLabel: observedLabel(takeoverGain),
      takeoverGain,
      takeoverBefore: finishes[index],
      takeoverAfter: finishes[index + 1],
      arms: { owner, champion },
    });
  }
  return { finishes, cells };
}

function syntheticState({ targetScore = 27 } = {}) {
  return {
    gridWidth: 3,
    gridHeight: 3,
    grid: Array.from({ length: 3 }, (_, y) => (
      Array.from({ length: 3 }, (_, x) => ({ x, y, value: 2, blocker: null }))
    )),
    score: 0,
    moves: 0,
    maxMoves: 10,
    targetScore,
    minChain: 3,
    tileScale: 1,
  };
}

function scriptedChooser(state) {
  const result = findBestChain(state, { maxLength: 3 });
  return result ? result.chain : null;
}

function realInputIntegrityControl(candidate, recording) {
  const clean = replay(candidate, recording);
  const corrupted = structuredClone(recording);
  corrupted.chains[0].tiles[0].value += candidate.tileScale || 1;
  const planted = replay(candidate, corrupted);
  return {
    id: 'real-input-integrity',
    expected: 'clean replay and planted false value rejected',
    observed: { cleanProblems: clean.problems, plantedProblems: planted.problems },
    pass: clean.problems.length === 0
      && planted.problems.some((problem) => /recording claims/.test(problem)),
  };
}

function runPersistenceControl() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'three-step-persist-'));
  const file = path.join(directory, 'raw.json');
  const artifact = { complete: true, cells: [1, 2, 3] };
  let threw = false;
  try {
    persistBeforeVerdict({
      file,
      artifact,
      evaluate() { throw new Error('planted verdict failure'); },
    });
  } catch (error) {
    threw = /planted verdict failure/.test(error.message);
  }
  const retained = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  return {
    id: 'persistence-before-verdict',
    expected: 'planted verdict throws after complete raw artifact is written',
    observed: { threw, retained },
    pass: threw && JSON.stringify(retained) === JSON.stringify(artifact),
  };
}

function runControls(candidate, recording) {
  const bandObserved = [
    sequenceCostFromOutcome({ status: 'win', continuationMoves: 0, score: 100, targetScore: 100 }),
    sequenceCostFromOutcome({ status: 'win', continuationMoves: 3, score: 100, targetScore: 100 }),
    sequenceCostFromOutcome({ status: 'active', continuationMoves: 3, score: 75, targetScore: 100 }),
    sequenceCostFromOutcome({ status: 'loss', continuationMoves: 2, score: 75, targetScore: 100 }),
  ];
  const horizonThree = measureThreeStepTargetCost(syntheticState(), () => 0, {
    chooser: scriptedChooser,
    horizon: 3,
  });
  const horizonTwo = measureThreeStepTargetCost(syntheticState(), () => 0, {
    chooser: scriptedChooser,
    horizon: 2,
  });
  const scaleBase = sequenceCostFromOutcome({
    status: 'active', continuationMoves: 3, score: 75, targetScore: 100,
  });
  const scale32 = sequenceCostFromOutcome({
    status: 'active', continuationMoves: 3, score: 2400, targetScore: 3200,
  });
  const orthogonalA = sequenceCostFromOutcome({
    status: 'active', continuationMoves: 3, score: 75, targetScore: 100,
    normalizedBuiltMaterial: 0,
  });
  const orthogonalB = sequenceCostFromOutcome({
    status: 'active', continuationMoves: 3, score: 75, targetScore: 100,
    normalizedBuiltMaterial: 999,
  });
  const aaLeft = measureArm(candidate, recording, 2, 'champion');
  const aaRight = measureArm(candidate, recording, 2, 'champion');

  return [
    {
      id: 'band-order', expected: [0, 3, 4.25, 6.25], observed: bandObserved,
      pass: JSON.stringify(bandObserved) === JSON.stringify([0, 3, 4.25, 6.25]),
    },
    {
      id: 'third-step-horizon-kill',
      expected: { horizonThree: 3, horizonTwoGreaterThan: 4 },
      observed: { horizonThree: horizonThree.cost, horizonTwo: horizonTwo.cost },
      pass: horizonThree.status === 'win'
        && horizonThree.cost === 3
        && horizonTwo.status === 'active'
        && horizonTwo.cost > 4,
    },
    {
      id: 'scale-negative', expected: 'exact equality', observed: { scaleBase, scale32 },
      pass: scaleBase === scale32,
    },
    {
      id: 'orthogonal-diagnostic', expected: 'exact equality',
      observed: { withoutDiagnostic: orthogonalA, changedDiagnostic: orthogonalB },
      pass: orthogonalA === orthogonalB,
    },
    {
      id: 'real-reference-aa', expected: 'byte-identical measurements',
      observed: { equal: JSON.stringify(aaLeft) === JSON.stringify(aaRight) },
      pass: JSON.stringify(aaLeft) === JSON.stringify(aaRight),
    },
    realInputIntegrityControl(candidate, recording),
    runPersistenceControl(),
  ];
}

function createManifest({ recordingPath, contractPath }) {
  const absoluteRecording = path.resolve(recordingPath);
  const absoluteContract = path.resolve(contractPath);
  const files = {
    recording: absoluteRecording,
    contract: absoluteContract,
    bot: path.join(ROOT, 'solver', 'bot.js'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    game: path.join(ROOT, 'src', 'game.js'),
    builtProbe: path.join(ROOT, 'solver', 'built-reservoir-probe.js'),
    sequenceProbe: path.join(ROOT, 'solver', 'sequence-value-probe.js'),
    harness: __filename,
  };
  const identities = Object.fromEntries(
    Object.entries(files).map(([name, file]) => [name, sha256File(file)]),
  );
  const contract = fs.readFileSync(absoluteContract, 'utf8');
  for (const name of ['recording', 'bot', 'engine', 'game', 'builtProbe']) {
    if (!contract.includes(identities[name])) {
      throw new Error(`contract does not freeze observed ${name} identity ${identities[name]}`);
    }
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'three-step-target-progress-manifest',
    paths: {
      recording: path.relative(ROOT, absoluteRecording),
      contract: path.relative(ROOT, absoluteContract),
    },
    identities,
  });
}

function validateManifest(manifest) {
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.kind !== 'three-step-target-progress-manifest') {
    throw new Error(`unexpected manifest kind ${manifest.kind}`);
  }
  const paths = {
    recording: path.join(ROOT, manifest.paths.recording),
    contract: path.join(ROOT, manifest.paths.contract),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    game: path.join(ROOT, 'src', 'game.js'),
    builtProbe: path.join(ROOT, 'solver', 'built-reservoir-probe.js'),
    sequenceProbe: path.join(ROOT, 'solver', 'sequence-value-probe.js'),
    harness: __filename,
  };
  for (const [name, file] of Object.entries(paths)) {
    requireIdentity(name, file, manifest.identities[name]);
  }
  return paths;
}

function collectFromManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording to a board');
  const candidate = resolved.candidate;
  const controls = runControls(candidate, recording);
  if (controls.some(({ pass }) => !pass)) {
    return artifactWithIdentity({
      schemaVersion: 1,
      kind: 'three-step-target-progress-qualification',
      manifestIdentity: manifest.artifactIdentity,
      sources: manifest.identities,
      controls,
      panel: null,
    });
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'three-step-target-progress-qualification',
    manifestIdentity: manifest.artifactIdentity,
    sources: manifest.identities,
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
  if (JSON.stringify(cells.map(({ move }) => move)) !== JSON.stringify(expectedMoves)) {
    problems.push('decision matrix mismatch');
  }
  for (const cell of cells) {
    if (cell.expectedLabel !== cell.observedLabel) {
      problems.push(`move ${cell.move} takeover label drifted`);
    }
    const owner = cell.arms && cell.arms.owner;
    const champion = cell.arms && cell.arms.champion;
    if (!owner || !champion) {
      problems.push(`move ${cell.move} is missing a measured arm`);
      continue;
    }
    if (JSON.stringify(owner.before) !== JSON.stringify(champion.before)) {
      problems.push(`move ${cell.move} decision state mismatch`);
    }
    for (const arm of ['owner', 'champion']) {
      const measurement = cell.arms[arm];
      if (!measurement.sequence || !Number.isFinite(measurement.sequence.cost)) {
        problems.push(`move ${cell.move} ${arm} is unmeasured`);
        continue;
      }
      if (measurement.sequence.chooserCalls > THREE_STEP_HORIZON) {
        problems.push(`move ${cell.move} ${arm} exceeded chooser bound`);
      }
    }
  }
  if (problems.length) return { qualification: 'UNVERIFIED', problems, failures: [] };

  const decisionCells = cells.filter(({ expectedLabel: label }) => label !== 'neutral');
  const failures = decisionCells.flatMap((cell) => {
    const owner = cell.arms.owner.sequence.cost;
    const champion = cell.arms.champion.sequence.cost;
    const pass = cell.expectedLabel === 'helpful' ? owner < champion : owner >= champion;
    return pass ? [] : [{
      move: cell.move,
      label: cell.expectedLabel,
      owner,
      champion,
      reason: cell.expectedLabel === 'helpful'
        ? 'helpful move did not strictly reduce three-step target cost'
        : 'harmful move strictly reduced three-step target cost',
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
    const manifest = createManifest({ recordingPath: arg('recording'), contractPath: arg('contract') });
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
  collectFromManifest,
  collectPanel,
  createManifest,
  qualify,
  realInputIntegrityControl,
  runControls,
  runPersistenceControl,
  validateManifest,
  verifyArtifactIdentity,
};
