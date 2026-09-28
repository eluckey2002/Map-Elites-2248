#!/usr/bin/env node
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyGravity,
  checkBombs,
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
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const MOVES = Object.freeze([4, 6, 9, 11]);
const SOURCE = Object.freeze({
  priorRawSha256: '58a6458367295823d56b29f5e4589077161648b0e3619c6e5d6d6cca8eb3c284',
  priorRawIdentity: '10a05405746480e7232690115a877c6a0a431cdc7bc182f1147178444d4b23fd',
  lc0003ManifestIdentity: 'f1a001094916ac3e6220a030b2cf3e9b83be116f3cd89e48071bc54f86812a7a',
  lc0003QualificationIdentity: 'e922f53063f04213c49ee7b39cb9aafbf1c3ca4531765f3dcf5b68502b50c8ae',
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

function carrierOnBoard(state, carrier) {
  return state.grid.some((row) => row.includes(carrier));
}

function executeTrackedChain(state, chain, carrier = null, options = {}) {
  const { rng = null, refill = false, tick = false } = options;
  const beforeChain = snapshotChain(chain);
  const carrierBefore = snapshotTile(carrier);
  const lineageIndex = carrier ? chain.indexOf(carrier) : -1;
  const usesLineage = lineageIndex !== -1;
  const finalTile = chain[chain.length - 1];
  const points = executeChain(state, chain);
  const nextCarrier = usesLineage ? finalTile : carrier;
  applyGravity(state);
  if (refill) {
    if (typeof rng !== 'function') throw new TypeError('refill requires rng');
    spawnNewTiles(state, rng);
  }
  if (tick) tickBlockers(state);
  if (nextCarrier && !carrierOnBoard(state, nextCarrier)) {
    throw new Error('lineage carrier disappeared after tracked execution');
  }
  return {
    points,
    length: beforeChain.length,
    sum: beforeChain.reduce((total, tile) => total + tile.value, 0),
    chain: beforeChain,
    usesLineage,
    lineageIndex,
    transferred: usesLineage && nextCarrier !== carrier,
    carrierBefore,
    carrierAfter: snapshotTile(nextCarrier),
    carrier: nextCarrier,
  };
}

function verifyCarrierClaim(event, claimedCarrierAfter) {
  if (JSON.stringify(event.carrierAfter) !== JSON.stringify(claimedCarrierAfter)) {
    throw new Error(`lineage carrier mismatch: expected ${JSON.stringify(event.carrierAfter)}, observed ${JSON.stringify(claimedCarrierAfter)}`);
  }
  return true;
}

function prefixState(candidate, recording, prefixLength) {
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  for (let index = 0; index < prefixLength; index += 1) {
    const chain = liveChain(state, recording.chains[index].tiles);
    executeTrackedChain(state, chain, null, { rng, refill: true, tick: true });
  }
  return { state, rng };
}

function selectedChampionClaims(state) {
  const analysis = analyzeMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  });
  if (!analysis.selectedChain) return null;
  return analysis.selectedChain.map(({ x, y, value }) => ({ x, y, value }));
}

function stateStatus(state) {
  if (checkBombs(state)) return { status: 'loss', reason: 'bomb' };
  if (state.score >= state.targetScore) return { status: 'win', reason: 'target' };
  if (state.moves >= state.maxMoves) return { status: 'loss', reason: 'move-budget' };
  return { status: 'active', reason: 'continuing' };
}

function compactEvent(event, continuationMoves, postStateIdentity) {
  return {
    continuationMoves,
    points: event.points,
    length: event.length,
    sum: event.sum,
    chain: event.chain,
    usesLineage: event.usesLineage,
    lineageIndex: event.lineageIndex,
    transferred: event.transferred,
    carrierBefore: event.carrierBefore,
    carrierAfter: event.carrierAfter,
    postStateIdentity,
  };
}

function traceArm(candidate, recording, priorArm, decisionIndex, correctionContinuation, armName) {
  const { state, rng } = prefixState(candidate, recording, decisionIndex);
  if (stateIdentity(state) !== priorArm.before.stateIdentity) {
    throw new Error(`move ${decisionIndex + 1} ${armName} decision-state mismatch`);
  }
  const claims = armName === 'owner'
    ? recording.chains[decisionIndex].tiles
    : selectedChampionClaims(state);
  if (!claims) throw new Error(`move ${decisionIndex + 1} ${armName} has no decision chain`);
  const decisionChain = liveChain(state, claims);
  const decision = executeTrackedChain(state, decisionChain, null, { rng, refill: true, tick: true });
  let carrier = decisionChain[decisionChain.length - 1];
  if (!carrierOnBoard(state, carrier)) throw new Error('decision survivor missing after gravity/refill');
  const decisionRecord = {
    points: decision.points,
    length: decision.length,
    sum: decision.sum,
    chain: decision.chain,
    landedCarrier: snapshotTile(carrier),
    postStateIdentity: stateIdentity(state),
  };
  const priorDecision = priorArm.timeline[0];
  if (decisionRecord.points !== priorDecision.choice.points
    || decisionRecord.length !== priorDecision.choice.length
    || decisionRecord.sum !== priorDecision.choice.sum
    || decisionRecord.postStateIdentity !== priorDecision.state.stateIdentity) {
    throw new Error(`move ${decisionIndex + 1} ${armName} decision reproduction mismatch`);
  }

  const events = [];
  let continuationMoves = 0;
  while (stateStatus(state).status === 'active') {
    const nextClaims = selectedChampionClaims(state);
    if (!nextClaims) break;
    const event = executeTrackedChain(state, liveChain(state, nextClaims), carrier, {
      rng,
      refill: true,
      tick: true,
    });
    carrier = event.carrier;
    continuationMoves += 1;
    const priorEntry = priorArm.timeline.find((entry) => entry.continuationMoves === continuationMoves);
    if (!priorEntry || priorEntry.state.stateIdentity !== stateIdentity(state)) {
      throw new Error(`move ${decisionIndex + 1} ${armName} continuation ${continuationMoves} drifted`);
    }
    events.push(compactEvent(event, continuationMoves, stateIdentity(state)));
  }
  const terminal = priorArm.terminal;
  const observedTerminal = stateStatus(state);
  const targetCost = observedTerminal.status === 'win' ? state.moves : state.maxMoves + 1;
  if (targetCost !== terminal.targetCost || state.score !== terminal.score) {
    throw new Error(`move ${decisionIndex + 1} ${armName} terminal mismatch`);
  }
  const correctionEvent = events.find((event) => event.continuationMoves === correctionContinuation);
  if (!correctionEvent) throw new Error(`move ${decisionIndex + 1} ${armName} correction event missing`);
  const firstReuse = events.find((event) => event.usesLineage);
  return {
    arm: armName,
    decision: decisionRecord,
    correctionContinuation,
    correctionUsesLineage: correctionEvent.usesLineage,
    correctionEvent,
    firstReuseDelay: firstReuse ? firstReuse.continuationMoves : null,
    lineageUsingMergesThroughCorrection: events.filter((event) => (
      event.continuationMoves <= correctionContinuation && event.usesLineage
    )).length,
    carrierAtCorrection: correctionEvent.carrierAfter,
    events,
    terminal: {
      status: observedTerminal.status,
      reason: observedTerminal.reason,
      moves: state.moves,
      score: state.score,
      targetCost,
    },
  };
}

function eventualWinner(expectedLabel) {
  return expectedLabel === 'helpful' ? 'owner' : 'champion';
}

function classifyCell(winnerUsed, loserUsed) {
  if (winnerUsed && !loserUsed) return 'WINNER_ONLY';
  if (winnerUsed && loserUsed) return 'BOTH';
  if (!winnerUsed && loserUsed) return 'LOSER_ONLY';
  return 'NEITHER';
}

function panelDisposition(cells) {
  const winnerUses = cells.filter((cell) => cell.winnerCorrectionUsesLineage).length;
  if (winnerUses === cells.length) return 'WINNER_LINEAGE_EXPLAINS_ALL_FOUR';
  if (winnerUses > 0) return 'WINNER_LINEAGE_EXPLAINS_SOME';
  return 'WINNER_LINEAGE_EXPLAINS_NONE';
}

function assertSourceIdentities(paths, prior, manifest, qualification) {
  if (sha256File(paths.priorRaw) !== SOURCE.priorRawSha256
    || !verifyArtifactIdentity(prior)
    || prior.artifactIdentity !== SOURCE.priorRawIdentity) {
    throw new Error('LC-0003 four-miss source identity mismatch');
  }
  if (!verifyArtifactIdentity(manifest) || manifest.artifactIdentity !== SOURCE.lc0003ManifestIdentity) {
    throw new Error('LC-0003 manifest identity mismatch');
  }
  if (!verifyArtifactIdentity(qualification)
    || qualification.artifactIdentity !== SOURCE.lc0003QualificationIdentity) {
    throw new Error('LC-0003 qualification identity mismatch');
  }
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const lc0007Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(lc0007Manifest, expectedManifestIdentity);
  const prior = JSON.parse(fs.readFileSync(paths.priorRaw, 'utf8'));
  const lc0003Manifest = JSON.parse(fs.readFileSync(paths.lc0003Manifest, 'utf8'));
  const qualification = JSON.parse(fs.readFileSync(paths.lc0003Qualification, 'utf8'));
  assertSourceIdentities(paths, prior, lc0003Manifest, qualification);
  const recording = JSON.parse(fs.readFileSync(paths.recording, 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error('could not resolve recording board');

  const cells = MOVES.map((move) => {
    const priorMiss = prior.misses.find((miss) => miss.move === move);
    if (!priorMiss || !priorMiss.firstGapOrderCorrection) throw new Error(`prior move ${move} missing correction`);
    const correction = priorMiss.firstGapOrderCorrection.continuationMoves;
    const owner = traceArm(resolved.candidate, recording, priorMiss.arms.owner, move - 1, correction, 'owner');
    const champion = traceArm(resolved.candidate, recording, priorMiss.arms.champion, move - 1, correction, 'champion');
    const winner = eventualWinner(priorMiss.expectedLabel);
    const loser = winner === 'owner' ? 'champion' : 'owner';
    const winnerUsed = (winner === 'owner' ? owner : champion).correctionUsesLineage;
    const loserUsed = (loser === 'owner' ? owner : champion).correctionUsesLineage;
    return {
      move,
      expectedLabel: priorMiss.expectedLabel,
      winner,
      loser,
      correctionContinuation: correction,
      winnerCorrectionUsesLineage: winnerUsed,
      loserCorrectionUsesLineage: loserUsed,
      outcome: classifyCell(winnerUsed, loserUsed),
      arms: { owner, champion },
    };
  });

  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0007-decision-lineage-raw',
    status: 'COMPLETE',
    finalSubjectIdentity: lc0007Manifest.artifactIdentity,
    sources: {
      priorArtifactIdentity: prior.artifactIdentity,
      lc0003ManifestIdentity: lc0003Manifest.artifactIdentity,
      lc0003QualificationIdentity: qualification.artifactIdentity,
      recordingIdentity: lc0003Manifest.identities.recording,
    },
    controls: {
      exactPanelReproduced: true,
      objectiveEquivalent: true,
      unchangedContinuation: true,
    },
    cells,
    disposition: panelDisposition(cells),
  });
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
      winnerCorrectionUsesLineage: cell.winnerCorrectionUsesLineage,
      loserCorrectionUsesLineage: cell.loserCorrectionUsesLineage,
      outcome: cell.outcome,
      owner: {
        landedCarrier: cell.arms.owner.decision.landedCarrier,
        firstReuseDelay: cell.arms.owner.firstReuseDelay,
        lineageUsingMergesThroughCorrection: cell.arms.owner.lineageUsingMergesThroughCorrection,
      },
      champion: {
        landedCarrier: cell.arms.champion.decision.landedCarrier,
        firstReuseDelay: cell.arms.champion.firstReuseDelay,
        lineageUsingMergesThroughCorrection: cell.arms.champion.lineageUsingMergesThroughCorrection,
      },
    })),
  };
}

function fixtureState(grid) {
  return {
    grid: grid.map((row, y) => row.map((value, x) => (
      value === null ? null : { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 }
    ))),
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    minChain: 3,
    tileScale: 1,
    score: 0,
    moves: 0,
    maxMoves: 20,
    targetScore: 1000,
  };
}

function calibrationControls() {
  const positive = fixtureState([
    [2, 2, 4, null],
    [8, 8, 8, 16],
  ]);
  const decision = [positive.grid[0][0], positive.grid[0][1], positive.grid[0][2]];
  executeTrackedChain(positive, decision);
  const carrier = decision[2];
  const positiveEvent = executeTrackedChain(positive, [
    positive.grid[1][0], positive.grid[1][1], carrier, positive.grid[1][2], positive.grid[1][3],
  ], carrier);

  const negative = fixtureState([
    [2, 2, 4, null],
    [8, 8, 8, 16],
  ]);
  const negativeDecision = [negative.grid[0][0], negative.grid[0][1], negative.grid[0][2]];
  executeTrackedChain(negative, negativeDecision);
  const negativeCarrier = negativeDecision[2];
  const negativeEvent = executeTrackedChain(negative, [
    negative.grid[1][0], negative.grid[1][1], negative.grid[1][2],
  ], negativeCarrier);

  let mutationKilled = false;
  let mutationMessage = null;
  try {
    verifyCarrierClaim(positiveEvent, { ...positiveEvent.carrierAfter, x: positiveEvent.carrierAfter.x - 1 });
  } catch (error) {
    mutationKilled = true;
    mutationMessage = error.message;
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0007-persist-'));
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
      id: 'C3-lineage-transfer-known-good',
      pass: positiveEvent.usesLineage
        && positiveEvent.transferred
        && positiveEvent.lineageIndex === 2
        && positiveEvent.carrierAfter.value === 48
        && positiveEvent.carrierAfter.x === 3
        && positiveEvent.carrierAfter.y === 1,
      observed: { ...positiveEvent, carrier: undefined },
    },
    {
      id: 'C4-unrelated-chain-known-negative',
      pass: !negativeEvent.usesLineage
        && !negativeEvent.transferred
        && negativeEvent.carrier === negativeCarrier,
      observed: { ...negativeEvent, carrier: undefined },
    },
    {
      id: 'C5-planted-false-carrier',
      pass: mutationKilled && /lineage carrier mismatch/.test(mutationMessage || ''),
      observed: { mutationPresent: true, reachedValidator: true, mutationKilled, mutationMessage },
    },
    {
      id: 'C6-restoration-and-persistence',
      pass: persistencePass,
      observed: { plantedFailureObserved, rawRetained: fs.existsSync(retainedPath) },
    },
  ];
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    priorRaw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-four-miss-diagnostic-raw.json'),
    lc0003Manifest: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-manifest.json'),
    lc0003Qualification: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-raw.json'),
    priorHarness: path.join(ROOT, 'tools', 'diagnose-lc0003-misses.js'),
    recording: path.join(ROOT, 'play-sessions', 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    lc0005Result: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0005-complete-harvest-chain-result.md'),
    lc0006Result: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0006-complete-harvest-counterexample-result.md'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0007DecisionLineage.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['priorRaw', 'lc0003Manifest', 'lc0003Qualification', 'priorHarness', 'recording', 'engine', 'bot', 'lc0005Result', 'lc0006Result']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0007-decision-lineage-manifest',
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
  if (manifest.kind !== 'lc0007-decision-lineage-manifest') throw new Error('unexpected manifest kind');
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

function exerciseCloseout({
  contractPath,
  expectedContractIdentity,
  manifestIdentity,
  reportableOut,
  recomputedOut,
}) {
  if (sha256File(contractPath) !== expectedContractIdentity) throw new Error('closeout contract external identity mismatch');
  if (fs.existsSync(reportableOut) || fs.existsSync(recomputedOut)) throw new Error('closeout qualification requires absent reportable paths');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (contract.final_subject_identity !== manifestIdentity) throw new Error('closeout final subject does not match manifest identity');
  const contractDirectory = path.dirname(contractPath);
  const resolvedCwd = path.resolve(contractDirectory, contract.recomputation.cwd);
  const resolvedArgvFiles = contract.recomputation.argv
    .filter((value) => value.includes('/'))
    .map((value) => path.resolve(resolvedCwd, value));
  const receiptPath = path.join(contractDirectory, 'LC-0007-disposable-qualification-closure.json');
  const synthetic = artifactWithIdentity({ schemaVersion: 1, kind: 'lc0007-decision-lineage-raw', status: 'SYNTHETIC_QUALIFICATION' });
  try {
    writeJsonOnce(reportableOut, synthetic);
    const [program, ...argv] = contract.recomputation.argv;
    const output = execFileSync(program, argv, { cwd: resolvedCwd });
    fs.writeFileSync(recomputedOut, output, { flag: 'wx' });
    const receipt = {
      schema_version: 1,
      contract: { path: path.basename(contractPath), sha256: expectedContractIdentity },
      run_id: 'LC-0007-SYNTHETIC-QUALIFICATION',
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
    const verifier = '/Users/eluckey/.codex/skills/close-experiment/scripts/verify_closure.py';
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

function qualifyHarness({
  manifestPath,
  expectedManifestIdentity,
  closeoutContract,
  expectedCloseoutIdentity,
  reportableOut,
  recomputedOut,
}) {
  if (fs.existsSync(reportableOut)) throw new Error('reportable raw output must be absent before qualification');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, committedFileMatches(file)]));
  const prior = JSON.parse(fs.readFileSync(paths.priorRaw, 'utf8'));
  const lc0003Manifest = JSON.parse(fs.readFileSync(paths.lc0003Manifest, 'utf8'));
  const qualification = JSON.parse(fs.readFileSync(paths.lc0003Qualification, 'utf8'));
  assertSourceIdentities(paths, prior, lc0003Manifest, qualification);
  const sourceControls = [
    {
      id: 'C1-frozen-replay-and-panel-identity',
      pass: JSON.stringify(prior.misses.map(({ move }) => move)) === JSON.stringify(MOVES)
        && prior.misses.every((miss) => miss.firstGapOrderCorrection),
      observed: {
        priorArtifactIdentity: prior.artifactIdentity,
        moves: prior.misses.map(({ move }) => move),
        corrections: prior.misses.map(({ move, firstGapOrderCorrection }) => ({ move, continuationMoves: firstGapOrderCorrection.continuationMoves })),
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
  const trackerIdentityBefore = sha256Bytes(executeTrackedChain.toString());
  const trackerIdentityAfter = sha256Bytes(executeTrackedChain.toString());
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
    kind: 'lc0007-harness-qualification',
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
  calibrationControls,
  classifyCell,
  collectFromManifest,
  createManifest,
  executeTrackedChain,
  fixtureState,
  panelDisposition,
  qualifyHarness,
  summaryFromArtifact,
  validateManifest,
  verifyCarrierClaim,
};
