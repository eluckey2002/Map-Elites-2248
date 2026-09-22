#!/usr/bin/env node

const fs = require('node:fs');

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function recompute(corpus) {
  const rows = corpus.rows;
  const arms = corpus.panel.spawnArms.map(({ id }) => {
    const samples = rows.map((row) => row.arms.find(({ arm }) => arm === id));
    return {
      id,
      boards: samples.length,
      notWipedAfterTwo: samples.filter(({ notWipedAfterTwo }) => notWipedAfterTwo).length,
      sustainedAtSix: samples.filter(({ sustainedAtSix }) => sustainedAtSix).length,
      conversionBoards: samples.filter(({ conversionCount }) => conversionCount > 0).length,
      conversionRejoinBoards: samples.filter(({ conversionRejoinCount }) => conversionRejoinCount > 0).length,
      meanFinalScore: mean(samples.map(({ finalScore }) => finalScore)),
      meanFamilyArea: mean(samples.map(({ familyArea }) => familyArea)),
    };
  });
  return {
    schemaVersion: 1,
    result: corpus.result,
    artifactIdentity: corpus.artifactIdentity,
    boardCount: rows.length,
    disposition: corpus.summary.P3.outcome,
    arms,
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: recompute.js <corpus.json>');
  const corpus = JSON.parse(fs.readFileSync(argv[0], 'utf8'));
  process.stdout.write(`${JSON.stringify(recompute(corpus))}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { recompute };
