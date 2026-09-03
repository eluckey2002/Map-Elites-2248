#!/usr/bin/env node

// Independent arithmetic path: deliberately imports none of RESULT-0026's
// runner, subject, gate, policy, or admission modules.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RESULT = 'RESULT-0026';
const LEVELS = Object.freeze([5, 11, 17, 23, 29, 35, 41, 47, 50]);
const SEEDS = Object.freeze(Array.from({ length: 25 }, (_, index) => 24000000 + index));

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex');
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values) {
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function readConfirmation(file) {
  return validateConfirmation(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function validateConfirmation(artifact) {
  const { artifactIdentity, ...envelope } = artifact;
  const { registration } = envelope;
  if (identity(envelope) !== artifactIdentity) throw new Error('confirmation artifact identity mismatch');
  if (artifact.result !== RESULT || artifact.kind !== 'confirmation' || artifact.reportable !== true) {
    throw new Error('wrong confirmation artifact');
  }
  if (!registration || registration.protocol !== RESULT || registration.exploratory !== false) {
    throw new Error('confirmation is not preregistered');
  }
  if (canonical(artifact.levelNumbers) !== canonical(LEVELS) || canonical(artifact.seeds) !== canonical(SEEDS)) {
    throw new Error('confirmation scope mismatch');
  }
  const expected = [];
  for (const policy of ['reference', 'handmade']) {
    for (const level of LEVELS) {
      for (const seed of SEEDS) expected.push(`${policy}/${level}/${seed}`);
    }
  }
  const observed = artifact.cells.map((cell) => `${cell.policy}/${cell.level}/${cell.seed}`);
  if (new Set(observed).size !== observed.length || canonical(observed.sort()) !== canonical(expected.sort())) {
    throw new Error('confirmation matrix mismatch');
  }
  return artifact;
}

function summarize(cells) {
  const map = new Map(cells.map((cell) => [`${cell.policy}/${cell.level}/${cell.seed}`, cell]));
  let referenceWins = 0;
  let handmadeWins = 0;
  const regressions = [];
  const byLevelValues = [];
  const bySeedValues = [];
  for (const level of LEVELS) {
    const values = [];
    for (const seed of SEEDS) {
      const ref = map.get(`reference/${level}/${seed}`);
      const hand = map.get(`handmade/${level}/${seed}`);
      if (ref.targetReached) referenceWins += 1;
      if (hand.targetReached) handmadeWins += 1;
      if (ref.targetReached && !hand.targetReached) regressions.push({ level, seed });
      values.push(
        (ref.targetReached ? ref.movesToTarget : ref.moveBudget + 1)
        - (hand.targetReached ? hand.movesToTarget : hand.moveBudget + 1),
      );
    }
    byLevelValues.push(mean(values));
  }
  for (const seed of SEEDS) {
    bySeedValues.push(mean(LEVELS.map((level) => {
      const ref = map.get(`reference/${level}/${seed}`);
      const hand = map.get(`handmade/${level}/${seed}`);
      return (ref.targetReached ? ref.movesToTarget : ref.moveBudget + 1)
        - (hand.targetReached ? hand.movesToTarget : hand.moveBudget + 1);
    })));
  }
  const meanSavings = mean(byLevelValues);
  const seLevel = sd(byLevelValues) / Math.sqrt(byLevelValues.length);
  const seSeed = sd(bySeedValues) / Math.sqrt(bySeedValues.length);
  const allDifferences = [];
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const ref = map.get(`reference/${level}/${seed}`);
      const hand = map.get(`handmade/${level}/${seed}`);
      allDifferences.push(
        (ref.targetReached ? ref.movesToTarget : ref.moveBudget + 1)
        - (hand.targetReached ? hand.movesToTarget : hand.moveBudget + 1),
      );
    }
  }
  const seCell = sd(allDifferences) / Math.sqrt(allDifferences.length);
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
    effectiveN: LEVELS.length,
    pairedCells: LEVELS.length * SEEDS.length,
    referenceWins,
    handmadeWins,
    winNonRegression,
    regressions,
    byLevel: Object.fromEntries(LEVELS.map((level, index) => [String(level), byLevelValues[index]])),
  };
}

function recompute(artifact) {
  return summarize(artifact.cells);
}

function receiptForArtifact(artifact) {
  validateConfirmation(artifact);
  const body = {
    schemaVersion: 1,
    result: RESULT,
    confirmationIdentity: artifact.artifactIdentity,
    recomputeSourceIdentity: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
    summary: recompute(artifact),
  };
  return { ...body, artifactIdentity: identity(body) };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function main(argv = process.argv.slice(2)) {
  const confirmationPath = flag(argv, '--confirmation');
  const output = flag(argv, '--out');
  if (!confirmationPath || !output) throw new Error('usage: recompute.js --confirmation <path> --out <path>');
  const artifact = readConfirmation(path.resolve(confirmationPath));
  const receipt = receiptForArtifact(artifact);
  const destination = path.resolve(output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${destination}`);
  fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`RECOMPUTED ${receipt.artifactIdentity}`);
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
  canonical,
  identity,
  readConfirmation,
  receiptForArtifact,
  recompute,
  summarize,
  validateConfirmation,
};
