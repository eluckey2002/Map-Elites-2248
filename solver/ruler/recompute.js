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
const { chooseMove, chooseBaseMove } = require('../bot');

const file = process.argv[2] || path.join(__dirname, '..', '..', 'experiments', 'RESULT-0058', 'raw-games.json');
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const differences = [];
const keyed = new Map();
for (const row of raw.games) {
  const key = [row.stage, row.arm, row.policyId].join('|');
  if (!keyed.has(key)) keyed.set(key, []);
  keyed.get(key).push(row);
}
const panelIndex = new Map();
for (const panel of raw.panels) {
  const key = [panel.tag, panel.arm, panel.policyId].join('|');
  if (panelIndex.has(key)) differences.push('duplicate panel ' + key);
  panelIndex.set(key, panel);
  const rows = keyed.get(key) || [];
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

function rows(tag, arm) {
  const panels = raw.panels.filter((panel) => panel.tag === tag && panel.arm === arm);
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

function aggregate(tag) {
  const candidate = rows(tag, 'candidate');
  const reference = rows(tag, 'reference');
  const { levels, seeds } = candidate.panel;
  if (JSON.stringify(levels) !== JSON.stringify(reference.panel.levels)
    || JSON.stringify(seeds) !== JSON.stringify(reference.panel.seeds)) {
    differences.push('unpaired axes ' + tag);
  }
  let gained = 0;
  let lost = 0;
  let bothWin = 0;
  let referenceMoveSum = 0;
  const movesByLevel = Array.from({ length: levels.length }, () => []);
  const movesBySeed = Array.from({ length: seeds.length }, () => []);
  const moveValues = [];
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
    if (a.win && b.win) {
      bothWin += 1;
      referenceMoveSum += b.movesToTarget;
      const value = b.movesToTarget - a.movesToTarget;
      moveValues.push(value);
      movesByLevel[Math.floor(index / seeds.length)].push(value);
      movesBySeed[index % seeds.length].push(value);
    }
  }
  const estimate = moveValues.length ? average(moveValues) : null;
  const seLevel = moveValues.length ? axisSE(movesByLevel) : null;
  const seSeed = moveValues.length ? axisSE(movesBySeed) : null;
  const se = seLevel === null || seSeed === null ? null : Math.max(seLevel, seSeed);
  return {
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
console.log('RECOMPUTE item4 cells=' + positive.cells + ' gained=' + positive.winsGained
  + ' lost=' + positive.winsLost + ' moves=' + positive.meanMovesSaved
  + ' interval95=[' + positive.moveCi95.join(',') + '] sign=' + correct + '/50');

let stage1Survivors = 0;
for (const mutant of raw.manifest.map.mutantPolicies) {
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
  if (observedStatus === 'ADVANCE') stage1Survivors += 1;
}
compare(stage1Survivors, raw.headlines.map.stage1Survivors, 'item9.stage1Survivors');

let stage2Survivors = 0;
const stage2Panels = raw.panels.filter((panel) => panel.tag === 'map600' && panel.arm === 'candidate');
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
  if (firstTwoStage(result) === 'ADVANCE') stage2Survivors += 1;
}
compare(stage2Survivors, raw.headlines.map.stage2Survivors, 'item9.stage2Survivors');

const stage3Nominees = [];
const stage3Panels = raw.panels.filter((panel) => panel.tag === 'map3000' && panel.arm === 'candidate');
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
  if (fitness(fresh, zero) <= 0) continue;
  const incumbent = finalArchive.get(nominee.cell);
  if (!incumbent || fitness(fresh, incumbent.fresh) > 0) {
    finalArchive.set(nominee.cell, { ...nominee, fresh });
  }
}
const refused = raw.manifest.map.nominees.length - finalArchive.size;
compare(refused, raw.headlines.map.recheckRefused, 'item9.recheckRefused');
compare(finalArchive.size, raw.headlines.map.archiveEntrants, 'item9.archiveEntrants');
compare(raw.manifest.map.mutantPolicies.length, raw.headlines.map.mutants, 'item9.mutants');
compare(raw.manifest.map.nominees.length, raw.headlines.map.nominees, 'item9.nominees');

const reps = [];
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
}
const positiveLift = reps.some((item) => item.stronger.holdoutLiftPct > 0);
const outcome = strongerHeld ? 'SUPPORTED' : positiveLift ? 'INCONCLUSIVE' : 'FALSIFIED';
compare(outcome, raw.headlines.domainOutcome, 'item9.domainOutcome');
console.log('RECOMPUTE item9 mutants=' + raw.manifest.map.mutantPolicies.length
  + ' nominees=' + raw.manifest.map.nominees.length + ' refused=' + refused
  + ' archive=' + finalArchive.size + ' stronger=' + strongerHeld);

function replay(row) {
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
}
const replayRows = [
  rows('null', 'candidate').rows[0],
  rows('null', 'reference').rows.at(-1),
  rows('positive3000', 'candidate').rows[0],
  rows('positive3000', 'reference').rows.at(-1),
  ...raw.games.filter((row) => row.stage === 'map72' && row.arm === 'candidate').slice(0, 2),
  ...raw.games.filter((row) => row.stage === 'mapHoldout' && row.arm === 'candidate').slice(0, 2),
].filter(Boolean);
for (const row of replayRows) replay(row);
console.log('RECOMPUTE deterministic_replays=' + replayRows.length);

if (differences.length) {
  for (const difference of differences) console.log('DIFF ' + difference);
  process.exitCode = 1;
} else {
  console.log('MATCH item3 item4 item9');
}
