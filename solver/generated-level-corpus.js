#!/usr/bin/env node

const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { makeRng } = require('./engine');
const {
  gateVerdict,
  sampleShape,
  screen,
  screenVerdict,
  shapeSignature,
} = require('./generate-levels');
const {
  canonicalJson,
  deriveCandidate,
  identity,
  serialize,
  verifyCandidate,
} = require('./level-author');
const { calibrationStamp } = require('./calibration');
const { DEFAULT_PARAMS } = require('./bot');

const ROOT = path.join(__dirname, '..');
const PROTOCOL_PATH = '.orch/runs/2026-08-29-generated-level-corpus-preregistration/preregistration.md';

const PROTOCOL = Object.freeze({
  name: 'generated-level-corpus-v1',
  candidateLevel: 54,
  samplerSeeds: Object.freeze([2026082901, 2026082902, 2026082903, 2026082904]),
  drawsPerSeed: 120,
  cleanQuota: 60,
  stressProbeQuota: 12,
});

const PINNED = Object.freeze({
  protocolIdentity: 'fb4b8ad8e599c4b28373b477de45f48ac64669f69409eec4519f96d8cf4c7ae0',
  protectedChampion: '52f500c03a11699cb6bd7c3cab7f6a232470e0dd',
  sourceHashes: Object.freeze({
    'solver/bot.js': '9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840',
    'solver/engine.js': '4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6',
    'solver/generate-levels.js': 'd7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842',
    'solver/level-author.js': 'defa481e1e45e1de7caa851d479171330a7d832f41c057e5cae75c3646b6454d',
    'solver/calibration.js': '584f99aae3dafd7fccd7dc25e0adcb2ae9867f85d267a79261d528c40e1f774f',
    'src/game.js': '541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee',
  }),
  calibration: Object.freeze({
    version: 'calib-1',
    params: Object.freeze({
      wRoll: 1,
      wPlace: 1,
      turnover: 40,
      width: 24,
      bombMax: 9,
      tieBreak: 'degree',
      wHarvest: 0,
      offerFull: 0,
      pathWidth: 1,
    }),
    solverIdentity: '53550f5ea9b8ab428db02f0c94c5a89f92c5d282221a6da935eddfe6d59370f7',
  }),
});

const GAMEPLAY_SEED_RANGES = Object.freeze([
  Object.freeze({ name: 'optimization', start: 20_000_000, count: 12 }),
  Object.freeze({ name: 'development-check', start: 21_000_000, count: 24 }),
  Object.freeze({ name: 'audit', start: 22_000_000, count: 48 }),
]);

const MAX_GAME_BUDGET = 76_320;
const RELAXED_GATES = Object.freeze({ minWinRate: 0, maxBombRate: 1, requireZeroLockouts: false });

const AREA_BANDS = Object.freeze(['compact', 'medium', 'large']);
const MOVE_DENSITY_BANDS = Object.freeze(['tight', 'middle', 'loose']);
const MIN_CHAINS = Object.freeze([3, 4]);
const BLOCKER_CLASSES = Object.freeze(['none', 'static-only', 'timed-no-bomb', 'bomb-present']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function areaBand(cells) {
  if (cells >= 20 && cells <= 29) return 'compact';
  if (cells >= 30 && cells <= 41) return 'medium';
  if (cells >= 42 && cells <= 56) return 'large';
  throw new Error(`board area ${cells} is outside the frozen family map`);
}

function moveDensityBand(moves, cells) {
  if (moves * 12 < cells * 7) return 'tight';
  if (moves * 3 <= cells * 2) return 'middle';
  return 'loose';
}

function blockerClass(blockers) {
  if (blockers.length === 0) return 'none';
  if (blockers.some((blocker) => blocker.type === 'bomb')) return 'bomb-present';
  if (blockers.some((blocker) => blocker.type === 'ice')) return 'timed-no-bomb';
  if (blockers.every((blocker) => blocker.type === 'stone')) return 'static-only';
  throw new Error('blockers do not fit the frozen family map');
}

function familyForShape(shape) {
  const cells = shape.gridW * shape.gridH;
  const family = {
    areaBand: areaBand(cells),
    moveDensityBand: moveDensityBand(shape.moves, cells),
    minChain: shape.minChain,
    blockerClass: blockerClass(shape.blockers),
  };
  if (!MIN_CHAINS.includes(family.minChain)) {
    throw new Error(`minimum chain ${family.minChain} is outside the frozen family map`);
  }
  return { ...family, key: [family.areaBand, family.moveDensityBand, family.minChain, family.blockerClass].join('/') };
}

function allFamilyKeys() {
  const keys = [];
  for (const area of AREA_BANDS) {
    for (const density of MOVE_DENSITY_BANDS) {
      for (const minChain of MIN_CHAINS) {
        for (const blockers of BLOCKER_CLASSES) keys.push([area, density, minChain, blockers].join('/'));
      }
    }
  }
  return keys.sort();
}

function partitionForFamily(familyKey) {
  const digest = crypto.createHash('sha256')
    .update(`${PROTOCOL.name}/partition/${familyKey}`)
    .digest();
  const bucket = digest.readUInt32BE(0) % 10;
  const name = bucket <= 5 ? 'optimization' : bucket <= 7 ? 'development-check' : 'audit';
  return { bucket, name };
}

function corpusShapeName(samplerSeed, drawIndex) {
  return `corpus-s${samplerSeed}-gen-${String(drawIndex).padStart(4, '0')}`;
}

function buildPlan(options = {}) {
  const samplerSeeds = options.samplerSeeds || PROTOCOL.samplerSeeds;
  const sample = options.sampleShape || sampleShape;
  const rngFactory = options.makeRng || makeRng;
  const rawDraws = [];
  const firstBySignature = new Map();
  const uniqueShapes = [];

  for (const samplerSeed of samplerSeeds) {
    const rng = rngFactory(samplerSeed);
    for (let drawIndex = 0; drawIndex < PROTOCOL.drawsPerSeed; drawIndex++) {
      const sampled = sample(rng, PROTOCOL.candidateLevel, drawIndex);
      const shaped = { ...sampled, name: corpusShapeName(samplerSeed, drawIndex) };
      const signature = shapeSignature(shaped);
      const slotId = `s${samplerSeed}-d${String(drawIndex).padStart(3, '0')}`;
      const duplicateOf = firstBySignature.get(signature) || null;
      const family = familyForShape(shaped);
      const partition = partitionForFamily(family.key);
      const entry = {
        slotId,
        samplerSeed,
        drawIndex,
        shape: shaped,
        signature,
        duplicateOf,
        familyKey: family.key,
        demandStratum: shaped.demand,
        partition,
      };
      rawDraws.push(entry);
      if (duplicateOf === null) {
        firstBySignature.set(signature, slotId);
        uniqueShapes.push(entry);
      }
    }
  }

  return {
    schemaVersion: 1,
    protocol: PROTOCOL.name,
    candidateLevel: PROTOCOL.candidateLevel,
    samplerSeeds: [...samplerSeeds],
    drawsPerSeed: PROTOCOL.drawsPerSeed,
    familyMap: allFamilyKeys().map((familyKey) => ({ familyKey, partition: partitionForFamily(familyKey) })),
    rawDraws,
    uniqueShapes,
  };
}

function selectionHash(entry) {
  return sha256(`${PROTOCOL.name}/candidate/${entry.signature}`);
}

function roundRobinByFamily(entries, limit) {
  const groups = new Map();
  for (const entry of entries) {
    if (entry.duplicateOf !== null) continue;
    if (!groups.has(entry.familyKey)) groups.set(entry.familyKey, []);
    groups.get(entry.familyKey).push(entry);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => selectionHash(a).localeCompare(selectionHash(b)) || a.slotId.localeCompare(b.slotId));
  }
  const familyKeys = [...groups.keys()].sort();
  const selected = [];
  let depth = 0;
  while (selected.length < limit) {
    let added = 0;
    for (const familyKey of familyKeys) {
      const entry = groups.get(familyKey)[depth];
      if (!entry) continue;
      selected.push(entry);
      added += 1;
      if (selected.length === limit) break;
    }
    if (added === 0) break;
    depth += 1;
  }
  return selected;
}

function selectForFullMeasurement(entries) {
  const eligible = entries.filter((entry) => entry.duplicateOf === null);
  const clean = roundRobinByFamily(
    eligible.filter((entry) => entry.screenRejection === null),
    PROTOCOL.cleanQuota,
  );
  const stressProbe = roundRobinByFamily(
    eligible.filter((entry) => entry.screenRejection !== null),
    PROTOCOL.stressProbeQuota,
  );
  return { clean, stressProbe, selected: [...clean, ...stressProbe] };
}

function serializePlan(plan) {
  return serialize(plan);
}

function sourceHashes(root = ROOT) {
  return Object.fromEntries(Object.keys(PINNED.sourceHashes).map((relativePath) => [
    relativePath,
    sha256(fs.readFileSync(path.join(root, relativePath))),
  ]));
}

function championExists(root = ROOT) {
  try {
    childProcess.execFileSync('git', ['cat-file', '-e', `${PINNED.protectedChampion}^{commit}`], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function repositoryState(root = ROOT) {
  return {
    head: childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString('utf8').trim(),
    dirty: childProcess.execFileSync('git', ['status', '--porcelain'], { cwd: root }).toString('utf8').trim().length > 0,
  };
}

function rangesOverlap(left, right) {
  const leftEnd = left.start + left.count - 1;
  const rightEnd = right.start + right.count - 1;
  return left.start <= rightEnd && right.start <= leftEnd;
}

function scanDeclaredSeedRanges(root = ROOT) {
  const ignored = new Set([
    PROTOCOL_PATH,
    'solver/generated-level-corpus.js',
    'solver/tests/generatedLevelCorpus.test.js',
  ]);
  const tracked = childProcess.execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  const collisions = [];
  for (const relativePath of tracked) {
    if (ignored.has(relativePath)) continue;
    const lines = fs.readFileSync(path.join(root, relativePath), 'utf8').split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const literals = lines[lineIndex].match(/\b\d[\d_,]*\b/g) || [];
      for (const literal of literals) {
        const value = Number(literal.replaceAll('_', '').replaceAll(',', ''));
        if (!Number.isSafeInteger(value)) continue;
        const registered = GAMEPLAY_SEED_RANGES.find((range) => rangesOverlap(
          { start: value, count: 1 }, range,
        ));
        if (registered) {
          collisions.push({
            name: `${relativePath}:${lineIndex + 1}`,
            start: value,
            count: 1,
            registeredRange: registered.name,
          });
        }
      }
    }
  }
  return collisions;
}

function preflight(options = {}) {
  const root = options.root || ROOT;
  const observedSources = options.sourceHashes || sourceHashes(root);
  const observedCalibration = options.calibration || calibrationStamp();
  const observedProtocolIdentity = options.protocolIdentity || sha256(fs.readFileSync(path.join(root, PROTOCOL_PATH)));
  const observedChampion = options.championExists === undefined ? championExists(root) : options.championExists;
  const declaredSeedRanges = options.declaredSeedRanges === undefined
    ? scanDeclaredSeedRanges(root)
    : options.declaredSeedRanges;
  const failures = [];

  for (const [relativePath, expected] of Object.entries(PINNED.sourceHashes)) {
    if (observedSources[relativePath] !== expected) failures.push(`source identity mismatch: ${relativePath}`);
  }
  if (canonicalJson(observedCalibration) !== canonicalJson(PINNED.calibration)) {
    failures.push('calibration stamp mismatch');
  }
  if (observedProtocolIdentity !== PINNED.protocolIdentity) failures.push('protocol identity mismatch');
  if (!observedChampion) failures.push('protected champion commit is missing');
  for (const declared of declaredSeedRanges) {
    for (const registered of GAMEPLAY_SEED_RANGES) {
      if (rangesOverlap(declared, registered)) {
        failures.push(`gameplay seed collision: ${declared.name} overlaps ${registered.name}`);
      }
    }
  }

  return {
    status: failures.length === 0 ? 'PASS' : 'INVALIDATED',
    failures,
    protocolIdentity: observedProtocolIdentity,
    sourceHashes: observedSources,
    calibration: observedCalibration,
    protectedChampion: PINNED.protectedChampion,
    championParams: { ...DEFAULT_PARAMS },
    repository: repositoryState(root),
    gameplaySeedRanges: GAMEPLAY_SEED_RANGES,
  };
}

function distinct(values) {
  return new Set(values);
}

function evaluateCoverage(measurements) {
  const playable = measurements.filter((entry) => entry.admissionLabel === 'playable-core');
  const familyKeys = distinct(playable.map((entry) => entry.familyKey));
  const familyParts = [...familyKeys].map((key) => key.split('/'));
  const axisCoverage = {
    area: distinct(familyParts.map((parts) => parts[0])),
    density: distinct(familyParts.map((parts) => parts[1])),
    minChain: distinct(familyParts.map((parts) => parts[2])),
    blockers: distinct(familyParts.map((parts) => parts[3])),
  };
  const demandCounts = Object.fromEntries([0.8, 0.85, 0.9, 0.95].map((demand) => [
    demand,
    playable.filter((entry) => entry.demandStratum === demand).length,
  ]));
  const partitionFamilies = { optimization: new Set(), 'development-check': new Set(), audit: new Set() };
  for (const entry of playable) partitionFamilies[entry.partition.name].add(entry.familyKey);
  const candidateIdentities = measurements.map((entry) => entry.candidateIdentity).filter(Boolean);
  const receiptIdentities = measurements.map((entry) => entry.receiptIdentity).filter(Boolean);
  const integrityPass = measurements.every((entry) => (
    entry.replayIntegrity === 'PASS' && entry.candidateIdentity && entry.receiptIdentity
  )) && distinct(candidateIdentities).size === measurements.length
    && distinct(receiptIdentities).size === measurements.length;

  const conditions = [
    { id: 'family-count', pass: familyKeys.size >= 36, observed: familyKeys.size, required: 36 },
    {
      id: 'axis-coverage',
      pass: axisCoverage.area.size === 3 && axisCoverage.density.size === 3
        && axisCoverage.minChain.size === 2 && axisCoverage.blockers.size === 4,
      observed: Object.fromEntries(Object.entries(axisCoverage).map(([key, values]) => [key, [...values].sort()])),
    },
    { id: 'demand-coverage', pass: Object.values(demandCounts).every((count) => count >= 6), observed: demandCounts, requiredPerDemand: 6 },
    {
      id: 'partition-coverage',
      pass: partitionFamilies.optimization.size >= 18
        && partitionFamilies['development-check'].size >= 6
        && partitionFamilies.audit.size >= 6,
      observed: Object.fromEntries(Object.entries(partitionFamilies).map(([key, values]) => [key, values.size])),
      required: { optimization: 18, 'development-check': 6, audit: 6 },
    },
    { id: 'identity-integrity', pass: integrityPass, observed: { measurements: measurements.length } },
  ];
  return { status: conditions.every((condition) => condition.pass) ? 'PASS' : 'INCONCLUSIVE', conditions };
}

async function runCorpus(options = {}) {
  const dependencies = {
    planBuilder: buildPlan,
    screen,
    screenVerdict,
    deriveCandidate,
    verifyCandidate,
    gateVerdict,
    ...options.dependencies,
  };
  const preflightResult = preflight(options.preflightOptions);
  if (preflightResult.status !== 'PASS') return { status: 'INVALIDATED', preflight: preflightResult };

  let plan;
  try {
    plan = dependencies.planBuilder(options.planOptions || {});
  } catch (error) {
    return { status: 'BLOCKED', reason: error.message, preflight: preflightResult };
  }

  const screened = [];
  try {
    for (const entry of plan.uniqueShapes) {
      const measurement = await dependencies.screen(entry.shape);
      screened.push({
        ...entry,
        screen: measurement,
        screenRejection: dependencies.screenVerdict(measurement),
        selectionHash: selectionHash(entry),
      });
    }
  } catch (error) {
    return { status: 'BLOCKED', reason: error.message, preflight: preflightResult, plan };
  }

  const selection = selectForFullMeasurement(screened);
  const cleanIds = new Set(selection.clean.map((entry) => entry.slotId));
  const stressIds = new Set(selection.stressProbe.map((entry) => entry.slotId));
  const measurements = [];
  for (const entry of selection.selected) {
    let authored = null;
    try {
      authored = await dependencies.deriveCandidate(entry.shape);
      await dependencies.verifyCandidate(authored.store, authored.receipt, { gates: RELAXED_GATES });
      const verdict = dependencies.gateVerdict(authored.receipt);
      measurements.push({
        slotId: entry.slotId,
        familyKey: entry.familyKey,
        demandStratum: entry.demandStratum,
        partition: entry.partition,
        selectionOrigin: stressIds.has(entry.slotId) ? 'stress-probe' : 'clean',
        candidate: authored.store.candidates[0],
        receipt: authored.receipt,
        candidateIdentity: authored.receipt.candidateIdentity || identity(authored.store.candidates[0]),
        receiptIdentity: authored.receipt.receiptIdentity || identity(authored.receipt),
        replayIntegrity: 'PASS',
        gate: verdict,
        admissionLabel: verdict.pass ? 'playable-core' : 'adversarial-stress',
      });
    } catch (error) {
      measurements.push({
        slotId: entry.slotId,
        familyKey: entry.familyKey,
        demandStratum: entry.demandStratum,
        partition: entry.partition,
        selectionOrigin: stressIds.has(entry.slotId) ? 'stress-probe' : 'clean',
        candidate: authored && authored.store && authored.store.candidates[0],
        receipt: authored && authored.receipt,
        candidateIdentity: authored && authored.receipt && authored.receipt.candidateIdentity,
        receiptIdentity: authored && authored.receipt && authored.receipt.receiptIdentity,
        replayIntegrity: 'FAIL',
        replayError: error.message,
        admissionLabel: 'unverified',
      });
    }
  }

  const coverage = evaluateCoverage(measurements);
  const screens = screened.map((entry) => ({
    ...entry,
    fullAuthoringDisposition: cleanIds.has(entry.slotId)
      ? 'selected-clean'
      : stressIds.has(entry.slotId)
        ? 'selected-stress-probe'
        : entry.screenRejection === null
          ? 'not-selected-clean'
          : 'not-selected-screen-rejected',
  }));
  const gameBudget = {
    screen: plan.uniqueShapes.length * 24,
    authoring: selection.selected.length * 450,
    replay: selection.selected.length * 450,
  };
  gameBudget.maximum = gameBudget.screen + gameBudget.authoring + gameBudget.replay;
  if (gameBudget.maximum > MAX_GAME_BUDGET) {
    return { status: 'BLOCKED', reason: `game budget ${gameBudget.maximum} exceeds ${MAX_GAME_BUDGET}` };
  }

  const manifest = {
    schemaVersion: 1,
    protocol: PROTOCOL.name,
    preflight: preflightResult,
    run: {
      command: options.command || null,
      repository: preflightResult.repository,
    },
    familyMap: plan.familyMap,
    rawDraws: plan.rawDraws,
    uniqueShapeCount: plan.uniqueShapes.length,
    screens,
    selection: {
      clean: selection.clean.map((entry) => entry.slotId),
      stressProbe: selection.stressProbe.map((entry) => entry.slotId),
    },
    measurements,
    coverage,
    gameBudget,
  };
  return { status: coverage.status, preflight: preflightResult, manifest };
}

function assertRunScopedOutput(outDir, allowedRoot) {
  const resolvedRoot = fs.realpathSync(allowedRoot);
  const resolvedParent = fs.realpathSync(path.dirname(path.resolve(outDir)));
  if (resolvedParent !== resolvedRoot) throw new Error('output is outside allowed run root');
  const resolvedOut = path.resolve(outDir);
  if (fs.existsSync(resolvedOut)) throw new Error(`output already exists: ${resolvedOut}`);
  return resolvedOut;
}

function writeExclusive(file, bytes) {
  fs.writeFileSync(file, bytes, { flag: 'wx' });
}

function writePlan(plan, outDir, options = {}) {
  const allowedRoot = options.allowedRoot || path.join(ROOT, '.orch', 'runs');
  const resolvedOut = assertRunScopedOutput(outDir, allowedRoot);
  fs.mkdirSync(resolvedOut);
  writeExclusive(path.join(resolvedOut, 'plan.json'), serializePlan(plan));
  return { outDir: resolvedOut, files: ['plan.json'] };
}

function renderReport(result) {
  const manifest = result.manifest || {};
  const measurements = manifest.measurements || [];
  const labels = {};
  for (const measurement of measurements) {
    labels[measurement.admissionLabel] = (labels[measurement.admissionLabel] || 0) + 1;
  }
  const conditions = manifest.coverage && manifest.coverage.conditions
    ? manifest.coverage.conditions.map((condition) => `- ${condition.id}: ${condition.pass ? 'PASS' : 'FAIL'}`).join('\n')
    : '- coverage: unavailable';
  return [
    '# Generated level corpus result',
    '',
    `- Protocol: ${manifest.protocol || PROTOCOL.name}`,
    `- Status: ${result.status}`,
    `- Raw draw slots: ${(manifest.rawDraws || []).length}`,
    `- Measurements: ${measurements.length}`,
    `- Admission labels: ${canonicalJson(labels)}`,
    '',
    '## Coverage',
    '',
    conditions,
    '',
  ].join('\n');
}

function writeEvidence(result, outDir, options = {}) {
  if (!result.manifest) throw new Error('execution result has no manifest');
  const allowedRoot = options.allowedRoot || path.join(ROOT, '.orch', 'runs');
  const resolvedOut = assertRunScopedOutput(outDir, allowedRoot);
  const report = renderReport(result);
  const reportHash = sha256(report);
  const manifest = {
    ...result.manifest,
    resultStatus: result.status,
    artifactHashes: { 'report.md': reportHash },
  };
  const manifestBytes = serialize(manifest);
  const manifestHash = sha256(manifestBytes);
  const checksumIndex = `${manifestHash}  manifest.json\n${reportHash}  report.md\n`;

  fs.mkdirSync(resolvedOut);
  writeExclusive(path.join(resolvedOut, 'manifest.json'), manifestBytes);
  writeExclusive(path.join(resolvedOut, 'report.md'), report);
  writeExclusive(path.join(resolvedOut, 'sha256sums.txt'), checksumIndex);
  return {
    outDir: resolvedOut,
    files: ['manifest.json', 'report.md', 'sha256sums.txt'],
    hashes: { 'manifest.json': manifestHash, 'report.md': reportHash },
  };
}

function parseArgs(argv) {
  const modes = ['--dry-run', '--plan', '--execute'].filter((flag) => argv.includes(flag));
  if (modes.length !== 1) throw new Error('choose exactly one of --dry-run, --plan, or --execute');
  const valueAfter = (flag) => {
    const index = argv.indexOf(flag);
    return index === -1 ? null : argv[index + 1];
  };
  const known = new Set(['--dry-run', '--plan', '--execute', '--out', '--confirm']);
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    if (!known.has(value)) throw new Error(`unknown option ${value}`);
    if (value === '--out' || value === '--confirm') index += 1;
  }
  const mode = modes[0].slice(2);
  const out = valueAfter('--out');
  const confirm = valueAfter('--confirm');
  if ((mode === 'plan' || mode === 'execute') && !out) throw new Error(`${modes[0]} requires --out`);
  if (mode === 'execute' && confirm !== PROTOCOL.name) {
    throw new Error(`--execute requires --confirm ${PROTOCOL.name}`);
  }
  return { mode, out, confirm };
}

async function main(argv = process.argv.slice(2), options = {}) {
  const stdout = options.stdout || ((value) => process.stdout.write(value));
  const stderr = options.stderr || ((value) => process.stderr.write(value));
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    stderr(`FAIL: ${error.message}\n`);
    return 1;
  }

  const preflightOptions = options.preflightOptions || {};
  if (args.mode === 'dry-run' || args.mode === 'plan') {
    const check = preflight(preflightOptions);
    if (check.status !== 'PASS') {
      stderr(`INVALIDATED: ${check.failures.join('; ')}\n`);
      return 2;
    }
    let plan;
    try {
      plan = buildPlan(options.planOptions || {});
      if (args.mode === 'dry-run') stdout(serializePlan(plan));
      else writePlan(plan, args.out, { allowedRoot: options.allowedRoot });
    } catch (error) {
      stderr(`FAIL: ${error.message}\n`);
      return 1;
    }
    return 0;
  }

  const result = await runCorpus({
    preflightOptions,
    planOptions: options.planOptions,
    dependencies: options.dependencies,
    command: ['node', 'solver/generated-level-corpus.js', ...argv],
  });
  if (result.status === 'INVALIDATED' || result.status === 'BLOCKED') {
    stderr(`${result.status}: ${result.reason || result.preflight.failures.join('; ')}\n`);
    return 2;
  }
  try {
    writeEvidence(result, args.out, { allowedRoot: options.allowedRoot });
  } catch (error) {
    stderr(`FAIL: ${error.message}\n`);
    return 1;
  }
  stdout(`${result.status}\n`);
  return 0;
}

if (require.main === module) {
  main().then((exitCode) => { process.exitCode = exitCode; });
}

module.exports = {
  GAMEPLAY_SEED_RANGES,
  MAX_GAME_BUDGET,
  PINNED,
  PROTOCOL,
  allFamilyKeys,
  buildPlan,
  evaluateCoverage,
  familyForShape,
  main,
  partitionForFamily,
  preflight,
  runCorpus,
  scanDeclaredSeedRanges,
  selectForFullMeasurement,
  serializePlan,
  writeEvidence,
  writePlan,
};
