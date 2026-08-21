const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  resolveOutputPaths,
  assertWritable,
  parseWriteArgs,
  DEFAULT_BASENAME,
} = require('../author-level');

const SOLVER_DIR = path.join(__dirname, '..');

// Authoring a candidate other than the "current" one used to require backing up
// solver/candidate-levels.*, authoring, relocating the output, and restoring the
// backup. That ran three times in one session, and each run temporarily
// destroyed the only passing receipt. Level 51's store was lost to exactly this:
// recordings still bind to 524f37c0063d61e5, an identity no receipt carries.

test('with no --out, output still lands on the historical filenames', () => {
  const paths = resolveOutputPaths();
  assert.equal(paths.store, path.join(SOLVER_DIR, 'candidate-levels.json'));
  assert.equal(paths.receipt, path.join(SOLVER_DIR, 'candidate-levels.receipt.json'));
  assert.equal(DEFAULT_BASENAME, 'candidate-levels');
});

test('--out names both files from one basename', () => {
  const paths = resolveOutputPaths('candidate-levels-52');
  assert.equal(paths.store, path.join(SOLVER_DIR, 'candidate-levels-52.json'));
  assert.equal(paths.receipt, path.join(SOLVER_DIR, 'candidate-levels-52.receipt.json'));
});

test('--out refuses anything that is not a bare basename', () => {
  // A basename that escapes solver/ would let authoring write anywhere.
  assert.throws(() => resolveOutputPaths('../escaped'), /bare basename/i);
  assert.throws(() => resolveOutputPaths('nested/name'), /bare basename/i);
  assert.throws(() => resolveOutputPaths('/absolute'), /bare basename/i);
  assert.throws(() => resolveOutputPaths('name.json'), /without \.json/i);
  assert.throws(() => resolveOutputPaths(''), /requires a basename/i);
});

// --- The guard, against real files -------------------------------------

test('writing over an existing candidate is refused, and the refusal says how to proceed', () => {
  const paths = resolveOutputPaths(DEFAULT_BASENAME);
  assert.ok(fs.existsSync(paths.store), 'precondition: the live store exists, so the guard has something to catch');

  assert.throws(
    () => assertWritable(paths, false),
    (error) => {
      assert.match(error.message, /refusing to overwrite/i);
      assert.match(error.message, /candidate-levels\.json/);
      assert.match(error.message, /--out/, 'the refusal must name the non-destructive way out');
      assert.match(error.message, /--force/, 'and the deliberate way through');
      return true;
    },
  );
});

test('--force is the deliberate escape and does not throw', () => {
  const paths = resolveOutputPaths(DEFAULT_BASENAME);
  assert.doesNotThrow(() => assertWritable(paths, true));
});

test('a basename nothing occupies is writable without --force', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'author-cli-'));
  const free = { store: path.join(dir, 'unused.json'), receipt: path.join(dir, 'unused.receipt.json') };
  assert.doesNotThrow(() => assertWritable(free, false));
});

test('a free store but an occupied receipt is still refused', () => {
  // Both files must be clear; guarding only the store would half-clobber a pair.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'author-cli-'));
  const receipt = path.join(dir, 'half.receipt.json');
  fs.writeFileSync(receipt, '{}');
  assert.throws(
    () => assertWritable({ store: path.join(dir, 'half.json'), receipt }, false),
    /refusing to overwrite/i,
  );
});

// --- Argument parsing --------------------------------------------------

test('the historical three-argument form still parses unchanged', () => {
  const parsed = parseWriteArgs(['--shape', 'solver/candidate-shapes/level-52-stone-gate.json', '--write']);
  assert.deepEqual(parsed, {
    shape: 'solver/candidate-shapes/level-52-stone-gate.json',
    basename: DEFAULT_BASENAME,
    force: false,
  });
});

test('--out and --force parse in either order', () => {
  const a = parseWriteArgs(['--shape', 's.json', '--write', '--out', 'cand-x', '--force']);
  assert.deepEqual(a, { shape: 's.json', basename: 'cand-x', force: true });

  const b = parseWriteArgs(['--shape', 's.json', '--write', '--force', '--out', 'cand-x']);
  assert.deepEqual(b, { shape: 's.json', basename: 'cand-x', force: true });
});

test('a malformed write invocation falls through to usage rather than guessing', () => {
  assert.equal(parseWriteArgs(['--shape', 's.json', '--write', '--out']), null, '--out with no value');
  assert.equal(parseWriteArgs(['--shape', 's.json', '--write', '--bogus']), null, 'unknown flag');
  assert.equal(parseWriteArgs(['--shape', 's.json', '--write', 'stray']), null, 'stray positional');
  assert.equal(parseWriteArgs(['--verify', 'a.json', 'b.json']), null, 'verify is not a write');
});
