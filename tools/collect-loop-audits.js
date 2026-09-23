#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const VOCABULARY = Object.freeze({
  recordType: ['single run', 'audit'],
  result: ['passed', 'failed', 'stopped at limit'],
  rung: [
    'generate once',
    'reread and revise',
    'one external check',
    'external check repeated',
    'repeated with varied inputs',
    'rank candidates',
    'unknown',
  ],
  loopKind: ['code loop', 'gate', 'agent process'],
  sameSourcePair: [
    'no',
    'identical rerun in the same process',
    'identical rerun later',
    'shared functions',
    'duplicated code',
  ],
  trigger: ['test suite', 'push hook', 'continuous integration', 'by hand', 'nothing'],
  blocks: ['yes', 'no', 'by rule only'],
  stopRule: ['fixed count', 'plateau', 'target reached', 'budget', 'none'],
  recommendation: [
    'none',
    'remove a stage',
    'rename a stage',
    'add a stop rule',
    'wire a trigger',
    'make it block',
    'record cost',
  ],
  sourceUsed: ['rereading', 'external check', 'repetition', 'comparison'],
  triggerClass: ['defect in the work', 'defect in the specification', 'scheduled', 'reviewer finding'],
  changedResult: ['yes', 'no', 'unknown'],
  confound: [
    'none',
    'artifact changed between rounds',
    'reviewer ran its own probes',
    'different reviewer',
    'unknown',
  ],
});

const SECTION_NAMES = Object.freeze({
  pin: 'Part 1. Pin',
  run: 'Part 2. Run record',
  loops: 'Part 3. Loop inventory',
  rounds: 'Part 4. Extra rounds',
  unavailable: 'Part 5. Could not audit',
});

function splitTableRow(line) {
  const source = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let current = '';
  let escaped = false;
  let inCode = false;
  for (const character of source) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === '\\') {
      current += character;
      escaped = true;
    } else if (character === '`') {
      current += character;
      inCode = !inCode;
    } else if (character === '|' && !inCode) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tablesBySection(text) {
  const sections = new Map();
  let section = '';
  let active = null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  function finishTable() {
    if (!active || active.length < 2) {
      active = null;
      return;
    }
    const header = splitTableRow(active[0]);
    if (!isSeparatorRow(splitTableRow(active[1]))) {
      active = null;
      return;
    }
    const rows = active.slice(2).map(splitTableRow).filter((row) => row.some(Boolean));
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push({ header, rows });
    active = null;
  }

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      finishTable();
      section = heading[1];
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (!active) active = [];
      active.push(line);
    } else {
      finishTable();
    }
  }
  finishTable();
  return sections;
}

function rowsAsObjects(table) {
  if (!table) return [];
  return table.rows.map((cells) => Object.fromEntries(table.header.map((name, index) => [name, cells[index] || ''])));
}

function fieldTable(sectionTables) {
  const table = (sectionTables || []).find((candidate) => (
    candidate.header.length === 2 && candidate.header[0] === 'Field' && candidate.header[1] === 'Value'
  ));
  return Object.fromEntries(rowsAsObjects(table).map((row) => [row.Field, row.Value]));
}

function valuesFromCell(cell) {
  return cell.split(';').map((value) => value.trim()).filter(Boolean);
}

function controlledValue(value, allowed, options = {}) {
  if (allowed.includes(value)) return value;
  if (options.allowExplanation) {
    const match = allowed.find((word) => value.startsWith(`${word} (`));
    if (match && value.endsWith(')')) return match;
  }
  if (options.allowOther && /^other \(.+\)$/.test(value)) return 'other';
  return null;
}

function problem(file, section, row, field, value, message) {
  return { file, section, row, field, value, message };
}

function requireValue(problems, file, section, row, field, value) {
  if (!value || !value.trim()) problems.push(problem(file, section, row, field, value || '', 'required value is missing'));
}

function validateSingle(problems, file, section, row, field, value, allowed) {
  if (!value) return requireValue(problems, file, section, row, field, value);
  if (!controlledValue(value, allowed)) {
    problems.push(problem(file, section, row, field, value, 'unknown controlled value'));
  }
}

function validateMulti(problems, file, section, row, field, value, allowed, options = {}) {
  if (!value) return requireValue(problems, file, section, row, field, value);
  for (const item of valuesFromCell(value)) {
    if (!controlledValue(item, allowed, options)) {
      problems.push(problem(file, section, row, field, item, 'unknown controlled value'));
    }
  }
}

function basisKind(value) {
  if (/^verified(?:\s|\[)/.test(value) && /;\s*inferred(?:\s|\[)/.test(value)) return 'mixed';
  if (/^verified(?:\s|\[)/.test(value)) return 'verified';
  if (/^inferred(?:\s|\[)/.test(value)) return 'inferred';
  return null;
}

function parseRecord(text, file = '<memory>') {
  const sections = tablesBySection(text);
  const problems = [];
  const pinFields = fieldTable(sections.get(SECTION_NAMES.pin));
  const runFields = fieldTable(sections.get(SECTION_NAMES.run));
  const loopTable = (sections.get(SECTION_NAMES.loops) || [])[0];
  const roundTable = (sections.get(SECTION_NAMES.rounds) || [])[0];
  const unavailableTable = (sections.get(SECTION_NAMES.unavailable) || [])[0];
  const pin = {
    project: pinFields.Project || '',
    date: pinFields.Date || '',
    commit: pinFields['Commit hash (`git rev-parse --short HEAD`)'] || '',
    recordType: pinFields['Record type'] || '',
    filledInBy: pinFields['Filled in by'] || '',
  };
  const run = {
    task: runFields.Task || '',
    ceiling: runFields.Ceiling || '',
    startingRung: runFields['Starting rung'] || '',
    endingRung: runFields['Ending rung'] || '',
    result: runFields.Result || '',
  };
  const loops = rowsAsObjects(loopTable);
  const extraRounds = rowsAsObjects(roundTable);
  const couldNotAudit = rowsAsObjects(unavailableTable);

  for (const [row, value] of Object.entries({
    Project: pin.project,
    Date: pin.date,
    'Commit hash': pin.commit,
    'Record type': pin.recordType,
    'Filled in by': pin.filledInBy,
  })) requireValue(problems, file, SECTION_NAMES.pin, row, 'Value', value);
  if (pin.recordType) validateSingle(problems, file, SECTION_NAMES.pin, 'Record type', 'Value', pin.recordType, VOCABULARY.recordType);

  for (const [row, value] of Object.entries({ Task: run.task, Ceiling: run.ceiling, 'Starting rung': run.startingRung, 'Ending rung': run.endingRung, Result: run.result })) {
    requireValue(problems, file, SECTION_NAMES.run, row, 'Value', value);
  }
  if (run.ceiling) validateMulti(problems, file, SECTION_NAMES.run, 'Ceiling', 'Value', run.ceiling, VOCABULARY.rung);
  if (run.startingRung) validateMulti(problems, file, SECTION_NAMES.run, 'Starting rung', 'Value', run.startingRung, VOCABULARY.rung);
  if (run.endingRung) validateMulti(problems, file, SECTION_NAMES.run, 'Ending rung', 'Value', run.endingRung, VOCABULARY.rung);
  if (run.result) validateSingle(problems, file, SECTION_NAMES.run, 'Result', 'Value', run.result, VOCABULARY.result);

  if (pin.recordType === 'audit' && !loopTable) {
    problems.push(problem(file, SECTION_NAMES.loops, '', '', '', 'required audit section is missing'));
  }
  for (const row of loops) {
    const name = row.Loop || '<unnamed loop>';
    requireValue(problems, file, SECTION_NAMES.loops, name, 'Loop', row.Loop);
    requireValue(problems, file, SECTION_NAMES.loops, name, 'Entry (file:line)', row['Entry (file:line)']);
    validateSingle(problems, file, SECTION_NAMES.loops, name, 'Loop kind', row['Loop kind'], VOCABULARY.loopKind);
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Ceiling', row.Ceiling, VOCABULARY.rung);
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Runs at', row['Runs at'], VOCABULARY.rung);
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Same-source pair', row['Same-source pair'], VOCABULARY.sameSourcePair, { allowExplanation: true });
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Trigger', row.Trigger, VOCABULARY.trigger);
    validateSingle(problems, file, SECTION_NAMES.loops, name, 'Blocks', row.Blocks, VOCABULARY.blocks);
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Stop rule', row['Stop rule'], VOCABULARY.stopRule, { allowExplanation: true });
    if (!(row['Cost evidence'] === 'no' || /^yes(?:\b|,)/.test(row['Cost evidence']))) {
      problems.push(problem(file, SECTION_NAMES.loops, name, 'Cost evidence', row['Cost evidence'], 'unknown controlled value'));
    }
    validateMulti(problems, file, SECTION_NAMES.loops, name, 'Recommendation', row.Recommendation, VOCABULARY.recommendation);
    if (!basisKind(row.Basis)) problems.push(problem(file, SECTION_NAMES.loops, name, 'Basis', row.Basis, 'unknown controlled value'));
  }

  for (const row of extraRounds) {
    const name = row['Loop or run family'] || '<unnamed round>';
    requireValue(problems, file, SECTION_NAMES.rounds, name, 'Round', row.Round);
    validateMulti(problems, file, SECTION_NAMES.rounds, name, 'Source used', row['Source used'], VOCABULARY.sourceUsed, { allowOther: true });
    validateSingle(problems, file, SECTION_NAMES.rounds, name, 'Trigger class', row['Trigger class'], VOCABULARY.triggerClass);
    validateSingle(problems, file, SECTION_NAMES.rounds, name, 'Changed the result', row['Changed the result'], VOCABULARY.changedResult);
    validateMulti(problems, file, SECTION_NAMES.rounds, name, 'Confound', row.Confound, VOCABULARY.confound);
    requireValue(problems, file, SECTION_NAMES.rounds, name, 'Evidence (file:line)', row['Evidence (file:line)']);
    if (!basisKind(row.Basis)) problems.push(problem(file, SECTION_NAMES.rounds, name, 'Basis', row.Basis, 'unknown controlled value'));
  }

  for (const row of couldNotAudit) {
    const name = row.Loop || '<unnamed loop>';
    requireValue(problems, file, SECTION_NAMES.unavailable, name, 'Loop', row.Loop);
    requireValue(problems, file, SECTION_NAMES.unavailable, name, 'Reason', row.Reason);
    requireValue(problems, file, SECTION_NAMES.unavailable, name, 'Evidence', row.Evidence);
  }

  return { file, pin, run, loops, extraRounds, couldNotAudit, problems };
}

function discoverRecordFiles(inputs) {
  const found = new Set();
  function visit(target, explicit = false) {
    const resolved = path.resolve(target);
    if (!fs.existsSync(resolved)) throw new Error(`input does not exist: ${target}`);
    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
      if (explicit || /^loop-ladder-record.*\.md$/i.test(path.basename(resolved))) found.add(resolved);
      return;
    }
    const entries = fs.readdirSync(resolved, { withFileTypes: true })
      .filter((entry) => entry.name !== '.git' && entry.name !== 'node_modules')
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) visit(path.join(resolved, entry.name), false);
  }
  for (const input of inputs) visit(input, true);
  return [...found].sort((a, b) => a.localeCompare(b));
}

function emptyCounter() {
  return Object.create(null);
}

function increment(counter, value) {
  counter[value] = (counter[value] || 0) + 1;
}

function incrementCell(counter, cell, allowed, options = {}) {
  for (const raw of valuesFromCell(cell)) {
    const value = controlledValue(raw, allowed, options);
    if (value) increment(counter, value);
  }
}

function sortedCounter(counter) {
  return Object.fromEntries(Object.entries(counter).sort(([a], [b]) => a.localeCompare(b)));
}

function aggregateRecords(records) {
  const counters = {
    recordTypes: emptyCounter(), loopKinds: emptyCounter(), ceilings: emptyCounter(), runsAt: emptyCounter(),
    sameSourcePairs: emptyCounter(), triggers: emptyCounter(), blocks: emptyCounter(), stopRules: emptyCounter(),
    costEvidence: emptyCounter(), recommendations: emptyCounter(), basis: emptyCounter(), sources: emptyCounter(),
    triggerClasses: emptyCounter(), changedResults: emptyCounter(), confounds: emptyCounter(),
  };
  let loopTotal = 0;
  let roundTotal = 0;
  let unavailableTotal = 0;
  for (const record of records) {
    increment(counters.recordTypes, record.pin.recordType);
    unavailableTotal += record.couldNotAudit.length;
    for (const row of record.loops) {
      loopTotal += 1;
      incrementCell(counters.loopKinds, row['Loop kind'], VOCABULARY.loopKind);
      incrementCell(counters.ceilings, row.Ceiling, VOCABULARY.rung);
      incrementCell(counters.runsAt, row['Runs at'], VOCABULARY.rung);
      incrementCell(counters.sameSourcePairs, row['Same-source pair'], VOCABULARY.sameSourcePair, { allowExplanation: true });
      incrementCell(counters.triggers, row.Trigger, VOCABULARY.trigger);
      incrementCell(counters.blocks, row.Blocks, VOCABULARY.blocks);
      incrementCell(counters.stopRules, row['Stop rule'], VOCABULARY.stopRule, { allowExplanation: true });
      increment(counters.costEvidence, /^yes(?:\b|,)/.test(row['Cost evidence']) ? 'yes' : 'no');
      incrementCell(counters.recommendations, row.Recommendation, VOCABULARY.recommendation);
      const basis = basisKind(row.Basis);
      if (basis) increment(counters.basis, basis);
    }
    for (const row of record.extraRounds) {
      roundTotal += 1;
      incrementCell(counters.sources, row['Source used'], VOCABULARY.sourceUsed, { allowOther: true });
      incrementCell(counters.triggerClasses, row['Trigger class'], VOCABULARY.triggerClass);
      incrementCell(counters.changedResults, row['Changed the result'], VOCABULARY.changedResult);
      incrementCell(counters.confounds, row.Confound, VOCABULARY.confound);
    }
  }
  return {
    records: { total: records.length, byType: sortedCounter(counters.recordTypes) },
    loops: {
      total: loopTotal,
      byKind: sortedCounter(counters.loopKinds),
      ceilings: sortedCounter(counters.ceilings),
      runsAt: sortedCounter(counters.runsAt),
      sameSourcePairs: sortedCounter(counters.sameSourcePairs),
      triggers: sortedCounter(counters.triggers),
      blocks: sortedCounter(counters.blocks),
      stopRules: sortedCounter(counters.stopRules),
      costEvidence: sortedCounter(counters.costEvidence),
      recommendations: sortedCounter(counters.recommendations),
      basis: sortedCounter(counters.basis),
    },
    extraRounds: {
      total: roundTotal,
      sources: sortedCounter(counters.sources),
      triggerClasses: sortedCounter(counters.triggerClasses),
      changedResults: sortedCounter(counters.changedResults),
      confounds: sortedCounter(counters.confounds),
    },
    couldNotAudit: { total: unavailableTotal },
  };
}

function collectAuditRecords(inputs) {
  let files;
  try {
    files = discoverRecordFiles(inputs);
  } catch (error) {
    return { schemaVersion: 1, valid: false, inputs: [], records: [], counts: aggregateRecords([]), problems: [{ file: '', section: '', row: '', field: '', value: '', message: error.message }] };
  }
  const records = files.map((file) => parseRecord(fs.readFileSync(file, 'utf8'), file));
  const problems = records.flatMap((record) => record.problems);
  const identities = new Map();
  for (const record of records) {
    const identity = [record.pin.project, record.pin.date, record.pin.commit, record.pin.recordType].join('|');
    if (identities.has(identity)) {
      problems.push(problem(record.file, SECTION_NAMES.pin, 'Record identity', 'Value', identity, `duplicate record identity ${identity}`));
    } else {
      identities.set(identity, record.file);
    }
  }
  return {
    schemaVersion: 1,
    valid: problems.length === 0,
    inputs: files,
    records: records.map(({ problems: ignored, ...record }) => record),
    counts: aggregateRecords(records),
    problems,
  };
}

function parseArgs(argv) {
  const inputs = [];
  let output = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--out') {
      output = argv[index + 1];
      if (!output) throw new Error('--out requires a file path');
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true, inputs: [], output: null };
    } else {
      inputs.push(argument);
    }
  }
  return { help: false, inputs: inputs.length ? inputs : [process.cwd()], output };
}

function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
  if (args.help) {
    process.stdout.write('Usage: node tools/collect-loop-audits.js [--out report.json] <record-or-directory> [...]\n');
    return 0;
  }
  const report = collectAuditRecords(args.inputs);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) fs.writeFileSync(path.resolve(args.output), json);
  else process.stdout.write(json);
  return report.valid ? 0 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = {
  VOCABULARY,
  aggregateRecords,
  collectAuditRecords,
  discoverRecordFiles,
  main,
  parseRecord,
  splitTableRow,
};
