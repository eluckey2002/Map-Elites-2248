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
const {
  artifactWithIdentity,
  verifyArtifactIdentity,
} = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
const CASES = Object.freeze([
  Object.freeze({
    role: 'wait-helpful',
    recordingId: 'ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf',
    pairClass: 'OBSERVED_WAIT_FASTER',
  }),
  Object.freeze({
    role: 'cash-helpful-counterexample',
    recordingId: '9cd33937c5c0185968762e270a51ab2fa3ebed2d3cb89851258a25dc69b43bf0',
    pairClass: 'CASH_NOW_FASTER',
  }),
]);
const ORIGINS = Object.freeze(['common-board', 'first-action-refill', 'later-refill']);

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function snapshotTile(tile) {
  return { x: tile.x, y: tile.y, value: tile.value };
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
  const ordered = allTiles(state).sort((left, right) => (left.y - right.y) || (left.x - right.x));
  for (const tile of ordered) registerRoot(tracker, tile, 'common-board', 0);
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
  const root = {
    id: nextRootId(tracker, origin),
    origin,
    spawnedAtRelativeMove,
    ...snapshotTile(tile),
  };
  tracker.nodeByTile.set(tile, root.id);
  tracker.roots.set(root.id, root);
  return root;
}

function registerRefills(tracker, state, relativeMove) {
  const origin = relativeMove === 1 ? 'first-action-refill' : 'later-refill';
  return allTiles(state)
    .sort((left, right) => (left.y - right.y) || (left.x - right.x))
    .map((tile) => registerRoot(tracker, tile, origin, relativeMove))
    .filter(Boolean);
}

function liveById(state, tracker) {
  return Object.fromEntries(allTiles(state).map((tile) => {
    const id = tracker.nodeByTile.get(tile);
    if (!id) throw new Error(`untracked tile at ${tile.x},${tile.y}`);
    return [id, snapshotTile(tile)];
  }).sort(([left], [right]) => left.localeCompare(right)));
}

function boardSnapshot(state, tracker) {
  return allTiles(state)
    .map((tile) => ({ nodeId: tracker.nodeByTile.get(tile), ...snapshotTile(tile) }))
    .sort((left, right) => (left.y - right.y) || (left.x - right.x));
}

function executeTracked(tracker, state, rng, claims, source, relativeMove) {
  const chain = liveChain(state, claims);
  const inputNodeIds = chain.map((tile) => {
    const id = tracker.nodeByTile.get(tile);
    if (!id) throw new Error(`untracked chain input at ${tile.x},${tile.y}`);
    return id;
  });
  const survivor = chain.at(-1);
  const survivorStart = snapshotTile(survivor);
  const beforeCalls = rng.calls();
  const points = executeChain(state, chain);
  const mergeId = `M${String(tracker.nextMerge++).padStart(4, '0')}`;
  tracker.nodeByTile.set(survivor, mergeId);
  applyGravity(state);
  const survivorLanding = snapshotTile(survivor);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const refills = registerRefills(tracker, state, relativeMove);
  const chainSum = claims.reduce((sum, tile) => sum + tile.value, 0);
  const merge = {
    id: mergeId,
    relativeMove,
    source,
    inputNodeIds,
    chain: claims.map(snapshotTile),
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
    postBoard: {
      board: boardSnapshot(state, tracker),
      byId: liveById(state, tracker),
    },
    refillRngCalls: rng.calls() - beforeCalls,
    score: state.score,
    moves: state.moves,
    postStateIdentity: stateIdentity(state),
    terminal: classifyTerminal(state),
  };
}

function resolveNode(tracker, nodeId, visiting = new Set()) {
  const root = tracker.roots.get(nodeId);
  if (root) return { rootIds: [nodeId], value: root.value, mergeIds: [] };
  const merge = tracker.merges.get(nodeId);
  if (!merge) throw new Error(`missing ancestry node: ${nodeId}`);
  if (visiting.has(nodeId)) throw new Error(`ancestry cycle: ${nodeId}`);
  visiting.add(nodeId);
  const inputs = merge.inputNodeIds.map((id) => resolveNode(tracker, id, visiting));
  visiting.delete(nodeId);
  const rootIds = inputs.flatMap(({ rootIds: ids }) => ids);
  if (new Set(rootIds).size !== rootIds.length) throw new Error(`duplicate ancestry root in ${nodeId}`);
  const value = inputs.reduce((sum, input) => sum + input.value, 0);
  if (value !== merge.chainSum || value !== merge.output.value) {
    throw new Error(`root-value conservation mismatch in ${nodeId}`);
  }
  return {
    rootIds,
    value,
    mergeIds: inputs.flatMap(({ mergeIds }) => mergeIds).concat(nodeId),
  };
}

function originBreakdown(roots) {
  return ORIGINS.map((origin) => {
    const matching = roots.filter((root) => root.origin === origin);
    return {
      origin,
      count: matching.length,
      value: matching.reduce((sum, root) => sum + root.value, 0),
    };
  });
}

function buildGraph(tracker, outputNodeId) {
  const resolved = resolveNode(tracker, outputNodeId);
  const roots = resolved.rootIds.map((id) => tracker.roots.get(id)).sort((left, right) => left.id.localeCompare(right.id));
  const merges = [...new Set(resolved.mergeIds)].map((id) => tracker.merges.get(id))
    .sort((left, right) => left.relativeMove - right.relativeMove || left.id.localeCompare(right.id));
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
    if (roots.size !== graph.roots.length || merges.size !== graph.merges.length) return false;
    const visiting = new Set();
    const visitedRoots = new Set();
    const visitedMerges = new Set();
    function resolve(id) {
      if (roots.has(id)) {
        const root = roots.get(id);
        if (!ORIGINS.includes(root.origin)) throw new Error('invalid root origin');
        visitedRoots.add(id);
        return { rootIds: [id], value: root.value };
      }
      const merge = merges.get(id);
      if (!merge || visiting.has(id)) throw new Error('missing node or cycle');
      visiting.add(id);
      const inputs = merge.inputNodeIds.map(resolve);
      visiting.delete(id);
      visitedMerges.add(id);
      const rootIds = inputs.flatMap(({ rootIds: ids }) => ids);
      if (new Set(rootIds).size !== rootIds.length) throw new Error('duplicate root');
      const value = inputs.reduce((sum, input) => sum + input.value, 0);
      if (value !== merge.chainSum || value !== merge.output.value) throw new Error('conservation mismatch');
      return { rootIds, value };
    }
    const resolved = resolve(graph.outputNodeId);
    return visitedRoots.size === roots.size
      && visitedMerges.size === merges.size
      && resolved.value === graph.rootValueSum
      && JSON.stringify([...resolved.rootIds].sort()) === JSON.stringify([...roots.keys()].sort());
  } catch {
    return false;
  }
}

function reconstructCommon(row) {
  const recordingPath = path.join(ROOT, row.recordingPath);
  if (sha256File(recordingPath) !== row.recordingIdentity) {
    throw new Error(`recording identity mismatch: ${row.recordingPath}`);
  }
  const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error(`recording does not resolve: ${row.recordingPath}`);
  const rng = makeRng(recording.seed);
  const state = createLevelState(resolved.candidate, rng);
  for (let index = 0; index < row.selected.readyMove - 1; index += 1) {
    const chain = liveChain(state, recording.chains[index].tiles);
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (points !== recording.chains[index].points) throw new Error(`recording prefix drift at move ${index + 1}`);
  }
  if (stateIdentity(state) !== row.selected.commonStateIdentity
    || state.score !== row.selected.commonScore
    || state.moves !== row.selected.commonMoves) {
    throw new Error(`common state mismatch: ${row.recordingPath}`);
  }
  return { recording, state, rng };
}

function replayArm(row, retainedArm) {
  const common = reconstructCommon(row);
  const tracker = createTracker(common.state);
  const rng = countedRng(common.rng);
  const commonLiveById = liveById(common.state, tracker);
  const rootAtCoordinate = new Map(Object.entries(commonLiveById).map(([id, tile]) => [`${tile.x},${tile.y}`, id]));
  const readyRouteRootIds = row.selected.routeAtReadiness.map(({ x, y, value }) => {
    const id = rootAtCoordinate.get(`${x},${y}`);
    if (!id || commonLiveById[id].value !== value) throw new Error('ready route root mismatch');
    return id;
  });
  const events = [];
  for (let index = 0; index < retainedArm.trace.length; index += 1) {
    const retained = retainedArm.trace[index];
    if (stateIdentity(common.state) !== retained.preStateIdentity) {
      throw new Error(`${retainedArm.arm} pre-state drift at relative move ${index + 1}`);
    }
    const executed = executeTracked(tracker, common.state, rng, retained.chain, retained.source, index + 1);
    if (executed.merge.points !== retained.points
      || executed.score !== retained.score
      || executed.moves !== retained.moves
      || executed.postStateIdentity !== retained.postStateIdentity
      || executed.refillRngCalls !== retained.refillRngCalls
      || JSON.stringify(executed.terminal) !== JSON.stringify(retained.terminal)) {
      throw new Error(`${retainedArm.arm} retained trace drift at relative move ${index + 1}`);
    }
    events.push(executed);
  }
  const decisiveIndex = retainedArm.trace.slice(1).reduce((best, event, index) => {
    const absoluteIndex = index + 1;
    return event.points > retainedArm.trace[best].points ? absoluteIndex : best;
  }, 1);
  const decisiveEvent = events[decisiveIndex];
  const graph = buildGraph(tracker, decisiveEvent.merge.id);
  const firstEvent = events[0];
  const afterFirstLive = firstEvent.postBoard;
  const firstActionInputRoots = resolveMergeRoots(tracker, firstEvent.merge.id);
  return {
    arm: retainedArm.arm,
    start: retainedArm.start,
    movesToTarget: retainedArm.movesToTarget,
    replayMatchesRetainedTrace: true,
    commonBoard: {
      stateIdentity: row.selected.commonStateIdentity,
      readyRouteRootIds,
      tiles: Object.entries(commonLiveById).map(([nodeId, tile]) => ({ nodeId, ...tile })),
    },
    postFirstAction: {
      source: firstEvent.merge.source,
      points: firstEvent.merge.points,
      merge: firstEvent.merge,
      inputNodeIds: firstEvent.merge.inputNodeIds,
      inputRootIds: firstActionInputRoots,
      survivorLanding: firstEvent.merge.output,
      refills: firstEvent.refills,
      stateIdentity: retainedArm.trace[0].postStateIdentity,
      board: afterFirstLive.board,
      readyRouteRootCount: readyRouteRootIds.length,
      readyRouteRootsStillLive: readyRouteRootIds.filter((id) => afterFirstLive.byId[id]),
      readyRouteLivePositions: readyRouteRootIds.filter((id) => afterFirstLive.byId[id])
        .map((id) => ({ nodeId: id, ...afterFirstLive.byId[id] })),
    },
    decisiveChain: {
      relativeMove: decisiveIndex + 1,
      source: decisiveEvent.merge.source,
      points: decisiveEvent.merge.points,
      chainSum: decisiveEvent.merge.chainSum,
      chainLength: decisiveEvent.merge.chain.length,
      chain: decisiveEvent.merge.chain,
      directInputNodeIds: decisiveEvent.merge.inputNodeIds,
      roots: graph.roots,
      merges: graph.merges,
      rootValueSum: graph.rootValueSum,
      originBreakdown: graph.originBreakdown,
      firstActionSurvivorContributes: graph.firstActionSurvivorContributes,
      firstActionSurvivorIsDirectInput: graph.firstActionSurvivorIsDirectInput,
      firstActionInputRootsReused: firstActionInputRoots.filter((id) => graph.roots.some((root) => root.id === id)),
      graphValid: validateGraph(graph),
    },
  };
}

function originEntry(arm, origin) {
  return arm.decisiveChain.originBreakdown.find((entry) => entry.origin === origin);
}

function compareCase(caseRecord) {
  const winnerArm = caseRecord.pairClass === 'OBSERVED_WAIT_FASTER' ? 'OBSERVED_WAIT' : 'CASH_NOW';
  const loserArm = winnerArm === 'OBSERVED_WAIT' ? 'CASH_NOW' : 'OBSERVED_WAIT';
  const winner = caseRecord.arms[winnerArm];
  const loser = caseRecord.arms[loserArm];
  const winnerCommon = originEntry(winner, 'common-board');
  const loserCommon = originEntry(loser, 'common-board');
  return {
    role: caseRecord.role,
    winnerArm,
    loserArm,
    winnerSurvivorLanding: winner.postFirstAction.survivorLanding,
    loserSurvivorLanding: loser.postFirstAction.survivorLanding,
    winnerSurvivorDirectlyReused: winner.decisiveChain.firstActionSurvivorIsDirectInput,
    loserSurvivorDirectlyReused: loser.decisiveChain.firstActionSurvivorIsDirectInput,
    winnerReadyRouteRootsStillLive: winner.postFirstAction.readyRouteRootsStillLive.length,
    loserReadyRouteRootsStillLive: loser.postFirstAction.readyRouteRootsStillLive.length,
    winnerFirstActionRefills: winner.postFirstAction.refills.length,
    loserFirstActionRefills: loser.postFirstAction.refills.length,
    winnerDecisiveChain: {
      relativeMove: winner.decisiveChain.relativeMove,
      length: winner.decisiveChain.chainLength,
      sum: winner.decisiveChain.chainSum,
      points: winner.decisiveChain.points,
      commonBoardRootCount: winnerCommon.count,
      commonBoardRootValue: winnerCommon.value,
    },
    loserDecisiveChain: {
      relativeMove: loser.decisiveChain.relativeMove,
      length: loser.decisiveChain.chainLength,
      sum: loser.decisiveChain.chainSum,
      points: loser.decisiveChain.points,
      commonBoardRootCount: loserCommon.count,
      commonBoardRootValue: loserCommon.value,
    },
  };
}

function sharedPatternFromComparisons(comparisons) {
  return {
    landingCell: comparisons.every(({ winnerSurvivorLanding }) => (
      winnerSurvivorLanding.x === 1 && winnerSurvivorLanding.y === 5
    )) ? { x: 1, y: 5 } : null,
    survivorDirectlyReused: comparisons.every(({ winnerSurvivorDirectlyReused }) => winnerSurvivorDirectlyReused),
    decisiveChainUsesMoreCommonBoardRootsAndValue: comparisons.every(({ winnerDecisiveChain, loserDecisiveChain }) => (
      winnerDecisiveChain.commonBoardRootCount > loserDecisiveChain.commonBoardRootCount
      && winnerDecisiveChain.commonBoardRootValue > loserDecisiveChain.commonBoardRootValue
    )),
    routePreservationDirectionReverses: comparisons[0].winnerReadyRouteRootsStillLive > comparisons[0].loserReadyRouteRootsStillLive
      && comparisons[1].winnerReadyRouteRootsStillLive < comparisons[1].loserReadyRouteRootsStillLive,
    firstActionRefillCountDirectionReverses: comparisons[0].winnerFirstActionRefills > comparisons[0].loserFirstActionRefills
      && comparisons[1].winnerFirstActionRefills < comparisons[1].loserFirstActionRefills,
  };
}

function resolveMergeRoots(tracker, mergeId) {
  return resolveNode(tracker, mergeId).rootIds.slice().sort();
}

function deriveCase(raw, descriptor) {
  const suffix = `${descriptor.recordingId}.json`;
  const row = raw.eligibility.rows.find((entry) => entry.recordingPath.endsWith(suffix));
  const pair = raw.pairs.find((entry) => entry.recordingPath.endsWith(suffix));
  if (!row || !row.selected || !pair) throw new Error(`missing named timing case: ${descriptor.recordingId}`);
  if (pair.pairClass !== descriptor.pairClass || pair.selectedKey !== row.selectedKey) {
    throw new Error(`named timing case drifted: ${descriptor.recordingId}`);
  }
  return {
    role: descriptor.role,
    recordingId: descriptor.recordingId,
    recordingPath: row.recordingPath,
    recordingIdentity: row.recordingIdentity,
    level: row.level,
    seed: row.seed,
    selectedKey: row.selectedKey,
    pairClass: pair.pairClass,
    pairedEffectCashMinusWait: pair.pairedEffectCashMinusWait,
    arms: {
      OBSERVED_WAIT: replayArm(row, pair.arms.OBSERVED_WAIT),
      CASH_NOW: replayArm(row, pair.arms.CASH_NOW),
    },
  };
}

function deriveTimingBoardAncestryArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) {
    throw new Error('LC-0012 raw identity mismatch');
  }
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT') {
    throw new Error('LC-0012 raw result is not the closed mixed panel');
  }
  const cases = CASES.map((descriptor) => deriveCase(raw, descriptor));
  const comparisons = cases.map(compareCase);
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0014-timing-board-ancestry',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
    },
    question: 'What exact survivor landing, refill consumption, and decisive-chain ancestry distinguish the named helpful-wait case from the helpful-cash counterexample?',
    cases,
    comparisons,
    sharedWinnerPattern: sharedPatternFromComparisons(comparisons),
    finding: 'WINNING_ACTION_LANDS_AND_REUSES_COMPATIBLE_SURVIVOR',
    interpretation: 'In both named cases, the faster action lands its first survivor at Level 54 cell (1,5), directly reuses that survivor in the decisive later chain, and links more common-board roots and value into that chain than the slower arm. Ready-route preservation and refill count reverse direction across the two cases, so neither alone explains the outcome. This is exact hindsight evidence, not a prospective metric.',
    nonClaims: [
      'This artifact does not generalize beyond the two named LC-0012 pairs.',
      'This artifact does not define or validate a timing metric.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyTimingBoardAncestryArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)
    || artifact.kind !== 'lc0014-timing-board-ancestry'
    || artifact.source.sha256 !== EXPECTED_RAW_SHA256
    || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
    || artifact.finding !== 'WINNING_ACTION_LANDS_AND_REUSES_COMPATIBLE_SURVIVOR'
    || artifact.cases.length !== CASES.length) return false;
  const comparisons = artifact.cases.map(compareCase);
  if (JSON.stringify(artifact.comparisons) !== JSON.stringify(comparisons)
    || JSON.stringify(artifact.sharedWinnerPattern) !== JSON.stringify(sharedPatternFromComparisons(comparisons))) {
    return false;
  }
  return artifact.cases.every((caseRecord, caseIndex) => (
    caseRecord.recordingId === CASES[caseIndex].recordingId
    && caseRecord.pairClass === CASES[caseIndex].pairClass
    && Object.values(caseRecord.arms).every((arm) => {
      const firstMerge = arm.postFirstAction.merge;
      const outputMerge = arm.decisiveChain.merges.at(-1);
      const expectedOriginBreakdown = originBreakdown(arm.decisiveChain.roots);
      const expectedRootValueSum = arm.decisiveChain.roots.reduce((sum, root) => sum + root.value, 0);
      if (!firstMerge || firstMerge.id !== 'M0001' || !outputMerge
        || JSON.stringify(arm.postFirstAction.survivorLanding) !== JSON.stringify(firstMerge.output)
        || arm.decisiveChain.relativeMove !== outputMerge.relativeMove
        || arm.decisiveChain.points !== outputMerge.points
        || arm.decisiveChain.chainSum !== outputMerge.chainSum
        || arm.decisiveChain.chainLength !== outputMerge.chain.length
        || JSON.stringify(arm.decisiveChain.chain) !== JSON.stringify(outputMerge.chain)
        || JSON.stringify(arm.decisiveChain.directInputNodeIds) !== JSON.stringify(outputMerge.inputNodeIds)
        || JSON.stringify(arm.decisiveChain.originBreakdown) !== JSON.stringify(expectedOriginBreakdown)
        || arm.decisiveChain.rootValueSum !== expectedRootValueSum
        || arm.decisiveChain.firstActionSurvivorContributes !== arm.decisiveChain.merges.some(({ id }) => id === 'M0001')
        || arm.decisiveChain.firstActionSurvivorIsDirectInput !== outputMerge.inputNodeIds.includes('M0001')) {
        return false;
      }
      const graph = {
        outputNodeId: outputMerge.id,
        roots: arm.decisiveChain.roots,
        merges: arm.decisiveChain.merges,
        rootValueSum: arm.decisiveChain.rootValueSum,
      };
      return arm.replayMatchesRetainedTrace
        && arm.decisiveChain.graphValid
        && validateGraph(graph);
    })
  ));
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') {
    throw new Error('usage: node tools/diagnose-lc0014-timing-board-ancestry.js --out <artifact.json>');
  }
  return { out: argv[1] };
}

function main(argv) {
  const { out } = parseArgs(argv);
  if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) throw new Error('LC-0012 raw file hash mismatch');
  const artifact = deriveTimingBoardAncestryArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(out), artifact);
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    finding: artifact.finding,
    cases: artifact.cases.map((entry) => ({
      role: entry.role,
      recordingId: entry.recordingId,
      pairClass: entry.pairClass,
      arms: Object.fromEntries(Object.entries(entry.arms).map(([name, arm]) => [name, {
        survivorLanding: arm.postFirstAction.survivorLanding,
        firstActionRefills: arm.postFirstAction.refills.length,
        decisiveRelativeMove: arm.decisiveChain.relativeMove,
        decisivePoints: arm.decisiveChain.points,
        originBreakdown: arm.decisiveChain.originBreakdown,
        firstActionSurvivorContributes: arm.decisiveChain.firstActionSurvivorContributes,
      }])),
    })),
    sharedWinnerPattern: artifact.sharedWinnerPattern,
  }, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_RAW_IDENTITY,
  EXPECTED_RAW_SHA256,
  deriveTimingBoardAncestryArtifact,
  validateGraph,
  verifyTimingBoardAncestryArtifact,
};
