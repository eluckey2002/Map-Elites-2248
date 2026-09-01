const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers,
  checkBombs, findGreedyChains,
} = require('../engine');
const { chooseMove, chooseBaseMove, DEFAULT_PARAMS } = require('../bot');
const {
  chooseTargetAwareMove, immediateWinningUntrimmed,
} = require('../target-aware-challenger');

const LOOKAHEAD_BASE = 987654321;
const key = (chain) => chain && chain.map(({ x, y }) => `${x},${y}`).join('|');

function play(level, seed, chooser) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const moves = [];
  for (let moveIndex = 0; moveIndex < level.moves; moveIndex++) {
    const chain = chooser(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) break;
    moves.push(key(chain));
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state) || state.score >= state.targetScore) break;
  }
  return { state, moves };
}

test('target-aware challenger is identical before an untrimmed route can win now', () => {
  const level = LEVELS.find(({ level: number }) => number === 51);
  const champion = play(level, 1, chooseBaseMove);
  const challenger = play(level, 1, chooseTargetAwareMove);
  assert.deepEqual(challenger.moves.slice(0, 12), champion.moves.slice(0, 12));
});

test('target-aware challenger cashes out the Level 51 teaching board on move 13', () => {
  const level = LEVELS.find(({ level: number }) => number === 51);
  const champion = play(level, 1, chooseBaseMove);
  const challenger = play(level, 1, chooseTargetAwareMove);
  assert.deepEqual({ moves: champion.state.moves, score: champion.state.score }, { moves: 17, score: 125952 });
  assert.deepEqual({ moves: challenger.state.moves, score: challenger.state.score }, { moves: 13, score: 130048 });
  assert.notEqual(challenger.moves[12], champion.moves[12]);
});

test('immediate winner selection uses the existing deterministic untrimmed order', () => {
  const level = LEVELS.find(({ level: number }) => number === 51);
  const rng = makeRng(1);
  const state = createLevelState(level, rng);
  for (let moveIndex = 0; moveIndex < 12; moveIndex++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  }
  const generated = findGreedyChains(state, {
    limit: DEFAULT_PARAMS.width,
    tieBreak: DEFAULT_PARAMS.tieBreak,
    pathWidth: DEFAULT_PARAMS.pathWidth,
    preferMergeableSum: false,
  });
  const expected = generated.find(({ points }) => state.score + points >= state.targetScore);
  assert.ok(expected);
  assert.equal(key(immediateWinningUntrimmed(state)), key(expected.chain));
});

test('target-aware challenger falls back after target and never mutates its input', () => {
  const level = LEVELS.find(({ level: number }) => number === 51);
  const state = createLevelState(level, makeRng(1));
  state.score = state.targetScore;
  const before = JSON.stringify(state);
  const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE) };
  assert.equal(key(chooseTargetAwareMove(state, options)), key(chooseMove(state, options)));
  assert.equal(JSON.stringify(state), before);
});

test('any bomb leaves the champion in full control', () => {
  const level = {
    level: 999, target: 1, tileScale: 1, moves: 4, minChain: 2, gridW: 3, gridH: 2,
    blockers: [{ type: 'bomb', x: 2, y: 0, timer: 4 }],
  };
  const state = createLevelState(level, makeRng(7));
  const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE) };
  assert.equal(key(chooseTargetAwareMove(state, options)), key(chooseMove(state, options)));
});

test('null/no-move behavior is preserved', () => {
  const state = {
    gridWidth: 2, gridHeight: 2, minChain: 3, tileScale: 1,
    score: 0, targetScore: 100, moves: 0, maxMoves: 2,
    grid: [
      [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 4 }],
      [{ x: 0, y: 1, value: 8 }, { x: 1, y: 1, value: 16 }],
    ],
  };
  assert.equal(chooseMove(state), null);
  assert.equal(chooseTargetAwareMove(state), null);
});

// The challenger must be built on the PLAIN chooser, never on the shipped one.
// Two things go wrong when it routes through chooseMove. It evaluates the same
// override twice per move, which is pure waste (~17%, RESULT-0020 P3). Worse,
// once that rule is promoted into the champion — which DECISION-0004 did — the
// experimental policy is built out of the thing it is supposed to be tested
// against, and the comparison stops meaning anything. A spy is used rather than
// a source grep so this checks the dependency, not the spelling.
test('the challenger never routes through the promoted champion', () => {
  const bot = require('../bot');
  const real = bot.chooseMove;
  let promotedCalls = 0;
  bot.chooseMove = (...args) => { promotedCalls++; return real(...args); };
  delete require.cache[require.resolve('../target-aware-challenger')];

  try {
    const fresh = require('../target-aware-challenger').chooseTargetAwareMove;
    const level = LEVELS.find(({ level: number }) => number === 51);
    const run = play(level, 1, fresh);
    assert.ok(run.moves.length > 0, 'the spy run must actually play moves');
    assert.equal(
      promotedCalls, 0,
      'target-aware-challenger called bot.chooseMove; it must call chooseBaseMove',
    );
  } finally {
    bot.chooseMove = real;
    delete require.cache[require.resolve('../target-aware-challenger')];
  }
});
