const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const { DEFAULT_PARAMS } = require('../bot');
const { identity, recordSession } = require('../record-session');
const { verifySessionArtifact } = require('../trajectory-audit');

function writeSession(session) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trajectory-audit-'));
  const artifactPath = path.join(directory, 'session.json');
  fs.writeFileSync(artifactPath, JSON.stringify(session));
  return artifactPath;
}

function rehash(session) {
  const copy = structuredClone(session);
  delete copy.sessionIdentity;
  copy.sessionIdentity = identity(copy);
  return copy;
}

test('a real recordSession artifact is independently replayed and verified', () => {
  const subject = LEVELS.find(({ level }) => level === 1);
  const artifactPath = writeSession(recordSession(subject, 3));
  const result = verifySessionArtifact(artifactPath, subject);

  assert.equal(result.status, 'VERIFIED', result.reasons.join('; '));
  assert.equal(result.session.seed, 3);
  assert.deepEqual(result.session.params, DEFAULT_PARAMS);
  assert.equal(result.positions.length, result.session.moves);
  assert.ok(result.positions.length > 0, 'missing positions must not pass vacuously');
});

test('self-rehashed tampering and invalid intake remain unresolved', () => {
  const subject = LEVELS.find(({ level }) => level === 1);
  const original = recordSession(subject, 3);
  const mutations = [
    ['spawn', (session) => { session.moves[0].spawnDelta[0].value *= 2; }],
    ['chain', (session) => { session.moves[0].chain[0].x = subject.gridW + 1; }],
    ['score', (session) => { session.moves[0].scoreAfter += 1; }],
    ['outcome', (session) => { session.outcome.result = session.outcome.result === 'win' ? 'lose' : 'win'; }],
    ['source', (session) => { session.identities.code.engine.sha256 = 'f'.repeat(64); }],
    ['params', (session) => { session.policy.params.width += 1; session.policy.identity = identity(session.policy.params); }],
    ['continuation', (session) => { session.moves.push(structuredClone(session.moves[0])); }],
  ];

  for (const [name, mutate] of mutations) {
    const bad = structuredClone(original);
    mutate(bad);
    const result = verifySessionArtifact(writeSession(rehash(bad)), subject);
    assert.equal(result.status, 'UNRESOLVED', `${name} unexpectedly passed`);
    assert.ok(result.reasons.length > 0, `${name} produced no reason`);
  }

  assert.equal(verifySessionArtifact('/definitely/missing/session.json', subject).status, 'UNRESOLVED');
  assert.equal(verifySessionArtifact(writeSession('{not-json'), subject).status, 'UNRESOLVED');
});
