'use strict';

// Independent arithmetic re-implementation. Only Node builtins are imported;
// no producer runner, game loop, statistics, resolver or candidate chooser.
// This is the same author's check, not independent scientific verification.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const mismatches = [];
function compare(label, actual, expected) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-11 * Math.max(1, Math.abs(actual), Math.abs(expected))) mismatches.push({ label, actual, expected });
  } else if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) mismatches.push({ label, actualLength: actual.length, expectedLength: expected.length });
    else actual.forEach((x, i) => compare(`${label}[${i}]`, x, expected[i]));
  } else if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    for (const k of keys) compare(`${label}.${k}`, actual[k], expected[k]);
  } else if (actual !== expected) mismatches.push({ label, actual, expected });
}
function average(values) { return values.reduce((s, v) => s + v, 0) / values.length; }
function varSample(values) {
  if (values.length < 2) return null;
  const a = average(values);
  return values.reduce((s, v) => s + (v - a) * (v - a), 0) / (values.length - 1);
}
function axis(values, levelCount, seedCount) {
  if (values.length !== levelCount * seedCount) throw new Error('recompute: incomplete grid');
  const kept = values.filter(v => v !== null);
  if (!kept.length) return { mean: null, se: null, seLevel: null, seSeed: null, ci95: [null, null], n: 0 };
  const lv = [], sv = [];
  for (let l = 0; l < levelCount; l++) {
    const row = values.slice(l * seedCount, (l + 1) * seedCount).filter(v => v !== null);
    if (row.length) lv.push(average(row));
  }
  for (let s = 0; s < seedCount; s++) {
    const col = [];
    for (let l = 0; l < levelCount; l++) if (values[l * seedCount + s] !== null) col.push(values[l * seedCount + s]);
    if (col.length) sv.push(average(col));
  }
  const seLevel = lv.length < 2 ? null : Math.sqrt(varSample(lv) / lv.length);
  const seSeed = sv.length < 2 ? null : Math.sqrt(varSample(sv) / sv.length);
  const se = seLevel === null || seSeed === null ? null : Math.max(seLevel, seSeed);
  const mean = average(kept);
  return { mean, se, seLevel, seSeed, ci95: se === null ? [null, null] : [mean - 1.96 * se, mean + 1.96 * se], n: kept.length };
}

function pairedSummary(candidate, reference) {
  if (candidate.games.length !== 580 || reference.games.length !== 580) throw new Error('recompute: panel not 580 games');
  const w = [], m = [];
  let winsGained = 0, winsLost = 0, bothWin = 0, bothLose = 0;
  let candidateFaster = 0, championFaster = 0, sameSpeed = 0, referenceMoves = 0;
  for (let i = 0; i < 580; i++) {
    const c = candidate.games[i], b = reference.games[i];
    if (c.level !== b.level || c.seed !== b.seed || c.level !== Math.floor(i / 10) + 1 || c.seed !== reference.seeds[i % 10]) throw new Error('recompute: unpaired or unordered grid');
    if (typeof c.outcome.win !== 'boolean' || typeof b.outcome.win !== 'boolean') throw new Error('recompute: invalid outcome');
    for (const game of [c, b]) if (game.outcome.win && (!Number.isInteger(game.outcome.movesToTarget) || game.outcome.movesToTarget < 1)) throw new Error('recompute: invalid winning move count');
    const change = Number(c.outcome.win) - Number(b.outcome.win);
    w.push(change); winsGained += change > 0; winsLost += change < 0;
    if (c.outcome.win && b.outcome.win) {
      bothWin++;
      const saved = b.outcome.movesToTarget - c.outcome.movesToTarget;
      m.push(saved); referenceMoves += b.outcome.movesToTarget;
      candidateFaster += saved > 0; championFaster += saved < 0; sameSpeed += saved === 0;
    } else { m.push(null); bothLose += !c.outcome.win && !b.outcome.win; }
  }
  const wins = axis(w, 58, 10), moves = axis(m, 58, 10);
  return { cells: 580, winsGained, winsLost, netWins: winsGained - winsLost, bothWin, bothLose,
    candidateFaster, championFaster, sameSpeed, winRateDifference: wins.mean, winSe: wins.se,
    winSeLevel: wins.seLevel, winSeSeed: wins.seSeed, winCi95: wins.ci95,
    meanMovesSaved: moves.mean, moveSe: moves.se, moveSeLevel: moves.seLevel, moveSeSeed: moves.seSeed,
    moveCi95: moves.ci95, mutualWins: moves.n, relativeMovesPct: bothWin ? 100 * moves.mean / (referenceMoves / bothWin) : null };
}

function gameAccounting(raw) {
  const counts = { controls: 0, proposals: 0, jointSearch: 0, confirmation: 0, replays: raw.config.historicalReplayGames, buffer: 0 };
  const seen = new Set();
  for (const p of raw.panels) {
    const key = `${p.block}/${p.arm}`;
    if (seen.has(key)) throw new Error(`recompute: duplicate control panel ${key}`);
    seen.add(key);
    if (/^C(?:[1-9]|1[0-2])$/.test(p.block)) {
      if (!['champion', 'zero', 'handicap10', 'handicap5'].includes(p.arm)) throw new Error(`recompute: unknown control arm ${key}`);
      counts.controls += p.games.length;
    } else if (p.block === 'G' && p.arm === 'champion') counts.proposals += p.games.length;
    else if (p.block === 'G' && p.arm.startsWith('parity-')) {
      if (p.games.some(g => !g.parityOutcome)) throw new Error(`recompute: missing counted parity replay ${key}`);
      counts.replays += 2 * p.games.length;
    } else throw new Error(`recompute: unexpected controls artifact panel ${key}`);
  }
  return counts;
}

function assertParityCells(panel, gateStart) {
  const expected = new Set();
  for (let n = 0; n < 200; n++) expected.add(`${1 + n % 58}/${gateStart + Math.trunc(n / 58)}`);
  if (panel.block !== 'G' || panel.games.length !== 200) throw new Error('recompute: incomplete parity selection');
  for (const game of panel.games) {
    if (!expected.delete(`${game.level}/${game.seed}`)) throw new Error('recompute: repeated or undeclared parity cell');
  }
  if (expected.size) throw new Error('recompute: missing declared parity cells');
}

function main() {
  const prior = read('experiments/RESULT-0049/corpus.json');
  const cross = read('experiments/RESULT-0058/raw-games.json');
  const noise = read('solver/policy-lab/runs/noise.json');
  const panel = cross.panels.find(p => p.tag === 'positive3000' && p.arm === 'candidate');
  const keyed = new Map(cross.games.filter(g => g.stage === 'positive3000').map(g => [`${g.arm}/${g.level}/${g.seed}`, g.outcome]));
  for (const row of noise.perLevel) {
    const values = prior.cells.filter(c => c.level === row.level && c.base.win && c.champion.win).map(c => c.base.movesToTarget - c.champion.movesToTarget);
    compare(`noise ${row.level} n`, values.length, row.mutualWins);
    compare(`noise ${row.level} mean`, average(values), row.mean);
    compare(`noise ${row.level} variance`, varSample(values), row.pairedVariance);
    const xs = !panel.levels.includes(row.level) ? [] : panel.seeds.flatMap(seed => {
      const c = keyed.get(`candidate/${row.level}/${seed}`), b = keyed.get(`reference/${row.level}/${seed}`) || keyed.get(`champion/${row.level}/${seed}`);
      return c.win && b.win ? [b.movesToTarget - c.movesToTarget] : [];
    });
    compare(`cross ${row.level} n`, xs.length, row.crossCheckMutualWins);
    compare(`cross ${row.level} variance`, varSample(xs), row.crossCheckVariance);
  }
  for (const design of noise.designs) {
    const values = prior.cells.filter(c => prior.panel.seeds.indexOf(c.seed) < design.seeds).map(c => c.base.win && c.champion.win ? c.base.movesToTarget - c.champion.movesToTarget : null);
    const a = axis(values, 58, design.seeds);
    for (const field of ['mean', 'se', 'seLevel', 'seSeed', 'ci95', 'n']) compare(`noise 58x${design.seeds} ${field}`, a[field], design[field]);
    compare(`noise 58x${design.seeds} MDE`, 2.8 * a.se, design.smallestDetectableGain80);
    compare(`noise 58x${design.seeds} margin`, 1.96 * a.se, design.halfWidth95);
  }
  console.log('HISTORICAL NOISE', mismatches.length ? 'DIFF' : 'MATCH');

  const generation = read('solver/policy-lab/runs/generation.json');
  const benchmark = read('solver/policy-lab/runs/human-benchmark.json');
  for (const session of generation.sessions) {
    const short = path.basename(session.file).slice(0, 8);
    const paired = benchmark.rows.find(r => r.file === short && r.level === session.level && r.seed === session.seed);
    if (!paired) throw new Error(`recompute: missing recorded pair ${session.file}`);
    compare(`owner faster ${session.file}`, paired.human.outcome === 'win' && paired.bot.outcome === 'win' && paired.human.moves < paired.bot.moves, session.ownerFaster);
  }
  function subset(rows) {
    const categories = {};
    for (const r of rows) categories[r.category] = (categories[r.category] || 0) + 1;
    return { n: rows.length, categories, ownerMoreThanPoolBest: rows.filter(r => r.ownerPoints > r.poolBestPoints).length,
      ownerMoreThanBotChoice: rows.filter(r => r.ownerPoints > r.botChoicePoints).length,
      points: rows.map(({ file, level, move, ownerPoints, poolBestPoints, botChoicePoints }) => ({ file, level, move, ownerPoints, poolBestPoints, botChoicePoints })) };
  }
  const ds = generation.moves.filter(r => r.ownerFaster && r.ownerPoints > r.botChoicePoints);
  compare('overall', subset(generation.moves), generation.overall);
  compare('late', subset(generation.moves.filter(r => r.level >= 56 && r.level <= 58)), generation.late);
  compare('diagnostic', subset(ds), generation.diagnostic);
  const branch = ds.length < 30 ? 'INCONCLUSIVE_SUBSET_SMALL' : ds.filter(r => r.ownerPoints > r.poolBestPoints).length * 2 >= ds.length ? 'GENERATION' : 'RANKING_FIRST';
  compare('generation branch', branch, generation.branch);
  console.log('GENERATION COUNTS AND BRANCH', mismatches.length ? 'DIFF' : 'MATCH');

  const file = path.join(__dirname, 'runs/controls-raw.json');
  if (fs.existsSync(file)) {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const planText = fs.readFileSync(path.join(ROOT, 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md'), 'utf8');
    const planConfig = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(planText)[1]);
    compare('retained configuration against plan', raw.config, planConfig);
    for (const [source, hash] of Object.entries(planConfig.harnessFreeze)) compare(`source freeze ${source}`, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, source))).digest('hex'), hash);
    const counted = gameAccounting(raw);
    console.log('RETAINED GAME ACCOUNTING', JSON.stringify(counted));
    console.log('CHARGED GAME ACCOUNTING', JSON.stringify(raw.counts));
    console.log('UNRETAINED DISPATCH ALLOWANCE', Object.values(raw.counts).reduce((a, b) => a + b, 0) - Object.values(counted).reduce((a, b) => a + b, 0));
    const rows = [];
    for (const reported of raw.headlines.controls || []) {
      const panels = raw.panels.filter(p => p.block === reported.block);
      const reference = panels.find(p => p.arm === 'champion');
      const row = { block: reported.block,
        zero: pairedSummary(panels.find(p => p.arm === 'zero'), reference),
        mild: pairedSummary(panels.find(p => p.arm === 'handicap10'), reference),
        strong: pairedSummary(panels.find(p => p.arm === 'handicap5'), reference) };
      compare(`control ${row.block}`, row, reported); rows.push(row);
    }
    for (const parity of raw.parity) {
      const p = raw.panels.find(p => p.arm === `parity-${parity.policy}${parity.policy === 'champion' ? '-replays' : ''}`);
      assertParityCells(p, planConfig.blocks.G.start);
      compare(`parity ${parity.policy}`, p.games.filter(g => g.outcome.traceIdentity === g.parityOutcome.traceIdentity).length, parity.identical);
      compare(`parity ${parity.policy} total`, p.games.length, parity.total);
    }
    if (raw.headlines.bars) {
      const b = raw.headlines.bars;
      compare('completed control block count', rows.length, 12);
      compare('completed control block identities', rows.map(r => r.block), Array.from({ length: 12 }, (_, i) => `C${i + 1}`));
      const zeroAccepted = rows.filter(r => r.zero.netWins >= 0 && r.zero.meanMovesSaved > 0 && r.zero.moveCi95[0] > 0).length;
      const strongDetected = rows.filter(r => r.strong.moveCi95[1] < 0).length;
      compare('zero ACCEPTED', zeroAccepted, b.zeroAccepted);
      compare('strong detected', strongDetected, b.strongDetected);
      compare('mild detected', rows.filter(r => r.mild.moveCi95[1] < 0).length, b.mildDetected);
      compare('closure path', zeroAccepted > 1 || strongDetected / 12 < 0.8 ? 'C' : 'CONTROLS_PASSED', raw.headlines.path);
      const zeroMde = Math.max(...rows.map(r => 2.8 * r.zero.moveSe));
      compare('zero MDE', zeroMde, b.zeroMde);
      compare('per-block zero MDE', rows.map(r => ({ block: r.block, se: r.zero.moveSe, smallestDetectableGain80: 2.8 * r.zero.moveSe })), b.zeroMdes);
      compare('historical MDE', noise.designs[0].smallestDetectableGain80, b.historicalMde);
      compare('reported MDE', Math.max(noise.designs[0].smallestDetectableGain80, zeroMde), b.reportedDetectableGain);
      compare('game accounting', counted, raw.counts);
      console.log('GAME ACCOUNTING', JSON.stringify(counted));
    }
    const gateReference = raw.panels.find(p => p.block === 'G' && p.arm === 'champion');
    if (gateReference) {
      const positions = gateReference.games.reduce((s, g) => s + g.outcome.movesUsed + Number(g.outcome.reason === 'no_valid_moves'), 0);
      compare('inert total from reference move counts', positions, raw.inert.total);
      compare('inert identical against required exact parity', positions, raw.inert.identical);
    }
    console.log('CONTROL ARITHMETIC', rows.length ? (mismatches.length ? 'DIFF' : 'MATCH') : 'UNVERIFIED_NOT_RUN', 'completed blocks', rows.length);
    if (rows.length < 12) console.log('remaining control blocks UNVERIFIED_NOT_RUN');
    const closureFile = path.join(ROOT, 'experiments/RESULT-0080/closure.json');
    if (fs.existsSync(closureFile)) {
      const closure = JSON.parse(fs.readFileSync(closureFile, 'utf8'));
      compare('closure retained accounting', counted, closure.retainedAccounting);
      compare('closure charged accounting', raw.counts, closure.chargedAccounting);
      compare('closure completed controls', rows.length, closure.completeControlBlocks);
      compare('closure parity', raw.parity, closure.parity);
      compare('closure inert', raw.inert, closure.inert);
      compare('closure no exhaustion', Object.entries(raw.counts).some(([k, v]) => v >= planConfig.budgets[k]) || Object.values(raw.counts).reduce((a, b) => a + b, 0) >= 120000, closure.effortBoundExhausted);
      compare('closure raw SHA256', crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), closure.rawSha256);
      console.log('INTERRUPTION RECEIPT', mismatches.length ? 'DIFF' : 'MATCH');
    }
  } else console.log('CONTROLS UNVERIFIED_NOT_RUN');
  console.log('This is independent arithmetic re-implementation by the same agent, not independent verification; checked_by remains unset.');
  if (mismatches.length) { console.log(JSON.stringify(mismatches, null, 2)); process.exitCode = 1; }
}
if (require.main === module) main();
module.exports = { axis, pairedSummary, gameAccounting, assertParityCells };
