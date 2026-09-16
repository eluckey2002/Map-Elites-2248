const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { valueIdentity } = require('../benchmark-inputs');
const { loadCorpus, collectCorpus, ROOT } = require('../oracle/corpus');
const { createPuzzle, transition, witness } = require('../oracle/simulation');
const { candidates, search } = require('../oracle/search');
const { verifyWitness, assessPuzzle } = require('../oracle/verify');
const { verifyReport, sourceIdentities } = require('../oracle/cli');

const manifest = loadCorpus();

// Known legal recordings calibrate the checker only. They are never search inputs.
function knownWitness(puzzle, recordingEntry = puzzle.recordings.find(r => r.outcome === 'win')) {
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, recordingEntry.file), 'utf8'));
  let node = createPuzzle(puzzle.input.level, puzzle.input.seed);
  const draws = node.draws;
  for (const action of recording.chains) {
    node = transition(node, action.tiles.map(({ x, y }) => node.state.grid[y][x]), draws);
  }
  return { ...witness(node), outcome: recording.outcome };
}

function seal(body) { return { ...body, reportIdentity: valueIdentity(body) }; }
function reseal(report) { const { reportIdentity, ...body } = report; return seal(body); }
function qualificationReport() {
  const rows = manifest.puzzles.map(puzzle => {
    const known = puzzle.recordings.find(r => r.outcome === 'win' && r.moves === puzzle.humanBestMoves);
    const result = { best: known ? knownWitness(puzzle, known) : null, baseline: null, searchMs: 1 };
    return { puzzleIdentity: puzzle.puzzleIdentity, result, assessment: assessPuzzle(puzzle, result), verificationMs: 0 };
  });
  return seal({ manifestIdentity: manifest.manifestIdentity, sources: sourceIdentities(), budgetMs: 30000, rows, pass: false });
}

test('oracle corpus reads and replays all real recordings, groups exact repeats, retains best wins', () => {
  assert.equal(manifest.recordingCount, 25);
  assert.equal(manifest.puzzles.length, 20);
  assert.equal(manifest.puzzles.filter(p => p.humanBestMoves === null).length, 1);
  assert.equal(collectCorpus().manifestIdentity, manifest.manifestIdentity);
  const split = manifest.puzzles.find(p => p.recordings.some(r => r.levelNumber === 51));
  assert.equal(split.recordings.length, 3);
  assert.equal(split.humanBestMoves, 12);
});

test('full-rule oracle transition replays every real capture including bombs, ice, stones and scale', () => {
  for (const puzzle of manifest.puzzles) for (const recording of puzzle.recordings) {
    const found = knownWitness(puzzle, recording);
    assert.equal(found.score, recording.score);
    assert.equal(verifyWitness(puzzle.input, found).validity, 'valid');
  }
});

test('verifier rejects a planted illegal chain through its public witness seam', () => {
  const puzzle = manifest.puzzles[0];
  const broken = knownWitness(puzzle);
  broken.chains[0].tiles[0].x = -1;
  assert.throws(() => verifyWitness(puzzle.input, broken), /out of bounds/);
});

test('verifier rejects planted wrong spawn and blocker timer in real post-move boards', () => {
  const puzzle = manifest.puzzles.find(p => p.input.level.blockers.some(b => b.type === 'ice'));
  for (const field of [0, 2]) {
    const broken = knownWitness(puzzle);
    const cell = broken.trace[0].board.flat().find(tile => field === 0 || tile[1] === 'ice');
    cell[field]++;
    assert.throws(() => verifyWitness(puzzle.input, broken), /trace at move 1/);
  }
});

test('verifier rejects continuation after the actual target crossing', () => {
  const puzzle = manifest.puzzles[0];
  const broken = knownWitness(puzzle);
  broken.chains.push(broken.chains[0]);
  broken.trace.push(broken.trace[0]);
  assert.throws(() => verifyWitness(puzzle.input, broken), /continuation after terminal/);
});

test('real report verifier accepts a valid report without laundering its domain failure', () => {
  const result = verifyReport(qualificationReport());
  assert.deepEqual(result, { valid: true, pass: false, puzzles: 20, wins: 19 });
});

test('report verifier rejects missing rows, duplicate rows and invented comparison results', () => {
  for (const mutate of [
    report => report.rows.pop(),
    report => { report.rows[1] = report.rows[0]; },
    report => { report.rows[0].assessment.movesSaved = 999; },
    report => { report.pass = true; },
    report => { report.rows[0].result.searchMs = 30001; },
  ]) {
    const report = qualificationReport();
    mutate(report);
    assert.throws(() => verifyReport(reseal(report)));
  }
});

test('coherent corpus substitution is rejected against identity pinned outside the report', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), '2248-oracle-substitution-'));
  const file = path.join(temporary, 'corpus.json');
  try {
    const { manifestIdentity, ...body } = structuredClone(manifest);
    body.puzzles[0].humanBestMoves++;
    const changed = { ...body, manifestIdentity: valueIdentity(body) };
    fs.writeFileSync(file, JSON.stringify(changed));
    const onDisk = JSON.parse(fs.readFileSync(file));
    assert.notEqual(onDisk.manifestIdentity, manifest.manifestIdentity);
    assert.throws(() => loadCorpus(file), /identity mismatch/);
    const report = qualificationReport();
    report.manifestIdentity = changed.manifestIdentity;
    assert.throws(() => verifyReport(reseal(report), changed), /untrusted manifest/);
  } finally { fs.rmSync(file); fs.rmdirSync(temporary); }
});

test('bounded search supplies a independently replayable solution and does not mutate the input', () => {
  const input = { level: { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 4, tileScale: 1, blockers: [] }, seed: 7, budgetMs: 200 };
  const before = structuredClone(input);
  const result = search(input);
  assert.ok(result.best);
  assert.equal(verifyWitness(input, result.best).outcome, 'win');
  assert.ok(result.best.movesUsed <= result.baseline.movesUsed);
  assert.deepEqual(input, before);
});

test('candidate generation preserves legal setup prefixes and off-lattice choices', () => {
  const level = { gridW: 4, gridH: 1, moves: 2, minChain: 2, target: 100, tileScale: 1, blockers: [] };
  const node = createPuzzle(level, 7);
  node.state.grid[0].forEach(tile => { tile.value = 2; });
  const choices = candidates(node.state);
  assert.ok(choices.some(c => c.chain.length === 2));
  assert.ok(choices.some(c => c.sum === 6));
  assert.ok(choices.some(c => c.chain.length === 4));
});
