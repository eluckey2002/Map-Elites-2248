#!/usr/bin/env node
// Exploratory fixed-seed screen for the Bank and Break prototype.
//
// This compares the current target-aware bot with a reproducible
// "take the bounded longest chain" baseline. It selects three different
// stress cases from one declared finite population; it does not establish a
// population result or promote these prototype observations into the ledger.

const {
  applyGravity,
  checkBombs,
  createLevelState,
  executeChain,
  findGreedyChains,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../../solver/engine');
const { chooseMove } = require('../../solver/bot');
const { buildVariants } = require('./variants');

const LOOKAHEAD_BASE = 987654321;
const DEFAULT_SEED_COUNT = 512;

function chooseBot(state, moveIndex) {
  return chooseMove(state, {
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
  });
}

function chooseBoundedLongest(state) {
  const candidates = findGreedyChains(state, {
    preferMergeableSum: false,
    tieBreak: 'degree',
    pathWidth: 8,
  });
  let longest = null;
  for (const candidate of candidates) {
    if (!longest
      || candidate.chain.length > longest.chain.length
      || (candidate.chain.length === longest.chain.length && candidate.points > longest.points)) {
      longest = candidate;
    }
  }
  return longest ? longest.chain : null;
}

function playPolicy(level, seed, chooser) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const builtTiles = new Set();
  const movePoints = [];
  const chainLengths = [];
  let builtTileReuses = 0;

  for (let moveIndex = 0; moveIndex < level.moves; moveIndex += 1) {
    const chain = chooser(state, moveIndex);
    if (!chain) {
      return finish('lose', 'no valid moves');
    }

    builtTileReuses += chain.filter((tile) => builtTiles.has(tile)).length;
    const endpoint = chain[chain.length - 1];
    const points = executeChain(state, chain);
    builtTiles.add(endpoint);
    movePoints.push(points);
    chainLengths.push(chain.length);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);

    if (checkBombs(state)) return finish('lose', 'bomb exploded');
    if (state.score >= state.targetScore) return finish('win');
    if (state.moves >= state.maxMoves) return finish('lose', 'out of moves');
  }

  return finish('lose', 'out of moves');

  function finish(outcome, reason) {
    const lastThreePoints = movePoints.slice(-3).reduce((sum, points) => sum + points, 0);
    return {
      outcome,
      ...(reason ? { reason } : {}),
      moves: state.moves,
      score: state.score,
      builtTileReuses,
      lastThreeScoreShare: state.score ? lastThreePoints / state.score : 0,
      chainLengths,
    };
  }
}

function screenSeeds(level, seedCount = DEFAULT_SEED_COUNT) {
  const rows = [];
  for (let seed = 0; seed < seedCount; seed += 1) {
    rows.push({
      seed,
      bot: playPolicy(level, seed, chooseBot),
      boundedLongest: playPolicy(level, seed, chooseBoundedLongest),
    });
  }
  return rows;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function selectValidationSeeds(rows, level) {
  const raceMoves = (result) => (result.outcome === 'win' ? result.moves : level.moves + 1);
  const botWins = rows.filter((row) => row.bot.outcome === 'win');
  if (!botWins.length) throw new Error('source population has no bot wins');
  const medianBotMoves = median(botWins.map((row) => row.bot.moves));

  const setupFavorable = botWins.slice().sort((left, right) => (
    (raceMoves(right.boundedLongest) - raceMoves(right.bot))
      - (raceMoves(left.boundedLongest) - raceMoves(left.bot))
    || left.bot.moves - right.bot.moves
    || right.bot.score - left.bot.score
    || left.seed - right.seed
  ))[0];

  const neutral = rows.filter((row) => (
    row.seed !== setupFavorable.seed
      && row.bot.outcome === 'win'
      && row.boundedLongest.outcome === 'win'
      && row.bot.moves === row.boundedLongest.moves
  )).sort((left, right) => (
    Math.abs(left.bot.moves - medianBotMoves) - Math.abs(right.bot.moves - medianBotMoves)
    || Math.abs(left.bot.score - left.boundedLongest.score)
      - Math.abs(right.bot.score - right.boundedLongest.score)
    || left.seed - right.seed
  ))[0];
  if (!neutral) throw new Error('source population has no equal-pace neutral seed');

  const hypothesisHostile = rows.filter((row) => (
    row.seed !== setupFavorable.seed
      && row.seed !== neutral.seed
      && row.bot.outcome !== 'win'
      && row.boundedLongest.outcome === 'win'
  )).sort((left, right) => (
    left.boundedLongest.moves - right.boundedLongest.moves
    || right.boundedLongest.score - left.boundedLongest.score
    || right.bot.score - left.bot.score
    || left.seed - right.seed
  ))[0];
  if (!hypothesisHostile) {
    throw new Error('source population has no seed where bounded-longest wins and the bot loses');
  }

  return [
    {
      role: 'setup-favorable',
      selectionRule: 'largest target-race move advantage for the bot over bounded-longest; ties prefer the faster bot',
      ...setupFavorable,
    },
    {
      role: 'neutral',
      selectionRule: 'equal target-crossing pace nearest the population median bot pace; ties prefer the closest crossing scores',
      ...neutral,
    },
    {
      role: 'hypothesis-hostile',
      selectionRule: 'fastest bounded-longest win among seeds where the current bot fails to reach the target',
      ...hypothesisHostile,
    },
  ];
}

function summary(result) {
  return `${result.outcome} · ${result.score.toLocaleString()} / ${result.moves} moves`;
}

function formatMarkdown(seedCount, selected) {
  const lines = [
    '# Bank and Break validation seed screen',
    '',
    'Standing: **exploratory prototype selection; not an evidence-ledger claim.**',
    '',
    `Source population: integer seeds 0–${seedCount - 1} (${seedCount} exact seeded boards).`,
    '',
    '| Role | Seed | Current bot | Bounded longest-chain | Selection rule |',
    '|---|---:|---:|---:|---|',
  ];
  for (const row of selected) {
    lines.push(`| ${row.role} | ${row.seed} | ${summary(row.bot)} | ${summary(row.boundedLongest)} | ${row.selectionRule} |`);
  }
  lines.push(
    '',
    '_“Bounded longest-chain” means the longest chain returned by the existing width-8 greedy path generator. It is reproducible, not mathematically exhaustive._',
  );
  return `${lines.join('\n')}\n`;
}

function parseSeedCount(argv) {
  const value = argv.find((argument) => argument.startsWith('--seeds='));
  if (!value) return DEFAULT_SEED_COUNT;
  const parsed = Number(value.slice('--seeds='.length));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100000) {
    throw new Error('--seeds must be an integer from 1 to 100000');
  }
  return parsed;
}

function main(argv = process.argv.slice(2)) {
  const seedCount = parseSeedCount(argv);
  const level = buildVariants()[0];
  const selected = selectValidationSeeds(screenSeeds(level, seedCount), level);
  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ seedCount, selected }, null, 2)}\n`);
  } else {
    process.stdout.write(formatMarkdown(seedCount, selected));
  }
}

if (require.main === module) main();

module.exports = {
  DEFAULT_SEED_COUNT,
  chooseBot,
  chooseBoundedLongest,
  formatMarkdown,
  playPolicy,
  screenSeeds,
  selectValidationSeeds,
};
