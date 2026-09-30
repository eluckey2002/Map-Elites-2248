#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  applyGravity,
  chainMultiplier,
  chainValue,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { classifyTerminal } = require('../solver/benchmark-replay');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { enumerateLegalChainsWithStats } = require('../solver/exact-score');
const { artifactWithIdentity, verifyArtifactIdentity } = require('./diagnose-lc0004-move6-move8');
const { stateIdentity } = require('./diagnose-lc0003-misses');
const { verifyLaterRefillContrastArtifact } = require('./diagnose-lc0018-later-refill-contrast');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const REFILL_CONTRAST_RELATIVE = 'docs/learning-cycles/LC-0018-later-refill-contrast.json';
const REFILL_CONTRAST_PATH = path.join(ROOT, REFILL_CONTRAST_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
const EXPECTED_REFILL_CONTRAST_IDENTITY = '2e0bb47647204ec8c9f31dc585697ddb837254f55e73a54fd2df95181082b297';
const CASES = Object.freeze([
  Object.freeze({ level: 3, enteringRootId: 'S0026', excludedRootId: 'S0022' }),
  Object.freeze({ level: 52, enteringRootId: 'S0024', excludedRootId: 'S0020' }),
]);

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function compact(tile) {
  return { x: tile.x, y: tile.y, value: tile.value };
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

function executeAndCheck(state, rng, retained, relativeMove) {
  if (stateIdentity(state) !== retained.preStateIdentity) throw new Error(`CASH_NOW pre-state drift at relative move ${relativeMove}`);
  const beforeCalls = rng.calls();
  const points = executeChain(state, liveChain(state, retained.chain));
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
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
}

function reconstructPreTargetBoard(row, cashTrace) {
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
  if (stateIdentity(state) !== row.selected.commonStateIdentity || state.score !== row.selected.commonScore || state.moves !== row.selected.commonMoves) {
    throw new Error(`common state mismatch: ${row.recordingPath}`);
  }
  const checkedRng = countedRng(rng);
  for (let index = 0; index < cashTrace.length - 1; index += 1) {
    executeAndCheck(state, checkedRng, cashTrace[index], index + 1);
  }
  return state;
}

function loadRefillContrast() {
  const contrast = JSON.parse(fs.readFileSync(REFILL_CONTRAST_PATH, 'utf8'));
  if (!verifyLaterRefillContrastArtifact(contrast) || contrast.artifactIdentity !== EXPECTED_REFILL_CONTRAST_IDENTITY) {
    throw new Error('LC-0018 refill-contrast identity mismatch');
  }
  return contrast;
}

function chooseWitness(chains) {
  let best = null;
  let bestPoints = 0;
  let bestKey = '';
  for (const chain of chains) {
    const points = Math.floor(chainValue(chain) * chainMultiplier(chain.length));
    const key = JSON.stringify(chain.map(compact));
    if (!best || chain.length < best.length || (chain.length === best.length && (
      points > bestPoints || (points === bestPoints && key < bestKey)
    ))) {
      best = chain;
      bestPoints = points;
      bestKey = key;
    }
  }
  return best;
}

function deriveCase(raw, contrast, descriptor) {
  const contrastCase = contrast.cases.find(({ level }) => level === descriptor.level);
  if (!contrastCase) throw new Error(`missing Level ${descriptor.level} contrast case`);
  const entering = contrastCase.enteringRoots.find(({ id }) => id === descriptor.enteringRootId);
  if (!entering || !entering.matchedNonEnteringRoot || entering.matchedNonEnteringRoot.id !== descriptor.excludedRootId) {
    throw new Error(`selected root pair drifted at Level ${descriptor.level}`);
  }
  const row = raw.eligibility.rows.find(({ recordingPath }) => recordingPath === contrastCase.recordingPath);
  const pair = raw.pairs.find(({ recordingPath }) => recordingPath === contrastCase.recordingPath);
  if (!row || !pair || pair.pairClass !== 'CASH_NOW_FASTER') throw new Error(`cash pair drifted at Level ${descriptor.level}`);
  const state = reconstructPreTargetBoard(row, pair.arms.CASH_NOW.trace);
  const excluded = entering.matchedNonEnteringRoot.preTargetPosition;
  const enumeration = enumerateLegalChainsWithStats(state);
  const pointsNeeded = state.targetScore - state.score;
  const alternatives = enumeration.actions.filter((chain) => (
    chain.some(({ x, y }) => x === excluded.x && y === excluded.y)
    && Math.floor(chainValue(chain) * chainMultiplier(chain.length)) >= pointsNeeded
  ));
  const witness = chooseWitness(alternatives);
  if (!witness) throw new Error(`excluded root has no alternative target-crossing chain at Level ${descriptor.level}`);
  return {
    recordingId: contrastCase.recordingId,
    level: descriptor.level,
    excludedRoot: {
      id: descriptor.excludedRootId,
      value: entering.matchedNonEnteringRoot.value,
      preTargetPosition: excluded,
      spawnedAtRelativeMove: entering.matchedNonEnteringRoot.spawnedAtRelativeMove,
    },
    preTarget: { score: state.score, target: state.targetScore, pointsNeeded },
    replayMatchesRetainedPrefix: true,
    enumeration: {
      complete: true,
      visitedPathStates: enumeration.visitedPathStates,
      legalActionCount: enumeration.actions.length,
      actionsContainingExcludedRoot: enumeration.actions.filter((chain) => chain.some(({ x, y }) => x === excluded.x && y === excluded.y)).length,
    },
    alternativeTargetCrossingChainCount: alternatives.length,
    shortestAlternativeTargetCrossingChain: {
      length: witness.length,
      points: Math.floor(chainValue(witness) * chainMultiplier(witness.length)),
      tiles: witness.map(compact),
    },
  };
}

function deriveExcludedRootAlternativesArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) throw new Error('LC-0012 raw identity mismatch');
  const contrast = loadRefillContrast();
  const cases = CASES.map((descriptor) => deriveCase(raw, contrast, descriptor));
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0020-excluded-root-alternatives',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
      refillContrast: { path: REFILL_CONTRAST_RELATIVE, artifactIdentity: EXPECTED_REFILL_CONTRAST_IDENTITY },
    },
    question: 'On the unchanged retained pre-target board, can the excluded equal-birth root participate in any other legal chain that alone crosses the target?',
    enumerationBoundary: 'The pre-target board is reconstructed exactly from the retained cash prefix. Every legal chain is enumerated without a path-state cap; a chain qualifies only when it contains the excluded root and its own immediate points cross the remaining target gap. No continuation is executed.',
    cases,
    finding: 'EXCLUDED_ROOTS_HAVE_MANY_OTHER_TARGET_CROSSING_CHAINS_ON_THE_SAME_BOARD',
    interpretation: 'The excluded roots are not unavailable or intrinsically harmful. The retained policy selected one target-crossing path among many; explaining that selection requires examining path-level choice, not a root-level availability feature.',
    nonClaims: [
      'This artifact does not claim the alternative chains are equally good after their moves.',
      'This artifact does not compare the resulting afterstates or continuations.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyExcludedRootAlternativesArtifact(artifact) {
  try {
    if (!verifyArtifactIdentity(artifact) || artifact.kind !== 'lc0020-excluded-root-alternatives'
      || artifact.source.sha256 !== EXPECTED_RAW_SHA256 || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
      || artifact.source.refillContrast.artifactIdentity !== EXPECTED_REFILL_CONTRAST_IDENTITY) return false;
    if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) return false;
    return JSON.stringify(artifact) === JSON.stringify(deriveExcludedRootAlternativesArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'))));
  } catch {
    return false;
  }
}

function main(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: node tools/diagnose-lc0020-excluded-root-alternatives.js --out <artifact.json>');
  const artifact = deriveExcludedRootAlternativesArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(argv[1]), artifact);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, cases: artifact.cases }, null, 2)}\n`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = { deriveExcludedRootAlternativesArtifact, verifyExcludedRootAlternativesArtifact };
