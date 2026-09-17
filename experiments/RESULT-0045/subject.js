const {
  DEFAULT_COUNT,
  DEFAULT_DESCRIPTOR_SEEDS,
  DEFAULT_FULL,
  DEFAULT_SAMPLER_SEED,
  subjectIdentityFor,
} = require('../../solver/board-map-elites');

const RESULT = 'RESULT-0045';
const FINAL_SUBJECT_IDENTITY = '5fa64f1c1334bd82dd51f682960f535e968f258d1c6d8fa1d6055915b5c7a12f';
const CONFIG = Object.freeze({
  count: DEFAULT_COUNT,
  full: DEFAULT_FULL,
  samplerSeed: DEFAULT_SAMPLER_SEED,
  level: 56,
  descriptorSeeds: DEFAULT_DESCRIPTOR_SEEDS,
});

function assertSubject() {
  const actual = subjectIdentityFor(CONFIG);
  if (actual !== FINAL_SUBJECT_IDENTITY) {
    throw new Error(`final subject identity changed: ${actual}`);
  }
  return actual;
}

module.exports = { CONFIG, FINAL_SUBJECT_IDENTITY, RESULT, assertSubject };

