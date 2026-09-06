const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { collect, discoverRecordingPaths, playBot, renderText } = require('../human-benchmark');
const { fileSha256, valueIdentity } = require('../benchmark-inputs');

const ROOT = path.join(__dirname, '..', '..');

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
    assert.equal(panel.scoreDiagnostic.availableAttempts, rows.length);
    assert.equal(panel.scoreDiagnostic.requiredFiles, panel.fileCount);
    assert.equal(panel.metrics.ranking.convertedWinFraction, panel.metrics.ranking.convertedWins / panel.caseCount);
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
  assert.match(text, /N\/n=/);
  assert.match(text, /faster\/slower\/tied=/);
  assert.match(text, /candidate=[0-9a-f]{64}/);
  assert.match(text, /subject=[0-9a-f]{64}/);
});

function stubPlay(candidate, seed, options = {}) {
  const targetDisabled = options.targetDisabled || options.uncapped;
  const moves = Math.min(options.externalHorizon ?? candidate.moves, 1);
  return {
    validity: 'valid',
    score: targetDisabled ? 100 : candidate.target,
    moves,
    outcome: targetDisabled ? 'horizon-complete' : 'win',
    reason: targetDisabled ? 'external horizon reached' : 'target reached',
    firstCrossing: targetDisabled ? null : moves,
    originalBudget: candidate.moves,
    externalHorizon: options.externalHorizon ?? candidate.moves,
    initialGridIdentity: `controlled-grid-${seed}`,
    initialGrid: [],
    liveRngDrawsAfterInitialization: candidate.gridW * candidate.gridH,
    objective: targetDisabled ? 'target-disabled score diagnostic' : 'target-seeking reference',
    rngScheme: 'controlled test seam',
  };
}

function stageCorpus({ missingPath = null, extra = false, corruptContract = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-eval-corpus-'));
  fs.symlinkSync(path.join(ROOT, 'solver'), path.join(root, 'solver'));
  fs.symlinkSync(path.join(ROOT, 'src'), path.join(root, 'src'));
  fs.symlinkSync(path.join(ROOT, 'pilots'), path.join(root, 'pilots'));
  fs.symlinkSync(path.join(ROOT, 'play-sessions'), path.join(root, 'play-sessions'));
  fs.mkdirSync(path.join(root, 'recordings'));
  for (const name of fs.readdirSync(path.join(ROOT, 'recordings'))) {
    if (!name.endsWith('.json') || `recordings/${name}` === missingPath) continue;
    fs.symlinkSync(path.join(ROOT, 'recordings', name), path.join(root, 'recordings', name));
  }
  if (extra) fs.writeFileSync(path.join(root, 'recordings', 'unexpected-extra.json'), '{}');
  const evalDir = path.join(root, 'docs', 'evaluation', 'POLICY-EVAL-0001');
  fs.mkdirSync(evalDir, { recursive: true });
  for (const name of ['contract.md', 'inputs.json']) {
    fs.copyFileSync(path.join(ROOT, 'docs', 'evaluation', 'POLICY-EVAL-0001', name), path.join(evalDir, name));
  }
  if (corruptContract) fs.appendFileSync(path.join(evalDir, 'contract.md'), '\ncorrupt\n');
  return root;
}

test('a collect-level runtime fault stays unresolved and cannot become wins or score data', () => {
  const fault = () => ({
    validity: 'unresolved', outcome: null, reason: 'measurement fault: controlled runtime fault',
    score: null, moves: null, firstCrossing: null,
  });
  const result = collect({ playBotFn: fault });
  assert.equal(result.unresolved.length, 15);
  assert.equal(result.rows.length, 0);
  const text = renderText(result);
  for (const panel of result.panels) {
    assert.equal(panel.metrics.ranking.verdict, 'UNRESOLVED');
    assert.equal(panel.metrics.ranking.convertedWins, null);
    assert.equal(panel.scoreDiagnostic.percentAvailable, 0);
    assert.equal(panel.scoreDiagnostic.availableAttempts, 0);
    assert.equal(panel.scoreDiagnostic.requiredFiles, panel.fileCount);
    assert.equal(panel.metrics.regressionAttempts, null);
    assert.equal(panel.metrics.regressionCases, null);
    assert.ok(text.includes(`${panel.id}: UNRESOLVED`));
  }
  assert.equal(text.split('regressions unavailable attempts in unavailable cases').length - 1, 2);
  assert.doesNotMatch(text, /undefined|regressions 0 attempts|: ELIGIBLE/);
  assert.match(text, /resolved-subset metrics; full panel UNRESOLVED/);
  assert.match(result.unresolved[0].reasons[0], /reference runtime unresolved: measurement fault: controlled runtime fault/);
});

test('a diagnostic runtime fault stays unresolved and its unavailable score is not aggregated', () => {
  const diagnosticFault = (candidate, seed, options = {}) => options.targetDisabled
    ? {
      validity: 'unresolved', outcome: null, reason: 'measurement fault: controlled diagnostic fault',
      score: null, moves: null, firstCrossing: null,
    }
    : stubPlay(candidate, seed, options);
  const result = collect({ playBotFn: diagnosticFault });
  assert.equal(result.unresolved.length, 15);
  assert.equal(result.rows.length, 0);
  const text = renderText(result);
  for (const panel of result.panels) {
    assert.equal(panel.metrics.ranking.verdict, 'UNRESOLVED');
    assert.equal(panel.metrics.ranking.convertedWins, null);
    assert.equal(panel.scoreDiagnostic.percentAvailable, 0);
    assert.equal(panel.scoreDiagnostic.availableAttempts, 0);
    assert.equal(panel.scoreDiagnostic.requiredFiles, panel.fileCount);
    assert.equal(panel.metrics.regressionAttempts, null);
    assert.equal(panel.metrics.regressionCases, null);
    assert.ok(text.includes(`${panel.id}: UNRESOLVED`));
  }
  assert.equal(text.split('regressions unavailable attempts in unavailable cases').length - 1, 2);
  assert.doesNotMatch(text, /undefined|regressions 0 attempts|: ELIGIBLE/);
  assert.match(text, /resolved-subset metrics; full panel UNRESOLVED/);
  assert.match(result.unresolved[0].reasons[0], /diagnostic runtime unresolved: measurement fault: controlled diagnostic fault/);
});

test('missing required and actual extra files stay visible through collect and render', () => {
  const missingPath = 'recordings/1352aa7a02cdf868c92b47ecb492528c699692699ecfd0da54b990836aef4aea.json';
  const root = stageCorpus({ missingPath, extra: true });
  const result = collect({ root, gitRoot: ROOT, playBotFn: stubPlay });
  assert.equal(result.dispositions.length, 15);
  assert.deepEqual(result.extras.map((entry) => entry.path), ['recordings/unexpected-extra.json']);
  const missing = result.dispositions.find((entry) => entry.path === missingPath);
  assert.deepEqual(missing.reasons, ['missing']);
  const panel = result.panels.find((entry) => entry.id === 'receipt-bound');
  assert.equal(panel.fileCount, 12);
  assert.equal(panel.distinctAttempts, 11);
  assert.equal(panel.metrics.ranking.verdict, 'UNRESOLVED');
  assert.equal(panel.scoreDiagnostic.availableAttempts, 11);
  assert.equal(panel.scoreDiagnostic.requiredFiles, 12);
  assert.equal(panel.metrics.regressionAttempts, 1);
  assert.equal(panel.metrics.regressionCases, 1);
  const text = renderText(result);
  assert.match(text, /resolved-subset metrics; full panel UNRESOLVED/);
  assert.match(text, /regressions 1 attempts in 1 cases/);
  assert.match(text, /score coverage: 11 available attempts across 12 required files/);
  assert.match(text, /unexpected-extra\.json/);
  assert.match(text, /1352aa7a.*unresolved: missing/);
});

test('corrupted frozen package bytes produce an explicit unresolved collect/render result', () => {
  const root = stageCorpus({ corruptContract: true });
  const result = collect({ root, gitRoot: ROOT, playBotFn: stubPlay });
  assert.equal(result.validity, 'unresolved');
  assert.equal(result.failure.reason, 'frozen contract sha256-mismatch');
  assert.equal(result.rows.length, 0);
  assert.match(renderText(result), /measurement UNRESOLVED: frozen contract sha256-mismatch/);
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
