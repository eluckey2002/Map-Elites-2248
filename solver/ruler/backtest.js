'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { LEVELS } = require('../../src/game');
const { policyId } = require('./policies');

const ROOT = path.join(__dirname, '..', '..');
const FILE = path.join(ROOT, '.orch', 'policy-search-02.cells.json');
const targetByLevel = new Map(LEVELS.map(({ level, target }) => [level, target]));

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function logLift(scores, reference) {
  return mean(scores.map((score, i) => Math.log(Math.max(1, score) / Math.max(1, reference[i]))));
}

function firstSixScores(panel, entry) {
  const width = panel.seeds.length;
  return panel.levels.flatMap((_, levelIndex) => (
    entry.scores.slice(levelIndex * width, levelIndex * width + 6)
  ));
}

function stageOneWins(panel, entry, reference) {
  const width = panel.seeds.length;
  let gained = 0;
  let lost = 0;
  for (let levelIndex = 0; levelIndex < panel.levels.length; levelIndex += 1) {
    const target = targetByLevel.get(panel.levels[levelIndex]);
    if (target === undefined) throw new Error('missing current target for legacy level');
    for (let seedIndex = 0; seedIndex < 6; seedIndex += 1) {
      const offset = levelIndex * width + seedIndex;
      const candidateWin = entry.scores[offset] >= target;
      const referenceWin = reference.scores[offset] >= target;
      if (candidateWin && !referenceWin) gained += 1;
      if (!candidateWin && referenceWin) lost += 1;
    }
  }
  return { gained, lost, net: gained - lost };
}

function backtest() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (data.screen.policies.length !== 108 || data.holdout.policies.length !== 6
    || data.screen.levels.length !== 12 || data.screen.seeds.length < 6) {
    throw new Error('legacy corpus does not match frozen smoke-test denominator');
  }
  const reference = data.screen.policies[0];
  const screen = data.screen.policies.map((entry, index) => {
    const wins = stageOneWins(data.screen, entry, reference);
    const log = logLift(firstSixScores(data.screen, entry), firstSixScores(data.screen, reference));
    return {
      index, policyId: policyId(entry.params), wins, scoreProxyPct: 100 * Math.expm1(log),
      status: wins.net < 0 ? 'CUT' : wins.net > 0 ? 'ADVANCE' : 'UNRESOLVED_MOVES',
    };
  });
  const ranked = [...screen].sort((a, b) => b.scoreProxyPct - a.scoreProxyPct || a.index - b.index);
  for (let index = 0; index < ranked.length; index += 1) ranked[index].scoreProxyRank = index + 1;
  const rankById = new Map(ranked.map((row) => [row.policyId, row.scoreProxyRank]));
  const byId = new Map(screen.map((row) => [row.policyId, row]));
  const holdoutReference = data.holdout.policies[0];
  const holdout = data.holdout.policies.map((entry) => {
    const id = policyId(entry.params);
    const matched = byId.get(id);
    if (!matched) throw new Error('holdout policy absent from screen');
    return {
      policyId: id,
      screenScoreProxyRank: rankById.get(id),
      stageOneStatus: matched.status,
      stageOneWinNet: matched.wins.net,
      screenScoreProxyPct: matched.scoreProxyPct,
      holdoutScorePct: 100 * Math.expm1(logLift(entry.scores, holdoutReference.scores)),
    };
  });
  return {
    screened: screen.length,
    definiteStageOneCuts: screen.filter((row) => row.status === 'CUT').length,
    definiteStageOneAdvances: screen.filter((row) => row.status === 'ADVANCE').length,
    unresolvedMoves: screen.filter((row) => row.status === 'UNRESOLVED_MOVES').length,
    holdout,
    caveat: 'SMOKE TEST ONLY: six holdout policies; stored terminal scores omit moves-to-target, so tied-win stage-1 decisions are unresolved. Current targets are applied to older-bot scores.',
  };
}

function printBacktest(result = backtest()) {
  console.log('LEGACY STAGING BACKTEST .orch/policy-search-02.cells.json');
  console.log('screened=' + result.screened + ' definite_stage1_cuts=' + result.definiteStageOneCuts
    + ' definite_advances=' + result.definiteStageOneAdvances + ' unresolved_moves=' + result.unresolvedMoves);
  console.log('policy_id screen_score_rank stage1 win_net screen_score_proxy_pct holdout_score_pct');
  for (const row of result.holdout) {
    console.log(row.policyId + ' ' + row.screenScoreProxyRank + ' ' + row.stageOneStatus + ' '
      + row.stageOneWinNet + ' ' + row.screenScoreProxyPct.toFixed(3) + ' ' + row.holdoutScorePct.toFixed(3));
  }
  console.log(result.caveat);
}

if (require.main === module) printBacktest();
module.exports = { backtest, printBacktest };
