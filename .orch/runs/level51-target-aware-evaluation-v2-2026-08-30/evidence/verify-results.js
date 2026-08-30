#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const { LEVELS } = require(path.join(ROOT, 'src/game'));

const SCREEN_FILE = path.join(__dirname, 'screen.json');
const HOLDOUT_FILE = path.join(__dirname, 'holdout.json');
const OUTPUT_FILE = path.join(__dirname, 'verification.json');
const EXPECTED_CODE_IDENTITY = 'c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7';
const EXPECTED_SCREEN_IDENTITY = 'b4416954a024f790ac8aa1ad5a94c95f075d46bcf9a564c83b02ffce87f469bf';
const EXPECTED_HOLDOUT_IDENTITY = '83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0';

const CODE_FILES = [
  'solver/target-aware-challenger.js',
  'solver/target-aware-evaluation.js',
  'solver/target-aware-worker.js',
  'solver/tests/targetAwareChallenger.test.js',
  'solver/tests/targetAwareEvaluation.test.js',
];

const EXPECTED_PROTECTED = {
  'solver/bot.js': '9abe8ca',
  'solver/engine.js': '4e2323b',
  'solver/level-author.js': '305731',
  'solver/generate-levels.js': 'd7a8bf',
  'src/game.js': '949340',
};

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileSha(relative) {
  return sha256(fs.readFileSync(path.join(ROOT, relative)));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function artifactIdentity(artifact) {
  const { artifactIdentity: ignored, ...body } = artifact;
  return sha256(canonicalJson(body));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values) {
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function validateArtifact(artifact, expectedMode, expectedLevels, expectedSeeds, expectedIdentity) {
  const errors = [];
  if (artifact.mode !== expectedMode) errors.push(`mode is ${artifact.mode}`);
  if (JSON.stringify(artifact.levelNumbers) !== JSON.stringify(expectedLevels)) errors.push('level list differs');
  if (JSON.stringify(artifact.seeds) !== JSON.stringify(expectedSeeds)) errors.push('seed list differs');
  if (artifact.order !== 'level-major') errors.push(`order is ${artifact.order}`);
  if (artifact.cells.length !== expectedLevels.length * expectedSeeds.length) errors.push('cell count differs');

  const keys = new Set();
  let index = 0;
  for (const level of expectedLevels) {
    for (const seed of expectedSeeds) {
      const cell = artifact.cells[index++];
      if (!cell || cell.level !== level || cell.seed !== seed) errors.push(`cell ${index - 1} is out of order or missing`);
      if (cell) keys.add(`${cell.level}:${cell.seed}`);
    }
  }
  if (keys.size !== artifact.cells.length) errors.push('duplicate cell keys');
  const calculatedIdentity = artifactIdentity(artifact);
  if (calculatedIdentity !== artifact.artifactIdentity) errors.push('embedded identity does not match body');
  if (artifact.artifactIdentity !== expectedIdentity) errors.push('identity differs from sealed execution result');
  return {
    valid: errors.length === 0,
    errors,
    cells: artifact.cells.length,
    uniqueCells: keys.size,
    embeddedIdentity: artifact.artifactIdentity,
    calculatedIdentity,
    fileSha256: sha256(`${JSON.stringify(artifact, null, 2)}\n`),
  };
}

function savingsFor(cell, moveBudgets) {
  if (cell.champion.win && !cell.challenger.win) throw new Error(`win regression at ${cell.level}:${cell.seed}`);
  if (cell.champion.win && cell.challenger.win) return cell.champion.movesToTarget - cell.challenger.movesToTarget;
  if (!cell.champion.win && cell.challenger.win) return moveBudgets.get(cell.level) - cell.challenger.movesToTarget;
  return 0;
}

function summarize(artifact, moveBudgets) {
  const counts = {
    championOnly: 0,
    challengerOnly: 0,
    bothWin: 0,
    bothLose: 0,
    faster: 0,
    slower: 0,
    tied: 0,
    changedCells: 0,
    changedMoves: 0,
  };
  const perLevel = Object.fromEntries(artifact.levelNumbers.map((level) => [level, {
    cells: 0, faster: 0, slower: 0, tied: 0, championOnly: 0, challengerOnly: 0,
    changedCells: 0, savings: [],
  }]));
  const savings = [];
  const scoreDeltas = [];

  for (const cell of artifact.cells) {
    const level = perLevel[cell.level];
    level.cells += 1;
    if (cell.champion.win && !cell.challenger.win) { counts.championOnly += 1; level.championOnly += 1; }
    if (!cell.champion.win && cell.challenger.win) { counts.challengerOnly += 1; level.challengerOnly += 1; }
    if (cell.champion.win && cell.challenger.win) {
      counts.bothWin += 1;
      const delta = cell.champion.movesToTarget - cell.challenger.movesToTarget;
      if (delta > 0) { counts.faster += 1; level.faster += 1; }
      else if (delta < 0) { counts.slower += 1; level.slower += 1; }
      else { counts.tied += 1; level.tied += 1; }
    }
    if (!cell.champion.win && !cell.challenger.win) counts.bothLose += 1;
    if (cell.changedMoveCount > 0) { counts.changedCells += 1; level.changedCells += 1; }
    counts.changedMoves += cell.changedMoveCount;
    const saving = savingsFor(cell, moveBudgets);
    savings.push(saving);
    level.savings.push(saving);
    scoreDeltas.push(cell.challenger.score - cell.champion.score);
  }

  const levelCount = artifact.levelNumbers.length;
  const seedCount = artifact.seeds.length;
  const byLevel = artifact.levelNumbers.map((level) => mean(perLevel[level].savings));
  const bySeed = artifact.seeds.map((ignored, seedIndex) => {
    const values = [];
    for (let levelIndex = 0; levelIndex < levelCount; levelIndex++) {
      values.push(savings[levelIndex * seedCount + seedIndex]);
    }
    return mean(values);
  });
  const average = mean(byLevel);
  const seLevel = sd(byLevel) / Math.sqrt(levelCount);
  const seSeed = sd(bySeed) / Math.sqrt(seedCount);
  const se = Math.max(seLevel, seSeed);
  const t = se === 0 ? (average > 0 ? null : 0) : average / se;
  const fasterLevels = artifact.levelNumbers.filter((level) => perLevel[level].faster > 0 || perLevel[level].challengerOnly > 0);

  const perLevelPublic = Object.fromEntries(artifact.levelNumbers.map((level) => {
    const row = perLevel[level];
    return [level, {
      cells: row.cells,
      faster: row.faster,
      slower: row.slower,
      tied: row.tied,
      championOnly: row.championOnly,
      challengerOnly: row.challengerOnly,
      changedCells: row.changedCells,
      meanMoveSaving: mean(row.savings),
    }];
  }));

  return {
    counts,
    championWins: counts.bothWin + counts.championOnly,
    challengerWins: counts.bothWin + counts.challengerOnly,
    fasterLevels,
    fasterLevelCount: fasterLevels.length,
    moveSavings: {
      mean: average,
      median: median(savings),
      min: Math.min(...savings),
      max: Math.max(...savings),
      seLevel,
      seSeed,
      conservativeSe: se,
      t,
      zeroVariancePositive: se === 0 && average > 0,
    },
    terminationScores: {
      championMean: mean(artifact.cells.map((cell) => cell.champion.score)),
      challengerMean: mean(artifact.cells.map((cell) => cell.challenger.score)),
      meanDelta: mean(scoreDeltas),
      medianDelta: median(scoreDeltas),
    },
    relativeCompute: artifact.timings.challengerMs / artifact.timings.championMs,
    perLevel: perLevelPublic,
  };
}

function main() {
  if (fs.existsSync(OUTPUT_FILE)) throw new Error(`refusing to overwrite ${OUTPUT_FILE}`);
  const screen = JSON.parse(fs.readFileSync(SCREEN_FILE, 'utf8'));
  const holdout = JSON.parse(fs.readFileSync(HOLDOUT_FILE, 'utf8'));
  const expectedScreenLevels = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51, 52];
  const expectedScreenSeeds = Array.from({ length: 40 }, (_, index) => 12000000 + index);
  const expectedHoldoutLevels = Array.from({ length: 52 }, (_, index) => index + 1);
  const expectedHoldoutSeeds = Array.from({ length: 300 }, (_, index) => 13000000 + index);
  const moveBudgets = new Map(LEVELS.map((level) => [level.level, level.moves]));

  const codeHashes = Object.fromEntries(CODE_FILES.map((file) => [file, fileSha(file)]));
  const shasumLines = CODE_FILES.map((file) => `${codeHashes[file]}  ${file}\n`).join('');
  const codeIdentity = sha256(shasumLines);
  const protectedHashes = Object.fromEntries(Object.keys(EXPECTED_PROTECTED).map((file) => [file, fileSha(file)]));
  const protectedPrefixesMatch = Object.entries(EXPECTED_PROTECTED).every(([file, prefix]) => protectedHashes[file].startsWith(prefix));
  const runtimeSourcesMatch = [screen, holdout].every((artifact) => (
    artifact.sources.champion === protectedHashes['solver/bot.js']
    && artifact.sources.engine === protectedHashes['solver/engine.js']
    && artifact.sources.levels === protectedHashes['src/game.js']
    && artifact.sources.challenger === codeHashes['solver/target-aware-challenger.js']
    && artifact.sources.evaluator === codeHashes['solver/target-aware-evaluation.js']
  ));

  const screenValidation = validateArtifact(screen, 'screen', expectedScreenLevels, expectedScreenSeeds, EXPECTED_SCREEN_IDENTITY);
  const holdoutValidation = validateArtifact(holdout, 'holdout', expectedHoldoutLevels, expectedHoldoutSeeds, EXPECTED_HOLDOUT_IDENTITY);
  const screenSummary = summarize(screen, moveBudgets);
  const holdoutSummary = summarize(holdout, moveBudgets);
  const seedsDisjoint = screen.seeds.every((seed) => !new Set(holdout.seeds).has(seed));
  const gates = {
    validArtifacts: screenValidation.valid && holdoutValidation.valid,
    sourceIdentityFixed: codeIdentity === EXPECTED_CODE_IDENTITY && runtimeSourcesMatch,
    protectedHashesMatch: protectedPrefixesMatch,
    seedsDisjoint,
    zeroWinRegressions: holdoutSummary.counts.championOnly === 0,
    zeroSlowerBothWin: holdoutSummary.counts.slower === 0,
    enoughFasterCells: holdoutSummary.counts.faster >= 156,
    enoughFasterLevels: holdoutSummary.fasterLevelCount >= 10,
    positiveClusteredSaving: holdoutSummary.moveSavings.mean > 0
      && (holdoutSummary.moveSavings.zeroVariancePositive || holdoutSummary.moveSavings.t > 3),
  };
  const verdict = Object.values(gates).every(Boolean) ? 'SUPPORTED' : 'NOT_SUPPORTED';
  const result = {
    schemaVersion: 1,
    verdict,
    gates,
    code: { expectedIdentity: EXPECTED_CODE_IDENTITY, calculatedIdentity: codeIdentity, files: codeHashes },
    protected: { prefixesMatch: protectedPrefixesMatch, files: protectedHashes },
    artifacts: { screen: screenValidation, holdout: holdoutValidation, runtimeSourcesMatch, seedsDisjoint },
    screen: screenSummary,
    holdout: holdoutSummary,
  };
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ verdict, gates, holdout: holdoutSummary }, null, 2));
}

main();
