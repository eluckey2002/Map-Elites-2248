#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  CONFIRMATION_SEEDS,
  LEVEL_NUMBERS,
  QUALIFICATION_LEVELS,
  QUALIFICATION_SEEDS,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  canonicalJson,
  fileHash,
  identity,
  levels,
  resignArtifact,
  sourceHashes,
  subjects,
} = require('./subject');
const { addedIn } = require('../../tools/verify-experiments');
const {
  applyGravity,
  checkBombs,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../../solver/engine');
const reference = require('../../solver/bot');
const handmade = require('./frozen-handmade-policy');

const LOOKAHEAD_BASE = 987654321;

function receiptWithIdentity(body) {
  return { ...body, receiptIdentity: identity(body) };
}

function verifyEnvelope(artifact) {
  const { artifactIdentity, ...envelope } = artifact;
  const { registration } = envelope;
  if (identity(envelope) !== artifactIdentity) throw new Error('artifact identity mismatch');
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT
    || !/^[0-9a-f]{40}$/.test(registration.protocolCommit || '')) {
    throw new Error('artifact registration is not a committed RESULT-0026 protocol');
  }
  const protocolPath = 'experiments/RESULT-0026/protocol.md';
  const registeredCommit = addedIn(protocolPath);
  if (!registeredCommit || registration.protocolCommit !== registeredCommit) {
    throw new Error('artifact protocol commit does not match the registered RESULT-0026 protocol');
  }
  try {
    execFileSync('git', ['cat-file', '-e', `${registeredCommit}:${protocolPath}`], { cwd: ROOT, stdio: 'ignore' });
    execFileSync('git', ['merge-base', '--is-ancestor', registeredCommit, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
  } catch {
    throw new Error('artifact protocol commit is not reachable with the registered protocol');
  }
  if (artifact.schemaVersion !== 1 || artifact.result !== RESULT) throw new Error('wrong result envelope');
}

function expectedScope(kind) {
  if (kind === 'qualification') return { levels: QUALIFICATION_LEVELS, seeds: QUALIFICATION_SEEDS, reportable: false };
  if (kind === 'confirmation') return { levels: LEVEL_NUMBERS, seeds: CONFIRMATION_SEEDS, reportable: true };
  throw new Error(`unknown artifact kind ${kind}`);
}

function verifySources(artifact) {
  const expected = sourceHashes();
  if (canonicalJson(artifact.sources) !== canonicalJson(expected)) throw new Error('source identity closure mismatch');
}

function expectedKeys(kind) {
  const scope = expectedScope(kind);
  const keys = [];
  for (const policy of subjects()) {
    for (const level of scope.levels) {
      for (const seed of scope.seeds) keys.push(`${policy.policyId}/${level}/${seed}`);
    }
  }
  return keys.sort();
}

function verifyMatrix(artifact) {
  const scope = expectedScope(artifact.kind);
  if (artifact.reportable !== scope.reportable) throw new Error('reportable flag mismatch');
  if (canonicalJson(artifact.levelNumbers) !== canonicalJson(scope.levels)) throw new Error('level set mismatch');
  if (canonicalJson(artifact.seeds) !== canonicalJson(scope.seeds)) throw new Error('seed set mismatch');
  if (canonicalJson(artifact.subjects) !== canonicalJson(subjects())) throw new Error('policy subject mismatch');
  const actual = artifact.cells.map((cell) => `${cell.policyId}/${cell.level}/${cell.seed}`).sort();
  if (new Set(actual).size !== actual.length || canonicalJson(actual) !== canonicalJson(expectedKeys(artifact.kind))) {
    throw new Error('paired cell matrix mismatch');
  }
}

function snapshot(chain) {
  return chain.map(({ x, y, value }) => ({ x, y, value }));
}

function stableOutcome(cell) {
  return {
    policy: cell.policy,
    policyId: cell.policyId,
    level: cell.level,
    seed: cell.seed,
    target: cell.target,
    moveBudget: cell.moveBudget,
    targetReached: cell.targetReached,
    movesToTarget: cell.movesToTarget,
    movesUsed: cell.movesUsed,
    score: cell.score,
    terminationReason: cell.terminationReason,
    trace: cell.trace,
  };
}

function replayCell(cell) {
  const subject = subjects().find(({ policyId }) => policyId === cell.policyId);
  if (!subject || subject.name !== cell.policy) throw new Error(`unknown policy subject ${cell.policyId}`);
  const implementation = subject.name === 'reference' ? reference : handmade;
  const level = levels([cell.level])[0];
  const rng = makeRng(cell.seed);
  const state = createLevelState(level, rng);
  const trace = [];
  let terminationReason = 'move-budget';

  while (state.moves < state.maxMoves && state.score < state.targetScore) {
    const moveIndex = state.moves;
    const chain = implementation.chooseMove(state, {
      params: subject.params,
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) {
      terminationReason = 'no-valid-move';
      break;
    }
    const selected = snapshot(chain);
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    trace.push({ move: state.moves, chain: selected, points, scoreAfter: state.score });
    if (checkBombs(state)) {
      terminationReason = 'bomb-exploded';
      break;
    }
  }
  if (state.score >= state.targetScore) terminationReason = 'target-reached';
  else if (state.moves >= state.maxMoves) terminationReason = 'move-budget';
  const targetReached = state.score >= state.targetScore;
  return {
    policy: subject.name,
    policyId: subject.policyId,
    level: level.level,
    seed: cell.seed,
    target: level.target,
    moveBudget: level.moves,
    targetReached,
    movesToTarget: targetReached ? state.moves : null,
    movesUsed: state.moves,
    score: state.score,
    terminationReason,
    trace,
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values) {
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function summarize(cells, levelNumbers, seeds) {
  const byKey = new Map(cells.map((cell) => [`${cell.policy}/${cell.level}/${cell.seed}`, cell]));
  const differences = [];
  const levelMeans = [];
  const seedMeans = [];
  const regressions = [];
  let referenceWins = 0;
  let handmadeWins = 0;

  for (const level of levelNumbers) {
    const local = [];
    for (const seed of seeds) {
      const ref = byKey.get(`reference/${level}/${seed}`);
      const hand = byKey.get(`handmade/${level}/${seed}`);
      if (ref.targetReached) referenceWins += 1;
      if (hand.targetReached) handmadeWins += 1;
      if (ref.targetReached && !hand.targetReached) regressions.push({ level, seed });
      const refMoves = ref.targetReached ? ref.movesToTarget : ref.moveBudget + 1;
      const handMoves = hand.targetReached ? hand.movesToTarget : hand.moveBudget + 1;
      local.push(refMoves - handMoves);
      differences.push(refMoves - handMoves);
    }
    levelMeans.push(mean(local));
  }
  for (const seed of seeds) {
    seedMeans.push(mean(levelNumbers.map((level) => {
      const ref = byKey.get(`reference/${level}/${seed}`);
      const hand = byKey.get(`handmade/${level}/${seed}`);
      const refMoves = ref.targetReached ? ref.movesToTarget : ref.moveBudget + 1;
      const handMoves = hand.targetReached ? hand.movesToTarget : hand.moveBudget + 1;
      return refMoves - handMoves;
    })));
  }
  const meanSavings = mean(levelMeans);
  const seLevel = sd(levelMeans) / Math.sqrt(levelMeans.length);
  const seSeed = sd(seedMeans) / Math.sqrt(seedMeans.length);
  const seCell = sd(differences) / Math.sqrt(differences.length);
  const standardError = Math.sqrt(Math.max(0, seLevel ** 2 + seSeed ** 2 - seCell ** 2));
  const t = standardError > 0 ? meanSavings / standardError : 0;
  const winNonRegression = regressions.length === 0 && handmadeWins >= referenceWins;
  let primaryVerdict = 'INCONCLUSIVE';
  if (!winNonRegression) primaryVerdict = 'FALSIFIED';
  else if (meanSavings > 0 && t >= 2) primaryVerdict = 'SUPPORTED';
  else if (meanSavings <= 0 && t <= -2) primaryVerdict = 'FALSIFIED';
  return {
    primaryVerdict,
    meanSavings,
    standardError,
    seLevel,
    seSeed,
    seCell,
    t,
    effectiveN: levelNumbers.length,
    pairedCells: differences.length,
    referenceWins,
    handmadeWins,
    winNonRegression,
    regressions,
    byLevel: Object.fromEntries(levelNumbers.map((level, index) => [String(level), levelMeans[index]])),
  };
}

function verifyArtifact(artifact) {
  verifyEnvelope(artifact);
  verifySources(artifact);
  verifyMatrix(artifact);
  for (const cell of artifact.cells) {
    const actual = replayCell(cell);
    if (canonicalJson(stableOutcome(cell)) !== canonicalJson(actual)) {
      throw new Error(`policy outcome mismatch for ${cell.policy}/${cell.level}/${cell.seed}`);
    }
    if (!Number.isFinite(cell.chooserRuntimeMs) || cell.chooserRuntimeMs < 0) {
      throw new Error(`invalid runtime for ${cell.policy}/${cell.level}/${cell.seed}`);
    }
  }
  const scope = expectedScope(artifact.kind);
  return {
    verdict: 'PASS',
    artifactIdentity: artifact.artifactIdentity,
    cells: artifact.cells.length,
    summary: summarize(artifact.cells, scope.levels, scope.seeds),
  };
}

function failedVerification(artifact) {
  try {
    verifyArtifact(artifact);
    return { verdict: 'PASS', error: null };
  } catch (error) {
    return { verdict: 'FAIL', error: error.message };
  }
}

function issueChallengeReceipt(qualification) {
  if (qualification.kind !== 'qualification') throw new Error('challenge subject must be the qualification artifact');
  const valid = verifyArtifact(qualification);

  const brokenTwin = structuredClone(qualification);
  brokenTwin.cells[0].score += 1;
  const resignedBroken = resignArtifact(brokenTwin);
  const broken = failedVerification(resignedBroken);
  if (broken.verdict !== 'FAIL' || !/policy outcome mismatch/.test(broken.error)) {
    throw new Error('controlled outcome twin did not fail the real verifier');
  }

  const invalidationTwin = structuredClone(qualification);
  invalidationTwin.sources['experiments/RESULT-0026/frozen-handmade-policy.js'] = '0'.repeat(64);
  const resignedInvalidation = resignArtifact(invalidationTwin);
  const invalidation = failedVerification(resignedInvalidation);
  if (invalidation.verdict !== 'FAIL' || !/source identity closure mismatch/.test(invalidation.error)) {
    throw new Error('covered-identity twin did not invalidate the real verifier');
  }

  const body = {
    schemaVersion: 1,
    result: RESULT,
    claim: 'identified reference and handmade policies produce the recorded full-game outcomes under the real move budget',
    realSubject: {
      kind: qualification.kind,
      artifactIdentity: qualification.artifactIdentity,
      levels: qualification.levelNumbers,
      seeds: qualification.seeds,
      policyIds: qualification.subjects.map(({ policyId }) => policyId),
    },
    executionPath: 'run.js -> policy chooseMove -> solver/engine transition; gate.js independently repeats every chooser decision and transition',
    verifierIdentity: fileHash('experiments/RESULT-0026/gate.js'),
    sourceIdentities: sourceHashes(),
    valid: { verdict: valid.verdict, cells: valid.cells },
    brokenTwin: {
      mutation: 'cells[0].score += 1 with artifact identity recomputed',
      verdict: broken.verdict,
      error: broken.error,
    },
    invalidationTwin: {
      mutation: 'frozen handmade policy source identity replaced with zeros and artifact identity recomputed',
      verdict: invalidation.verdict,
      error: invalidation.error,
    },
    downstreamConsumers: {
      confirmationRunner: {
        path: 'experiments/RESULT-0026/run.js',
        identity: fileHash('experiments/RESULT-0026/run.js'),
      },
      admission: {
        path: 'experiments/RESULT-0026/admit.js',
        identity: fileHash('experiments/RESULT-0026/admit.js'),
      },
    },
  };
  return receiptWithIdentity(body);
}

function validateChallengeReceipt(receipt, qualification) {
  const { receiptIdentity, ...body } = receipt;
  if (identity(body) !== receiptIdentity) throw new Error('challenge receipt identity mismatch');
  if (receipt.result !== RESULT) throw new Error('challenge receipt result mismatch');
  if (receipt.realSubject?.artifactIdentity !== qualification.artifactIdentity) throw new Error('challenge receipt subject mismatch');
  if (receipt.valid?.verdict !== 'PASS' || receipt.brokenTwin?.verdict !== 'FAIL'
    || receipt.invalidationTwin?.verdict !== 'FAIL') {
    throw new Error('challenge receipt lacks required PASS/FAIL/FAIL qualification');
  }
  if (receipt.verifierIdentity !== fileHash('experiments/RESULT-0026/gate.js')) throw new Error('challenge verifier identity changed');
  if (canonicalJson(receipt.sourceIdentities) !== canonicalJson(sourceHashes())) throw new Error('challenge covered source identity changed');
  for (const consumer of Object.values(receipt.downstreamConsumers || {})) {
    if (!consumer.path || consumer.identity !== fileHash(consumer.path)) throw new Error('challenge downstream consumer identity changed');
  }
  const expectedReceipt = issueChallengeReceipt(qualification);
  if (canonicalJson(receipt) !== canonicalJson(expectedReceipt)) {
    throw new Error('challenge receipt does not match a fresh execution of the qualified challenge');
  }
  const valid = verifyArtifact(qualification);
  return {
    receiptIdentity,
    qualificationIdentity: qualification.artifactIdentity,
    validVerdict: valid.verdict,
    brokenTwinVerdict: receipt.brokenTwin.verdict,
    invalidationTwinVerdict: receipt.invalidationTwin.verdict,
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  if (argv[0] !== 'challenge') throw new Error('usage: gate.js challenge --qualification <path> --out <path>');
  const qualificationPath = flag(argv, '--qualification');
  const output = flag(argv, '--out');
  if (!qualificationPath || !output) throw new Error('challenge requires --qualification <path> and --out <path>');
  const qualification = JSON.parse(fs.readFileSync(path.resolve(ROOT, qualificationPath), 'utf8'));
  const receipt = issueChallengeReceipt(qualification);
  writeNew(path.resolve(ROOT, output), receipt);
  console.log(`CHALLENGE PASS ${receipt.receiptIdentity}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  issueChallengeReceipt,
  receiptWithIdentity,
  summarize,
  validateChallengeReceipt,
  verifyArtifact,
};
