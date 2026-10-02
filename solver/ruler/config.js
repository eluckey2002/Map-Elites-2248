'use strict';

const RESULT = 'RESULT-0058';
const LEVELS = Object.freeze([1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52]);
const NULL_LEVELS = Object.freeze(LEVELS.slice(0, 10));
const MAX_GAMES = 60000;
const MUTANTS = 120;
const STAGE2_LIMIT = 8;
const STAGE3_LIMIT = 3;
const BLOCKS = Object.freeze({
  null: { start: 50000000, count: 100 },
  positive3000: { start: 50100000, count: 250 },
  positive72: { start: 50200000, count: 300 },
  bad72: { start: 50300000, count: 6 },
  bad600: { start: 50301000, count: 50 },
  curseScreen: { start: 50400000, count: 6 },
  curseFresh: { start: 50401000, count: 6 },
  map72: { start: 50500000, count: 6 },
  map600: { start: 50501000, count: 50 },
  map3000: { start: 50502000, count: 250 },
  mapFresh: { start: 50503000, count: 6 },
  mapHoldout: { start: 50504000, count: 250 },
});
function seeds(block) {
  const { start, count } = BLOCKS[block];
  return Array.from({ length: count }, (_, index) => start + index);
}
module.exports = {
  RESULT, LEVELS, NULL_LEVELS, MAX_GAMES, MUTANTS, STAGE2_LIMIT, STAGE3_LIMIT, BLOCKS, seeds,
};
