// PROTOTYPE — pure trajectory model for the cash-now versus compound-later question.

const {
  applyGravity,
  checkBombs,
  chainMultiplier,
  chainValue,
  createLevelState,
  executeChain,
  findGreedyChains,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../../solver/engine');
const { analyzeBaseMove, chooseBaseMove, chooseMove } = require('../../solver/bot');

const LOOKAHEAD_BASE = 987654321;

function chainKey(chain) {
  return chain.map((tile) => `${tile.x},${tile.y}`).join('|');
}

function chooseImmediateCash(state) {
  const candidates = findGreedyChains(state, {
    limit: 1,
    tieBreak: 'degree',
    pathWidth: 8,
  });
  return candidates[0] ? candidates[0].chain : null;
}

function lookaheadFor(moveIndex) {
  return () => makeRng(LOOKAHEAD_BASE + moveIndex);
}

function chooseBot(state, moveIndex, wHarvest) {
  return chooseBaseMove(state, {
    lookaheadRngFactory: lookaheadFor(moveIndex),
    params: { wHarvest },
  });
}

function liveChain(state, snapshots) {
  return snapshots.map(({ x, y }) => state.grid[y][x]);
}

// One analysis supplies both decisions. Candidate generation and every other
// contribution are identical; subtracting the harvest contribution exactly
// reconstructs the same-position wHarvest=0 ranking.
function analyzeCompoundDecision(state, moveIndex) {
  const analysis = analyzeBaseMove(state, {
    lookaheadRngFactory: lookaheadFor(moveIndex),
    params: { wHarvest: 2 },
  });
  if (!analysis.selectedChain) return { chain: null, localNoHarvest: null };

  let withoutHarvest = analysis.candidates[0];
  let withoutHarvestScore = -Infinity;
  for (const candidate of analysis.candidates) {
    const score = candidate.policyScore - candidate.contributions.harvest;
    if (score > withoutHarvestScore) {
      withoutHarvest = candidate;
      withoutHarvestScore = score;
    }
  }
  return {
    chain: liveChain(state, analysis.selectedChain),
    localNoHarvest: liveChain(state, withoutHarvest.chain),
  };
}

function play(level, seed, policy) {
  const rng = makeRng(seed);
  const state = createLevelState({ ...level, target: Infinity }, rng);
  const built = new Map();
  const moves = [];
  let foundHarvestDivergence = false;

  for (let moveIndex = 0; moveIndex < level.moves; moveIndex += 1) {
    let chain;
    let localNoHarvest = null;

    if (policy === 'compound') {
      if (!foundHarvestDivergence) {
        ({ chain, localNoHarvest } = analyzeCompoundDecision(state, moveIndex));
      } else {
        chain = chooseBot(state, moveIndex, 2);
      }
    } else if (policy === 'no-harvest') {
      chain = chooseBot(state, moveIndex, 0);
    } else if (policy === 'cash-now') {
      chain = chooseImmediateCash(state);
    } else {
      throw new Error(`unknown policy: ${policy}`);
    }

    if (!chain) return finish('no-valid-moves');

    const reused = chain
      .filter((tile) => built.has(tile))
      .map((tile) => ({ ...built.get(tile), valueNow: tile.value, x: tile.x, y: tile.y }));
    const endpoint = chain[chain.length - 1];
    const executedChainKey = chainKey(chain);
    const localNoHarvestChainKey = localNoHarvest ? chainKey(localNoHarvest) : null;
    const localNoHarvestPoints = localNoHarvest
      ? Math.floor(chainValue(localNoHarvest) * chainMultiplier(localNoHarvest.length))
      : null;
    const harvestDrivenSacrifice = Boolean(
      localNoHarvest
        && chainKey(chain) !== chainKey(localNoHarvest)
        && pointsFor(chain) < localNoHarvestPoints
    );
    if (harvestDrivenSacrifice) foundHarvestDivergence = true;
    const points = executeChain(state, chain);
    built.set(endpoint, { createdMove: moveIndex + 1, createdValue: endpoint.value });

    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);

    moves.push({
      move: moveIndex + 1,
      points,
      scoreAfter: state.score,
      chainLength: chain.length,
      endpointValue: endpoint.value,
      reused,
      chainKey: executedChainKey,
      localNoHarvestChainKey,
      localNoHarvestPoints,
      harvestDrivenSacrifice,
    });

    if (checkBombs(state)) return finish('bomb-exploded');
    if (state.moves >= state.maxMoves) return finish('out-of-moves');
    if (policy === 'compound' && state.moves >= 6 && !foundHarvestDivergence) {
      return finish('screen-no-early-harvest-sacrifice');
    }
  }

  return finish('out-of-moves');

  function finish(reason) {
    const builtTileReuses = moves.reduce((sum, move) => sum + move.reused.length, 0);
    const harvestMoves = moves.filter((move) => move.reused.length >= 2);
    const firstHarvestDivergence = moves.find((move) => (
      move.harvestDrivenSacrifice
    )) || null;
    return {
      policy,
      reason,
      score: state.score,
      moves,
      builtTileReuses,
      harvestMoves,
      firstHarvestDivergence,
    };
  }
}

function playTargetBot(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const moves = [];
  for (let moveIndex = 0; moveIndex < level.moves; moveIndex += 1) {
    const chain = chooseMove(state, { lookaheadRngFactory: lookaheadFor(moveIndex) });
    if (!chain) return { outcome: 'lose', reason: 'no-valid-moves', score: state.score, moves };
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    moves.push({ move: moveIndex + 1, points, scoreAfter: state.score, chainLength: chain.length });
    if (checkBombs(state)) return { outcome: 'lose', reason: 'bomb-exploded', score: state.score, moves };
    if (state.score >= state.targetScore) return { outcome: 'win', reason: 'target-reached', score: state.score, moves };
  }
  return { outcome: 'lose', reason: 'out-of-moves', score: state.score, moves };
}

function pointsFor(chain) {
  return Math.floor(chainValue(chain) * chainMultiplier(chain.length));
}

function crossingMove(run, target) {
  const move = run.moves.find((entry) => entry.scoreAfter >= target);
  return move ? move.move : null;
}

function chooseRaceTarget(compound, cashNow, noHarvest) {
  const candidates = compound.moves
    .filter((move) => move.move >= 5)
    .map((move) => Math.floor(move.scoreAfter / 1000) * 1000)
    .filter((target, index, values) => target >= 20000 && values.indexOf(target) === index)
    .map((target) => ({
      target,
      compoundMoves: crossingMove(compound, target),
      cashMoves: crossingMove(cashNow, target),
      noHarvestMoves: crossingMove(noHarvest, target),
    }))
    .filter(({ compoundMoves, cashMoves, noHarvestMoves }) => (
      compoundMoves !== null
        && cashMoves !== null
        && noHarvestMoves !== null
        && compoundMoves < cashMoves
        && compoundMoves < noHarvestMoves
    ));

  return candidates.sort((left, right) => (
    Math.min(right.cashMoves - right.compoundMoves, right.noHarvestMoves - right.compoundMoves)
      - Math.min(left.cashMoves - left.compoundMoves, left.noHarvestMoves - left.compoundMoves)
    || right.target - left.target
  ))[0] || null;
}

function assess(level, seed) {
  const compound = play(level, seed, 'compound');
  if (!compound.firstHarvestDivergence || compound.harvestMoves.length === 0) return null;

  const cashNow = play(level, seed, 'cash-now');
  const noHarvest = play(level, seed, 'no-harvest');
  const targetRace = chooseRaceTarget(compound, cashNow, noHarvest);
  if (!targetRace) return null;

  const divergence = compound.firstHarvestDivergence;
  const laterHarvest = compound.harvestMoves.find((move) => (
    move.move >= divergence.move + 2
      && move.reused.some(({ createdMove }) => createdMove === divergence.move)
  ));
  if (!laterHarvest) return null;

  const sacrifice = divergence.localNoHarvestPoints - divergence.points;
  const scoreLiftOverNoHarvest = (compound.score - noHarvest.score) / noHarvest.score;
  const scoreLiftOverCash = (compound.score - cashNow.score) / cashNow.score;
  if (scoreLiftOverNoHarvest <= 0 || scoreLiftOverCash <= 0) return null;

  return {
    seed,
    level,
    compound,
    cashNow,
    noHarvest,
    targetRace,
    divergence,
    laterHarvest,
    sacrifice,
    scoreLiftOverNoHarvest,
    scoreLiftOverCash,
    rank: (
      5000 * Math.min(scoreLiftOverNoHarvest, scoreLiftOverCash)
      + 400 * Math.min(targetRace.cashMoves - targetRace.compoundMoves, targetRace.noHarvestMoves - targetRace.compoundMoves)
      + laterHarvest.points
      + 250 * laterHarvest.reused.length
      - Math.max(0, sacrifice)
    ),
  };
}

module.exports = {
  assess,
  chainKey,
  chooseImmediateCash,
  chooseRaceTarget,
  crossingMove,
  play,
  playTargetBot,
};
