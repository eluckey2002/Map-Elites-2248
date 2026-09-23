const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');

test('a failing verdict cannot erase the complete paired result', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'persist-before-verdict-'));
  const file = path.join(directory, 'paired-results.json');
  const artifact = { cells: [{ seed: 1 }, { seed: 2 }, { seed: 3 }] };

  assert.throws(() => persistBeforeVerdict({
    file,
    artifact,
    validate(value) {
      assert.equal(value.cells.length, 3);
    },
    evaluate(value) {
      assert.equal(value.cells.length, 3);
      throw new Error('changed same-speed winning outcome at seed 2');
    },
  }), /seed 2/);

  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), artifact);
});

test('the write is immutable and validation happens before publication', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'persist-before-verdict-'));
  const file = path.join(directory, 'paired-results.json');
  assert.throws(() => persistBeforeVerdict({
    file,
    artifact: { cells: [] },
    validate() { throw new Error('incomplete pairs'); },
    evaluate() { return 'unreachable'; },
  }), /incomplete pairs/);
  assert.equal(fs.existsSync(file), false);

  persistBeforeVerdict({ file, artifact: { cells: [1] }, evaluate: () => 'PASS' });
  assert.throws(
    () => persistBeforeVerdict({ file, artifact: { cells: [2] }, evaluate: () => 'PASS' }),
    /EEXIST/,
  );
});
