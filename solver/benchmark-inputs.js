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
  return {
    contractPath,
    inputsPath,
    contractSha256: contract.actualSha256,
    inputsSha256: inputs.actualSha256,
    manifest,
  };
}

module.exports = {
  CONTRACT_SHA256,
  INPUTS_SHA256,
  ROOT,
  canonicalJson,
  fileSha256,
  loadFrozenInputs,
  subjectKey,
  subjectPayload,
  validateSeed,
  valueIdentity,
  verifyPinnedFile,
};
