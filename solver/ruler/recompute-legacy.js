#!/usr/bin/env node
'use strict';

// Independent legacy smoke-test calculation. No producer module is imported.
// Unlike recompute.js, this also reads the older raw-score corpus and the
// frozen shipped targets: that corpus includes Level 51 outside the new panel.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { LEVELS } = require('../../src/game');

const root = path.resolve(__dirname, '../..');
const runFile = process.argv[2] || path.join(root, 'experiments/RESULT-0058/raw-games.json');
const legacyFile = process.argv[3] || path.join(root, '.orch/policy-search-02.cells.json');
const legacyBytes = fs.readFileSync(legacyFile);
const legacyHash = crypto.createHash('sha256').update(legacyBytes).digest('hex');
const gameHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'src/game.js'))).digest('hex');
if (!legacyHash.startsWith('e062df7b0b64f7c4') || !gameHash.startsWith('3d405595707621ce')) {
  throw new Error('legacy corpus or shipped-target source differs from the preregistration');
}
const legacy = JSON.parse(legacyBytes);
const target = new Map(LEVELS.map((level) => [level.level, level.target]));
const problems = [];
if (legacy.screen.policies.length !== 108 || legacy.holdout.policies.length !== 6
  || legacy.screen.levels.length !== 12 || legacy.screen.seeds.length !== 40
  || legacy.holdout.levels.length !== 52 || legacy.holdout.seeds.length !== 250) {
  throw new Error('legacy sample differs from the frozen 108-screen / six-holdout corpus');
}

function idFor(params) {
  const sorted = {};
  for (const key of Object.keys(params).sort()) sorted[key] = params[key];
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 12);
}
function validateScores(panel) {
  for (const entry of panel.policies) {
    if (entry.scores.length !== panel.levels.length * panel.seeds.length
      || entry.scores.some((score) => !Number.isFinite(score) || score < 0)) {
      throw new Error('incomplete or malformed stored-score grid');
    }
  }
}
validateScores(legacy.screen);
validateScores(legacy.holdout);

const stageIndices = [];
for (let levelIndex = 0; levelIndex < legacy.screen.levels.length; levelIndex += 1) {
  const level = legacy.screen.levels[levelIndex];
  if (!target.has(level)) throw new Error('missing target for stored level ' + level);
  for (let seedIndex = 0; seedIndex < 6; seedIndex += 1) {
    stageIndices.push({ offset: levelIndex * legacy.screen.seeds.length + seedIndex, level });
  }
}
const reference = legacy.screen.policies[0].scores;
const policies = legacy.screen.policies.map((entry, index) => {
  let net = 0;
  let logSum = 0;
  for (const cell of stageIndices) {
    net += Number(entry.scores[cell.offset] >= target.get(cell.level))
      - Number(reference[cell.offset] >= target.get(cell.level));
    logSum += Math.log(Math.max(1, entry.scores[cell.offset]) / Math.max(1, reference[cell.offset]));
  }
  return {
    index,
    policyId: idFor(entry.params),
    stageOneStatus: net < 0 ? 'CUT' : net > 0 ? 'ADVANCE' : 'UNRESOLVED_MOVES',
    stageOneWinNet: net,
    screenScoreProxyPct: 100 * Math.expm1(logSum / stageIndices.length),
  };
});
const rank = [...policies].sort((a, b) => b.screenScoreProxyPct - a.screenScoreProxyPct || a.index - b.index);
rank.forEach((entry, index) => { entry.screenScoreProxyRank = index + 1; });
const byId = new Map(policies.map((entry) => [entry.policyId, entry]));
if (byId.size !== 108) throw new Error('legacy screen has duplicate policy identities');

const holdout = legacy.holdout.policies.map((entry) => {
  const policyId = idFor(entry.params);
  const screened = byId.get(policyId);
  if (!screened) throw new Error('legacy holdout policy missing from the screen');
  let total = 0;
  for (let index = 0; index < entry.scores.length; index += 1) {
    total += Math.log(Math.max(1, entry.scores[index])
      / Math.max(1, legacy.holdout.policies[0].scores[index]));
  }
  return {
    policyId,
    screenScoreProxyRank: screened.screenScoreProxyRank,
    stageOneStatus: screened.stageOneStatus,
    stageOneWinNet: screened.stageOneWinNet,
    screenScoreProxyPct: screened.screenScoreProxyPct,
    holdoutScorePct: 100 * Math.expm1(total / entry.scores.length),
  };
});
const result = {
  screened: policies.length,
  definiteStageOneCuts: policies.filter((entry) => entry.stageOneStatus === 'CUT').length,
  definiteStageOneAdvances: policies.filter((entry) => entry.stageOneStatus === 'ADVANCE').length,
  unresolvedMoves: policies.filter((entry) => entry.stageOneStatus === 'UNRESOLVED_MOVES').length,
  holdout,
};
function compare(actual, expected, label) {
  if (typeof actual === 'number') {
    if (typeof expected !== 'number' || Math.abs(actual - expected) > 1e-9) {
      problems.push(label + ' expected=' + expected + ' recomputed=' + actual);
    }
  } else if (Array.isArray(actual)) {
    if (!Array.isArray(expected) || actual.length !== expected.length) {
      problems.push(label + ' length mismatch');
      return;
    }
    actual.forEach((entry, index) => compare(entry, expected[index], label + '[' + index + ']'));
  } else if (actual && typeof actual === 'object') {
    for (const [key, value] of Object.entries(actual)) compare(value, expected && expected[key], label + '.' + key);
  } else if (actual !== expected) {
    problems.push(label + ' expected=' + expected + ' recomputed=' + actual);
  }
}
const run = JSON.parse(fs.readFileSync(runFile, 'utf8'));
compare(result, run.headlines.backtest, 'item8');
console.log('RECOMPUTE item8 screened=' + result.screened + ' definite_stage1_cuts=' + result.definiteStageOneCuts
  + ' definite_advances=' + result.definiteStageOneAdvances + ' unresolved_moves=' + result.unresolvedMoves);
console.log('RECOMPUTE item8 policy_id screen_score_rank stage1 win_net screen_score_proxy_pct holdout_score_pct');
for (const entry of holdout) {
  console.log(entry.policyId + ' ' + entry.screenScoreProxyRank + ' ' + entry.stageOneStatus
    + ' ' + entry.stageOneWinNet + ' ' + entry.screenScoreProxyPct.toFixed(9) + ' ' + entry.holdoutScorePct.toFixed(9));
}
console.log('SMOKE TEST ONLY: only six holdout points exist; stored terminal scores do not contain moves-to-target.');
console.log('LEGACY_CORPUS_SHA256=' + legacyHash);
if (problems.length) {
  for (const problem of problems) console.log('DIFF ' + problem);
  process.exitCode = 1;
} else {
  console.log('MATCH LEGACY');
}
