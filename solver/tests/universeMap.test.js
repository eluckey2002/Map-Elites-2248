const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const {
  REQUIRED_CARD_IDS,
  buildExpectedOutputs,
  parseLedgerRecord,
  resolveUniverse,
  verifyUniverse,
  writeUniverse,
} = require('../../tools/universe-map-core.js');

function hash(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function copyFileIntoFixture(fixture, relativePath) {
  const destination = path.join(fixture, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(ROOT, relativePath), destination);
}

function makeFixture(t) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'universe-map-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const relativePath of [
    'universe/contract.json',
    'EVIDENCE_LEDGER.md',
    'CURRENT.md',
    'src/game.js',
    '.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json',
    '.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md',
  ]) copyFileIntoFixture(fixture, relativePath);
  writeUniverse(fixture);
  return fixture;
}

test('the contract has exactly the five load-bearing cards and no copied claim fields', () => {
  const contract = JSON.parse(fs.readFileSync(path.join(ROOT, 'universe/contract.json'), 'utf8'));

  assert.deepEqual(contract.cards.map((card) => card.id), REQUIRED_CARD_IDS);
  assert.equal(new Set(contract.cards.map((card) => card.id)).size, 5);
  for (const card of contract.cards) {
    assert.deepEqual(Object.keys(card).sort(), ['id', 'purpose', 'title']);
  }
  assert.equal(JSON.stringify(contract).includes('occupiedCells'), false);
  assert.equal(JSON.stringify(contract).includes('holdoutFitness'), false);
});

test('the selected ledger parser resolves one record without pretending to parse the whole ledger', () => {
  const ledger = fs.readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8');
  const record = parseLedgerRecord(ledger, 'RESULT-0017');

  assert.equal(record.id, 'RESULT-0017');
  assert.equal(record.type, 'result');
  assert.equal(record.status, 'accepted');
  assert.match(record.title, /bounded MAP-Elites run/);
  assert.match(record.statement, /20 of 25 cells/);
  assert.match(record.proofClass, /heuristic_observation/);
  assert.throws(() => parseLedgerRecord(ledger, 'RESULT-9999'), /unresolved ledger record RESULT-9999/);
});

test('one resolved model keeps admitted evidence separate from the later verified artifact', () => {
  const model = resolveUniverse(ROOT);

  assert.equal(model.cards.length, 5);
  assert.equal(model.observedPerformance.admitted.recordId, 'RESULT-0017');
  assert.equal(model.observedPerformance.admitted.occupiedCells, 20);
  assert.equal(model.observedPerformance.admitted.totalCells, 25);
  assert.equal(model.observedPerformance.latest.occupiedCells, 23);
  assert.equal(model.observedPerformance.latest.ledgerStanding, 'not-admitted');
  assert.deepEqual(model.evaluationUniverse.selection.levels, [1, 10, 20, 30, 40, 52]);
  assert.equal(model.evaluationUniverse.selection.levelCount, 6);
  assert.equal(model.evaluationUniverse.holdout.levelCount, 12);
  assert.equal(model.observedPerformance.latest.positiveHoldoutRepresentatives, 0);
  assert.equal(model.identity.championStanding, 'unchanged');
  assert.equal(
    model.sourceIdentities.latestArtifactVerificationSha256,
    '701d0c5f365ce615e1556a0497442ca79fd11babff96b0e8e87534c589911790',
  );
  assert.ok(model.warnings.some((warning) => warning.id === 'current-navigation-stale'));
  assert.ok(model.warnings.some((warning) => warning.id === 'artifact-not-ledger-admitted'));
});

test('the builder is byte-stable and the committed generated views are current', () => {
  const first = buildExpectedOutputs(ROOT);
  const second = buildExpectedOutputs(ROOT);

  assert.deepEqual(first, second);
  assert.equal(verifyUniverse(ROOT).length, 0);
  assert.deepEqual(first, {
    'UNIVERSE.md': fs.readFileSync(path.join(ROOT, 'UNIVERSE.md'), 'utf8'),
    'universe/map.html': fs.readFileSync(path.join(ROOT, 'universe/map.html'), 'utf8'),
    'universe/resolved.json': fs.readFileSync(path.join(ROOT, 'universe/resolved.json'), 'utf8'),
  });
});

test('generated Markdown exposes the load-bearing distinctions in one screen', () => {
  const markdown = fs.readFileSync(path.join(ROOT, 'UNIVERSE.md'), 'utf8');

  assert.match(markdown, /Ledger-admitted: RESULT-0017.*20\/25/s);
  assert.match(markdown, /Verified artifact, not ledger-admitted.*23\/25/s);
  assert.match(markdown, /Selection universe.*6 levels/s);
  assert.match(markdown, /Representative holdout.*12 levels/s);
  assert.match(markdown, /0 of 3 representatives beat the champion on holdout/);
  assert.match(markdown, /Champion standing.*unchanged/s);
  assert.match(markdown, /CURRENT\.md.*stale/s);
  assert.doesNotMatch(markdown, /Interactive static view/);
});

test('the static HTML uses real headings for all five card titles', () => {
  const html = fs.readFileSync(path.join(ROOT, 'universe/map.html'), 'utf8');

  for (const title of ['Identity', 'Evaluation universe', 'Observed performance', 'Evidence standing', 'Current frontier']) {
    assert.match(html, new RegExp(`<h2 class="eyebrow">${title}</h2>`));
  }
});

test('CURRENT links the generated control panel without erasing its historical milestone', () => {
  const current = fs.readFileSync(path.join(ROOT, 'CURRENT.md'), 'utf8');

  assert.match(current, /\[Universe Map\]\(UNIVERSE\.md\)/);
  assert.match(current, /bounded navigation record, not evidence/);
  assert.match(current, /## Active milestone\n\nAuthor new levels\./);
});

test('verification fails closed for a missing card', (t) => {
  const fixture = makeFixture(t);
  const contractPath = path.join(fixture, 'universe/contract.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  contract.cards.pop();
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

  assert.match(verifyUniverse(fixture).join('\n'), /required cards/);
});

test('verification fails closed for an unresolved ledger record', (t) => {
  const fixture = makeFixture(t);
  const contractPath = path.join(fixture, 'universe/contract.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  contract.sources.ledger.acceptedRecords[0].id = 'RESULT-9999';
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

  assert.match(verifyUniverse(fixture).join('\n'), /unresolved ledger record RESULT-9999/);
});

test('verification fails closed when selected current evidence is not accepted', (t) => {
  const fixture = makeFixture(t);
  const ledgerPath = path.join(fixture, 'EVIDENCE_LEDGER.md');
  const ledger = fs.readFileSync(ledgerPath, 'utf8');
  const heading = ledger.indexOf('### RESULT-0017');
  const nextHeading = ledger.indexOf('\n## Decision registry', heading);
  const before = ledger.slice(0, heading);
  const selected = ledger.slice(heading, nextHeading).replace('- **status:** accepted', '- **status:** stale');
  fs.writeFileSync(ledgerPath, `${before}${selected}${ledger.slice(nextHeading)}`);

  assert.match(verifyUniverse(fixture).join('\n'), /RESULT-0017 status: expected accepted, got stale/);
});

test('verification fails closed for receipt hash mismatch', (t) => {
  const fixture = makeFixture(t);
  const archivePath = path.join(
    fixture,
    '.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json',
  );
  fs.appendFileSync(archivePath, ' ');

  assert.match(verifyUniverse(fixture).join('\n'), /artifact SHA-256/);
});

test('verification fails closed when the artifact verification evidence drifts', (t) => {
  const fixture = makeFixture(t);
  const verificationPath = path.join(
    fixture,
    '.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md',
  );
  fs.appendFileSync(verificationPath, '\nchanged verification evidence\n');

  assert.match(verifyUniverse(fixture).join('\n'), /artifact verification SHA-256/);
});

test('verification observations derive from rebound evidence instead of copied metrics in code', (t) => {
  const fixture = makeFixture(t);
  const archivePath = path.join(
    fixture,
    '.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json',
  );
  const artifact = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  artifact.archive.push({ cell: '9,9', policyId: 'fixture-only' });
  const artifactBytes = `${JSON.stringify(artifact, null, 2)}\n`;
  fs.writeFileSync(archivePath, artifactBytes);

  const verificationPath = path.join(
    fixture,
    '.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md',
  );
  const verification = fs.readFileSync(verificationPath, 'utf8')
    .replaceAll('ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22', hash(artifactBytes))
    .replace('PASS MAP-Elites artifact: 23 occupied cells', 'PASS MAP-Elites artifact: 24 occupied cells');
  fs.writeFileSync(verificationPath, verification);

  const contractPath = path.join(fixture, 'universe/contract.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  contract.sources.latestMapElitesArtifact.sha256 = hash(artifactBytes);
  contract.sources.latestMapElitesVerification.sha256 = hash(verification);
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  writeUniverse(fixture);

  assert.equal(resolveUniverse(fixture).observedPerformance.latest.occupiedCells, 24);
  assert.deepEqual(verifyUniverse(fixture), []);
});

test('verification fails closed for protected champion identity mismatch even with a rebound hash', (t) => {
  const fixture = makeFixture(t);
  const archivePath = path.join(
    fixture,
    '.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json',
  );
  const artifact = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  artifact.protected.commit = '0'.repeat(40);
  const artifactBytes = `${JSON.stringify(artifact, null, 2)}\n`;
  fs.writeFileSync(archivePath, artifactBytes);
  const contractPath = path.join(fixture, 'universe/contract.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  contract.sources.latestMapElitesArtifact.sha256 = hash(artifactBytes);
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

  assert.match(verifyUniverse(fixture).join('\n'), /protected champion commit/);
});

test('verification fails closed when a generated view drifts', (t) => {
  const fixture = makeFixture(t);
  fs.appendFileSync(path.join(fixture, 'UNIVERSE.md'), '\nmanual edit\n');

  assert.match(verifyUniverse(fixture).join('\n'), /generated output drift: UNIVERSE.md/);
});
