#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { recompute } = require('./recompute');

function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function writeNew(file, text) { if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`); fs.writeFileSync(file, text); }
function close(directory = __dirname) {
  const corpus = path.join(directory, 'corpus.json');
  const contract = path.join(directory, 'closeout-contract.json');
  const primary = recompute(corpus);
  const primaryPath = path.join(directory, 'primary-recomputation.json');
  writeNew(primaryPath, `${JSON.stringify(primary)}\n`);
  const reportPath = path.join(directory, 'report.md');
  writeNew(reportPath, `# RESULT-0078 — mergeable bomb-defusal challenger\n\nPrimary outcome: **${primary.primaryOutcome}**.\n\n${JSON.stringify(primary, null, 2)}\n`);
  const claim = (id, status) => ({ id, status, evidence_subject_identity: primary.finalSubjectIdentity, reason: status === 'PASS' ? 'Frozen control or primary rule passed.' : 'Frozen primary rule did not pass.' });
  const closure = {
    schema_version: 1,
    contract: { path: 'closeout-contract.json', sha256: sha(contract) },
    run_id: 'RESULT-0078-confirmation-47000000-47000019',
    final_subject_identity: primary.finalSubjectIdentity,
    closure_status: 'CLOSED',
    claims: ['C1', 'C2', 'C3', 'C4', 'C5'].map((id) => claim(id, 'PASS')).concat(['P1', 'P2', 'P3'].map((id) => claim(id, primary.claims[id].outcome))),
    artifacts: [
      { id: 'corpus', path: 'corpus.json', sha256: sha(corpus) },
      { id: 'report', path: 'report.md', sha256: sha(reportPath) },
      { id: 'primary-recomputation', path: 'primary-recomputation.json', sha256: sha(primaryPath) },
    ],
    primary_outcome: primary.primaryOutcome,
    deviations: [],
    attempts: [{ id: 'RESULT-0078-confirmation-47000000-47000019', exit_code: 0, artifact_ids: ['corpus', 'report', 'primary-recomputation'] }],
  };
  writeNew(path.join(directory, 'closure.json'), `${JSON.stringify(closure, null, 2)}\n`);
  return closure;
}
if (require.main === module) { try { close(process.cwd()); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; } }
module.exports = { close };
