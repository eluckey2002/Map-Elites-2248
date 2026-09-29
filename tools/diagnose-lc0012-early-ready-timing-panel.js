#!/usr/bin/env node
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
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
const { analyzeMove } = require('../solver/bot');
const { classifyTerminal } = require('../solver/benchmark-replay');
const { replay } = require('../solver/recording-replay');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { LOOKAHEAD_BASE } = require('../solver/sequence-value-probe');
const { artifactWithIdentity, verifyArtifactIdentity } = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const EXPECTED_SOURCE_MANIFEST = 'adbd7ff672af65e0b9980d28327c8c6d8bcf42374c063299132a0bf0e1f64e55';
const EXPECTED_SOURCE_EXTENSION = '1baceda14832332c263c8af2b09fc25847e79079ce2204d31a23c3badfb82608';
const EXPECTED_LC0011_RAW_IDENTITY = 'e50f53500b527c20af6d0d670e7f827b23b4b7ed3a9caac63f068bb052381f3c';
const LC0011_COMMON_IDENTITY = 'd6bf03cee41bd1539b167c8de37ea7b87e269f4fef473c3bf3144e74fc416dff';

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function snapshotTile(tile) {
  return {
    x: tile.x, y: tile.y, value: tile.value,
    blocker: tile.blocker || null,
    blockerDuration: tile.blockerDuration || 0,
    bombTimer: tile.bombTimer || 0,
  };
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
    if (tile.value !== value) throw new Error(`chain value mismatch at ${x},${y}: expected ${value}, observed ${tile.value}`);
    return tile;
  });
}

function createTracker(state) {
  const tracker = { tileNodes: new WeakMap(), nextRoot: 1, nextMerge: 1 };
  registerNewTiles(tracker, state);
  return tracker;
}

function registerNewTiles(tracker, state) {
  const ordered = allTiles(state).sort((a, b) => (a.y - b.y) || (a.x - b.x));
  for (const tile of ordered) {
    if (tracker.tileNodes.has(tile)) continue;
    tracker.tileNodes.set(tile, `R${String(tracker.nextRoot++).padStart(4, '0')}`);
  }
}

function liveById(state, tracker) {
  const entries = allTiles(state).map((tile) => {
    const id = tracker.tileNodes.get(tile);
    if (!id) throw new Error(`untracked live tile at ${tile.x},${tile.y}`);
    return [id, snapshotTile(tile)];
  }).sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

function snapshotState(state, tracker) {
  return {
    stateIdentity: stateIdentity(state),
    score: state.score,
    moves: state.moves,
    maxMoves: state.maxMoves,
    targetScore: state.targetScore,
    minChain: state.minChain,
    liveById: liveById(state, tracker),
  };
}

function executeTracked(tracker, state, chain, rng) {
  const inputNodeIds = chain.map((tile) => {
    const id = tracker.tileNodes.get(tile);
    if (!id) throw new Error(`executed untracked tile at ${tile.x},${tile.y}`);
    return id;
  });
  const finalTile = chain.at(-1);
  const points = executeChain(state, chain);
  const outputNodeId = `M${String(tracker.nextMerge++).padStart(4, '0')}`;
  tracker.tileNodes.set(finalTile, outputNodeId);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  registerNewTiles(tracker, state);
  return { inputNodeIds, outputNodeId, points };
}

function routeAssessment(preState, routeNodeIds) {
  const missingRouteNodeIds = routeNodeIds.filter((id) => !preState.liveById[id]);
  const claims = routeNodeIds.filter((id) => preState.liveById[id]).map((id) => preState.liveById[id]);
  const duplicateIds = routeNodeIds.length !== new Set(routeNodeIds).size;
  const duplicateCoordinates = claims.length !== new Set(claims.map(({ x, y }) => `${x},${y}`)).size;
  const blocked = claims.filter(isBlockedTile).map(({ x, y }) => `${x},${y}`);
  const adjacencyProblems = [];
  const valueProblems = [];
  for (let index = 1; index < claims.length; index += 1) {
    const left = claims[index - 1];
    const right = claims[index];
    const dx = Math.abs(left.x - right.x);
    const dy = Math.abs(left.y - right.y);
    if ((dx === 0 && dy === 0) || dx > 1 || dy > 1) adjacencyProblems.push({ index, left: compactTile(left), right: compactTile(right) });
    if (!canExtendChain(claims.slice(0, index), right)) valueProblems.push({ index, leftValue: left.value, rightValue: right.value });
  }
  const complete = missingRouteNodeIds.length === 0 && claims.length === routeNodeIds.length;
  const engineValid = complete && isValidChain(claims, preState.minChain);
  const routeExecutable = complete && !duplicateIds && !duplicateCoordinates && blocked.length === 0
    && adjacencyProblems.length === 0 && valueProblems.length === 0 && engineValid;
  return {
    routeExecutable,
    missingRouteNodeIds,
    duplicateIds,
    duplicateCoordinates,
    blocked,
    adjacencyProblems,
    valueProblems,
    engineValid,
    chain: claims.map(compactTile),
    points: routeExecutable ? Math.floor(chainValue(claims) * chainMultiplier(claims.length)) : null,
  };
}

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves) });
  if (!analysis.selectedChain) throw new Error(`champion returned no chain at move ${state.moves + 1}`);
  return analysis.selectedChain.map(compactTile);
}

function analyzeRecording(recordingPath, expectedHash) {
  if (sha256File(recordingPath) !== expectedHash) throw new Error(`recording identity mismatch: ${path.relative(ROOT, recordingPath)}`);
  const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error(`recording does not resolve: ${path.relative(ROOT, recordingPath)}`);
  const replayed = replay(resolved.candidate, recording);
  if (replayed.problems.length) throw new Error(`recording replay failed: ${path.basename(recordingPath)}: ${replayed.problems.join('; ')}`);
  if (!Array.isArray(recording.chains) || recording.chains.length !== recording.movesUsed) throw new Error(`recording move count mismatch: ${path.basename(recordingPath)}`);

  const rng = makeRng(recording.seed);
  const state = createLevelState(resolved.candidate, rng);
  const tracker = createTracker(state);
  const preStates = [];
  const moves = [];
  for (let index = 0; index < recording.chains.length; index += 1) {
    const beforeTerminal = classifyTerminal(state);
    if (beforeTerminal) throw new Error(`recording continued after terminal before move ${index + 1}: ${path.basename(recordingPath)}`);
    preStates.push(snapshotState(state, tracker));
    const claims = recording.chains[index].tiles.map(compactTile);
    const chain = liveChain(state, claims);
    const tracked = executeTracked(tracker, state, chain, rng);
    if (tracked.points !== recording.chains[index].points) throw new Error(`recorded points drift at move ${index + 1}`);
    const terminal = classifyTerminal(state);
    if (terminal && index !== recording.chains.length - 1) throw new Error(`recording has post-terminal move after ${index + 1}: ${path.basename(recordingPath)}`);
    moves.push({
      move: index + 1,
      chain: claims,
      points: tracked.points,
      inputNodeIds: tracked.inputNodeIds,
      outputNodeId: tracked.outputNodeId,
      postStateIdentity: stateIdentity(state),
      terminal,
    });
  }
  const finalTerminal = classifyTerminal(state);
  if (!finalTerminal || finalTerminal.outcome !== recording.outcome || finalTerminal.reason !== recording.reason) throw new Error(`recording terminal mismatch: ${path.basename(recordingPath)}`);
  if (state.score !== recording.score || state.moves !== recording.movesUsed) throw new Error(`recording final state mismatch: ${path.basename(recordingPath)}`);

  const candidates = [];
  for (let readyIndex = 0; readyIndex < moves.length; readyIndex += 1) {
    for (let cashIndex = readyIndex + 1; cashIndex < moves.length; cashIndex += 1) {
      const routeNodeIds = moves[cashIndex].inputNodeIds;
      const readiness = [];
      for (let index = readyIndex; index <= cashIndex; index += 1) {
        readiness.push({ move: index + 1, ...routeAssessment(preStates[index], routeNodeIds) });
      }
      if (!readiness.every(({ routeExecutable }) => routeExecutable)) continue;
      if (readiness[0].points !== moves[cashIndex].points) throw new Error(`early-ready route points drift at moves ${readyIndex + 1}/${cashIndex + 1}`);
      const routeIdentity = sha256Bytes(JSON.stringify(routeNodeIds));
      candidates.push({
        key: `${readyIndex + 1}:${cashIndex + 1}:${routeIdentity}`,
        readyMove: readyIndex + 1,
        cashoutMove: cashIndex + 1,
        waitLength: cashIndex - readyIndex,
        routeNodeIds,
        routeIdentity,
        commonStateIdentity: preStates[readyIndex].stateIdentity,
        commonScore: preStates[readyIndex].score,
        commonMoves: preStates[readyIndex].moves,
        maxMoves: preStates[readyIndex].maxMoves,
        targetScore: preStates[readyIndex].targetScore,
        routeAtReadiness: readiness[0].chain,
        routePointsAtReadiness: readiness[0].points,
        recordedCashoutPoints: moves[cashIndex].points,
        observedPackage: moves.slice(readyIndex, cashIndex + 1).map(({ move, chain, points }) => ({ move, chain, points })),
        readiness,
      });
    }
  }
  const selected = selectOneCandidate(candidates);
  const candidatesWithDisposition = candidates.map((candidate) => ({
    ...candidate,
    selectionDisposition: selected && candidate.key === selected.key ? 'SELECTED' : 'ELIGIBLE_NOT_SELECTED',
  }));
  const selectedWithDisposition = selected
    ? candidatesWithDisposition.find(({ key }) => key === selected.key)
    : null;
  return {
    recordingPath: path.relative(ROOT, recordingPath),
    recordingIdentity: expectedHash,
    level: recording.candidateLevel,
    seed: recording.seed,
    recordedOutcome: recording.outcome,
    recordedMoves: recording.movesUsed,
    replayStatus: 'PASS',
    candidateCount: candidates.length,
    candidates: candidatesWithDisposition,
    selectedKey: selectedWithDisposition ? selectedWithDisposition.key : null,
    selected: selectedWithDisposition,
    ineligibleReason: selectedWithDisposition ? null : 'no future recorded chain stayed live and legal before an earlier different move',
  };
}

function selectOneCandidate(candidates) {
  if (!candidates.length) return null;
  return candidates.slice().sort((left, right) => left.readyMove - right.readyMove
    || left.cashoutMove - right.cashoutMove
    || left.routeIdentity.localeCompare(right.routeIdentity))[0];
}

function loadSourceSet(paths) {
  const sourceManifest = JSON.parse(fs.readFileSync(paths.sourceManifest, 'utf8'));
  const sourceExtension = JSON.parse(fs.readFileSync(paths.sourceExtension, 'utf8'));
  if (sha256File(paths.sourceManifest) !== EXPECTED_SOURCE_MANIFEST) throw new Error('source manifest external identity mismatch');
  if (sha256File(paths.sourceExtension) !== EXPECTED_SOURCE_EXTENSION) throw new Error('source extension external identity mismatch');
  if (sourceExtension.baseManifest.sha256 !== EXPECTED_SOURCE_MANIFEST) throw new Error('source extension base identity mismatch');
  for (const group of [sourceManifest.recordings, sourceManifest.production, sourceManifest.antecedent, sourceExtension.positiveControl]) {
    for (const [relative, identity] of Object.entries(group)) {
      if (sha256File(path.join(ROOT, relative)) !== identity) throw new Error(`frozen source mismatch: ${relative}`);
    }
  }
  return { sourceManifest, sourceExtension };
}

function collectEligibility(paths) {
  const { sourceManifest } = loadSourceSet(paths);
  const rows = Object.entries(sourceManifest.recordings).sort(([left], [right]) => left.localeCompare(right))
    .map(([relative, identity]) => analyzeRecording(path.join(ROOT, relative), identity));
  if (rows.length !== sourceManifest.recordingCount) throw new Error('source denominator mismatch');
  return {
    sourceCount: rows.length,
    selectedCount: rows.filter(({ selected }) => selected).length,
    selectedLevelCount: new Set(rows.filter(({ selected }) => selected).map(({ level }) => level)).size,
    rows,
  };
}

function reconstructCommon(row) {
  if (!row.selected) throw new Error('cannot reconstruct an unselected row');
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, row.recordingPath), 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('selected recording no longer resolves');
  const rng = makeRng(recording.seed);
  const state = createLevelState(resolved.candidate, rng);
  const tracker = createTracker(state);
  for (let index = 0; index < row.selected.readyMove - 1; index += 1) {
    const chain = liveChain(state, recording.chains[index].tiles);
    const event = executeTracked(tracker, state, chain, rng);
    if (event.points !== recording.chains[index].points) throw new Error(`common replay drift at move ${index + 1}`);
  }
  if (stateIdentity(state) !== row.selected.commonStateIdentity) throw new Error('selected common-state identity mismatch');
  const currentById = new Map(allTiles(state).map((tile) => [tracker.tileNodes.get(tile), tile]));
  const route = row.selected.routeNodeIds.map((id) => currentById.get(id));
  if (route.some((tile) => !tile)) throw new Error('selected ready route lost an input');
  if (JSON.stringify(route.map(compactTile)) !== JSON.stringify(row.selected.routeAtReadiness)) throw new Error('selected ready route drifted');
  return { recording, state, rng, routeClaims: route.map(compactTile) };
}

function countedRng(base) {
  let calls = 0;
  const rng = () => { calls += 1; return base(); };
  rng.calls = () => calls;
  return rng;
}

function applyAction(state, rng, claims, source) {
  const beforeCalls = rng.calls();
  const chain = liveChain(state, claims);
  const preStateIdentity = stateIdentity(state);
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return {
    source, chain: claims, points, score: state.score, moves: state.moves,
    preStateIdentity, postStateIdentity: stateIdentity(state),
    refillRngCalls: rng.calls() - beforeCalls,
    terminal: classifyTerminal(state),
  };
}

function runArm(row, arm) {
  if (!['OBSERVED_WAIT', 'CASH_NOW'].includes(arm)) throw new Error(`unknown arm ${arm}`);
  const common = reconstructCommon(row);
  const rng = countedRng(common.rng);
  const start = {
    stateIdentity: stateIdentity(common.state), score: common.state.score, moves: common.state.moves,
    maxMoves: common.state.maxMoves, targetScore: common.state.targetScore,
  };
  const trace = [];
  if (arm === 'OBSERVED_WAIT') {
    for (const action of row.selected.observedPackage) {
      const event = applyAction(common.state, rng, action.chain, action.move === row.selected.cashoutMove ? 'recorded-cashout' : 'recorded-wait');
      if (event.points !== action.points) throw new Error(`observed package points drift at move ${action.move}`);
      trace.push(event);
      if (event.terminal) break;
    }
  } else {
    trace.push(applyAction(common.state, rng, common.routeClaims, 'frozen-ready-route'));
  }
  while (!trace.at(-1).terminal) {
    if (common.state.moves >= common.state.maxMoves) throw new Error(`${arm} exceeded remaining move budget`);
    const claims = selectedChampionClaims(common.state);
    trace.push(applyAction(common.state, rng, claims, 'champion'));
  }
  const terminal = trace.at(-1).terminal;
  return {
    arm,
    start,
    firstActionIdentity: sha256Bytes(JSON.stringify(trace[0].chain)),
    trace,
    terminal,
    reachedTarget: terminal.outcome === 'win',
    firstTargetCrossing: terminal.outcome === 'win' ? terminal.firstCrossing : null,
    movesToTarget: terminal.outcome === 'win' ? terminal.firstCrossing - start.moves : null,
  };
}

function validateArmRecord(record, row) {
  if (!row.selected) throw new Error('arm has no selected unit');
  if (record.start.stateIdentity !== row.selected.commonStateIdentity
    || record.start.score !== row.selected.commonScore || record.start.moves !== row.selected.commonMoves
    || record.start.maxMoves !== row.selected.maxMoves || record.start.targetScore !== row.selected.targetScore) throw new Error(`${record.arm} common-state mismatch`);
  if (!Array.isArray(record.trace) || !record.trace.length) throw new Error(`${record.arm} trace missing`);
  const expectedFirst = record.arm === 'OBSERVED_WAIT' ? row.selected.observedPackage[0].chain : row.selected.routeAtReadiness;
  if (JSON.stringify(record.trace[0].chain) !== JSON.stringify(expectedFirst)) throw new Error(`${record.arm} first-action/arm mismatch`);
  if (record.firstActionIdentity !== sha256Bytes(JSON.stringify(expectedFirst))) throw new Error(`${record.arm} first-action identity mismatch`);
  if (record.arm === 'OBSERVED_WAIT') {
    if (record.trace.length < row.selected.observedPackage.length) throw new Error('OBSERVED_WAIT package incomplete');
    const observed = record.trace.slice(0, row.selected.observedPackage.length);
    for (let index = 0; index < observed.length; index += 1) {
      if (JSON.stringify(observed[index].chain) !== JSON.stringify(row.selected.observedPackage[index].chain)) throw new Error('OBSERVED_WAIT package mismatch');
    }
  }
  let terminalSeen = false;
  for (let index = 0; index < record.trace.length; index += 1) {
    const event = record.trace[index];
    if (terminalSeen) throw new Error(`${record.arm} continued after target or terminal`);
    if (event.moves !== record.start.moves + index + 1) throw new Error(`${record.arm} move sequence mismatch`);
    if (event.terminal) terminalSeen = true;
  }
  if (!terminalSeen || JSON.stringify(record.terminal) !== JSON.stringify(record.trace.at(-1).terminal)) throw new Error(`${record.arm} terminal trace incomplete`);
  const reached = record.terminal.outcome === 'win';
  if (record.reachedTarget !== reached) throw new Error(`${record.arm} reached-target mismatch`);
  const crossing = reached ? record.terminal.firstCrossing : null;
  if (record.firstTargetCrossing !== crossing || record.movesToTarget !== (reached ? crossing - record.start.moves : null)) throw new Error(`${record.arm} target-cost mismatch`);
  return true;
}

function classifyPair(wait, cash) {
  if (wait.reachedTarget && !cash.reachedTarget) return 'OBSERVED_WAIT_ONLY_WIN';
  if (!wait.reachedTarget && cash.reachedTarget) return 'CASH_NOW_ONLY_WIN';
  if (!wait.reachedTarget && !cash.reachedTarget) return 'NEITHER_WINS';
  if (wait.movesToTarget < cash.movesToTarget) return 'OBSERVED_WAIT_FASTER';
  if (cash.movesToTarget < wait.movesToTarget) return 'CASH_NOW_FASTER';
  return 'TARGET_COST_TIE';
}

function panelDisposition(eligibility, pairs) {
  if (eligibility.selectedCount < 4 || eligibility.selectedLevelCount < 3) return 'INSUFFICIENT_PANEL';
  const classes = pairs.map(({ pairClass }) => pairClass);
  const harmful = classes.some((value) => ['OBSERVED_WAIT_ONLY_WIN', 'OBSERVED_WAIT_FASTER'].includes(value));
  const helpful = classes.some((value) => ['CASH_NOW_ONLY_WIN', 'CASH_NOW_FASTER'].includes(value));
  if (harmful && helpful) return 'MIXED_TARGET_EFFECT';
  if (harmful) return 'WAIT_HAS_TARGET_VALUE';
  if (helpful) return 'CASH_NOW_TARGET_SUPPORTED';
  if (classes.every((value) => value === 'TARGET_COST_TIE')) return 'TARGET_COST_TIE_PANEL';
  return 'NO_TARGET_RESOLUTION';
}

function validatePanelArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') throw new Error('raw artifact incomplete');
  if (!artifact.eligibility || artifact.eligibility.sourceCount !== 24 || artifact.eligibility.rows.length !== 24) throw new Error('eligibility denominator mismatch');
  if (artifact.pairs.length !== artifact.eligibility.selectedCount) throw new Error('pair completeness mismatch');
  if (new Set(artifact.pairs.map(({ recordingPath }) => recordingPath)).size !== artifact.pairs.length) throw new Error('duplicate recording pair');
  const rowByPath = new Map(artifact.eligibility.rows.map((row) => [row.recordingPath, row]));
  for (const pair of artifact.pairs) {
    const row = rowByPath.get(pair.recordingPath);
    if (!row || !row.selected) throw new Error('pair does not map to selected row');
    validateArmRecord(pair.arms.OBSERVED_WAIT, row);
    validateArmRecord(pair.arms.CASH_NOW, row);
    if (pair.pairClass !== classifyPair(pair.arms.OBSERVED_WAIT, pair.arms.CASH_NOW)) throw new Error('pair classification mismatch');
  }
  if (artifact.disposition !== panelDisposition(artifact.eligibility, artifact.pairs)) throw new Error('panel disposition mismatch');
  return true;
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const eligibility = collectEligibility(paths);
  const pairs = eligibility.rows.filter(({ selected }) => selected).map((row) => {
    const wait = runArm(row, 'OBSERVED_WAIT');
    const cash = runArm(row, 'CASH_NOW');
    return {
      recordingPath: row.recordingPath,
      level: row.level,
      seed: row.seed,
      selectedKey: row.selectedKey,
      arms: { OBSERVED_WAIT: wait, CASH_NOW: cash },
      pairClass: classifyPair(wait, cash),
      pairedEffectCashMinusWait: wait.reachedTarget && cash.reachedTarget ? cash.movesToTarget - wait.movesToTarget : null,
    };
  });
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0012-early-ready-timing-panel-raw',
    status: 'COMPLETE',
    finalSubjectIdentity: manifest.artifactIdentity,
    eligibility,
    pairs,
    disposition: panelDisposition(eligibility, pairs),
  });
}

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') return { artifactIdentity: artifact.artifactIdentity, status: artifact.status };
  validatePanelArtifact(artifact);
  const classes = Object.fromEntries(['OBSERVED_WAIT_ONLY_WIN', 'CASH_NOW_ONLY_WIN', 'OBSERVED_WAIT_FASTER', 'CASH_NOW_FASTER', 'TARGET_COST_TIE', 'NEITHER_WINS'].map((name) => [name, artifact.pairs.filter(({ pairClass }) => pairClass === name).length]));
  const effects = artifact.pairs.map(({ pairedEffectCashMinusWait }) => pairedEffectCashMinusWait).filter((value) => value !== null);
  return {
    artifactIdentity: artifact.artifactIdentity,
    status: artifact.status,
    disposition: artifact.disposition,
    sourceCount: artifact.eligibility.sourceCount,
    selectedCount: artifact.eligibility.selectedCount,
    selectedLevelCount: artifact.eligibility.selectedLevelCount,
    pairClasses: classes,
    mutualWinEffect: {
      count: effects.length,
      meanCashMinusWait: effects.length ? effects.reduce((sum, value) => sum + value, 0) / effects.length : null,
      medianCashMinusWait: median(effects),
      conditionalUncertainty: 0,
      populationInference: false,
    },
    pairs: artifact.pairs.map((pair) => ({
      recordingPath: pair.recordingPath, level: pair.level, seed: pair.seed,
      readyMove: artifact.eligibility.rows.find(({ recordingPath }) => recordingPath === pair.recordingPath).selected.readyMove,
      cashoutMove: artifact.eligibility.rows.find(({ recordingPath }) => recordingPath === pair.recordingPath).selected.cashoutMove,
      pairClass: pair.pairClass,
      pairedEffectCashMinusWait: pair.pairedEffectCashMinusWait,
      observedWait: { outcome: pair.arms.OBSERVED_WAIT.terminal.outcome, movesToTarget: pair.arms.OBSERVED_WAIT.movesToTarget, finalScore: pair.arms.OBSERVED_WAIT.trace.at(-1).score },
      cashNow: { outcome: pair.arms.CASH_NOW.terminal.outcome, movesToTarget: pair.arms.CASH_NOW.movesToTarget, finalScore: pair.arms.CASH_NOW.trace.at(-1).score },
    })),
  };
}

function validateLc0011Anchor(paths) {
  const raw = JSON.parse(fs.readFileSync(paths.lc0011Raw, 'utf8'));
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_LC0011_RAW_IDENTITY) throw new Error('LC-0011 raw identity mismatch');
  const wait = raw.arms.WAIT_ONE;
  const cash = raw.arms.CASH_NOW;
  const route = cash.trace[0].chain;
  const routeAfterWait = wait.trace[1].chain;
  const assessment = routeAssessment({ minChain: 3, liveById: Object.fromEntries(route.map((tile, index) => [`A${index}`, snapshotTile(tile)])) }, route.map((tile, index) => `A${index}`));
  const pass = wait.start.stateIdentity === LC0011_COMMON_IDENTITY
    && cash.start.stateIdentity === LC0011_COMMON_IDENTITY
    && wait.trace[0].points === 3072 && cash.trace[0].points === 56320
    && JSON.stringify(route) === JSON.stringify(routeAfterWait)
    && JSON.stringify(route.map(({ value }) => value)) === JSON.stringify([1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 2048])
    && assessment.routeExecutable && assessment.points === 56320;
  return { pass, raw, assessment };
}

function createManifest({ contractPath }) {
  const sourceManifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-timing-panel-source-manifest.json');
  const sourceExtensionPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-timing-panel-source-extension-v2.json');
  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  const sourceExtension = JSON.parse(fs.readFileSync(sourceExtensionPath, 'utf8'));
  const files = {
    contract: path.resolve(contractPath),
    contractV1: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-contract.md'),
    sourceManifest: sourceManifestPath,
    sourceExtension: sourceExtensionPath,
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0012EarlyReadyTimingPanel.test.js'),
  };
  for (const relative of Object.keys(sourceManifest.recordings)) files[`recording:${relative}`] = path.join(ROOT, relative);
  for (const relative of Object.keys(sourceManifest.production)) files[`production:${relative}`] = path.join(ROOT, relative);
  for (const relative of Object.keys(sourceManifest.antecedent)) files[`antecedent:${relative}`] = path.join(ROOT, relative);
  for (const relative of Object.keys(sourceExtension.positiveControl)) files[`positive:${relative}`] = path.join(ROOT, relative);
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const combinedContract = `${fs.readFileSync(files.contractV1, 'utf8')}\n${fs.readFileSync(files.contract, 'utf8')}`;
  for (const name of ['contractV1', 'sourceManifest', 'sourceExtension']) if (!combinedContract.includes(identities[name])) throw new Error(`protocol does not freeze ${name}`);
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0012-early-ready-timing-panel-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) throw new TypeError('expected manifest identity must be a full SHA-256');
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) throw new Error('expected manifest identity mismatch');
  if (manifest.kind !== 'lc0012-early-ready-timing-panel-manifest') throw new Error('unexpected manifest kind');
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    if (sha256File(file) !== manifest.identities[name]) throw new Error(`${name} identity mismatch`);
    paths[name] = file;
  }
  paths.lc0011Raw = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0011-cashout-timing-raw.json');
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
  const directory = path.dirname(contractPath);
  const cwd = path.resolve(directory, contract.recomputation.cwd);
  const receiptPath = path.join(directory, 'LC-0012-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({ schemaVersion: 1, kind: 'lc0012-early-ready-timing-panel-raw', status: 'SYNTHETIC_QUALIFICATION' });
  try {
    writeJsonOnce(reportableOut, synthetic);
    const [program, ...argv] = contract.recomputation.argv;
    fs.writeFileSync(recomputedOut, execFileSync(program, argv, { cwd }), { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0012-SYNTHETIC-QUALIFICATION', final_subject_identity: manifestIdentity,
      closure_status: 'CLOSED',
      claims: contract.required_claims.map((id) => ({ id, status: 'PASS', evidence_subject_identity: manifestIdentity, reason: 'synthetic closeout-path qualification' })),
      artifacts: [{ id: 'raw', path: path.basename(reportableOut), sha256: sha256File(reportableOut) }, { id: 'primary-recomputation', path: path.basename(recomputedOut), sha256: sha256File(recomputedOut) }],
      primary_outcome: 'SYNTHETIC_CLOSEOUT_PASS', deviations: [],
      attempts: [{ id: 'qualification-1', exit_code: 0, artifact_ids: ['raw', 'primary-recomputation'] }],
    };
    writeJsonOnce(receiptPath, receipt);
    const verifier = path.join(ROOT, 'tools', 'vendor', 'close-experiment', 'verify_closure.py');
    const verdict = JSON.parse(execFileSync('python3', [verifier, contractPath, receiptPath, '--run-recomputation', '--require-closed', '--expected-contract-sha256', expectedContractIdentity], { cwd: ROOT, encoding: 'utf8' }));
    return { pass: verdict.verdict === 'PASS' && verdict.recomputation === 'PASS', verifier, resolvedCwd: cwd, verdict };
  } finally {
    for (const file of [receiptPath, recomputedOut, reportableOut]) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function qualifyHarness({ manifestPath, expectedManifestIdentity, closeoutContract, expectedCloseoutIdentity, reportableOut, recomputedOut }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).filter(([name]) => name !== 'lc0011Raw').map(([name, file]) => [name, committedFileMatches(file)]));
  const eligibility = collectEligibility(paths);
  const anchor = validateLc0011Anchor(paths);
  const anchorRepeat = validateLc0011Anchor(paths);
  const anchorByteMatched = JSON.stringify(anchor) === JSON.stringify(anchorRepeat);
  const harnessIdentityBefore = sha256File(paths.harness);
  const routeIds = anchor.raw.arms.CASH_NOW.trace[0].chain.map((tile, index) => `A${index}`);
  const liveByIdFixture = Object.fromEntries(anchor.raw.arms.CASH_NOW.trace[0].chain.map((tile, index) => [`A${index}`, snapshotTile(tile)]));
  delete liveByIdFixture.A3;
  const missingMutation = routeAssessment({ minChain: 3, liveById: liveByIdFixture }, routeIds);
  const firstSelected = eligibility.rows.find(({ selected }) => selected);
  let aaPass = true; let aa = null;
  if (firstSelected) {
    const left = runArm(firstSelected, 'OBSERVED_WAIT');
    const right = runArm(firstSelected, 'OBSERVED_WAIT');
    aaPass = JSON.stringify(left) === JSON.stringify(right);
    aa = { recordingPath: firstSelected.recordingPath, left, right };
  }
  const fixtureRow = {
    selected: {
      commonStateIdentity: LC0011_COMMON_IDENTITY,
      commonScore: anchor.raw.arms.WAIT_ONE.start.score,
      commonMoves: anchor.raw.arms.WAIT_ONE.start.moves,
      maxMoves: anchor.raw.arms.WAIT_ONE.start.maxMoves,
      targetScore: anchor.raw.arms.WAIT_ONE.start.targetScore,
      observedPackage: anchor.raw.arms.WAIT_ONE.trace.map((event, index) => ({ move: event.moves, chain: event.chain, points: event.points, index })),
      routeAtReadiness: anchor.raw.arms.CASH_NOW.trace[0].chain,
    },
  };
  const observedFixture = { ...structuredClone(anchor.raw.arms.WAIT_ONE), arm: 'OBSERVED_WAIT' };
  validateArmRecord(observedFixture, fixtureRow);
  const swapped = structuredClone(observedFixture); swapped.arm = 'CASH_NOW';
  let swapKilled = false; let swapMessage = null;
  try { validateArmRecord(swapped, fixtureRow); } catch (error) { swapKilled = /first-action\/arm mismatch/.test(error.message); swapMessage = error.message; }
  const overrun = structuredClone(observedFixture); overrun.trace.push({ ...overrun.trace.at(-1), moves: overrun.trace.at(-1).moves + 1 });
  let overrunKilled = false; let overrunMessage = null;
  try { validateArmRecord(overrun, fixtureRow); } catch (error) { overrunKilled = /continued after target or terminal/.test(error.message); overrunMessage = error.message; }
  const selectorFixture = [
    { key: 'later', readyMove: 3, cashoutMove: 4, routeIdentity: 'a' },
    { key: 'longer', readyMove: 2, cashoutMove: 5, routeIdentity: 'a' },
    { key: 'winner', readyMove: 2, cashoutMove: 4, routeIdentity: 'b' },
    { key: 'lexical', readyMove: 2, cashoutMove: 4, routeIdentity: 'c' },
  ];
  const selectorPass = selectOneCandidate(selectorFixture).key === 'winner';
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0012-persist-'));
  const retained = path.join(directory, 'raw.json');
  const disposable = artifactWithIdentity({ status: 'COMPLETE', planted: true });
  let plantedFailureObserved = false;
  try { persistBeforeVerdict({ file: retained, artifact: disposable, evaluate() { throw new Error('planted interpretation failure'); } }); } catch (error) { plantedFailureObserved = /planted interpretation failure/.test(error.message); }
  const coherent = structuredClone(manifest); coherent.identities['production:solver/engine.js'] = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent; coherent.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentSubstitutionRejected = false;
  try { validateManifest(coherent, expectedManifestIdentity); } catch (error) { coherentSubstitutionRejected = /expected manifest identity mismatch/.test(error.message); }
  const admission = exerciseCloseout({ contractPath: closeoutContract, expectedContractIdentity: expectedCloseoutIdentity, manifestIdentity: manifest.artifactIdentity, reportableOut, recomputedOut });
  const harnessIdentityAfter = sha256File(paths.harness);
  const controls = [
    { id: 'C1-frozen-corpus-ruleset-and-exact-replay', pass: eligibility.sourceCount === 24 && eligibility.rows.every(({ replayStatus }) => replayStatus === 'PASS'), observed: { sourceCount: eligibility.sourceCount, selectedCount: eligibility.selectedCount, selectedLevelCount: eligibility.selectedLevelCount, rows: eligibility.rows.map(({ recordingPath, level, seed, replayStatus, candidateCount, selectedKey }) => ({ recordingPath, level, seed, replayStatus, candidateCount, selectedKey })) } },
    { id: 'C2-exact-state-early-ready-positive-control', pass: anchor.pass, observed: { commonStateIdentity: anchor.raw.arms.WAIT_ONE.start.stateIdentity, values: anchor.assessment.chain.map(({ value }) => value), points: anchor.assessment.points } },
    { id: 'C3-planted-missing-route-input', pass: !missingMutation.routeExecutable && JSON.stringify(missingMutation.missingRouteNodeIds) === JSON.stringify(['A3']), observed: { mutationPresent: true, reachedValidator: true, mutationKilled: !missingMutation.routeExecutable, assessment: missingMutation } },
    { id: 'C4-versioned-control-and-deterministic-aa', pass: anchorByteMatched && aaPass, observed: { lc0011ByteMatched: anchorByteMatched, selectedCorpusUnit: aa } },
    { id: 'C5-assignment-integrity-and-planted-arm-swap', pass: swapKilled, observed: { mutationPresent: true, reachedValidator: true, mutationKilled: swapKilled, message: swapMessage } },
    { id: 'C6-objective-equivalence-and-target-stop-ordering', pass: overrunKilled, observed: { mutationPresent: true, reachedValidator: true, mutationKilled: overrunKilled, message: overrunMessage } },
    { id: 'C7-one-unit-per-recording', pass: selectorPass, observed: { candidateKeys: selectorFixture.map(({ key }) => key), selectedKey: selectOneCandidate(selectorFixture).key } },
    { id: 'C8-restoration-and-persistence-before-verdict', pass: plantedFailureObserved && fs.existsSync(retained) && harnessIdentityBefore === harnessIdentityAfter && harnessIdentityAfter === manifest.identities.harness, observed: { plantedFailureObserved, rawRetained: fs.existsSync(retained), harnessIdentityBefore, harnessIdentityAfter } },
    { id: 'C9-executable-closeout-admission', pass: admission.pass, observed: admission },
  ];
  const pass = Object.values(committed).every(Boolean) && controls.every(({ pass: ok }) => ok)
    && coherentSubstitutionRejected && !fs.existsSync(reportableOut) && !fs.existsSync(recomputedOut);
  return artifactWithIdentity({
    schemaVersion: 1, kind: 'lc0012-harness-qualification', status: pass ? 'PASS' : 'FAIL',
    oracle: path.relative(ROOT, paths.contract), predecessorOracle: path.relative(ROOT, paths.contractV1),
    manifestIdentity: manifest.artifactIdentity, harnessIdentity: manifest.identities.harness,
    attempt: 1, committed, coherentSubstitutionRejected, cashNowCorpusExecuted: false,
    eligibilityKeys: eligibility.rows.map(({ recordingPath, selectedKey }) => ({ recordingPath, selectedKey })),
    controls, uncertainties: [],
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
    const receipt = qualifyHarness({ manifestPath: path.resolve(arg('manifest')), expectedManifestIdentity: arg('expected-manifest-identity'), closeoutContract: path.resolve(arg('closeout-contract')), expectedCloseoutIdentity: arg('expected-closeout-identity'), reportableOut: path.resolve(arg('reportable-out')), recomputedOut: path.resolve(arg('recomputed-out')) });
    writeJsonOnce(path.resolve(qualificationOut), receipt);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    if (receipt.status !== 'PASS') process.exitCode = 1;
    return;
  }
  const artifact = collectFromManifest(path.resolve(arg('manifest')), arg('expected-manifest-identity'));
  const summary = persistBeforeVerdict({ file: path.resolve(arg('out')), artifact, validate: validatePanelArtifact, evaluate: summaryFromArtifact });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = {
  analyzeRecording,
  classifyPair,
  collectEligibility,
  collectFromManifest,
  createManifest,
  panelDisposition,
  qualifyHarness,
  routeAssessment,
  runArm,
  selectOneCandidate,
  summaryFromArtifact,
  validateArmRecord,
  validateManifest,
  validatePanelArtifact,
};
