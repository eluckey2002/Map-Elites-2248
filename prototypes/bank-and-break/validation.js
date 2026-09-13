// Frozen playable selections from:
//   node prototypes/bank-and-break/select-seeds.js --seeds=512 --json
//
// These are exploratory prototype challenges, not evidence-ledger results.

const SOURCE_SEED_COUNT = 512;

const CHALLENGES = Object.freeze([
  Object.freeze({
    role: 'setup-favorable',
    seed: 268,
    selectionRule: 'largest target-race move advantage for the bot over bounded-longest; ties prefer the faster bot',
    bot: Object.freeze({ outcome: 'win', moves: 7, score: 52736 }),
    boundedLongest: Object.freeze({ outcome: 'lose', moves: 16, score: 33056 }),
  }),
  Object.freeze({
    role: 'neutral',
    seed: 511,
    selectionRule: 'equal target-crossing pace nearest the population median bot pace; ties prefer the closest crossing scores',
    bot: Object.freeze({ outcome: 'win', moves: 10, score: 41856 }),
    boundedLongest: Object.freeze({ outcome: 'win', moves: 10, score: 40512 }),
  }),
  Object.freeze({
    role: 'hypothesis-hostile',
    seed: 93,
    selectionRule: 'fastest bounded-longest win among seeds where the current bot fails to reach the target',
    bot: Object.freeze({ outcome: 'lose', moves: 16, score: 35840 }),
    boundedLongest: Object.freeze({ outcome: 'win', moves: 15, score: 40928 }),
  }),
]);

module.exports = { CHALLENGES, SOURCE_SEED_COUNT };
