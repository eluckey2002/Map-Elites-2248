// Experimental policy: preserve the champion except for an immediate finish.
//
// The normal generator trims a route back to a mergeable-sum prefix so the
// survivor remains usable. That is correct long-game behavior. It is needless
// after the move that wins the level, so this challenger inspects the same
// walk's untrimmed routes only when one can reach target now.
const { findGreedyChains } = require('./engine');
// chooseBaseMove, never chooseMove. DECISION-0004 promoted this same rule into
// the bot, so chooseMove already applies the override — routing through it made
// the challenger evaluate the override twice per move for no change in play
// (~17% wasted, RESULT-0020 P3). Building an experimental policy on top of the
// shipped champion also collapses the A/B the moment that policy is promoted.
const { chooseBaseMove, DEFAULT_PARAMS } = require('./bot');

function hasBomb(state) {
  return state.grid.some((row) => row.some((tile) => tile && tile.blocker === 'bomb'));
}

function immediateWinningUntrimmed(state, params = DEFAULT_PARAMS) {
  if (!Number.isFinite(state.targetScore) || state.score >= state.targetScore || hasBomb(state)) return null;
  const resolved = { ...DEFAULT_PARAMS, ...params };
  const candidates = findGreedyChains(state, {
    limit: resolved.width,
    tieBreak: resolved.tieBreak,
    pathWidth: resolved.pathWidth,
    preferMergeableSum: false,
  });
  const winner = candidates.find(({ points }) => state.score + points >= state.targetScore);
  return winner ? winner.chain : null;
}

function chooseTargetAwareMove(state, options = {}) {
  const champion = chooseBaseMove(state, options);
  if (!champion) return null;
  return immediateWinningUntrimmed(state, options.params) || champion;
}

module.exports = { chooseTargetAwareMove, immediateWinningUntrimmed };
