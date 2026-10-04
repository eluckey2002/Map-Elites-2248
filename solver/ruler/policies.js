'use strict';

const crypto = require('node:crypto');
const { makeRng } = require('../engine');
const { DEFAULT_PARAMS } = require('../bot');

const GENES = Object.freeze({
  wRoll: { min: 0, max: 6, step: 0.75 },
  wPlace: { min: 0, max: 6, step: 0.75 },
  turnover: { min: 0, max: 300, step: 36 },
  width: { min: 8, max: 32, step: 4, integer: true },
  bombMax: { min: 4, max: 12, step: 2, integer: true },
  wHarvest: { min: 0, max: 4, step: 0.75 },
  pathWidth: { min: 1, max: 10, step: 2, integer: true },
});

function policyId(params) {
  const ordered = Object.fromEntries(Object.keys(params).sort().map((key) => [key, params[key]]));
  return crypto.createHash('sha256').update(JSON.stringify(ordered)).digest('hex').slice(0, 12);
}

function shortMyopic() {
  // Copied from the unexported pilot definition at map-elites.js lines 80-95.
  return {
    ...DEFAULT_PARAMS, offerFull: 0,
    wRoll: 0, wPlace: 0, wHarvest: 0, turnover: 0, width: 8, pathWidth: 1,
  };
}

function oneGeneVariants() {
  const offsets = {
    wRoll: [-0.75, -0.3, 0.3, 0.75, 1.5],
    wPlace: [-0.75, -0.3, 0.3, 0.75, 1.5],
    turnover: [-30, -15, 15, 30, 60],
    bombMax: [-3, -2, -1, 1, 2],
    wHarvest: [-1.5, -0.75, -0.25, 0.5, 1.5],
    pathWidth: [-4, -2, -1, 1, 2],
  };
  return Object.entries(offsets).flatMap(([gene, changes]) => changes.map((offset) => {
    const params = { ...DEFAULT_PARAMS, [gene]: DEFAULT_PARAMS[gene] + offset };
    return { name: gene + (offset > 0 ? '+' : '') + offset, gene, params, policyId: policyId(params) };
  }));
}

function mutate(parent, rng) {
  const params = { ...parent };
  const names = Object.keys(GENES);
  const count = 1 + Math.floor(rng() * 3);
  const touched = new Set();
  while (touched.size < count) touched.add(names[Math.floor(rng() * names.length)]);
  for (const name of touched) {
    const gene = GENES[name];
    const distance = (1 + Math.floor(rng() * 2)) * gene.step;
    const direction = rng() < 0.5 ? -1 : 1;
    let value = Math.max(gene.min, Math.min(gene.max, params[name] + distance * direction));
    value = gene.integer ? Math.round(value) : Math.round(value * 1000) / 1000;
    params[name] = value;
  }
  if (policyId(params) === policyId(parent)) {
    const name = names[Math.floor(rng() * names.length)];
    const gene = GENES[name];
    const direction = params[name] >= gene.max ? -1 : 1;
    const value = Math.max(gene.min, Math.min(gene.max, params[name] + direction * gene.step));
    params[name] = gene.integer ? Math.round(value) : Math.round(value * 1000) / 1000;
  }
  return params;
}

function mutationStream(seed = 20261002) {
  const rng = makeRng(seed);
  const seen = new Set([policyId(DEFAULT_PARAMS)]);
  return (parents) => {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const parent = parents[Math.floor(rng() * parents.length)];
      const params = mutate(parent, rng);
      const id = policyId(params);
      if (!seen.has(id)) {
        seen.add(id);
        return { params, policyId: id };
      }
    }
    throw new Error('could not produce a unique mutant');
  };
}

module.exports = { GENES, mutate, mutationStream, oneGeneVariants, policyId, shortMyopic };
