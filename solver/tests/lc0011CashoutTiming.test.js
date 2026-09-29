const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  validateArmRecord,
  validateManifest,
} = require('../../tools/diagnose-lc0011-cashout-timing');

const ROOT = path.join(__dirname, '..', '..');

function waitFixture() {
  const chain = [
    { x: 1, y: 0, value: 64 }, { x: 0, y: 1, value: 64 },
    { x: 0, y: 0, value: 128 }, { x: 1, y: 1, value: 128 },
    { x: 2, y: 0, value: 128 }, { x: 2, y: 1, value: 128 },
    { x: 1, y: 2, value: 128 }, { x: 0, y: 2, value: 256 },
  ];
  const terminal = { outcome: 'win', reason: 'target reached', firstCrossing: 14 };
  return {
    arm: 'WAIT_ONE',
    start: { stateIdentity: 'd6bf03cee41bd1539b167c8de37ea7b87e269f4fef473c3bf3144e74fc416dff', score: 66752, moves: 13, maxMoves: 24, targetScore: 126000 },
    firstActionIdentity: crypto.createHash('sha256').update(JSON.stringify(chain)).digest('hex'),
    trace: [{ chain, points: 3072, moves: 14, terminal }],
    terminal, reachedTarget: true, firstTargetCrossing: 14, movesToTarget: 1,
  };
}

test('arm assignment rejects a relabeled WAIT_ONE action', () => {
  const record = waitFixture();
  record.arm = 'CASH_NOW';
  assert.throws(() => validateArmRecord(record), /first-action\/arm mismatch/);
});

test('trace validator rejects continuation after target', () => {
  const record = waitFixture();
  record.trace.push({ ...record.trace[0], moves: 15 });
  assert.throws(() => validateArmRecord(record), /continued after target or terminal/);
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0011-cashout-timing-manifest.json');
test('manifest inspects the real protocol, policy, ruleset, and harness', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0011-cashout-timing.js'));
  assert.equal(paths.bot, path.join(ROOT, 'solver', 'bot.js'));
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('experiment source cannot promote or redefine policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0011-cashout-timing.js'), 'utf8');
  for (const forbidden of ['promoteChampion', 'writeChampion', 'candidateMeasure']) assert.equal(source.includes(forbidden), false, forbidden);
});
