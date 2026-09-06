const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CONTRACT_RELATIVE = 'docs/evaluation/POLICY-EVAL-0001/contract.md';
const INPUTS_RELATIVE = 'docs/evaluation/POLICY-EVAL-0001/inputs.json';
const CONTRACT_SHA256 = '3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f';
const INPUTS_SHA256 = '1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb';

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileSha256(file) {
  return sha256(fs.readFileSync(file));
}

function valueIdentity(value) {
  return sha256(canonicalJson(value));
}

function verifyPinnedFile(file, expectedSha256) {
  if (!fs.existsSync(file)) return { ok: false, reason: 'missing', actualSha256: null };
  const actualSha256 = fileSha256(file);
  return actualSha256 === expectedSha256
    ? { ok: true, actualSha256 }
    : { ok: false, reason: 'sha256-mismatch', actualSha256 };
}

function validateSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('seed must be an integer from 0 through 4294967295');
  }
  return seed;
}

function canonicalBlockers(subject) {
  const seen = new Set();
  return (subject.blockers || []).map((blocker) => {
    if (!blocker || !['stone', 'ice', 'bomb'].includes(blocker.type)) {
      throw new Error('unsupported blocker type');
    }
    const key = `${blocker.x},${blocker.y}`;
    if (seen.has(key)) throw new Error(`duplicate blocker coordinate ${key}`);
    seen.add(key);
    const normalized = { type: blocker.type, x: blocker.x, y: blocker.y };
    if (blocker.type === 'ice') normalized.duration = blocker.duration;
    if (blocker.type === 'bomb') normalized.timer = blocker.timer;
    return normalized;
  }).sort((a, b) => a.y - b.y || a.x - b.x || a.type.localeCompare(b.type));
}

function subjectPayload(subject) {
  return {
    gridW: subject.gridW,
    gridH: subject.gridH,
    minChain: subject.minChain,
    tileScale: subject.tileScale || 1,
    target: subject.target,
    moves: subject.moves,
    blockers: canonicalBlockers(subject),
  };
}

function subjectKey(subject) {
  return valueIdentity(subjectPayload(subject));
}

function loadFrozenInputs({ root = ROOT } = {}) {
  const contractPath = path.join(root, CONTRACT_RELATIVE);
  const inputsPath = path.join(root, INPUTS_RELATIVE);
  const contract = verifyPinnedFile(contractPath, CONTRACT_SHA256);
  const inputs = verifyPinnedFile(inputsPath, INPUTS_SHA256);
  if (!contract.ok) throw new Error(`frozen contract ${contract.reason}`);
  if (!inputs.ok) throw new Error(`frozen inputs ${inputs.reason}`);
  const manifest = JSON.parse(fs.readFileSync(inputsPath, 'utf8'));
  if (manifest.contractId !== 'POLICY-EVAL-0001' || manifest.schemaVersion !== 1) {
    throw new Error('frozen manifest contract identity mismatch');
  }
  for (const source of manifest.sources.filter((entry) => entry.role === 'behavior-binding')) {
    const result = verifyPinnedFile(path.join(root, source.path), source.sha256);
    if (!result.ok) throw new Error(`behavior-binding source ${source.path} ${result.reason}`);
  }
  return {
    contractPath,
    inputsPath,
    contractSha256: contract.actualSha256,
    inputsSha256: inputs.actualSha256,
    manifest,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function receiptIdentityValid(receipt) {
  const field = receipt.receiptIdentity ? 'receiptIdentity' : (receipt.artifactIdentity ? 'artifactIdentity' : null);
  if (!field) return true;
  const unsigned = { ...receipt };
  delete unsigned[field];
  return valueIdentity(unsigned) === receipt[field];
}

function addCandidate(index, candidate, receipt, candidateSource, receiptSource) {
  const claimed = receipt && receipt.candidateIdentity;
  const contentIdentity = valueIdentity(candidate);
  if (typeof claimed !== 'string' || contentIdentity !== claimed) {
    index.invalid.push({ source: candidateSource, receiptSource, reason: 'candidate content identity mismatch' });
    return;
  }
  if (!receiptIdentityValid(receipt)) {
    index.invalid.push({ source: candidateSource, receiptSource, reason: 'receipt self-identity mismatch' });
    return;
  }
  const existing = index.candidates.get(claimed);
  if (existing && canonicalJson(existing.candidate) !== canonicalJson(candidate)) {
    index.invalid.push({ source: candidateSource, receiptSource, reason: 'duplicate candidate identity has different content' });
    index.candidates.delete(claimed);
    return;
  }
  if (!existing) {
    index.candidates.set(claimed, {
      candidate,
      candidateIdentity: claimed,
      contentIdentity,
      candidateSource,
      receiptSource,
      receiptIdentity: receipt.receiptIdentity || receipt.artifactIdentity || null,
    });
  }
}

function scanCandidateStores(index, dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.startsWith('candidate-levels') || !name.endsWith('.json') || name.endsWith('.receipt.json')) continue;
    const candidateSource = path.join(dir, name);
    const receiptSource = candidateSource.replace(/\.json$/, '.receipt.json');
    if (!fs.existsSync(receiptSource)) continue;
    try {
      const store = readJson(candidateSource);
      const receipt = readJson(receiptSource);
      const candidates = store.candidates || [];
      const receipts = Array.isArray(receipt) ? receipt : (receipt.receipts || [receipt]);
      for (let i = 0; i < Math.min(candidates.length, receipts.length); i++) {
        addCandidate(index, candidates[i], receipts[i], candidateSource, receiptSource);
      }
    } catch (error) {
      index.invalid.push({ source: candidateSource, receiptSource, reason: `candidate store unreadable: ${error.message}` });
    }
  }
}

function scanGeneratedBatches(index, solverDir) {
  if (!fs.existsSync(solverDir)) return;
  for (const name of fs.readdirSync(solverDir).sort()) {
    if (!name.startsWith('generated-batch') || !name.endsWith('.json')) continue;
    const source = path.join(solverDir, name);
    try {
      for (const entry of readJson(source).results || []) {
        if (entry && entry.candidate && entry.receipt) addCandidate(index, entry.candidate, entry.receipt, source, source);
      }
    } catch (error) {
      index.invalid.push({ source, receiptSource: source, reason: `generated batch unreadable: ${error.message}` });
    }
  }
}

function scanPilots(index, pilotsDir) {
  if (!fs.existsSync(pilotsDir)) return;
  for (const pilot of fs.readdirSync(pilotsDir).sort()) {
    const dir = path.join(pilotsDir, pilot);
    const candidateSource = path.join(dir, 'candidate.json');
    if (!fs.existsSync(candidateSource)) continue;
    const receiptSource = ['candidate.receipt.json', 'execution-receipt.json']
      .map((name) => path.join(dir, name)).find((file) => fs.existsSync(file));
    if (!receiptSource) continue;
    try {
      const store = readJson(candidateSource);
      const candidates = store.candidates || [store];
      const receipt = readJson(receiptSource);
      for (const candidate of candidates) addCandidate(index, candidate, receipt, candidateSource, receiptSource);
    } catch (error) {
      index.invalid.push({ source: candidateSource, receiptSource, reason: `pilot subject unreadable: ${error.message}` });
    }
  }
}

function buildCandidateIndex({ root = ROOT } = {}) {
  const index = { candidates: new Map(), invalid: [] };
  const solverDir = path.join(root, 'solver');
  scanCandidateStores(index, solverDir);
  scanCandidateStores(index, path.join(solverDir, 'candidates-archive'));
  scanGeneratedBatches(index, solverDir);
  scanPilots(index, path.join(root, 'pilots'));
  return index;
}

function resolveAttemptSource(expected, manifest, { root = ROOT, index = buildCandidateIndex({ root }) } = {}) {
  const sourcePath = path.join(root, expected.path);
  const pin = verifyPinnedFile(sourcePath, expected.sha256);
  if (!pin.ok) return { ok: false, expected, reason: pin.reason, actualSha256: pin.actualSha256 };
  let recording;
  try {
    recording = readJson(sourcePath);
    validateSeed(recording.seed);
  } catch (error) {
    return { ok: false, expected, reason: error.message };
  }
  if (recording.seed !== expected.seed) return { ok: false, expected, recording, reason: 'seed mismatch' };
  if (recording.candidateLevel !== expected.levelLabel) return { ok: false, expected, recording, reason: 'level label mismatch' };

  if (expected.provenanceClass === 'candidate-receipt-resolution-required') {
    if (recording.candidateIdentity !== expected.candidateIdentity) {
      return { ok: false, expected, recording, reason: 'recording candidate identity mismatch' };
    }
    const found = index.candidates.get(expected.candidateIdentity);
    if (!found) return { ok: false, expected, recording, reason: 'candidate content and receipt unresolved' };
    if (found.candidate.level !== expected.levelLabel) return { ok: false, expected, recording, reason: 'candidate level mismatch' };
    return { ok: true, expected, recording, sourcePath, panel: 'receipt-bound', ...found };
  }

  if (expected.provenanceClass === 'ordinary-current-replay-only-unqualified') {
    if (recording.candidateIdentity !== null) return { ok: false, expected, recording, reason: 'ordinary recording carries candidate identity' };
    const pinned = manifest.shippedSubjects.find((entry) => entry.levelLabel === expected.levelLabel);
    if (!pinned || valueIdentity(pinned.sourceObject) !== pinned.sourceObjectSha256) {
      return { ok: false, expected, recording, reason: 'manifest shipped subject identity mismatch' };
    }
    const { LEVELS } = require('../src/game');
    const candidate = LEVELS.find((entry) => entry.level === expected.levelLabel);
    if (!candidate || canonicalJson(candidate) !== canonicalJson(pinned.sourceObject)) {
      return { ok: false, expected, recording, reason: 'current shipped subject mismatch' };
    }
    return {
      ok: true,
      expected,
      recording,
      sourcePath,
      panel: 'current-subject',
      candidate,
      candidateIdentity: null,
      contentIdentity: pinned.sourceObjectSha256,
      candidateSource: 'src/game.js#LEVELS',
      receiptSource: null,
      receiptIdentity: null,
    };
  }
  return { ok: false, expected, recording, reason: `unsupported provenance class ${expected.provenanceClass}` };
}

module.exports = {
  CONTRACT_SHA256,
  INPUTS_SHA256,
  ROOT,
  canonicalJson,
  fileSha256,
  buildCandidateIndex,
  loadFrozenInputs,
  subjectKey,
  subjectPayload,
  validateSeed,
  valueIdentity,
  verifyPinnedFile,
  resolveAttemptSource,
};
