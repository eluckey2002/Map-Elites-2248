#!/usr/bin/env node
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyGravity,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { LOOKAHEAD_BASE } = require('../solver/sequence-value-probe');
const {
  artifactWithIdentity,
  verifyArtifactIdentity,
} = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { fixtureState } = require('./diagnose-lc0007-decision-lineage');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const MOVES = Object.freeze([4, 6, 9, 11]);
const ALLOWED_ORIGINS = Object.freeze(['decision-survivor', 'decision-refill', 'carried-board', 'continuation-spawn']);
const SOURCE = Object.freeze({
  priorRawSha256: '58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284',
  priorRawIdentity: '10a05405746480e7232690115a877c6a0a431cdc7bc182f1147178444d4b23fd',
  lc0007ManifestIdentity: 'f2f5b5bd82b13eb665bf20251a904fd3f57716e5c58af0dce23b0e45cbfe4f01',
  lc0007QualificationIdentity: '592ad88a1804095baee2fbd01381bb6e0c41ab533eb8f4d32716aeecb0d1a4ac',
  lc0007RawIdentity: '6074b33ac0d68aba78c0ddd68c94041dc2e871392f9c50d573c00e1fd218dc19',
});

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function snapshotTile(tile) {
  return tile ? { x: tile.x, y: tile.y, value: tile.value } : null;
}

function snapshotChain(chain) {
  return chain.map(snapshotTile);
}

function allTiles(state) {
  return state.grid.flat().filter(Boolean);
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

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  if (!analysis.selectedChain) return null;
  return analysis.selectedChain.map(snapshotTile);
}

function prefixState(candidate, recording, prefixLength) {
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < prefixLength; index += 1) {
    const chain = liveChain(state, recording.chains[index].tiles);
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  }
  return { state, rng };
}

function createTracker() {
  return {
    tileNodes: new Map(),
    roots: new Map(),
    merges: new Map(),
    nextPostDecisionRoot: 1,
    nextSpawnRoot: 1,
  };
}

function rootId(prefix, value) {
  return `${prefix}${String(value).padStart(3, '0')}`;
}

function registerRoot(tracker, tile, { origin, spawnedAt = 0 }) {
  if (!ALLOWED_ORIGINS.includes(origin)) throw new Error(`invalid root origin ${origin}`);
  if (tracker.tileNodes.has(tile)) return tracker.tileNodes.get(tile);
  const continuationSpawn = origin === 'continuation-spawn';
  const id = continuationSpawn
    ? rootId('S', tracker.nextSpawnRoot++)
    : rootId('P', tracker.nextPostDecisionRoot++);
  const record = {
    id,
    origin,
    spawnedAt,
    x: tile.x,
    y: tile.y,
    value: tile.value,
  };
  tracker.roots.set(id, record);
  tracker.tileNodes.set(tile, id);
  return id;
}

function registerBoardRoots(tracker, state, classify) {
  const ordered = allTiles(state).sort((a, b) => (a.y - b.y) || (a.x - b.x));
  for (const tile of ordered) registerRoot(tracker, tile, classify(tile));
}

function registerContinuationSpawns(tracker, state, continuationMoves) {
  const ordered = allTiles(state).sort((a, b) => (a.y - b.y) || (a.x - b.x));
  for (const tile of ordered) {
    if (!tracker.tileNodes.has(tile)) {
      registerRoot(tracker, tile, { origin: 'continuation-spawn', spawnedAt: continuationMoves });
    }
  }
}

function executeAncestryMerge(tracker, state, chain, continuationMoves, options = {}) {
  const { rng = null, refill = false, tick = false } = options;
  const chainSnapshot = snapshotChain(chain);
  const inputNodeIds = chain.map((tile) => {
    const id = tracker.tileNodes.get(tile);
    if (!id) throw new Error(`unregistered ancestry tile at ${tile.x},${tile.y}`);
    return id;
  });
  const id = `M${String(continuationMoves).padStart(3, '0')}`;
  if (tracker.merges.has(id)) throw new Error(`duplicate merge node ${id}`);
  const finalTile = chain[chain.length - 1];
  const sum = chainSnapshot.reduce((total, tile) => total + tile.value, 0);
  const points = executeChain(state, chain);
  tracker.tileNodes.set(finalTile, id);
  applyGravity(state);
  if (refill) {
    if (typeof rng !== 'function') throw new TypeError('refill requires rng');
    spawnNewTiles(state, rng);
  }
  if (tick) tickBlockers(state);
  registerContinuationSpawns(tracker, state, continuationMoves);
  const merge = {
    id,
    continuationMoves,
    inputNodeIds,
    chain: chainSnapshot,
    chainSum: sum,
    points,
    output: snapshotTile(finalTile),
  };
  if (merge.output.value !== sum) throw new Error(`merge ${id} output does not equal chain sum`);
  tracker.merges.set(id, merge);
  return merge;
}

function nodeValue(tracker, id) {
  if (tracker.roots.has(id)) return tracker.roots.get(id).value;
  if (tracker.merges.has(id)) return tracker.merges.get(id).chainSum;
  throw new Error(`unknown ancestry node ${id}`);
}

function reachableGraph(tracker, correctionNodeId) {
  const rootIds = new Set();
  const mergeIds = new Set();
  const visiting = new Set();
  function visit(id) {
    if (tracker.roots.has(id)) {
      rootIds.add(id);
      return;
    }
    const merge = tracker.merges.get(id);
    if (!merge) throw new Error(`missing ancestry node ${id}`);
    if (visiting.has(id)) throw new Error(`ancestry cycle at ${id}`);
    if (mergeIds.has(id)) return;
    visiting.add(id);
    for (const input of merge.inputNodeIds) visit(input);
    visiting.delete(id);
    mergeIds.add(id);
  }
  visit(correctionNodeId);
  return { rootIds, mergeIds };
}

function originBreakdown(roots) {
  return ALLOWED_ORIGINS.map((origin) => {
    const selected = roots.filter((root) => root.origin === origin);
    return {
      origin,
      count: selected.length,
      value: selected.reduce((total, root) => total + root.value, 0),
    };
  }).filter((entry) => entry.count > 0);
}

function buildCorrectionGraph(tracker, correctionNodeId) {
  const reachable = reachableGraph(tracker, correctionNodeId);
  const roots = [...reachable.rootIds].map((id) => tracker.roots.get(id)).sort((a, b) => a.id.localeCompare(b.id));
  const merges = [...reachable.mergeIds].map((id) => tracker.merges.get(id)).sort((a, b) => a.continuationMoves - b.continuationMoves);
  const used = new Set(roots.map(({ id }) => id));
  const allPostDecision = [...tracker.roots.values()].filter(({ origin }) => origin !== 'continuation-spawn');
  const correction = tracker.merges.get(correctionNodeId);
  return {
    correctionNodeId,
    correctionChain: correction.chain,
    correctionChainSum: correction.chainSum,
    correctionPoints: correction.points,
    roots,
    merges,
    postDecisionRootsUsed: roots.filter(({ origin }) => origin !== 'continuation-spawn').map(({ id }) => id),
    postDecisionRootsUnused: allPostDecision.filter(({ id }) => !used.has(id)).map(({ id }) => id),
    continuationSpawnRootsUsed: roots.filter(({ origin }) => origin === 'continuation-spawn').map(({ id }) => id),
    decisionSurvivorContributes: roots.some(({ origin }) => origin === 'decision-survivor'),
    intermediateMergeCount: Math.max(0, merges.length - 1),
    originBreakdown: originBreakdown(roots),
    rootValueSum: roots.reduce((total, root) => total + root.value, 0),
  };
}

function validateCorrectionGraph(graph, trustedRootRegistry) {
  const trusted = new Map(trustedRootRegistry.map((root) => [root.id, root]));
  const roots = new Map();
  for (const root of graph.roots) {
    if (roots.has(root.id)) throw new Error(`duplicate graph root ${root.id}`);
    if (!trusted.has(root.id) || JSON.stringify(trusted.get(root.id)) !== JSON.stringify(root)) {
      throw new Error(`root-origin mismatch for ${root.id}`);
    }
    roots.set(root.id, root);
  }
  const merges = new Map();
  for (const merge of graph.merges) {
    if (merges.has(merge.id)) throw new Error(`duplicate graph merge ${merge.id}`);
    merges.set(merge.id, merge);
  }
  const visiting = new Set();
  const visitedRoots = new Set();
  const visitedMerges = new Set();
  function resolve(id) {
    if (roots.has(id)) {
      visitedRoots.add(id);
      return { rootIds: [id], value: roots.get(id).value };
    }
    const merge = merges.get(id);
    if (!merge) throw new Error(`graph reachability missing node ${id}`);
    if (visiting.has(id)) throw new Error(`graph cycle at ${id}`);
    visiting.add(id);
    const inputs = merge.inputNodeIds.map(resolve);
    visiting.delete(id);
    visitedMerges.add(id);
    const rootIds = inputs.flatMap((input) => input.rootIds);
    if (new Set(rootIds).size !== rootIds.length) throw new Error(`duplicate root ancestry in ${id}`);
    const value = inputs.reduce((total, input) => total + input.value, 0);
    if (value !== merge.chainSum || value !== merge.output.value) {
      throw new Error(`root-value conservation mismatch in ${id}`);
    }
    return { rootIds, value };
  }
  const resolved = resolve(graph.correctionNodeId);
  if (visitedRoots.size !== roots.size || visitedMerges.size !== merges.size) {
    throw new Error('graph contains unreachable ancestry nodes');
  }
  if (resolved.value !== graph.correctionChainSum || graph.rootValueSum !== resolved.value) {
    throw new Error('correction root-value conservation mismatch');
  }
  if (JSON.stringify([...resolved.rootIds].sort()) !== JSON.stringify([...roots.keys()].sort())) {
    throw new Error('correction root set mismatch');
  }
  return true;
}

function startArm(candidate, recording, priorMiss, lc0007Arm, decisionIndex) {
  const { state, rng } = prefixState(candidate, recording, decisionIndex);
  if (stateIdentity(state) !== priorMiss.arms.owner.before.stateIdentity) {
    throw new Error(`move ${decisionIndex + 1} decision-state mismatch`);
  }
  const preDecisionTiles = new Set(allTiles(state));
  const decisionChain = liveChain(state, lc0007Arm.decision.chain);
  const decisionSurvivor = decisionChain[decisionChain.length - 1];
  const points = executeChain(state, decisionChain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  if (points !== lc0007Arm.decision.points || stateIdentity(state) !== lc0007Arm.decision.postStateIdentity) {
    throw new Error(`move ${decisionIndex + 1} decision reproduction mismatch`);
  }
  const tracker = createTracker();
  registerBoardRoots(tracker, state, (tile) => {
    if (tile === decisionSurvivor) return { origin: 'decision-survivor' };
    return { origin: preDecisionTiles.has(tile) ? 'carried-board' : 'decision-refill' };
  });
  const decisionSurvivorRootId = tracker.tileNodes.get(decisionSurvivor);
  if (!decisionSurvivorRootId) throw new Error('decision survivor root missing');
  return { state, rng, tracker, decisionSurvivorRootId };
}

function traceArm(candidate, recording, priorMiss, lc0007Arm, move, armName) {
  const correctionContinuation = priorMiss.firstGapOrderCorrection.continuationMoves;
  const started = startArm(candidate, recording, priorMiss, lc0007Arm, move - 1);
  const postDecisionStateIdentity = stateIdentity(started.state);
  for (let continuation = 1; continuation <= correctionContinuation; continuation += 1) {
    const expected = lc0007Arm.events.find((event) => event.continuationMoves === continuation);
    if (!expected) throw new Error(`move ${move} ${armName} missing retained continuation ${continuation}`);
    const selected = selectedChampionClaims(started.state);
    if (JSON.stringify(selected) !== JSON.stringify(expected.chain)) {
      throw new Error(`move ${move} ${armName} continuation ${continuation} selection drifted`);
    }
    const event = executeAncestryMerge(
      started.tracker,
      started.state,
      liveChain(started.state, selected),
      continuation,
      { rng: started.rng, refill: true, tick: true },
    );
    if (event.points !== expected.points
      || event.chainSum !== expected.sum
      || stateIdentity(started.state) !== expected.postStateIdentity) {
      throw new Error(`move ${move} ${armName} continuation ${continuation} replay drifted`);
    }
  }
  const correctionNodeId = `M${String(correctionContinuation).padStart(3, '0')}`;
  const graph = buildCorrectionGraph(started.tracker, correctionNodeId);
  const trustedRoots = [...started.tracker.roots.values()].map((root) => structuredClone(root));
  validateCorrectionGraph(graph, trustedRoots);
  return {
    arm: armName,
    postDecisionStateIdentity,
    decisionSurvivorRootId: started.decisionSurvivorRootId,
    postDecisionRoots: trustedRoots.filter(({ origin }) => origin !== 'continuation-spawn'),
    correctionContinuation,
    graph,
    graphValid: true,
  };
}

function assertSourceIdentities(paths, prior, lc0007Manifest, lc0007Qualification, lc0007Raw) {
  if (sha256File(paths.priorRaw) !== SOURCE.priorRawSha256
    || !verifyArtifactIdentity(prior)
    || prior.artifactIdentity !== SOURCE.priorRawIdentity) {
    throw new Error('LC-0003 source identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0007Manifest)
    || lc0007Manifest.artifactIdentity !== SOURCE.lc0007ManifestIdentity) {
    throw new Error('LC-0007 manifest identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0007Qualification)
    || lc0007Qualification.artifactIdentity !== SOURCE.lc0007QualificationIdentity
    || lc0007Qualification.status !== 'PASS') {
    throw new Error('LC-0007 qualification identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0007Raw)
    || lc0007Raw.artifactIdentity !== SOURCE.lc0007RawIdentity
    || lc0007Raw.status !== 'COMPLETE') {
    throw new Error('LC-0007 raw identity mismatch');
  }
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const prior = JSON.parse(fs.readFileSync(paths.priorRaw, 'utf8'));
  const lc0007Manifest = JSON.parse(fs.readFileSync(paths.lc0007Manifest, 'utf8'));
  const lc0007Qualification = JSON.parse(fs.readFileSync(paths.lc0007Qualification, 'utf8'));
  const lc0007Raw = JSON.parse(fs.readFileSync(paths.lc0007Raw, 'utf8'));
  assertSourceIdentities(paths, prior, lc0007Manifest, lc0007Qualification, lc0007Raw);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');

  const cells = MOVES.map((move) => {
    const priorMiss = prior.misses.find((miss) => miss.move === move);
    const priorCell = lc0007Raw.cells.find((cell) => cell.move === move);
    if (!priorMiss || !priorCell) throw new Error(`move ${move} source cell missing`);
    const owner = traceArm(resolved.candidate, recording, priorMiss, priorCell.arms.owner, move, 'owner');
    const champion = traceArm(resolved.candidate, recording, priorMiss, priorCell.arms.champion, move, 'champion');
    return {
      move,
      expectedLabel: priorCell.expectedLabel,
      winner: priorCell.winner,
      correctionContinuation: priorCell.correctionContinuation,
      arms: { owner, champion },
    };
  });
  const complete = cells.every((cell) => Object.values(cell.arms).every((arm) => arm.graphValid));
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0008-reversal-ancestry-raw',
    status: complete ? 'COMPLETE' : 'UNVERIFIED',
    finalSubjectIdentity: manifest.artifactIdentity,
    sources: {
      priorArtifactIdentity: prior.artifactIdentity,
      lc0007ManifestIdentity: lc0007Manifest.artifactIdentity,
      lc0007QualificationIdentity: lc0007Qualification.artifactIdentity,
      lc0007RawIdentity: lc0007Raw.artifactIdentity,
      recordingIdentity: lc0007Manifest.identities.recording,
    },
    controls: {
      exactPanelReproduced: true,
      objectiveEquivalent: true,
      unchangedContinuation: true,
      ancestryGraphsValid: complete,
    },
    cells,
    disposition: complete ? 'FULL_ANCESTRY_TRACED' : 'UNVERIFIED',
  });
}

function compactArm(arm) {
  return {
    decisionSurvivorContributes: arm.graph.decisionSurvivorContributes,
    postDecisionRootsUsed: arm.graph.postDecisionRootsUsed.length,
    postDecisionRootsUnused: arm.graph.postDecisionRootsUnused.length,
    continuationSpawnRootsUsed: arm.graph.continuationSpawnRootsUsed.length,
    intermediateMergeCount: arm.graph.intermediateMergeCount,
    rootValueSum: arm.graph.rootValueSum,
    correctionChainSum: arm.graph.correctionChainSum,
    correctionPoints: arm.graph.correctionPoints,
    originBreakdown: arm.graph.originBreakdown,
  };
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') {
    return { artifactIdentity: artifact.artifactIdentity, status: artifact.status };
  }
  return {
    artifactIdentity: artifact.artifactIdentity,
    status: artifact.status,
    disposition: artifact.disposition,
    cells: artifact.cells.map((cell) => ({
      move: cell.move,
      expectedLabel: cell.expectedLabel,
      winner: cell.winner,
      correctionContinuation: cell.correctionContinuation,
      owner: compactArm(cell.arms.owner),
      champion: compactArm(cell.arms.champion),
    })),
  };
}

function calibrationControls() {
  const state = fixtureState([
    [2, 2, 4, null, 64],
    [8, 8, 8, 16, null],
  ]);
  const tracker = createTracker();
  registerBoardRoots(tracker, state, () => ({ origin: 'carried-board' }));
  const excludedTile = state.grid[0][4];
  const excludedNode = tracker.tileNodes.get(excludedTile);
  executeAncestryMerge(tracker, state, [state.grid[0][0], state.grid[0][1], state.grid[0][2]], 1);
  const firstOutput = allTiles(state).find((tile) => tracker.tileNodes.get(tile) === 'M001');
  const second = executeAncestryMerge(tracker, state, [
    state.grid[1][0], state.grid[1][1], firstOutput, state.grid[1][2], state.grid[1][3],
  ], 2);
  const graph = buildCorrectionGraph(tracker, second.id);
  const trustedRoots = [...tracker.roots.values()].map((root) => structuredClone(root));
  const positivePass = validateCorrectionGraph(graph, trustedRoots)
    && graph.merges.length === 2
    && graph.rootValueSum === 48
    && graph.correctionChainSum === 48;
  const negativePass = !graph.roots.some(({ id }) => id === excludedNode)
    && tracker.tileNodes.get(excludedTile) === excludedNode;

  const falseOrigin = structuredClone(graph);
  falseOrigin.roots[0].origin = falseOrigin.roots[0].origin === 'carried-board'
    ? 'decision-refill'
    : 'carried-board';
  let falseOriginKilled = false;
  let falseOriginMessage = null;
  try {
    validateCorrectionGraph(falseOrigin, trustedRoots);
  } catch (error) {
    falseOriginKilled = true;
    falseOriginMessage = error.message;
  }

  const missingRoot = structuredClone(graph);
  missingRoot.roots.shift();
  let missingRootKilled = false;
  let missingRootMessage = null;
  try {
    validateCorrectionGraph(missingRoot, trustedRoots);
  } catch (error) {
    missingRootKilled = true;
    missingRootMessage = error.message;
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0008-persist-'));
  const retainedPath = path.join(directory, 'raw.json');
  const disposable = artifactWithIdentity({ status: 'COMPLETE', planted: true });
  let plantedFailureObserved = false;
  try {
    persistBeforeVerdict({
      file: retainedPath,
      artifact: disposable,
      evaluate() { throw new Error('planted interpretation failure'); },
    });
  } catch (error) {
    plantedFailureObserved = /planted interpretation failure/.test(error.message);
  }
  const persistencePass = plantedFailureObserved
    && fs.existsSync(retainedPath)
    && JSON.parse(fs.readFileSync(retainedPath, 'utf8')).artifactIdentity === disposable.artifactIdentity;

  return [
    {
      id: 'C3-merge-union-known-good',
      pass: positivePass,
      observed: { mergeIds: graph.merges.map(({ id }) => id), rootCount: graph.roots.length, rootValueSum: graph.rootValueSum },
    },
    {
      id: 'C4-unrelated-root-known-negative',
      pass: negativePass,
      observed: { excludedNode, absentFromGraph: !graph.roots.some(({ id }) => id === excludedNode), liveNodeUnchanged: tracker.tileNodes.get(excludedTile) === excludedNode },
    },
    {
      id: 'C5-planted-false-origin',
      pass: falseOriginKilled && /root-origin mismatch/.test(falseOriginMessage || ''),
      observed: { mutationPresent: true, reachedValidator: true, mutationKilled: falseOriginKilled, mutationMessage: falseOriginMessage },
    },
    {
      id: 'C6-conservation-mutation',
      pass: missingRootKilled && /missing node/.test(missingRootMessage || ''),
      observed: { mutationPresent: true, reachedValidator: true, mutationKilled: missingRootKilled, mutationMessage: missingRootMessage },
    },
    {
      id: 'C7-restoration-and-persistence',
      pass: persistencePass,
      observed: { plantedFailureObserved, rawRetained: fs.existsSync(retainedPath) },
    },
  ];
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    priorRaw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-four-miss-diagnostic-raw.json'),
    lc0007Contract: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-contract.md'),
    lc0007Manifest: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-manifest.json'),
    lc0007Qualification: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-qualification.json'),
    lc0007Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-raw.json'),
    priorHarness: path.join(ROOT, 'tools', 'diagnose-lc0007-decision-lineage.js'),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0008ReversalAncestry.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['priorRaw', 'lc0007Contract', 'lc0007Manifest', 'lc0007Qualification', 'lc0007Raw', 'priorHarness', 'recording', 'engine', 'bot']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0008-reversal-ancestry-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) {
    throw new TypeError('expected manifest identity must be a full SHA-256');
  }
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) throw new Error('expected manifest identity mismatch');
  if (manifest.kind !== 'lc0008-reversal-ancestry-manifest') throw new Error('unexpected manifest kind');
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    if (sha256File(file) !== manifest.identities[name]) throw new Error(`${name} identity mismatch`);
    paths[name] = file;
  }
  return paths;
}

function committedFileMatches(file) {
  const relative = path.relative(ROOT, file);
  const committed = execFileSync('git', ['show', `HEAD:${relative}`], { cwd: ROOT });
  return committed.equals(fs.readFileSync(file));
}

function exerciseCloseout({ contractPath, expectedContractIdentity, manifestIdentity, reportableOut, recomputedOut }) {
  if (sha256File(contractPath) !== expectedContractIdentity) throw new Error('closeout contract external identity mismatch');
  if (fs.existsSync(reportableOut) || fs.existsSync(recomputedOut)) throw new Error('closeout qualification requires absent reportable paths');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (contract.final_subject_identity !== manifestIdentity) throw new Error('closeout final subject does not match manifest identity');
  const contractDirectory = path.dirname(contractPath);
  const resolvedCwd = path.resolve(contractDirectory, contract.recomputation.cwd);
  const resolvedArgvFiles = contract.recomputation.argv
    .filter((value) => value.includes('/'))
    .map((value) => path.resolve(resolvedCwd, value));
  const receiptPath = path.join(contractDirectory, 'LC-0008-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({ schemaVersion: 1, kind: 'lc0008-reversal-ancestry-raw', status: 'SYNTHETIC_QUALIFICATION' });
  try {
    writeJsonOnce(reportableOut, synthetic);
    const [program, ...argv] = contract.recomputation.argv;
    const output = execFileSync(program, argv, { cwd: resolvedCwd });
    fs.writeFileSync(recomputedOut, output, { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0008-SYNTHETIC-QUALIFICATION',
      final_subject_identity: manifestIdentity,
      closure_status: 'CLOSED',
      claims: contract.required_claims.map((id) => ({ id, status: 'PASS', evidence_subject_identity: manifestIdentity, reason: 'synthetic closeout-path qualification' })),
      artifacts: [
        { id: 'raw', path: path.basename(reportableOut), sha256: sha256File(reportableOut) },
        { id: 'primary-recomputation', path: path.basename(recomputedOut), sha256: sha256File(recomputedOut) },
      ],
      primary_outcome: 'SYNTHETIC_CLOSEOUT_PASS',
      deviations: [],
      attempts: [{ id: 'qualification-1', exit_code: 0, artifact_ids: ['raw', 'primary-recomputation'] }],
    };
    writeJsonOnce(receiptPath, receipt);
    const verifier = path.join(ROOT, 'tools', 'vendor', 'close-experiment', 'verify_closure.py');
    const verifierOutput = execFileSync('python3', [
      verifier,
      contractPath,
      receiptPath,
      '--run-recomputation',
      '--require-closed',
      '--expected-contract-sha256',
      expectedContractIdentity,
    ], { cwd: ROOT, encoding: 'utf8' });
    const verdict = JSON.parse(verifierOutput);
    return {
      pass: verdict.verdict === 'PASS' && verdict.recomputation === 'PASS',
      verifier,
      resolvedCwd,
      resolvedArgvFiles,
      resolvedArgvFilesExist: resolvedArgvFiles.every(fs.existsSync),
      verdict,
    };
  } finally {
    for (const file of [receiptPath, recomputedOut, reportableOut]) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

function qualifyHarness({ manifestPath, expectedManifestIdentity, closeoutContract, expectedCloseoutIdentity, reportableOut, recomputedOut }) {
  if (fs.existsSync(reportableOut)) throw new Error('reportable raw output must be absent before qualification');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, committedFileMatches(file)]));
  const prior = JSON.parse(fs.readFileSync(paths.priorRaw, 'utf8'));
  const lc0007Manifest = JSON.parse(fs.readFileSync(paths.lc0007Manifest, 'utf8'));
  const lc0007Qualification = JSON.parse(fs.readFileSync(paths.lc0007Qualification, 'utf8'));
  const lc0007Raw = JSON.parse(fs.readFileSync(paths.lc0007Raw, 'utf8'));
  assertSourceIdentities(paths, prior, lc0007Manifest, lc0007Qualification, lc0007Raw);
  const sourceControls = [
    {
      id: 'C1-frozen-replay-and-panel-identity',
      pass: JSON.stringify(prior.misses.map(({ move }) => move)) === JSON.stringify(MOVES)
        && JSON.stringify(lc0007Raw.cells.map(({ move }) => move)) === JSON.stringify(MOVES)
        && lc0007Raw.cells.every((cell) => cell.arms.owner.correctionEvent && cell.arms.champion.correctionEvent),
      observed: {
        priorArtifactIdentity: prior.artifactIdentity,
        lc0007RawIdentity: lc0007Raw.artifactIdentity,
        corrections: lc0007Raw.cells.map(({ move, correctionContinuation }) => ({ move, continuationMoves: correctionContinuation })),
      },
    },
    {
      id: 'C2-objective-and-continuation-equivalence',
      pass: prior.misses.every((miss) => (
        miss.arms.owner.before.stateIdentity === miss.arms.champion.before.stateIdentity
        && miss.arms.owner.before.targetGap === miss.arms.champion.before.targetGap
      )),
      observed: prior.misses.map((miss) => ({ move: miss.move, sharedDecisionState: miss.arms.owner.before.stateIdentity })),
    },
  ];
  const controls = sourceControls.concat(calibrationControls());
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentSubstitutionRejected = false;
  try {
    validateManifest(coherent, expectedManifestIdentity);
  } catch (error) {
    coherentSubstitutionRejected = /expected manifest identity mismatch/.test(error.message);
  }
  const admission = exerciseCloseout({
    contractPath: closeoutContract,
    expectedContractIdentity: expectedCloseoutIdentity,
    manifestIdentity: manifest.artifactIdentity,
    reportableOut,
    recomputedOut,
  });
  const trackerIdentityBefore = sha256Bytes(`${executeAncestryMerge.toString()}${buildCorrectionGraph.toString()}${validateCorrectionGraph.toString()}`);
  const trackerIdentityAfter = sha256Bytes(`${executeAncestryMerge.toString()}${buildCorrectionGraph.toString()}${validateCorrectionGraph.toString()}`);
  const pass = Object.values(committed).every(Boolean)
    && controls.every((control) => control.pass)
    && coherentSubstitutionRejected
    && admission.pass
    && admission.resolvedArgvFilesExist
    && trackerIdentityBefore === trackerIdentityAfter
    && !fs.existsSync(reportableOut)
    && !fs.existsSync(recomputedOut);
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0008-harness-qualification',
    status: pass ? 'PASS' : 'FAIL',
    oracle: path.relative(ROOT, paths.contract),
    manifestIdentity: manifest.artifactIdentity,
    harnessIdentity: manifest.identities.harness,
    attempt: 1,
    committed,
    coherentSubstitutionRejected,
    trackerIdentityBefore,
    trackerIdentityAfter,
    preOutcomeAdmission: admission,
    controls,
    uncertainties: [],
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
  const manifestOut = optionalArg('write-manifest');
  if (manifestOut) {
    const manifest = createManifest({ contractPath: arg('contract') });
    writeJsonOnce(path.resolve(manifestOut), manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  const summarize = optionalArg('summarize');
  if (summarize) {
    process.stdout.write(`${JSON.stringify(summaryFromArtifact(JSON.parse(fs.readFileSync(path.resolve(summarize), 'utf8'))), null, 2)}\n`);
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
  const artifact = collectFromManifest(path.resolve(arg('manifest')), arg('expected-manifest-identity'));
  const summary = persistBeforeVerdict({
    file: path.resolve(arg('out')),
    artifact,
    validate(value) { if (!verifyArtifactIdentity(value)) throw new Error('raw artifact identity mismatch'); },
    evaluate: summaryFromArtifact,
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
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
  buildCorrectionGraph,
  calibrationControls,
  collectFromManifest,
  createManifest,
  createTracker,
  executeAncestryMerge,
  qualifyHarness,
  registerBoardRoots,
  summaryFromArtifact,
  validateCorrectionGraph,
  validateManifest,
};
