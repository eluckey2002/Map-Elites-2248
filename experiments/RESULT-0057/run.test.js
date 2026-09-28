const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');
const { runWorkers } = require('./run');

test('worker output is complete and level-major for a disposable panel', async () => {
  const cells = await runWorkers([1, 54], [45_999_999]);
  assert.deepEqual(cells.map(({ level, seed }) => [level, seed]), [
    [1, 45_999_999],
    [54, 45_999_999],
  ]);
  assert.ok(cells.every(({ champion, challenger }) => (
    champion.moveBudget === challenger.moveBudget
      && champion.durationNs > 0
      && challenger.durationNs > 0
  )));
});

test('a thrown verdict still leaves the complete raw pair artifact', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0057-persist-'));
  const file = path.join(directory, 'corpus.json');
  const artifact = { cells: [{ level: 1, seed: 45_999_999, champion: {}, challenger: {} }] };
  assert.throws(() => persistBeforeVerdict({
    file,
    artifact,
    validate(value) { assert.equal(value.cells.length, 1); },
    evaluate() { throw new Error('planted verdict failure'); },
  }), /planted verdict failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), artifact);
});
