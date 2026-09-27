#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { valueIdentity } = require('../../solver/benchmark-inputs');
const { verifyWitness } = require('../../solver/oracle/verify');
const {
  POLICIES, SUBJECT_IDENTITY, loadPanel, sourceHashes, subject,
} = require('./subject');

function disposition(supported, falsified) {
  if (supported) return 'SUPPORTED';
  if (falsified) return 'FALSIFIED';
  return 'INCONCLUSIVE';
}

function verifyArtifact(artifact, { expectedSubjectIdentity = SUBJECT_IDENTITY } = {}) {
  // registration is provenance metadata added after sealing, excluded from
  // artifactIdentity -- matches how run.js seals and how the project gate
  // (tools/verify-experiments.js) recomputes this same check.
  const { artifactIdentity, registration, ...body } = artifact;
  assert.equal(valueIdentity(body), artifactIdentity, 'artifact identity mismatch');
  assert.equal(artifact.subjectIdentity, expectedSubjectIdentity, 'subject identity mismatch');
  assert.deepEqual(artifact.sources, sourceHashes(), 'source identity mismatch');
  const { corpus } = loadPanel();
  assert.equal(artifact.corpusIdentity, corpus.manifestIdentity, 'corpus identity mismatch');
  assert.equal(artifact.rows.length, corpus.puzzles.length * POLICIES.length, 'incomplete matrix');
  const puzzleById = new Map(corpus.puzzles.map(puzzle => [puzzle.puzzleIdentity, puzzle]));
  const expected = new Set(corpus.puzzles.flatMap(puzzle => POLICIES.map(policy => `${puzzle.puzzleIdentity}:${policy.id}`)));
  for (const row of artifact.rows) {
    const key = `${row.puzzleIdentity}:${row.policy}`;
    assert.ok(expected.delete(key), `unknown or duplicate matrix cell: ${key}`);
    const puzzle = puzzleById.get(row.puzzleIdentity);
    assert.ok(['win', 'no-win'].includes(row.outcome), 'invalid outcome');
    assert.equal(row.expandedStates, subject.maxExpandedStates, 'work cap mismatch');
    assert.equal(row.terminationReason, 'work-budget', 'unexpected termination');
    if (row.outcome === 'win') {
      assert.ok(row.witness, 'winning row missing witness');
      const replay = verifyWitness(puzzle.input, row.witness);
      assert.equal(replay.outcome, 'win');
      assert.equal(row.moves, row.witness.movesUsed, 'move count mismatch');
      assert.equal(row.score, row.witness.score, 'score mismatch');
    } else {
      assert.equal(row.witness, null, 'no-win row has witness');
      assert.equal(row.moves, null, 'no-win row has moves');
      assert.equal(row.score, null, 'no-win row has score');
    }
  }
  assert.equal(expected.size, 0, 'missing matrix cells');
  return artifact;
}

function summarize(rows, puzzleById) {
  const summary = {};
  for (const policy of POLICIES) {
    const armRows = rows.filter(row => row.policy === policy.id);
    summary[policy.id] = {
      wins: armRows.filter(row => row.outcome === 'win').length,
      lossAdjustedMoves: armRows.reduce((sum, row) => {
        const puzzle = puzzleById.get(row.puzzleIdentity);
        return sum + (row.moves ?? puzzle.input.level.moves + subject.lossPenaltyMoves);
      }, 0),
      humanMisses: armRows.filter(row => {
        const human = puzzleById.get(row.puzzleIdentity).humanBestMoves;
        return row.moves === null || (human !== null && row.moves > human);
      }).length,
    };
  }
  return summary;
}

function analyze(artifact) {
  verifyArtifact(artifact);
  const { corpus, excluded, primary } = loadPanel();
  const puzzleById = new Map(corpus.puzzles.map(puzzle => [puzzle.puzzleIdentity, puzzle]));
  const primaryIds = new Set(primary.map(puzzle => puzzle.puzzleIdentity));
  const primaryRows = artifact.rows.filter(row => primaryIds.has(row.puzzleIdentity));
  const allSummary = summarize(artifact.rows, puzzleById);
  const primarySummary = summarize(primaryRows, puzzleById);
  const pairs = primary.map(puzzle => {
    const baseline = primaryRows.find(row => row.puzzleIdentity === puzzle.puzzleIdentity && row.policy === 'baseline');
    const evolved = primaryRows.find(row => row.puzzleIdentity === puzzle.puzzleIdentity && row.policy === 'evolved');
    const regression = baseline.outcome === 'win' && (evolved.outcome !== 'win' || evolved.moves > baseline.moves);
    return {
      puzzleIdentity: puzzle.puzzleIdentity,
      humanBestMoves: puzzle.humanBestMoves,
      baselineMoves: baseline.moves,
      evolvedMoves: evolved.moves,
      moveDelta: baseline.moves === null || evolved.moves === null ? null : baseline.moves - evolved.moves,
      regression,
    };
  });
  const b = primarySummary.baseline;
  const e = primarySummary.evolved;
  const p1 = disposition(
    e.wins >= b.wins && e.lossAdjustedMoves < b.lossAdjustedMoves,
    e.wins < b.wins || e.lossAdjustedMoves > b.lossAdjustedMoves,
  );
  const p2 = disposition(e.humanMisses <= b.humanMisses, e.humanMisses > b.humanMisses);
  const regressions = pairs.filter(pair => pair.regression).length;
  const p3 = disposition(regressions === 0, regressions > 0);
  const checks = { P1: p1, P2: p2, P3: p3 };
  const primaryOutcome = Object.values(checks).every(value => value === 'SUPPORTED')
    ? 'SUPPORTED'
    : Object.values(checks).some(value => value === 'FALSIFIED') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return {
    schemaVersion: 1,
    result: artifact.result,
    subjectIdentity: artifact.subjectIdentity,
    corpusIdentity: artifact.corpusIdentity,
    registration: artifact.registration,
    primaryPuzzleCount: primary.length,
    optimizationOverlapPuzzleCount: excluded.size,
    primarySummary,
    allCorpusSummary: allSummary,
    pairedRegressions: regressions,
    pairs,
    checks,
    primaryOutcome,
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: node experiments/RESULT-0047/verify.js <corpus.json>');
  const result = analyze(JSON.parse(fs.readFileSync(argv[0], 'utf8')));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }
}

module.exports = { analyze, verifyArtifact };
