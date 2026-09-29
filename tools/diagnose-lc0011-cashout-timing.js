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
const { classifyTerminal } = require('../solver/benchmark-replay');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { LOOKAHEAD_BASE } = require('../solver/sequence-value-probe');
const { artifactWithIdentity, verifyArtifactIdentity } = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { createTracker, executeAncestryMerge, registerBoardRoots } = require('./diagnose-lc0008-reversal-ancestry');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const COMMON_IDENTITY = 'd6bf03cee41bd1539b167c8de37ea7b87e269f4fef473c3bf3144e74fc416dff';
const ROUTE_IDS = Object.freeze(['M002', 'P024', 'P028', 'P032', 'P031', 'P030', 'P029', 'P026', 'P021', 'P025']);
const WAIT_FIRST = Object.freeze([
  { x: 1, y: 0, value: 64 }, { x: 0, y: 1, value: 64 },
  { x: 0, y: 0, value: 128 }, { x: 1, y: 1, value: 128 },
  { x: 2, y: 0, value: 128 }, { x: 2, y: 1, value: 128 },
  { x: 1, y: 2, value: 128 }, { x: 0, y: 2, value: 256 },
]);
const CASH_FIRST = Object.freeze([
  { x: 2, y: 4, value: 1024 }, { x: 3, y: 5, value: 1024 },
  { x: 3, y: 6, value: 1024 }, { x: 3, y: 7, value: 1024 },
  { x: 2, y: 7, value: 1024 }, { x: 1, y: 7, value: 1024 },
  { x: 0, y: 7, value: 1024 }, { x: 1, y: 6, value: 1024 },
  { x: 0, y: 5, value: 1024 }, { x: 0, y: 6, value: 2048 },
]);
const SOURCE = Object.freeze({
  lc0010ManifestIdentity: '555093c0bb3f62829abbde1e38a4d953c61aee3dd3969e94e12e33d46f8f2894',
  lc0010QualificationIdentity: '20a87a7d19436983feb07fd3a5422f0d186c4aa67c9061443a8b9f58dd68a124',
  lc0010RawIdentity: '452ba78783b6254110b25b23fdfa180e47062b324973010de18b987e45408a95',
});

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
    if (tile.value !== value) throw new Error(`chain value mismatch at ${x},${y}: expected ${value}, observed ${tile.value}`);
    return tile;
  });
}

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  if (!analysis.selectedChain) throw new Error(`champion returned no chain at move ${state.moves + 1}`);
  return analysis.selectedChain.map(snapshotTile);
}

function prefixState(candidate, recording, prefixLength) {
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < prefixLength; index += 1) {
    executeChain(state, liveChain(state, recording.chains[index].tiles));
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  }
  return { state, rng };
}

function loadSources(paths) {
  const manifest = JSON.parse(fs.readFileSync(paths.lc0010Manifest, 'utf8'));
  const qualification = JSON.parse(fs.readFileSync(paths.lc0010Qualification, 'utf8'));
  const raw = JSON.parse(fs.readFileSync(paths.lc0010Raw, 'utf8'));
  const closure = JSON.parse(fs.readFileSync(paths.lc0010Closure, 'utf8'));
  const lineage = JSON.parse(fs.readFileSync(paths.lc0007Raw, 'utf8'));
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  if (!verifyArtifactIdentity(manifest) || manifest.artifactIdentity !== SOURCE.lc0010ManifestIdentity) throw new Error('LC-0010 manifest identity mismatch');
  if (!verifyArtifactIdentity(qualification) || qualification.artifactIdentity !== SOURCE.lc0010QualificationIdentity || qualification.status !== 'PASS') throw new Error('LC-0010 qualification identity mismatch');
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== SOURCE.lc0010RawIdentity || raw.status !== 'COMPLETE') throw new Error('LC-0010 raw identity mismatch');
  if (closure.closure_status !== 'CLOSED' || closure.primary_outcome !== 'REPAIRED_TIMELINE_CONFIRMED') throw new Error('LC-0010 closure is not the accepted repaired result');
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');
  return { manifest, qualification, raw, closure, lineage, recording, candidate: resolved.candidate };
}

function buildCommonState(paths) {
  const sources = loadSources(paths);
  const sourceCell = sources.raw.cells.find(({ move }) => move === 11);
  const lineageCell = sources.lineage.cells.find(({ move }) => move === 11);
  if (!sourceCell || !lineageCell) throw new Error('move-11 source evidence missing');
  const sourceArm = sourceCell.arms.owner;
  const lineageArm = lineageCell.arms.owner;
  const { state, rng } = prefixState(sources.candidate, sources.recording, 10);
  const preDecisionTiles = new Set(allTiles(state));
  const decisionChain = liveChain(state, lineageArm.decision.chain);
  const decisionSurvivor = decisionChain.at(-1);
  const decisionPoints = executeChain(state, decisionChain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  if (decisionPoints !== 5120 || stateIdentity(state) !== lineageArm.decision.postStateIdentity) throw new Error('move-11 owner decision replay drifted');

  const tracker = createTracker();
  registerBoardRoots(tracker, state, (tile) => {
    if (tile === decisionSurvivor) return { origin: 'decision-survivor' };
    return { origin: preDecisionTiles.has(tile) ? 'carried-board' : 'decision-refill' };
  });
  for (let continuation = 1; continuation <= 2; continuation += 1) {
    const expected = lineageArm.events.find((event) => event.continuationMoves === continuation);
    const selected = selectedChampionClaims(state);
    if (JSON.stringify(selected) !== JSON.stringify(expected.chain)) throw new Error(`continuation ${continuation} champion selection drifted`);
    const event = executeAncestryMerge(tracker, state, liveChain(state, selected), continuation, { rng, refill: true, tick: true });
    if (event.points !== expected.points || stateIdentity(state) !== expected.postStateIdentity) throw new Error(`continuation ${continuation} replay drifted`);
  }

  const graph = sourceArm.timeline.at(-1).readiness.orderedInputIds;
  if (JSON.stringify(graph) !== JSON.stringify(ROUTE_IDS)) throw new Error('correction route ID order drifted');
  const liveById = new Map(allTiles(state).map((tile) => [tracker.tileNodes.get(tile), tile]));
  const route = ROUTE_IDS.map((id) => {
    const tile = liveById.get(id);
    if (!tile) throw new Error(`correction route node ${id} is not live`);
    return tile;
  });
  if (!isValidChain(route, state.minChain)) throw new Error('frozen correction route is not engine-valid');
  if (JSON.stringify(route.map(snapshotTile)) !== JSON.stringify(CASH_FIRST)) throw new Error('frozen correction route coordinates drifted');
  const selected = selectedChampionClaims(state);
  if (JSON.stringify(selected) !== JSON.stringify(WAIT_FIRST)) throw new Error('WAIT_ONE first action drifted');
  if (stateIdentity(state) !== COMMON_IDENTITY || state.score !== 66752 || state.moves !== 13 || state.maxMoves !== 24 || state.targetScore !== 126000) throw new Error('common-state invariant mismatch');
  return { state, rng, routeClaims: route.map(snapshotTile), sources };
}

function countedRng(base) {
  let calls = 0;
  const rng = () => { calls += 1; return base(); };
  rng.calls = () => calls;
  return rng;
}

function applyAction(state, rng, claims, source) {
  const beforeCalls = rng.calls();
  const preStateIdentity = stateIdentity(state);
  const chain = liveChain(state, claims);
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const terminal = classifyTerminal(state);
  return {
    source,
    chain: claims,
    points,
    score: state.score,
    moves: state.moves,
    preStateIdentity,
    postStateIdentity: stateIdentity(state),
    refillRngCalls: rng.calls() - beforeCalls,
    terminal,
  };
}

function runArm(paths, arm) {
  if (!['WAIT_ONE', 'CASH_NOW'].includes(arm)) throw new Error(`unknown arm ${arm}`);
  const common = buildCommonState(paths);
  const rng = countedRng(common.rng);
  const start = {
    stateIdentity: stateIdentity(common.state), score: common.state.score, moves: common.state.moves,
    maxMoves: common.state.maxMoves, targetScore: common.state.targetScore,
  };
  const trace = [];
  let claims = arm === 'WAIT_ONE' ? selectedChampionClaims(common.state) : common.routeClaims;
  let source = arm === 'WAIT_ONE' ? 'champion' : 'frozen-ready-route';
  for (let index = 0; index < 11; index += 1) {
    const event = applyAction(common.state, rng, claims, source);
    trace.push(event);
    if (event.terminal) break;
    claims = selectedChampionClaims(common.state);
    source = 'champion';
  }
  const terminal = trace.at(-1).terminal;
  return {
    arm,
    start,
    firstActionIdentity: sha256Bytes(JSON.stringify(trace[0].chain)),
    trace,
    terminal,
    reachedTarget: terminal && terminal.outcome === 'win',
    firstTargetCrossing: terminal && terminal.outcome === 'win' ? terminal.firstCrossing : null,
    movesToTarget: terminal && terminal.outcome === 'win' ? terminal.firstCrossing - start.moves : null,
  };
}

function expectedFirst(arm) {
  if (arm === 'WAIT_ONE') return { chain: WAIT_FIRST, points: 3072 };
  if (arm === 'CASH_NOW') return { chain: CASH_FIRST, points: 56320 };
  throw new Error(`unknown arm ${arm}`);
}

function validateArmRecord(record) {
  const expected = expectedFirst(record.arm);
  if (record.start.stateIdentity !== COMMON_IDENTITY || record.start.score !== 66752 || record.start.moves !== 13 || record.start.maxMoves !== 24 || record.start.targetScore !== 126000) throw new Error(`${record.arm} common-state mismatch`);
  if (!Array.isArray(record.trace) || record.trace.length < 1 || record.trace.length > 11) throw new Error(`${record.arm} trace length invalid`);
  const first = record.trace[0];
  if (JSON.stringify(first.chain) !== JSON.stringify(expected.chain) || first.points !== expected.points) throw new Error(`${record.arm} first-action/arm mismatch`);
  if (record.firstActionIdentity !== sha256Bytes(JSON.stringify(expected.chain))) throw new Error(`${record.arm} first-action identity mismatch`);
  let seenTerminal = false;
  for (let index = 0; index < record.trace.length; index += 1) {
    const event = record.trace[index];
    if (seenTerminal) throw new Error(`${record.arm} continued after target or terminal`);
    if (event.moves !== 14 + index) throw new Error(`${record.arm} move sequence mismatch`);
    if (event.terminal) seenTerminal = true;
  }
  if (!seenTerminal || !record.terminal || JSON.stringify(record.terminal) !== JSON.stringify(record.trace.at(-1).terminal)) throw new Error(`${record.arm} terminal trace incomplete`);
  const reached = record.terminal.outcome === 'win';
  if (record.reachedTarget !== reached) throw new Error(`${record.arm} reached-target mismatch`);
  const crossing = reached ? record.terminal.firstCrossing : null;
  if (record.firstTargetCrossing !== crossing || record.movesToTarget !== (reached ? crossing - 13 : null)) throw new Error(`${record.arm} target-cost mismatch`);
  return true;
}

function pairDisposition(wait, cash) {
  if (wait.reachedTarget && !cash.reachedTarget) return 'WAIT_ONE_MOVE_BETTER';
  if (!wait.reachedTarget && cash.reachedTarget) return 'CASH_NOW_BETTER';
  if (!wait.reachedTarget && !cash.reachedTarget) return 'NEITHER_WINS';
  if (wait.movesToTarget < cash.movesToTarget) return 'WAIT_ONE_MOVE_BETTER';
  if (cash.movesToTarget < wait.movesToTarget) return 'CASH_NOW_BETTER';
  return 'TARGET_COST_TIE';
}

function validatePairArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') throw new Error('raw artifact is incomplete');
  if (!artifact.arms || !artifact.arms.WAIT_ONE || !artifact.arms.CASH_NOW) throw new Error('paired arms missing');
  validateArmRecord(artifact.arms.WAIT_ONE);
  validateArmRecord(artifact.arms.CASH_NOW);
  if (artifact.disposition !== pairDisposition(artifact.arms.WAIT_ONE, artifact.arms.CASH_NOW)) throw new Error('paired disposition mismatch');
  return true;
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  if (artifact.status !== 'COMPLETE') return { artifactIdentity: artifact.artifactIdentity, status: artifact.status };
  validatePairArtifact(artifact);
  const wait = artifact.arms.WAIT_ONE;
  const cash = artifact.arms.CASH_NOW;
  return {
    artifactIdentity: artifact.artifactIdentity,
    status: artifact.status,
    disposition: artifact.disposition,
    exactEffectCashMinusWaitMoves: wait.reachedTarget && cash.reachedTarget ? cash.movesToTarget - wait.movesToTarget : null,
    conditionalUncertainty: 0,
    populationInference: false,
    arms: Object.fromEntries([wait, cash].map((arm) => [arm.arm, {
      reachedTarget: arm.reachedTarget,
      movesToTarget: arm.movesToTarget,
      firstTargetCrossing: arm.firstTargetCrossing,
      finalScore: arm.trace.at(-1).score,
      terminal: arm.terminal,
      firstActionPoints: arm.trace[0].points,
      traceLength: arm.trace.length,
    }])),
  };
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    lc0010Contract: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-contract.md'),
    lc0010Manifest: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-manifest.json'),
    lc0010Qualification: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-qualification.json'),
    lc0010Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-raw.json'),
    lc0010Result: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-result.md'),
    lc0010Closure: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-closure.json'),
    lc0010Harness: path.join(ROOT, 'tools', 'diagnose-lc0010-route-readiness-repair.js'),
    lc0010RepairTest: path.join(ROOT, 'solver', 'tests', 'lc0010RouteReadinessRepair.test.js'),
    lc0010ResultTest: path.join(ROOT, 'solver', 'tests', 'lc0010Result.test.js'),
    lc0007Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-raw.json'),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0011CashoutTiming.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['lc0010Contract', 'lc0010Manifest', 'lc0010Qualification', 'lc0010Raw', 'lc0010Result', 'lc0010Closure', 'lc0010Harness', 'lc0010RepairTest', 'lc0010ResultTest', 'recording', 'engine', 'bot']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0011-cashout-timing-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) throw new TypeError('expected manifest identity must be a full SHA-256');
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) throw new Error('expected manifest identity mismatch');
  if (manifest.kind !== 'lc0011-cashout-timing-manifest') throw new Error('unexpected manifest kind');
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    if (sha256File(file) !== manifest.identities[name]) throw new Error(`${name} identity mismatch`);
    paths[name] = file;
  }
  return paths;
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const wait = runArm(paths, 'WAIT_ONE');
  const cash = runArm(paths, 'CASH_NOW');
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0011-cashout-timing-raw',
    status: 'COMPLETE',
    finalSubjectIdentity: manifest.artifactIdentity,
    controls: { commonStateMatched: true, sameObjective: true, unchangedSubsequentChampion: true },
    arms: { WAIT_ONE: wait, CASH_NOW: cash },
    disposition: pairDisposition(wait, cash),
  });
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
  const receiptPath = path.join(contractDirectory, 'LC-0011-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({ schemaVersion: 1, kind: 'lc0011-cashout-timing-raw', status: 'SYNTHETIC_QUALIFICATION' });
  try {
    writeJsonOnce(reportableOut, synthetic);
    const [program, ...argv] = contract.recomputation.argv;
    fs.writeFileSync(recomputedOut, execFileSync(program, argv, { cwd: resolvedCwd }), { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0011-SYNTHETIC-QUALIFICATION', final_subject_identity: manifestIdentity,
      closure_status: 'CLOSED',
      claims: contract.required_claims.map((id) => ({ id, status: 'PASS', evidence_subject_identity: manifestIdentity, reason: 'synthetic closeout-path qualification' })),
      artifacts: [{ id: 'raw', path: path.basename(reportableOut), sha256: sha256File(reportableOut) }, { id: 'primary-recomputation', path: path.basename(recomputedOut), sha256: sha256File(recomputedOut) }],
      primary_outcome: 'SYNTHETIC_CLOSEOUT_PASS', deviations: [],
      attempts: [{ id: 'qualification-1', exit_code: 0, artifact_ids: ['raw', 'primary-recomputation'] }],
    };
    writeJsonOnce(receiptPath, receipt);
    const verifier = path.join(ROOT, 'tools', 'vendor', 'close-experiment', 'verify_closure.py');
    const verdict = JSON.parse(execFileSync('python3', [verifier, contractPath, receiptPath, '--run-recomputation', '--require-closed', '--expected-contract-sha256', expectedContractIdentity], { cwd: ROOT, encoding: 'utf8' }));
    return { pass: verdict.verdict === 'PASS' && verdict.recomputation === 'PASS', verifier, resolvedCwd, verdict };
  } finally {
    for (const file of [receiptPath, recomputedOut, reportableOut]) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function qualifyHarness({ manifestPath, expectedManifestIdentity, closeoutContract, expectedCloseoutIdentity, reportableOut, recomputedOut }) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, committedFileMatches(file)]));
  const first = buildCommonState(paths);
  const second = buildCommonState(paths);
  const waitA = runArm(paths, 'WAIT_ONE');
  const waitB = runArm(paths, 'WAIT_ONE');
  const commonPass = stateIdentity(first.state) === COMMON_IDENTITY && stateIdentity(second.state) === COMMON_IDENTITY
    && first.state.score === second.state.score && JSON.stringify(first.routeClaims) === JSON.stringify(CASH_FIRST);
  const aaPass = JSON.stringify(waitA) === JSON.stringify(waitB)
    && JSON.stringify(waitA.trace.map(({ points }) => points).slice(0, 2)) === JSON.stringify([3072, 56320])
    && waitA.firstTargetCrossing === 15 && waitA.trace.length === 2;
  const swapped = structuredClone(waitA);
  swapped.arm = 'CASH_NOW';
  let swapKilled = false; let swapMessage = null;
  try { validateArmRecord(swapped); } catch (error) { swapKilled = /first-action\/arm mismatch/.test(error.message); swapMessage = error.message; }
  const overrun = structuredClone(waitA);
  overrun.trace.push({ ...overrun.trace.at(-1), moves: 16 });
  let overrunKilled = false; let overrunMessage = null;
  try { validateArmRecord(overrun); } catch (error) { overrunKilled = /continued after target or terminal/.test(error.message); overrunMessage = error.message; }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0011-persist-'));
  const retained = path.join(directory, 'raw.json');
  const disposable = artifactWithIdentity({ status: 'COMPLETE', planted: true });
  let plantedFailureObserved = false;
  try { persistBeforeVerdict({ file: retained, artifact: disposable, evaluate() { throw new Error('planted interpretation failure'); } }); } catch (error) { plantedFailureObserved = /planted interpretation failure/.test(error.message); }
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentSubstitutionRejected = false;
  try { validateManifest(coherent, expectedManifestIdentity); } catch (error) { coherentSubstitutionRejected = /expected manifest identity mismatch/.test(error.message); }
  const admission = exerciseCloseout({ contractPath: closeoutContract, expectedContractIdentity: expectedCloseoutIdentity, manifestIdentity: manifest.artifactIdentity, reportableOut, recomputedOut });
  const controls = [
    { id: 'C1-frozen-source-and-common-state-replay', pass: commonPass, observed: { stateIdentity: stateIdentity(first.state), score: first.state.score, moves: first.state.moves, route: first.routeClaims } },
    { id: 'C2-versioned-reference-and-synthetic-aa', pass: aaPass, observed: { traceA: waitA, traceB: waitB, pairedDifference: 0 } },
    { id: 'C3-arm-assignment-and-planted-swap', pass: swapKilled, observed: { mutationPresent: true, reachedValidator: true, mutationKilled: swapKilled, message: swapMessage } },
    { id: 'C4-objective-equivalence', pass: commonPass && first.state.targetScore === 126000 && first.state.maxMoves === 24, observed: { targetScore: first.state.targetScore, maxMoves: first.state.maxMoves, champion: manifest.identities.bot } },
    { id: 'C5-known-target-stop-reference', pass: waitA.reachedTarget && waitA.firstTargetCrossing === 15 && waitA.trace.length === 2, observed: waitA.terminal },
    { id: 'C6-planted-post-target-continuation', pass: overrunKilled, observed: { mutationPresent: true, reachedValidator: true, mutationKilled: overrunKilled, message: overrunMessage } },
    { id: 'C7-restoration-and-raw-persistence', pass: plantedFailureObserved && fs.existsSync(retained), observed: { plantedFailureObserved, rawRetained: fs.existsSync(retained) } },
    { id: 'C8-executable-closeout-admission', pass: admission.pass, observed: admission },
  ];
  const pass = Object.values(committed).every(Boolean) && controls.every(({ pass: ok }) => ok)
    && coherentSubstitutionRejected && !fs.existsSync(reportableOut) && !fs.existsSync(recomputedOut);
  return artifactWithIdentity({
    schemaVersion: 1, kind: 'lc0011-harness-qualification', status: pass ? 'PASS' : 'FAIL',
    oracle: path.relative(ROOT, paths.contract), manifestIdentity: manifest.artifactIdentity,
    harnessIdentity: manifest.identities.harness, attempt: 1, committed, coherentSubstitutionRejected,
    cashNowExecuted: false, controls, uncertainties: [],
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
  const summary = persistBeforeVerdict({ file: path.resolve(arg('out')), artifact, validate: validatePairArtifact, evaluate: summaryFromArtifact });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = {
  buildCommonState,
  collectFromManifest,
  createManifest,
  pairDisposition,
  qualifyHarness,
  runArm,
  summaryFromArtifact,
  validateArmRecord,
  validateManifest,
  validatePairArtifact,
};
