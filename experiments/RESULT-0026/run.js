#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  CONFIRMATION_SEEDS,
  LEVEL_NUMBERS,
  QUALIFICATION_LEVELS,
  QUALIFICATION_SEEDS,
  RESULT,
  ROOT,
  artifactWithIdentity,
  levels,
  sourceHashes,
  subjects,
} = require('./subject');
const {
  registrationStamp,
  requireProtocolOrExit,
} = require('../../solver/experiment-guard');
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

function chainSnapshot(chain) {
  return chain.map(({ x, y, value }) => ({ x, y, value }));
}

function play(policy, policySubject, level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const trace = [];
  let chooserRuntimeNs = 0n;
  let terminationReason = 'move-budget';

  while (state.moves < state.maxMoves && state.score < state.targetScore) {
    const moveIndex = state.moves;
    const started = process.hrtime.bigint();
    const chain = policy.chooseMove(state, {
      params: policySubject.params,
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    chooserRuntimeNs += process.hrtime.bigint() - started;
    if (!chain) {
      terminationReason = 'no-valid-move';
      break;
    }

    const selected = chainSnapshot(chain);
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    trace.push({
      move: state.moves,
      chain: selected,
      points,
      scoreAfter: state.score,
    });
    if (checkBombs(state)) {
      terminationReason = 'bomb-exploded';
      break;
    }
  }

  if (state.score >= state.targetScore) terminationReason = 'target-reached';
  else if (state.moves >= state.maxMoves) terminationReason = 'move-budget';
  const targetReached = state.score >= state.targetScore;
  return {
    policy: policySubject.name,
    policyId: policySubject.policyId,
    level: level.level,
    seed,
    target: level.target,
    moveBudget: level.moves,
    targetReached,
    movesToTarget: targetReached ? state.moves : null,
    movesUsed: state.moves,
    score: state.score,
    terminationReason,
    chooserRuntimeMs: Number(chooserRuntimeNs) / 1_000_000,
    trace,
  };
}

function policies() {
  const fixedSubjects = subjects();
  return [
    { subject: fixedSubjects.find(({ name }) => name === 'reference'), implementation: reference },
    { subject: fixedSubjects.find(({ name }) => name === 'handmade'), implementation: handmade },
  ];
}

function runCells(levelNumbers, seeds) {
  const cells = [];
  const started = process.hrtime.bigint();
  for (const policy of policies()) {
    for (const level of levels(levelNumbers)) {
      for (const seed of seeds) cells.push(play(policy.implementation, policy.subject, level, seed));
    }
  }
  return {
    cells,
    runtimeMs: Number(process.hrtime.bigint() - started) / 1_000_000,
  };
}

function artifactBody(kind) {
  if (!['qualification', 'confirmation'].includes(kind)) throw new Error(`unknown run kind ${kind}`);
  const isQualification = kind === 'qualification';
  const levelNumbers = isQualification ? QUALIFICATION_LEVELS : LEVEL_NUMBERS;
  const seeds = isQualification ? QUALIFICATION_SEEDS : CONFIRMATION_SEEDS;
  const result = runCells(levelNumbers, seeds);
  return {
    schemaVersion: 1,
    result: RESULT,
    kind,
    reportable: !isQualification,
    subjects: subjects(),
    levelNumbers,
    seeds,
    sources: sourceHashes(),
    execution: {
      runtimeMs: result.runtimeMs,
      policySemantics: 'real move budget; stop at target; losses never receive extra play',
    },
    cells: result.cells,
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function writeNew(destination, value) {
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${destination}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function authorizeConfirmation(qualification, challengeReceipt) {
  const { validateChallengeReceipt } = require('./gate');
  return validateChallengeReceipt(challengeReceipt, qualification);
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!['qualification', 'confirmation'].includes(command)) {
    throw new Error('usage: run.js qualification|confirmation --protocol RESULT-0026 --out <path> [--qualification <path> --challenge-receipt <path>]');
  }
  const registration = requireProtocolOrExit(process.argv, { name: `RESULT-0026 ${command}` });
  if (command === 'confirmation' && registration.exploratory) {
    throw new Error('confirmation refuses --exploratory because it would burn the registered fresh seeds');
  }
  const output = flag(argv, '--out');
  if (!output) throw new Error('--out <path> is required');

  let challengeEntitlement = null;
  if (command === 'confirmation') {
    const qualificationPath = flag(argv, '--qualification');
    const receiptPath = flag(argv, '--challenge-receipt');
    if (!qualificationPath || !receiptPath) {
      throw new Error('confirmation requires --qualification <path> and --challenge-receipt <path>');
    }
    challengeEntitlement = authorizeConfirmation(readJson(qualificationPath), readJson(receiptPath));
  }

  const body = artifactBody(command);
  if (challengeEntitlement) body.challengeEntitlement = challengeEntitlement;
  const artifact = artifactWithIdentity(body, registrationStamp(registration));
  writeNew(path.resolve(ROOT, output), artifact);
  console.log(`WROTE ${command} ${artifact.artifactIdentity}`);
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
  qualificationArtifactBody: () => artifactBody('qualification'),
  authorizeConfirmation,
};
