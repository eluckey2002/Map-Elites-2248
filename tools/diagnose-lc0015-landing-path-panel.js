#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  applyGravity,
  canExtendChain,
  chainMultiplier,
  chainValue,
  createLevelState,
  executeChain,
  isBlockedTile,
  isValidChain,
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
const ARMS = Object.freeze(['OBSERVED_WAIT', 'CASH_NOW']);

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function compactTile(tile) {
  return {
    x: tile.x,
    y: tile.y,
    value: tile.value,
    blocker: tile.blocker || null,
    blockerDuration: tile.blockerDuration || 0,
    bombTimer: tile.bombTimer || 0,
  };
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

function reconstructCommon(row) {
  if (!row.selected) throw new Error('cannot reconstruct an unselected row');
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
    if (points !== recording.chains[index].points) {
      throw new Error(`recording prefix drift at move ${index + 1}`);
    }
  }
  if (stateIdentity(state) !== row.selected.commonStateIdentity
    || state.score !== row.selected.commonScore
    || state.moves !== row.selected.commonMoves) {
    throw new Error(`common state mismatch: ${row.recordingPath}`);
  }
  return { state, rng };
}

function createTracker(state) {
  const nodeByTile = new WeakMap();
  const nodeMetadata = new Map();
  let nextCommon = 1;
  for (const tile of allTiles(state).sort((left, right) => (left.y - right.y) || (left.x - right.x))) {
    const nodeId = `C${String(nextCommon++).padStart(4, '0')}`;
    nodeByTile.set(tile, nodeId);
    nodeMetadata.set(nodeId, {
      preparedRoots: [{ id: nodeId, value: tile.value }],
      origin: 'common-board',
    });
  }
  return { nodeByTile, nodeMetadata, nextRefill: 1 };
}

function registerRefills(tracker, state) {
  const refills = [];
  for (const tile of allTiles(state).sort((left, right) => (left.y - right.y) || (left.x - right.x))) {
    if (tracker.nodeByTile.has(tile)) continue;
    const nodeId = `F${String(tracker.nextRefill++).padStart(4, '0')}`;
    tracker.nodeByTile.set(tile, nodeId);
    tracker.nodeMetadata.set(nodeId, {
      preparedRoots: [],
      origin: 'first-action-refill',
    });
    refills.push({ nodeId, ...compactTile(tile) });
  }
  return refills;
}

function snapshotBoard(state, tracker) {
  return allTiles(state)
    .map((tile) => {
      const nodeId = tracker.nodeByTile.get(tile);
      const metadata = tracker.nodeMetadata.get(nodeId);
      if (!nodeId || !metadata) throw new Error(`untracked post-action tile at ${tile.x},${tile.y}`);
      return {
        nodeId,
        ...compactTile(tile),
        origin: metadata.origin,
        preparedRoots: metadata.preparedRoots,
        preparedValue: metadata.preparedRoots.reduce((sum, root) => sum + root.value, 0),
      };
    })
    .sort((left, right) => (left.y - right.y) || (left.x - right.x));
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

function applyFirstAction(common, retainedEvent) {
  const tracker = createTracker(common.state);
  const rng = countedRng(common.rng);
  if (stateIdentity(common.state) !== retainedEvent.preStateIdentity) {
    throw new Error('retained first-action pre-state drift');
  }
  const chain = liveChain(common.state, retainedEvent.chain);
  const inputNodeIds = chain.map((tile) => tracker.nodeByTile.get(tile));
  const inputRoots = inputNodeIds.flatMap((nodeId) => tracker.nodeMetadata.get(nodeId).preparedRoots);
  const survivor = chain.at(-1);
  const beforeCalls = rng.calls();
  const points = executeChain(common.state, chain);
  tracker.nodeByTile.set(survivor, 'M0001');
  tracker.nodeMetadata.set('M0001', {
    preparedRoots: inputRoots,
    origin: 'first-action-survivor',
  });
  applyGravity(common.state);
  const survivorLanding = { nodeId: 'M0001', ...compactTile(survivor) };
  spawnNewTiles(common.state, rng);
  tickBlockers(common.state);
  const refills = registerRefills(tracker, common.state);
  const observed = {
    points,
    score: common.state.score,
    moves: common.state.moves,
    postStateIdentity: stateIdentity(common.state),
    refillRngCalls: rng.calls() - beforeCalls,
    terminal: classifyTerminal(common.state),
  };
  const matches = observed.points === retainedEvent.points
    && observed.score === retainedEvent.score
    && observed.moves === retainedEvent.moves
    && observed.postStateIdentity === retainedEvent.postStateIdentity
    && observed.refillRngCalls === retainedEvent.refillRngCalls
    && JSON.stringify(observed.terminal) === JSON.stringify(retainedEvent.terminal);
  if (!matches) throw new Error('retained first-action replay drift');
  return {
    state: common.state,
    tracker,
    action: {
      source: retainedEvent.source,
      chain: retainedEvent.chain,
      inputNodeIds,
      points,
      survivorLanding,
      refills,
      postStateIdentity: observed.postStateIdentity,
      refillRngCalls: observed.refillRngCalls,
      terminal: observed.terminal,
      minChain: common.state.minChain,
      board: snapshotBoard(common.state, tracker),
    },
  };
}

function witnessKey(witness) {
  return witness.tiles.map(({ x, y }) => `${x},${y}`).join('|');
}

function betterWitness(candidate, current, field) {
  if (!current) return true;
  const fields = [field, 'preparedValue', 'preparedRootCount', 'points', 'length', 'sum'];
  for (const name of fields) {
    if (candidate[name] !== current[name]) return candidate[name] > current[name];
  }
  return witnessKey(candidate).localeCompare(witnessKey(current)) < 0;
}

function enumerateSurvivorPaths(state, tracker) {
  const tiles = allTiles(state).filter((tile) => !isBlockedTile(tile));
  const tileByIndex = new Map(tiles.map((tile) => [tile.y * state.gridWidth + tile.x, tile]));
  const survivor = tiles.find((tile) => tracker.nodeByTile.get(tile) === 'M0001');
  if (!survivor) throw new Error('first-action survivor is not live after refill');
  const survivorIndex = survivor.y * state.gridWidth + survivor.x;
  const survivorBit = 1n << BigInt(survivorIndex);
  const visited = new Set();
  let legalPathCount = 0;
  const best = {
    preparedValue: null,
    preparedRootCount: null,
    points: null,
    length: null,
  };

  function makeWitness(chain, preparedRoots) {
    const sum = chainValue(chain);
    const preparedRootList = [...preparedRoots.values()].sort((left, right) => left.id.localeCompare(right.id));
    const pathTiles = chain.map((tile) => ({ nodeId: tracker.nodeByTile.get(tile), ...compactTile(tile) }));
    return {
      length: chain.length,
      sum,
      points: Math.floor(sum * chainMultiplier(chain.length)),
      preparedRootCount: preparedRootList.length,
      preparedValue: preparedRootList.reduce((total, root) => total + root.value, 0),
      preparedRoots: preparedRootList,
      survivorIndex: pathTiles.findIndex(({ nodeId }) => nodeId === 'M0001'),
      startValue: chain[0].value,
      endValue: chain.at(-1).value,
      minValue: Math.min(...chain.map(({ value }) => value)),
      maxValue: Math.max(...chain.map(({ value }) => value)),
      tiles: pathTiles,
    };
  }

  function preparedRootsFor(chain) {
    const roots = new Map();
    for (const tile of chain) {
      const nodeId = tracker.nodeByTile.get(tile);
      for (const root of tracker.nodeMetadata.get(nodeId).preparedRoots) roots.set(root.id, root);
    }
    return roots;
  }

  function record(chain, mask) {
    if (chain.length < state.minChain || !(mask & survivorBit)) return;
    legalPathCount += 1;
    const witness = makeWitness(chain, preparedRootsFor(chain));
    for (const field of Object.keys(best)) {
      if (betterWitness(witness, best[field], field)) best[field] = witness;
    }
  }

  function visit(chain, mask) {
    const last = chain.at(-1);
    const lastIndex = last.y * state.gridWidth + last.x;
    const key = (mask << 6n) | BigInt(lastIndex);
    if (visited.has(key)) return;
    visited.add(key);
    record(chain, mask);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nextX = last.x + dx;
        const nextY = last.y + dy;
        if (nextX < 0 || nextX >= state.gridWidth || nextY < 0 || nextY >= state.gridHeight) continue;
        const nextIndex = nextY * state.gridWidth + nextX;
        const next = tileByIndex.get(nextIndex);
        const nextBit = 1n << BigInt(nextIndex);
        if (!next || (mask & nextBit) || !canExtendChain(chain, next)) continue;
        chain.push(next);
        visit(chain, mask | nextBit);
        chain.pop();
      }
    }
  }

  for (const first of tiles) {
    const firstIndex = first.y * state.gridWidth + first.x;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const secondX = first.x + dx;
        const secondY = first.y + dy;
        if (secondX < 0 || secondX >= state.gridWidth || secondY < 0 || secondY >= state.gridHeight) continue;
        const secondIndex = secondY * state.gridWidth + secondX;
        const second = tileByIndex.get(secondIndex);
        if (!second || second.value !== first.value) continue;
        const mask = (1n << BigInt(firstIndex)) | (1n << BigInt(secondIndex));
        visit([first, second], mask);
      }
    }
  }

  const maximum = (field) => (best[field]
    ? { value: best[field][field], witness: best[field] }
    : { value: 0, witness: null });
  return {
    complete: true,
    distinctness: 'final-cell plus consumed-cell set; path-order duplicates collapse to one board action',
    visitedPathStates: visited.size,
    legalPathCount,
    maxPreparedValue: maximum('preparedValue'),
    maxPreparedRootCount: maximum('preparedRootCount'),
    maxPoints: maximum('points'),
    maxLength: maximum('length'),
  };
}

function deriveArm(row, retainedArm) {
  const replay = applyFirstAction(reconstructCommon(row), retainedArm.trace[0]);
  return {
    arm: retainedArm.arm,
    movesToTarget: retainedArm.movesToTarget,
    replayMatchesRetainedFirstAction: true,
    postFirstAction: replay.action,
    survivorPath: enumerateSurvivorPaths(replay.state, replay.tracker),
  };
}

function recordingId(recordingPath) {
  return path.basename(recordingPath, '.json');
}

function deriveCase(raw, pair) {
  const row = raw.eligibility.rows.find((entry) => entry.recordingPath === pair.recordingPath);
  if (!row || !row.selected || pair.selectedKey !== row.selectedKey) {
    throw new Error(`selected pair no longer resolves: ${pair.recordingPath}`);
  }
  return {
    recordingId: recordingId(pair.recordingPath),
    recordingPath: pair.recordingPath,
    recordingIdentity: row.recordingIdentity,
    level: pair.level,
    seed: pair.seed,
    selectedKey: pair.selectedKey,
    pairClass: pair.pairClass,
    pairedEffectCashMinusWait: pair.pairedEffectCashMinusWait,
    arms: {
      OBSERVED_WAIT: deriveArm(row, pair.arms.OBSERVED_WAIT),
      CASH_NOW: deriveArm(row, pair.arms.CASH_NOW),
    },
  };
}

function direction(waitValue, cashValue) {
  if (waitValue === cashValue) return 'TIE';
  return waitValue > cashValue ? 'OBSERVED_WAIT' : 'CASH_NOW';
}

function compareCase(caseRecord) {
  const waitValue = caseRecord.arms.OBSERVED_WAIT.survivorPath.maxPreparedValue.value;
  const cashValue = caseRecord.arms.CASH_NOW.survivorPath.maxPreparedValue.value;
  const preparedValueDirection = direction(waitValue, cashValue);
  const fasterArm = caseRecord.pairClass === 'OBSERVED_WAIT_FASTER'
    ? 'OBSERVED_WAIT'
    : caseRecord.pairClass === 'CASH_NOW_FASTER' ? 'CASH_NOW' : null;
  let classification = fasterArm ? 'PREPARED_VALUE_TIE' : 'TARGET_COST_TIE';
  if (fasterArm && preparedValueDirection !== 'TIE') {
    classification = preparedValueDirection === fasterArm
      ? 'STRICT_PREPARED_VALUE_AGREEMENT'
      : 'STRICT_PREPARED_VALUE_REVERSAL';
  }
  return {
    recordingId: caseRecord.recordingId,
    level: caseRecord.level,
    seed: caseRecord.seed,
    pairClass: caseRecord.pairClass,
    fasterArm,
    survivorLanding: Object.fromEntries(ARMS.map((arm) => [arm, caseRecord.arms[arm].postFirstAction.survivorLanding])),
    maxPreparedValue: {
      OBSERVED_WAIT: waitValue,
      CASH_NOW: cashValue,
    },
    preparedValueDirection,
    classification,
  };
}

function summarizePanel(cases, comparisons) {
  const pairClasses = {};
  for (const { pairClass } of comparisons) pairClasses[pairClass] = (pairClasses[pairClass] || 0) + 1;
  const strictPreparedValueAgreements = comparisons.filter(({ classification }) => (
    classification === 'STRICT_PREPARED_VALUE_AGREEMENT'
  )).length;
  const strictPreparedValueReversals = comparisons.filter(({ classification }) => (
    classification === 'STRICT_PREPARED_VALUE_REVERSAL'
  )).length;
  const preparedValueTiesOnNonTiedOutcomes = comparisons.filter(({ classification }) => (
    classification === 'PREPARED_VALUE_TIE'
  )).length;
  const targetCostTies = comparisons.filter(({ classification }) => classification === 'TARGET_COST_TIE').length;
  const nonTiedOutcomes = comparisons.filter(({ fasterArm }) => fasterArm);
  return {
    pairCount: cases.length,
    armCount: cases.length * ARMS.length,
    pairClasses,
    nonTiedOutcomeCount: nonTiedOutcomes.length,
    strictPreparedValueAgreements,
    strictPreparedValueReversals,
    preparedValueTiesOnNonTiedOutcomes,
    targetCostTies,
    distinguishesAllNonTiedOutcomes: nonTiedOutcomes.every(({ preparedValueDirection, fasterArm }) => (
      preparedValueDirection === fasterArm
    )),
    waitFasterRecordingIds: comparisons
      .filter(({ pairClass }) => pairClass === 'OBSERVED_WAIT_FASTER')
      .map(({ recordingId: id }) => id),
    cashFasterCounterexampleRecordingIds: comparisons
      .filter(({ pairClass, preparedValueDirection }) => (
        pairClass === 'CASH_NOW_FASTER' && preparedValueDirection !== 'CASH_NOW'
      ))
      .map(({ recordingId: id }) => id),
    nonTiedMisses: comparisons.filter(({ classification }) => (
      classification === 'STRICT_PREPARED_VALUE_REVERSAL' || classification === 'PREPARED_VALUE_TIE'
    )),
    targetCostTieCases: comparisons.filter(({ classification }) => classification === 'TARGET_COST_TIE'),
  };
}

function deriveLandingPathPanelArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) {
    throw new Error('LC-0012 raw identity mismatch');
  }
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT' || raw.pairs.length !== 14) {
    throw new Error('LC-0012 raw result is not the closed 14-pair mixed panel');
  }
  const cases = raw.pairs.map((pair) => deriveCase(raw, pair));
  const comparisons = cases.map(compareCase);
  const panel = summarizePanel(cases, comparisons);
  const finding = panel.distinguishesAllNonTiedOutcomes
    ? 'PROSPECTIVE_SURVIVOR_PATH_DISTINGUISHES_FIXED_PANEL'
    : 'PROSPECTIVE_SURVIVOR_PATH_IS_INSUFFICIENT_ON_FIXED_PANEL';
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0015-landing-path-panel',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
    },
    question: 'Across all 14 frozen pairs, does the first-action survivor already sit on a legal small-to-large path through more prepared common-board value in the faster arm?',
    prospectiveBoundary: 'Each arm is derived from its post-first-action board only. Pair outcome labels are joined only after both arm structures are complete.',
    cases,
    comparisons,
    panel,
    finding,
    interpretation: panel.distinguishesAllNonTiedOutcomes
      ? 'On this fixed panel, the arm whose survivor can immediately participate in a legal path through more prepared common-board value matches every non-tied faster outcome.'
      : 'On this fixed panel, the arm whose survivor can immediately participate in a legal path through more prepared common-board value does not match every non-tied faster outcome. The exact misses prevent treating this property alone as a timing rule.',
    nonClaims: [
      'This artifact does not generalize beyond the 14 retained LC-0012 pairs.',
      'This artifact does not define, tune, or validate a policy metric.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyWitness(arm, maximum, field) {
  const witness = maximum && maximum.witness;
  if (arm.survivorPath.legalPathCount === 0) return maximum.value === 0 && witness === null;
  if (!witness || maximum.value !== witness[field]) return false;
  const board = new Map(arm.postFirstAction.board.map((tile) => [`${tile.x},${tile.y}`, tile]));
  const seen = new Set();
  const chain = [];
  const roots = new Map();
  for (const claimed of witness.tiles) {
    const key = `${claimed.x},${claimed.y}`;
    const tile = board.get(key);
    if (!tile || seen.has(key) || tile.nodeId !== claimed.nodeId || tile.value !== claimed.value || isBlockedTile(tile)) {
      return false;
    }
    seen.add(key);
    chain.push(tile);
    for (const root of tile.preparedRoots) roots.set(root.id, root);
  }
  for (let index = 1; index < chain.length; index += 1) {
    const previous = chain[index - 1];
    const current = chain[index];
    const dx = Math.abs(previous.x - current.x);
    const dy = Math.abs(previous.y - current.y);
    if ((dx === 0 && dy === 0) || dx > 1 || dy > 1
      || !canExtendChain(chain.slice(0, index), current)) return false;
  }
  if (!isValidChain(chain, arm.postFirstAction.minChain)
    || !chain.some(({ nodeId }) => nodeId === 'M0001')) return false;
  const expectedRoots = [...roots.values()].sort((left, right) => left.id.localeCompare(right.id));
  const values = chain.map(({ value }) => value);
  return witness.length === chain.length
    && witness.sum === chainValue(chain)
    && witness.points === Math.floor(chainValue(chain) * chainMultiplier(chain.length))
    && witness.preparedRootCount === witness.preparedRoots.length
    && witness.preparedValue === witness.preparedRoots.reduce((sum, root) => sum + root.value, 0)
    && witness.survivorIndex === chain.findIndex(({ nodeId }) => nodeId === 'M0001')
    && witness.startValue === values[0]
    && witness.endValue === values.at(-1)
    && witness.minValue === Math.min(...values)
    && witness.maxValue === Math.max(...values)
    && JSON.stringify(witness.preparedRoots) === JSON.stringify(expectedRoots);
}

function verifyLandingPathPanelArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)
    || artifact.kind !== 'lc0015-landing-path-panel'
    || artifact.source.sha256 !== EXPECTED_RAW_SHA256
    || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
    || artifact.cases.length !== 14) return false;
  const comparisons = artifact.cases.map(compareCase);
  const panel = summarizePanel(artifact.cases, comparisons);
  const expectedFinding = panel.distinguishesAllNonTiedOutcomes
    ? 'PROSPECTIVE_SURVIVOR_PATH_DISTINGUISHES_FIXED_PANEL'
    : 'PROSPECTIVE_SURVIVOR_PATH_IS_INSUFFICIENT_ON_FIXED_PANEL';
  if (JSON.stringify(artifact.comparisons) !== JSON.stringify(comparisons)
    || JSON.stringify(artifact.panel) !== JSON.stringify(panel)
    || artifact.finding !== expectedFinding) return false;
  return artifact.cases.every((caseRecord) => ARMS.every((armName) => {
    const arm = caseRecord.arms[armName];
    if (!arm.replayMatchesRetainedFirstAction
      || !arm.survivorPath.complete
      || arm.postFirstAction.survivorLanding.nodeId !== 'M0001'
      || !arm.postFirstAction.board.some(({ nodeId }) => nodeId === 'M0001')) return false;
    return verifyWitness(arm, arm.survivorPath.maxPreparedValue, 'preparedValue')
      && verifyWitness(arm, arm.survivorPath.maxPreparedRootCount, 'preparedRootCount')
      && verifyWitness(arm, arm.survivorPath.maxPoints, 'points')
      && verifyWitness(arm, arm.survivorPath.maxLength, 'length');
  }));
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') {
    throw new Error('usage: node tools/diagnose-lc0015-landing-path-panel.js --out <artifact.json>');
  }
  return { out: argv[1] };
}

function main(argv) {
  const { out } = parseArgs(argv);
  if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) throw new Error('LC-0012 raw file hash mismatch');
  const artifact = deriveLandingPathPanelArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(out), artifact);
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    finding: artifact.finding,
    panel: artifact.panel,
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
  deriveLandingPathPanelArtifact,
  verifyLandingPathPanelArtifact,
};
