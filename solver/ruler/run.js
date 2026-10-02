#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { LEVELS: SHIPPED_LEVELS } = require('../../src/game');
const { DEFAULT_PARAMS } = require('../bot');
const { requireProtocolOrExit, registrationStamp } = require('../experiment-guard');
const { persistBeforeVerdict } = require('../../tools/persist-before-verdict');
const {
  RESULT, LEVELS, NULL_LEVELS, MAX_GAMES, MUTANTS, STAGE2_LIMIT, STAGE3_LIMIT, BLOCKS, seeds,
} = require('./config');
const { CHAMPION_FITNESS, admit, compareFitness, stageDecision, summarizePairs } = require('./core');
const { behavior, cellForBehavior } = require('./game');
const { createPool } = require('./pool');
const { backtest } = require('./backtest');
const { mutationStream, oneGeneVariants, policyId, shortMyopic } = require('./policies');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'experiments', RESULT, 'raw-games.json');
const byLevel = new Map(SHIPPED_LEVELS.map((levelData) => [levelData.level, levelData]));
const CHAMPION = Object.freeze({ kind: 'champion', policyId: policyId(DEFAULT_PARAMS) });
const BASE = Object.freeze({ kind: 'base', policyId: 'chooseBaseMove' });
const variant = (params) => ({ kind: 'variant', policyId: policyId(params), params });

function makePairs(candidatePanel, referencePanel, levels, seedNumbers) {
  const expected = levels.length * seedNumbers.length;
  if (candidatePanel.games.length !== expected || referencePanel.games.length !== expected) {
    throw new Error('paired panel has missing games');
  }
  return candidatePanel.games.map((candidate, index) => {
    const reference = referencePanel.games[index];
    if (candidate.level !== reference.level || candidate.seed !== reference.seed) {
      throw new Error('candidate and reference are not on identical cells');
    }
    return {
      level: candidate.level, seed: candidate.seed,
      candidate: candidate.outcome, champion: reference.outcome,
    };
  });
}

function paired(candidate, reference, levels, seedNumbers) {
  return summarizePairs(makePairs(candidate, reference, levels, seedNumbers), levels, seedNumbers);
}

function fitnessSort(a, b, key) {
  return compareFitness(b[key], a[key]) || a.policyId.localeCompare(b.policyId);
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function compact(summary) {
  if (!summary) return null;
  return {
    cells: summary.cells,
    winsGained: summary.winsGained,
    winsLost: summary.winsLost,
    netWins: summary.netWins,
    bothWin: summary.bothWin,
    meanMovesSaved: summary.meanMovesSaved,
    moveSe: summary.moveSe,
    moveSeLevel: summary.moveSeLevel,
    moveSeSeed: summary.moveSeSeed,
    moveCi95: summary.moveCi95,
    relativeMovesPct: summary.relativeMovesPct,
  };
}

function strongerPolicy(summary) {
  const t = summary.moveSe === 0
    ? (summary.meanMovesSaved > 0 ? 'Infinity' : '0')
    : summary.moveSe === null || summary.meanMovesSaved === null
      ? 'UNKNOWN' : (summary.meanMovesSaved / summary.moveSe).toFixed(6);
  return {
    holdoutLiftPct: summary.relativeMovesPct,
    t,
    held: summary.netWins >= 0 && summary.relativeMovesPct > 0 && Number(t) > 3,
  };
}

function printFitness(name, summary) {
  const interval = summary.moveCi95.map((value) => value === null ? 'NA' : value.toFixed(6));
  console.log(name + ' cells=' + summary.cells
    + ' wins_gained=' + summary.winsGained + ' wins_lost=' + summary.winsLost
    + ' mean_moves_saved=' + (summary.meanMovesSaved === null ? 'NA' : summary.meanMovesSaved.toFixed(6))
    + ' se_level=' + (summary.moveSeLevel === null ? 'NA' : summary.moveSeLevel.toFixed(6))
    + ' se_seed=' + (summary.moveSeSeed === null ? 'NA' : summary.moveSeSeed.toFixed(6))
    + ' se=' + (summary.moveSe === null ? 'NA' : summary.moveSe.toFixed(6))
    + ' interval95=[' + interval.join(',') + ']');
}

function printReport(raw) {
  const h = raw.headlines;
  console.log('RESULT ' + RESULT + ' raw_games=' + raw.games.length
    + ' protocol_commit=' + raw.registration.protocolCommit);
  printFitness('NULL champion vs itself', h.null.summary);
  printFitness('POSITIVE champion vs chooseBaseMove stage3000', h.positive.summary);
  console.log('POSITIVE sign stage72 disjoint_blocks=' + h.positive.blocks
    + ' correct=' + h.positive.correct + ' frequency='
    + (100 * h.positive.correct / h.positive.blocks).toFixed(2) + '%');
  printFitness('KNOWN-BAD short-myopic ' + h.knownBad.eliminatedAt, h.knownBad.summary);
  console.log('ADMISSION TESTS: node --test solver/tests/ruler.test.js');
  console.log('WINNER CURSE one-gene variants: screen_pct fresh_pct gap_pct');
  for (const row of h.curse.rows) {
    console.log(row.name + ' ' + row.screenPct.toFixed(3) + ' ' + row.freshPct.toFixed(3)
      + ' ' + row.gapPct.toFixed(3));
  }
  console.log('WINNER CURSE mean_fresh_minus_screen_pct=' + h.curse.meanGapPct.toFixed(6));
  console.log('LEGACY BACKTEST screened=' + h.backtest.screened
    + ' definite_stage1_cuts=' + h.backtest.definiteStageOneCuts
    + ' definite_advances=' + h.backtest.definiteStageOneAdvances
    + ' unresolved_moves=' + h.backtest.unresolvedMoves);
  console.log('LEGACY HOLDOUT policy_id screen_score_rank stage1 win_net screen_score_proxy_pct holdout_score_pct');
  for (const row of h.backtest.holdout) {
    console.log(row.policyId + ' ' + row.screenScoreProxyRank + ' ' + row.stageOneStatus
      + ' ' + row.stageOneWinNet + ' ' + row.screenScoreProxyPct.toFixed(3)
      + ' ' + row.holdoutScorePct.toFixed(3));
  }
  console.log(h.backtest.caveat);
  console.log('MAP-ELITES mutants=' + h.map.mutants + ' bins=5x5 stage1_survivors='
    + h.map.stage1Survivors + ' stage2_survivors=' + h.map.stage2Survivors
    + ' stage3_nominees=' + h.map.nominees + ' recheck_refused=' + h.map.recheckRefused
    + ' archive_entrants=' + h.map.archiveEntrants);
  console.log('MAP stage games_per_candidate mean_cpu_seconds_per_candidate candidates');
  for (const stage of ['stage1', 'stage2', 'stage3']) {
    const cost = h.map.cost[stage];
    console.log(stage + ' ' + cost.gamesPerCandidate + ' '
      + (cost.meanCpuSeconds === null ? 'NA' : cost.meanCpuSeconds.toFixed(3))
      + ' ' + cost.candidates);
  }
  console.log('MAP representative policy_id cell screen72_net screen72_moves screen3000_net screen3000_moves fresh_net fresh_moves holdout_net holdout_moves holdout_lift_pct t stronger_rule');
  for (const row of h.map.representatives) {
    const fmt = (value) => value === null ? 'NA' : value.toFixed(6);
    console.log(row.policyId + ' ' + row.cell + ' ' + row.screen72.netWins + ' '
      + fmt(row.screen72.meanMovesSaved) + ' ' + row.screen3000.netWins + ' '
      + fmt(row.screen3000.meanMovesSaved) + ' ' + row.fresh.netWins + ' '
      + fmt(row.fresh.meanMovesSaved) + ' ' + row.holdout.netWins + ' '
      + fmt(row.holdout.meanMovesSaved) + ' '
      + (row.stronger.holdoutLiftPct === null ? 'NA' : row.stronger.holdoutLiftPct.toFixed(3))
      + ' ' + row.stronger.t + ' ' + row.stronger.held);
  }
  console.log('MAP stronger-policy rule positive holdout lift and t > 3 held=' + h.map.strongerRuleHeld);
  console.log('DOMAIN OUTCOME=' + h.domainOutcome + ' (no policy adopted)');
}

async function runAll(registration) {
  if (fs.existsSync(OUT)) throw new Error('one-shot raw artifact already exists; refuse rerun');
  const pool = createPool();
  const raw = {
    schemaVersion: 1,
    result: RESULT,
    registration: registrationStamp(registration),
    configuration: {
      levels: LEVELS, nullLevels: NULL_LEVELS, blocks: BLOCKS,
      maxGames: MAX_GAMES, mutants: MUTANTS, stage2Limit: STAGE2_LIMIT, stage3Limit: STAGE3_LIMIT,
    },
    levelDefinitions: Object.fromEntries(LEVELS.map((number) => [number, byLevel.get(number)])),
    policies: {},
    panels: [],
    games: [],
    manifest: {},
    headlines: null,
  };
  const costs = { stage1: [], stage2: [], stage3: [] };
  let gameCount = 0;

  async function runPanel(tag, arm, policy, levelNumbers, seedNumbers, costStage = null) {
    const count = levelNumbers.length * seedNumbers.length;
    if (gameCount + count > MAX_GAMES) throw new Error('60,000-game effort bound would be exceeded');
    gameCount += count;
    raw.policies[policy.policyId] = { kind: policy.kind, params: policy.params || null };
    const started = performance.now();
    const parts = await Promise.all(levelNumbers.map((number) => {
      const levelData = byLevel.get(number);
      if (!levelData) throw new Error('missing shipped level ' + number);
      return pool.run({ stage: tag, arm, policy, levelData, seeds: seedNumbers });
    }));
    const games = parts.flatMap((part) => part.games);
    const cpuSeconds = parts.reduce((sum, part) => sum + part.cpuSeconds, 0);
    const wallSeconds = (performance.now() - started) / 1000;
    if (games.length !== count) throw new Error('worker returned incomplete panel');
    raw.games.push(...games);
    raw.panels.push({ tag, arm, policyId: policy.policyId, levels: levelNumbers, seeds: seedNumbers,
      games: count, cpuSeconds, wallSeconds });
    if (costStage) costs[costStage].push({ games: count, cpuSeconds, wallSeconds });
    return { games, cpuSeconds, wallSeconds };
  }

  try {
    const nullSeeds = seeds('null');
    const nullCandidate = await runPanel('null', 'candidate', CHAMPION, NULL_LEVELS, nullSeeds);
    const nullReference = await runPanel('null', 'reference', CHAMPION, NULL_LEVELS, nullSeeds);
    const nullSummary = paired(nullCandidate, nullReference, NULL_LEVELS, nullSeeds);
    printFitness('NULL', nullSummary);
    if (nullSummary.winsGained !== 0 || nullSummary.winsLost !== 0
      || nullSummary.meanMovesSaved !== 0) throw new Error('NULL control failed');

    const positiveSeeds = seeds('positive3000');
    const positiveCandidate = await runPanel('positive3000', 'candidate', CHAMPION, LEVELS, positiveSeeds);
    const positiveReference = await runPanel('positive3000', 'reference', BASE, LEVELS, positiveSeeds);
    const positiveSummary = paired(positiveCandidate, positiveReference, LEVELS, positiveSeeds);
    printFitness('POSITIVE', positiveSummary);
    if (compareFitness(positiveSummary, CHAMPION_FITNESS) <= 0
      || positiveSummary.moveCi95[0] === null || positiveSummary.moveCi95[0] <= 0) {
      throw new Error('POSITIVE control failed');
    }

    let correct = 0;
    const positive72Tags = [];
    const frequencySeeds = seeds('positive72');
    for (let index = 0; index < 50; index += 1) {
      const tag = 'positive72-' + String(index).padStart(2, '0');
      positive72Tags.push(tag);
      const sixSeeds = frequencySeeds.slice(index * 6, index * 6 + 6);
      const candidate = await runPanel(tag, 'candidate', CHAMPION, LEVELS, sixSeeds);
      const reference = await runPanel(tag, 'reference', BASE, LEVELS, sixSeeds);
      const summary = paired(candidate, reference, LEVELS, sixSeeds);
      if (compareFitness(summary, CHAMPION_FITNESS) > 0) correct += 1;
      if ((index + 1) % 10 === 0) console.log('POSITIVE 72 blocks completed=' + (index + 1) + '/50');
    }

    const badPolicy = variant(shortMyopic());
    const badSeeds = seeds('bad72');
    const badCandidate = await runPanel('bad72', 'candidate', badPolicy, LEVELS, badSeeds);
    const badReference = await runPanel('bad72', 'reference', CHAMPION, LEVELS, badSeeds);
    let badSummary = paired(badCandidate, badReference, LEVELS, badSeeds);
    let eliminatedAt = stageDecision(badSummary, 1) === 'CUT' ? 'stage1' : null;
    if (!eliminatedAt) {
      const wideSeeds = seeds('bad600');
      const candidate = await runPanel('bad600', 'candidate', badPolicy, LEVELS, wideSeeds);
      const reference = await runPanel('bad600', 'reference', CHAMPION, LEVELS, wideSeeds);
      badSummary = paired(candidate, reference, LEVELS, wideSeeds);
      if (stageDecision(badSummary, 2) === 'CUT') eliminatedAt = 'stage2';
    }
    printFitness('KNOWN-BAD ' + (eliminatedAt || 'NOT ELIMINATED'), badSummary);
    if (!eliminatedAt) throw new Error('known-bad control survived stage 2');

    const variants = oneGeneVariants();
    const curseScreenSeeds = seeds('curseScreen');
    const curseFreshSeeds = seeds('curseFresh');
    const curseReferenceScreen = await runPanel('curseScreen', 'reference', CHAMPION, LEVELS, curseScreenSeeds);
    const curseReferenceFresh = await runPanel('curseFresh', 'reference', CHAMPION, LEVELS, curseFreshSeeds);
    const curseRows = [];
    for (const entry of variants) {
      const policy = variant(entry.params);
      const screenPanel = await runPanel('curseScreen', 'candidate', policy, LEVELS, curseScreenSeeds);
      const freshPanel = await runPanel('curseFresh', 'candidate', policy, LEVELS, curseFreshSeeds);
      const screen = paired(screenPanel, curseReferenceScreen, LEVELS, curseScreenSeeds);
      const fresh = paired(freshPanel, curseReferenceFresh, LEVELS, curseFreshSeeds);
      const screenPct = screen.relativeMovesPct ?? 0;
      const freshPct = fresh.relativeMovesPct ?? 0;
      curseRows.push({ name: entry.name, policyId: entry.policyId,
        screenPct, freshPct, gapPct: freshPct - screenPct,
        screen: compact(screen), fresh: compact(fresh) });
    }
    console.log('WINNER CURSE completed variants=' + curseRows.length);
    const legacy = backtest();
    console.log('LEGACY BACKTEST definite_stage1_cuts=' + legacy.definiteStageOneCuts);

    const mapScreenSeeds = seeds('map72');
    const mapReferenceScreen = await runPanel('map72', 'reference', CHAMPION, LEVELS, mapScreenSeeds);
    const nextMutation = mutationStream(20261002);
    const provisionalArchive = new Map();
    const stage1Survivors = [];
    const allMutants = [];
    for (let index = 0; index < MUTANTS; index += 1) {
      const parents = [DEFAULT_PARAMS, ...[...provisionalArchive.values()].map((entry) => entry.params)];
      const mutant = nextMutation(parents);
      const policy = variant(mutant.params);
      const panel = await runPanel('map72', 'candidate', policy, LEVELS, mapScreenSeeds, 'stage1');
      const screen = paired(panel, mapReferenceScreen, LEVELS, mapScreenSeeds);
      const cell = cellForBehavior(behavior(panel.games.map((row) => row.outcome)));
      const entry = { policyId: policy.policyId, params: mutant.params, cell, screen: compact(screen) };
      allMutants.push({ policyId: entry.policyId, cell, stage1: stageDecision(screen, 1) });
      if (stageDecision(screen, 1) === 'ADVANCE') {
        stage1Survivors.push(entry);
        const incumbent = provisionalArchive.get(cell);
        if (!incumbent || compareFitness(entry.screen, incumbent.screen) > 0) {
          provisionalArchive.set(cell, entry);
        }
      }
      if ((index + 1) % 20 === 0) console.log('MAP screen mutants=' + (index + 1) + '/120');
    }

    const stage2Candidates = [...provisionalArchive.values()]
      .sort((a, b) => fitnessSort(a, b, 'screen')).slice(0, STAGE2_LIMIT);
    const stage2Survivors = [];
    if (stage2Candidates.length) {
      const stage2Seeds = seeds('map600');
      const reference = await runPanel('map600', 'reference', CHAMPION, LEVELS, stage2Seeds);
      for (const entry of stage2Candidates) {
        const candidate = await runPanel('map600', 'candidate', variant(entry.params), LEVELS,
          stage2Seeds, 'stage2');
        const stage2 = paired(candidate, reference, LEVELS, stage2Seeds);
        if (stageDecision(stage2, 2) === 'ADVANCE') {
          stage2Survivors.push({ ...entry, stage2: compact(stage2) });
        }
      }
    }
    stage2Survivors.sort((a, b) => fitnessSort(a, b, 'stage2'));
    const stage3Candidates = stage2Survivors.slice(0, STAGE3_LIMIT);
    const nominees = [];
    if (stage3Candidates.length) {
      const stage3Seeds = seeds('map3000');
      const reference = await runPanel('map3000', 'reference', CHAMPION, LEVELS, stage3Seeds);
      for (const entry of stage3Candidates) {
        const candidate = await runPanel('map3000', 'candidate', variant(entry.params),
          LEVELS, stage3Seeds, 'stage3');
        const stage3 = paired(candidate, reference, LEVELS, stage3Seeds);
        if (stageDecision(stage3, 3) === 'NOMINATE') {
          nominees.push({ ...entry, stage3: compact(stage3) });
        }
      }
    }

    const finalArchive = new Map();
    if (nominees.length) {
      const freshSeeds = seeds('mapFresh');
      const reference = await runPanel('mapFresh', 'reference', CHAMPION, LEVELS, freshSeeds);
      for (const entry of nominees) {
        const candidate = await runPanel('mapFresh', 'candidate', variant(entry.params), LEVELS, freshSeeds);
        const fresh = paired(candidate, reference, LEVELS, freshSeeds);
        const incumbent = finalArchive.get(entry.cell);
        const admission = admit(entry.stage3, fresh, incumbent && incumbent.fresh);
        if (admission.admitted) finalArchive.set(entry.cell, { ...entry, fresh: compact(fresh) });
      }
    }
    const rankedArchive = [...finalArchive.values()].sort((a, b) => fitnessSort(a, b, 'fresh'));
    const representatives = [];
    if (rankedArchive.length) {
      const holdoutSeeds = seeds('mapHoldout');
      const reference = await runPanel('mapHoldout', 'reference', CHAMPION, LEVELS, holdoutSeeds);
      for (const entry of rankedArchive.slice(0, 3)) {
        const candidate = await runPanel('mapHoldout', 'candidate', variant(entry.params),
          LEVELS, holdoutSeeds);
        const holdout = paired(candidate, reference, LEVELS, holdoutSeeds);
        representatives.push({
          policyId: entry.policyId, cell: entry.cell,
          screen72: entry.screen, screen3000: entry.stage3, fresh: entry.fresh, holdout: compact(holdout),
          stronger: strongerPolicy(holdout),
        });
      }
    }
    const anyStronger = representatives.some((entry) => entry.stronger.held);
    const anyPositive = representatives.some((entry) => entry.stronger.holdoutLiftPct > 0);
    const domainOutcome = anyStronger ? 'SUPPORTED' : anyPositive ? 'INCONCLUSIVE' : 'FALSIFIED';
    const cost = Object.fromEntries(Object.entries(costs).map(([stage, entries]) => [stage, {
      gamesPerCandidate: entries.length ? entries[0].games : ({ stage1: 72, stage2: 600, stage3: 3000 })[stage],
      meanCpuSeconds: mean(entries.map((item) => item.cpuSeconds)),
      candidates: entries.length,
    }]));

    raw.manifest = {
      null: { tag: 'null', levels: NULL_LEVELS, seeds: nullSeeds },
      positive: { tag: 'positive3000', levels: LEVELS, seeds: positiveSeeds, positive72Tags },
      knownBad: { tag: eliminatedAt === 'stage1' ? 'bad72' : 'bad600', policyId: badPolicy.policyId },
      curse: { screenTag: 'curseScreen', freshTag: 'curseFresh',
        policies: curseRows.map((row) => ({ name: row.name, policyId: row.policyId })) },
      map: { mutantPolicies: allMutants, nominees: nominees.map((entry) => ({
        policyId: entry.policyId, cell: entry.cell,
      })), representatives: representatives.map((entry) => ({
        policyId: entry.policyId, cell: entry.cell,
      })) },
    };
    raw.headlines = {
      null: { summary: compact(nullSummary) },
      positive: { summary: compact(positiveSummary), blocks: 50, correct },
      knownBad: { summary: compact(badSummary), eliminatedAt },
      curse: { rows: curseRows, meanGapPct: mean(curseRows.map((row) => row.gapPct)) },
      backtest: legacy,
      map: {
        mutants: MUTANTS, stage1Survivors: stage1Survivors.length,
        stage2Survivors: stage2Survivors.length, nominees: nominees.length,
        recheckRefused: nominees.length - finalArchive.size,
        archiveEntrants: finalArchive.size, representatives, cost,
        strongerRuleHeld: anyStronger,
      },
      domainOutcome,
    };
    persistBeforeVerdict({
      file: OUT,
      artifact: raw,
      validate: (artifact) => {
        if (artifact.games.length !== gameCount || gameCount > MAX_GAMES) {
          throw new Error('raw artifact game count does not match effort bound');
        }
      },
      evaluate: () => printReport(raw),
    });
    return raw;
  } finally {
    await pool.close();
  }
}

async function main() {
  const registration = requireProtocolOrExit(process.argv, { name: 'trustworthy ruler' });
  if (registration.resultId !== RESULT) throw new Error('expected --protocol ' + RESULT);
  await runAll(registration);
}

if (require.main === module) {
  main().catch((error) => { console.error('FAIL: ' + (error.stack || error)); process.exitCode = 1; });
}

module.exports = { makePairs, paired, runAll, strongerPolicy };
