const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  LEVEL53_SEEDS,
  artifactIdentity,
  makeLevel53Baseline,
  validateLevel53Baseline,
  validateLevel53Comparison,
  writeArtifact,
  parseArgs,
} = require('../promotion-replay');

const SOURCES = {
  bot: 'a'.repeat(64),
  engine: 'b'.repeat(64),
  levels: 'c'.repeat(64),
};

function terminal(overrides = {}) {
  return {
    win: false,
    movesToTarget: null,
    moves: 16,
    score: 90000,
    reason: 'out_of_moves',
    ...overrides,
  };
}

test('Level 53 capture contract fixes all 300 unused seeds in ascending order', () => {
  assert.equal(LEVEL53_SEEDS.length, 300);
  assert.equal(LEVEL53_SEEDS[0], 14000000);
  assert.equal(LEVEL53_SEEDS.at(-1), 14000299);
  assert.equal(new Set(LEVEL53_SEEDS).size, LEVEL53_SEEDS.length);
});

test('Level 53 baseline validation binds source hashes, order, uniqueness, and identity', () => {
  const cells = LEVEL53_SEEDS.map((seed) => ({ level: 53, seed, terminal: terminal() }));
  const artifact = makeLevel53Baseline(cells, SOURCES);

  assert.deepEqual(validateLevel53Baseline(artifact, SOURCES), {
    cells: 300,
    identity: artifact.artifactIdentity,
  });
  assert.equal(artifact.artifactIdentity, artifactIdentity(artifact));

  const duplicate = structuredClone(artifact);
  duplicate.cells[1].seed = duplicate.cells[0].seed;
  duplicate.artifactIdentity = artifactIdentity(duplicate);
  assert.throws(() => validateLevel53Baseline(duplicate, SOURCES), /level-major|duplicate/);

  const wrongSource = structuredClone(artifact);
  wrongSource.sources.bot = 'd'.repeat(64);
  wrongSource.artifactIdentity = artifactIdentity(wrongSource);
  assert.throws(() => validateLevel53Baseline(wrongSource, SOURCES), /source/);
});

test('artifact writes are write-once', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'promotion-replay-'));
  const file = path.join(dir, 'artifact.json');
  const artifact = makeLevel53Baseline(
    LEVEL53_SEEDS.map((seed) => ({ level: 53, seed, terminal: terminal() })),
    SOURCES,
  );

  writeArtifact(file, artifact);
  assert.throws(() => writeArtifact(file, artifact), /refusing to overwrite/);
});

test('Level 53 comparison allows exact cells, earlier wins, and new wins only', () => {
  const loss = terminal();
  const win = terminal({ win: true, movesToTarget: 12, moves: 12, score: 102000, reason: 'target' });

  assert.equal(validateLevel53Comparison(loss, loss), 'exact');
  assert.equal(validateLevel53Comparison(win, terminal({
    win: true, movesToTarget: 10, moves: 10, score: 103000, reason: 'target',
  })), 'earlier_win');
  assert.equal(validateLevel53Comparison(loss, win), 'new_win');
  assert.throws(() => validateLevel53Comparison(win, loss), /win regression/);
  assert.throws(() => validateLevel53Comparison(win, terminal({
    win: true, movesToTarget: 13, moves: 13, score: 102000, reason: 'target',
  })), /slower win/);
  assert.throws(() => validateLevel53Comparison(loss, terminal({ score: 90001 })), /changed losing outcome/);
});

test('CLI exposes only the fixed capture, validation, and verification modes', () => {
  assert.deepEqual(parseArgs(['--capture-level53', '--out', 'baseline.json']), {
    mode: 'capture-level53', out: 'baseline.json', golden52: null, baseline53: null, file: null,
  });
  assert.deepEqual(parseArgs(['--validate', 'baseline.json']), {
    mode: 'validate', out: null, golden52: null, baseline53: null, file: 'baseline.json',
  });
  assert.deepEqual(parseArgs([
    '--verify', '--golden52', 'golden.json', '--baseline53', 'baseline.json', '--out', 'result.json',
  ]), {
    mode: 'verify', out: 'result.json', golden52: 'golden.json', baseline53: 'baseline.json', file: null,
  });
  assert.throws(() => parseArgs(['--capture-level53', '--seed', '1']), /unknown argument/);
});
