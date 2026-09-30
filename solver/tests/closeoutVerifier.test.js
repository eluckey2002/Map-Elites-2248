const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.join(__dirname, '..', '..');
const verifier = path.join(ROOT, 'tools/vendor/close-experiment/verify_closure.py');
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');

test('closeout verifier rejects CLOSED when a required primary claim is FAIL', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'closed-fail-'));
  try {
    const protocol = 'registered protocol\n';
    const corpus = '{}\n';
    fs.writeFileSync(path.join(directory, 'protocol.md'), protocol);
    fs.writeFileSync(path.join(directory, 'corpus.json'), corpus);
    const contract = {
      schema_version: 1,
      protocol: { path: 'protocol.md', sha256: sha(protocol) },
      final_subject_identity: 'subject',
      required_claims: ['P1'],
      required_artifacts: ['corpus'],
      requires_primary_outcome: true,
    };
    const contractText = `${JSON.stringify(contract)}\n`;
    fs.writeFileSync(path.join(directory, 'closeout-contract.json'), contractText);
    const closure = {
      schema_version: 1,
      contract: { path: 'closeout-contract.json', sha256: sha(contractText) },
      run_id: 'fixture',
      final_subject_identity: 'subject',
      closure_status: 'CLOSED',
      claims: [{ id: 'P1', status: 'FAIL', evidence_subject_identity: 'subject', reason: 'The hypothesis was falsified.' }],
      artifacts: [{ id: 'corpus', path: 'corpus.json', sha256: sha(corpus) }],
      primary_outcome: 'FALSIFIED',
      deviations: [],
      attempts: [{ id: 'fixture', exit_code: 0, artifact_ids: ['corpus'] }],
    };
    fs.writeFileSync(path.join(directory, 'closure.json'), `${JSON.stringify(closure)}\n`);
    assert.throws(
      () => execFileSync('/Library/Developer/CommandLineTools/usr/bin/python3', [verifier, 'closeout-contract.json', 'closure.json'], { cwd: directory, encoding: 'utf8', stdio: 'pipe' }),
      (error) => error.status === 1 && error.stdout.includes('CLOSED requires claim P1 to be PASS'),
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
