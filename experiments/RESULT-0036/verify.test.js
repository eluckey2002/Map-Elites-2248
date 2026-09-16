const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { descriptorCell } = require('../../solver/greed-descriptor-screen');
const { identity, subjectIdentityFromSources } = require('./subject');
const { verifyArtifact, verifyIdentity, verifyRow } = require('./verify');

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'corpus.json'), 'utf8'));

function rehash(artifact) {
  const { artifactIdentity, registration, ...body } = artifact;
  return { ...body, registration, artifactIdentity: identity(body) };
}

test('artifact identity check sees a planted body mutation', () => {
  const body = { result: 'RESULT-0036', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verification rejects a planted exact-standing mutation', () => {
  const descriptors = { halfScoreMove: 0.5, greedRatio: 0.75 };
  const row = {
    denominator: 'exact',
    moves: 1,
    denominatorObservations: [{ standing: 'exact_result', points: 100 }],
    exactComplete: true,
    descriptors,
    cell: descriptorCell(descriptors),
  };
  assert.equal(verifyRow(row), true);
  assert.throws(() => verifyRow({ ...row, exactComplete: false }), /completeness mismatch/);
});

test('production artifact verifier exercises every admission boundary', () => {
  assert.equal(verifyArtifact(corpus).verdict, 'PASS');

  assert.throws(() => verifyArtifact({
    ...corpus,
    registration: { ...corpus.registration, protocol: 'RESULT-9999' },
  }), /not registered reportable/);

  const changedSources = {
    ...corpus.sources,
    'solver/behavior-descriptors.js': '0'.repeat(64),
  };
  assert.throws(() => verifyArtifact(rehash({
    ...corpus,
    sources: changedSources,
    finalSubjectIdentity: subjectIdentityFromSources(changedSources),
  })), /source identity closure mismatch/);

  assert.throws(() => verifyArtifact(rehash({
    ...corpus,
    rows: [corpus.rows[1], corpus.rows[0], ...corpus.rows.slice(2)],
  })), /confirmation matrix mismatch/);

  assert.throws(() => verifyArtifact(rehash({
    ...corpus,
    decision: { ...corpus.decision, primaryOutcome: 'SUPPORTED' },
  })), /decision recomputation mismatch/);
});
