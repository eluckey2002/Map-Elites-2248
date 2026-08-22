#!/usr/bin/env node
// Independent artifact reader for the learning experiment. It does not trust
// the producer's PASS line: it re-reads the JSON and HTML, checks protected
// source identities, and replays every representative elite.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { policyIdentity, validateArtifact } = require('./map-elites-core');
const { PROTECTED_COMMIT, PROTECTED_HASHES, replayElite } = require('./map-elites');

const ROOT = path.join(__dirname, '..');

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function verify(out = 'solver/map-elites-output') {
  const outDir = path.isAbsolute(out) ? out : path.join(ROOT, out);
  const archivePath = path.join(outDir, 'archive.json');
  const mapPath = path.join(outDir, 'map.html');
  const artifact = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  const html = fs.readFileSync(mapPath, 'utf8');
  const summary = validateArtifact(artifact);

  if (artifact.protected.commit !== PROTECTED_COMMIT) throw new Error('protected commit mismatch');
  for (const [file, expected] of Object.entries(PROTECTED_HASHES)) {
    if (artifact.protected.hashes[file] !== expected) throw new Error(`archive protected hash mismatch for ${file}`);
    const actual = hashFile(path.join(ROOT, file));
    if (actual !== expected) throw new Error(`protected file changed: ${file}`);
  }
  if (artifact.axes.pilot.chainRange < artifact.axes.pilot.minimumChainRange
    || artifact.axes.pilot.patienceRange < artifact.axes.pilot.minimumPatienceRange) {
    throw new Error('pilot did not clear its descriptor minimums');
  }

  const screenCells = artifact.config.screen.levels.length * artifact.config.screen.seeds.length;
  const holdoutCells = artifact.config.holdout.levels.length * artifact.config.holdout.seeds.length;
  for (const elite of artifact.archive) {
    if (policyIdentity(elite.params) !== elite.policyId) throw new Error(`policy identity mismatch for ${elite.policyId}`);
    if (!elite.screen || elite.screen.scores.length !== screenCells) throw new Error(`screen evidence missing for ${elite.policyId}`);
    if (!html.includes(`data-cell="${elite.cell}"`) || !html.includes(elite.policyId)) {
      throw new Error(`visual map omits elite ${elite.policyId} in ${elite.cell}`);
    }
  }
  for (const representative of artifact.representatives) {
    if (representative.holdout.scores.length !== holdoutCells) throw new Error(`holdout evidence incomplete for ${representative.policyId}`);
  }
  for (const phrase of [
    'Chain style: mean chain length', 'Patience: late-score share',
    'Selection fitness', 'Holdout fitness', 'Empty cell',
  ]) {
    if (!html.includes(phrase)) throw new Error(`visual map is missing: ${phrase}`);
  }

  const replays = [];
  for (const representative of artifact.representatives) {
    replays.push(await replayElite(archivePath, representative.policyId));
  }
  return {
    status: 'PASS', archivePath, mapPath, ...summary,
    pilot: artifact.axes.pilot,
    replays,
  };
}

async function main() {
  const result = await verify(process.argv[2]);
  console.log(`PASS MAP-Elites artifact: ${result.occupiedCells} occupied cells across ${result.chainBins} chain bins and ${result.patienceBins} patience bins`);
  console.log(`PASS ${result.replays.length} representative elite replays`);
  console.log(`PASS protected champion ${PROTECTED_COMMIT.slice(0, 7)} and level-authoring hashes`);
}

if (require.main === module) {
  main().catch((error) => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
}

module.exports = { verify };
