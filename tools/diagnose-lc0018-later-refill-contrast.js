#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  applyGravity,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { classifyTerminal } = require('../solver/benchmark-replay');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { artifactWithIdentity, verifyArtifactIdentity } = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { verifyNoReentryTargetChainArtifact } = require('./diagnose-lc0017-no-reentry-target-chain');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const TARGET_CHAIN_RELATIVE = 'docs/learning-cycles/LC-0017-no-reentry-target-chain.json';
const TARGET_CHAIN_PATH = path.join(ROOT, TARGET_CHAIN_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
const EXPECTED_TARGET_CHAIN_IDENTITY = 'c02356d0f6ee603f0794c31e69d92c2cbc74fd4a93e07e1cbfb53456cb6b3b59';
const ORIGINS = Object.freeze(['common-board', 'first-action-refill', 'later-refill']);

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function compactTile(tile) {
  return { x: tile.x, y: tile.y, value: tile.value };
}

function allTiles(state) {
  return state.grid.flat().filter(Boolean);
}

function liveChain(state, claims) {
  return claims.map(({ x, y, value }) => {
    const tile = state.grid[y] && state.grid[y][x];
    if (!tile || tile.value !== value) throw new Error(`retained chain drift at ${x},${y}`);
    return tile;
  });
}

function countedRng(base) {
  let calls = 0;
  const rng = () => { calls += 1; return base(); };
  rng.calls = () => calls;
  return rng;
}

function createTracker(state) {
  const tracker = {
    nodeByTile: new WeakMap(),
    roots: new Map(),
    nextCommon: 1,
    nextFirstRefill: 1,
    nextLaterRefill: 1,
    nextMerge: 1,
  };
  for (const tile of allTiles(state).sort((a, b) => (a.y - b.y) || (a.x - b.x))) {
    registerRoot(tracker, tile, 'common-board', 0);
  }
  return tracker;
}

function nextRootId(tracker, origin) {
  if (origin === 'common-board') return `C${String(tracker.nextCommon++).padStart(4, '0')}`;
  if (origin === 'first-action-refill') return `F${String(tracker.nextFirstRefill++).padStart(4, '0')}`;
  return `S${String(tracker.nextLaterRefill++).padStart(4, '0')}`;
}

function registerRoot(tracker, tile, origin, spawnedAtRelativeMove) {
  if (!ORIGINS.includes(origin) || tracker.nodeByTile.has(tile)) return null;
  const root = { id: nextRootId(tracker, origin), origin, spawnedAtRelativeMove, ...compactTile(tile) };
  tracker.nodeByTile.set(tile, root.id);
  tracker.roots.set(root.id, root);
  return root;
}

function registerRefills(tracker, state, relativeMove) {
  const origin = relativeMove === 1 ? 'first-action-refill' : 'later-refill';
  for (const tile of allTiles(state).sort((a, b) => (a.y - b.y) || (a.x - b.x))) {
    registerRoot(tracker, tile, origin, relativeMove);
  }
}

function liveNodes(state, tracker) {
  return allTiles(state).map((tile) => ({ nodeId: tracker.nodeByTile.get(tile), ...compactTile(tile) }));
}

function executeTracked(tracker, state, rng, retained, relativeMove) {
  const chain = liveChain(state, retained.chain);
  const inputNodeIds = chain.map((tile) => {
    const id = tracker.nodeByTile.get(tile);
    if (!id) throw new Error(`untracked chain input at move ${relativeMove}`);
    return id;
  });
  const survivor = chain.at(-1);
  const beforeCalls = rng.calls();
  const points = executeChain(state, chain);
  tracker.nodeByTile.set(survivor, `M${String(tracker.nextMerge++).padStart(4, '0')}`);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  registerRefills(tracker, state, relativeMove);
  const observed = {
    points,
    score: state.score,
    moves: state.moves,
    postStateIdentity: stateIdentity(state),
    refillRngCalls: rng.calls() - beforeCalls,
    terminal: classifyTerminal(state),
  };
  if (observed.points !== retained.points || observed.score !== retained.score || observed.moves !== retained.moves
    || observed.postStateIdentity !== retained.postStateIdentity || observed.refillRngCalls !== retained.refillRngCalls
    || JSON.stringify(observed.terminal) !== JSON.stringify(retained.terminal)) {
    throw new Error(`CASH_NOW retained trace drift at relative move ${relativeMove}`);
  }
  return inputNodeIds;
}

function reconstructCommon(row) {
  const recordingPath = path.join(ROOT, row.recordingPath);
  if (sha256File(recordingPath) !== row.recordingIdentity) throw new Error(`recording identity mismatch: ${row.recordingPath}`);
  const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error(`recording does not resolve: ${row.recordingPath}`);
  const rng = makeRng(recording.seed);
  const state = createLevelState(resolved.candidate, rng);
  for (let index = 0; index < row.selected.readyMove - 1; index += 1) {
    const points = executeChain(state, liveChain(state, recording.chains[index].tiles));
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (points !== recording.chains[index].points) throw new Error(`recording prefix drift at move ${index + 1}`);
  }
  if (stateIdentity(state) !== row.selected.commonStateIdentity
    || state.score !== row.selected.commonScore || state.moves !== row.selected.commonMoves) {
    throw new Error(`common state mismatch: ${row.recordingPath}`);
  }
  return { state, rng };
}

function chooseMatch(entering, candidates) {
  return candidates
    .filter(({ root }) => root.spawnedAtRelativeMove === entering.spawnedAtRelativeMove && root.value === entering.value)
    .map(({ root, live }) => ({
      id: root.id,
      origin: root.origin,
      spawnedAtRelativeMove: root.spawnedAtRelativeMove,
      spawnPosition: { x: root.x, y: root.y },
      value: root.value,
      preTargetPosition: { x: live.x, y: live.y },
      manhattanDistanceFromEnteringRoot: Math.abs(live.x - entering.preTargetPosition.x) + Math.abs(live.y - entering.preTargetPosition.y),
    }))
    .sort((a, b) => (a.manhattanDistanceFromEnteringRoot - b.manhattanDistanceFromEnteringRoot) || a.id.localeCompare(b.id))[0] || null;
}

function replayCashContrast(row, retainedArm, targetCrossingChain) {
  const { state, rng: baseRng } = reconstructCommon(row);
  const tracker = createTracker(state);
  const rng = countedRng(baseRng);
  const trace = retainedArm.trace;
  let preTargetNodes;
  let targetInputNodeIds;
  for (let index = 0; index < trace.length; index += 1) {
    if (stateIdentity(state) !== trace[index].preStateIdentity) throw new Error(`CASH_NOW pre-state drift at relative move ${index + 1}`);
    if (index === trace.length - 1) preTargetNodes = liveNodes(state, tracker);
    const inputs = executeTracked(tracker, state, rng, trace[index], index + 1);
    if (index === trace.length - 1) targetInputNodeIds = inputs;
  }
  const targetRootIds = new Set(targetCrossingChain.roots.filter(({ origin }) => origin === 'later-refill').map(({ id }) => id));
  const preTargetById = new Map(preTargetNodes.map((node) => [node.nodeId, node]));
  const enteringRoots = [...targetRootIds].map((id) => {
    const root = tracker.roots.get(id);
    const live = preTargetById.get(id);
    if (!root || !live) throw new Error(`target root ${id} is not a live root before target`);
    return {
      id,
      origin: root.origin,
      spawnedAtRelativeMove: root.spawnedAtRelativeMove,
      spawnPosition: { x: root.x, y: root.y },
      value: root.value,
      preTargetPosition: { x: live.x, y: live.y },
      isDirectTargetInput: targetInputNodeIds.includes(id),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const nonEnteringLiveRoots = preTargetNodes
    .filter(({ nodeId }) => tracker.roots.has(nodeId) && !targetRootIds.has(nodeId))
    .map((live) => ({ root: tracker.roots.get(live.nodeId), live }));
  return {
    replayMatchesRetainedTrace: true,
    targetRelativeMove: trace.length,
    enteringRoots: enteringRoots.map((root) => ({ ...root, matchedNonEnteringRoot: chooseMatch(root, nonEnteringLiveRoots) })),
  };
}

function loadTargetChainArtifact() {
  const artifact = JSON.parse(fs.readFileSync(TARGET_CHAIN_PATH, 'utf8'));
  if (!verifyNoReentryTargetChainArtifact(artifact) || artifact.artifactIdentity !== EXPECTED_TARGET_CHAIN_IDENTITY) {
    throw new Error('LC-0017 target-chain artifact identity mismatch');
  }
  return artifact;
}

function deriveCase(raw, selected) {
  const row = raw.eligibility.rows.find(({ recordingPath }) => recordingPath === selected.recordingPath);
  const pair = raw.pairs.find(({ recordingPath }) => recordingPath === selected.recordingPath);
  if (!row || !pair || pair.pairClass !== 'CASH_NOW_FASTER') throw new Error(`cash pair drifted: ${selected.recordingId}`);
  const result = replayCashContrast(row, pair.arms.CASH_NOW, selected.arms.CASH_NOW.targetCrossingChain);
  return {
    recordingId: selected.recordingId,
    recordingPath: selected.recordingPath,
    level: row.level,
    seed: row.seed,
    pairClass: pair.pairClass,
    cashMovesToTarget: pair.arms.CASH_NOW.movesToTarget,
    ...result,
  };
}

function deriveLaterRefillContrastArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) throw new Error('LC-0012 raw identity mismatch');
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT') throw new Error('LC-0012 raw result is not closed');
  const targetArtifact = loadTargetChainArtifact();
  const cases = targetArtifact.cases.map((selected) => deriveCase(raw, selected));
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0018-later-refill-contrast',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
      targetChain: { path: TARGET_CHAIN_RELATIVE, artifactIdentity: EXPECTED_TARGET_CHAIN_IDENTITY },
    },
    question: 'For each later-refill root directly entering the two retained cash target-crossing chains, what equal-value root born in the same refill does not enter, and how do their pre-target positions differ?',
    matchingRule: 'A match must be a later-refill root still live immediately before cash crosses target, born on the same relative move with the same value, and absent from the target-chain roots. Select minimum Manhattan distance from the entering root at that pre-target state; break ties by root ID. A missing match remains missing.',
    retrospectiveBoundary: 'This replays only the two retained cash continuations and compares observed live roots immediately before their retained target-crossing moves. It does not search alternatives, score a root, define a metric, or change policy.',
    cases,
    finding: 'ENTERING_LATER_REFILL_ROOTS_HAVE_REPLAYABLE_SAME_BIRTH_COUNTERPARTS_WHEN_AVAILABLE',
    interpretation: 'The artifact is a concrete replay inventory, not a claim that position, age, value, or distance causes a root to be selected into a winning chain.',
    nonClaims: [
      'This artifact does not establish a prospective board-resource metric.',
      'This artifact does not generalize beyond two retained cash continuations.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyLaterRefillContrastArtifact(artifact) {
  try {
    if (!verifyArtifactIdentity(artifact) || artifact.kind !== 'lc0018-later-refill-contrast'
      || artifact.source.sha256 !== EXPECTED_RAW_SHA256 || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
      || artifact.source.targetChain.artifactIdentity !== EXPECTED_TARGET_CHAIN_IDENTITY) return false;
    if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) return false;
    return JSON.stringify(artifact) === JSON.stringify(deriveLaterRefillContrastArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'))));
  } catch {
    return false;
  }
}

function main(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: node tools/diagnose-lc0018-later-refill-contrast.js --out <artifact.json>');
  const artifact = deriveLaterRefillContrastArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(argv[1]), artifact);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, cases: artifact.cases }, null, 2)}\n`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = { deriveLaterRefillContrastArtifact, verifyLaterRefillContrastArtifact };
