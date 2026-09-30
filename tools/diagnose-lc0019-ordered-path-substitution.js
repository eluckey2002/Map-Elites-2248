#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { chainLegality } = require('../solver/recording-replay');
const { resolveRecordedBoard } = require('../solver/human-benchmark');
const { artifactWithIdentity, verifyArtifactIdentity } = require('./diagnose-lc0004-move6-move8');
const { verifyNoReentryTargetChainArtifact } = require('./diagnose-lc0017-no-reentry-target-chain');
const { verifyLaterRefillContrastArtifact } = require('./diagnose-lc0018-later-refill-contrast');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const TARGET_CHAIN_RELATIVE = 'docs/learning-cycles/LC-0017-no-reentry-target-chain.json';
const TARGET_CHAIN_PATH = path.join(ROOT, TARGET_CHAIN_RELATIVE);
const REFILL_CONTRAST_RELATIVE = 'docs/learning-cycles/LC-0018-later-refill-contrast.json';
const REFILL_CONTRAST_PATH = path.join(ROOT, REFILL_CONTRAST_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';
const EXPECTED_TARGET_CHAIN_IDENTITY = 'c02356d0f6ee603f0794c31e69d92c2cbc74fd4a93e07e1cbfb53456cb6b3b59';
const EXPECTED_REFILL_CONTRAST_IDENTITY = '2e0bb47647204ec8c9f31dc585697ddb837254f55e73a54fd2df95181082b297';
const CASES = Object.freeze([
  Object.freeze({ level: 3, enteringRootId: 'S0026' }),
  Object.freeze({ level: 52, enteringRootId: 'S0024' }),
]);

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function compact(tile) {
  return { x: tile.x, y: tile.y, value: tile.value };
}

function loadArtifact(file, verifier, expectedIdentity, label) {
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!verifier(artifact) || artifact.artifactIdentity !== expectedIdentity) throw new Error(`${label} identity mismatch`);
  return artifact;
}

function candidateMinChain(rawRow) {
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, rawRow.recordingPath), 'utf8'));
  const resolved = resolveRecordedBoard(recording);
  if (!resolved || !resolved.candidate) throw new Error(`recording does not resolve: ${rawRow.recordingPath}`);
  return resolved.candidate.minChain;
}

function deriveCase(raw, targetArtifact, contrastArtifact, descriptor) {
  const contrast = contrastArtifact.cases.find(({ level }) => level === descriptor.level);
  const target = targetArtifact.cases.find(({ level }) => level === descriptor.level);
  if (!contrast || !target) throw new Error(`missing Level ${descriptor.level} source case`);
  const rawRow = raw.eligibility.rows.find(({ recordingPath }) => recordingPath === target.recordingPath);
  if (!rawRow) throw new Error(`missing Level ${descriptor.level} raw row`);
  const enteringRoot = contrast.enteringRoots.find(({ id }) => id === descriptor.enteringRootId);
  if (!enteringRoot || !enteringRoot.matchedNonEnteringRoot) throw new Error(`missing selected match: ${descriptor.enteringRootId}`);
  const targetChain = target.arms.CASH_NOW.targetCrossingChain;
  const index = targetChain.directInputNodeIds.indexOf(enteringRoot.id);
  if (index < 0 || targetChain.chain[index].value !== enteringRoot.value) throw new Error(`target slot mismatch: ${enteringRoot.id}`);
  const replacement = enteringRoot.matchedNonEnteringRoot;
  const substitutedChain = targetChain.chain.map(compact);
  substitutedChain[index] = { x: replacement.preTargetPosition.x, y: replacement.preTargetPosition.y, value: replacement.value };
  const minChain = candidateMinChain(rawRow);
  const originalChainLegality = chainLegality(targetChain.chain, minChain);
  const substitutionLegality = chainLegality(substitutedChain, minChain);
  if (originalChainLegality.length || !substitutionLegality.length) throw new Error(`substitution did not separate legalities: ${descriptor.enteringRootId}`);
  return {
    recordingId: target.recordingId,
    level: descriptor.level,
    minChain,
    targetRelativeMove: targetChain.relativeMove,
    originalChainLegality,
    enteringRoot: {
      id: enteringRoot.id,
      value: enteringRoot.value,
      preTargetPosition: enteringRoot.preTargetPosition,
    },
    matchedRoot: {
      id: replacement.id,
      value: replacement.value,
      preTargetPosition: replacement.preTargetPosition,
      spawnedAtRelativeMove: replacement.spawnedAtRelativeMove,
    },
    targetChainSlot: {
      index,
      previous: index > 0 ? compact(targetChain.chain[index - 1]) : null,
      entering: compact(targetChain.chain[index]),
      next: index < targetChain.chain.length - 1 ? compact(targetChain.chain[index + 1]) : null,
    },
    substitutedSlot: compact(substitutedChain[index]),
    substitutionLegality,
  };
}

function deriveOrderedPathSubstitutionArtifact(raw) {
  if (!verifyArtifactIdentity(raw) || raw.artifactIdentity !== EXPECTED_RAW_IDENTITY) throw new Error('LC-0012 raw identity mismatch');
  const targetArtifact = loadArtifact(TARGET_CHAIN_PATH, verifyNoReentryTargetChainArtifact, EXPECTED_TARGET_CHAIN_IDENTITY, 'LC-0017');
  const contrastArtifact = loadArtifact(REFILL_CONTRAST_PATH, verifyLaterRefillContrastArtifact, EXPECTED_REFILL_CONTRAST_IDENTITY, 'LC-0018');
  const cases = CASES.map((descriptor) => deriveCase(raw, targetArtifact, contrastArtifact, descriptor));
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0019-ordered-path-substitution',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
      targetChain: { path: TARGET_CHAIN_RELATIVE, artifactIdentity: EXPECTED_TARGET_CHAIN_IDENTITY },
      refillContrast: { path: REFILL_CONTRAST_RELATIVE, artifactIdentity: EXPECTED_REFILL_CONTRAST_IDENTITY },
    },
    caseSelection: 'The Level 3 adjacent equal-birth counterexample (S0026/S0022) and the Level 52 equal-birth 256 counterexample (S0024/S0020) from LC-0018.',
    question: 'Can the observed same-birth, same-value non-entering root occupy the included root’s exact ordered slot in the retained cash target chain?',
    interventionBoundary: 'This is a static substitution in the already-retained pre-target chain coordinate list. It checks that exact slot only; it does not execute the substitution, search a reordered chain, or claim the excluded root could never be useful.',
    cases,
    finding: 'SAME_BIRTH_ROOTS_CANNOT_REPLACE_THEIR_EXACT_ORDERED_TARGET_SLOT',
    interpretation: 'The two substitutions fail because they break required adjacency in the already-retained ordered path. This is a local path-membership explanation only, not a general rule about a root’s usefulness or a prospective metric.',
    nonClaims: [
      'This artifact does not prove that the excluded root has no legal alternative chain.',
      'This artifact does not search replacements or reorder the retained path.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyOrderedPathSubstitutionArtifact(artifact) {
  try {
    if (!verifyArtifactIdentity(artifact) || artifact.kind !== 'lc0019-ordered-path-substitution'
      || artifact.source.sha256 !== EXPECTED_RAW_SHA256 || artifact.source.artifactIdentity !== EXPECTED_RAW_IDENTITY
      || artifact.source.targetChain.artifactIdentity !== EXPECTED_TARGET_CHAIN_IDENTITY
      || artifact.source.refillContrast.artifactIdentity !== EXPECTED_REFILL_CONTRAST_IDENTITY) return false;
    if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) return false;
    return JSON.stringify(artifact) === JSON.stringify(deriveOrderedPathSubstitutionArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'))));
  } catch {
    return false;
  }
}

function main(argv) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: node tools/diagnose-lc0019-ordered-path-substitution.js --out <artifact.json>');
  const artifact = deriveOrderedPathSubstitutionArtifact(JSON.parse(fs.readFileSync(RAW_PATH, 'utf8')));
  writeJsonOnce(path.resolve(argv[1]), artifact);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, cases: artifact.cases }, null, 2)}\n`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = { deriveOrderedPathSubstitutionArtifact, verifyOrderedPathSubstitutionArtifact };
