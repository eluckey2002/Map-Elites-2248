const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const runner = path.join(root, 'solver', 'hinted-cp-sat', 'runner.py');
const replayer = path.join(root, 'solver', 'hinted-cp-sat', 'replay-witness.js');
const verifier = path.join(root, 'solver', 'hinted-cp-sat', 'verify-result.js');
const basePath = path.join(root, 'solver', 'target-witness-search', 'frozen-run.json');
const resultPath = path.join(root, 'solver', 'hinted-cp-sat', 'frozen-run.json');
const python = process.env.HINTED_CP_SAT_PYTHON || 'python3';

function hasOrTools() {
  try {
    execFileSync(python, ['-c', 'import ortools'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test('independent hinted-runner replay validates the frozen 12,336 witness', () => {
  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const request = {
    level: 26,
    seed: 0,
    threshold: 12336,
    inputIdentity: base.inputIdentity,
    claimedScore: base.scoreClaim,
    witness: base.witness,
  };
  const result = JSON.parse(execFileSync('node', [replayer], {
    cwd: root,
    input: JSON.stringify(request),
    encoding: 'utf8',
  }));
  assert.deepEqual(
    { verdict: result.verdict, score: result.score, moves: result.moves, cursor: result.cursor },
    { verdict: 'PASS', score: 12336, moves: 32, cursor: 520 },
  );
  assert.equal(result.reachesTarget, false);
});

test('hinted CP-SAT runner retains the 18/19 and column-major fixtures', {
  skip: hasOrTools() ? false : `ortools is not installed for ${python}`,
}, () => {
  const result = JSON.parse(execFileSync(
    python,
    [runner, '--fixture', '--timeout-seconds', '20'],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  ));
  assert.deepEqual(result, {
    columnMajorAfter: [2, 8, 4, 12],
    scoreGe18: 'SAT',
    scoreGe19: 'UNSAT',
    verdict: 'PASS',
  });
});

test('recorded threshold schedule replays every SAT and preserves UNKNOWN', () => {
  const result = JSON.parse(execFileSync('node', [verifier, resultPath], {
    cwd: root,
    encoding: 'utf8',
  }));
  assert.equal(result.verdict, 'PASS');
  assert.deepEqual(result.thresholdResults, [
    { threshold: 12336, verdict: 'SAT' },
    { threshold: 12400, verdict: 'UNKNOWN' },
    { threshold: 12600, verdict: 'UNKNOWN' },
    { threshold: 12800, verdict: 'UNKNOWN' },
    { threshold: 13000, verdict: 'UNKNOWN' },
  ]);
  assert.equal(result.targetReached, false);
});
