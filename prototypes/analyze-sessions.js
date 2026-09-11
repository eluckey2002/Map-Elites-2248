#!/usr/bin/env node
// Exploratory analysis for throwaway prototype sessions.
//
// These sessions are not the receipted evidence corpus. This tool keeps their
// exact, replayable observations useful without promoting them into ledger
// evidence or general claims.

const fs = require('node:fs');
const path = require('node:path');

const { analyzeMove } = require('../solver/bot');
const {
  applyGravity,
  checkBombs,
  createLevelState,
  executeChain,
  findGreedyChains,
  isBlockedTile,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { identity } = require('../solver/level-author');
const { recordSession } = require('../solver/record-session');
const { replay } = require('../solver/recording-replay');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;

function jsonFilesBelow(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...jsonFilesBelow(absolute));
    else if (entry.name.endsWith('.json')) files.push(absolute);
  }
  return files.sort();
}

function candidatesForFamily(directory) {
  const levelFile = path.join(directory, 'level.js');
  if (fs.existsSync(levelFile)) return [require(levelFile).buildLevel()];

  const variantsFile = path.join(directory, 'variants.js');
  if (fs.existsSync(variantsFile)) return require(variantsFile).buildVariants();
  return [];
}

function qualitativeVerdict(directory) {
  const readme = path.join(directory, 'README.md');
  if (!fs.existsSync(readme)) return null;
  const text = fs.readFileSync(readme, 'utf8');
  const outcome = text.match(/## Outcome\s+\*\*([^*]+)\*\*/);
  return outcome ? outcome[1].trim() : null;
}

function sameTileSet(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  const keys = new Set(left.map((tile) => `${tile.x},${tile.y}`));
  return right.every((tile) => keys.has(`${tile.x},${tile.y}`));
}

function replayChain(state, recorded, moveNumber) {
  const live = recorded.tiles.map(({ x, y, value }) => {
    const tile = state.grid[y]?.[x];
    if (!tile) throw new Error(`move ${moveNumber}: recorded tile (${x},${y}) is absent`);
    if (tile.value !== value) {
      throw new Error(`move ${moveNumber}: tile (${x},${y}) is ${tile.value}, recorded ${value}`);
    }
    return tile;
  });
  if (new Set(live).size !== live.length) throw new Error(`move ${moveNumber}: chain repeats a tile`);
  return live;
}

function analyzeRecording(candidate, recording) {
  if (identity(candidate) !== recording.candidateIdentity) {
    throw new Error('candidate identity mismatch');
  }
  if (candidate.level !== recording.candidateLevel) throw new Error('candidate level mismatch');
  const replayResult = replay(candidate, recording);
  if (replayResult.problems.length) {
    throw new Error(`recording replay failed: ${replayResult.problems.join('; ')}`);
  }

  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);
  const builtTiles = new Map();
  const moveDetails = [];

  let bombsCleared = 0;
  let bombsClearedAsEndpoint = 0;
  let bombsSweptThrough = 0;
  let builtTileReuses = 0;

  recording.chains.forEach((recordedChain, index) => {
    const moveNumber = index + 1;
    const live = replayChain(state, recordedChain, moveNumber);
    const endpoint = live[live.length - 1];
    const bombTiles = live.filter((tile) => tile.blocker === 'bomb');
    const endpointWasBomb = endpoint.blocker === 'bomb';
    const sweptBombs = bombTiles.length - (endpointWasBomb ? 1 : 0);
    const reused = live.filter((tile) => builtTiles.has(tile));
    const availableTiles = state.grid.flat().filter((tile) => tile && !isBlockedTile(tile)).length;
    const bot = analyzeMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + index),
    });
    const botChain = bot.selectedChain || [];
    const boundedLongChain = findGreedyChains(state, {
      preferMergeableSum: false,
      tieBreak: 'degree',
      pathWidth: 8,
    }).reduce((longest, candidate) => (
      !longest || candidate.chain.length > longest.chain.length ? candidate : longest
    ), null);

    bombsCleared += bombTiles.length;
    bombsClearedAsEndpoint += endpointWasBomb ? 1 : 0;
    bombsSweptThrough += sweptBombs;
    builtTileReuses += reused.length;

    const points = executeChain(state, live);
    if (points !== recordedChain.points) {
      throw new Error(`move ${moveNumber}: replay scored ${points}, recorded ${recordedChain.points}`);
    }
    builtTiles.set(endpoint, { moveCreated: moveNumber, value: endpoint.value });

    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    const bombExplodedAfterMove = checkBombs(state);
    const isLastMove = index === recording.chains.length - 1;
    if (bombExplodedAfterMove && (
      !isLastMove || recording.outcome !== 'lose' || recording.reason !== 'bomb exploded'
    )) {
      throw new Error(`recording continued or claimed a win after a bomb exploded after move ${moveNumber}`);
    }
    if (!bombExplodedAfterMove && state.score >= candidate.target && !isLastMove) {
      throw new Error(`recording continued after reaching the target after move ${moveNumber}`);
    }

    moveDetails.push({
      move: moveNumber,
      points,
      scoreAfter: state.score,
      chainLength: live.length,
      chainCoverage: availableTiles ? live.length / availableTiles : 0,
      boundedLongChainLength: boundedLongChain ? boundedLongChain.chain.length : 0,
      reusedBuiltTiles: reused.length,
      bombsCleared: bombTiles.length,
      bombInteraction: !bombTiles.length
        ? 'none'
        : sweptBombs ? 'swept-through' : 'endpoint',
      botChoice: {
        reason: bot.reason,
        chainLength: botChain.length,
        sameTiles: sameTileSet(live, botChain),
      },
      bombExplodedAfterMove,
    });
  });

  if (state.score !== recording.score) {
    throw new Error(`replay final score ${state.score}, recorded ${recording.score}`);
  }

  const chainLengths = moveDetails.map((move) => move.chainLength);
  const lateScore = moveDetails.slice(-3).reduce((sum, move) => sum + move.points, 0);
  const botSession = recordSession(candidate, recording.seed);

  return {
    seed: recording.seed,
    score: recording.score,
    moves: recording.movesUsed,
    outcome: recording.outcome,
    chainLengths,
    meanChainLength: chainLengths.reduce((sum, length) => sum + length, 0) / chainLengths.length,
    meanChainCoverage: moveDetails.reduce((sum, move) => sum + move.chainCoverage, 0) / moveDetails.length,
    lastThreeScoreShare: recording.score ? lateScore / recording.score : 0,
    builtTileReuses,
    bombsCleared,
    bombsClearedAsEndpoint,
    bombsSweptThrough,
    samePositionBotTileSetAgreement: moveDetails.filter((move) => move.botChoice.sameTiles).length,
    atLeastBoundedLongChain: moveDetails.filter((move) => (
      move.chainLength >= move.boundedLongChainLength
    )).length,
    moveDetails,
    bot: {
      score: botSession.outcome.finalScore,
      moves: botSession.outcome.movesUsed,
      outcome: botSession.outcome.result,
    },
  };
}

function collectPrototypeSessions(prototypesRoot = __dirname) {
  const sessions = [];
  const families = [];
  const unresolved = [];

  for (const entry of fs.readdirSync(prototypesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(prototypesRoot, entry.name);
    const candidates = candidatesForFamily(directory);
    if (!candidates.length) continue;
    const byIdentity = new Map(candidates.map((candidate) => [identity(candidate), candidate]));
    const files = jsonFilesBelow(path.join(directory, 'sessions'));
    families.push({
      family: entry.name,
      qualitativeVerdict: qualitativeVerdict(directory),
      sessionCount: files.length,
    });

    for (const file of files) {
      const recording = JSON.parse(fs.readFileSync(file, 'utf8'));
      const candidate = byIdentity.get(recording.candidateIdentity);
      if (!candidate) {
        unresolved.push({ family: entry.name, file: path.relative(ROOT, file), reason: 'candidate identity unresolved' });
        continue;
      }
      try {
        sessions.push({
          family: entry.name,
          file: path.relative(ROOT, file),
          ...analyzeRecording(candidate, recording),
        });
      } catch (error) {
        unresolved.push({ family: entry.name, file: path.relative(ROOT, file), reason: error.message });
      }
    }
  }

  return {
    standing: 'exploratory prototype observations; not evidence-ledger claims',
    families: families.sort((a, b) => a.family.localeCompare(b.family)),
    sessions: sessions.sort((a, b) => a.family.localeCompare(b.family) || a.moves - b.moves),
    unresolved,
  };
}

function percent(value) {
  return `${(value * 100).toFixed(0)}%`;
}

function formatMarkdown(report) {
  const lines = [
    '# Prototype session analysis',
    '',
    `Standing: **${report.standing}.**`,
    '',
    '| Family | Play | Human | Bot, same board and seed | Mean chain | Mean board coverage | At least bounded long-chain | Last 3 score | Built-tile reuses | Bomb endpoint / swept | Same-position bot tile-set agreement |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];

  for (const session of report.sessions) {
    lines.push(
      `| ${session.family} | ${session.file.split('/').at(-1).slice(0, 8)} | `
      + `${session.score.toLocaleString()} / ${session.moves} moves | `
      + `${session.bot.score.toLocaleString()} / ${session.bot.moves} moves | `
      + `${session.meanChainLength.toFixed(1)} | ${percent(session.meanChainCoverage)} | `
      + `${session.atLeastBoundedLongChain}/${session.moves} | `
      + `${percent(session.lastThreeScoreShare)} | ${session.builtTileReuses} | `
      + `${session.bombsClearedAsEndpoint} / ${session.bombsSweptThrough} | `
      + `${session.samePositionBotTileSetAgreement}/${session.moves} |`,
    );
  }

  lines.push(
    '',
    '_“Bounded long-chain” is the longest chain found by the existing width-8 greedy path generator, not a proven mathematical maximum. A human chain may exceed it._',
  );

  lines.push('', '## Qualitative verdicts', '');
  for (const family of report.families) {
    lines.push(`- **${family.family}:** ${family.qualitativeVerdict || 'No outcome recorded.'} (${family.sessionCount} recorded play${family.sessionCount === 1 ? '' : 's'})`);
  }
  if (report.unresolved.length) {
    lines.push('', '## Unresolved recordings', '');
    for (const item of report.unresolved) lines.push(`- ${item.file}: ${item.reason}`);
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const report = collectPrototypeSessions();
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(formatMarkdown(report));
  return report.unresolved.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main();

module.exports = {
  analyzeRecording,
  collectPrototypeSessions,
  formatMarkdown,
};
