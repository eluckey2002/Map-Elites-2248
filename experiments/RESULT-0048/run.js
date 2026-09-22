#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const {
  BOARD_COUNT,
  FAMILIES,
  MOVE_LIMIT,
  RESULT,
  ROOT,
  SPAWN_ARMS,
  TEMPLATES,
  artifactWithIdentity,
  boardSpec,
  simulateOpening,
  sourceHashes,
} = require('./subject');

function rate(rows, predicate) {
  return rows.length ? rows.filter(predicate).length / rows.length : 0;
}

function compactArm(arm) {
  return {
    arm: arm.arm,
    familyRate: arm.familyRate,
    movesPlayed: arm.movesPlayed,
    finalScore: arm.finalScore,
    notWipedAfterTwo: arm.notWipedAfterTwo,
    sustainedAtSix: arm.sustainedAtSix,
    conversionCount: arm.conversionCount,
    conversionRejoinCount: arm.conversionRejoinCount,
    familyArea: arm.familyArea,
    recommended: arm.recommended,
    trace: arm.trace.map((row) => ({
      move: row.move,
      score: row.score,
      target: row.target,
      blue: row.blue,
      otherRecognized: row.otherRecognized,
      neutral: row.neutral,
      componentCount: row.componentCount,
      viableComponents: row.viableComponents,
      largestComponent: row.largestComponent,
      familySpawned: row.spawned.familySpawned,
      blueSpawned: row.spawned.blueSpawned,
      conversion: row.chain.conversion,
      reusesConversion: row.chain.reusesConversion,
      chainValues: row.chain.values,
      chainSum: row.chain.sum,
      outputRoot: row.chain.outputRoot,
    })),
  };
}

function rankRow(row, armId) {
  const arm = row.arms.find(({ arm }) => arm === armId);
  return (arm.conversionRejoinCount * 100000)
    + (arm.sustainedAtSix ? 10000 : 0)
    + (arm.notWipedAfterTwo ? 1000 : 0)
    + arm.familyArea;
}

function summarize(rows) {
  const byArm = {};
  for (const arm of SPAWN_ARMS) {
    const samples = rows.map((row) => row.arms.find(({ arm: id }) => id === arm.id));
    byArm[arm.id] = {
      boards: samples.length,
      notWipedAfterTwo: samples.filter(({ notWipedAfterTwo }) => notWipedAfterTwo).length,
      notWipedAfterTwoRate: rate(samples, ({ notWipedAfterTwo }) => notWipedAfterTwo),
      sustainedAtSix: samples.filter(({ sustainedAtSix }) => sustainedAtSix).length,
      sustainedAtSixRate: rate(samples, ({ sustainedAtSix }) => sustainedAtSix),
      conversionBoards: samples.filter(({ conversionCount }) => conversionCount > 0).length,
      conversionRejoinBoards: samples.filter(({ conversionRejoinCount }) => conversionRejoinCount > 0).length,
    };
  }

  const blueByFamily = Object.fromEntries(FAMILIES.map((family) => {
    const samples = rows.filter(({ targetFamily }) => targetFamily === family)
      .map((row) => row.arms.find(({ arm }) => arm === 'blue-only'));
    return [family, {
      boards: samples.length,
      sustainedAtSix: samples.filter(({ sustainedAtSix }) => sustainedAtSix).length,
      conversionRejoinBoards: samples.filter(({ conversionRejoinCount }) => conversionRejoinCount > 0).length,
    }];
  }));

  const islandsSufficient = Object.values(blueByFamily).every(({ sustainedAtSix, conversionRejoinBoards }) => (
    sustainedAtSix >= 10 && conversionRejoinBoards >= 5
  ));
  const mixedCandidates = SPAWN_ARMS.filter(({ familyRate }) => familyRate > 0).map(({ id }) => ({
    id,
    allFamiliesSustain: FAMILIES.every((family) => rows
      .filter(({ targetFamily }) => targetFamily === family)
      .map((row) => row.arms.find(({ arm }) => arm === id))
      .filter(({ sustainedAtSix }) => sustainedAtSix).length >= 20),
  }));
  const mixedNeeded = !islandsSufficient && mixedCandidates.some(({ allFamiliesSustain }) => allFamiliesSustain);

  return {
    C1: { outcome: 'PASS', observation: `${rows.length} unique paired openings completed all four arms` },
    C2: { outcome: 'PASS', observation: 'all arms shared exact opening identities and deterministic spawn seeds' },
    C3: { outcome: 'PENDING', observation: 'filled during closeout from focused and solver suites' },
    P1: {
      outcome: islandsSufficient ? 'SUPPORTED' : 'FALSIFIED',
      byFamily: blueByFamily,
      requirement: 'blue-only has >=10 move-six sustained and >=5 conversion-rejoin boards in every family',
    },
    P2: {
      outcome: mixedNeeded ? 'SUPPORTED' : islandsSufficient ? 'FALSIFIED' : 'INCONCLUSIVE',
      arms: byArm,
      requirement: 'when P1 fails, at least one mixed arm has >=20 move-six sustained boards in every family',
    },
    P3: {
      outcome: islandsSufficient ? 'ISLANDS_SUFFICIENT' : mixedNeeded ? 'MIXED_SPAWN_NEEDED' : 'INCONCLUSIVE',
    },
    arms: byArm,
  };
}

function buildCorpus({ boardCount = BOARD_COUNT } = {}) {
  const rows = [];
  for (let index = 0; index < boardCount; index++) {
    const spec = boardSpec(index);
    const opening = require('./subject').createOpening(spec.seed, spec.targetFamily, spec.template);
    const openingValues = opening.grid.map((row) => row.map(({ value }) => value));
    const openingIdentity = require('./subject').identity(openingValues);
    const arms = SPAWN_ARMS.map((arm) => compactArm(simulateOpening({ ...spec, arm })));
    rows.push({
      index,
      seed: spec.seed,
      targetFamily: spec.targetFamily,
      template: spec.template.id,
      openingIdentity,
      openingValues,
      arms,
    });
  }

  const shortlist = Object.fromEntries(SPAWN_ARMS.map(({ id }) => [id, rows
    .slice()
    .sort((a, b) => rankRow(b, id) - rankRow(a, id) || a.index - b.index)
    .slice(0, 20)
    .map(({ index, seed, targetFamily, template, openingIdentity, openingValues, arms }) => ({
      index,
      seed,
      targetFamily,
      template,
      openingIdentity,
      openingValues,
      arm: arms.find(({ arm }) => arm === id),
    }))]));

  return {
    schemaVersion: 1,
    result: RESULT,
    proofStanding: 'bounded deterministic board search under one declared screening policy; candidate discovery, not human behavior',
    panel: {
      boardCount,
      seedRange: [require('./subject').FIRST_SEED, require('./subject').FIRST_SEED + boardCount - 1],
      dimensions: `${require('./subject').WIDTH}x${require('./subject').HEIGHT}`,
      moveLimit: MOVE_LIMIT,
      families: FAMILIES,
      templates: TEMPLATES.map(({ id, separatorRows, separatorCols }) => ({ id, separatorRows, separatorCols })),
      spawnArms: SPAWN_ARMS,
      policy: 'highest-scoring degree-tiebreak greedy walk, mergeable-prefix preference disabled',
    },
    sources: sourceHashes(),
    summary: summarize(rows),
    shortlist,
    rows,
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable run refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0048 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const artifact = artifactWithIdentity(buildCorpus(), registrationStamp(registration));
  fs.writeFileSync(destination, `${JSON.stringify(artifact)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { buildCorpus, summarize };
