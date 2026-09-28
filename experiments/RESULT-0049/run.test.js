const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');
const { runWorkers } = require('./run');

test('worker output is complete and level-major for a disposable panel', async () => {
  const cells = await runWorkers([1, 51], [44_999_999]);
  assert.deepEqual(cells.map(({ level, seed }) => [level, seed]), [
    [1, 44_999_999],
    [51, 44_999_999],
  ]);
  assert.ok(cells.every(({ base, champion }) => base.moveBudget === champion.moveBudget));
});

test('a thrown verdict still leaves the complete raw pair artifact', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0049-persist-'));
  const file = path.join(directory, 'corpus.json');
  const artifact = { cells: [{ level: 1, seed: 44_999_999, base: {}, champion: {} }] };
  assert.throws(() => persistBeforeVerdict({
    file,
    artifact,
    validate(value) { assert.equal(value.cells.length, 1); },
    evaluate() { throw new Error('planted verdict failure'); },
  }), /planted verdict failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), artifact);
});
