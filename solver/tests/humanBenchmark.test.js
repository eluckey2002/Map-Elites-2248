const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { collect, discoverRecordingPaths, playBot, renderText } = require('../human-benchmark');
const { fileSha256, valueIdentity } = require('../benchmark-inputs');

let cached;
const collectOnce = () => { if (!cached) cached = collect(); return cached; };

test('collect accounts for the frozen 15-file panel without pooling provenance classes', () => {
  const result = collectOnce();
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.contract.id, 'POLICY-EVAL-0001');
  assert.equal(result.contract.requiredFileCount, 15);
  assert.equal(result.dispositions.length, 15);
  assert.deepEqual(result.extras, []);
  assert.deepEqual(result.panels.map((panel) => [panel.id, panel.fileCount]), [
    ['receipt-bound', 12],
    ['current-subject', 3],
  ]);
  assert.equal(result.rows.length + result.dispositions.filter((entry) => entry.disposition !== 'admitted').length, 15);
  assert.ok(!Object.hasOwn(result, 'headline'), 'separate provenance panels must not be pooled into one headline');
  assert.equal(result.measurementSourceIdentity, valueIdentity(result.measurementSources));
  for (const [relative, sha256] of Object.entries(result.measurementSources)) {
    assert.equal(sha256, fileSha256(path.join(__dirname, '..', '..', relative)));
  }
});

test('every admitted row carries replay, source, subject, horizon, and terminal provenance', () => {
  const result = collectOnce();
  for (const row of result.rows) {
    assert.equal(row.disposition, 'admitted');
    assert.equal(row.human.validity, 'valid');
    assert.ok(['win', 'lose'].includes(row.human.outcome));
    assert.ok(row.subjectKey && row.caseKey && row.initialGridIdentity);
    assert.equal(row.reference.originalBudget, row.subject.moves);
    assert.equal(row.diagnostic.externalHorizon, row.human.moves);
    assert.equal(row.diagnostic.originalBudget, row.subject.moves);
    assert.equal(row.diagnostic.objective, 'target-disabled score diagnostic');
    assert.equal(row.scoreDiagnostic.rawDelta, row.human.score - row.diagnostic.score);
    if (row.diagnostic.score === 0) assert.equal(row.scoreDiagnostic.percentOfReference, null);
  }
});

test('panel metrics trace to admitted rows with case-then-attempt weighting', () => {
  const result = collectOnce();
  for (const panel of result.panels) {
    const rows = result.rows.filter((row) => row.panel === panel.id);
    assert.equal(panel.distinctAttempts, rows.length);
    assert.equal(panel.caseCount, new Set(rows.map((row) => row.caseKey)).size);
    assert.equal(panel.metrics.cases.length, panel.caseCount);
    assert.equal(panel.unresolvedCount, 0);
    assert.notEqual(panel.metrics.ranking.verdict, 'UNRESOLVED');
    assert.equal(panel.scoreDiagnostic.percentAvailable, rows.filter((row) => row.scoreDiagnostic.percentOfReference !== null).length);
    assert.equal(panel.scoreDiagnostic.totalAttempts, rows.length);
  }
});

test('unexpected files are surfaced as extras without changing the frozen denominator', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-eval-extra-'));
  fs.mkdirSync(path.join(dir, 'recordings'));
  fs.writeFileSync(path.join(dir, 'recordings', 'surprise.json'), '{}');
  const found = discoverRecordingPaths({ root: dir });
  assert.deepEqual(found, ['recordings/surprise.json']);
});

test('text output states descriptive limits and agrees with raw panel classifications', () => {
  const result = collectOnce();
  const text = renderText(result);
  assert.match(text, /descriptive comparison v2/);
  assert.match(text, /not a population estimate or promotion result/);
  for (const panel of result.panels) {
    assert.match(text, new RegExp(`${panel.id}: ${panel.metrics.ranking.verdict}`));
    assert.match(text, new RegExp(`${panel.fileCount} files, ${panel.distinctAttempts} distinct attempts, ${panel.caseCount} cases`));
    assert.match(text, new RegExp(`regressions ${panel.metrics.regressionAttempts} attempts in ${panel.metrics.regressionCases} cases`));
  }
  assert.match(text, /T=\d+ B=\d+/);
  assert.match(text, /crossing=/);
  assert.match(text, /score delta [+-]?\d+; percent of bot reference/);
});

test('playBot(candidate, seed, { uncapped }) remains compatible while reporting changed semantics', () => {
  const row = collectOnce().rows[0];
  const first = playBot(row.subject, row.seed, { uncapped: true });
  const second = playBot(row.subject, row.seed, { targetDisabled: true });
  assert.deepEqual(first, second);
  assert.equal(first.externalHorizon, row.subject.moves);
  assert.equal(first.originalBudget, row.subject.moves);
  assert.equal(first.objective, 'target-disabled score diagnostic');
});

test('--json flushes one complete JSON document larger than the default pipe buffer', () => {
  const stdout = childProcess.execFileSync(process.execPath, [path.join(__dirname, '..', 'human-benchmark.js'), '--json'], {
    cwd: path.join(__dirname, '..', '..'),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  assert.ok(Buffer.byteLength(stdout) > 65536, 'control must cross the pipe-buffer size that exposed truncation');
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.dispositions.length, 15);
  assert.equal(parsed.measurementSourceIdentity, valueIdentity(parsed.measurementSources));
});
