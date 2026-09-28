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
  isBlockedTile,
  isMergeableSum,
} = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const {
  LOOKAHEAD_BASE,
  sequenceCostFromOutcome,
  stateDiagnostics,
} = require('../solver/sequence-value-probe');
const {
  qualify,
  validateManifest,
  verifyArtifactIdentity,
} = require('./qualify-three-step-target-progress');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const MISS_MOVES = [4, 6, 9, 11];
const SHORT_HORIZON = 3;

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function artifactWithIdentity(body) {
  return { ...body, artifactIdentity: sha256Bytes(JSON.stringify(body)) };
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
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return {
    points,
    length: snapshot.length,
    sum: snapshot.reduce((total, tile) => total + tile.value, 0),
    survivor: { x: snapshot[snapshot.length - 1].x, y: snapshot[snapshot.length - 1].y },
    chain: snapshot,
  };
}

function prefixState(candidate, recording, prefixLength) {
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < prefixLength; index++) {
    advance(state, rng, recording.chains[index].tiles);
  }
  return { state, rng };
}

function stateStatus(state) {
  if (checkBombs(state)) return { status: 'loss', reason: 'bomb' };
  if (state.score >= state.targetScore) return { status: 'win', reason: 'target' };
  if (state.moves >= state.maxMoves) return { status: 'loss', reason: 'move-budget' };
  return { status: 'active', reason: 'continuing' };
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

function boardInventory(state) {
  const scale = state.tileScale || 1;
  const inventory = {
    playableTiles: 0,
    mergeableTiles: 0,
    mergeableValue: 0,
    offLatticeTiles: 0,
    offLatticeValue: 0,
    maximumTile: 0,
    normalizedHistogram: {},
  };
  for (const row of state.grid) {
    for (const tile of row) {
      if (!tile || isBlockedTile(tile)) continue;
      const normalized = tile.value / scale;
      inventory.playableTiles += 1;
      inventory.maximumTile = Math.max(inventory.maximumTile, normalized);
      inventory.normalizedHistogram[normalized] = (inventory.normalizedHistogram[normalized] || 0) + 1;
      if (isMergeableSum(tile.value, scale)) {
        inventory.mergeableTiles += 1;
        inventory.mergeableValue += normalized;
      } else {
        inventory.offLatticeTiles += 1;
        inventory.offLatticeValue += normalized;
      }
    }
  }
  return inventory;
}

function summarizeAnalysis(analysis) {
  if (!analysis.selectedChain) {
    return {
      reason: analysis.reason,
      poolType: analysis.poolType,
      championCandidateCount: analysis.candidates.length,
      selected: null,
    };
  }
  const selected = analysis.candidates.find(({ id }) => id === analysis.selectedId);
  if (!selected) throw new Error(`selected candidate ${analysis.selectedId} missing from analysis`);
  return {
    reason: analysis.reason,
    poolType: analysis.poolType,
    championCandidateCount: analysis.candidates.length,
    selected: {
      chainLength: selected.chainLength,
      chainSum: selected.chainSum,
      immediatePoints: selected.immediatePoints,
      twoMovePoints: selected.twoMovePoints,
      policyScore: selected.policyScore,
      raw: selected.raw,
      chain: selected.chain,
    },
  };
}

function inspectState(state) {
  const terminal = stateStatus(state);
  const grid = state.grid.map((row) => row.map((tile) => {
    if (!tile) return null;
    if (tile.blocker === 'stone') return 'stone';
    return tile.value / (state.tileScale || 1);
  }));
  const snapshot = {
    stateIdentity: stateIdentity(state),
    status: terminal.status,
    reason: terminal.reason,
    moves: state.moves,
    score: state.score,
    targetGap: Math.max(0, state.targetScore - state.score),
    diagnostics: stateDiagnostics(state),
    inventory: boardInventory(state),
    grid,
    nextChampionDecision: null,
  };
  if (terminal.status === 'active') {
    const analysis = analyzeMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
    });
    snapshot.nextChampionDecision = summarizeAnalysis(analysis);
  }
  return snapshot;
}

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  if (!analysis.selectedChain) return { analysis, claims: null };
  return { analysis, claims: analysis.selectedChain };
}

function traceArm(candidate, recording, decisionIndex, arm) {
  const { state, rng } = prefixState(candidate, recording, decisionIndex);
  const before = inspectState(state);
  let claims;
  let decisionAnalysis;
  if (arm === 'owner') {
    claims = recording.chains[decisionIndex].tiles;
    decisionAnalysis = selectedChampionClaims(state).analysis;
  } else {
    const selected = selectedChampionClaims(state);
    if (!selected.claims) throw new Error(`champion has no move at decision ${decisionIndex + 1}`);
    claims = selected.claims;
    decisionAnalysis = selected.analysis;
  }

  const candidateChoice = advance(state, rng, claims);
  const timeline = [{
    continuationMoves: 0,
    choice: candidateChoice,
    state: inspectState(state),
  }];

  let continuationMoves = 0;
  while (stateStatus(state).status === 'active') {
    const selected = selectedChampionClaims(state);
    if (!selected.claims) break;
    const choice = advance(state, rng, selected.claims);
    continuationMoves += 1;
    timeline.push({ continuationMoves, choice, state: inspectState(state) });
  }

  const shortEntry = timeline.find(({ continuationMoves: count, state: snapshot }) => (
    count === SHORT_HORIZON || snapshot.status !== 'active'
  ));
  if (!shortEntry) throw new Error(`arm ${arm} at move ${decisionIndex + 1} did not reach short horizon`);
  const terminal = timeline[timeline.length - 1].state;
  const short = {
    status: shortEntry.state.status,
    reason: shortEntry.state.reason === 'continuing' ? 'horizon' : shortEntry.state.reason,
    continuationMoves: shortEntry.continuationMoves,
    finalScore: shortEntry.state.score,
    targetGap: shortEntry.state.targetGap,
    cost: sequenceCostFromOutcome({
      status: shortEntry.state.status,
      continuationMoves: shortEntry.continuationMoves,
      score: shortEntry.state.score,
      targetScore: state.targetScore,
    }),
  };
  const targetCost = terminal.status === 'win' ? terminal.moves : state.maxMoves + 1;
  return {
    arm,
    before,
    championAlternativeAtDecision: summarizeAnalysis(decisionAnalysis),
    candidateChoice,
    short,
    terminal: {
      status: terminal.status,
      reason: terminal.reason,
      moves: terminal.moves,
      score: terminal.score,
      targetCost,
    },
    timeline,
  };
}

function firstGapOrderCorrection(expectedLabel, owner, champion) {
  const ownerByContinuation = new Map(owner.timeline.map((entry) => [entry.continuationMoves, entry]));
  const championByContinuation = new Map(champion.timeline.map((entry) => [entry.continuationMoves, entry]));
  const maximumShared = Math.min(
    owner.timeline[owner.timeline.length - 1].continuationMoves,
    champion.timeline[champion.timeline.length - 1].continuationMoves,
  );
  for (let continuation = SHORT_HORIZON + 1; continuation <= maximumShared; continuation++) {
    const ownerState = ownerByContinuation.get(continuation).state;
    const championState = championByContinuation.get(continuation).state;
    const corrected = expectedLabel === 'helpful'
      ? ownerState.targetGap < championState.targetGap
      : ownerState.targetGap >= championState.targetGap;
    if (corrected) {
      return {
        continuationMoves: continuation,
        ownerTargetGap: ownerState.targetGap,
        championTargetGap: championState.targetGap,
        ownerStatus: ownerState.status,
        championStatus: championState.status,
      };
    }
  }
  return null;
}

function collectDiagnosis({ manifestPath, qualificationPath }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest);
  const qualification = JSON.parse(fs.readFileSync(qualificationPath, 'utf8'));
  if (!verifyArtifactIdentity(qualification)) throw new Error('LC-0003 raw artifact identity mismatch');
  if (qualification.manifestIdentity !== manifest.artifactIdentity) {
    throw new Error('LC-0003 raw artifact does not name the supplied manifest');
  }
  const verdict = qualify(qualification);
  if (verdict.qualification !== 'FAIL') {
    throw new Error(`expected frozen LC-0003 FAIL, observed ${verdict.qualification}`);
  }
  const failedMoves = verdict.failures.map(({ move }) => move);
  if (JSON.stringify(failedMoves) !== JSON.stringify(MISS_MOVES)) {
    throw new Error(`LC-0003 miss set drifted: ${failedMoves.join(',')}`);
  }

  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');
  const candidate = resolved.candidate;

  const misses = MISS_MOVES.map((move) => {
    const decisionIndex = move - 1;
    const frozenCell = qualification.panel.cells.find((cell) => cell.move === move);
    const owner = traceArm(candidate, recording, decisionIndex, 'owner');
    const champion = traceArm(candidate, recording, decisionIndex, 'champion');
    if (owner.before.stateIdentity !== champion.before.stateIdentity) {
      throw new Error(`move ${move} arms do not share an exact decision state`);
    }
    if (owner.short.cost !== frozenCell.arms.owner.sequence.cost
      || champion.short.cost !== frozenCell.arms.champion.sequence.cost) {
      throw new Error(`move ${move} short-horizon reproduction mismatch`);
    }
    if (owner.terminal.targetCost !== frozenCell.takeoverAfter.targetCost
      || champion.terminal.targetCost !== frozenCell.takeoverBefore.targetCost) {
      throw new Error(`move ${move} full-takeover reproduction mismatch`);
    }
    return {
      move,
      expectedLabel: frozenCell.expectedLabel,
      takeoverGain: frozenCell.takeoverGain,
      firstGapOrderCorrection: firstGapOrderCorrection(frozenCell.expectedLabel, owner, champion),
      arms: { owner, champion },
    };
  });

  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0003-four-miss-diagnostic',
    sources: {
      manifestArtifactIdentity: manifest.artifactIdentity,
      qualificationArtifactIdentity: qualification.artifactIdentity,
      qualificationFileSha256: sha256File(qualificationPath),
      diagnosticScriptSha256: sha256File(__filename),
      identities: manifest.identities,
    },
    bounds: {
      moves: MISS_MOVES,
      shortHorizon: SHORT_HORIZON,
      continuation: 'unchanged champion until target or terminal state',
      purpose: 'diagnostic only; no candidate measure or adoption claim',
    },
    misses,
  });
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) throw new Error(`--${name} is required`);
  return process.argv[index + 1];
}

function main() {
  const out = path.resolve(arg('out'));
  const artifact = collectDiagnosis({
    manifestPath: path.resolve(arg('manifest')),
    qualificationPath: path.resolve(arg('qualification')),
  });
  writeJsonOnce(out, artifact);
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    output: path.relative(ROOT, out),
    moves: artifact.misses.map(({ move, firstGapOrderCorrection: correction }) => ({ move, correction })),
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
  MISS_MOVES,
  SHORT_HORIZON,
  artifactWithIdentity,
  collectDiagnosis,
  firstGapOrderCorrection,
  stateIdentity,
};
