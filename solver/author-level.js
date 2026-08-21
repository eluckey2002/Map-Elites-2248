#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const { deriveCandidate, serialize, verifyCandidate } = require('./level-author');

const ROOT = path.join(__dirname, '..');
const DEFAULT_BASENAME = 'candidate-levels';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function usage() {
  throw new Error(
    'usage: author-level.js --shape <manifest.json> --write [--out <basename>] [--force]\n' +
      '       author-level.js --verify <candidates.json> <receipt.json>',
  );
}

// Authoring used to write only to the hardcoded candidate-levels.* names, so
// producing any other candidate meant backing those two files up, authoring,
// relocating the output, and restoring the backup. That dance ran three times
// in one session, each time temporarily destroying the only passing receipt --
// and it is how level 51's candidate store was lost for good (recordings still
// bind to identity 524f37c0063d61e5, which no receipt carries any more).
function resolveOutputPaths(basename = DEFAULT_BASENAME) {
  if (typeof basename !== 'string' || basename.length === 0) {
    throw new Error('--out requires a basename');
  }
  if (basename !== path.basename(basename) || basename.includes(path.sep) || basename.includes('/')) {
    throw new Error(`--out takes a bare basename, not a path: ${basename}`);
  }
  if (basename.endsWith('.json')) {
    throw new Error(`--out takes a basename without .json: ${basename}`);
  }
  return {
    store: path.join(__dirname, `${basename}.json`),
    receipt: path.join(__dirname, `${basename}.receipt.json`),
  };
}

// Refusing by default is the point: the old behavior overwrote silently, which
// is what destroyed level 51. --force keeps the escape hatch explicit.
function assertWritable(paths, force) {
  if (force) return;
  for (const file of [paths.store, paths.receipt]) {
    if (fs.existsSync(file)) {
      throw new Error(
        `refusing to overwrite ${path.relative(ROOT, file)}; ` +
          'pass --out <basename> to write elsewhere, or --force to overwrite deliberately',
      );
    }
  }
}

function parseWriteArgs(argv) {
  if (argv[0] !== '--shape' || argv[2] !== '--write') return null;
  const options = { shape: argv[1], basename: DEFAULT_BASENAME, force: false };
  let i = 3;
  while (i < argv.length) {
    if (argv[i] === '--out' && i + 1 < argv.length) {
      options.basename = argv[i + 1];
      i += 2;
    } else if (argv[i] === '--force') {
      options.force = true;
      i += 1;
    } else {
      return null;
    }
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const write = parseWriteArgs(argv);
  if (write) {
    const paths = resolveOutputPaths(write.basename);
    assertWritable(paths, write.force);
    const shapePath = path.resolve(ROOT, write.shape);
    const authored = deriveCandidate(readJson(shapePath));
    fs.writeFileSync(paths.store, serialize(authored.store));
    fs.writeFileSync(paths.receipt, serialize(authored.receipt));
    const counts = authored.receipt.holdout.terminalCounts;
    process.stdout.write(`WROTE ${path.relative(ROOT, paths.store)}\n`);
    process.stdout.write(`candidate ${authored.receipt.candidateIdentity}\n`);
    process.stdout.write(`receipt ${authored.receipt.receiptIdentity}\n`);
    process.stdout.write(`holdout wins=${counts.win} lockouts=${counts.noValidMoves} bombs=${counts.bombExploded} total=${counts.total}\n`);
    return authored;
  }

  if (argv[0] === '--verify' && argv.length === 3) {
    const store = readJson(path.resolve(ROOT, argv[1]));
    const receipt = readJson(path.resolve(ROOT, argv[2]));
    const result = verifyCandidate(store, receipt);
    process.stdout.write(`PASS candidate ${result.candidateIdentity}\n`);
    process.stdout.write(`holdout wins=${result.terminalCounts.win} lockouts=${result.terminalCounts.noValidMoves} bombs=${result.terminalCounts.bombExploded} total=${result.terminalCounts.total}\n`);
    return result;
  }

  return usage();
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, resolveOutputPaths, assertWritable, parseWriteArgs, DEFAULT_BASENAME };
