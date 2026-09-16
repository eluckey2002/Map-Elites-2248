#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { valueIdentity } = require('../benchmark-inputs');
const { ROOT, FROZEN_MANIFEST_ID, loadCorpus, fileHash } = require('./corpus');
const { assessPuzzle } = require('./verify');

const SOURCE_FILES = [
  'solver/oracle/cli.js', 'solver/oracle/corpus.js', 'solver/oracle/worker.js',
  'solver/oracle/search.js', 'solver/oracle/simulation.js', 'solver/oracle/verify.js',
  'solver/engine.js', 'solver/bot.js', 'solver/benchmark-inputs.js',
  'solver/benchmark-replay.js', 'solver/human-benchmark.js', 'solver/recording-replay.js', 'src/game.js',
];
const sourceIdentities = () => Object.fromEntries(SOURCE_FILES.map(file => [file, fileHash(path.join(ROOT, file))]));

function runPuzzle(input, budgetMs = 30000) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = fork(path.join(__dirname, 'worker.js'), [], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    let latest = { baseline: null, best: null, stats: {}, searchMs: 0, standing: 'UNKNOWN' };
    let done = false;
    const finish = (result, error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill();
      if (error) reject(error);
      else resolve({ ...result, controllerMs: performance.now() - started });
    };
    const timer = setTimeout(() => finish({
      ...latest, searchMs: budgetMs, standing: latest.best ? 'best-known' : 'UNKNOWN', terminationReason: 'process-deadline',
    }), budgetMs);
    child.on('message', message => {
      if (message.type === 'progress' && message.progress.searchMs <= budgetMs) latest = message.progress;
      if (message.type === 'done') finish(message.result);
      if (message.type === 'error') finish(null, new Error(message.message));
    });
    child.on('error', error => finish(null, error));
    child.on('exit', code => {
      if (!done) finish(null, new Error(`oracle worker exited before a result (${code})`));
    });
    // No recordings, human targets, or human paths cross this process interface.
    child.send({ level: input.level, seed: input.seed, budgetMs: Math.max(1, budgetMs - 100) });
  });
}

function verifyReport(report, manifest = loadCorpus()) {
  assert.equal(manifest.manifestIdentity, FROZEN_MANIFEST_ID, 'untrusted manifest');
  assert.equal(report.manifestIdentity, FROZEN_MANIFEST_ID, 'report corpus identity');
  const { reportIdentity, ...body } = report;
  assert.equal(valueIdentity(body), reportIdentity, 'report identity mismatch');
  assert.deepEqual(report.sources, sourceIdentities(), 'report source identities differ from this implementation');
  assert.equal(report.rows.length, manifest.puzzles.length, 'missing puzzle rows');
  assert.equal(new Set(report.rows.map(row => row.puzzleIdentity)).size, manifest.puzzles.length, 'duplicate puzzle rows');
  assert.ok(report.budgetMs > 0 && report.budgetMs <= 30000, 'invalid report budget');
  const byId = new Map(manifest.puzzles.map(puzzle => [puzzle.puzzleIdentity, puzzle]));
  const checked = report.rows.map(row => {
    const puzzle = byId.get(row.puzzleIdentity);
    assert.ok(puzzle, 'unknown puzzle');
    assert.ok(row.result.searchMs <= report.budgetMs, 'declared budget exceeded');
    const assessment = assessPuzzle(puzzle, row.result);
    assert.deepEqual(row.assessment, assessment, 'forged comparison');
    return assessment;
  });
  const pass = checked.every(row => row.pass);
  assert.equal(report.pass, pass, 'forged overall result');
  return { valid: true, pass, puzzles: checked.length, wins: checked.filter(row => row.oracleMoves !== null).length };
}

async function main(argv = process.argv.slice(2)) {
  const option = name => {
    const index = argv.indexOf(name);
    if (index === -1) return null;
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    return value;
  };
  if (option('--verify')) {
    const checked = verifyReport(JSON.parse(fs.readFileSync(option('--verify'), 'utf8')));
    console.log(JSON.stringify(checked));
    return checked.pass ? 0 : 1;
  }
  const out = option('--out');
  if (!out) throw new Error('usage: node solver/oracle/cli.js --out <new-report.json> [--budget-ms 30000] [--puzzle <id-prefix>] | --verify <report.json>');
  if (fs.existsSync(out)) throw new Error('refusing to overwrite an existing report');
  const budgetMs = Number(option('--budget-ms') || 30000);
  if (!Number.isInteger(budgetMs) || budgetMs < 200 || budgetMs > 30000) throw new Error('budget must be an integer from 200 to 30000 milliseconds');
  const loadingStarted = performance.now();
  const manifest = loadCorpus();
  const sources = sourceIdentities();
  const selected = option('--puzzle');
  const puzzles = manifest.puzzles.filter(puzzle => !selected || puzzle.puzzleIdentity.startsWith(selected));
  if (!puzzles.length) throw new Error('no matching puzzles');
  const loadingMs = performance.now() - loadingStarted;
  const rows = [];
  console.log('puzzle    level seed        human bot oracle saved search-ms result');
  for (const puzzle of puzzles) {
    const result = await runPuzzle(puzzle.input, budgetMs);
    const verifyStarted = performance.now();
    const assessment = assessPuzzle(puzzle, result);
    const verificationMs = performance.now() - verifyStarted;
    rows.push({ puzzleIdentity: puzzle.puzzleIdentity, result, assessment, verificationMs });
    console.log(`${puzzle.puzzleIdentity.slice(0, 8)} ${String(puzzle.recordings[0].levelNumber).padStart(5)} ${String(puzzle.input.seed).padStart(10)} ${String(assessment.humanBestMoves ?? '-').padStart(5)} ${String(assessment.botMoves ?? '-').padStart(3)} ${String(assessment.oracleMoves ?? '-').padStart(6)} ${String(assessment.movesSaved ?? '-').padStart(5)} ${result.searchMs.toFixed(0).padStart(9)} ${assessment.pass ? 'PASS' : 'FAIL'}`);
  }
  const body = {
    schemaVersion: 1, manifestIdentity: manifest.manifestIdentity, sources,
    claim: 'best-known replayed solutions on the identified development corpus; no optimality or generalization',
    budgetMs, loadingMs, completeCorpus: rows.length === manifest.puzzles.length,
    pass: rows.length === manifest.puzzles.length && rows.every(row => row.assessment.pass), rows,
  };
  const report = { ...body, reportIdentity: valueIdentity(body) };
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  if (body.completeCorpus) console.log(JSON.stringify(verifyReport(report, manifest)));
  else console.log('Partial diagnostic only; this cannot satisfy the corpus goal.');
  return report.pass ? 0 : 1;
}

if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(error.stack); process.exitCode = 2;
});
module.exports = { runPuzzle, sourceIdentities, verifyReport, main };
