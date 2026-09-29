const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { verifyArtifactIdentity } = require('../../tools/diagnose-lc0004-move6-move8');
const { summaryFromArtifact } = require('../../tools/diagnose-lc0008-reversal-ancestry');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-raw.json');
const RECOMPUTED = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-recomputed.json');

function preparedRoots(arm) {
  return arm.graph.roots.filter(({ origin }) => origin !== 'continuation-spawn');
}

function preparedValue(arm) {
  return preparedRoots(arm).reduce((total, root) => total + root.value, 0);
}

function correctionValues(arm) {
  return arm.graph.merges.find(({ id }) => id === arm.graph.correctionNodeId).chain.map(({ value }) => value);
}

test('retained LC-0008 result traces all eight ancestry graphs', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.equal(artifact.artifactIdentity, '2f9558a9c81adf2459b9762e4fbe1ee1515c3358a7edb34d01afe4f093b9fea8');
  assert.equal(artifact.status, 'COMPLETE');
  assert.equal(artifact.disposition, 'FULL_ANCESTRY_TRACED');
  assert.equal(artifact.cells.length, 4);
  assert.equal(artifact.cells.every((cell) => cell.arms.owner.graphValid && cell.arms.champion.graphValid), true);
  assert.deepEqual(summaryFromArtifact(artifact), JSON.parse(fs.readFileSync(RECOMPUTED, 'utf8')));
});

test('every winner correction uses more prepared roots and value than its loser', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  for (const cell of artifact.cells) {
    const winner = cell.arms[cell.winner];
    const loser = cell.arms[cell.winner === 'owner' ? 'champion' : 'owner'];
    assert.ok(preparedRoots(winner).length > preparedRoots(loser).length, `move ${cell.move} root count`);
    assert.ok(preparedValue(winner) > preparedValue(loser), `move ${cell.move} prepared value`);
    assert.ok(winner.graph.intermediateMergeCount >= 1, `move ${cell.move} intermediate merge`);
  }
});

test('winner correction routes retain the exact small-to-large sequences', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const expected = new Map([
    [4, [64, 64, 64, 128, 128, 256, 512, 1024, 1024, 1024, 2048]],
    [6, [64, 64, 64, 128, 256, 256, 256, 512, 1024]],
    [9, [64, 64, 64, 128, 256, 256, 256, 512, 1024, 1024, 2048, 4096]],
    [11, [1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 2048]],
  ]);
  for (const cell of artifact.cells) {
    assert.deepEqual(correctionValues(cell.arms[cell.winner]), expected.get(cell.move));
  }
});

test('move-9 loser is the counterexample to intermediate merge alone', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const cell = artifact.cells.find(({ move }) => move === 9);
  assert.equal(cell.winner, 'champion');
  assert.equal(cell.arms.owner.graph.intermediateMergeCount, 1);
  assert.equal(preparedValue(cell.arms.owner), 896);
  assert.equal(preparedValue(cell.arms.champion), 9344);
});

test('a planted ancestry change invalidates the retained artifact identity', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  artifact.cells[0].arms.champion.graph.roots[0].origin = 'decision-refill';
  assert.equal(verifyArtifactIdentity(artifact), false);
});
