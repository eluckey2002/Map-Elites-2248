const crypto = require('node:crypto');

const { createLevelState, makeRng } = require('./engine');
const { applyFrozenChain } = require('./exact-score');
const { combinedCandidates } = require('./choice-recovery-descriptors');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function makeSpawnStream(level, rng) {
  const scale = level.tileScale || 1;
  const length = level.moves * (level.gridW * level.gridH - 1);
  return Array.from({ length }, () => {
    const draw = rng();
    if (draw < 0.6) return 2 * scale;
    if (draw < 0.9) return 4 * scale;
    return 8 * scale;
  });
}

function chainKey(coordinates) {
  return coordinates.map(([x, y]) => `${x},${y}`).join('|');
}

function witnessKey(witness) {
  return witness.map(chainKey).join('>');
}

function gridKey(state) {
  return state.grid.flat().map((tile) => (
    tile ? `${tile.value}:${tile.blocker || ''}:${tile.blockerDuration}:${tile.bombTimer}` : '_'
  )).join(',');
}

function searchWitnessSet({
  state, cursor = 0, spawnValues, width = 24, actionsPerState = 16,
  pathWidth = 2, successCap = 64, successesPerOpening = 8,
}) {
  let frontier = [{ state, cursor, witness: [] }];
  const successes = new Map();
  let expandedStates = 0;
  let generatedActions = 0;

  while (frontier.length && successes.size < successCap) {
    const nextByState = new Map();
    for (const node of frontier) {
      if (node.state.moves >= node.state.maxMoves) continue;
      expandedStates += 1;
      const candidates = combinedCandidates(node.state, { actionsPerState, pathWidth });
      generatedActions += candidates.length;
      for (const chain of candidates) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const coordinates = chain.map((tile) => [tile.x, tile.y]);
        const witness = [...node.witness, coordinates];
        if (transition.state.score >= state.targetScore) {
          const key = witnessKey(witness);
          const opening = chainKey(witness[0]);
          const openingCount = [...successes.values()]
            .filter(({ witness: saved }) => chainKey(saved[0]) === opening).length;
          if (!successes.has(key) && openingCount < successesPerOpening) {
            successes.set(key, { witness, score: transition.state.score });
          }
          if (successes.size >= successCap) break;
          continue;
        }
        const key = `${transition.cursor}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (!previous || transition.state.score > previous.state.score) {
          nextByState.set(key, { state: transition.state, cursor: transition.cursor, witness });
        }
      }
      if (successes.size >= successCap) break;
    }
    frontier = [...nextByState.values()]
      .sort((a, b) => b.state.score - a.state.score || witnessKey(a.witness).localeCompare(witnessKey(b.witness)))
      .slice(0, width);
  }

  const ordered = [...successes.values()].sort((a, b) => (
    a.witness.length - b.witness.length
      || b.score - a.score
      || witnessKey(a.witness).localeCompare(witnessKey(b.witness))
  ));
  return {
    successes: ordered,
    diagnostics: {
      width, actionsPerState, pathWidth, successCap, successesPerOpening,
      expandedStates, generatedActions,
    },
  };
}

function sharesPrefix(witness, prefix) {
  return prefix.every((chain, index) => chainKey(witness[index] || []) === chainKey(chain));
}

function describeWitnessSet(successes) {
  if (!successes.length) return null;
  const canonical = successes[0].witness;
  let forced = 0;
  const prefixTrace = [];
  for (let index = 0; index < canonical.length; index += 1) {
    const prefix = canonical.slice(0, index);
    const matching = successes.filter(({ witness }) => sharesPrefix(witness, prefix));
    const nextMoves = new Set(matching
      .filter(({ witness }) => witness[index])
      .map(({ witness }) => chainKey(witness[index])));
    if (nextMoves.size === 1) forced += 1;
    prefixTrace.push({ move: index + 1, matchingWitnesses: matching.length, viableNextMoves: nextMoves.size });
  }
  return {
    descriptors: {
      forcedPrefixRatio: forced / canonical.length,
      distinctOpeningMoves: new Set(successes.map(({ witness }) => chainKey(witness[0]))).size,
      boundedWitnessCount: successes.length,
    },
    canonicalWitness: canonical,
    canonicalScore: successes[0].score,
    prefixTrace,
  };
}

function puzzleRecord(level, seed, state, spawnValues) {
  return {
    level: level.level, seed, target: level.target, moves: level.moves,
    minChain: level.minChain, tileScale: level.tileScale || 1,
    gridW: level.gridW, gridH: level.gridH, blockers: level.blockers,
    initialGridIdentity: identity(state.grid.map((row) => row.map((tile) => ({
      value: tile && tile.value, blocker: tile && tile.blocker,
      blockerDuration: tile && tile.blockerDuration, bombTimer: tile && tile.bombTimer,
    })))),
    spawnStreamIdentity: identity(spawnValues),
  };
}

function analyzeForcedDiversity({
  level, seed,
  search = {
    width: 24, actionsPerState: 16, pathWidth: 2, successCap: 64, successesPerOpening: 8,
  },
}) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const spawnValues = makeSpawnStream(level, rng);
  const puzzle = puzzleRecord(level, seed, state, spawnValues);
  const searchResult = searchWitnessSet({ state, spawnValues, ...search });
  const described = describeWitnessSet(searchResult.successes);
  return {
    standing: described ? 'bounded_success_set_proxy' : 'UNKNOWN',
    seed,
    puzzle,
    puzzleIdentity: identity(puzzle),
    descriptors: described && described.descriptors,
    canonicalWitness: described ? described.canonicalWitness : [],
    canonicalScore: described ? described.canonicalScore : null,
    prefixTrace: described ? described.prefixTrace : [],
    successes: searchResult.successes,
    diagnostics: searchResult.diagnostics,
  };
}

module.exports = { analyzeForcedDiversity, describeWitnessSet, searchWitnessSet };
