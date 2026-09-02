const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const {
  addedIn, assessExperiments, declaredChecks, isStrictAncestor, parseFrontmatter, readLedgerResults,
} = require('../../tools/verify-experiments.js');

test('a result claiming only direct evidence needs no protocol', () => {
  const results = readLedgerResults([
    '### RESULT-0001 — a thing that was read, not inferred',
    '- **proof_class:** `direct_source` for the file contents',
  ].join('\n'));
  assert.equal(results.length, 1);
  assert.equal(results[0].proofClass.includes('heuristic_observation'), false);
});

test('a result claiming generalization is detected as needing one', () => {
  const results = readLedgerResults([
    '### RESULT-0002 — a thing inferred from a sample',
    '- **proof_class:** `heuristic_observation` over the unseen sample',
  ].join('\n'));
  assert.equal(results[0].proofClass.includes('heuristic_observation'), true);
});

test('a heading between records ends the record', () => {
  const results = readLedgerResults([
    '### RESULT-0003 — first',
    '- **proof_class:** `direct_source`',
    '## Decision registry',
    '- **proof_class:** `heuristic_observation`',
  ].join('\n'));
  assert.equal(results.length, 1);
  assert.equal(results[0].proofClass.includes('heuristic_observation'), false);
});

test('declared checks are parsed by name, primes and em-dashes included', () => {
  assert.deepEqual(
    declaredChecks([
      '### C1 — negative control (PASS / FAIL)',
      "### C3' — suite unchanged, corrected",
      '### P1 — primary empirical prediction',
      '### Not a check — prose heading',
    ].join('\n')),
    ['C1', 'C3', 'P1'],
  );
});

test('frontmatter parses nested version freeze entries', () => {
  const front = parseFrontmatter([
    '---',
    'result: RESULT-0019',
    'status: registered',
    'version_freeze:',
    '  solver/bot.js: abc123',
    '  src/game.js: def456',
    '---',
    '# body',
  ].join('\n'));
  assert.equal(front.result, 'RESULT-0019');
  assert.deepEqual(front.version_freeze, { 'solver/bot.js': 'abc123', 'src/game.js': 'def456' });
});

// The tests above are synthetic. This one runs the gate against this
// repository, so the suite can actually see an unprotocolled result.
test('LIVE: every generalizing result in this ledger has a protocol or a grandfather entry', () => {
  assert.deepEqual(
    assessExperiments(), [],
    'Experiment gate failed against the live ledger; run node tools/verify-experiments.js',
  );
});

test('a commit is never a strict ancestor of itself — same-commit backfill fails', () => {
  const root = path.join(__dirname, '..', '..');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const prev = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(isStrictAncestor(head, head), false, 'same commit must not count as ordered');
  assert.equal(isStrictAncestor(prev, head), true, 'earlier commit precedes later');
  assert.equal(isStrictAncestor(head, prev), false, 'later commit does not precede earlier');
  assert.equal(isStrictAncestor(null, head), false);
});

test('addedIn returns the OLDEST add, so delete-and-re-add cannot reset the clock', () => {
  assert.equal(typeof addedIn('EVIDENCE_LEDGER.md'), 'string');
  assert.equal(addedIn('does/not/exist.md'), null);
});

const { UnregisteredExperiment, registrationStamp, requireProtocol } = require('../experiment-guard.js');

test('an unregistered run is refused before any compute', () => {
  assert.throws(() => requireProtocol(['node', 'x']), UnregisteredExperiment);
});

test('exploratory runs are allowed but stamped as such', () => {
  const reg = requireProtocol(['node', 'x', '--exploratory']);
  assert.equal(reg.exploratory, true);
  assert.deepEqual(registrationStamp(reg), { exploratory: true });
});

test('a malformed or unregistered protocol id is refused', () => {
  assert.throws(() => requireProtocol(['node', 'x', '--protocol', 'nonsense']), UnregisteredExperiment);
  assert.throws(() => requireProtocol(['node', 'x', '--protocol', 'RESULT-9999']), UnregisteredExperiment);
});

test('a real registration stamps the protocol commit into the artifact', () => {
  const stamp = registrationStamp({ exploratory: false, resultId: 'RESULT-0019', protocolCommit: 'abc123' });
  assert.deepEqual(stamp, { exploratory: false, protocol: 'RESULT-0019', protocolCommit: 'abc123' });
});

test('the registration stamp rides outside the hashed body, so old artifacts still verify', () => {
  const { validateArtifact } = require('../target-aware-evaluation.js');
  const holdout = require('../../.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json');
  const before = validateArtifact(holdout);
  assert.equal(
    before.identity,
    '83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0',
    'RESULT-0018 cites this identity; adding a stamp field must not move it',
  );
  // a stamped copy must hash identically — the stamp is excluded from the body
  const stamped = { ...holdout, registration: { exploratory: false, protocol: 'RESULT-0019', protocolCommit: 'abc' } };
  assert.equal(validateArtifact(stamped).identity, before.identity);
});

test('an exploratory artifact cannot back a generalizing claim', () => {
  const { assessArtifactStamps, citedArtifacts } = require('../../tools/verify-experiments.js');
  assert.deepEqual(citedArtifacts('cited `a/b.json` and `c.json` but not `d.md`'), ['a/b.json', 'c.json']);
  // grandfathered results predate stamping and are skipped
  assert.deepEqual(
    assessArtifactStamps({ id: 'RESULT-0005', body: 'sees `.orch/policy-search-01.json`' }, new Set(['RESULT-0005'])),
    [],
  );
  // a missing file is not an error here; the citation check owns that
  assert.deepEqual(
    assessArtifactStamps({ id: 'RESULT-0099', body: 'sees `does/not/exist.json`' }, new Set()),
    [],
  );
});

// ---------------------------------------------------------------------------
// Negative tests for the five assertions added 2026-09-01. Every one of these
// plants a REAL failure against the REAL artifacts and confirms the check goes
// red, because a check proven only against hand-built fixtures has never looked
// at the thing it guards. Each test asserts the clean state first, so a test
// that passes because it inspected nothing fails instead.
// ---------------------------------------------------------------------------

const {
  assessArtifactIdentity, assessCitationsResolve, assessReportAnswers,
  assessStampProvenance, assessVersionFreeze, openCitedArtifacts, reachableFromHead, sha16,
} = require('../../tools/verify-experiments.js');

const ROOT = path.join(__dirname, '..', '..');
const fsx = require('node:fs');
const REPORT_COMMIT = '1fe26ee87a889d13d6c48159eef054f767feaedf';
const PROTOCOL_COMMIT = 'b09737b58e30e9263bb1ccc82c605a22f5f8b8ab';
const PRE_PROTOCOL_COMMIT = '52f500c03a11699cb6bd7c3cab7f6a232470e0dd';

function liveResult(id) {
  const found = readLedgerResults(fsx.readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8'))
    .find((record) => record.id === id);
  assert.ok(found, `${id} must exist in the live ledger`);
  return found;
}

test('LIVE: tampering with one cell of the real holdout breaks its identity', () => {
  const result = liveResult('RESULT-0020');
  const opened = openCitedArtifacts(result);
  assert.deepEqual(assessArtifactIdentity(result, opened), [], 'the real artifacts must verify before tampering');

  const holdout = opened.find((entry) => entry.rel.endsWith('holdout.json'));
  assert.ok(holdout && holdout.artifact, 'the holdout must have been read, not skipped');
  assert.equal(holdout.artifact.cells.length, 15600, 'this check must be looking at all 15,600 real cells');

  holdout.artifact.cells[0].champion.movesToTarget += 1;
  const problems = assessArtifactIdentity(result, opened);
  assert.equal(problems.length, 1, 'one tampered cell must produce exactly one failure');
  assert.match(problems[0], /does not hash to its own artifactIdentity/);
});

test('LIVE: a citation that resolves to nothing fails; a filename in prose does not', () => {
  const real = liveResult('RESULT-0020');
  assert.deepEqual(assessCitationsResolve(real, openCitedArtifacts(real)), []);

  // path-shaped and absent -> caught
  const rotted = { id: 'RESULT-9999', body: 'evidence `.orch/runs/no-such-run/evidence/holdout.json`' };
  const problems = assessCitationsResolve(rotted, openCitedArtifacts(rotted));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /does not exist/);

  // no slash -> a filename named in prose, deliberately not treated as a path.
  // Four of these are live in the ledger; firing on them would make the gate
  // red on English.
  const prose = { id: 'RESULT-9998', body: 'the receipt `-52.receipt.json` and `candidate-levels.json`' };
  assert.deepEqual(assessCitationsResolve(prose, openCitedArtifacts(prose)), []);
});

test('LIVE: a forged, unreachable, or out-of-order protocolCommit is caught', () => {
  const result = liveResult('RESULT-0020');
  const clean = openCitedArtifacts(result);
  assert.deepEqual(assessStampProvenance(result, clean, REPORT_COMMIT), [],
    'the real stamps must pass before we forge one');
  assert.ok(reachableFromHead(PROTOCOL_COMMIT), 'the real registration commit must be reachable');

  const withStamp = (protocolCommit) => {
    const opened = openCitedArtifacts(result);
    for (const entry of opened) {
      if (entry.artifact && entry.artifact.registration) entry.artifact.registration.protocolCommit = protocolCommit;
    }
    return assessStampProvenance(result, opened, REPORT_COMMIT);
  };

  assert.match(withStamp('not-a-sha')[0], /not a full commit sha/);
  assert.match(withStamp('0'.repeat(40))[0], /not a commit reachable from HEAD/);
  // real commit, reachable, but predates the protocol so cannot contain it
  assert.match(withStamp(PRE_PROTOCOL_COMMIT)[0], /does not contain experiments\/RESULT-0020\/protocol\.md/);
  // real commit that DOES contain the protocol but does not precede the report
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.match(withStamp(head)[0], /does not strictly precede/);
});

test('LIVE: a report that names a check without answering it is caught', () => {
  const dir = path.join(ROOT, 'experiments', 'RESULT-0020');
  const protocol = fsx.readFileSync(path.join(dir, 'protocol.md'), 'utf8');
  const report = fsx.readFileSync(path.join(dir, 'report.md'), 'utf8');
  const result = { id: 'RESULT-0020' };

  assert.deepEqual(assessReportAnswers(result, protocol, report), [],
    'the real report must answer all eight declared checks');
  assert.equal(declaredChecks(protocol).length, 8, 'the protocol must still declare eight checks');

  // Naming every check and answering none.
  const named = '# Report\n\nThe checks are C1 C2 C3 P1 P2 P3 P4 P5. None were run.\n';
  assert.equal(assessReportAnswers(result, protocol, named).length, 8);
  assert.match(assessReportAnswers(result, protocol, named)[0], /has no section of its own/);

  // Deleting the primary-prediction section from the REAL report. The old
  // gate stayed green here, because "P1" survives in two later sentences.
  const gutted = report.slice(0, report.indexOf('## P1')) + report.slice(report.indexOf('## P2'));
  assert.match(/\bP1\b/.test(gutted) ? 'still mentioned' : '', /still mentioned/);
  const problems = assessReportAnswers(result, protocol, gutted);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /declared check P1 has no section of its own/);

  // A section with no verdict word is not an answer either. Note the crafted
  // input replaces the WHOLE P4 section: merely deleting the verdict from its
  // heading leaves the body's "`SUPPORTED` condition was exact equality", which
  // still reads as a verdict. That first attempt passed because the fault never
  // landed, not because the check was sound.
  const p4Start = report.indexOf('## P4');
  const p4End = report.indexOf('## P5');
  assert.ok(p4Start > 0 && p4End > p4Start, 'the real report must still have a P4 and a P5 section');
  const verdictless = `${report.slice(0, p4Start)}## P4 — magnitude of the effect\n\nMean all-cell move saving 1.271.\n\n${report.slice(p4End)}`;
  const p4 = assessReportAnswers(result, protocol, verdictless).filter((line) => /check P4\b/.test(line));
  assert.equal(p4.length, 1);
  assert.match(p4[0], /states no outcome/);
});

test('LIVE: version freeze is enforced while registered, and against what the artifact recorded', () => {
  const result = liveResult('RESULT-0020');
  const front = parseFrontmatter(fsx.readFileSync(path.join(ROOT, 'experiments', 'RESULT-0020', 'protocol.md'), 'utf8'));
  const opened = openCitedArtifacts(result);

  assert.equal(front.status, 'complete');
  assert.deepEqual(assessVersionFreeze(result, front, opened), [],
    'the real artifacts must be covered by the real freeze list');
  assert.ok(Object.keys(front.version_freeze).length >= 7, 'seven files are frozen by this protocol');

  // (b) a source hash the freeze does not cover
  const tampered = openCitedArtifacts(result);
  tampered.find((entry) => entry.rel.endsWith('holdout.json')).artifact.sources.challenger = 'f'.repeat(64);
  const uncovered = assessVersionFreeze(result, front, tampered);
  assert.equal(uncovered.length, 1);
  assert.match(uncovered[0], /which no version_freeze entry covers/);

  // (a) a still-registered protocol whose frozen file has moved. Reads the real
  // solver/bot.js; only the expected hash is synthetic.
  const registered = { status: 'registered', version_freeze: { 'solver/bot.js': '0'.repeat(16) } };
  const moved = assessVersionFreeze(result, registered, []);
  assert.equal(moved.length, 1);
  assert.match(moved[0], /version_freeze broken while status: registered — solver\/bot\.js is [0-9a-f]{16}/);

  // and the positive control: the same clause green when the hash matches
  const honest = { status: 'registered', version_freeze: { 'solver/bot.js': sha16(path.join(ROOT, 'solver/bot.js')) } };
  assert.deepEqual(assessVersionFreeze(result, honest, []), []);
});

// ---------------------------------------------------------------------------
// The guard reads the freeze from the registration commit, not from disk.
// Found 2026-09-02 by two independent gate-check reviews: edit a frozen file,
// rewrite the protocol's hash line to match, and the old guard passed and
// stamped the original registration commit, whose freeze said otherwise. The
// ledger gate passed it too. These run in a throwaway git repository so the
// planted faults are real commits, not hand-built frontmatter.
const fsg = require('node:fs');
const os = require('node:os');
const { assessVersionFreeze: assessFreeze, sha16: hash16, showAtCommit } = require('../../tools/verify-experiments.js');

function registrationRepo({ freezeLine } = {}) {
  const root = fsg.mkdtempSync(path.join(os.tmpdir(), 'guard-'));
  const git = (...args) => execFileSync('git', [
    '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args,
  ], { cwd: root, encoding: 'utf8' }).trim();
  git('init', '-q');
  const bot = path.join(root, 'solver', 'bot.js');
  fsg.mkdirSync(path.dirname(bot), { recursive: true });
  fsg.writeFileSync(bot, 'module.exports = 1;\n');
  const hash = hash16(bot);
  const protocolPath = path.join(root, 'experiments', 'RESULT-0001', 'protocol.md');
  fsg.mkdirSync(path.dirname(protocolPath), { recursive: true });
  const protocol = (freeze, status = 'registered') => `---\nresult: RESULT-0001\nstatus: ${status}\nversion_freeze:\n${freeze}\n---\n\n# p\n`;
  fsg.writeFileSync(protocolPath, protocol(freezeLine === undefined ? `  solver/bot.js: ${hash}` : freezeLine));
  git('add', '-A');
  git('commit', '-q', '-m', 'register');
  const argv = ['node', 'x', '--protocol', 'RESULT-0001'];
  return { root, git, bot, hash, protocolPath, protocol, argv, registration: git('rev-parse', 'HEAD') };
}

test('an honest registration passes and stamps its own commit', () => {
  const repo = registrationRepo();
  const reg = requireProtocol(repo.argv, { root: repo.root });
  assert.equal(reg.exploratory, false);
  assert.equal(reg.protocolCommit, repo.registration);
});

test('a freeze rewritten after registration is refused, uncommitted or committed', () => {
  const repo = registrationRepo();
  fsg.appendFileSync(repo.bot, '// moved\n');
  const moved = hash16(repo.bot);
  assert.notEqual(moved, repo.hash, 'the planted fault must actually change the hash');
  // Rewriting the protocol to match the moved file: the bypass.
  fsg.writeFileSync(repo.protocolPath, repo.protocol(`  solver/bot.js: ${moved}`));
  assert.throws(() => requireProtocol(repo.argv, { root: repo.root }), /differs from the copy registered at/);
  // Committing the rewrite does not launder it: addedIn still dates the protocol
  // from the original registration, whose freeze still names the old hash.
  repo.git('add', '-A');
  repo.git('commit', '-q', '-m', 'rewrite freeze');
  assert.equal(addedIn('experiments/RESULT-0001/protocol.md', repo.root), repo.registration);
  assert.throws(() => requireProtocol(repo.argv, { root: repo.root }), /differs from the copy registered at/);
  // Positive control: restoring the registered copy exposes the real breach.
  fsg.writeFileSync(repo.protocolPath, repo.protocol(`  solver/bot.js: ${repo.hash}`));
  assert.throws(() => requireProtocol(repo.argv, { root: repo.root }), /Version freeze broken before the run/);
});

test('a protocol registered with placeholders or an empty freeze is refused', () => {
  const placeholders = registrationRepo({ freezeLine: '  solver/bot.js: <sha256-first-16>' });
  assert.throws(() => requireProtocol(placeholders.argv, { root: placeholders.root }), /template placeholders/);
  const empty = registrationRepo({ freezeLine: '' });
  assert.throws(() => requireProtocol(empty.argv, { root: empty.root }), /freezes nothing/);
});

test('a finished protocol cannot mint new evidence', () => {
  const repo = registrationRepo();
  fsg.writeFileSync(repo.protocolPath, repo.protocol(`  solver/bot.js: ${repo.hash}`, 'complete'));
  assert.throws(() => requireProtocol(repo.argv, { root: repo.root }), /status: complete/);
});

test('the ledger gate reads the freeze from the registration commit too', () => {
  const repo = registrationRepo();
  const registered = parseFrontmatter(showAtCommit(repo.registration, 'experiments/RESULT-0001/protocol.md', repo.root));
  const result = { id: 'RESULT-0001' };
  // Positive control: disk and registration agree, nothing to report. Status
  // is complete so clause (a) does not look for solver/bot.js under the real ROOT.
  const honest = { status: 'complete', version_freeze: { ...registered.version_freeze } };
  assert.deepEqual(assessFreeze(result, honest, [], registered), []);
  // The bypass: disk freeze rewritten, registration untouched.
  const rewritten = { status: 'complete', version_freeze: { 'solver/bot.js': 'f'.repeat(16) } };
  const problems = assessFreeze(result, rewritten, [], registered);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /differs from the copy at its registration commit/);
  // And a registration that froze nothing is a problem on its own.
  const hollow = { status: 'complete', version_freeze: { 'solver/bot.js': '<sha256-first-16>' } };
  const hollowProblems = assessFreeze(result, hollow, [], hollow);
  assert.equal(hollowProblems.length, 1);
  assert.match(hollowProblems[0], /template placeholders/);
});
