const {
  DEFAULT_COUNT,
  DEFAULT_DESCRIPTOR_SEEDS,
  DEFAULT_FULL,
  DEFAULT_SAMPLER_SEED,
  subjectIdentityFor,
} = require('../../solver/board-map-elites');

const RESULT = 'RESULT-0046';
const FINAL_SUBJECT_IDENTITY = 'f385028282b7747ba2e034f0d6828577e2a44ab1a1580b50b3afbe62ab80abb3';
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
