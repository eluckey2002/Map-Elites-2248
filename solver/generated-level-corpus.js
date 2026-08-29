#!/usr/bin/env node

const crypto = require('node:crypto');

const { makeRng } = require('./engine');
const { sampleShape, shapeSignature } = require('./generate-levels');
const { serialize } = require('./level-author');

const PROTOCOL = Object.freeze({
  name: 'generated-level-corpus-v1',
  candidateLevel: 54,
  samplerSeeds: Object.freeze([2026082901, 2026082902, 2026082903, 2026082904]),
  drawsPerSeed: 120,
  cleanQuota: 60,
  stressProbeQuota: 12,
});

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

module.exports = {
  PROTOCOL,
  allFamilyKeys,
  buildPlan,
  familyForShape,
  partitionForFamily,
  selectForFullMeasurement,
  serializePlan,
};
