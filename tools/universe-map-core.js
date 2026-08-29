const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_CARD_IDS = Object.freeze([
  'identity',
  'evaluation-universe',
  'observed-performance',
  'evidence-standing',
  'current-frontier',
]);

const OUTPUT_PATHS = Object.freeze([
  'UNIVERSE.md',
  'universe/map.html',
  'universe/resolved.json',
]);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fileSha256(root, relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function loadContract(root) {
  return JSON.parse(readText(root, 'universe/contract.json'));
}

function validateContract(contract) {
  const problems = [];
  if (contract.schemaVersion !== 1) problems.push(`contract schemaVersion: expected 1, got ${contract.schemaVersion}`);
  const actualCards = Array.isArray(contract.cards) ? contract.cards.map((card) => card.id) : [];
  if (JSON.stringify(actualCards) !== JSON.stringify(REQUIRED_CARD_IDS)) {
    problems.push(`contract required cards: expected ${REQUIRED_CARD_IDS.join(', ')}, got ${actualCards.join(', ') || 'none'}`);
  }
  for (const card of contract.cards || []) {
    const keys = Object.keys(card).sort();
    if (JSON.stringify(keys) !== JSON.stringify(['id', 'purpose', 'title'])) {
      problems.push(`contract card ${card.id || 'unknown'} contains unsupported fields: ${keys.join(', ')}`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(contract.asOf || '')) problems.push('contract asOf must be YYYY-MM-DD');
  return problems;
}

function field(block, name) {
  const match = block.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function parseLedgerRecord(markdown, id) {
  const heading = new RegExp(`^### ${id} — (.+)$`, 'm').exec(markdown);
  if (!heading) throw new Error(`unresolved ledger record ${id}`);
  const start = heading.index;
  const remainder = markdown.slice(start + heading[0].length);
  const nextHeading = /\n(?:### |## )/.exec(remainder);
  const end = nextHeading ? start + heading[0].length + nextHeading.index : markdown.length;
  const block = markdown.slice(start, end);
  const record = {
    id,
    title: heading[1].trim(),
    type: field(block, 'type'),
    status: field(block, 'status'),
    scope: field(block, 'scope'),
    statement: field(block, 'statement'),
    proofClass: field(block, 'proof_class'),
    asOf: field(block, 'as_of'),
    evidence: field(block, 'evidence'),
  };
  for (const required of ['type', 'status', 'statement', 'proofClass', 'asOf']) {
    if (!record[required]) throw new Error(`ledger record ${id} missing ${required}`);
  }
  return record;
}

function parseOccupiedCells(statement, recordId) {
  const match = statement.match(/occupies \*\*(\d+) of (\d+) cells\*\*/);
  if (!match) throw new Error(`ledger record ${recordId} does not expose occupied-cell evidence`);
  return { occupiedCells: Number(match[1]), totalCells: Number(match[2]) };
}

function parseLastReviewed(markdown) {
  const match = markdown.match(/^Last reviewed: (\d{4}-\d{2}-\d{2})$/m);
  if (!match) throw new Error('CURRENT.md is missing Last reviewed date');
  return match[1];
}

function utcDay(dateText) {
  return Date.parse(`${dateText}T00:00:00Z`);
}

function ageDays(earlier, later) {
  return Math.floor((utcDay(later) - utcDay(earlier)) / 86_400_000);
}

function loadLevelCount(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const resolvedPath = require.resolve(absolutePath);
  delete require.cache[resolvedPath];
  const { LEVELS } = require(resolvedPath);
  if (!Array.isArray(LEVELS) || LEVELS.length === 0) throw new Error(`${relativePath} does not export LEVELS`);
  delete require.cache[resolvedPath];
  return LEVELS.length;
}

function validateSelectedRecord(record, selector) {
  if (record.type !== selector.type) {
    throw new Error(`${selector.id} type: expected ${selector.type}, got ${record.type}`);
  }
  if (record.status !== selector.status) {
    throw new Error(`${selector.id} status: expected ${selector.status}, got ${record.status}`);
  }
}

function resolveUniverse(root) {
  const contract = loadContract(root);
  const contractProblems = validateContract(contract);
  if (contractProblems.length) throw new Error(contractProblems.join('; '));

  const ledgerSource = contract.sources.ledger;
  const ledger = readText(root, ledgerSource.path);
  const selector = ledgerSource.acceptedRecords[0];
  const admittedRecord = parseLedgerRecord(ledger, selector.id);
  validateSelectedRecord(admittedRecord, selector);
  const admittedCoverage = parseOccupiedCells(admittedRecord.statement, admittedRecord.id);

  const artifactSource = contract.sources.latestMapElitesArtifact;
  const artifactBytes = readText(root, artifactSource.path);
  const artifactHash = sha256(artifactBytes);
  if (artifactHash !== artifactSource.sha256) {
    throw new Error(`artifact SHA-256: expected ${artifactSource.sha256}, got ${artifactHash}`);
  }
  const artifact = JSON.parse(artifactBytes);
  if (artifact.protected?.commit !== artifactSource.protectedChampionCommit) {
    throw new Error(`protected champion commit: expected ${artifactSource.protectedChampionCommit}, got ${artifact.protected?.commit || 'missing'}`);
  }
  const screenLevels = artifact.config?.screen?.levels;
  const screenSeeds = artifact.config?.screen?.seeds;
  const holdoutLevels = artifact.config?.holdout?.levels;
  const holdoutSeeds = artifact.config?.holdout?.seeds;
  if (![screenLevels, screenSeeds, holdoutLevels, holdoutSeeds].every(Array.isArray)) {
    throw new Error('artifact evaluation partitions are incomplete');
  }
  if (!Array.isArray(artifact.archive) || !Array.isArray(artifact.representatives)) {
    throw new Error('artifact archive or representatives missing');
  }
  const chainBinCount = artifact.axes?.chainStyle?.count;
  const patienceBinCount = artifact.axes?.patience?.count;
  if (![chainBinCount, patienceBinCount].every(Number.isInteger)) {
    throw new Error('artifact behavior axes are incomplete');
  }
  const verificationSource = contract.sources.latestMapElitesVerification;
  const verificationBytes = readText(root, verificationSource.path);
  const verificationHash = sha256(verificationBytes);
  if (verificationHash !== verificationSource.sha256) {
    throw new Error(`artifact verification SHA-256: expected ${verificationSource.sha256}, got ${verificationHash}`);
  }
  for (const requiredIdentity of [artifactHash, artifactSource.verifierCommit]) {
    if (!verificationBytes.includes(requiredIdentity)) {
      throw new Error(`artifact verification evidence omits identity ${requiredIdentity}`);
    }
  }
  for (const requiredObservation of [
    `PASS MAP-Elites artifact: ${artifact.archive.length} occupied cells across ${chainBinCount} chain bins and ${patienceBinCount} patience bins`,
    `PASS ${artifact.representatives.length} representative elite replays`,
    `PASS protected champion ${artifact.protected.commit.slice(0, 7)} and level-authoring hashes`,
  ]) {
    if (!verificationBytes.includes(requiredObservation)) {
      throw new Error(`artifact verification evidence omits observation: ${requiredObservation}`);
    }
  }

  const overlap = screenSeeds.filter((seed) => new Set(holdoutSeeds).has(seed));
  if (overlap.length) throw new Error(`artifact selection and holdout seeds overlap: ${overlap.join(', ')}`);

  const currentSource = contract.sources.currentNavigation;
  const current = readText(root, currentSource.path);
  const lastReviewed = parseLastReviewed(current);
  const shippedLevelCount = loadLevelCount(root, contract.sources.shippedGame.path);
  const representatives = artifact.representatives.map((representative) => ({
    policyId: representative.policyId,
    cell: representative.cell,
    holdoutFitness: representative.holdout?.fitness,
  }));
  if (representatives.some((representative) => !Number.isFinite(representative.holdoutFitness))) {
    throw new Error('artifact representative holdout fitness is incomplete');
  }
  const positiveHoldoutRepresentatives = representatives.filter((entry) => entry.holdoutFitness > 0).length;
  const selectionCoverage = screenLevels.length / shippedLevelCount;
  const navigationAgeDays = ageDays(lastReviewed, contract.asOf);
  const artifactLedgerStanding = artifactSource.ledgerRecordId ? 'selected' : 'not-admitted';

  const warnings = [];
  if (artifactLedgerStanding === 'not-admitted') {
    warnings.push({
      id: 'artifact-not-ledger-admitted',
      message: 'The latest verified MAP-Elites artifact has no selected ledger record and is not accepted project evidence.',
    });
  }
  if (navigationAgeDays > currentSource.maximumAgeDays) {
    warnings.push({
      id: 'current-navigation-stale',
      message: `CURRENT.md is stale at this map boundary: last reviewed ${lastReviewed}, ${navigationAgeDays} days before ${contract.asOf}.`,
    });
  }

  const frontier = [];
  if (artifactLedgerStanding === 'not-admitted') {
    frontier.push({
      id: 'ledger-admission-gap',
      priority: 1,
      action: 'Independently admit or explicitly reject the latest verified artifact before using it as accepted evidence.',
    });
  }
  if (selectionCoverage < contract.thresholds.minimumSelectionLevelCoverage) {
    frontier.push({
      id: 'evaluation-universe-coverage',
      priority: 2,
      action: 'Widen and characterize the selection-level universe before interpreting policy lift as broad generalization.',
    });
  }
  if (positiveHoldoutRepresentatives < contract.thresholds.minimumPositiveHoldoutRepresentatives) {
    frontier.push({
      id: 'generalization',
      priority: 3,
      action: 'Seek positive disjoint-holdout evidence before considering any champion change.',
    });
  }

  const cards = contract.cards.map((card) => ({
    id: card.id,
    title: card.title,
    purpose: card.purpose,
  }));

  return {
    schemaVersion: 1,
    asOf: contract.asOf,
    authority: contract.authority,
    sourceIdentities: {
      contractSha256: fileSha256(root, 'universe/contract.json'),
      ledgerSha256: fileSha256(root, ledgerSource.path),
      currentNavigationSha256: fileSha256(root, currentSource.path),
      shippedGameSha256: fileSha256(root, contract.sources.shippedGame.path),
      latestArtifactSha256: artifactHash,
      latestArtifactVerificationSha256: verificationHash,
      artifactVerifierCommit: artifactSource.verifierCommit,
    },
    cards,
    identity: {
      championCommit: artifact.protected.commit,
      championStanding: positiveHoldoutRepresentatives === 0 ? 'unchanged' : 'requires-ledger-decision',
      protectedHashes: artifact.protected.hashes,
    },
    evaluationUniverse: {
      shippedLevelCount,
      selection: {
        levels: screenLevels,
        levelCount: screenLevels.length,
        seedCount: screenSeeds.length,
        gameCount: screenLevels.length * screenSeeds.length,
        shippedLevelCoverage: selectionCoverage,
      },
      holdout: {
        levels: holdoutLevels,
        levelCount: holdoutLevels.length,
        seedCount: holdoutSeeds.length,
        gameCount: holdoutLevels.length * holdoutSeeds.length,
      },
    },
    observedPerformance: {
      admitted: {
        recordId: admittedRecord.id,
        title: admittedRecord.title,
        status: admittedRecord.status,
        proofClass: admittedRecord.proofClass,
        asOf: admittedRecord.asOf,
        ...admittedCoverage,
      },
      latest: {
        artifactPath: artifactSource.path,
        artifactSha256: artifactHash,
        ledgerStanding: artifactLedgerStanding,
        occupiedCells: artifact.archive.length,
        totalCells: artifact.config.bins ** 2,
        representativeCount: representatives.length,
        positiveHoldoutRepresentatives,
        representatives,
      },
    },
    evidenceStanding: {
      standingAuthority: ledgerSource.path,
      acceptedRecord: admittedRecord.id,
      latestArtifact: artifactLedgerStanding,
      currentNavigation: navigationAgeDays > currentSource.maximumAgeDays ? 'stale' : 'current',
      currentNavigationLastReviewed: lastReviewed,
    },
    currentFrontier: frontier.sort((a, b) => a.priority - b.priority),
    warnings,
  };
}

function percent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function shortHash(value) {
  return value.slice(0, 12);
}

function renderMarkdown(model) {
  const admitted = model.observedPerformance.admitted;
  const latest = model.observedPerformance.latest;
  const selection = model.evaluationUniverse.selection;
  const holdout = model.evaluationUniverse.holdout;
  const representatives = latest.representatives
    .map((entry) => `  - \`${entry.policyId}\` in \`${entry.cell}\`: ${(entry.holdoutFitness * 100).toFixed(2)}% holdout fitness`)
    .join('\n');
  const warnings = model.warnings.map((warning) => `- **${warning.id}:** ${warning.message}`).join('\n');
  const frontier = model.currentFrontier.map((item) => `${item.priority}. **${item.id}:** ${item.action}`).join('\n');

  return `# Universe Map\n\n`+
    `> Generated control panel as of ${model.asOf}. Do not edit by hand. Evidence standing comes only from [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md); this page is a projection.\n\n`+
    `## Warnings\n\n${warnings}\n\n`+
    `## Identity\n\n`+
    `- **Champion standing:** ${model.identity.championStanding}\n`+
    `- **Protected champion commit:** \`${model.identity.championCommit}\`\n`+
    `- **Latest artifact:** \`${shortHash(latest.artifactSha256)}\`\n`+
    `- **Pinned verifier revision:** \`${shortHash(model.sourceIdentities.artifactVerifierCommit)}\`\n\n`+
    `## Evaluation universe\n\n`+
    `- **Selection universe:** ${selection.levelCount} levels × ${selection.seedCount} seeds = ${selection.gameCount} games (${percent(selection.shippedLevelCoverage)} of ${model.evaluationUniverse.shippedLevelCount} shipped levels).\n`+
    `- Levels: ${selection.levels.join(', ')}.\n`+
    `- **Representative holdout:** ${holdout.levelCount} levels × ${holdout.seedCount} seeds = ${holdout.gameCount} games.\n`+
    `- Levels: ${holdout.levels.join(', ')}.\n\n`+
    `## Observed performance\n\n`+
    `- **Ledger-admitted: ${admitted.recordId}** (${admitted.status}, ${admitted.proofClass}) — ${admitted.occupiedCells}/${admitted.totalCells} occupied behavior cells.\n`+
    `- **Verified artifact, not ledger-admitted** — ${latest.occupiedCells}/${latest.totalCells} occupied behavior cells.\n`+
    `- **Generalization:** ${latest.positiveHoldoutRepresentatives} of ${latest.representativeCount} representatives beat the champion on holdout.\n${representatives}\n\n`+
    `## Evidence standing\n\n`+
    `- Accepted standing: ${model.evidenceStanding.acceptedRecord} in ${model.evidenceStanding.standingAuthority}.\n`+
    `- Latest artifact: ${model.evidenceStanding.latestArtifact}.\n`+
    `- CURRENT.md navigation: ${model.evidenceStanding.currentNavigation}; last reviewed ${model.evidenceStanding.currentNavigationLastReviewed}.\n\n`+
    `## Current frontier\n\n${frontier}\n\n`+
    `## Drill-down\n\n`+
    `- [Visual static view](universe/map.html)\n`+
    `- [Resolved machine-readable model](universe/resolved.json)\n`+
    `- [Universe contract](universe/contract.json)\n`+
    `- [Current navigation](CURRENT.md)\n`+
    `- Latest artifact: \`${latest.artifactPath}\`\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderHtml(model) {
  const cardContent = {
    identity: [
      `Champion: <strong>${escapeHtml(model.identity.championStanding)}</strong>`,
      `Protected commit: <code>${escapeHtml(shortHash(model.identity.championCommit))}</code>`,
      `Verifier: <code>${escapeHtml(shortHash(model.sourceIdentities.artifactVerifierCommit))}</code>`,
    ],
    'evaluation-universe': [
      `Selection: <strong>${model.evaluationUniverse.selection.levelCount} levels</strong>, ${model.evaluationUniverse.selection.gameCount} games`,
      `Shipped-level coverage: <strong>${percent(model.evaluationUniverse.selection.shippedLevelCoverage)}</strong>`,
      `Representative holdout: <strong>${model.evaluationUniverse.holdout.levelCount} levels</strong>, ${model.evaluationUniverse.holdout.gameCount} games`,
    ],
    'observed-performance': [
      `Ledger-admitted: <strong>${model.observedPerformance.admitted.occupiedCells}/${model.observedPerformance.admitted.totalCells}</strong> cells`,
      `Verified-only artifact: <strong>${model.observedPerformance.latest.occupiedCells}/${model.observedPerformance.latest.totalCells}</strong> cells`,
      `Positive holdout representatives: <strong>${model.observedPerformance.latest.positiveHoldoutRepresentatives}/${model.observedPerformance.latest.representativeCount}</strong>`,
    ],
    'evidence-standing': [
      `Standing authority: <code>${escapeHtml(model.evidenceStanding.standingAuthority)}</code>`,
      `Accepted: <strong>${escapeHtml(model.evidenceStanding.acceptedRecord)}</strong>`,
      `Latest artifact: <strong>${escapeHtml(model.evidenceStanding.latestArtifact)}</strong>`,
      `CURRENT.md: <strong>${escapeHtml(model.evidenceStanding.currentNavigation)}</strong>`,
    ],
    'current-frontier': model.currentFrontier.map((item) => escapeHtml(item.action)),
  };
  const cards = model.cards.map((card) => `
    <section class="card" id="${escapeHtml(card.id)}">
      <h2 class="eyebrow">${escapeHtml(card.title)}</h2>
      <p class="purpose">${escapeHtml(card.purpose)}</p>
      <ul>${cardContent[card.id].map((line) => `<li>${line}</li>`).join('')}</ul>
    </section>`).join('');
  const warnings = model.warnings.map((warning) => `<li><strong>${escapeHtml(warning.id)}</strong> — ${escapeHtml(warning.message)}</li>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>2248 Universe Map</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #0d1117; color: #e6edf3; }
    * { box-sizing: border-box; }
    body { margin: 0; background: radial-gradient(circle at top left, #1d2a3a 0, #0d1117 38rem); }
    main { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 72px; }
    h1 { margin: 0; font-size: clamp(2.4rem, 7vw, 5.4rem); letter-spacing: -0.06em; }
    .lede { max-width: 760px; color: #9fb0c3; font-size: 1.1rem; line-height: 1.6; }
    .status { display: inline-flex; gap: 8px; align-items: center; padding: 7px 12px; border: 1px solid #3d5269; border-radius: 999px; color: #b8ca3f; background: #141c24; }
    .warnings { margin: 28px 0; padding: 20px 24px; border: 1px solid #705d2f; border-radius: 16px; background: #241f15; color: #e7d9a2; }
    .warnings h2 { margin-top: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.12em; }
    .warnings li + li { margin-top: 8px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .card { min-height: 230px; padding: 24px; border: 1px solid #2d3b4a; border-radius: 18px; background: color-mix(in srgb, #161b22 94%, transparent); }
    .card:last-child { grid-column: 1 / -1; }
    .eyebrow { margin: 0 0 10px; color: #b8ca3f; font-size: 0.82rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.14em; }
    .purpose { margin: 0 0 20px; color: #9fb0c3; line-height: 1.5; }
    ul { margin: 0; padding-left: 20px; line-height: 1.6; }
    code { color: #8cc8ff; }
    footer { margin-top: 24px; color: #718296; font-size: 0.9rem; }
    a { color: #8cc8ff; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } .card:last-child { grid-column: auto; } main { padding-top: 28px; } }
  </style>
</head>
<body>
<main>
  <p class="status">Generated projection · ${escapeHtml(model.asOf)}</p>
  <h1>Universe Map</h1>
  <p class="lede">One view of the identities, evaluation universe, observed performance, evidence standing, and current research frontier. The ledger remains authoritative; this page makes its consequences visible.</p>
  <aside class="warnings"><h2>Load-bearing warnings</h2><ul>${warnings}</ul></aside>
  <div class="grid">${cards}
  </div>
  <footer>Do not edit this file by hand. Rebuild with <code>node tools/build-universe-map.js</code>; verify with <code>node tools/verify-universe-map.js</code>. <a href="../UNIVERSE.md">Markdown view</a> · <a href="resolved.json">resolved model</a></footer>
</main>
</body>
</html>
`;
}

function buildExpectedOutputs(root) {
  const model = resolveUniverse(root);
  return {
    'UNIVERSE.md': renderMarkdown(model),
    'universe/map.html': renderHtml(model),
    'universe/resolved.json': `${JSON.stringify(model, null, 2)}\n`,
  };
}

function writeUniverse(root) {
  const outputs = buildExpectedOutputs(root);
  for (const [relativePath, bytes] of Object.entries(outputs)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, bytes);
  }
  return outputs;
}

function verifyUniverse(root, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const problems = [];
  let contract;
  try {
    contract = loadContract(root);
    problems.push(...validateContract(contract));
  } catch (error) {
    return [`contract unreadable: ${error.message}`];
  }
  if (problems.length) return problems;
  if (ageDays(contract.asOf, today) > contract.freshness.maximumMapAgeDays) {
    problems.push(`Universe Map stale: contract asOf ${contract.asOf}, today ${today}`);
  }

  let outputs;
  try {
    outputs = buildExpectedOutputs(root);
  } catch (error) {
    problems.push(error.message);
    return problems;
  }
  for (const relativePath of OUTPUT_PATHS) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      problems.push(`generated output missing: ${relativePath}`);
    } else if (fs.readFileSync(absolutePath, 'utf8') !== outputs[relativePath]) {
      problems.push(`generated output drift: ${relativePath}`);
    }
  }
  return problems;
}

module.exports = {
  OUTPUT_PATHS,
  REQUIRED_CARD_IDS,
  buildExpectedOutputs,
  parseLedgerRecord,
  renderHtml,
  renderMarkdown,
  resolveUniverse,
  validateContract,
  verifyUniverse,
  writeUniverse,
};
