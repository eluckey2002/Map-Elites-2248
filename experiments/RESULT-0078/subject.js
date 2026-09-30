const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs } = require('../../solver/engine');
const { chooseMove } = require('../../solver/bot');
const { chooseBombLatticeMove } = require('../../solver/bomb-lattice-challenger');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0078';
const SEEDS = Object.freeze(Array.from({ length: 20 }, (_, index) => 47_000_000 + index));
const LEVEL_NUMBERS = Object.freeze(LEVELS.map(({ level }) => level));
const LOOKAHEAD_BASE = 987654321;
const SOURCE_FILES = Object.freeze([
  'solver/bot.js', 'solver/engine.js', 'src/game.js', 'solver/bomb-lattice-challenger.js',
  'solver/experiment-guard.js', 'tools/persist-before-verdict.js',
  'experiments/RESULT-0078/subject.js', 'experiments/RESULT-0078/run.js', 'experiments/RESULT-0078/recompute.js',
  'experiments/RESULT-0078/close.js',
]);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function identity(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex'); }
function sourceHashes() { return Object.fromEntries(SOURCE_FILES.map((file) => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')])); }
function subjectIdentity(sources = sourceHashes()) { return identity(sources); }
function moveKey(chain) { return chain.map(({ x, y }) => `${x},${y}`).join('|'); }

function play(level, seed, chooser) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const trace = [];
  let reason = 'out_of_moves';
  for (let moveIndex = 0; moveIndex < level.moves; moveIndex += 1) {
    const chain = chooser(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) { reason = 'no_valid_moves'; break; }
    trace.push(moveKey(chain));
    executeChain(state, chain); applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
    if (checkBombs(state)) { reason = 'bomb'; break; }
    if (state.score >= state.targetScore) { reason = 'target'; break; }
    if (state.moves >= state.maxMoves) break;
  }
  return { win: reason === 'target', movesToTarget: reason === 'target' ? state.moves : null, movesUsed: state.moves, moveBudget: state.maxMoves, score: state.score, reason, traceIdentity: identity(trace) };
}
function timedPlay(level, seed, chooser) {
  const start = process.hrtime.bigint();
  return { ...play(level, seed, chooser), durationNs: Number(process.hrtime.bigint() - start) };
}
function evaluatePair(level, seed, { championChooser = chooseMove, challengerChooser = chooseBombLatticeMove } = {}) {
  const firstChampion = (level.level + seed) % 2 === 0;
  const champion = firstChampion ? timedPlay(level, seed, championChooser) : null;
  const challenger = firstChampion ? timedPlay(level, seed, challengerChooser) : timedPlay(level, seed, challengerChooser);
  return { level: level.level, seed, champion: champion || timedPlay(level, seed, championChooser), challenger };
}
function targetCost(outcome) { return outcome.win ? outcome.movesToTarget : outcome.moveBudget + 1; }
function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function se(values) { if (values.length < 2) return 0; const center = mean(values); return Math.sqrt(values.reduce((sum, value) => sum + ((value - center) ** 2), 0) / (values.length - 1)) / Math.sqrt(values.length); }
function moveEffect(cells, levels, seeds) {
  const values = cells.map(({ champion, challenger }) => targetCost(champion) - targetCost(challenger));
  const byLevel = levels.map((_, index) => mean(values.slice(index * seeds.length, (index + 1) * seeds.length)));
  const bySeed = seeds.map((_, seedIndex) => mean(levels.map((__, levelIndex) => values[(levelIndex * seeds.length) + seedIndex])));
  const standardError = Math.max(se(byLevel), se(bySeed));
  const estimate = mean(byLevel);
  return { estimand: 'champion target cost minus challenger target cost', estimate, se: standardError, confidence95: [estimate - 1.96 * standardError, estimate + 1.96 * standardError] };
}
function summarize(corpus) {
  const counts = { pairs: corpus.cells.length, championOnlyWin: 0, challengerOnlyWin: 0, championFaster: 0, challengerFaster: 0, sameSpeed: 0, changedTrace: 0 };
  const beneficial = new Set(); const regressing = new Set(); let championNs = 0; let challengerNs = 0;
  for (const cell of corpus.cells) {
    const { champion, challenger, level } = cell; championNs += champion.durationNs; challengerNs += challenger.durationNs;
    if (champion.traceIdentity !== challenger.traceIdentity) counts.changedTrace += 1;
    if (champion.win && challenger.win) {
      if (challenger.movesToTarget < champion.movesToTarget) { counts.challengerFaster += 1; beneficial.add(level); }
      else if (champion.movesToTarget < challenger.movesToTarget) { counts.championFaster += 1; regressing.add(level); }
      else counts.sameSpeed += 1;
    } else if (champion.win) { counts.championOnlyWin += 1; regressing.add(level); }
    else if (challenger.win) { counts.challengerOnlyWin += 1; beneficial.add(level); }
  }
  const effect = moveEffect(corpus.cells, corpus.panel.levelNumbers, corpus.panel.seeds);
  const safety = counts.championOnlyWin === 0 && counts.championFaster === 0;
  const signal = effect.estimate > 0 && beneficial.size >= 2;
  const compute = challengerNs / championNs <= 2;
  return { primaryOutcome: !safety ? 'FALSIFIED' : signal && compute ? 'SUPPORTED' : 'INCONCLUSIVE', counts, levelBreadth: { beneficial: [...beneficial].sort((a,b) => a-b), regressing: [...regressing].sort((a,b) => a-b) }, moveEffect: effect, compute: { championNs, challengerNs, ratio: challengerNs / championNs }, claims: { P1: { outcome: safety ? 'PASS' : 'FAIL' }, P2: { outcome: signal ? 'PASS' : 'FAIL' }, P3: { outcome: compute ? 'PASS' : 'FAIL' } } };
}
function buildCorpus(cells, registration, { levelNumbers = LEVEL_NUMBERS, seeds = SEEDS, qualification = false } = {}) {
  const sources = sourceHashes(); const body = { schemaVersion: 1, result: RESULT, kind: 'bomb-lattice-challenger', qualification, panel: { levelNumbers, seeds, order: 'level-major', arms: ['champion', 'challenger'], objective: 'target stop, fewest moves' }, sources, finalSubjectIdentity: subjectIdentity(sources), cells };
  return { ...body, artifactIdentity: identity(body), registration };
}
function validateCorpus(corpus, { levelNumbers = corpus.qualification ? corpus.panel.levelNumbers : LEVEL_NUMBERS, seeds = corpus.qualification ? corpus.panel.seeds : SEEDS, requireRegistration = true } = {}) {
  if (corpus.qualification !== true && corpus.qualification !== false) throw new Error('qualification flag missing');
  if (corpus.schemaVersion !== 1 || corpus.result !== RESULT || canonical(corpus.panel.levelNumbers) !== canonical(levelNumbers) || canonical(corpus.panel.seeds) !== canonical(seeds) || corpus.cells.length !== levelNumbers.length * seeds.length) throw new Error('corpus panel mismatch');
  let index = 0;
  for (const level of levelNumbers) for (const seed of seeds) {
    const cell = corpus.cells[index++]; if (!cell || cell.level !== level || cell.seed !== seed) throw new Error('pairing/order mismatch');
    for (const arm of ['champion', 'challenger']) { const outcome = cell[arm]; if (!outcome || outcome.win !== (outcome.reason === 'target') || outcome.win !== Number.isInteger(outcome.movesToTarget) || outcome.movesUsed > outcome.moveBudget || !Number.isFinite(outcome.durationNs)) throw new Error(`${arm} outcome mismatch`); }
    if (cell.champion.moveBudget !== cell.challenger.moveBudget) throw new Error('objective mismatch');
  }
  if (canonical(corpus.sources) !== canonical(sourceHashes()) || corpus.finalSubjectIdentity !== subjectIdentity() || identity((({ artifactIdentity, registration, ...body }) => body)(corpus)) !== corpus.artifactIdentity) throw new Error('identity mismatch');
  if (requireRegistration && (corpus.registration?.exploratory !== false || corpus.registration?.protocol !== RESULT || !/^[0-9a-f]{40}$/.test(corpus.registration?.protocolCommit || ''))) throw new Error('registration stamp missing');
  return { pairs: corpus.cells.length, finalSubjectIdentity: corpus.finalSubjectIdentity };
}

module.exports = { ROOT, RESULT, SEEDS, LEVEL_NUMBERS, SOURCE_FILES, canonical, identity, sourceHashes, subjectIdentity, play, evaluatePair, targetCost, summarize, buildCorpus, validateCorpus };
