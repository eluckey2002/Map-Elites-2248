const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HEADER, assessFailedRunLedger, parseCsv, scanFailedClosures, scanLegacyFailures,
} = require('../../tools/failed-run-ledger');

const ROOT = path.join(__dirname, '..', '..');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'failed-run-ledger-'));
}

function write(root, rel, body = '') {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

function csvRow(fields) {
  return fields.map((value) => {
    const text = String(value);
    return /[,"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(',');
}

function validRow(overrides = {}) {
  const row = {
    failure_id: 'FR-9999',
    occurred_on: '2026-09-16',
    source_kind: 'closure',
    result_id: 'RESULT-0036',
    run_id: 'RESULT-0036-confirmation-33200000-33200007',
    stage: 'RECOMPUTATION',
    location: 'experiments/RESULT-0036/recompute.js',
    failure_class: 'INSTRUMENT_FAILURE',
    observed_failure: 'The retained decision did not reproduce.',
    root_cause: 'The command reran timeout-sensitive compute.',
    evidence_path: 'experiments/RESULT-0036/closure.json',
    prevention_tier: 'SCRIPT',
    prevention_artifact: 'tools/prevent.js',
    prevention_test: 'solver/tests/prevent.test.js',
    status: 'PREVENTED',
    ...overrides,
  };
  return csvRow(HEADER.map((field) => row[field]));
}

test('CSV parser preserves quoted commas and doubled quotes', () => {
  const rows = parseCsv('a,b\n"one, two","said ""stop"""\n');
  assert.deepEqual(rows, [['a', 'b'], ['one, two', 'said "stop"']]);
  assert.throws(() => parseCsv('a,b\n"unterminated,b\n'), /unterminated/);
  assert.throws(() => parseCsv('a,b\n"closed"x,b\n'), /after a closing quote/);
});

test('LIVE: scanner reads the real retained failed closures', () => {
  const { failures, problems } = scanFailedClosures(ROOT);
  assert.deepEqual(problems, []);
  assert.deepEqual(failures.map(({ resultId }) => resultId), [
    'RESULT-0036', 'RESULT-0037', 'RESULT-0041', 'RESULT-0042',
    'RESULT-0083',
  ]);
  assert.deepEqual(scanLegacyFailures(ROOT), [{
    failureId: 'FR-0005',
    evidencePath: 'docs/failed-runs/FR-0005.md',
  }]);
});

test('a real UNVERIFIED closure fails when its ledger row is absent', () => {
  const root = tempRoot();
  const rel = 'experiments/RESULT-0036/closure.json';
  write(root, rel, fs.readFileSync(path.join(ROOT, rel)));
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n`);
  assert.deepEqual(assessFailedRunLedger(root), [
    'RESULT-0036/RESULT-0036-confirmation-33200000-33200007: retained UNVERIFIED closure has no exact row in FAILED-RUN-LEDGER.CSV',
  ]);
});

test('two failed closures cannot share one run_id and one ledger row', () => {
  const root = tempRoot();
  for (const [resultId, status] of [['RESULT-0001', 'INVALID'], ['RESULT-0002', 'UNVERIFIED']]) {
    write(root, `experiments/${resultId}/closure.json`, JSON.stringify({
      run_id: 'copied-template-run',
      closure_status: status,
    }));
  }
  write(root, 'tools/prevent.js');
  write(root, 'solver/tests/prevent.test.js');
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n${validRow({
    result_id: 'RESULT-0001',
    run_id: 'copied-template-run',
    evidence_path: 'experiments/RESULT-0001/closure.json',
  })}\n`);

  const problems = assessFailedRunLedger(root).join('\n');
  assert.match(problems, /retained failed closures RESULT-0001, RESULT-0002 share a run_id/);
  assert.match(problems, /closure row is ambiguous because copied-template-run identifies 2 retained failed closures/);
  assert.match(problems, /RESULT-0002\/copied-template-run: retained UNVERIFIED closure has no exact row/);
});

test('a ledger row cannot claim prevention through missing files', () => {
  const root = tempRoot();
  const rel = 'experiments/RESULT-0036/closure.json';
  write(root, rel, fs.readFileSync(path.join(ROOT, rel)));
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n${validRow()}\n`);
  const problems = assessFailedRunLedger(root).join('\n');
  assert.match(problems, /prevention_artifact does not resolve/);
  assert.match(problems, /prevention_test does not resolve/);

  write(root, 'tools/prevent.js');
  write(root, 'solver/tests/prevent.test.js');
  assert.deepEqual(assessFailedRunLedger(root), []);
});

test('an intentional failing control inside a CLOSED run is not a failed run', () => {
  const root = tempRoot();
  write(root, 'experiments/RESULT-0001/closure.json', JSON.stringify({
    run_id: 'negative-control-run',
    closure_status: 'CLOSED',
    attempts: [{ id: 'planted-bad-input', exit_code: 1 }],
  }));
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n`);
  assert.deepEqual(assessFailedRunLedger(root), []);
});

test('calendar dates and legacy evidence identities are exact', () => {
  const root = tempRoot();
  write(root, 'docs/failed-runs/FR-9999.md');
  write(root, 'tools/prevent.js');
  write(root, 'solver/tests/prevent.test.js');
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n${validRow({
    occurred_on: '2026-02-30',
    source_kind: 'legacy',
    result_id: 'LEGACY',
    run_id: 'legacy-run',
    evidence_path: 'docs/failed-runs/not-the-failure-id.md',
  })}\n`);
  const problems = assessFailedRunLedger(root).join('\n');
  assert.match(problems, /occurred_on must be a real/);
  assert.match(problems, /legacy evidence_path must be docs\/failed-runs\/FR-9999\.md/);
});

test('a retained legacy incident fails when its CSV row is removed', () => {
  const root = tempRoot();
  write(root, 'docs/failed-runs/FR-0007.md', '# retained failure\n');
  write(root, 'FAILED-RUN-LEDGER.CSV', `${HEADER.join(',')}\n`);
  assert.deepEqual(assessFailedRunLedger(root), [
    'FR-0007: legacy incident has no row in FAILED-RUN-LEDGER.CSV',
  ]);
});

test('LIVE: every retained failed closure has one complete prevention record', () => {
  assert.deepEqual(
    assessFailedRunLedger(ROOT),
    [],
    'Run node tools/failed-run-ledger.js for the exact failed-run ledger defects',
  );
});
