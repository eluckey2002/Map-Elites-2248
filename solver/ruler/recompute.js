#!/usr/bin/env node
'use strict';

// Independent of every producer module under solver/ruler/. The raw game rows
// provide level definitions and policy parameters; only the production engine
// and bot are imported for deterministic replay spot checks.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('../engine');
const { chooseMove, chooseBaseMove, DEFAULT_PARAMS } = require('../bot');

const file = process.argv[2] || path.join(__dirname, '..', '..', 'experiments', 'RESULT-0058', 'raw-games.json');
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const differences = [];
const completeStatistics = new Map();
const numericOnly = process.argv.includes('--numeric-only');
const fixedLevels = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52];
const fixedBlocks = {
  null: [50000000, 100], positive3000: [50100000, 250],
  bad72: [50300000, 6], bad600: [50301000, 50],
  curseScreen: [50400000, 6], curseFresh: [50401000, 6],
  map72: [50500000, 6], map600: [50501000, 50], map3000: [50502000, 250],
  mapFresh: [50503000, 6], mapHoldout: [50504000, 250],
};
const keyed = new Map();
for (const row of raw.games) {
  const outcome = row.outcome;
  if (!outcome || typeof outcome.win !== 'boolean' || !Number.isInteger(outcome.moveBudget)
    || outcome.moveBudget < 1 || (outcome.win && (!Number.isInteger(outcome.movesToTarget)
      || outcome.movesToTarget < 1 || outcome.movesToTarget > outcome.moveBudget))
    || (!outcome.win && outcome.movesToTarget !== null)) {
    differences.push('malformed target outcome ' + row.stage + ' ' + row.level + ' ' + row.seed);
  }
  const key = [row.stage, row.arm, row.policyId].join('|');
  if (!keyed.has(key)) keyed.set(key, []);
  keyed.get(key).push(row);
}
const panelIndex = new Map();
for (const panel of raw.panels) {
  const shortBlock = /^positive72-(\d\d)$/.exec(panel.tag);
  const block = shortBlock && Number(shortBlock[1]) < 50
    ? [50200000 + 6 * Number(shortBlock[1]), 6] : fixedBlocks[panel.tag];
  if (!block) differences.push('undeclared panel tag ' + panel.tag);
  else {
    compare(panel.levels, panel.tag === 'null' ? fixedLevels.slice(0, 10) : fixedLevels,
      'declared levels ' + panel.tag);
    compare(panel.seeds, Array.from({ length: block[1] }, (_, index) => block[0] + index),
      'declared seeds ' + panel.tag);
  }
  const key = [panel.tag, panel.arm, panel.policyId].join('|');
  if (panelIndex.has(key)) differences.push('duplicate panel ' + key);
  panelIndex.set(key, panel);
  const rows = keyed.get(key) || [];
  const expectedCells = panel.levels.length * panel.seeds.length;
  if (panel.games !== expectedCells || rows.length !== expectedCells) {
    differences.push('incomplete panel grid ' + key + ' expected=' + expectedCells
      + ' declared=' + panel.games + ' retained=' + rows.length);
  }
  if (rows.length !== panel.games) differences.push('panel game count ' + key);
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].level !== panel.levels[Math.floor(index / panel.seeds.length)]
      || rows[index].seed !== panel.seeds[index % panel.seeds.length]) {
      differences.push('panel order ' + key + ' index ' + index);
      break;
    }
  }
}
if ([...keyed.values()].reduce((sum, rows) => sum + rows.length, 0) !== raw.games.length) {
  differences.push('raw row count');
}
if (raw.games.length > 60000) differences.push('effort bound');
if (raw.panels.reduce((sum, panel) => sum + panel.games, 0) !== raw.games.length) {
  differences.push('panel manifest does not cover every raw game');
}
for (const key of keyed.keys()) if (!panelIndex.has(key)) differences.push('orphan raw panel ' + key);

function rows(tag, arm, policyId = null) {
  const panels = raw.panels.filter((panel) => panel.tag === tag && panel.arm === arm
    && (policyId === null || panel.policyId === policyId));
  if (panels.length !== 1) throw new Error('expected one ' + tag + ' ' + arm + ' panel, got ' + panels.length);
  const panel = panels[0];
  return { panel, rows: keyed.get([tag, arm, panel.policyId].join('|')) || [] };
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function axisSE(groups) {
  const means = groups.filter((group) => group.length).map(average);
  if (means.length < 2) return null;
  const center = average(means);
  const variance = means.reduce((sum, value) => sum + (value - center) ** 2, 0) / (means.length - 1);
  return Math.sqrt(variance / means.length);
}

function aggregate(tag, policyId = null) {
  const candidate = rows(tag, 'candidate', policyId);
  const reference = rows(tag, 'reference');
  const { levels, seeds } = candidate.panel;
  if (JSON.stringify(levels) !== JSON.stringify(reference.panel.levels)
    || JSON.stringify(seeds) !== JSON.stringify(reference.panel.seeds)) {
    differences.push('unpaired axes ' + tag);
  }
  let gained = 0;
  let lost = 0;
  let bothWin = 0;
  let bothLose = 0;
  let candidateFaster = 0;
  let championFaster = 0;
  let sameSpeed = 0;
  let referenceMoveSum = 0;
  const movesByLevel = Array.from({ length: levels.length }, () => []);
  const movesBySeed = Array.from({ length: seeds.length }, () => []);
  const moveValues = [];
  const winsByLevel = Array.from({ length: levels.length }, () => []);
  const winsBySeed = Array.from({ length: seeds.length }, () => []);
  const winValues = [];
  if (candidate.rows.length !== levels.length * seeds.length
    || reference.rows.length !== levels.length * seeds.length) {
    differences.push('missing raw pair ' + tag);
  }
  for (let index = 0; index < candidate.rows.length; index += 1) {
    const one = candidate.rows[index];
    const two = reference.rows[index];
    if (!two || one.level !== two.level || one.seed !== two.seed) {
      differences.push('unpaired cell ' + tag + ' ' + index);
      continue;
    }
    const a = one.outcome;
    const b = two.outcome;
    if (a.moveBudget !== b.moveBudget) differences.push('move budget mismatch ' + tag + ' ' + index);
    if (a.win && !b.win) gained += 1;
    if (!a.win && b.win) lost += 1;
    const winDifference = Number(a.win) - Number(b.win);
    winValues.push(winDifference);
    winsByLevel[Math.floor(index / seeds.length)].push(winDifference);
    winsBySeed[index % seeds.length].push(winDifference);
    if (a.win && b.win) {
      bothWin += 1;
      referenceMoveSum += b.movesToTarget;
      const value = b.movesToTarget - a.movesToTarget;
      moveValues.push(value);
      movesByLevel[Math.floor(index / seeds.length)].push(value);
      movesBySeed[index % seeds.length].push(value);
      if (value > 0) candidateFaster += 1;
      else if (value < 0) championFaster += 1;
      else sameSpeed += 1;
    } else if (!a.win && !b.win) {
      bothLose += 1;
    }
  }
  const estimate = moveValues.length ? average(moveValues) : null;
  const seLevel = moveValues.length ? axisSE(movesByLevel) : null;
  const seSeed = moveValues.length ? axisSE(movesBySeed) : null;
  const se = seLevel === null || seSeed === null ? null : Math.max(seLevel, seSeed);
  const summary = {
    cells: candidate.rows.length,
    winsGained: gained,
    winsLost: lost,
    netWins: gained - lost,
    bothWin,
    meanMovesSaved: estimate,
    moveSe: se,
    moveSeLevel: seLevel,
    moveSeSeed: seSeed,
    moveCi95: se === null ? [null, null] : [estimate - 1.96 * se, estimate + 1.96 * se],
    relativeMovesPct: bothWin ? 100 * estimate / (referenceMoveSum / bothWin) : null,
  };
  const winRateDifference = winValues.length ? average(winValues) : null;
  const winSeLevel = winValues.length ? axisSE(winsByLevel) : null;
  const winSeSeed = winValues.length ? axisSE(winsBySeed) : null;
  const winSe = winSeLevel === null || winSeSeed === null ? null : Math.max(winSeLevel, winSeSeed);
  completeStatistics.set(tag + '|' + candidate.panel.policyId, {
    ...summary, bothLose, candidateFaster, championFaster, sameSpeed,
    winRateDifference, winSe, winSeLevel, winSeSeed,
    winCi95: winSe === null ? [null, null]
      : [winRateDifference - 1.96 * winSe, winRateDifference + 1.96 * winSe],
    mutualWins: bothWin,
  });
  // Keep the original sealed headline schema intact. The complete independently
  // derived summaries below retain both axes without rewriting the game log.
  return summary;
}

function compare(a, b, label) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > 1e-9) {
      differences.push(label + ' expected=' + b + ' recomputed=' + a);
    }
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) differences.push(label + ' length mismatch');
    for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
      compare(a[index], b[index], label + '[' + index + ']');
    }
  } else if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of Object.keys(a)) compare(a[key], b[key], label + '.' + key);
  } else if (a !== b) differences.push(label + ' expected=' + b + ' recomputed=' + a);
}

function fitness(a, b) {
  if (a.netWins !== b.netWins) return Math.sign(a.netWins - b.netWins);
  return Math.sign((a.meanMovesSaved ?? 0) - (b.meanMovesSaved ?? 0));
}
const zero = { netWins: 0, meanMovesSaved: 0 };
function firstTwoStage(summary) {
  return summary.netWins < 0
    || (summary.netWins === 0 && summary.moveCi95[1] !== null && summary.moveCi95[1] < 0)
    ? 'CUT' : 'ADVANCE';
}
function stageThree(summary) {
  return summary.netWins > 0 || (summary.netWins === 0 && summary.meanMovesSaved > 0);
}
function stronger(summary) {
  const statistic = summary.moveSe === null || summary.meanMovesSaved === null
    ? NaN : summary.meanMovesSaved / summary.moveSe;
  const t = Number.isNaN(statistic) ? 'UNKNOWN'
    : Number.isFinite(statistic) ? statistic.toFixed(6) : String(statistic);
  return {
    holdoutLiftPct: summary.relativeMovesPct,
    t,
    held: summary.netWins >= 0 && summary.relativeMovesPct > 0 && statistic > 3,
  };
}

const nullSummary = aggregate(raw.manifest.null.tag);
compare(nullSummary, raw.headlines.null.summary, 'item3.null');
if (nullSummary.cells < 1000 || nullSummary.winsGained !== 0
  || nullSummary.winsLost !== 0 || nullSummary.meanMovesSaved !== 0) {
  differences.push('item3 null control did not meet the frozen oracle');
}
console.log('RECOMPUTE item3 cells=' + nullSummary.cells + ' gained=' + nullSummary.winsGained
  + ' lost=' + nullSummary.winsLost + ' moves=' + nullSummary.meanMovesSaved);

const positive = aggregate(raw.manifest.positive.tag);
compare(positive, raw.headlines.positive.summary, 'item4.positive');
if (positive.cells !== 3000 || fitness(positive, zero) <= 0
  || positive.moveCi95[0] === null || positive.moveCi95[0] <= 0) {
  differences.push('item4 positive control did not meet the frozen oracle');
}
let correct = 0;
for (const tag of raw.manifest.positive.positive72Tags) {
  if (fitness(aggregate(tag), zero) > 0) correct += 1;
}
compare(correct, raw.headlines.positive.correct, 'item4.signCorrect');
compare(raw.manifest.positive.positive72Tags.length, 50, 'item4.disjointBlocks');
compare(new Set(raw.manifest.positive.positive72Tags).size, 50, 'item4.uniqueBlocks');
compare(raw.headlines.positive.blocks, 50, 'item4.printedBlocks');
console.log('RECOMPUTE item4 cells=' + positive.cells + ' gained=' + positive.winsGained
  + ' lost=' + positive.winsLost + ' moves=' + positive.meanMovesSaved
  + ' interval95=[' + positive.moveCi95.join(',') + '] sign=' + correct + '/50');

const bad72 = aggregate('bad72');
let eliminatedAt = firstTwoStage(bad72) === 'CUT' ? 'stage1' : null;
if (!eliminatedAt && raw.panels.some((panel) => panel.tag === 'bad600')) {
  if (firstTwoStage(aggregate('bad600')) === 'CUT') eliminatedAt = 'stage2';
}
const bad = aggregate(raw.manifest.knownBad.tag);
compare(eliminatedAt, raw.headlines.knownBad.eliminatedAt, 'item5.eliminatedAt');
compare(bad, raw.headlines.knownBad.summary, 'item5.summary');
if (!eliminatedAt) differences.push('item5 known-bad policy survived both stages');
console.log('RECOMPUTE item5 eliminated=' + eliminatedAt + ' cells=' + bad.cells
  + ' gained=' + bad.winsGained + ' lost=' + bad.winsLost + ' moves=' + bad.meanMovesSaved);

compare(raw.manifest.curse.policies.length, 30, 'item7.variantCount');
compare(new Set(raw.manifest.curse.policies.map((entry) => entry.policyId)).size, 30, 'item7.uniqueVariants');
const curseRows = raw.manifest.curse.policies.map((entry) => {
  const params = raw.policies[entry.policyId].params;
  const changed = Object.keys(DEFAULT_PARAMS).filter((key) => params[key] !== DEFAULT_PARAMS[key]);
  if (changed.length !== 1) differences.push('item7 not a one-gene variant ' + entry.policyId);
  const screen = aggregate(raw.manifest.curse.screenTag, entry.policyId);
  const fresh = aggregate(raw.manifest.curse.freshTag, entry.policyId);
  const screenPct = screen.relativeMovesPct ?? 0;
  const freshPct = fresh.relativeMovesPct ?? 0;
  const result = { name: entry.name, policyId: entry.policyId, screenPct, freshPct,
    gapPct: freshPct - screenPct, screen, fresh };
  const expected = raw.headlines.curse.rows.find((item) => item.policyId === entry.policyId);
  compare(result, expected, 'item7.' + entry.policyId);
  console.log('RECOMPUTE item7 ' + entry.name + ' screen_gained=' + screen.winsGained
    + ' screen_lost=' + screen.winsLost + ' screen_moves=' + screen.meanMovesSaved
    + ' fresh_gained=' + fresh.winsGained + ' fresh_lost=' + fresh.winsLost
    + ' fresh_moves=' + fresh.meanMovesSaved + ' screen_pct=' + screenPct
    + ' fresh_pct=' + freshPct + ' gap_pct=' + result.gapPct);
  return result;
});
const meanGap = average(curseRows.map((entry) => entry.gapPct));
compare(meanGap, raw.headlines.curse.meanGapPct, 'item7.meanGap');
console.log('RECOMPUTE item7 variants=' + curseRows.length + ' mean_fresh_minus_screen_pct=' + meanGap);

let stage1Survivors = 0;
const screenArchive = new Map();
const mapStage2 = new Map();
function parameterId(params) {
  const sorted = {};
  for (const key of Object.keys(params).sort()) sorted[key] = params[key];
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 12);
}
const mutationGenes = [
  ['wRoll', 0, 6, 0.75, false], ['wPlace', 0, 6, 0.75, false],
  ['turnover', 0, 300, 36, false], ['width', 8, 32, 4, true],
  ['bombMax', 4, 12, 2, true], ['wHarvest', 0, 4, 0.75, false],
  ['pathWidth', 1, 10, 2, true],
];
const mutationRng = makeRng(20261002);
const generatedIds = new Set([parameterId(DEFAULT_PARAMS)]);
function nextFrozenMutation(parents) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const parent = parents[Math.floor(mutationRng() * parents.length)];
    const params = { ...parent };
    const count = 1 + Math.floor(mutationRng() * 3);
    const selected = new Set();
    while (selected.size < count) selected.add(Math.floor(mutationRng() * mutationGenes.length));
    for (const index of selected) {
      const [name, low, high, step, integer] = mutationGenes[index];
      const distance = (1 + Math.floor(mutationRng() * 2)) * step;
      const sign = mutationRng() < 0.5 ? -1 : 1;
      const value = Math.min(high, Math.max(low, params[name] + sign * distance));
      params[name] = integer ? Math.round(value) : Math.round(value * 1000) / 1000;
    }
    if (parameterId(params) === parameterId(parent)) {
      const [name, low, high, step, integer] = mutationGenes[Math.floor(mutationRng() * mutationGenes.length)];
      const value = Math.min(high, Math.max(low, params[name] + (params[name] >= high ? -step : step)));
      params[name] = integer ? Math.round(value) : Math.round(value * 1000) / 1000;
    }
    const id = parameterId(params);
    if (!generatedIds.has(id)) {
      generatedIds.add(id);
      return { policyId: id, params };
    }
  }
  throw new Error('frozen mutation stream exhausted');
}
for (const [id, policy] of Object.entries(raw.policies)) {
  if (policy.kind === 'variant' && parameterId(policy.params) !== id) {
    differences.push('policy ID does not hash its parameters ' + id);
  }
}
compare(raw.manifest.map.mutantPolicies.length, 120, 'item9.frozenMutantCount');
compare(new Set(raw.manifest.map.mutantPolicies.map((entry) => entry.policyId)).size, 120,
  'item9.uniqueMutants');
for (const mutant of raw.manifest.map.mutantPolicies) {
  const expectedMutation = nextFrozenMutation([DEFAULT_PARAMS,
    ...[...screenArchive.values()].map((entry) => entry.params)]);
  compare(mutant.policyId, expectedMutation.policyId, 'frozen mutation ID ' + mutant.policyId);
  const retainedParams = raw.policies[mutant.policyId] && raw.policies[mutant.policyId].params;
  compare(expectedMutation.params, retainedParams, 'frozen mutation parameters ' + mutant.policyId);
  if (retainedParams) for (const [name, low, high, , integer] of mutationGenes) {
    if (!Number.isFinite(retainedParams[name]) || retainedParams[name] < low
      || retainedParams[name] > high || (integer && !Number.isInteger(retainedParams[name]))) {
      differences.push('mutation gene outside frozen range ' + mutant.policyId + ' ' + name);
    }
  }
  const candidatePanel = raw.panels.find((panel) => (
    panel.tag === 'map72' && panel.arm === 'candidate' && panel.policyId === mutant.policyId
  ));
  if (!candidatePanel) {
    differences.push('missing map72 mutant ' + mutant.policyId);
    continue;
  }
  const original = raw.panels.find((panel) => panel.tag === 'map72' && panel.arm === 'reference');
  const originalRows = keyed.get(['map72', 'reference', original.policyId].join('|')) || [];
  const mutantRows = keyed.get(['map72', 'candidate', mutant.policyId].join('|')) || [];
  const savedPanel = panelIndex.get(['map72', 'candidate', mutant.policyId].join('|'));
  if (!savedPanel || mutantRows.length !== originalRows.length) {
    differences.push('bad mutant panel ' + mutant.policyId);
    continue;
  }
  // Reuse the same independent aggregation over a temporary tag-specific view.
  const tag = 'recompute-mutant-' + mutant.policyId;
  const candidateCopy = { ...candidatePanel, tag };
  const referenceCopy = { ...original, tag };
  const candidateKey = [tag, 'candidate', mutant.policyId].join('|');
  const referenceKey = [tag, 'reference', original.policyId].join('|');
  keyed.set(candidateKey, mutantRows);
  keyed.set(referenceKey, originalRows);
  raw.panels.push(candidateCopy, referenceCopy);
  const result = aggregate(tag);
  raw.panels.pop();
  raw.panels.pop();
  keyed.delete(candidateKey);
  keyed.delete(referenceKey);
  const observedStatus = firstTwoStage(result);
  compare(observedStatus, mutant.stage1, 'item9.mutant.' + mutant.policyId + '.stage1');
  const outcomes = mutantRows.map((entry) => entry.outcome);
  const chains = outcomes.reduce((sum, outcome) => sum + outcome.chainCount, 0);
  const tiles = outcomes.reduce((sum, outcome) => sum + outcome.chainTiles, 0);
  const pace = average(outcomes.map((outcome) => (
    (outcome.win ? outcome.movesToTarget : outcome.moveBudget + 1) / outcome.moveBudget
  )));
  const bin = (value, low, high) => Math.min(4, Math.max(0, Math.floor(5 * (value - low) / (high - low))));
  const cell = bin(chains ? tiles / chains : 0, 3, 12) + ',' + bin(pace, 0, 1.2);
  compare(cell, mutant.cell, 'item9.mutant.' + mutant.policyId + '.bin');
  if (observedStatus === 'ADVANCE') {
    stage1Survivors += 1;
    const incumbent = screenArchive.get(cell);
    if (!incumbent || fitness(result, incumbent.summary) > 0) {
      screenArchive.set(cell, { policyId: mutant.policyId, summary: result, params: expectedMutation.params });
    }
  }
}
compare(stage1Survivors, raw.headlines.map.stage1Survivors, 'item9.stage1Survivors');
console.log('RECOMPUTE frozen_mutation_seed=20261002 policies=' + raw.manifest.map.mutantPolicies.length);

let stage2Survivors = 0;
const stage2Panels = raw.panels.filter((panel) => panel.tag === 'map600' && panel.arm === 'candidate');
const rankPolicies = (a, b) => fitness(b.summary, a.summary) || a.policyId.localeCompare(b.policyId);
compare(stage2Panels.map((panel) => panel.policyId),
  [...screenArchive.values()].sort(rankPolicies).slice(0, 8).map((entry) => entry.policyId),
  'item9.stage2Promotions');
for (const panel of stage2Panels) {
  const reference = raw.panels.find((item) => item.tag === 'map600' && item.arm === 'reference');
  const temporary = 'recompute-stage2-' + panel.policyId;
  raw.panels.push({ ...panel, tag: temporary }, { ...reference, tag: temporary });
  keyed.set([temporary, 'candidate', panel.policyId].join('|'),
    keyed.get(['map600', 'candidate', panel.policyId].join('|')));
  keyed.set([temporary, 'reference', reference.policyId].join('|'),
    keyed.get(['map600', 'reference', reference.policyId].join('|')));
  const result = aggregate(temporary);
  raw.panels.pop();
  raw.panels.pop();
  keyed.delete([temporary, 'candidate', panel.policyId].join('|'));
  keyed.delete([temporary, 'reference', reference.policyId].join('|'));
  if (firstTwoStage(result) === 'ADVANCE') {
    stage2Survivors += 1;
    mapStage2.set(panel.policyId, { policyId: panel.policyId, summary: result });
  }
}
compare(stage2Survivors, raw.headlines.map.stage2Survivors, 'item9.stage2Survivors');

const stage3Nominees = [];
const stage3Panels = raw.panels.filter((panel) => panel.tag === 'map3000' && panel.arm === 'candidate');
compare(stage3Panels.map((panel) => panel.policyId),
  [...mapStage2.values()].sort(rankPolicies).slice(0, 3).map((entry) => entry.policyId),
  'item9.stage3Promotions');
for (const panel of stage3Panels) {
  const reference = raw.panels.find((item) => item.tag === 'map3000' && item.arm === 'reference');
  const temp = 'recompute-stage3-' + panel.policyId;
  raw.panels.push({ ...panel, tag: temp }, { ...reference, tag: temp });
  keyed.set([temp, 'candidate', panel.policyId].join('|'),
    keyed.get(['map3000', 'candidate', panel.policyId].join('|')));
  keyed.set([temp, 'reference', reference.policyId].join('|'),
    keyed.get(['map3000', 'reference', reference.policyId].join('|')));
  const result = aggregate(temp);
  raw.panels.pop();
  raw.panels.pop();
  keyed.delete([temp, 'candidate', panel.policyId].join('|'));
  keyed.delete([temp, 'reference', reference.policyId].join('|'));
  if (stageThree(result)) stage3Nominees.push(panel.policyId);
}
compare(stage3Nominees, raw.manifest.map.nominees.map((entry) => entry.policyId), 'item9.stage3Nominees');

const finalArchive = new Map();
let refused = 0;
for (const nominee of raw.manifest.map.nominees) {
  const candidatePanel = raw.panels.find((panel) => (
    panel.tag === 'mapFresh' && panel.arm === 'candidate' && panel.policyId === nominee.policyId
  ));
  const reference = raw.panels.find((panel) => panel.tag === 'mapFresh' && panel.arm === 'reference');
  if (!candidatePanel || !reference) {
    differences.push('missing fresh panel ' + nominee.policyId);
    continue;
  }
  const tag = 'recompute-fresh-' + nominee.policyId;
  raw.panels.push({ ...candidatePanel, tag }, { ...reference, tag });
  keyed.set([tag, 'candidate', nominee.policyId].join('|'),
    keyed.get(['mapFresh', 'candidate', nominee.policyId].join('|')));
  keyed.set([tag, 'reference', reference.policyId].join('|'),
    keyed.get(['mapFresh', 'reference', reference.policyId].join('|')));
  const fresh = aggregate(tag);
  raw.panels.pop();
  raw.panels.pop();
  keyed.delete([tag, 'candidate', nominee.policyId].join('|'));
  keyed.delete([tag, 'reference', reference.policyId].join('|'));
  if (fitness(fresh, zero) <= 0) { refused += 1; continue; }
  const incumbent = finalArchive.get(nominee.cell);
  if (!incumbent || fitness(fresh, incumbent.fresh) > 0) {
    finalArchive.set(nominee.cell, { ...nominee, fresh });
  } else {
    refused += 1;
  }
}
compare(refused, raw.headlines.map.recheckRefused, 'item9.recheckRefused');
compare(finalArchive.size, raw.headlines.map.archiveEntrants, 'item9.archiveEntrants');
compare(raw.manifest.map.mutantPolicies.length, raw.headlines.map.mutants, 'item9.mutants');
compare(raw.manifest.map.nominees.length, raw.headlines.map.nominees, 'item9.nominees');

const reps = [];
compare(raw.manifest.map.representatives.map((entry) => entry.policyId),
  [...finalArchive.values()].map((entry) => ({ policyId: entry.policyId, summary: entry.fresh }))
    .sort(rankPolicies).slice(0, 3).map((entry) => entry.policyId),
  'item9.freshRepresentativeRank');
for (const listed of raw.manifest.map.representatives) {
  const archived = finalArchive.get(listed.cell);
  if (!archived || archived.policyId !== listed.policyId) {
    differences.push('representative absent from fresh archive ' + listed.policyId);
    continue;
  }
  const summaries = {};
  for (const [key, tag] of [['screen72', 'map72'], ['screen3000', 'map3000'], ['fresh', 'mapFresh'], ['holdout', 'mapHoldout']]) {
    const candidatePanel = raw.panels.find((panel) => (
      panel.tag === tag && panel.arm === 'candidate' && panel.policyId === listed.policyId
    ));
    const reference = raw.panels.find((panel) => panel.tag === tag && panel.arm === 'reference');
    if (!candidatePanel || !reference) {
      differences.push('missing representative panel ' + listed.policyId + ' ' + tag);
      continue;
    }
    const temp = 'recompute-' + key + '-' + listed.policyId;
    raw.panels.push({ ...candidatePanel, tag: temp }, { ...reference, tag: temp });
    keyed.set([temp, 'candidate', listed.policyId].join('|'),
      keyed.get([tag, 'candidate', listed.policyId].join('|')));
    keyed.set([temp, 'reference', reference.policyId].join('|'),
      keyed.get([tag, 'reference', reference.policyId].join('|')));
    summaries[key] = aggregate(temp);
    raw.panels.pop();
    raw.panels.pop();
    keyed.delete([temp, 'candidate', listed.policyId].join('|'));
    keyed.delete([temp, 'reference', reference.policyId].join('|'));
  }
  if (!summaries.holdout || !summaries.screen72 || !summaries.screen3000 || !summaries.fresh) continue;
  const item = {
    policyId: listed.policyId,
    cell: listed.cell,
    screen72: summaries.screen72,
    screen3000: summaries.screen3000,
    fresh: summaries.fresh,
    holdout: summaries.holdout,
    stronger: stronger(summaries.holdout),
  };
  reps.push(item);
  const expected = raw.headlines.map.representatives.find((row) => row.policyId === listed.policyId);
  if (!expected) differences.push('headline missing representative ' + listed.policyId);
  else compare(item, expected, 'item9.rep.' + listed.policyId);
  console.log('RECOMPUTE item9 rep=' + listed.policyId + ' screen72=' + summaries.screen72.meanMovesSaved
    + ' screen3000=' + summaries.screen3000.meanMovesSaved
    + ' fresh=' + summaries.fresh.meanMovesSaved + ' holdout=' + summaries.holdout.meanMovesSaved
    + ' lift_pct=' + item.stronger.holdoutLiftPct + ' t=' + item.stronger.t);
}
const strongerHeld = reps.some((item) => item.stronger.held);
compare(strongerHeld, raw.headlines.map.strongerRuleHeld, 'item9.stronger');
for (const [stage, tag] of [['stage1', 'map72'], ['stage2', 'map600'], ['stage3', 'map3000']]) {
  const panels = raw.panels.filter((panel) => panel.tag === tag && panel.arm === 'candidate');
  const expected = raw.headlines.map.cost[stage];
  compare(panels.length, expected.candidates, 'item9.cost.' + stage + '.candidates');
  if (panels.length) {
    compare(panels[0].games, expected.gamesPerCandidate, 'item9.cost.' + stage + '.games');
    compare(average(panels.map((panel) => panel.cpuSeconds)), expected.meanCpuSeconds,
      'item9.cost.' + stage + '.seconds');
  }
  console.log('RECOMPUTE item9 ' + stage + ' candidates=' + panels.length
    + ' games_per_candidate=' + expected.gamesPerCandidate + ' mean_summed_worker_elapsed_seconds='
    + (panels.length ? average(panels.map((panel) => panel.cpuSeconds)) : 'UNVERIFIED_NOT_RUN'));
}
const positiveLift = reps.some((item) => item.stronger.holdoutLiftPct > 0);
const outcome = strongerHeld ? 'SUPPORTED' : positiveLift ? 'INCONCLUSIVE' : 'FALSIFIED';
compare(outcome, raw.headlines.domainOutcome, 'item9.domainOutcome');
console.log('RECOMPUTE item9 mutants=' + raw.manifest.map.mutantPolicies.length
  + ' stage1_survivors=' + stage1Survivors + ' stage2_survivors=' + stage2Survivors
  + ' nominees=' + raw.manifest.map.nominees.length + ' refused=' + refused
  + ' archive=' + finalArchive.size + ' representatives=' + reps.length + ' stronger=' + strongerHeld
  + ' domain=' + outcome + ' raw_games=' + raw.games.length);

function replay(row) {
  const before = differences.length;
  const levelData = raw.levelDefinitions[row.level];
  const policy = raw.policies[row.policyId];
  if (!levelData || !policy) throw new Error('missing replay definition');
  const chooser = policy.kind === 'base' ? chooseBaseMove : chooseMove;
  const rng = makeRng(row.seed);
  const state = createLevelState(levelData, rng);
  const trace = [];
  let reason = 'out_of_moves';
  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex += 1) {
    const options = { lookaheadRngFactory: () => makeRng(987654321 + moveIndex) };
    if (policy.kind === 'variant') options.params = policy.params;
    const chain = chooser(state, options);
    if (!chain) { reason = 'no_valid_moves'; break; }
    trace.push(chain.map(({ x, y }) => x + ',' + y).join('|'));
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) { reason = 'bomb'; break; }
    if (state.score >= state.targetScore) { reason = 'target'; break; }
    if (state.moves >= state.maxMoves) break;
  }
  const hash = crypto.createHash('sha256').update(JSON.stringify(trace)).digest('hex');
  for (const [key, value] of Object.entries({
    win: reason === 'target',
    movesToTarget: reason === 'target' ? state.moves : null,
    score: state.score, reason, traceIdentity: hash,
  })) {
    if (row.outcome[key] !== value) differences.push('replay ' + row.stage + '/' + row.arm + ' ' + key);
  }
  console.log('RECOMPUTE REPLAY stage=' + row.stage + ' arm=' + row.arm + ' policy=' + row.policyId
    + ' level=' + row.level + ' seed=' + row.seed + ' trace_sha256=' + hash
    + ' match=' + (differences.length === before));
}
const originalPanels = raw.panels.filter((panel) => panel.arm === 'candidate');
const completePanels = originalPanels.map((panel) => {
  aggregate(panel.tag, panel.policyId);
  return {
    tag: panel.tag, policyId: panel.policyId,
    referencePolicyId: rows(panel.tag, 'reference').panel.policyId,
    levels: panel.levels, seeds: panel.seeds,
    summary: completeStatistics.get(panel.tag + '|' + panel.policyId),
  };
});
for (const panel of completePanels) {
  const s = panel.summary;
  console.log('RECOMPUTE WIN_AXIS ' + panel.tag + ' ' + panel.policyId
    + ' rate=' + s.winRateDifference + ' se_level=' + s.winSeLevel
    + ' se_seed=' + s.winSeSeed + ' se=' + s.winSe + ' interval95=[' + s.winCi95.join(',') + ']');
}
const summaryArg = process.argv.indexOf('--summary-output');
if (summaryArg >= 0 && !differences.length) {
  if (!process.argv[summaryArg + 1]) throw new Error('--summary-output requires a file');
  fs.writeFileSync(process.argv[summaryArg + 1], JSON.stringify({
    schemaVersion: 1, result: raw.result, registration: raw.registration,
    sourceRawSha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    panels: completePanels,
  }, null, 2) + '\n', { flag: 'wx' });
}

// The initial completed recompute retained six replay matches at commit
// 14710dc. These two additional, previously unselected late-Level-52 cells
// complete the preregistered allowance of eight without replaying those six.
const replayRows = [
  raw.games.filter((row) => row.stage === 'map3000' && row.arm === 'candidate').at(-1),
  raw.games.filter((row) => row.stage === 'map3000' && row.arm === 'reference').at(-1),
].filter(Boolean);
const replayCount = differences.length || numericOnly ? 0 : replayRows.length;
if (!differences.length && !numericOnly) for (const row of replayRows) replay(row);
console.log('RECOMPUTE deterministic_replays=' + replayCount);
if (numericOnly) console.log('UNVERIFIED: deterministic replay is disabled in numeric-only diagnostic mode');

if (differences.length) {
  for (const difference of differences) console.log('DIFF ' + difference);
  process.exitCode = 1;
} else {
  console.log((numericOnly ? 'MATCH NUMERIC_ONLY' : 'MATCH') + ' item3 item4 item5 item7 item9');
}
