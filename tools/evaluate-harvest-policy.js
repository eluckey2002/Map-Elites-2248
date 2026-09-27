#!/usr/bin/env node

const { LEVELS } = require('../src/game');
const { search } = require('../solver/oracle/search');
const { verifyWitness } = require('../solver/oracle/verify');

const CASES = Object.freeze([
  { id: 'fresh-56', level: 56, seed: 41000000, humanMoves: 10 },
  { id: 'fresh-58', level: 58, seed: 41000001, humanMoves: 14 },
  { id: 'captured-56-a', level: 56, seed: 1761047823, humanMoves: 10 },
  { id: 'captured-56-b', level: 56, seed: 3504920448, humanMoves: 11 },
]);
const MAX_EXPANDED_STATES = 600;

function ruleLevel(number) {
  const source = LEVELS.find(level => level.level === number);
  if (!source) throw new Error(`missing shipped level ${number}`);
  return Object.fromEntries(['gridW', 'gridH', 'moves', 'minChain', 'target', 'tileScale', 'blockers']
    .map(key => [key, key === 'tileScale' ? source[key] || 1 : structuredClone(source[key])]));
}

function evaluate() {
  const rows = CASES.map(entry => {
    const level = ruleLevel(entry.level);
    const result = search({
      level, seed: entry.seed, budgetMs: 30000,
      maxExpandedStates: MAX_EXPANDED_STATES, includeBaseline: false,
    });
    if (result.best) verifyWitness({ level, seed: entry.seed }, result.best);
    const moves = result.best?.movesUsed ?? null;
    return {
      ...entry,
      outcome: moves === null ? 'no-win' : 'win',
      moves,
      humanMiss: moves === null || moves > entry.humanMoves,
      expandedStates: result.stats.expandedStates,
      terminationReason: result.terminationReason,
    };
  });
  const wins = rows.filter(row => row.outcome === 'win').length;
  const humanMisses = rows.filter(row => row.humanMiss).length;
  const lossAdjustedMoves = rows.reduce((sum, row) => sum + (row.moves ?? ruleLevel(row.level).moves + 20), 0);
  return {
    valid: 1,
    all_wins: wins === rows.length ? 1 : 0,
    wins,
    human_misses: humanMisses,
    loss_adjusted_moves: lossAdjustedMoves,
    total_moves: rows.reduce((sum, row) => sum + (row.moves ?? 0), 0),
    evaluated_boards: rows.length,
    expanded_states: rows.reduce((sum, row) => sum + row.expandedStates, 0),
    rows,
  };
}

if (require.main === module) {
  try { process.stdout.write(`${JSON.stringify(evaluate())}\n`); }
  catch (error) {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  }
}

module.exports = { CASES, MAX_EXPANDED_STATES, evaluate };
