const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SCREEN_LEVELS, SCREEN_SEEDS, HOLDOUT_SEEDS, parseArgs, evaluatePair,
  makeArtifact, validateArtifact, writeArtifact, runWorkers,
} = require('../target-aware-evaluation');

const FIXTURE = {
  level: 999, target: 8, tileScale: 1, moves: 3, minChain: 2, gridW: 2, gridH: 2, blockers: [],
};

test('CLI exposes only fixed diagnostic, screen, and holdout protocols', () => {
  assert.deepEqual(parseArgs(['--diagnostic']), { mode: 'diagnostic', out: null });
  assert.deepEqual(parseArgs(['--screen', '--out', 'x.json']), { mode: 'screen', out: 'x.json' });
  assert.deepEqual(parseArgs(['--holdout', '--out', 'x.json']), { mode: 'holdout', out: 'x.json' });
  assert.throws(() => parseArgs(['--screen', '--seeds', '2']), /unknown argument/);
  assert.throws(() => parseArgs(['--screen']), /--out is required/);
  assert.throws(() => parseArgs(['--diagnostic', '--out', 'x.json']), /does not write/);
});

test('screen and holdout identities are frozen and exclude diagnostic seed 1', () => {
  assert.deepEqual(SCREEN_LEVELS, [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51, 52]);
  assert.equal(SCREEN_SEEDS[0], 12000000);
  assert.equal(SCREEN_SEEDS.at(-1), 12000039);
  assert.equal(HOLDOUT_SEEDS[0], 13000000);
  assert.equal(HOLDOUT_SEEDS.at(-1), 13000299);
  assert.equal(require('../target-aware-evaluation').HOLDOUT_LEVELS.length, 52);
  assert.ok(!SCREEN_SEEDS.includes(1));
  assert.ok(!HOLDOUT_SEEDS.includes(1));
});

test('paired evaluation is level-major, complete, and deterministic', () => {
  const first = evaluatePair([FIXTURE], [4, 5]);
  const second = evaluatePair([FIXTURE], [4, 5]);
  assert.equal(first.length, 2);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(({ level, seed }) => [level, seed]), [[999, 4], [999, 5]]);
  for (const cell of first) {
    assert.equal(typeof cell.champion.win, 'boolean');
    assert.equal(typeof cell.challenger.win, 'boolean');
    assert.equal(Number.isInteger(cell.changedMoveCount), true);
    assert.equal(Number.isInteger(cell.terminalMoveDelta), true);
  }
});

test('worker evaluation preserves the same level-major paired cells', async () => {
  const direct = evaluatePair([FIXTURE], [4, 5]);
  const worker = await runWorkers([1], [4, 5]);
  const levelOne = require('../../src/game').LEVELS.find(({ level }) => level === 1);
  assert.deepEqual(worker.cells, evaluatePair([levelOne], [4, 5]));
  assert.notDeepEqual(worker.cells, direct);
});

test('artifact identity covers complete ordered cells and rejects tampering', () => {
  const cells = evaluatePair([FIXTURE], [4, 5]);
  const artifact = makeArtifact('test', [999], [4, 5], cells, { championMs: 1, challengerMs: 2 });
  assert.equal(validateArtifact(artifact).cells, 2);
  const tampered = structuredClone(artifact);
  tampered.cells[0].challenger.score += 1;
  assert.throws(() => validateArtifact(tampered), /identity mismatch/);
  const incomplete = structuredClone(artifact);
  incomplete.cells.pop();
  assert.throws(() => validateArtifact(incomplete), /cell count/);
});

test('artifact output refuses overwrite', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'target-aware-eval-'));
  const file = path.join(directory, 'result.json');
  const artifact = makeArtifact('test', [999], [4], evaluatePair([FIXTURE], [4]), { championMs: 1, challengerMs: 2 });
  writeArtifact(file, artifact);
  assert.throws(() => writeArtifact(file, artifact), /refusing to overwrite/);
});
