#!/usr/bin/env node
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers,
} = require('./engine');
const { chooseMove } = require('./bot');
const {
  ROOT,
  buildCandidateIndex,
  fileSha256,
  loadFrozenInputs,
  resolveAttemptSource,
  subjectKey,
  subjectPayload,
  validateSeed,
  valueIdentity,
} = require('./benchmark-inputs');
const { compareCases, scoreDiagnostic } = require('./benchmark-metrics');
const { classifyTerminal, hasLegalMove, replayRecording } = require('./benchmark-replay');

const LOOKAHEAD_BASE = 987654321;
const OUTPUT_VERSION = 'POLICY-EVAL-0001 descriptive comparison v2';

function playBot(candidate, seed, options = {}) {
  validateSeed(seed);
  const {
    uncapped = false,
    targetDisabled = uncapped,
    externalHorizon = candidate.moves,
    chooseMoveFn = chooseMove,
  } = options;
  if (!Number.isInteger(externalHorizon) || externalHorizon < 0 || externalHorizon > candidate.moves) {
    throw new Error(`external horizon must be an integer from 0 through original budget ${candidate.moves}`);
  }
  const rng = makeRng(seed);
  const state = createLevelState(candidate, rng);
  if (targetDisabled) state.targetScore = Infinity;
  const initialGridIdentity = valueIdentity(
    state.grid.map((row) => row.map((tile) => ({
      value: tile.value,
      blocker: tile.blocker,
      blockerDuration: tile.blockerDuration,
      bombTimer: tile.bombTimer,
    }))),
  );
  const common = {
    validity: 'valid',
    originalBudget: candidate.moves,
    externalHorizon,
    initialGridIdentity,
    objective: targetDisabled ? 'target-disabled score diagnostic' : 'target-seeking reference',
    rngScheme: 'private live makeRng(seed); fresh lookahead makeRng(987654321 + moveIndex)',
  };

  for (let moveIndex = 0; moveIndex < externalHorizon; moveIndex++) {
    const chain = chooseMoveFn(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) {
      const legal = hasLegalMove(state);
      return {
        ...common,
        score: state.score,
        moves: state.moves,
        outcome: legal ? 'policy-failure' : 'lose',
        reason: legal ? 'policy returned no choice while a legal move exists' : 'no legal moves',
        firstCrossing: null,
      };
    }
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    const terminal = classifyTerminal(state, { targetEnabled: !targetDisabled });
    if (terminal) return { ...common, score: state.score, moves: state.moves, ...terminal };
  }
  return {
    ...common,
    score: state.score,
    moves: state.moves,
    outcome: targetDisabled ? 'horizon-complete' : 'unresolved',
    reason: targetDisabled ? 'external horizon reached' : 'external horizon reached before terminal',
    firstCrossing: null,
  };
}

function discoverRecordingPaths({ root = ROOT } = {}) {
  const found = [];
  function addJson(dir, relativeDir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith('.json')) found.push(path.posix.join(relativeDir, name));
    }
  }
  addJson(path.join(root, 'recordings'), 'recordings');
  addJson(path.join(root, 'play-sessions'), 'play-sessions');
  const pilotsDir = path.join(root, 'pilots');
  if (fs.existsSync(pilotsDir)) {
    for (const pilot of fs.readdirSync(pilotsDir).sort()) {
      addJson(path.join(pilotsDir, pilot, 'recordings'), path.posix.join('pilots', pilot, 'recordings'));
    }
  }
  return found.sort();
}

function executableCommit(root) {
  return childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}

function panelForSource(source) {
  return source.provenanceClass === 'candidate-receipt-resolution-required'
    ? 'receipt-bound'
    : 'current-subject';
}

function metricOutcome(result) {
  return { outcome: result.outcome, moves: result.outcome === 'win' ? result.firstCrossing : null };
}

function groupCases(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.caseKey)) {
      grouped.set(row.caseKey, {
        caseKey: row.caseKey,
        reference: metricOutcome(row.reference),
        comparisons: [],
      });
    }
    grouped.get(row.caseKey).comparisons.push(metricOutcome(row.human));
  }
  return [...grouped.values()].sort((a, b) => a.caseKey.localeCompare(b.caseKey));
}

function collisionReport(rows) {
  const grids = new Map();
  for (const row of rows) {
    if (!grids.has(row.initialGridIdentity)) grids.set(row.initialGridIdentity, new Set());
    grids.get(row.initialGridIdentity).add(row.caseKey);
  }
  return [...grids.entries()]
    .filter(([, cases]) => cases.size > 1)
    .map(([initialGridIdentity, cases]) => ({ initialGridIdentity, caseKeys: [...cases].sort() }));
}

function collect({ root = ROOT } = {}) {
  const frozen = loadFrozenInputs({ root });
  const { manifest } = frozen;
  const index = buildCandidateIndex({ root });
  const expectedPaths = new Set(manifest.requiredAttemptSources.map((entry) => entry.path));
  const extras = discoverRecordingPaths({ root })
    .filter((entry) => !expectedPaths.has(entry))
    .map((entry) => ({ path: entry, sha256: fileSha256(path.join(root, entry)), disposition: 'unexpected-extra' }));
  const rows = [];
  const dispositions = [];
  const canonicalAttempts = new Map();

  for (const expected of manifest.requiredAttemptSources) {
    const panel = panelForSource(expected);
    const resolved = resolveAttemptSource(expected, manifest, { root, index });
    if (!resolved.ok) {
      dispositions.push({ path: expected.path, panel, disposition: 'unresolved', reasons: [resolved.reason] });
      continue;
    }
    const replay = replayRecording(resolved.candidate, resolved.recording, {
      expectedSeed: expected.seed,
      expectedCandidateIdentity: expected.candidateIdentity === null ? undefined : expected.candidateIdentity,
    });
    if (replay.validity !== 'valid') {
      dispositions.push({ path: expected.path, panel, disposition: 'unresolved', reasons: replay.reasons });
      continue;
    }
    const payloadIdentity = valueIdentity(resolved.recording);
    const duplicateKey = `${panel}:${payloadIdentity}`;
    if (canonicalAttempts.has(duplicateKey)) {
      dispositions.push({
        path: expected.path,
        panel,
        disposition: 'duplicate',
        canonicalPayloadIdentity: payloadIdentity,
        duplicateOf: canonicalAttempts.get(duplicateKey),
      });
      continue;
    }
    canonicalAttempts.set(duplicateKey, expected.path);

    try {
      const reference = playBot(resolved.candidate, expected.seed);
      const diagnostic = playBot(resolved.candidate, expected.seed, {
        targetDisabled: true,
        externalHorizon: replay.moves,
      });
      const subject = subjectPayload(resolved.candidate);
      const rowSubjectKey = subjectKey(resolved.candidate);
      const caseKey = valueIdentity({
        engineIdentity: manifest.sources.find((entry) => entry.path === 'solver/engine.js').sha256,
        subjectKey: rowSubjectKey,
        seed: expected.seed,
        rngSchemeIdentity: valueIdentity(manifest.randomness),
      });
      const row = {
        path: expected.path,
        file: path.basename(expected.path).slice(0, 8),
        panel,
        disposition: 'admitted',
        provenanceClass: expected.provenanceClass,
        candidateIdentity: resolved.candidateIdentity,
        candidateSource: resolved.candidateSource,
        receiptSource: resolved.receiptSource,
        receiptIdentity: resolved.receiptIdentity,
        recordingSha256: expected.sha256,
        canonicalPayloadIdentity: payloadIdentity,
        subject,
        level: expected.levelLabel,
        subjectKey: rowSubjectKey,
        caseKey,
        seed: expected.seed,
        initialGridIdentity: reference.initialGridIdentity,
        human: replay,
        reference,
        diagnostic,
        scoreDiagnostic: scoreDiagnostic(diagnostic.score, replay.score),
        diagnosticLabel: 'matched-horizon, mixed/unknown-intent diagnostic',
      };
      rows.push(row);
      dispositions.push({
        path: expected.path,
        panel,
        disposition: 'admitted',
        caseKey,
        subjectKey: rowSubjectKey,
        canonicalPayloadIdentity: payloadIdentity,
      });
    } catch (error) {
      dispositions.push({ path: expected.path, panel, disposition: 'unresolved', reasons: [`measurement fault: ${error.message}`] });
    }
  }

  const panels = ['receipt-bound', 'current-subject'].map((id) => {
    const panelRows = rows.filter((row) => row.panel === id);
    const panelDispositions = dispositions.filter((entry) => entry.panel === id);
    const unresolved = panelDispositions.filter((entry) => entry.disposition === 'unresolved');
    const cases = groupCases(panelRows);
    const resolvedSubsetMetrics = compareCases(cases);
    const metrics = unresolved.length === 0 ? resolvedSubsetMetrics : {
      ...resolvedSubsetMetrics,
      ranking: { eligibility: 'UNRESOLVED', verdict: 'UNRESOLVED', convertedWins: null, meanMovesSaved: null },
    };
    return {
      id,
      label: id === 'receipt-bound' ? 'receipt-bound candidate/pilot recordings' : 'current-subject replay ordinary play',
      fileCount: manifest.requiredAttemptSources.filter((entry) => panelForSource(entry) === id).length,
      distinctAttempts: panelRows.length,
      caseCount: cases.length,
      initializedGridCollisions: collisionReport(panelRows),
      unresolvedCount: unresolved.length,
      duplicateCount: panelDispositions.filter((entry) => entry.disposition === 'duplicate').length,
      metrics,
      resolvedSubsetMetrics: unresolved.length ? resolvedSubsetMetrics : null,
    };
  });

  return {
    schemaVersion: 2,
    outputSemantics: OUTPUT_VERSION,
    scope: 'fixed descriptive panels; not a population estimate or promotion result',
    executableSourceCommit: executableCommit(root),
    contract: {
      id: manifest.contractId,
      sha256: frozen.contractSha256,
      inputsSha256: frozen.inputsSha256,
      inputIdentity: valueIdentity({ contractSha256: frozen.contractSha256, inputsSha256: frozen.inputsSha256 }),
      sourceRevision: manifest.sourceRevision,
      requiredFileCount: manifest.requiredAttemptSources.length,
    },
    dispositions,
    extras,
    panels,
    rows,
    unresolved: dispositions.filter((entry) => entry.disposition === 'unresolved'),
  };
}

function renderText(result) {
  const lines = [
    result.outputSemantics,
    `${result.scope}.`,
    `executable source commit: ${result.executableSourceCommit}`,
    `contract: ${result.contract.sha256}; inputs: ${result.contract.inputsSha256}`,
  ];
  for (const panel of result.panels) {
    lines.push('');
    lines.push(`${panel.id}: ${panel.metrics.ranking.verdict}`);
    lines.push(`${panel.fileCount} files, ${panel.distinctAttempts} distinct attempts, ${panel.caseCount} cases; ${panel.unresolvedCount} unresolved, ${panel.duplicateCount} duplicates`);
    lines.push(`reference win rate ${formatPercent(panel.metrics.winRates && panel.metrics.winRates.reference)}; human win rate ${formatPercent(panel.metrics.winRates && panel.metrics.winRates.comparison)}`);
    lines.push(`converted wins ${formatNumber(panel.metrics.ranking.convertedWins)}; mean moves saved ${formatNumber(panel.metrics.ranking.meanMovesSaved)}`);
    lines.push('score: matched-horizon, mixed/unknown-intent diagnostic; target disabled for bot, original B retained');
    for (const row of result.rows.filter((entry) => entry.panel === panel.id)) {
      lines.push(`  ${row.file} L${row.level} seed ${row.seed}: human ${row.human.outcome} ${row.human.score}/${row.human.moves}; reference ${row.reference.outcome} ${row.reference.score}/${row.reference.moves}; diagnostic ${row.diagnostic.outcome} ${row.diagnostic.score}/${row.diagnostic.moves} H=${row.diagnostic.externalHorizon}`);
    }
  }
  if (result.extras.length) {
    lines.push('');
    lines.push(`unexpected extras (${result.extras.length}; excluded from frozen denominator):`);
    for (const extra of result.extras) lines.push(`  ${extra.path} ${extra.sha256}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatPercent(value) {
  return value === undefined || value === null ? 'unavailable' : `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  return value === undefined || value === null ? 'unavailable' : String(value);
}

function main() {
  try {
    const result = collect();
    process.stdout.write(process.argv.includes('--json') ? `${JSON.stringify(result, null, 2)}\n` : renderText(result));
    return 0;
  } catch (error) {
    process.stderr.write(`POLICY-EVAL-0001 measurement failed: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exit(main());

module.exports = { collect, discoverRecordingPaths, playBot, renderText };
