#!/usr/bin/env node

const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const { requireProtocolOrExit, registrationStamp } = require('../../solver/experiment-guard');
const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');
const {
  ROOT,
  RESULT,
  LEVEL_NUMBERS,
  SEEDS,
  buildCorpus,
  summarize,
  validateCorpus,
} = require('./subject');

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

async function runWorkers(levelNumbers = LEVEL_NUMBERS, seeds = SEEDS) {
  const workerCount = Math.max(1, Math.min(os.cpus().length - 1, 9, levelNumbers.length));
  const chunkSize = Math.ceil(levelNumbers.length / workerCount);
  const chunks = [];
  for (let index = 0; index < levelNumbers.length; index += chunkSize) {
    chunks.push(levelNumbers.slice(index, index + chunkSize));
  }
  const workers = chunks.map(() => new Worker(path.join(__dirname, 'worker.js')));
  try {
    const parts = await Promise.all(chunks.map((levelChunk, index) => new Promise((resolve, reject) => {
      const worker = workers[index];
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.postMessage({ levelNumbers: levelChunk, seeds });
    })));
    return parts.flat();
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}

async function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable confirmation refuses --exploratory');
  if (!argv.includes('--confirm')) throw new Error('reportable run requires --confirm');
  const outputArg = flag(argv, '--out');
  if (!outputArg) throw new Error(`usage: node run.js --confirm --protocol ${RESULT} --out experiments/${RESULT}/corpus.json`);
  const output = path.resolve(ROOT, outputArg);
  const cells = await runWorkers();
  const corpus = buildCorpus(cells, registrationStamp(registration));
  const summary = persistBeforeVerdict({
    file: output,
    artifact: corpus,
    validate: validateCorpus,
    evaluate: summarize,
  });
  process.stdout.write(`${JSON.stringify({ artifactIdentity: corpus.artifactIdentity, ...summary })}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { flag, runWorkers };
