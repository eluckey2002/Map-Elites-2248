const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const certifier = path.join(root, 'solver', 'alternative-certifier.py');
const python = process.env.ALTERNATIVE_CERTIFIER_PYTHON || 'python3';

function hasOrTools() {
  try {
    execFileSync(python, ['-c', 'import ortools'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test('alternative CP-SAT certifier proves the score and spawn-order fixtures', {
  skip: hasOrTools() ? false : `ortools is not installed for ${python}`,
}, () => {
  const stdout = execFileSync(
    python,
    [certifier, '--fixture', '--timeout-seconds', '20'],
    { cwd: root, encoding: 'utf8', timeout: 30000 },
  );
  const result = JSON.parse(stdout);
  assert.deepEqual(result, {
    column_major_after: [2, 8, 4, 12],
    early_stop_moves: 1,
    exact_maximum: 18,
    score_ge_18: 'SAT',
    score_ge_19: 'UNSAT',
    verdict: 'PASS',
  });
});

test('alternative concrete replay rejects an illegal repeated-cell witness', {
  skip: hasOrTools() ? false : `ortools is not installed for ${python}`,
}, () => {
  const probe = [
    'import importlib.util, pathlib',
    `p = pathlib.Path(${JSON.stringify(certifier)})`,
    "s = importlib.util.spec_from_file_location('alternative_certifier', p)",
    'm = importlib.util.module_from_spec(s)',
    's.loader.exec_module(m)',
    "m.replay(4, 1, 4, [2,2,4,4], [2,2,2], [[0,1,2,2]], 18)",
  ].join('; ');
  assert.throws(
    () => execFileSync(python, ['-c', probe], { cwd: root, encoding: 'utf8', stdio: 'pipe' }),
    /returned non-zero exit status|Command failed/,
  );
});
