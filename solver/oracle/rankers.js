const { rankState } = require('./harvest-policy');

function immediateScore(state) {
  return state.score;
}

function harvesting(state, options) {
  return rankState(state, options);
}

const RANKERS = Object.freeze({
  'immediate-score': immediateScore,
  harvesting,
});

module.exports = { immediateScore, harvesting, RANKERS };
