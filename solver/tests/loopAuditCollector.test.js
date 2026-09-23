const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  aggregateRecords,
  collectAuditRecords,
  discoverRecordFiles,
  parseRecord,
} = require('../../tools/collect-loop-audits.js');

const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = path.join(ROOT, 'solver/test-fixtures/loop-ladder/Map-Elites-2248-audit.md');
const CLI = path.join(ROOT, 'tools/collect-loop-audits.js');

function fixtureText() {
  return fs.readFileSync(FIXTURE, 'utf8');
}

test('parses the filled Map-Elites audit without losing inventory rows', () => {
  const record = parseRecord(fixtureText(), FIXTURE);

  assert.deepEqual(record.problems, []);
  assert.equal(record.pin.project, 'Map-Elites-2248');
  assert.equal(record.pin.recordType, 'audit');
  assert.equal(record.loops.length, 20);
  assert.equal(record.extraRounds.length, 16);
  assert.equal(record.couldNotAudit.length, 3);
});

test('aggregates every controlled field and splits multi-valued cells', () => {
  const record = parseRecord(fixtureText(), FIXTURE);
  const counts = aggregateRecords([record]);

  assert.equal(counts.records.total, 1);
  assert.equal(counts.records.byType.audit, 1);
  assert.equal(counts.loops.total, 20);
  assert.equal(counts.loops.byKind['code loop'], 9);
  assert.equal(counts.loops.byKind.gate, 9);
  assert.equal(counts.loops.byKind['agent process'], 2);
  assert.equal(counts.loops.triggers['continuous integration'], 6);
  assert.equal(counts.loops.recommendations['record cost'], 3);
  assert.equal(counts.loops.costEvidence.no, 18);
  assert.equal(counts.extraRounds.total, 16);
  assert.equal(counts.extraRounds.sources.rereading, 7);
  assert.equal(counts.extraRounds.sources['external check'], 8);
  assert.equal(counts.extraRounds.confounds['artifact changed between rounds'], 4);
  assert.equal(counts.couldNotAudit.total, 3);
});

test('reports unknown vocabulary and missing required pins precisely', () => {
  const bad = fixtureText()
    .replace('| Project | Map-Elites-2248 |', '| Project | |')
    .replace('| Level sweep | code loop |', '| Level sweep | mystery loop |');
  const record = parseRecord(bad, 'bad.md');

  assert.deepEqual(record.problems, [
    {
      file: 'bad.md',
      section: 'Part 1. Pin',
      row: 'Project',
      field: 'Value',
      value: '',
      message: 'required value is missing',
    },
    {
      file: 'bad.md',
      section: 'Part 3. Loop inventory',
      row: 'Level sweep',
      field: 'Loop kind',
      value: 'mystery loop',
      message: 'unknown controlled value',
    },
  ]);
});

test('discovers recursively in stable order, ignores templates, and accepts explicit files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-audit-discovery-'));
  const nested = path.join(temp, 'b', 'nested');
  fs.mkdirSync(nested, { recursive: true });
  const first = path.join(temp, 'loop-ladder-record-a.md');
  const second = path.join(nested, 'loop-ladder-record-z.md');
  const explicit = path.join(temp, 'custom.md');
  fs.writeFileSync(first, fixtureText());
  fs.writeFileSync(second, fixtureText());
  fs.writeFileSync(explicit, fixtureText());
  fs.writeFileSync(path.join(temp, 'run-record-template.md'), '# Loop ladder record\n');

  assert.deepEqual(discoverRecordFiles([temp]), [first, second].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(discoverRecordFiles([explicit]), [explicit]);
});

test('collector retains duplicate identity diagnostics in its report', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-audit-duplicates-'));
  fs.writeFileSync(path.join(temp, 'loop-ladder-record-one.md'), fixtureText());
  fs.writeFileSync(path.join(temp, 'loop-ladder-record-two.md'), fixtureText());

  const report = collectAuditRecords([temp]);

  assert.equal(report.valid, false);
  assert.equal(report.records.length, 2);
  assert.deepEqual(report.problems.map((problem) => problem.message), [
    'duplicate record identity Map-Elites-2248|2026-09-19|9d125e8 (branch main)|audit',
  ]);
});

test('CLI writes deterministic JSON and exits nonzero with a diagnostic report for invalid input', () => {
  const valid = spawnSync(process.execPath, [CLI, FIXTURE], { encoding: 'utf8' });
  assert.equal(valid.status, 0, valid.stderr);
  const validReport = JSON.parse(valid.stdout);
  assert.equal(validReport.valid, true);
  assert.equal(validReport.counts.loops.total, 20);

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-audit-cli-'));
  const output = path.join(temp, 'report.json');
  const badPath = path.join(temp, 'bad.md');
  fs.writeFileSync(badPath, fixtureText().replace('| Record type | audit |', '| Record type | diary |'));
  const invalid = spawnSync(process.execPath, [CLI, '--out', output, badPath], { encoding: 'utf8' });

  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, '');
  const invalidReport = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(invalidReport.valid, false);
  assert.match(invalidReport.problems[0].message, /unknown controlled value/);
});
