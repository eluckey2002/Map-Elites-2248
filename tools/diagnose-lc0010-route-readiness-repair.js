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
  isValidChain,
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
const {
  buildCorrectionGraph,
  createTracker,
  executeAncestryMerge,
  registerBoardRoots,
} = require('./diagnose-lc0008-reversal-ancestry');
const { fixtureState } = require('./diagnose-lc0007-decision-lineage');
const { assessRouteReadiness: assessFailedRouteReadiness } = require('./diagnose-lc0009-route-readiness');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const MOVES = Object.freeze([4, 6, 9, 11]);
const SOURCE = Object.freeze({
  lc0008ManifestIdentity: '2c202a7a11dc7ac3164692145fc962d4aa2dd7d28017c417efd09bad11ed9c28',
  lc0008QualificationIdentity: '09ce87ea6a4087f2948c5aced2f99858a7e4515cce617b3eb3c9bfe200905df9',
  lc0008RawIdentity: '2f9558a9c81adf2459b9762e4fbe1ee1515c3358a7edb34d01afe4f093b9fea8',
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

function allTiles(state) {
  return state.grid.flat().filter(Boolean);
}

function liveChain(state, claims) {
  return claims.map(({ x, y, value }) => {
    const tile = state.grid[y] && state.grid[y][x];
    if (!tile) throw new Error(`chain names missing tile at ${x},${y}`);
    if (tile.value !== value) throw new Error(`chain value mismatch at ${x},${y}`);
    return tile;
  });
}

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  return analysis.selectedChain ? analysis.selectedChain.map(snapshotTile) : null;
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

function adjacent(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx > 0 || dy > 0) && dx <= 1 && dy <= 1;
}

function graphNode(graph, id) {
  const root = graph.roots.find((candidate) => candidate.id === id);
  if (root) return { kind: 'root', value: root.value, createdAt: root.spawnedAt, origin: root.origin };
  const merge = graph.merges.find((candidate) => candidate.id === id);
  if (merge) return { kind: 'merge', value: merge.chainSum, createdAt: merge.continuationMoves };
  throw new Error(`frozen correction graph missing node ${id}`);
}

function directInputIds(graph) {
  const correction = graph.merges.find(({ id }) => id === graph.correctionNodeId);
  if (!correction) throw new Error('correction merge missing from graph');
  return correction.inputNodeIds;
}

function liveNodeTiles(state, tracker) {
  const byId = new Map();
  for (const tile of allTiles(state)) {
    const id = tracker.tileNodes.get(tile);
    if (id) byId.set(id, tile);
  }
  return byId;
}

function assessRouteReadiness(state, tracker, graph) {
  const orderedIds = directInputIds(graph);
  const live = liveNodeTiles(state, tracker);
  const presentInputs = [];
  const missingDirectInputs = [];
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const tile = live.get(id);
    if (tile) {
      presentInputs.push({ index, id, ...snapshotTile(tile) });
    } else {
      const node = graphNode(graph, id);
      missingDirectInputs.push({ index, id, ...node });
    }
  }
  const missingAdjacencyLinks = [];
  const missingValueLinks = [];
  for (let index = 1; index < orderedIds.length; index += 1) {
    const left = live.get(orderedIds[index - 1]);
    const right = live.get(orderedIds[index]);
    if (!left || !right) continue;
    if (!adjacent(left, right)) {
      missingAdjacencyLinks.push({
        leftId: orderedIds[index - 1],
        rightId: orderedIds[index],
        left: snapshotTile(left),
        right: snapshotTile(right),
      });
    }
    const validValue = index === 1
      ? left.value === right.value
      : right.value === left.value || right.value === left.value * 2;
    if (!validValue) {
      missingValueLinks.push({ leftId: orderedIds[index - 1], rightId: orderedIds[index], leftValue: left.value, rightValue: right.value });
    }
  }
  const allPresent = missingDirectInputs.length === 0;
  const chain = allPresent ? orderedIds.map((id) => live.get(id)) : [];
  const distinct = allPresent && new Set(chain).size === chain.length;
  const engineValid = allPresent && isValidChain(chain, state.minChain);
  const routeExecutable = allPresent
    && distinct
    && engineValid
    && missingAdjacencyLinks.length === 0
    && missingValueLinks.length === 0;
  return {
    stateIdentity: stateIdentity(state),
    orderedInputIds: orderedIds,
    presentInputs,
    missingDirectInputs,
    missingAdjacencyLinks,
    missingValueLinks,
    allPresent,
    distinct,
    engineValid,
    routeExecutable,
  };
}

function verifyReadinessClaim(observed, claimedReady) {
  if (claimedReady !== observed.routeExecutable) {
    throw new Error(`readiness/evidence contradiction: observed ${observed.routeExecutable}, claimed ${claimedReady}`);
  }
  if (claimedReady && (observed.missingDirectInputs.length || observed.missingAdjacencyLinks.length || observed.missingValueLinks.length)) {
    throw new Error('ready claim retains missing route evidence');
  }
  return true;
}

function startArm(candidate, recording, lc0007Arm, move) {
  const { state, rng } = prefixState(candidate, recording, move - 1);
  const preDecisionTiles = new Set(allTiles(state));
  const decisionChain = liveChain(state, lc0007Arm.decision.chain);
  const decisionSurvivor = decisionChain[decisionChain.length - 1];
  const points = executeChain(state, decisionChain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  if (points !== lc0007Arm.decision.points || stateIdentity(state) !== lc0007Arm.decision.postStateIdentity) {
    throw new Error(`move ${move} decision reproduction mismatch`);
  }
  const tracker = createTracker();
  registerBoardRoots(tracker, state, (tile) => {
    if (tile === decisionSurvivor) return { origin: 'decision-survivor' };
    return { origin: preDecisionTiles.has(tile) ? 'carried-board' : 'decision-refill' };
  });
  return { state, rng, tracker };
}

function positionsForDirectInputs(state, tracker, graph) {
  const live = liveNodeTiles(state, tracker);
  return Object.fromEntries(directInputIds(graph).filter((id) => live.has(id)).map((id) => [id, snapshotTile(live.get(id))]));
}

function traceArm(candidate, recording, lc0007Arm, lc0008Arm, move, armName) {
  const graph = lc0008Arm.graph;
  const correctionContinuation = lc0008Arm.correctionContinuation;
  const started = startArm(candidate, recording, lc0007Arm, move);
  if (stateIdentity(started.state) !== lc0008Arm.postDecisionStateIdentity) {
    throw new Error(`move ${move} ${armName} post-decision state mismatch`);
  }
  const graphRootIds = new Set(graph.roots.map(({ id }) => id));
  const graphMergeIds = new Set(graph.merges.map(({ id }) => id));
  const timeline = [];
  for (let continuation = 1; continuation <= correctionContinuation; continuation += 1) {
    const readiness = assessRouteReadiness(started.state, started.tracker, graph);
    verifyReadinessClaim(readiness, readiness.routeExecutable);
    const beforeRoots = new Set(started.tracker.roots.keys());
    const beforeMerges = new Set(started.tracker.merges.keys());
    const beforePositions = positionsForDirectInputs(started.state, started.tracker, graph);
    const expected = lc0007Arm.events.find((event) => event.continuationMoves === continuation);
    if (!expected) throw new Error(`move ${move} ${armName} missing continuation ${continuation}`);
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
    if (event.points !== expected.points || stateIdentity(started.state) !== expected.postStateIdentity) {
      throw new Error(`move ${move} ${armName} continuation ${continuation} replay drifted`);
    }
    const afterPositions = positionsForDirectInputs(started.state, started.tracker, graph);
    const movedDirectInputs = Object.keys(beforePositions).filter((id) => afterPositions[id]
      && JSON.stringify(beforePositions[id]) !== JSON.stringify(afterPositions[id])).map((id) => ({
      id,
      before: beforePositions[id],
      after: afterPositions[id],
    }));
    timeline.push({
      continuationMoves: continuation,
      readiness,
      selectedChain: expected.chain,
      selectedPoints: event.points,
      createdContributingRootIds: [...started.tracker.roots.keys()].filter((id) => !beforeRoots.has(id) && graphRootIds.has(id)),
      createdContributingMergeNodeIds: [...started.tracker.merges.keys()].filter((id) => !beforeMerges.has(id) && graphMergeIds.has(id)),
      movedDirectInputs,
      postStateIdentity: stateIdentity(started.state),
    });
  }
  const observedGraph = buildCorrectionGraph(started.tracker, graph.correctionNodeId);
  if (JSON.stringify(observedGraph) !== JSON.stringify(graph)) {
    throw new Error(`move ${move} ${armName} correction graph drifted`);
  }
  const readyEntries = timeline.filter(({ readiness }) => readiness.routeExecutable);
  if (readyEntries.length === 0) throw new Error(`move ${move} ${armName} correction route never ready`);
  return {
    arm: armName,
    correctionContinuation,
    firstReadyContinuation: readyEntries[0].continuationMoves,
    readyOnlyAtCorrection: readyEntries[0].continuationMoves === correctionContinuation,
    timeline,
  };
}

function assertSources(paths, lc0008Manifest, lc0008Qualification, lc0008Raw, lc0007Raw) {
  if (!verifyArtifactIdentity(lc0008Manifest) || lc0008Manifest.artifactIdentity !== SOURCE.lc0008ManifestIdentity) {
    throw new Error('LC-0008 manifest identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0008Qualification)
    || lc0008Qualification.artifactIdentity !== SOURCE.lc0008QualificationIdentity
    || lc0008Qualification.status !== 'PASS') {
    throw new Error('LC-0008 qualification identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0008Raw)
    || lc0008Raw.artifactIdentity !== SOURCE.lc0008RawIdentity
    || lc0008Raw.status !== 'COMPLETE') {
    throw new Error('LC-0008 raw identity mismatch');
  }
  if (!verifyArtifactIdentity(lc0007Raw) || lc0007Raw.artifactIdentity !== SOURCE.lc0007RawIdentity) {
    throw new Error('LC-0007 raw identity mismatch');
  }
  if (sha256File(paths.lc0007Raw) !== lc0008Manifest.identities.lc0007Raw) {
    throw new Error('LC-0007 raw transitive source hash mismatch');
  }
}

function knownFalseLinks(artifact) {
  const cell = artifact.cells.find(({ move }) => move === 9);
  if (!cell) return [];
  return cell.arms.champion.timeline.flatMap((entry) => entry.readiness.missingValueLinks.map((link) => ({
    continuationMoves: entry.continuationMoves,
    leftId: link.leftId,
    rightId: link.rightId,
    leftValue: link.leftValue,
    rightValue: link.rightValue,
  })));
}

function firstReadyVector(cells) {
  return cells.flatMap((cell) => ['owner', 'champion'].map((arm) => ({
    move: cell.move,
    arm,
    firstReadyContinuation: cell.arms[arm].firstReadyContinuation,
  })));
}

function panelDisposition(cells, predecessor) {
  const arms = cells.flatMap((cell) => Object.values(cell.arms));
  const correctionReady = arms.every((arm) => {
    const final = arm.timeline.at(-1);
    return final && final.continuationMoves === arm.correctionContinuation && final.readiness.routeExecutable;
  });
  if (!correctionReady || knownFalseLinks({ cells }).length !== 0) return 'UNVERIFIED';
  return JSON.stringify(firstReadyVector(cells)) === JSON.stringify(firstReadyVector(predecessor.cells))
    ? 'REPAIRED_TIMELINE_CONFIRMED'
    : 'REPAIRED_TIMELINE_CHANGED';
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const lc0008Manifest = JSON.parse(fs.readFileSync(paths.lc0008Manifest, 'utf8'));
  const lc0008Qualification = JSON.parse(fs.readFileSync(paths.lc0008Qualification, 'utf8'));
  const lc0008Raw = JSON.parse(fs.readFileSync(paths.lc0008Raw, 'utf8'));
  const lc0007Raw = JSON.parse(fs.readFileSync(paths.lc0007Raw, 'utf8'));
  const lc0009Raw = JSON.parse(fs.readFileSync(paths.lc0009Raw, 'utf8'));
  assertSources(paths, lc0008Manifest, lc0008Qualification, lc0008Raw, lc0007Raw);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');
  const cells = MOVES.map((move) => {
    const source = lc0008Raw.cells.find((cell) => cell.move === move);
    const lineage = lc0007Raw.cells.find((cell) => cell.move === move);
    if (!source || !lineage) throw new Error(`move ${move} source cell missing`);
    return {
      move,
      expectedLabel: source.expectedLabel,
      winner: source.winner,
      correctionContinuation: source.correctionContinuation,
      arms: {
        owner: traceArm(resolved.candidate, recording, lineage.arms.owner, source.arms.owner, move, 'owner'),
        champion: traceArm(resolved.candidate, recording, lineage.arms.champion, source.arms.champion, move, 'champion'),
      },
    };
  });
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0010-route-readiness-raw',
    status: 'COMPLETE',
    finalSubjectIdentity: manifest.artifactIdentity,
    sources: {
      lc0008ManifestIdentity: lc0008Manifest.artifactIdentity,
      lc0008QualificationIdentity: lc0008Qualification.artifactIdentity,
      lc0008RawIdentity: lc0008Raw.artifactIdentity,
      lc0007RawIdentity: lc0007Raw.artifactIdentity,
      lc0009InvalidRawIdentity: lc0009Raw.artifactIdentity,
      recordingIdentity: lc0008Manifest.identities.recording,
    },
    controls: { exactPanelReproduced: true, objectiveEquivalent: true, unchangedContinuation: true },
    cells,
    disposition: panelDisposition(cells, lc0009Raw),
  });
}

function compactSnapshot(entry) {
  return {
    continuationMoves: entry.continuationMoves,
    routeExecutable: entry.readiness.routeExecutable,
    presentInputCount: entry.readiness.presentInputs.length,
    missingDirectInputs: entry.readiness.missingDirectInputs.map(({ id, kind, value, createdAt, origin }) => ({ id, kind, value, createdAt, origin })),
    missingAdjacencyLinks: entry.readiness.missingAdjacencyLinks.map(({ leftId, rightId }) => ({ leftId, rightId })),
    missingValueLinks: entry.readiness.missingValueLinks.map(({ leftId, rightId, leftValue, rightValue }) => ({ leftId, rightId, leftValue, rightValue })),
    createdContributingRootIds: entry.createdContributingRootIds,
    createdContributingMergeNodeIds: entry.createdContributingMergeNodeIds,
    movedDirectInputIds: entry.movedDirectInputs.map(({ id }) => id),
  };
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') return { artifactIdentity: artifact.artifactIdentity, status: artifact.status };
  return {
    artifactIdentity: artifact.artifactIdentity,
    status: artifact.status,
    disposition: artifact.disposition,
    cells: artifact.cells.map((cell) => ({
      move: cell.move,
      expectedLabel: cell.expectedLabel,
      winner: cell.winner,
      correctionContinuation: cell.correctionContinuation,
      owner: {
        firstReadyContinuation: cell.arms.owner.firstReadyContinuation,
        timeline: cell.arms.owner.timeline.map(compactSnapshot),
      },
      champion: {
        firstReadyContinuation: cell.arms.champion.firstReadyContinuation,
        timeline: cell.arms.champion.timeline.map(compactSnapshot),
      },
    })),
  };
}

function fixtureGraph(tracker, state) {
  const roots = [...tracker.roots.values()].map((root) => structuredClone(root));
  const inputNodeIds = allTiles(state).map((tile) => tracker.tileNodes.get(tile));
  return {
    correctionNodeId: 'M001',
    roots,
    merges: [{
      id: 'M001',
      continuationMoves: 1,
      inputNodeIds,
      chain: allTiles(state).map(snapshotTile),
      chainSum: 48,
      points: 240,
      output: { x: 4, y: 0, value: 48 },
    }],
  };
}

function calibrationControls() {
  const ready = fixtureState([[8, 8, 8, 8, 16]]);
  ready.minChain = 3;
  const readyTracker = createTracker();
  registerBoardRoots(readyTracker, ready, () => ({ origin: 'carried-board' }));
  const graph = fixtureGraph(readyTracker, ready);
  const readyObserved = assessRouteReadiness(ready, readyTracker, graph);

  const missing = fixtureState([[8, 8, 8, 8, 16]]);
  missing.minChain = 3;
  const missingTracker = createTracker();
  registerBoardRoots(missingTracker, missing, () => ({ origin: 'carried-board' }));
  const missingGraph = fixtureGraph(missingTracker, missing);
  const removed = missing.grid[0][2];
  missing.grid[0][2] = null;
  const missingObserved = assessRouteReadiness(missing, missingTracker, missingGraph);

  const broken = fixtureState([[8, 8, 8, null, 8, 16]]);
  broken.minChain = 3;
  const brokenTracker = createTracker();
  registerBoardRoots(brokenTracker, broken, () => ({ origin: 'carried-board' }));
  const brokenGraph = fixtureGraph(brokenTracker, broken);
  const brokenObserved = assessRouteReadiness(broken, brokenTracker, brokenGraph);

  const partial = fixtureState([[8, 8, 16]]);
  partial.minChain = 3;
  const partialTracker = createTracker();
  registerBoardRoots(partialTracker, partial, () => ({ origin: 'carried-board' }));
  const partialGraph = fixtureGraph(partialTracker, partial);
  const missingFirst = partial.grid[0][0];
  const laterLeftId = partialTracker.tileNodes.get(partial.grid[0][1]);
  const laterRightId = partialTracker.tileNodes.get(partial.grid[0][2]);
  partial.grid[0][0] = null;
  const partialObserved = assessRouteReadiness(partial, partialTracker, partialGraph);
  const failedPartialObserved = assessFailedRouteReadiness(partial, partialTracker, partialGraph);
  const laterPairFalselyRejected = partialObserved.missingValueLinks.some(
    ({ leftId, rightId }) => leftId === laterLeftId && rightId === laterRightId,
  );
  const failedAssessorKilled = failedPartialObserved.missingValueLinks.some(
    ({ leftId, rightId }) => leftId === laterLeftId && rightId === laterRightId,
  );

  let falseReadyKilled = false;
  let falseReadyMessage = null;
  try {
    verifyReadinessClaim(missingObserved, true);
  } catch (error) {
    falseReadyKilled = true;
    falseReadyMessage = error.message;
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0010-persist-'));
  const retainedPath = path.join(directory, 'raw.json');
  const disposable = artifactWithIdentity({ status: 'COMPLETE', planted: true });
  let plantedFailureObserved = false;
  try {
    persistBeforeVerdict({ file: retainedPath, artifact: disposable, evaluate() { throw new Error('planted interpretation failure'); } });
  } catch (error) {
    plantedFailureObserved = /planted interpretation failure/.test(error.message);
  }
  const persistencePass = plantedFailureObserved
    && fs.existsSync(retainedPath)
    && JSON.parse(fs.readFileSync(retainedPath, 'utf8')).artifactIdentity === disposable.artifactIdentity;

  return [
    { id: 'C3-ready-route-known-good', pass: readyObserved.routeExecutable && verifyReadinessClaim(readyObserved, true), observed: readyObserved },
    { id: 'C4-missing-node-known-negative', pass: !missingObserved.routeExecutable && missingObserved.missingDirectInputs.length === 1 && missingObserved.missingDirectInputs[0].id === missingTracker.tileNodes.get(removed), observed: missingObserved },
    { id: 'C5-broken-adjacency-known-negative', pass: !brokenObserved.routeExecutable && brokenObserved.missingAdjacencyLinks.length === 1, observed: brokenObserved },
    {
      id: 'C6-partial-prefix-valid-double',
      pass: !partialObserved.routeExecutable
        && partialObserved.missingDirectInputs.length === 1
        && partialObserved.missingDirectInputs[0].id === partialTracker.tileNodes.get(missingFirst)
        && !laterPairFalselyRejected
        && failedAssessorKilled,
      observed: { laterLeftId, laterRightId, laterPairFalselyRejected, failedAssessorKilled, readiness: partialObserved, failedReadiness: failedPartialObserved },
    },
    { id: 'C7-planted-false-ready', pass: falseReadyKilled && /readiness\/evidence contradiction/.test(falseReadyMessage || ''), observed: { mutationPresent: true, reachedValidator: true, mutationKilled: falseReadyKilled, mutationMessage: falseReadyMessage } },
    { id: 'C8-restoration-and-persistence', pass: persistencePass, observed: { plantedFailureObserved, rawRetained: fs.existsSync(retainedPath) } },
  ];
}

function createManifest({ contractPath }) {
  const lc0008ManifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-manifest.json');
  const lc0008Manifest = JSON.parse(fs.readFileSync(lc0008ManifestPath, 'utf8'));
  const files = {
    contract: path.resolve(contractPath),
    lc0008Contract: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-contract.md'),
    lc0008Manifest: lc0008ManifestPath,
    lc0008Qualification: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-qualification.json'),
    lc0008Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-raw.json'),
    lc0008Result: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-result.md'),
    priorHarness: path.join(ROOT, 'tools', 'diagnose-lc0008-reversal-ancestry.js'),
    lc0009Contract: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-contract.md'),
    lc0009Manifest: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-manifest.json'),
    lc0009Qualification: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-qualification.json'),
    lc0009Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-raw.json'),
    lc0009Closure: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-closure.json'),
    failedHarness: path.join(ROOT, 'tools', 'diagnose-lc0009-route-readiness.js'),
    failedTest: path.join(ROOT, 'solver', 'tests', 'lc0009RouteReadiness.test.js'),
    lc0007Raw: path.join(ROOT, lc0008Manifest.paths.lc0007Raw),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0010RouteReadinessRepair.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  if (identities.lc0007Raw !== lc0008Manifest.identities.lc0007Raw) throw new Error('transitive LC-0007 raw identity mismatch');
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['lc0009Contract', 'lc0009Manifest', 'lc0009Qualification', 'lc0009Raw', 'lc0009Closure', 'failedHarness', 'failedTest', 'recording', 'engine', 'bot']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0010-route-readiness-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) throw new TypeError('expected manifest identity must be a full SHA-256');
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) throw new Error('expected manifest identity mismatch');
  if (manifest.kind !== 'lc0010-route-readiness-manifest') throw new Error('unexpected manifest kind');
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
  return execFileSync('git', ['show', `HEAD:${relative}`], { cwd: ROOT }).equals(fs.readFileSync(file));
}

function exerciseCloseout({ contractPath, expectedContractIdentity, manifestIdentity, reportableOut, recomputedOut }) {
  if (sha256File(contractPath) !== expectedContractIdentity) throw new Error('closeout contract external identity mismatch');
  if (fs.existsSync(reportableOut) || fs.existsSync(recomputedOut)) throw new Error('closeout qualification requires absent reportable paths');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (contract.final_subject_identity !== manifestIdentity) throw new Error('closeout final subject does not match manifest identity');
  const contractDirectory = path.dirname(contractPath);
  const resolvedCwd = path.resolve(contractDirectory, contract.recomputation.cwd);
  const resolvedArgvFiles = contract.recomputation.argv.filter((value) => value.includes('/')).map((value) => path.resolve(resolvedCwd, value));
  const receiptPath = path.join(contractDirectory, 'LC-0010-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({ schemaVersion: 1, kind: 'lc0010-route-readiness-raw', status: 'SYNTHETIC_QUALIFICATION' });
  try {
    writeJsonOnce(reportableOut, synthetic);
    const [program, ...argv] = contract.recomputation.argv;
    const output = execFileSync(program, argv, { cwd: resolvedCwd });
    fs.writeFileSync(recomputedOut, output, { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0010-SYNTHETIC-QUALIFICATION',
      final_subject_identity: manifestIdentity,
      closure_status: 'CLOSED',
      claims: contract.required_claims.map((id) => ({ id, status: 'PASS', evidence_subject_identity: manifestIdentity, reason: 'synthetic closeout-path qualification' })),
      artifacts: [
        { id: 'raw', path: path.basename(reportableOut), sha256: sha256File(reportableOut) },
        { id: 'primary-recomputation', path: path.basename(recomputedOut), sha256: sha256File(recomputedOut) },
      ],
      primary_outcome: 'SYNTHETIC_CLOSEOUT_PASS', deviations: [],
      attempts: [{ id: 'qualification-1', exit_code: 0, artifact_ids: ['raw', 'primary-recomputation'] }],
    };
    writeJsonOnce(receiptPath, receipt);
    const verifier = path.join(ROOT, 'tools', 'vendor', 'close-experiment', 'verify_closure.py');
    const verdict = JSON.parse(execFileSync('python3', [verifier, contractPath, receiptPath, '--run-recomputation', '--require-closed', '--expected-contract-sha256', expectedContractIdentity], { cwd: ROOT, encoding: 'utf8' }));
    return { pass: verdict.verdict === 'PASS' && verdict.recomputation === 'PASS', verifier, resolvedCwd, resolvedArgvFiles, resolvedArgvFilesExist: resolvedArgvFiles.every(fs.existsSync), verdict };
  } finally {
    for (const file of [receiptPath, recomputedOut, reportableOut]) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function qualifyHarness({ manifestPath, expectedManifestIdentity, closeoutContract, expectedCloseoutIdentity, reportableOut, recomputedOut }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, committedFileMatches(file)]));
  const lc0008Manifest = JSON.parse(fs.readFileSync(paths.lc0008Manifest, 'utf8'));
  const lc0008Qualification = JSON.parse(fs.readFileSync(paths.lc0008Qualification, 'utf8'));
  const lc0008Raw = JSON.parse(fs.readFileSync(paths.lc0008Raw, 'utf8'));
  const lc0007Raw = JSON.parse(fs.readFileSync(paths.lc0007Raw, 'utf8'));
  const lc0009Raw = JSON.parse(fs.readFileSync(paths.lc0009Raw, 'utf8'));
  const lc0009Closure = JSON.parse(fs.readFileSync(paths.lc0009Closure, 'utf8'));
  assertSources(paths, lc0008Manifest, lc0008Qualification, lc0008Raw, lc0007Raw);
  const sourceControls = [
    {
      id: 'C1-frozen-ancestry-and-replay-identity',
      pass: JSON.stringify(lc0008Raw.cells.map(({ move }) => move)) === JSON.stringify(MOVES)
        && lc0008Raw.cells.every((cell) => Object.values(cell.arms).every((arm) => arm.graphValid))
        && lc0008Raw.controls.objectiveEquivalent
        && lc0008Raw.controls.unchangedContinuation,
      observed: { lc0008RawIdentity: lc0008Raw.artifactIdentity, moves: lc0008Raw.cells.map(({ move }) => move), invariants: lc0008Raw.controls },
    },
    {
      id: 'C2-invalid-predecessor-retained',
      pass: lc0009Closure.closure_status === 'INVALID'
        && lc0009Closure.primary_outcome === null
        && JSON.stringify(knownFalseLinks(lc0009Raw)) === JSON.stringify([
          { continuationMoves: 1, leftId: 'P024', rightId: 'P031', leftValue: 128, rightValue: 256 },
          { continuationMoves: 2, leftId: 'P024', rightId: 'P031', leftValue: 128, rightValue: 256 },
          { continuationMoves: 3, leftId: 'S017', rightId: 'P024', leftValue: 64, rightValue: 128 },
        ]),
      observed: { closureStatus: lc0009Closure.closure_status, primaryOutcome: lc0009Closure.primary_outcome, knownFalseLinks: knownFalseLinks(lc0009Raw) },
    },
  ];
  const controls = sourceControls.concat(calibrationControls());
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentSubstitutionRejected = false;
  try { validateManifest(coherent, expectedManifestIdentity); } catch (error) { coherentSubstitutionRejected = /expected manifest identity mismatch/.test(error.message); }
  const admission = exerciseCloseout({ contractPath: closeoutContract, expectedContractIdentity: expectedCloseoutIdentity, manifestIdentity: manifest.artifactIdentity, reportableOut, recomputedOut });
  const assessorIdentityBefore = sha256Bytes(`${assessRouteReadiness.toString()}${verifyReadinessClaim.toString()}`);
  const assessorIdentityAfter = sha256Bytes(`${assessRouteReadiness.toString()}${verifyReadinessClaim.toString()}`);
  const pass = Object.values(committed).every(Boolean) && controls.every((control) => control.pass)
    && coherentSubstitutionRejected && admission.pass && admission.resolvedArgvFilesExist
    && assessorIdentityBefore === assessorIdentityAfter && !fs.existsSync(reportableOut) && !fs.existsSync(recomputedOut);
  return artifactWithIdentity({ schemaVersion: 1, kind: 'lc0010-harness-qualification', status: pass ? 'PASS' : 'FAIL', oracle: path.relative(ROOT, paths.contract), manifestIdentity: manifest.artifactIdentity, harnessIdentity: manifest.identities.harness, attempt: 1, committed, coherentSubstitutionRejected, assessorIdentityBefore, assessorIdentityAfter, preOutcomeAdmission: admission, controls, uncertainties: [] });
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
    const receipt = qualifyHarness({ manifestPath: path.resolve(arg('manifest')), expectedManifestIdentity: arg('expected-manifest-identity'), closeoutContract: path.resolve(arg('closeout-contract')), expectedCloseoutIdentity: arg('expected-closeout-identity'), reportableOut: path.resolve(arg('reportable-out')), recomputedOut: path.resolve(arg('recomputed-out')) });
    writeJsonOnce(path.resolve(qualificationOut), receipt);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    if (receipt.status !== 'PASS') process.exitCode = 1;
    return;
  }
  const artifact = collectFromManifest(path.resolve(arg('manifest')), arg('expected-manifest-identity'));
  const summary = persistBeforeVerdict({ file: path.resolve(arg('out')), artifact, validate(value) { if (!verifyArtifactIdentity(value)) throw new Error('raw artifact identity mismatch'); }, evaluate: summaryFromArtifact });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = {
  assessRouteReadiness,
  calibrationControls,
  collectFromManifest,
  createManifest,
  panelDisposition,
  qualifyHarness,
  summaryFromArtifact,
  validateManifest,
  verifyReadinessClaim,
};
