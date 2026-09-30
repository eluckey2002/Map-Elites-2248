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
const { verifyFirstCarrierPathArtifact } = require('./diagnose-lc0016-first-carrier-path');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const FIRST_CARRIER_RELATIVE = 'docs/learning-cycles/LC-0016-first-carrier-reentry.json';
const FIRST_CARRIER_PATH = path.join(ROOT, FIRST_CARRIER_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
const EXPECTED_FIRST_CARRIER_IDENTITY = '549ad815b40a12cdc5c2f4669b761eb6a51791bc08365b5aab1e7b20862ed58d';
const ORIGINS = Object.freeze(['common-board', 'first-action-refill', 'later-refill']);
const ARMS = Object.freeze(['OBSERVED_WAIT', 'CASH_NOW']);

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
    if (!tile) throw new Error(`chain names missing tile at ${x},${y}`);
    if (tile.value !== value) throw new Error(`chain value mismatch at ${x},${y}`);
    return tile;
  });
}

function countedRng(base) {
  let calls = 0;
  const rng = () => {
    calls += 1;
    return base();
  };
  rng.calls = () => calls;
  return rng;
}

function createTracker(state) {
  const tracker = {
    nodeByTile: new WeakMap(),
    roots: new Map(),
    merges: new Map(),
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
  if (!ORIGINS.includes(origin)) throw new Error(`unsupported root origin: ${origin}`);
  if (tracker.nodeByTile.has(tile)) return null;
  const root = { id: nextRootId(tracker, origin), origin, spawnedAtRelativeMove, ...compactTile(tile) };
  tracker.nodeByTile.set(tile, root.id);
  tracker.roots.set(root.id, root);
  return root;
}

function registerRefills(tracker, state, relativeMove) {
  const origin = relativeMove === 1 ? 'first-action-refill' : 'later-refill';
  return allTiles(state)
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
    .map((tile) => registerRoot(tracker, tile, origin, relativeMove))
    .filter(Boolean);
}

function liveByCoordinate(state, tracker) {
  return new Map(allTiles(state).map((tile) => [`${tile.x},${tile.y}`, {
    nodeId: tracker.nodeByTile.get(tile), ...compactTile(tile),
  }]));
}

function executeTracked(tracker, state, rng, claims, source, relativeMove) {
  const chain = liveChain(state, claims);
  const inputNodeIds = chain.map((tile) => {
    const id = tracker.nodeByTile.get(tile);
    if (!id) throw new Error(`untracked chain input at ${tile.x},${tile.y}`);
    return id;
  });
  const survivor = chain.at(-1);
  const survivorStart = compactTile(survivor);
  const beforeCalls = rng.calls();
  const points = executeChain(state, chain);
  const mergeId = `M${String(tracker.nextMerge++).padStart(4, '0')}`;
  tracker.nodeByTile.set(survivor, mergeId);
  applyGravity(state);
  const survivorLanding = compactTile(survivor);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const refills = registerRefills(tracker, state, relativeMove);
  const chainSum = claims.reduce((sum, tile) => sum + tile.value, 0);
  const merge = {
    id: mergeId,
    relativeMove,
    source,
    inputNodeIds,
    chain: claims.map(compactTile),
    chainSum,
    points,
    survivorStart,
    survivorLanding,
    output: { nodeId: mergeId, ...survivorLanding },
  };
  if (survivor.value !== chainSum) throw new Error(`merge ${mergeId} output value mismatch`);
  tracker.merges.set(mergeId, merge);
  return {
    merge,
    refills,
    score: state.score,
    moves: state.moves,
    postStateIdentity: stateIdentity(state),
    refillRngCalls: rng.calls() - beforeCalls,
    terminal: classifyTerminal(state),
  };
}

function resolveNode(tracker, nodeId, visiting = new Set()) {
  const root = tracker.roots.get(nodeId);
  if (root) return { rootIds: [nodeId], value: root.value, mergeIds: [] };
  const merge = tracker.merges.get(nodeId);
  if (!merge || visiting.has(nodeId)) throw new Error(`missing ancestry node or cycle: ${nodeId}`);
  visiting.add(nodeId);
  const inputs = merge.inputNodeIds.map((id) => resolveNode(tracker, id, visiting));
  visiting.delete(nodeId);
  const rootIds = inputs.flatMap(({ rootIds: ids }) => ids);
  if (new Set(rootIds).size !== rootIds.length) throw new Error(`duplicate ancestry root in ${nodeId}`);
  const value = inputs.reduce((sum, input) => sum + input.value, 0);
  if (value !== merge.chainSum || value !== merge.output.value) throw new Error(`root-value conservation mismatch in ${nodeId}`);
  return { rootIds, value, mergeIds: inputs.flatMap(({ mergeIds }) => mergeIds).concat(nodeId) };
}

function originBreakdown(roots) {
  return ORIGINS.map((origin) => {
    const matching = roots.filter((root) => root.origin === origin);
    return { origin, count: matching.length, value: matching.reduce((sum, root) => sum + root.value, 0) };
  });
}

function buildGraph(tracker, outputNodeId) {
  const resolved = resolveNode(tracker, outputNodeId);
  const roots = resolved.rootIds.map((id) => tracker.roots.get(id)).sort((a, b) => a.id.localeCompare(b.id));
  const merges = [...new Set(resolved.mergeIds)].map((id) => tracker.merges.get(id))
    .sort((a, b) => (a.relativeMove - b.relativeMove) || a.id.localeCompare(b.id));
  const output = tracker.merges.get(outputNodeId);
  return {
    outputNodeId,
    directInputNodeIds: output.inputNodeIds,
    roots,
    merges,
    rootValueSum: resolved.value,
    originBreakdown: originBreakdown(roots),
    firstActionSurvivorContributes: resolved.mergeIds.includes('M0001'),
    firstActionSurvivorIsDirectInput: output.inputNodeIds.includes('M0001'),
  };
}

function validateGraph(graph) {
  try {
    const roots = new Map(graph.roots.map((root) => [root.id, root]));
    const merges = new Map(graph.merges.map((merge) => [merge.id, merge]));
    const visiting = new Set();
    const usedRoots = new Set();
    const usedMerges = new Set();
    function resolve(id) {
      if (roots.has(id)) {
        const root = roots.get(id);
        if (!ORIGINS.includes(root.origin)) throw new Error('invalid root origin');
        usedRoots.add(id);
        return { rootIds: [id], value: root.value };
      }
      const merge = merges.get(id);
      if (!merge || visiting.has(id)) throw new Error('missing node or cycle');
      visiting.add(id);
      const inputs = merge.inputNodeIds.map(resolve);
      visiting.delete(id);
      usedMerges.add(id);
      const rootIds = inputs.flatMap(({ rootIds: ids }) => ids);
      if (new Set(rootIds).size !== rootIds.length) throw new Error('duplicate root');
      const value = inputs.reduce((sum, input) => sum + input.value, 0);
      if (value !== merge.chainSum || value !== merge.output.value) throw new Error('conservation mismatch');
      return { rootIds, value };
    }
    const resolved = resolve(graph.outputNodeId);
    return usedRoots.size === roots.size
      && usedMerges.size === merges.size
      && resolved.value === graph.rootValueSum;
  } catch {
    return false;
  }
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

function replayArm(row, retainedArm) {
  const common = reconstructCommon(row);
  const tracker = createTracker(common.state);
  const rootsAtReadiness = liveByCoordinate(common.state, tracker);
  const readyRouteRootIds = row.selected.routeAtReadiness.map(({ x, y, value }) => {
    const live = rootsAtReadiness.get(`${x},${y}`);
    if (!live || live.value !== value) throw new Error(`ready-route root mismatch at ${x},${y}`);
    return live.nodeId;
  });
  const rng = countedRng(common.rng);
  const events = [];
  for (let index = 0; index < retainedArm.trace.length; index += 1) {
    const retained = retainedArm.trace[index];
    const relativeMove = index + 1;
    if (stateIdentity(common.state) !== retained.preStateIdentity) throw new Error(`${retainedArm.arm} pre-state drift at relative move ${relativeMove}`);
    const executed = executeTracked(tracker, common.state, rng, retained.chain, retained.source, relativeMove);
    if (executed.merge.points !== retained.points || executed.score !== retained.score || executed.moves !== retained.moves
      || executed.postStateIdentity !== retained.postStateIdentity || executed.refillRngCalls !== retained.refillRngCalls
      || JSON.stringify(executed.terminal) !== JSON.stringify(retained.terminal)) {
      throw new Error(`${retainedArm.arm} retained trace drift at relative move ${relativeMove}`);
    }
    events.push(executed);
  }
  const targetCrossing = events.at(-1);
  if (!targetCrossing) throw new Error(`${retainedArm.arm} has no target-crossing event`);
  const graph = buildGraph(tracker, targetCrossing.merge.id);
  const readyRouteRoots = new Set(readyRouteRootIds);
  const readyRouteRootsUsed = graph.roots.filter(({ id }) => readyRouteRoots.has(id));
  return {
    arm: retainedArm.arm,
    movesToTarget: retainedArm.movesToTarget,
    replayMatchesRetainedTrace: true,
    targetCrossingChain: {
      relativeMove: targetCrossing.merge.relativeMove,
      source: targetCrossing.merge.source,
      points: targetCrossing.merge.points,
      chainLength: targetCrossing.merge.chain.length,
      chainSum: targetCrossing.merge.chainSum,
      chain: targetCrossing.merge.chain,
      directInputNodeIds: graph.directInputNodeIds,
      roots: graph.roots,
      merges: graph.merges,
      rootValueSum: graph.rootValueSum,
      originBreakdown: graph.originBreakdown,
      firstActionSurvivorContributes: graph.firstActionSurvivorContributes,
      firstActionSurvivorIsDirectInput: graph.firstActionSurvivorIsDirectInput,
      readyRouteRootContribution: {
        count: readyRouteRootsUsed.length,
        value: readyRouteRootsUsed.reduce((sum, root) => sum + root.value, 0),
        rootIds: readyRouteRootsUsed.map(({ id }) => id),
      },
      graphValid: validateGraph(graph),
    },
  };
}

function loadSelectedCases() {
  const firstCarrier = JSON.parse(fs.readFileSync(FIRST_CARRIER_PATH, 'utf8'));
  if (!verifyFirstCarrierPathArtifact(firstCarrier) || firstCarrier.artifactIdentity !== EXPECTED_FIRST_CARRIER_IDENTITY) {
    throw new Error('LC-0016 first-carrier artifact identity mismatch');
  }
  const cases = firstCarrier.cases.filter(({ pairClass, arms }) => (
    pairClass === 'CASH_NOW_FASTER'
    && arms.CASH_NOW.firstCarrierReentry === null
    && arms.OBSERVED_WAIT.firstCarrierReentry !== null
  ));
  if (cases.length !== 2) throw new Error(`expected two cash-faster no-reentry cases, found ${cases.length}`);
  return cases;
}

function deriveCase(raw, selected) {
  const pair = raw.pairs.find(({ recordingPath }) => recordingPath === selected.recordingPath);
  const row = raw.eligibility.rows.find(({ recordingPath }) => recordingPath === selected.recordingPath);
  if (!pair || !row || pair.pairClass !== 'CASH_NOW_FASTER' || row.selectedKey !== pair.selectedKey) {
    throw new Error(`selected no-reentry case drifted: ${selected.recordingId}`);
  }
  return {
    recordingId: selected.recordingId,
    recordingPath: selected.recordingPath,
    recordingIdentity: row.recordingIdentity,
    level: row.level,
    seed: row.seed,
    pairClass: pair.pairClass,
    pairedEffectCashMinusWait: pair.pairedEffectCashMinusWait,
    arms: Object.fromEntries(ARMS.map((arm) => [arm, replayArm(row, pair.arms[arm])])),
  };
}

function comparison(caseRecord) {
  const cash = caseRecord.arms.CASH_NOW.targetCrossingChain;
  const wait = caseRecord.arms.OBSERVED_WAIT.targetCrossingChain;
  return {
    recordingId: caseRecord.recordingId,
    cashMovesToTarget: caseRecord.arms.CASH_NOW.movesToTarget,
    waitMovesToTarget: caseRecord.arms.OBSERVED_WAIT.movesToTarget,
    cashFirstSurvivorContributes: cash.firstActionSurvivorContributes,
    waitFirstSurvivorContributes: wait.firstActionSurvivorContributes,
    cashReadyRouteRootCount: cash.readyRouteRootContribution.count,
    waitReadyRouteRootCount: wait.readyRouteRootContribution.count,
    cashOrigins: cash.originBreakdown,
    waitOrigins: wait.originBreakdown,
  };
}

function deriveNoReentryTargetChainArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) throw new Error('LC-0012 raw identity mismatch');
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT' || raw.pairs.length !== 14) {
    throw new Error('LC-0012 raw result is not the closed 14-pair mixed panel');
  }
  const cases = loadSelectedCases().map((selected) => deriveCase(raw, selected));
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0017-no-reentry-target-chain',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
      firstCarrier: { path: FIRST_CARRIER_RELATIVE, artifactIdentity: EXPECTED_FIRST_CARRIER_IDENTITY },
    },
    caseSelection: 'The two LC-0016 CASH_NOW_FASTER cases in which cash never reuses its first-action survivor and observed wait does.',
    question: 'When cash reaches the target without reusing its first-action survivor, which retained roots feed the exact target-crossing chain, and how do they compare with observed wait?',
    retrospectiveBoundary: 'Each arm replays its retained continuation exactly. This traces the final retained target-crossing chain only; it does not search alternatives, rank actions, define a metric, or change a policy.',
    cases,
    comparisons: cases.map(comparison),
    finding: 'TARGET_CHAIN_ANCESTRY_IS_OBSERVABLE_IN_NO_REENTRY_CASH_WINS',
    interpretation: 'This artifact identifies the exact common-board and refill roots of each retained target-crossing chain in the two selected no-reentry cash wins. It is evidence for further diagnosis, not a claim that any root category causes a win.',
    nonClaims: [
      'This artifact does not generalize beyond the two selected retained pairs.',
      'This artifact does not score or rank a prospective board resource.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyNoReentryTargetChainArtifact(artifact) {
  try {
    if (!verifyArtifactIdentity(artifact) || artifact.kind !== 'lc0017-no-reentry-target-chain'
      || artifact.source.sha256 !== EXPECTED_RAW_SHA256 || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
      || artifact.source.firstCarrier.artifactIdentity !== EXPECTED_FIRST_CARRIER_IDENTITY) return false;
    if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) return false;
    const expected = deriveNoReentryTargetChainArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
    return JSON.stringify(artifact) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: node tools/diagnose-lc0017-no-reentry-target-chain.js --out <artifact.json>');
  return { out: argv[1] };
}

function main(argv) {
  const { out } = parseArgs(argv);
  if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) throw new Error('LC-0012 raw file hash mismatch');
  const artifact = deriveNoReentryTargetChainArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(out), artifact);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, comparisons: artifact.comparisons }, null, 2)}\n`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = { deriveNoReentryTargetChainArtifact, verifyNoReentryTargetChainArtifact };
