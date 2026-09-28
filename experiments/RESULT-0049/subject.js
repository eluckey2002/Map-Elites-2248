const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
} = require('../../solver/engine');
const { chooseBaseMove, chooseMove } = require('../../solver/bot');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0049';
const FIRST_SEED = 45_000_000;
const SEED_COUNT = 300;
const SEEDS = Object.freeze(Array.from({ length: SEED_COUNT }, (_, index) => FIRST_SEED + index));
const LEVEL_NUMBERS = Object.freeze(LEVELS.map(({ level }) => level));
const LOOKAHEAD_BASE = 987654321;

const SOURCE_FILES = Object.freeze([
  'solver/bot.js',
  'solver/engine.js',
  'src/game.js',
  'solver/experiment-guard.js',
  'tools/persist-before-verdict.js',
  'experiments/RESULT-0049/subject.js',
  'experiments/RESULT-0049/worker.js',
  'experiments/RESULT-0049/run.js',
  'experiments/RESULT-0049/recompute.js',
]);

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

function fileIdentity(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_FILES.map((relative) => [relative, fileIdentity(relative)]));
}

function finalSubjectIdentity(sources = sourceHashes()) {
  return identity(sources);
}

function moveKey(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function playToTerminal(levelData, seed, chooser) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const sequence = [];
  let reason = 'out_of_moves';

  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex += 1) {
    const chain = chooser(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) {
      reason = 'no_valid_moves';
      break;
    }
    sequence.push(moveKey(chain));
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) {
      reason = 'bomb';
      break;
    }
    if (state.score >= state.targetScore) {
      reason = 'target';
      break;
    }
    if (state.moves >= state.maxMoves) {
      reason = 'out_of_moves';
      break;
    }
  }

  return {
    win: reason === 'target',
    movesToTarget: reason === 'target' ? state.moves : null,
    movesUsed: state.moves,
    moveBudget: state.maxMoves,
    score: state.score,
    reason,
    traceIdentity: identity(sequence),
  };
}

function evaluatePair(levelData, seed, {
  baseChooser = chooseBaseMove,
  championChooser = chooseMove,
} = {}) {
  return {
    level: levelData.level,
    seed,
    base: playToTerminal(levelData, seed, baseChooser),
    champion: playToTerminal(levelData, seed, championChooser),
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleSd(values) {
  if (values.length < 2) return 0;
  const center = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + ((value - center) ** 2), 0) / (values.length - 1));
}

function targetCost(outcome) {
  return outcome.win ? outcome.movesToTarget : outcome.moveBudget + 1;
}

function clusteredMoveEffect(cells, levelNumbers, seeds) {
  const differences = cells.map(({ base, champion }) => targetCost(base) - targetCost(champion));
  const byLevel = levelNumbers.map((_, levelIndex) => mean(
    differences.slice(levelIndex * seeds.length, (levelIndex + 1) * seeds.length),
  ));
  const bySeed = seeds.map((_, seedIndex) => mean(
    levelNumbers.map((__, levelIndex) => differences[(levelIndex * seeds.length) + seedIndex]),
  ));
  const estimate = mean(byLevel);
  const seLevel = sampleSd(byLevel) / Math.sqrt(byLevel.length);
  const seSeed = sampleSd(bySeed) / Math.sqrt(bySeed.length);
  const se = Math.max(seLevel, seSeed);
  return {
    estimand: 'mean paired reduction in target-cost; a loss costs moveBudget+1',
    estimate,
    se,
    seLevel,
    seSeed,
    confidence95: [estimate - (1.96 * se), estimate + (1.96 * se)],
    levelClusters: byLevel.length,
    seedClusters: bySeed.length,
  };
}

function summarize(corpus) {
  const counts = {
    pairs: corpus.cells.length,
    bothWin: 0,
    bothLose: 0,
    championOnlyWin: 0,
    baseOnlyWin: 0,
    championFaster: 0,
    baseFaster: 0,
    sameSpeed: 0,
    sameSpeedDifferentScore: 0,
    changedTrace: 0,
  };

  for (const { base, champion } of corpus.cells) {
    if (base.traceIdentity !== champion.traceIdentity) counts.changedTrace += 1;
    if (base.win && champion.win) {
      counts.bothWin += 1;
      if (champion.movesToTarget < base.movesToTarget) counts.championFaster += 1;
      else if (champion.movesToTarget > base.movesToTarget) counts.baseFaster += 1;
      else {
        counts.sameSpeed += 1;
        if (champion.score !== base.score) counts.sameSpeedDifferentScore += 1;
      }
    } else if (champion.win) counts.championOnlyWin += 1;
    else if (base.win) counts.baseOnlyWin += 1;
    else counts.bothLose += 1;
  }

  const safetyPass = counts.baseOnlyWin === 0 && counts.baseFaster === 0;
  const benefitObserved = counts.championOnlyWin > 0 || counts.championFaster > 0;
  const primaryOutcome = !safetyPass
    ? 'DOES_NOT_SUPPORT_CURRENT_CHAMPION'
    : benefitObserved
      ? 'SUPPORTS_CURRENT_CHAMPION'
      : 'INCONCLUSIVE';

  return {
    primaryOutcome,
    counts,
    moveEffect: clusteredMoveEffect(corpus.cells, corpus.panel.levelNumbers, corpus.panel.seeds),
    claims: {
      P1: {
        outcome: safetyPass ? 'PASS' : 'FAIL',
        rule: 'zero base-only wins and zero slower champion wins',
      },
      P2: {
        outcome: benefitObserved ? 'PASS' : 'FAIL',
        rule: 'at least one champion-only win or faster mutual win',
      },
      P3: {
        outcome: primaryOutcome,
        rule: 'P1 fail => DOES_NOT_SUPPORT; P1 pass plus P2 pass => SUPPORTS; otherwise INCONCLUSIVE',
      },
    },
  };
}

function artifactWithIdentity(body, registration) {
  return { ...body, artifactIdentity: identity(body), registration };
}

function buildCorpus(cells, registration, {
  levelNumbers = LEVEL_NUMBERS,
  seeds = SEEDS,
} = {}) {
  const sources = sourceHashes();
  const body = {
    schemaVersion: 1,
    result: RESULT,
    kind: 'paired-post-adoption-confirmation',
    panel: {
      levelNumbers,
      seeds,
      order: 'level-major',
      arms: ['base', 'champion'],
      objective: 'reach the shipped finite target in the fewest moves; crossing score is diagnostic only',
    },
    sources,
    finalSubjectIdentity: finalSubjectIdentity(sources),
    cells,
  };
  return artifactWithIdentity(body, registration);
}

function validateOutcome(outcome, label) {
  if (!outcome || typeof outcome !== 'object') throw new Error(`${label} outcome missing`);
  if (!Number.isInteger(outcome.movesUsed) || outcome.movesUsed < 0 || outcome.movesUsed > outcome.moveBudget) {
    throw new Error(`${label} movesUsed invalid`);
  }
  if (outcome.win !== (outcome.reason === 'target')) throw new Error(`${label} win/reason mismatch`);
  if (outcome.win !== Number.isInteger(outcome.movesToTarget)) throw new Error(`${label} movesToTarget mismatch`);
  if (!Number.isFinite(outcome.score) || outcome.score < 0) throw new Error(`${label} score invalid`);
  if (!/^[0-9a-f]{64}$/.test(outcome.traceIdentity)) throw new Error(`${label} trace identity invalid`);
}

function validateCorpus(corpus, {
  levelNumbers = LEVEL_NUMBERS,
  seeds = SEEDS,
  requireRegistration = true,
} = {}) {
  if (corpus.schemaVersion !== 1 || corpus.result !== RESULT) throw new Error('wrong corpus schema or result');
  if (canonicalJson(corpus.panel.levelNumbers) !== canonicalJson(levelNumbers)) throw new Error('level panel mismatch');
  if (canonicalJson(corpus.panel.seeds) !== canonicalJson(seeds)) throw new Error('seed panel mismatch');
  if (corpus.panel.order !== 'level-major') throw new Error('cell order mismatch');
  if (corpus.cells.length !== levelNumbers.length * seeds.length) throw new Error('incomplete paired matrix');

  let index = 0;
  for (const level of levelNumbers) {
    for (const seed of seeds) {
      const cell = corpus.cells[index++];
      if (!cell || cell.level !== level || cell.seed !== seed) throw new Error(`pairing/order mismatch at ${level}/${seed}`);
      validateOutcome(cell.base, `base ${level}/${seed}`);
      validateOutcome(cell.champion, `champion ${level}/${seed}`);
      if (cell.base.moveBudget !== cell.champion.moveBudget) throw new Error(`objective budget mismatch at ${level}/${seed}`);
    }
  }

  const expectedSources = sourceHashes();
  if (canonicalJson(corpus.sources) !== canonicalJson(expectedSources)) throw new Error('source identity closure mismatch');
  if (corpus.finalSubjectIdentity !== finalSubjectIdentity(expectedSources)) throw new Error('final subject identity mismatch');
  const { artifactIdentity, registration, ...body } = corpus;
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
  if (requireRegistration) {
    if (registration?.exploratory !== false || registration.protocol !== RESULT || !/^[0-9a-f]{40}$/.test(registration.protocolCommit || '')) {
      throw new Error('registered protocol stamp missing');
    }
  }
  return { pairs: corpus.cells.length, artifactIdentity, finalSubjectIdentity: corpus.finalSubjectIdentity };
}

module.exports = {
  ROOT,
  RESULT,
  FIRST_SEED,
  SEED_COUNT,
  SEEDS,
  LEVEL_NUMBERS,
  SOURCE_FILES,
  canonicalJson,
  identity,
  sourceHashes,
  finalSubjectIdentity,
  playToTerminal,
  evaluatePair,
  targetCost,
  clusteredMoveEffect,
  summarize,
  artifactWithIdentity,
  buildCorpus,
  validateCorpus,
};
