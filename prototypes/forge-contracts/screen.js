#!/usr/bin/env node
// PROTOTYPE — exact reference bot under each optional forge contract.

const {
  applyGravity,
  checkBombs,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../../solver/engine');
const { chooseMove } = require('../../solver/bot');
const { generateTargetedChains } = require('../../solver/targeted-chain-generator');
const { CONTRACTS, advance, observe, progress } = require('./contracts');
const { SEED, buildLevel } = require('./level');

const LOOKAHEAD_BASE = 987654321;

function playContractBot(contractId) {
  const level = buildLevel();
  const rng = makeRng(SEED);
  const state = createLevelState(level, rng);
  let contractState = {
    contractId,
    awarded: false,
    bonusAwarded: 0,
    progress: progress(contractId, observe(state.grid)),
  };
  const moves = [];

  for (let moveIndex = 0; moveIndex < level.moves; moveIndex += 1) {
    const exactTower = contractId === 'tower' && !contractState.awarded
      ? generateTargetedChains(state).candidates
        .filter(({ sum }) => sum === 4096)
        .sort((left, right) => right.points - left.points)[0]
      : null;
    const chain = exactTower
      ? exactTower.chain
      : chooseMove(state, {
        lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
      });
    if (!chain) return finish('lose', 'no-valid-moves');

    const tiles = chain.map(({ x, y, value }) => ({ x, y, value }));
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);

    const next = advance(contractState, state.grid);
    const bonus = next.bonusAwarded - contractState.bonusAwarded;
    contractState = next;
    state.score += bonus;
    moves.push({
      move: moveIndex + 1,
      tiles,
      chainPoints: points,
      bonus,
      scoreAfter: state.score,
      progress: contractState.progress,
    });

    if (checkBombs(state)) return finish('lose', 'bomb-exploded');
    if (state.score >= state.targetScore) return finish('win', 'target-reached');
  }
  return finish('lose', 'out-of-moves');

  function finish(outcome, reason) {
    return {
      contractId,
      outcome,
      reason,
      score: state.score,
      movesUsed: moves.length,
      awarded: contractState.awarded,
      bonusAwarded: contractState.bonusAwarded,
      moves,
    };
  }
}

function main() {
  const result = Object.keys(CONTRACTS).map(playContractBot);
  process.stdout.write(`${JSON.stringify({
    standing: 'throwaway mechanic reference; not evidence-ledger evidence',
    level: buildLevel(),
    seed: SEED,
    result,
  }, null, 2)}\n`);
  return result.every((run) => run.outcome === 'win' && run.awarded) ? 0 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = { playContractBot };
