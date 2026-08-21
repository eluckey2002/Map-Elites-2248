#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const { deriveCandidate, serialize, verifyCandidate } = require('./level-author');

const ROOT = path.join(__dirname, '..');
const STORE_PATH = path.join(__dirname, 'candidate-levels.json');
const RECEIPT_PATH = path.join(__dirname, 'candidate-levels.receipt.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function usage() {
  throw new Error('usage: author-level.js --shape <manifest.json> --write | --verify <candidates.json> <receipt.json>');
}

function main(argv = process.argv.slice(2)) {
  if (argv[0] === '--shape' && argv[2] === '--write' && argv.length === 3) {
    const shapePath = path.resolve(ROOT, argv[1]);
    const authored = deriveCandidate(readJson(shapePath));
    fs.writeFileSync(STORE_PATH, serialize(authored.store));
    fs.writeFileSync(RECEIPT_PATH, serialize(authored.receipt));
    const counts = authored.receipt.holdout.terminalCounts;
    process.stdout.write(`WROTE candidate ${authored.receipt.candidateIdentity}\n`);
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

module.exports = { main };
