#!/usr/bin/env node
// PROTOTYPE: one exploratory central-chokepoint playtest, not a production level.
const fs = require('node:fs');
const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');

const DIR = __dirname;
const store = JSON.parse(fs.readFileSync(path.join(DIR, 'candidate.json'), 'utf8'));
const binding = JSON.parse(fs.readFileSync(path.join(DIR, 'subject-binding.json'), 'utf8'));
const candidate = store.candidates[0];

if (identity(candidate) !== binding.candidateIdentity) {
  throw new Error('exploratory candidate identity does not match its subject binding');
}

const server = createAuthoringServer({
  store,
  receipt: binding,
  recordingsDir: path.join(DIR, 'recordings'),
  fixedSeed: binding.seed,
});

server.listen(2249, '127.0.0.1', () => {
  process.stdout.write('Exploratory URL: http://127.0.0.1:2249/index.html?candidate=54&seed=424242\n');
});
