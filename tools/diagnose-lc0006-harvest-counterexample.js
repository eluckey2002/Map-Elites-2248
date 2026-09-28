#!/usr/bin/env node
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { canExtendChain } = require('../solver/engine');
const {
  artifactWithIdentity,
  verifyArtifactIdentity,
} = require('./diagnose-lc0004-move6-move8');
const { persistBeforeVerdict, writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const SOURCE_SHA256 = '5afba90eada26b0d3a5b6e5d0f6d92578a4db606c0adaadf93250d746f4d8d90';
const SOURCE_ARTIFACT_ID = 'aba76b65d3c7a89a034c6dc8b2937e1c5b086f9ac23c23f9bcf00b27a42280d1';
const SUBJECT_STATE_ID = '535a53040732ccc4047de5254dd7c9da278d0cd2e005f28e2316c0d3d2e4b2aa';
const SUBJECT_ID = 'M6-CONNECT';
const BASELINE_ID = 'M6-BASELINE';
const BUILT_CUTOFF = 16;

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function coordinateKey({ x, y }) {
  return `${x},${y}`;
}

function kingAdjacent(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx !== 0 || dy !== 0) && Math.max(dx, dy) === 1;
}

function stateFromNormalizedGrid(grid) {
  return {
    grid: grid.map((row, y) => row.map((value, x) => {
      if (value === null) return null;
      if (value === 'stone') {
        return { x, y, value: 0, blocker: 'stone', blockerDuration: 0, bombTimer: 0 };
      }
      return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
    })),
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    minChain: 3,
    tileScale: 1,
  };
}

function openTiles(state) {
  return state.grid.flat().filter((tile) => tile && tile.blocker === null);
}

function builtTiles(state) {
  return openTiles(state).filter((tile) => tile.value > BUILT_CUTOFF);
}

function pathSnapshot(pathTiles) {
  return pathTiles.map(({ x, y, value }) => ({ x, y, value }));
}

function enumerateBuiltPaths(state) {
  const built = builtTiles(state);
  const byKey = new Map(built.map((tile) => [coordinateKey(tile), tile]));
  let best = [];
  const complete = [];
  let visitedPathCount = 0;

  function dfs(chain) {
    visitedPathCount += 1;
    if (chain.length > best.length) best = chain.slice();
    if (chain.length === built.length) complete.push(chain.slice());
    const last = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const next = byKey.get(`${last.x + dx},${last.y + dy}`);
        if (!next || chain.includes(next) || !canExtendChain(chain, next)) continue;
        chain.push(next);
        dfs(chain);
        chain.pop();
      }
    }
  }

  for (const start of built) dfs([start]);
  return {
    builtCount: built.length,
    visitedPathCount,
    maxCoverage: best.length,
    bestPath: pathSnapshot(best),
    completePathCount: complete.length,
    completePaths: complete.map(pathSnapshot),
  };
}

function builtAdjacency(state) {
  const built = builtTiles(state);
  return built.map((tile) => {
    const neighbors = built.filter((other) => kingAdjacent(tile, other));
    return {
      x: tile.x,
      y: tile.y,
      value: tile.value,
      degree: neighbors.length,
      neighbors: neighbors.map(coordinateKey).sort(),
    };
  });
}

function entryEdges(state) {
  const sixteens = openTiles(state).filter((tile) => tile.value === BUILT_CUTOFF);
  const thirtyTwos = builtTiles(state).filter((tile) => tile.value === BUILT_CUTOFF * 2);
  const edges = [];
  for (const from of sixteens) {
    for (const to of thirtyTwos) {
      if (kingAdjacent(from, to)) edges.push({ from: pathSnapshot([from])[0], to: pathSnapshot([to])[0] });
    }
  }
  return edges;
}

function verifyCoverage(pathTiles, built, claimed = null) {
  const pathKeys = new Set(pathTiles.map(coordinateKey));
  const covered = built.filter((tile) => pathKeys.has(coordinateKey(tile)));
  const excluded = built.filter((tile) => !pathKeys.has(coordinateKey(tile)));
  if (claimed) {
    const actualKeys = covered.map(coordinateKey).sort();
    const claimedKeys = claimed.map(coordinateKey).sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify(claimedKeys)) {
      throw new Error(`claimed built coverage mismatch: expected ${actualKeys.join('|')}, observed ${claimedKeys.join('|')}`);
    }
  }
  return {
    builtCount: built.length,
    coveredCount: covered.length,
    complete: excluded.length === 0,
    covered: pathSnapshot(covered),
    excluded: pathSnapshot(excluded),
  };
}

function completeHarvestAvailable(topology, entries) {
  const entryStarts = new Set(entries.map(({ to }) => coordinateKey(to)));
  return topology.completePaths.some((candidate) => entryStarts.has(coordinateKey(candidate[0])));
}

function selectArm(source, id) {
  const arm = source.arms.find((candidate) => candidate.id === id);
  if (!arm) throw new Error(`source arm ${id} missing`);
  return arm;
}

function assertSource(sourcePath, source) {
  if (sha256File(sourcePath) !== SOURCE_SHA256) throw new Error('LC-0004 external identity mismatch');
  if (!verifyArtifactIdentity(source) || source.artifactIdentity !== SOURCE_ARTIFACT_ID) {
    throw new Error('LC-0004 internal artifact identity mismatch');
  }
}

function collectFromManifest(manifestPath, expectedManifestIdentity) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const source = JSON.parse(fs.readFileSync(paths.lc0004Raw, 'utf8'));
  assertSource(paths.lc0004Raw, source);
  const baseline = selectArm(source, BASELINE_ID);
  const subject = selectArm(source, SUBJECT_ID);
  if (subject.after.stateIdentity !== SUBJECT_STATE_ID) throw new Error('M6-CONNECT subject identity mismatch');
  if (!Object.values(subject.invariants).every(Boolean)) throw new Error('LC-0004 M6-CONNECT objective equivalence failed');

  const state = stateFromNormalizedGrid(subject.after.grid);
  const built = builtTiles(state);
  const topology = enumerateBuiltPaths(state);
  const entries = entryEdges(state);
  const selectedCoverage = verifyCoverage(subject.after.nextChampionDecision.chain, built);
  const available = completeHarvestAvailable(topology, entries);
  const sourceFacts = {
    builtCountMatches: built.length === subject.after.diagnostics.normalizedBuiltMaterial.count,
    builtValueMatches: built.reduce((sum, tile) => sum + tile.value, 0)
      === subject.after.diagnostics.normalizedBuiltMaterial.value,
    retainedMaxCoverageMatches: topology.maxCoverage
      === subject.after.diagnostics.normalizedBuiltReservoirHarvest.chainLength,
    retainedComponentMatches: JSON.stringify(subject.after.builtComponentSizes) === JSON.stringify([built.length]),
  };
  if (!Object.values(sourceFacts).every(Boolean)) throw new Error(`retained source fact mismatch: ${JSON.stringify(sourceFacts)}`);

  const artifact = artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0006-complete-harvest-counterexample-raw',
    status: 'COMPLETE',
    finalSubjectIdentity: manifest.artifactIdentity,
    source: {
      artifactIdentity: source.artifactIdentity,
      stateIdentity: subject.after.stateIdentity,
      selectedArm: SUBJECT_ID,
      selectionRule: 'only other LC-0004 CONNECT arm after M8-CONNECT was consumed by LC-0005',
    },
    board: subject.after.grid,
    built: pathSnapshot(built),
    builtAdjacency: builtAdjacency(state),
    entryEdges: entries,
    topology,
    selected: {
      chain: subject.after.nextChampionDecision.chain,
      chainLength: subject.after.nextChampionDecision.chainLength,
      immediatePoints: subject.after.nextChampionDecision.immediatePoints,
      survivor: subject.after.nextChampionDecision.chain.at(-1),
      builtCoverage: selectedCoverage,
    },
    comparison: {
      baseline: {
        id: baseline.id,
        targetCost: baseline.terminal.targetCost,
        immediatePoints: baseline.after.nextChampionDecision.immediatePoints,
      },
      connected: {
        id: subject.id,
        targetCost: subject.terminal.targetCost,
        immediatePoints: subject.after.nextChampionDecision.immediatePoints,
      },
      targetCostDelta: subject.terminal.targetCost - baseline.terminal.targetCost,
    },
    controls: {
      sourceFacts,
      objectiveEquivalent: Object.values(subject.invariants).every(Boolean),
      completeHarvestAvailable: available,
    },
  });
  return artifact;
}

function disposition(artifact) {
  if (!verifyArtifactIdentity(artifact) || artifact.status !== 'COMPLETE') return 'UNVERIFIED';
  if (!artifact.controls.completeHarvestAvailable) return 'IMPOSSIBLE_COMPLETE_HARVEST';
  if (!artifact.selected.builtCoverage.complete) return 'AVAILABLE_UNSELECTED_COMPLETE_HARVEST';
  if (artifact.comparison.targetCostDelta > 0) return 'HARMFUL_COMPLETE_HARVEST';
  return 'NO_COUNTEREXAMPLE';
}

function summaryFromArtifact(artifact) {
  if (!verifyArtifactIdentity(artifact)) throw new Error('raw artifact identity mismatch');
  return {
    artifactIdentity: artifact.artifactIdentity,
    status: artifact.status,
    disposition: disposition(artifact),
    evidence: {
      builtCount: artifact.built.length,
      connectedComponentCount: 1,
      entryEdgeCount: artifact.entryEdges.length,
      maximumLegalBuiltCoverage: artifact.topology.maxCoverage,
      selectedBuiltCoverage: artifact.selected.builtCoverage.coveredCount,
      bestBuiltPath: artifact.topology.bestPath,
      targetCostBaseline: artifact.comparison.baseline.targetCost,
      targetCostConnected: artifact.comparison.connected.targetCost,
      targetCostDelta: artifact.comparison.targetCostDelta,
    },
  };
}

function createManifest({ contractPath }) {
  const files = {
    contract: path.resolve(contractPath),
    lc0004Raw: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0004-move6-move8-causal-contrast-raw.json'),
    engine: path.join(ROOT, 'solver', 'engine.js'),
    bot: path.join(ROOT, 'solver', 'bot.js'),
    lc0005Result: path.join(ROOT, 'docs', 'learning-cycles', 'LC-0005-complete-harvest-chain-result.md'),
    harness: __filename,
    test: path.join(ROOT, 'solver', 'tests', 'lc0006HarvestCounterexample.test.js'),
  };
  const identities = Object.fromEntries(Object.entries(files).map(([name, file]) => [name, sha256File(file)]));
  const contract = fs.readFileSync(files.contract, 'utf8');
  for (const name of ['lc0004Raw', 'engine', 'bot', 'lc0005Result']) {
    if (!contract.includes(identities[name])) throw new Error(`contract does not freeze ${name} identity`);
  }
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0006-complete-harvest-counterexample-manifest',
    paths: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, path.relative(ROOT, file)])),
    identities,
  });
}

function validateManifest(manifest, expectedManifestIdentity) {
  if (!/^[0-9a-f]{64}$/.test(expectedManifestIdentity || '')) {
    throw new TypeError('expected manifest identity must be a full SHA-256');
  }
  if (!verifyArtifactIdentity(manifest)) throw new Error('manifest artifact identity mismatch');
  if (manifest.artifactIdentity !== expectedManifestIdentity) throw new Error('expected manifest identity mismatch');
  if (manifest.kind !== 'lc0006-complete-harvest-counterexample-manifest') throw new Error('unexpected manifest kind');
  const paths = {};
  for (const [name, relative] of Object.entries(manifest.paths)) {
    const file = path.join(ROOT, relative);
    if (sha256File(file) !== manifest.identities[name]) throw new Error(`${name} identity mismatch`);
    paths[name] = file;
  }
  return paths;
}

function runCalibration() {
  const positive = stateFromNormalizedGrid([[16, 32, 32, 32, 64]]);
  const negative = stateFromNormalizedGrid([[16, 32, 32, null, 32, 64]]);
  const positiveTopology = enumerateBuiltPaths(positive);
  const negativeTopology = enumerateBuiltPaths(negative);
  const positiveAvailable = completeHarvestAvailable(positiveTopology, entryEdges(positive));
  const negativeAvailable = completeHarvestAvailable(negativeTopology, entryEdges(negative));

  const built = builtTiles(positive);
  const incomplete = positiveTopology.bestPath.slice(0, -1);
  const clean = verifyCoverage(incomplete, built);
  let mutationKilled = false;
  let mutationMessage = null;
  try {
    verifyCoverage(incomplete, built, clean.covered.concat(clean.excluded.slice(0, 1)));
  } catch (error) {
    mutationKilled = true;
    mutationMessage = error.message;
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc0006-persist-'));
  const retainedPath = path.join(directory, 'raw.json');
  const disposable = artifactWithIdentity({ status: 'COMPLETE', planted: true });
  let plantedFailureObserved = false;
  try {
    persistBeforeVerdict({
      file: retainedPath,
      artifact: disposable,
      evaluate() { throw new Error('planted interpretation failure'); },
    });
  } catch (error) {
    plantedFailureObserved = /planted interpretation failure/.test(error.message);
  }
  const persistencePass = plantedFailureObserved
    && fs.existsSync(retainedPath)
    && JSON.parse(fs.readFileSync(retainedPath, 'utf8')).artifactIdentity === disposable.artifactIdentity;

  return [
    {
      id: 'C3-real-predicate-known-kill',
      pass: positiveAvailable && !negativeAvailable && negativeTopology.maxCoverage < positiveTopology.builtCount,
      observed: {
        positiveAvailable,
        positiveMaxCoverage: positiveTopology.maxCoverage,
        negativeAvailable,
        negativeMaxCoverage: negativeTopology.maxCoverage,
        plantedGapPresent: negative.grid[0][3] === null,
      },
    },
    {
      id: 'C4-planted-coverage-mutation',
      pass: mutationKilled && /claimed built coverage mismatch/.test(mutationMessage || ''),
      observed: { mutationKilled, mutationMessage },
    },
    {
      id: 'C5-persistence',
      pass: persistencePass,
      observed: { plantedFailureObserved, rawRetained: fs.existsSync(retainedPath) },
    },
  ];
}

function committedFileMatches(file) {
  const relative = path.relative(ROOT, file);
  const committed = execFileSync('git', ['show', `HEAD:${relative}`], { cwd: ROOT });
  return committed.equals(fs.readFileSync(file));
}

function qualifyHarness({ manifestPath, expectedManifestIdentity, reportableOut }) {
  if (fs.existsSync(reportableOut)) throw new Error('reportable raw output must be absent before qualification');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, expectedManifestIdentity);
  const committed = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, committedFileMatches(file)]));
  const source = JSON.parse(fs.readFileSync(paths.lc0004Raw, 'utf8'));
  assertSource(paths.lc0004Raw, source);
  const subject = selectArm(source, SUBJECT_ID);
  const baseline = selectArm(source, BASELINE_ID);
  const sourceControls = [
    {
      id: 'C1-frozen-source-identity',
      pass: source.artifactIdentity === SOURCE_ARTIFACT_ID && subject.after.stateIdentity === SUBJECT_STATE_ID,
      observed: { sourceArtifactIdentity: source.artifactIdentity, subjectStateIdentity: subject.after.stateIdentity },
    },
    {
      id: 'C2-retained-comparison-identity',
      pass: baseline.terminal.targetCost === 15
        && subject.terminal.targetCost === 16
        && Object.values(subject.invariants).every(Boolean),
      observed: { baselineTargetCost: baseline.terminal.targetCost, connectedTargetCost: subject.terminal.targetCost, invariants: subject.invariants },
    },
  ];
  const controls = sourceControls.concat(runCalibration());
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = sha256Bytes(JSON.stringify(body));
  let coherentSubstitutionRejected = false;
  try {
    validateManifest(coherent, expectedManifestIdentity);
  } catch (error) {
    coherentSubstitutionRejected = /expected manifest identity mismatch/.test(error.message);
  }
  const pass = Object.values(committed).every(Boolean)
    && controls.every((control) => control.pass)
    && coherentSubstitutionRejected;
  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0006-harness-qualification',
    status: pass ? 'PASS' : 'FAIL',
    oracle: path.relative(ROOT, paths.contract),
    manifestIdentity: manifest.artifactIdentity,
    harnessIdentity: manifest.identities.harness,
    attempt: 1,
    committed,
    coherentSubstitutionRejected,
    controls,
    uncertainties: [],
  });
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) throw new Error(`--${name} is required`);
  return process.argv[index + 1];
}

function optionalArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 || index === process.argv.length - 1 ? null : process.argv[index + 1];
}

function main() {
  const manifestOut = optionalArg('write-manifest');
  if (manifestOut) {
    const manifest = createManifest({ contractPath: arg('contract') });
    writeJsonOnce(path.resolve(manifestOut), manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  const summarize = optionalArg('summarize');
  if (summarize) {
    process.stdout.write(`${JSON.stringify(summaryFromArtifact(JSON.parse(fs.readFileSync(path.resolve(summarize), 'utf8'))), null, 2)}\n`);
    return;
  }
  const qualificationOut = optionalArg('qualify-out');
  if (qualificationOut) {
    const receipt = qualifyHarness({
      manifestPath: path.resolve(arg('manifest')),
      expectedManifestIdentity: arg('expected-manifest-identity'),
      reportableOut: path.resolve(arg('reportable-out')),
    });
    writeJsonOnce(path.resolve(qualificationOut), receipt);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    if (receipt.status !== 'PASS') process.exitCode = 1;
    return;
  }
  const artifact = collectFromManifest(path.resolve(arg('manifest')), arg('expected-manifest-identity'));
  const summary = persistBeforeVerdict({
    file: path.resolve(arg('out')),
    artifact,
    validate(value) { if (!verifyArtifactIdentity(value)) throw new Error('raw artifact identity mismatch'); },
    evaluate: summaryFromArtifact,
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  collectFromManifest,
  completeHarvestAvailable,
  createManifest,
  disposition,
  entryEdges,
  enumerateBuiltPaths,
  qualifyHarness,
  stateFromNormalizedGrid,
  summaryFromArtifact,
  validateManifest,
  verifyCoverage,
};
