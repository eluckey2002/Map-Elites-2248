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
const { verifyLandingPathPanelArtifact } = require('./diagnose-lc0015-landing-path-panel');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const LANDING_PANEL_RELATIVE = 'docs/learning-cycles/LC-0015-landing-path-panel.json';
const LANDING_PANEL_PATH = path.join(ROOT, LANDING_PANEL_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
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
  const tracker = { metadata: new WeakMap(), nextCommon: 1, nextRefill: 1, nextMerge: 1 };
  registerNewTiles(tracker, state, 'common');
  return tracker;
}

function nextId(tracker, origin) {
  if (origin === 'common') return `C${String(tracker.nextCommon++).padStart(4, '0')}`;
  return `F${String(tracker.nextRefill++).padStart(4, '0')}`;
}

function registerNewTiles(tracker, state, origin) {
  for (const tile of allTiles(state).sort((left, right) => (left.y - right.y) || (left.x - right.x))) {
    if (!tracker.metadata.has(tile)) tracker.metadata.set(tile, { nodeId: nextId(tracker, origin), carriesFirstSurvivor: false });
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
    const chain = liveChain(state, recording.chains[index].tiles);
    const points = executeChain(state, chain);
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
  const rng = countedRng(common.rng);
  let firstCarrierReentry = null;
  for (let index = 0; index < retainedArm.trace.length; index += 1) {
    const retained = retainedArm.trace[index];
    const relativeMove = index + 1;
    if (stateIdentity(common.state) !== retained.preStateIdentity) throw new Error(`${retainedArm.arm} pre-state drift at relative move ${relativeMove}`);
    const chain = liveChain(common.state, retained.chain);
    const inputMetadata = chain.map((tile) => tracker.metadata.get(tile));
    const carrierInput = inputMetadata.find(({ carriesFirstSurvivor }) => carriesFirstSurvivor);
    if (!firstCarrierReentry && relativeMove > 1 && carrierInput) {
      firstCarrierReentry = {
        relativeMove,
        source: retained.source,
        actionPoints: retained.points,
        carrierNodeId: carrierInput.nodeId,
        preStateIdentity: retained.preStateIdentity,
        chain: retained.chain.map((tile, chainIndex) => ({ ...tile, nodeId: inputMetadata[chainIndex].nodeId, containsFirstActionSurvivor: inputMetadata[chainIndex].carriesFirstSurvivor })),
      };
    }
    const survivor = chain.at(-1);
    const beforeCalls = rng.calls();
    const points = executeChain(common.state, chain);
    const carriesFirstSurvivor = relativeMove === 1 || inputMetadata.some(({ carriesFirstSurvivor: carries }) => carries);
    tracker.metadata.set(survivor, { nodeId: `M${String(tracker.nextMerge++).padStart(4, '0')}`, carriesFirstSurvivor });
    applyGravity(common.state);
    spawnNewTiles(common.state, rng);
    tickBlockers(common.state);
    registerNewTiles(tracker, common.state, 'refill');
    const observed = {
      points,
      score: common.state.score,
      moves: common.state.moves,
      postStateIdentity: stateIdentity(common.state),
      refillRngCalls: rng.calls() - beforeCalls,
      terminal: classifyTerminal(common.state),
    };
    if (observed.points !== retained.points || observed.score !== retained.score || observed.moves !== retained.moves
      || observed.postStateIdentity !== retained.postStateIdentity || observed.refillRngCalls !== retained.refillRngCalls
      || JSON.stringify(observed.terminal) !== JSON.stringify(retained.terminal)) {
      throw new Error(`${retainedArm.arm} retained trace drift at relative move ${relativeMove}`);
    }
  }
  return {
    arm: retainedArm.arm,
    movesToTarget: retainedArm.movesToTarget,
    replayMatchesRetainedTrace: true,
    firstCarrierReentry,
  };
}

function deriveCase(raw, pair, comparison) {
  const row = raw.eligibility.rows.find(({ recordingPath }) => recordingPath === pair.recordingPath);
  if (!row) throw new Error(`eligibility row missing: ${pair.recordingPath}`);
  return {
    recordingId: pair.recordingPath.match(/([a-f0-9]{64})\.json$/)[1],
    recordingPath: pair.recordingPath,
    level: row.level,
    seed: row.seed,
    pairClass: pair.pairClass,
    fasterArm: comparison.fasterArm,
    immediatePathDirection: comparison.preparedValueDirection,
    immediatePathDisagreement: true,
    arms: Object.fromEntries(ARMS.map((name) => [name, replayArm(row, pair.arms[name])])),
  };
}

function loadImmediatePathDisagreements() {
  const panel = JSON.parse(fs.readFileSync(LANDING_PANEL_PATH, 'utf8'));
  if (!verifyLandingPathPanelArtifact(panel)
    || panel.source.sha256 !== EXPECTED_RAW_SHA256
    || panel.source.artifactIdentity !== EXPECTED_RAW_IDENTITY) {
    throw new Error('LC-0015 landing panel identity mismatch');
  }
  return panel.comparisons.filter(({ pairClass, preparedValueDirection, fasterArm }) => (
    pairClass !== 'TARGET_COST_TIE' && preparedValueDirection !== fasterArm
  ));
}

function deriveFirstCarrierPathArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) throw new Error('LC-0012 raw identity mismatch');
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT' || raw.pairs.length !== 14) throw new Error('LC-0012 raw result is not the closed 14-pair mixed panel');
  const disagreements = loadImmediatePathDisagreements();
  const cases = disagreements.map((comparison) => {
    const pair = raw.pairs.find((entry) => entry.recordingPath.endsWith(`${comparison.recordingId}.json`));
    if (!pair) throw new Error(`panel comparison has no raw pair: ${comparison.recordingId}`);
    return deriveCase(raw, pair, comparison);
  });
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0016-first-carrier-path',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
      landingPanel: { path: LANDING_PANEL_RELATIVE, artifactIdentity: 'd86bdb8123384a6d65e29c88dbd91128ff99c72a5ced27b6702b59037a4aea0d' },
    },
    caseSelection: 'The seven non-tied LC-0015 comparisons where immediate prepared survivor-path value did not point to the faster arm.',
    question: 'In each immediate-path disagreement, at which later retained action does the first-action survivor or its live descendant first re-enter a completed legal chain?',
    retrospectiveBoundary: 'Each arm follows its retained recorded continuation exactly. Re-entry means the tracked survivor descendant is an input to a later retained legal chain; no alternative action search, ranking, or policy metric is performed.',
    cases,
    finding: 'SURVIVOR_REENTRY_IS_OBSERVABLE_AFTER_THE_FIRST_LANDING',
    interpretation: 'This is replay evidence about when a first-action survivor is actually reused along each retained continuation. It does not establish that earlier or later re-entry causes the outcome, and it does not define a new metric.',
    nonClaims: [
      'This artifact does not generalize beyond the seven retained disagreement pairs.',
      'This artifact does not search counterfactual continuations or rank actions.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyFirstCarrierPathArtifact(artifact) {
  try {
    if (!verifyArtifactIdentity(artifact) || artifact.kind !== 'lc0016-first-carrier-path'
      || artifact.source.sha256 !== EXPECTED_RAW_SHA256 || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
      || artifact.source.landingPanel.artifactIdentity !== 'd86bdb8123384a6d65e29c88dbd91128ff99c72a5ced27b6702b59037a4aea0d') return false;
    if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) return false;
    const expected = deriveFirstCarrierPathArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
    return JSON.stringify(artifact) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: node tools/diagnose-lc0016-first-carrier-path.js --out <artifact.json>');
  return { out: argv[1] };
}

function main(argv) {
  const { out } = parseArgs(argv);
  if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) throw new Error('LC-0012 raw file hash mismatch');
  const artifact = deriveFirstCarrierPathArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(out), artifact);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, cases: artifact.cases.map(({ recordingId, arms }) => ({ recordingId, firstCarrierReentry: Object.fromEntries(ARMS.map((arm) => [arm, arms[arm].firstCarrierReentry && arms[arm].firstCarrierReentry.relativeMove])) })) }, null, 2)}\n`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = { EXPECTED_RAW_IDENTITY, EXPECTED_RAW_SHA256, deriveFirstCarrierPathArtifact, verifyFirstCarrierPathArtifact };
