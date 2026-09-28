#!/usr/bin/env node
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyGravity,
  canExtendChain,
  checkBombs,
  createLevelState,
  executeChain,
  isBlockedTile,
  isValidChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { replay } = require('../solver/recording-replay');
const { LOOKAHEAD_BASE } = require('../solver/sequence-value-probe');
const {
  artifactWithIdentity,
  stateIdentity,
  swapNormalizedTiles,
  tileMultiset,
  verifyArtifactIdentity,
} = require('./diagnose-lc0004-move6-move8');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const FROZEN_STATE_ID = '416f6b90b1cde7d6761cf9f0177d0f8b17b42a27cd69223eceab07333e65fbe6';
const FROZEN_LC0004_ARTIFACT_ID = 'aba76b65d3c7a89a034c6dc8b2937e1c5b086f9ac23c23f9bcf00b27a42280d1';
const M8_CONNECT = Object.freeze({
  id: 'M8-CONNECT',
  a: { x: 0, y: 2, value: 32 },
  b: { x: 0, y: 4, value: 2 },
});
const PATH_REPAIR = Object.freeze({
  id: 'M8-PATH-REPAIR',
  a: { x: 3, y: 7, value: 32 },
  b: { x: 2, y: 7, value: 8 },
});
const COMPLETE_ROUTE = Object.freeze([
  [2, 0, 4], [3, 0, 4], [2, 1, 4],
  [3, 2, 8], [2, 2, 8], [1, 2, 16],
  [0, 3, 32], [0, 4, 32], [0, 5, 32],
  [1, 6, 32], [2, 5, 32], [3, 6, 32],
  [2, 7, 32], [1, 7, 32], [0, 7, 32],
  [0, 6, 64],
].map(([x, y, value]) => Object.freeze({ x, y, value })));

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
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

function snapshotChain(chain) {
  return chain.map(({ x, y, value }) => ({ x, y, value }));
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
  const snapshot = snapshotChain(chain);
  const survivor = chain[chain.length - 1];
  const points = executeChain(state, chain);
  applyGravity(state);
  const survivorAfterGravity = { x: survivor.x, y: survivor.y, value: survivor.value };
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return {
    points,
    length: snapshot.length,
    sum: snapshot.reduce((total, tile) => total + tile.value, 0),
    chain: snapshot,
    survivorAfterGravity,
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
    claims: snapshotChain(analysis.selectedChain),
    summary: {
      reason: analysis.reason,
      chainLength: selected.chainLength,
      chainSum: selected.chainSum,
      immediatePoints: selected.immediatePoints,
      twoMovePoints: selected.twoMovePoints,
      raw: selected.raw,
      chain: snapshotChain(selected.chain),
    },
  };
}

function reconstructM8Connect(candidate, recording) {
  const rng = trackedRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < 7; index++) advance(state, rng, recording.chains[index].tiles);
  advance(state, rng, recording.chains[7].tiles);
  for (let continuation = 0; continuation < 3; continuation++) {
    const selected = selectedChampion(state);
    if (!selected.claims) throw new Error('missing champion continuation before M8 cutoff');
    advance(state, rng, selected.claims);
  }
  swapNormalizedTiles(state, M8_CONNECT);
  if (stateIdentity(state) !== FROZEN_STATE_ID) {
    throw new Error(`M8-CONNECT state identity mismatch: expected ${FROZEN_STATE_ID}, observed ${stateIdentity(state)}`);
  }
  return { state, rng };
}

function normalizedPoint(state, point) {
  const tile = state.grid[point.y] && state.grid[point.y][point.x];
  if (!tile || isBlockedTile(tile)) return null;
  return { x: point.x, y: point.y, value: tile.value / (state.tileScale || 1) };
}

function chainFromNormalizedRoute(state, route) {
  return route.map((expected) => {
    const observed = normalizedPoint(state, expected);
    if (!observed) throw new Error(`route point ${expected.x},${expected.y} is absent or blocked`);
    if (observed.value !== expected.value) {
      throw new Error(`route point ${expected.x},${expected.y} expected ${expected.value}, observed ${observed.value}`);
    }
    return state.grid[expected.y][expected.x];
  });
}

function inspectChainLegality(state, route) {
  let chain;
  try {
    chain = chainFromNormalizedRoute(state, route);
  } catch (error) {
    return { legal: false, reason: error.message, route: route.map((point) => ({ ...point })) };
  }
  const seen = new Set();
  for (let index = 0; index < chain.length; index++) {
    const tile = chain[index];
    const key = `${tile.x},${tile.y}`;
    if (seen.has(key)) return { legal: false, reason: `repeated coordinate ${key}` };
    seen.add(key);
    if (index > 0) {
      const prior = chain[index - 1];
      if (Math.max(Math.abs(tile.x - prior.x), Math.abs(tile.y - prior.y)) !== 1) {
        return { legal: false, reason: `non-adjacent step ${prior.x},${prior.y}->${tile.x},${tile.y}` };
      }
      if (!canExtendChain(chain.slice(0, index), tile)) {
        return { legal: false, reason: `illegal value step ${prior.value}->${tile.value}` };
      }
    }
  }
  if (!isValidChain(chain, state.minChain)) return { legal: false, reason: 'engine rejected chain prefix rule' };
  return { legal: true, reason: 'legal', route: snapshotChain(chain) };
}

function builtCoordinates(state) {
  const scale = state.tileScale || 1;
  const cutoff = 16 * scale;
  const result = [];
  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      if (tile && !isBlockedTile(tile) && tile.value > cutoff) {
        result.push({ x, y, value: tile.value, normalizedValue: tile.value / scale });
      }
    }
  }
  return result;
}

function coordinateKey({ x, y }) {
  return `${x},${y}`;
}

function verifyBuiltCoverage(chain, built, claimedCovered = null) {
  const chainKeys = new Set(chain.map(coordinateKey));
  const covered = built.filter((tile) => chainKeys.has(coordinateKey(tile)));
  const excluded = built.filter((tile) => !chainKeys.has(coordinateKey(tile)));
  if (claimedCovered) {
    const actual = covered.map(coordinateKey).sort();
    const claimed = claimedCovered.map(coordinateKey).sort();
    if (JSON.stringify(actual) !== JSON.stringify(claimed)) {
      throw new Error(`claimed built coverage mismatch: expected ${actual.join('|')}, observed ${claimed.join('|')}`);
    }
  }
  return {
    builtCount: built.length,
    coveredCount: covered.length,
    complete: excluded.length === 0,
    covered,
    excluded,
  };
}

function maxBuiltPathFrom(state, start) {
  const built = builtCoordinates(state);
  const byKey = new Map(built.map((tile) => [coordinateKey(tile), state.grid[tile.y][tile.x]]));
  const startTile = byKey.get(coordinateKey(start));
  if (!startTile) throw new Error(`built start ${coordinateKey(start)} missing`);
  let best = [];
  function dfs(chain) {
    if (chain.length > best.length) best = chain.slice();
    const last = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const next = byKey.get(`${last.x + dx},${last.y + dy}`);
        if (!next || chain.includes(next) || !canExtendChain(chain, next)) continue;
        chain.push(next);
        dfs(chain);
        chain.pop();
      }
    }
  }
  dfs([startTile]);
  return snapshotChain(best);
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

function arm(candidate, recording, intervention = null) {
  const reconstructed = reconstructM8Connect(candidate, recording);
  const before = {
    stateIdentity: stateIdentity(reconstructed.state),
    score: reconstructed.state.score,
    moves: reconstructed.state.moves,
    targetScore: reconstructed.state.targetScore,
    maxMoves: reconstructed.state.maxMoves,
    tileMultiset: tileMultiset(reconstructed.state),
    rngCalls: reconstructed.rng.calls(),
  };
  let applied = null;
  if (intervention) applied = swapNormalizedTiles(reconstructed.state, intervention);
  const after = {
    stateIdentity: stateIdentity(reconstructed.state),
    score: reconstructed.state.score,
    moves: reconstructed.state.moves,
    targetScore: reconstructed.state.targetScore,
    maxMoves: reconstructed.state.maxMoves,
    tileMultiset: tileMultiset(reconstructed.state),
    rngCalls: reconstructed.rng.calls(),
  };
  const invariants = {
    scorePreserved: before.score === after.score,
    movesPreserved: before.moves === after.moves,
    targetPreserved: before.targetScore === after.targetScore,
    maxMovesPreserved: before.maxMoves === after.maxMoves,
    tileMultisetPreserved: JSON.stringify(before.tileMultiset) === JSON.stringify(after.tileMultiset),
    rngPositionPreserved: before.rngCalls === after.rngCalls,
    placementChangedAsDeclared: intervention ? before.stateIdentity !== after.stateIdentity : before.stateIdentity === after.stateIdentity,
  };
  if (!Object.values(invariants).every(Boolean)) throw new Error(`arm invariant failure: ${JSON.stringify(invariants)}`);

  const built = builtCoordinates(reconstructed.state);
  const selected = selectedChampion(reconstructed.state);
  const selectedCoverage = verifyBuiltCoverage(selected.claims || [], built);
  const predictedRoute = intervention ? inspectChainLegality(reconstructed.state, COMPLETE_ROUTE) : null;
  const predictedCoverage = predictedRoute && predictedRoute.legal
    ? verifyBuiltCoverage(predictedRoute.route, built)
    : null;
  const maxBuiltPath = maxBuiltPathFrom(reconstructed.state, { x: 0, y: 3 });
  const terminal = finishFromCutoff(reconstructed.state, reconstructed.rng);
  return {
    id: intervention ? intervention.id : 'M8-CONNECT-BASELINE',
    intervention: applied,
    before,
    after,
    invariants,
    built,
    maxBuiltPath,
    maxBuiltPathCoverage: verifyBuiltCoverage(maxBuiltPath, built),
    selected: selected.summary,
    selectedCoverage,
    predictedRoute,
    predictedCoverage,
    terminal,
  };
}

function disposition(artifact) {
  if (artifact.status !== 'COMPLETE') return 'UNVERIFIED';
  const repaired = artifact.arms.find(({ id }) => id === PATH_REPAIR.id);
  if (!repaired || !repaired.predictedRoute || !repaired.predictedRoute.legal
    || !repaired.predictedCoverage || !repaired.predictedCoverage.complete) return 'NO_COMPLETE_HARVEST';
  if (repaired.selectedCoverage.complete) return 'COMPLETE_HARVEST_SELECTED';
  return 'COMPLETE_HARVEST_AVAILABLE_NOT_SELECTED';
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  const body = { artifactIdentity: artifact.artifactIdentity, status: artifact.status };
  if (artifact.status !== 'COMPLETE') return body;
  const baseline = artifact.arms.find(({ id }) => id === 'M8-CONNECT-BASELINE');
  const repaired = artifact.arms.find(({ id }) => id === PATH_REPAIR.id);
  return {
    ...body,
    disposition: disposition(artifact),
    baseline: {
      selectedBuiltCoverage: baseline.selectedCoverage.coveredCount,
      excluded: baseline.selectedCoverage.excluded,
      maxBuiltPathCoverage: baseline.maxBuiltPathCoverage.coveredCount,
      immediatePoints: baseline.selected.immediatePoints,
      targetCost: baseline.terminal.targetCost,
    },
    repaired: {
      routeLegal: repaired.predictedRoute.legal,
      routeBuiltCoverage: repaired.predictedCoverage.coveredCount,
      selectedBuiltCoverage: repaired.selectedCoverage.coveredCount,
      immediatePoints: repaired.selected.immediatePoints,
      targetCost: repaired.terminal.targetCost,
      selectedChain: repaired.selected.chain,
    },
  };
}

function runPersistenceControl() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0005-persist-'));
  const file = path.join(directory, 'raw.json');
  const artifact = { complete: true, arms: ['baseline', 'repair'] };
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
  return { threw, retained, pass: threw && JSON.stringify(retained) === JSON.stringify(artifact) };
}

function qualificationControls(candidate, recording, lc0004) {
  const replayed = replay(candidate, recording);
  const first = reconstructM8Connect(candidate, recording);
  const second = reconstructM8Connect(candidate, recording);
  const retained = lc0004.arms.find(({ id }) => id === 'M8-CONNECT');
  if (!retained) throw new Error('LC-0004 M8-CONNECT arm missing');
  const firstSelected = selectedChampion(first.state).summary;
  const firstFinish = finishFromCutoff(first.state, first.rng);
  const secondSelected = selectedChampion(second.state).summary;
  const secondFinish = finishFromCutoff(second.state, second.rng);

  const positiveState = fixtureState([
    [0, 0, 4], [1, 0, 4], [2, 0, 8], [3, 0, 16], [4, 0, 32], [5, 0, 64],
  ], 6, 1);
  const negativeState = fixtureState([
    [0, 0, 4], [1, 0, 4], [2, 0, 8], [3, 2, 16], [4, 0, 32], [5, 0, 64],
  ], 6, 3);
  const fixtureRoute = [
    { x: 0, y: 0, value: 4 }, { x: 1, y: 0, value: 4 },
    { x: 2, y: 0, value: 8 }, { x: 3, y: 0, value: 16 },
    { x: 4, y: 0, value: 32 }, { x: 5, y: 0, value: 64 },
  ];
  const negativeRoute = fixtureRoute.map((point) => (
    point.x === 3 ? { ...point, y: 2 } : point
  ));
  const positive = inspectChainLegality(positiveState, fixtureRoute);
  const negative = inspectChainLegality(negativeState, negativeRoute);

  const built = builtCoordinates(reconstructM8Connect(candidate, recording).state);
  const cleanCoverage = verifyBuiltCoverage(firstSelected.chain, built);
  let mutationKilled = false;
  let mutationMessage = null;
  const planted = cleanCoverage.covered.concat(cleanCoverage.excluded.slice(0, 1));
  try {
    verifyBuiltCoverage(firstSelected.chain, built, planted);
  } catch (error) {
    mutationKilled = true;
    mutationMessage = error.message;
  }
  const predicateIdentityBefore = sha256Bytes(verifyBuiltCoverage.toString());
  const predicateIdentityAfter = sha256Bytes(verifyBuiltCoverage.toString());
  const persistence = runPersistenceControl();

  return [
    {
      id: 'C1-deterministic-source-and-replay',
      pass: replayed.problems.length === 0
        && lc0004.artifactIdentity === FROZEN_LC0004_ARTIFACT_ID
        && retained.after.stateIdentity === FROZEN_STATE_ID
        && stateIdentity(reconstructM8Connect(candidate, recording).state) === FROZEN_STATE_ID
        && JSON.stringify(firstSelected.chain) === JSON.stringify(retained.after.nextChampionDecision.chain),
      observed: { replayProblems: replayed.problems, retainedState: retained.after.stateIdentity, reconstructedState: FROZEN_STATE_ID },
    },
    {
      id: 'C2-reference-policy-aa',
      pass: JSON.stringify(firstSelected) === JSON.stringify(secondSelected)
        && JSON.stringify(firstFinish) === JSON.stringify(secondFinish)
        && firstFinish.targetCost === 14,
      observed: { equalChoice: JSON.stringify(firstSelected) === JSON.stringify(secondSelected), equalFinish: JSON.stringify(firstFinish) === JSON.stringify(secondFinish), targetCost: firstFinish.targetCost },
    },
    {
      id: 'C3-chain-legality-known-kill',
      pass: positive.legal && !negative.legal && /non-adjacent/.test(negative.reason),
      observed: { positive, negative },
    },
    {
      id: 'C4-planted-coverage-mutation',
      pass: mutationKilled && /claimed built coverage mismatch/.test(mutationMessage || ''),
      observed: { mutantPresent: planted.length === cleanCoverage.covered.length + 1, mutantReachedRealPredicate: true, mutationKilled, mutationMessage },
    },
    {
      id: 'C6-restoration-and-persistence',
      pass: predicateIdentityBefore === predicateIdentityAfter && persistence.pass,
      observed: { predicateIdentityBefore, predicateIdentityAfter, persistence },
    },
  ];
}

function fixtureState(points, width, height) {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
  for (const [x, y, value] of points) {
    grid[y][x] = { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
  }
  return { grid, gridWidth: width, gridHeight: height, minChain: 3, tileScale: 1 };
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    lc0004Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0004-move6-move8-causal-contrast-raw.json'),
    lc0004Harness: path.join(ROOT, 'tools', 'diagnose-lc0004-move6-move8.js'),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    game: path.join(ROOT, 'src', 'game.js'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0005CompleteHarvest.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['lc0004Raw', 'lc0004Harness', 'recording', 'bot', 'engine', 'game']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity ${identities[name]}`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0005-complete-harvest-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) throw new TypeError('expected manifest identity must be a full SHA-256');
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) {
    throw new Error(`expected manifest identity ${expectedManifestIdentity}, observed ${manifest.artifactIdentity}`);
  }
  if (manifest.kind !== 'lc0005-complete-harvest-manifest') throw new Error(`unexpected manifest kind ${manifest.kind}`);
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    const observed = sha256File(file);
    if (observed !== manifest.identities[name]) throw new Error(`${name} identity mismatch: expected ${manifest.identities[name]}, observed ${observed}`);
    paths[name] = file;
  }
  return paths;
}

function loadInputs(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');
  const lc0004 = JSON.parse(fs.readFileSync(paths.lc0004Raw, 'utf8'));
  if (!verifyArtifactIdentity(lc0004) || lc0004.artifactIdentity !== FROZEN_LC0004_ARTIFACT_ID) throw new Error('LC-0004 raw identity mismatch');
  return { manifest, paths, recording, candidate: resolved.candidate, lc0004 };
}

function committedFileMatches(file) {
  const relative = path.relative(ROOT, file);
  const committed = execFileSync('git', ['show', `HEAD:${relative}`], { cwd: ROOT });
  return committed.equals(fs.readFileSync(file));
}

function exerciseCloseout({
  contractPath,
  expectedContractIdentity,
  manifestIdentity,
  reportableOut,
  recomputedOut,
}) {
  if (sha256File(contractPath) !== expectedContractIdentity) {
    throw new Error('closeout contract external identity mismatch');
  }
  if (fs.existsSync(reportableOut) || fs.existsSync(recomputedOut)) {
    throw new Error('qualification requires absent reportable artifact paths');
  }
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (contract.final_subject_identity !== manifestIdentity) {
    throw new Error('closeout final subject does not match manifest identity');
  }
  const receiptPath = path.join(path.dirname(contractPath), 'LC-0005-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0005-complete-harvest-raw',
    status: 'SYNTHETIC_QUALIFICATION',
  });
  let verifierOutput;
  try {
    fs.writeFileSync(reportableOut, `${JSON.stringify(synthetic, null, 2)}\n`, { flag: 'wx' });
    const summary = summaryFromArtifact(synthetic);
    fs.writeFileSync(recomputedOut, `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0005-SYNTHETIC-QUALIFICATION',
      final_subject_identity: manifestIdentity,
      closure_status: 'CLOSED',
      claims: contract.required_claims.map((id) => ({
        id, status: 'PASS', evidence_subject_identity: manifestIdentity, reason: 'synthetic closeout-path qualification',
      })),
      artifacts: [
        { id: 'raw', path: path.basename(reportableOut), sha256: sha256File(reportableOut) },
        { id: 'primary-recomputation', path: path.basename(recomputedOut), sha256: sha256File(recomputedOut) },
      ],
      primary_outcome: 'SYNTHETIC_CLOSEOUT_PASS',
      deviations: [],
      attempts: [{ id: 'qualification-1', exit_code: 0, artifact_ids: ['raw', 'primary-recomputation'] }],
    };
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
    const verifier = '/Users/eluckey/.codex/skills/close-experiment/scripts/verify_closure.py';
    verifierOutput = execFileSync('python3', [
      verifier,
      contractPath,
      receiptPath,
      '--run-recomputation',
      '--require-closed',
      '--expected-contract-sha256',
      expectedContractIdentity,
    ], { cwd: ROOT, encoding: 'utf8' });
    const parsed = JSON.parse(verifierOutput);
    return {
      pass: parsed.verdict === 'PASS' && parsed.recomputation === 'PASS',
      verifier,
      resolvedCwd: path.resolve(path.dirname(contractPath), contract.recomputation.cwd),
      resolvedArgvFiles: contract.recomputation.argv.filter((value) => value.includes('/'))
        .map((value) => path.resolve(path.resolve(path.dirname(contractPath), contract.recomputation.cwd), value)),
      verdict: parsed,
    };
  } finally {
    for (const file of [receiptPath, recomputedOut, reportableOut]) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

function qualifyHarness({
  manifestPath,
  expectedManifestIdentity,
  closeoutContract,
  expectedCloseoutIdentity,
  reportableOut,
  recomputedOut,
}) {
  const inputs = loadInputs(manifestPath, expectedManifestIdentity);
  const controls = qualificationControls(inputs.candidate, inputs.recording, inputs.lc0004);
  const substituted = structuredClone(inputs.manifest);
  substituted.identities.bot = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = substituted;
  substituted.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentRejected = false;
  try {
    validateManifest(substituted, expectedManifestIdentity);
  } catch (error) {
    coherentRejected = /expected manifest identity/.test(error.message);
  }
  const admission = exerciseCloseout({
    contractPath: closeoutContract,
    expectedContractIdentity: expectedCloseoutIdentity,
    manifestIdentity: inputs.manifest.artifactIdentity,
    reportableOut,
    recomputedOut,
  });
  const committed = ['contract', 'harness', 'test'].map((name) => ({ name, pass: committedFileMatches(inputs.paths[name]) }));
  committed.push({ name: 'manifest', pass: committedFileMatches(manifestPath) });
  committed.push({ name: 'closeoutContract', pass: committedFileMatches(closeoutContract) });
  const pass = controls.every(({ pass: controlPass }) => controlPass)
    && coherentRejected
    && committed.every(({ pass: filePass }) => filePass)
    && admission.pass
    && !fs.existsSync(reportableOut);
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0005-harness-qualification',
    status: pass ? 'PASS' : 'FAIL',
    attempt: 1,
    manifestIdentity: inputs.manifest.artifactIdentity,
    harnessIdentity: inputs.manifest.identities.harness,
    controls,
    preOutcomeAdmission: admission,
    closeoutContractIdentity: expectedCloseoutIdentity,
    coherentSubstitutionRejected: coherentRejected,
    committed,
    reportableOutputAbsent: !fs.existsSync(reportableOut),
  });
}

function collect(manifestPath, expectedManifestIdentity) {
  const inputs = loadInputs(manifestPath, expectedManifestIdentity);
  const controls = qualificationControls(inputs.candidate, inputs.recording, inputs.lc0004);
  if (!controls.every(({ pass }) => pass)) throw new Error('preflight control failure');
  const baseline = arm(inputs.candidate, inputs.recording);
  const repaired = arm(inputs.candidate, inputs.recording, PATH_REPAIR);
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0005-complete-harvest-raw',
    status: 'COMPLETE',
    manifestIdentity: inputs.manifest.artifactIdentity,
    bounds: { exactStates: 1, interventions: [PATH_REPAIR.id], freshSeeds: 0 },
    controls,
    arms: [baseline, repaired],
  });
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
  const recompute = optionalArg('recompute');
  if (recompute) {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(recompute), 'utf8'));
    process.stdout.write(`${JSON.stringify(summaryFromArtifact(artifact), null, 2)}\n`);
    return;
  }
  const manifestOut = optionalArg('write-manifest');
  if (manifestOut) {
    const manifest = createManifest({ contractPath: arg('contract') });
    writeJsonOnce(path.resolve(manifestOut), manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  const qualificationOut = optionalArg('qualify-out');
  if (qualificationOut) {
    const receipt = qualifyHarness({
      manifestPath: path.resolve(arg('manifest')),
      expectedManifestIdentity: arg('expected-manifest-identity'),
      closeoutContract: path.resolve(arg('closeout-contract')),
      expectedCloseoutIdentity: arg('expected-closeout-identity'),
      reportableOut: path.resolve(arg('reportable-out')),
      recomputedOut: path.resolve(arg('recomputed-out')),
    });
    writeJsonOnce(path.resolve(qualificationOut), receipt);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    if (receipt.status !== 'PASS') process.exitCode = 1;
    return;
  }
  const artifact = collect(path.resolve(arg('manifest')), arg('expected-manifest-identity'));
  const summary = persistBeforeVerdict({
    file: path.resolve(arg('out')),
    artifact,
    validate(value) { if (!verifyArtifactIdentity(value)) throw new Error('raw artifact identity mismatch'); },
    evaluate: summaryFromArtifact,
  });
  process.stdout.write(`${JSON.stringify({ output: path.relative(ROOT, path.resolve(arg('out'))), ...summary }, null, 2)}\n`);
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
  COMPLETE_ROUTE,
  PATH_REPAIR,
  builtCoordinates,
  disposition,
  inspectChainLegality,
  maxBuiltPathFrom,
  summaryFromArtifact,
  validateManifest,
  verifyBuiltCoverage,
};
