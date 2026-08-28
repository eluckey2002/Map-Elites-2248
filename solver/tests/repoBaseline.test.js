const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EXPECTED_SAFETY_REFS,
  REQUIRED_ANCESTOR,
  assessBaseline,
} = require('../../tools/verify-repo-baseline.js');

function greenSnapshot() {
  return {
    branch: 'main',
    head: 'f'.repeat(40),
    mainRemote: 'f'.repeat(40),
    dirtyPaths: [],
    requiredAncestor: REQUIRED_ANCESTOR,
    requiredAncestorPresent: true,
    remoteRefs: { ...EXPECTED_SAFETY_REFS },
    worktrees: [
      { path: '/repo', registered: true, dirtyPaths: [] },
      { path: '/worktrees/parked', registered: true, dirtyPaths: [] },
    ],
  };
}

test('a clean canonical checkout with protected recovery refs passes', () => {
  assert.deepEqual(assessBaseline(greenSnapshot()), []);
});

test('a dirty consequential checkout fails closed and names its paths', () => {
  const snapshot = greenSnapshot();
  snapshot.dirtyPaths = ['src/game.js'];

  assert.deepEqual(assessBaseline(snapshot), ['dirty checkout: src/game.js']);
});

test('a dirty linked worktree fails closed', () => {
  const snapshot = greenSnapshot();
  snapshot.worktrees[1].dirtyPaths = ['solver/bot.js'];

  assert.deepEqual(
    assessBaseline(snapshot),
    ['dirty worktree /worktrees/parked: solver/bot.js'],
  );
});

test('a discovered but unregistered worktree fails closed', () => {
  const snapshot = greenSnapshot();
  snapshot.worktrees.push({ path: '/repo/.orch/runs/lost/worktree', registered: false, dirtyPaths: [] });

  assert.deepEqual(
    assessBaseline(snapshot),
    ['unregistered worktree: /repo/.orch/runs/lost/worktree'],
  );
});

test('a missing or moved remote safety ref fails closed', () => {
  const snapshot = greenSnapshot();
  delete snapshot.remoteRefs['refs/heads/safety/2026-08-28-map-elites-learning'];
  snapshot.remoteRefs['refs/heads/safety/2026-08-28-level-curve-retune'] = '0'.repeat(40);

  assert.deepEqual(assessBaseline(snapshot), [
    'remote safety ref refs/heads/safety/2026-08-28-level-curve-retune: expected 52f500c03a11699cb6bd7c3cab7f6a232470e0dd, got 0000000000000000000000000000000000000000',
    'remote safety ref refs/heads/safety/2026-08-28-map-elites-learning: expected be843368be8e19ec59501aae38f19eebaf188b87, got missing',
  ]);
});

test('a checkout outside the declared ancestry fails closed', () => {
  const snapshot = greenSnapshot();
  snapshot.requiredAncestorPresent = false;

  assert.deepEqual(
    assessBaseline(snapshot),
    [`HEAD does not contain required ancestor ${REQUIRED_ANCESTOR}`],
  );
});

test('canonical mode requires main and exact remote equality', () => {
  const snapshot = greenSnapshot();
  snapshot.branch = 'feature/drift';
  snapshot.mainRemote = 'e'.repeat(40);

  assert.deepEqual(assessBaseline(snapshot), [
    'canonical branch: expected main, got feature/drift',
    `remote main: expected ${snapshot.head}, got ${snapshot.mainRemote}`,
  ]);
});

test('candidate mode permits a non-main branch but keeps every safety check', () => {
  const snapshot = greenSnapshot();
  snapshot.branch = 'codex/git-baseline-stabilization';
  snapshot.mainRemote = 'e'.repeat(40);

  assert.deepEqual(assessBaseline(snapshot, { candidate: true }), []);
});
