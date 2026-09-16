#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { addedIn } = require('../../tools/verify-experiments');
const { RESULT, ROOT, canonicalJson, identity, sourceHashes } = require('./subject');
const { buildCorpus } = require('./run');

function verifyIdentity(artifact) { const { artifactIdentity, registration, ...body } = artifact; if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch'); }
function verifyRegistration(artifact) {
  const registration = artifact.registration;
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT) throw new Error('artifact is not registered reportable evidence');
  const rel = `experiments/${RESULT}/protocol.md`; const commit = addedIn(rel, ROOT);
  if (!commit || registration.protocolCommit !== commit) throw new Error('protocol commit mismatch');
  try { execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], { cwd: ROOT, stdio: 'ignore' }); } catch { throw new Error('protocol commit is not reachable'); }
}
function verifyArtifact(artifact, { recompute = true } = {}) {
  verifyIdentity(artifact); verifyRegistration(artifact);
  if (canonicalJson(artifact.sources) !== canonicalJson(sourceHashes())) throw new Error('source identity closure mismatch');
  if (recompute) { const expected = buildCorpus(); const { registration, artifactIdentity, ...body } = artifact; if (canonicalJson(body) !== canonicalJson(expected)) throw new Error('full corpus recomputation mismatch'); }
  return { verdict: 'PASS', artifactIdentity: artifact.artifactIdentity, rows: artifact.rows.length, decision: artifact.decision };
}
function main(argv = process.argv.slice(2)) { const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8')); process.stdout.write(`PASS ${JSON.stringify(verifyArtifact(artifact))}\n`); }
if (require.main === module) { try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; } }
module.exports = { verifyArtifact, verifyIdentity };
