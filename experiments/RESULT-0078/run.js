#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { requireProtocolOrExit, registrationStamp } = require('../../solver/experiment-guard');
const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');
const { RESULT, ROOT, LEVEL_NUMBERS, SEEDS, buildCorpus, evaluatePair, validateCorpus, summarize } = require('./subject');

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory || !argv.includes('--confirm')) throw new Error('reportable run requires --confirm');
  const index = argv.indexOf('--out'); const out = index === -1 ? null : argv[index + 1];
  if (!out) throw new Error('reportable run requires --out');
  const cells = [];
  for (const number of LEVEL_NUMBERS) { const level = require('../../src/game').LEVELS.find(({ level: value }) => value === number); for (const seed of SEEDS) cells.push(evaluatePair(level, seed)); }
  const corpus = buildCorpus(cells, registrationStamp(registration), { qualification: false });
  const file = path.resolve(ROOT, out); if (fs.existsSync(file)) throw new Error('refusing to overwrite corpus');
  const result = persistBeforeVerdict({ file, artifact: corpus, validate: validateCorpus, evaluate: summarize });
  process.stdout.write(`${JSON.stringify({ artifactIdentity: corpus.artifactIdentity, ...result })}\n`);
}
if (require.main === module) main();
module.exports = { main };
