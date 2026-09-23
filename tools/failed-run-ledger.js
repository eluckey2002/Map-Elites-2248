#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LEDGER_NAME = 'FAILED-RUN-LEDGER.CSV';
const HEADER = Object.freeze([
  'failure_id',
  'occurred_on',
  'source_kind',
  'result_id',
  'run_id',
  'stage',
  'location',
  'failure_class',
  'observed_failure',
  'root_cause',
  'evidence_path',
  'prevention_tier',
  'prevention_artifact',
  'prevention_test',
  'status',
]);

const FAILED_CLOSURE_STATES = new Set(['INVALID', 'UNVERIFIED']);
const SOURCE_KINDS = new Set(['closure', 'legacy']);
const STAGES = new Set([
  'PREREGISTRATION', 'QUALIFICATION', 'EXECUTION', 'RECOMPUTATION', 'VERDICT', 'CLOSEOUT', 'ADOPTION',
]);
const FAILURE_CLASSES = new Set([
  'SETUP_MISTAKE', 'INSTRUMENT_FAILURE', 'EXECUTION_FAILURE',
  'PROTOCOL_MISTAKE', 'COORDINATION_FAILURE', 'ENVIRONMENT_FAILURE',
]);
const PREVENTION_TIERS = new Set(['DESIGN_OUT', 'CONTROL', 'SCRIPT', 'WARNING']);

function parseCsvLine(line, lineNumber) {
  const fields = [];
  let value = '';
  let quoted = false;
  let afterQuote = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        value += char;
      }
    } else if (afterQuote) {
      if (char !== ',') throw new Error(`line ${lineNumber} has characters after a closing quote`);
      fields.push(value);
      value = '';
      afterQuote = false;
    } else if (char === ',' ) {
      fields.push(value);
      value = '';
    } else if (char === '"' && value.length === 0) {
      quoted = true;
    } else if (char === '"') {
      throw new Error(`line ${lineNumber} has a quote inside an unquoted field`);
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error(`line ${lineNumber} has an unterminated quoted field; embedded newlines are forbidden`);
  fields.push(value);
  return fields;
}

function isIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseCsv(text) {
  if (text.includes('\r')) throw new Error('CSV must use LF line endings');
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (!lines.length) throw new Error('CSV is empty');
  if (lines.some((line) => line === '')) throw new Error('CSV contains a blank physical row');
  return lines.map((line, index) => parseCsvLine(line, index + 1));
}

function repoFileProblem(root, rel, label) {
  if (!rel || path.isAbsolute(rel)) return `${label} must be a repository-relative file path`;
  const resolved = path.resolve(root, rel);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    return `${label} escapes the repository (${rel})`;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return `${label} does not resolve to a file (${rel})`;
  }
  return null;
}

function scanFailedClosures(root = ROOT) {
  const failures = [];
  const problems = [];
  const experiments = path.join(root, 'experiments');
  if (!fs.existsSync(experiments)) return { failures, problems };
  const resultIds = fs.readdirSync(experiments, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^RESULT-\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  for (const resultId of resultIds) {
    const rel = path.posix.join('experiments', resultId, 'closure.json');
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    let closure;
    try {
      closure = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      problems.push(`${rel} is not parseable JSON (${error.message})`);
      continue;
    }
    if (!FAILED_CLOSURE_STATES.has(closure.closure_status)) continue;
    if (typeof closure.run_id !== 'string' || closure.run_id.length === 0) {
      problems.push(`${rel} has failure status ${closure.closure_status} but no run_id`);
      continue;
    }
    failures.push({ resultId, runId: closure.run_id, status: closure.closure_status, evidencePath: rel });
  }
  return { failures, problems };
}

function scanLegacyFailures(root = ROOT) {
  const directory = path.join(root, 'docs', 'failed-runs');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^FR-\d{4}\.md$/.test(entry.name))
    .map((entry) => ({
      failureId: entry.name.slice(0, -3),
      evidencePath: path.posix.join('docs', 'failed-runs', entry.name),
    }))
    .sort((left, right) => left.failureId.localeCompare(right.failureId));
}

function rowObjects(rows, problems) {
  const header = rows[0];
  if (header.join(',') !== HEADER.join(',')) {
    problems.push(`${LEDGER_NAME} header differs; expected ${HEADER.join(',')}`);
    return [];
  }
  const records = [];
  for (let index = 1; index < rows.length; index++) {
    if (rows[index].length !== HEADER.length) {
      problems.push(`${LEDGER_NAME} line ${index + 1} has ${rows[index].length} fields; expected ${HEADER.length}`);
      continue;
    }
    records.push(Object.fromEntries(HEADER.map((name, column) => [name, rows[index][column]])));
  }
  return records;
}

function assessFailedRunLedger(root = ROOT) {
  const problems = [];
  const ledger = path.join(root, LEDGER_NAME);
  const scan = scanFailedClosures(root);
  const legacyFailures = scanLegacyFailures(root);
  problems.push(...scan.problems);
  if (!fs.existsSync(ledger)) {
    problems.push(
      `${LEDGER_NAME} is missing; ${scan.failures.length} retained failed closure(s) and `
      + `${legacyFailures.length} legacy failure record(s) require rows`,
    );
    return problems;
  }
  let records;
  try {
    records = rowObjects(parseCsv(fs.readFileSync(ledger, 'utf8')), problems);
  } catch (error) {
    problems.push(`${LEDGER_NAME} cannot be parsed (${error.message})`);
    return problems;
  }

  const ids = new Set();
  const runIds = new Set();
  const closureByRun = new Map(scan.failures.map((failure) => [failure.runId, failure]));
  for (const record of records) {
    const label = record.failure_id || '<missing failure_id>';
    if (!/^FR-\d{4}$/.test(record.failure_id)) problems.push(`${label}: failure_id must be FR-NNNN`);
    if (ids.has(record.failure_id)) problems.push(`${label}: duplicate failure_id`);
    ids.add(record.failure_id);
    if (!isIsoDate(record.occurred_on)) {
      problems.push(`${label}: occurred_on must be a real YYYY-MM-DD date`);
    }
    if (!SOURCE_KINDS.has(record.source_kind)) problems.push(`${label}: source_kind must be closure or legacy`);
    if (!record.run_id) problems.push(`${label}: run_id is required`);
    if (runIds.has(record.run_id)) problems.push(`${label}: duplicate run_id ${record.run_id}`);
    runIds.add(record.run_id);
    if (!STAGES.has(record.stage)) problems.push(`${label}: unrecognized stage ${record.stage}`);
    if (!record.location) problems.push(`${label}: location is required`);
    if (!FAILURE_CLASSES.has(record.failure_class)) problems.push(`${label}: unrecognized failure_class ${record.failure_class}`);
    if (!record.observed_failure) problems.push(`${label}: observed_failure is required`);
    if (!record.root_cause) problems.push(`${label}: root_cause is required`);
    if (!PREVENTION_TIERS.has(record.prevention_tier)) problems.push(`${label}: unrecognized prevention_tier ${record.prevention_tier}`);
    if (record.status !== 'PREVENTED') problems.push(`${label}: status must be PREVENTED before the experiment gate can pass`);

    for (const [field, value] of [
      ['evidence_path', record.evidence_path],
      ['prevention_artifact', record.prevention_artifact],
      ['prevention_test', record.prevention_test],
    ]) {
      const problem = repoFileProblem(root, value, `${label}: ${field}`);
      if (problem) problems.push(problem);
    }

    if (record.source_kind === 'closure') {
      const failure = closureByRun.get(record.run_id);
      if (!failure) {
        problems.push(`${label}: closure row does not match a retained INVALID or UNVERIFIED run (${record.run_id})`);
      } else {
        if (record.result_id !== failure.resultId) {
          problems.push(`${label}: result_id ${record.result_id} does not match ${failure.resultId}`);
        }
        if (record.evidence_path !== failure.evidencePath) {
          problems.push(`${label}: evidence_path must be the discovered closure receipt ${failure.evidencePath}`);
        }
      }
    } else {
      if (record.result_id !== 'LEGACY') problems.push(`${label}: legacy rows must use result_id LEGACY`);
      const expectedEvidence = `docs/failed-runs/${record.failure_id}.md`;
      if (record.evidence_path !== expectedEvidence) {
        problems.push(`${label}: legacy evidence_path must be ${expectedEvidence}`);
      }
      if (!legacyFailures.some((failure) => failure.failureId === record.failure_id)) {
        problems.push(`${label}: legacy row has no discoverable ${expectedEvidence}`);
      }
    }
  }

  for (const failure of scan.failures) {
    const matching = records.filter((record) => record.source_kind === 'closure' && record.run_id === failure.runId);
    if (matching.length === 0) {
      problems.push(`${failure.runId}: retained ${failure.status} closure has no row in ${LEDGER_NAME}`);
    } else if (matching.length > 1) {
      problems.push(`${failure.runId}: retained closure has ${matching.length} ledger rows; expected exactly one`);
    }
  }
  for (const failure of legacyFailures) {
    const matching = records.filter(
      (record) => record.source_kind === 'legacy' && record.failure_id === failure.failureId,
    );
    if (matching.length === 0) {
      problems.push(`${failure.failureId}: legacy incident has no row in ${LEDGER_NAME}`);
    } else if (matching.length > 1) {
      problems.push(`${failure.failureId}: legacy incident has ${matching.length} ledger rows; expected exactly one`);
    }
  }
  return problems;
}

function main() {
  const problems = assessFailedRunLedger();
  if (problems.length) {
    console.error('FAILED-RUN LEDGER INVALID');
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }
  const { failures } = scanFailedClosures();
  const legacy = scanLegacyFailures();
  console.log(
    `FAILED-RUN LEDGER PASS (${failures.length} retained failed closures and ${legacy.length} legacy incident(s) covered)`,
  );
}

if (require.main === module) main();

module.exports = {
  HEADER, assessFailedRunLedger, parseCsv, scanFailedClosures, scanLegacyFailures,
};
