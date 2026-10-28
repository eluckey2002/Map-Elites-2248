const {test} = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine');
const {playRandomGame, makeRng} = require('./players');

const W = E.FIXED.width;
const H = E.FIXED.height;

// Builds a state from rows of numbers; 'S' is stone. Missing rows are filled
// with distinct large values so they never interfere.
function stateFrom(rows, overrides) {
  const base = E.newGame(overrides && overrides.settings, 1);
  const filler = (c, r) => 2 ** (12 + ((c + 2 * r) % 5)) * 3; // odd, never pairs with test tiles
  const board = [];
  for (let r = 0; r < H; r++) {
    const row = rows[r] || [];
    board.push(Array.from({length: W}, (_, c) => {
      const v = row[c];
      if (v === 'S') return {stone: true};
      if (v === undefined || v === 0) return {v: filler(c, r) + c * 1000 + r, risk: false};
      return {v, risk: false};
    }));
  }
  return {...base, ...(overrides || {}), settings: base.settings, board};
}

test('settings: defaults, per-trigger amounts, and bad values refused', () => {
  const d = E.normalizeSettings();
  assert.deepEqual(d, {version: 1, poolSize: 5, poolStart: 2, fallOdds: 'halving', slideTrigger: 'tile', slideAmount: 8, pacing: 'steady'});
  assert.equal(E.normalizeSettings({slideTrigger: 'score'}).slideAmount, 1000);
  assert.equal(E.normalizeSettings({slideTrigger: 'score', poolStart: 4}).slideAmount, 2000);
  assert.equal(E.normalizeSettings({slideTrigger: 'score', poolStart: 8}).slideAmount, 4000);
  assert.equal(E.normalizeSettings({slideTrigger: 'moves'}).slideAmount, 15);
  assert.throws(() => E.normalizeSettings({poolSize: 3}), /poolSize/);
  assert.throws(() => E.normalizeSettings({poolStart: 16}), /poolStart/);
  assert.throws(() => E.normalizeSettings({fallOdds: 'odd'}), /fallOdds/);
  assert.throws(() => E.normalizeSettings({pacing: 'fast'}), /pacing/);
  assert.throws(() => E.normalizeSettings({slideAmount: 7}), /tile made/);
  assert.throws(() => E.normalizeSettings({slideTrigger: 'moves', slideAmount: 1}), /moves/);
  assert.throws(() => E.normalizeSettings({boardSize: 6}), /Unknown setting/);
  assert.throws(() => E.normalizeSettings({version: 2}), /version/);
});

test('pool: halving odds match the plan, and 100,000 draws land within 1 point', () => {
  const odds = E.fallOdds(E.normalizeSettings({fallOdds: 'halving'}));
  assert.deepEqual(odds.map(x => Math.round(x * 100)), [52, 26, 13, 6, 3]);
  const pct = f => E.fallOdds(E.normalizeSettings({fallOdds: f})).map(x => Math.round(x * 100));
  assert.deepEqual(pct('gentle'), [33, 27, 20, 13, 7]);
  assert.deepEqual(pct('soft'), [33, 25, 18, 14, 10]);
  assert.deepEqual(pct('equal'), [20, 20, 20, 20, 20]);
  for (const settings of [{fallOdds: 'halving'}, {fallOdds: 'gentle', poolSize: 6}, {fallOdds: 'soft'}, {fallOdds: 'equal', poolSize: 7, poolStart: 4}]) {
    const state = E.newGame(settings, 7);
    const want = E.fallOdds(state.settings);
    const pool = E.poolValues(state);
    const counts = new Map(pool.map(v => [v, 0]));
    const N = 100000;
    for (let i = 0; i < N; i++) {
      const v = E.pickValue(state, E.dropRoll(99, i % W, Math.floor(i / W)));
      assert.ok(counts.has(v), `value ${v} outside the pool`);
      counts.set(v, counts.get(v) + 1);
    }
    pool.forEach((v, i) => assert.ok(Math.abs(counts.get(v) / N - want[i]) < 0.01, `share of ${v}`));
  }
});

test('pool: no dropped tile ever comes from outside the current pool', () => {
  for (let g = 0; g < 20; g++) {
    playRandomGame({poolSize: 4 + (g % 4)}, 500 + g, {
      onMove(before, after, events) {
        const pool = E.poolValues(after);
        for (const [, , v] of events.dropped) assert.ok(pool.includes(v), `dropped ${v} not in ${pool}`);
      },
    });
  }
});

test('slides: tile trigger fires at exactly 8x the pool top, once per move', () => {
  const s = stateFrom([[128, 128]]);
  assert.equal(E.tileNeeded(s), 256);
  const out = E.applyMove(s, [[0, 0], [1, 0]]);
  assert.equal(out.state.slides, 1);
  assert.deepEqual(out.events.slid, {stopped: 2, started: 64});
  assert.equal(out.state.poolBottom, 4);
  assert.equal(E.tileNeeded(out.state), 512);
  const below = E.applyMove(stateFrom([[64, 64]]), [[0, 0], [1, 0]]);
  assert.equal(below.state.slides, 0, '128 is short of 256');
});

test('slides: score and moves triggers fire at their threshold and never twice in one move', () => {
  const settings = E.normalizeSettings({slideTrigger: 'score'});
  const s = stateFrom([[512, 512, 1024, 2048]], {settings});
  s.settings = settings;
  s.slideGoal = E.firstSlideGoal(settings);
  s.score = 0;
  // 512+512+1024+2048 = 4096 x1.5 = 6144 points: past 1,000 and 3,000, but one slide.
  const out = E.applyMove(s, [[0, 0], [1, 0], [2, 0], [3, 0]]);
  assert.equal(out.state.slides, 1);
  assert.equal(out.state.slideGoal.at, 3000);
  const ms = E.normalizeSettings({slideTrigger: 'moves'});
  let m = stateFrom([[8, 8], [16, 16], [32, 32]]);
  m.settings = ms;
  m.slideGoal = E.firstSlideGoal(ms);
  m.moves = 13;
  m = E.applyMove(m, [[0, 0], [1, 0]]).state;
  assert.equal(m.slides, 0, 'move 14');
  m.board[1][0] = {v: 16, risk: false};
  m.board[1][1] = {v: 16, risk: false};
  m = E.applyMove(m, [[0, 1], [1, 1]]).state;
  assert.equal(m.slides, 1, 'move 15');
  assert.equal(m.slideGoal.at, 30);
});

test('slides: each pacing makes the gaps in the plan table', () => {
  const goals = (opts, n) => {
    const st = E.normalizeSettings(opts);
    let g = E.firstSlideGoal(st);
    const ats = [g.at];
    for (let i = 1; i < n; i++) { g = E.nextSlideGoal(st, g); ats.push(g.at); }
    return ats;
  };
  assert.deepEqual(goals({slideTrigger: 'score'}, 3), [1000, 3000, 7000]);
  assert.deepEqual(goals({slideTrigger: 'score', pacing: 'speeds-up'}, 3), [1000, 2500, 4750]);
  assert.deepEqual(goals({slideTrigger: 'score', pacing: 'slows-down'}, 3), [1000, 4000, 13000]);
  assert.deepEqual(goals({slideTrigger: 'moves'}, 3), [15, 30, 45]);
  assert.deepEqual(goals({slideTrigger: 'moves', pacing: 'speeds-up'}, 7), [15, 28, 39, 48, 55, 60, 65]);
  assert.deepEqual(goals({slideTrigger: 'moves', pacing: 'slows-down'}, 3), [15, 32, 51]);
  assert.deepEqual(goals({slideTrigger: 'moves', slideAmount: 3}, 3), [3, 6, 9], 'steady keeps a short gap');
  assert.deepEqual(goals({slideTrigger: 'moves', slideAmount: 4, pacing: 'speeds-up'}, 3), [4, 8, 12], 'speeding up never lengthens a short gap');
  const mults = pacing => [0, 1, 2, 3, 4, 5, 6].map(k => E.tileMultiplier(E.normalizeSettings({pacing}), k));
  assert.deepEqual(mults('steady'), [8, 8, 8, 8, 8, 8, 8]);
  assert.deepEqual(mults('speeds-up'), [8, 8, 4, 4, 2, 2, 2]);
  assert.deepEqual(mults('slows-down'), [8, 8, 16, 16, 32, 32, 32]);
});

test('stranded: after a slide, small tiles are warned and no new tile of that value falls', () => {
  // A lone 2 far from any other 2, then a slide.
  const s = stateFrom([[128, 128], [], [], [], [], [], [0, 0, 0, 0, 2]]);
  const out = E.applyMove(s, [[0, 0], [1, 0]]);
  assert.equal(out.state.poolBottom, 4);
  assert.ok(out.events.dropped.every(([, , v]) => v >= 4));
  const two = out.state.board[6][4];
  assert.equal(two.v, 2);
  assert.equal(two.risk, true, 'warned first, not stone yet');
  assert.deepEqual(out.events.warned, [[4, 6]]);
});

// The stone-rule cases from the plan. Pool bottom is set above the test tile.
function verdictAfterTwoChecks(rows, c, r, bottom) {
  const s = stateFrom(rows);
  s.poolBottom = bottom;
  const board = s.board.map(row => row.map(cell => cell && {...cell}));
  E.checkStranded(s, board);
  E.checkStranded(s, board);
  return board[r][c].stone ? 'stone' : 'tile';
}

test('stone rule: a lone stranded 2 turns to stone', () => {
  assert.equal(verdictAfterTwoChecks([[], [], [0, 0, 2]], 2, 2, 4), 'stone');
});

test('stone rule: a stranded 4 with another 4 in the next column stays a tile', () => {
  assert.equal(verdictAfterTwoChecks([[], [0, 0, 4], [], [], [0, 0, 0, 4]], 2, 1, 8), 'tile');
});

test('stone rule: a stranded 4 whose only match is two columns away turns to stone', () => {
  assert.equal(verdictAfterTwoChecks([[], [0, 4, 0, 4]], 1, 1, 8), 'stone');
});

test('stone rule: a stranded 4 whose match is behind a stone turns to stone', () => {
  assert.equal(verdictAfterTwoChecks([[0, 4], [0, 'S'], [0, 4]], 1, 0, 8), 'stone');
});

test('stone rule: a stranded 4 with two 2s beside it stays a tile', () => {
  assert.equal(verdictAfterTwoChecks([[2, 4, 2]], 1, 0, 8), 'tile');
  assert.equal(verdictAfterTwoChecks([[2, 4]], 1, 0, 8), 'stone', 'one half is not enough');
});

test('stone rule: a match held above a stone counts only if it can fall within reach', () => {
  // The test 4 sits in column 1 above a stone at row 3, so it can only fall to row 2.
  assert.equal(verdictAfterTwoChecks([[0, 4], [], [], [4, 'S']], 1, 0, 8), 'tile', 'a 4 at row 3 next door can meet it at row 2');
  assert.equal(verdictAfterTwoChecks([[0, 4], [], [], [0, 'S'], [4]], 1, 0, 8), 'stone', 'a 4 at row 4 next door is two rows too low');
});

test('stone rule: a warned tile that can merge again loses its warning', () => {
  const s = stateFrom([[], [0, 0, 4]]);
  s.poolBottom = 8;
  const board = s.board.map(row => row.map(cell => cell && {...cell}));
  E.checkStranded(s, board);
  assert.equal(board[1][2].risk, true);
  board[1][3] = {v: 4, risk: false};
  E.checkStranded(s, board);
  assert.equal(board[1][2].risk, false);
  assert.ok(!board[1][2].stone);
});

test('random play: values stay whole, stone never turns back, and the game ends exactly when no chain is left', () => {
  for (let g = 0; g < 30; g++) {
    const settings = {poolSize: 4 + (g % 4), slideTrigger: ['tile', 'score', 'moves'][g % 3], pacing: ['steady', 'speeds-up', 'slows-down'][(g >> 1) % 3]};
    const end = playRandomGame(settings, 900 + g, {
      onMove(before, after) {
        for (let r = 0; r < H; r++) {
          for (let c = 0; c < W; c++) {
            const cell = after.board[r][c];
            assert.ok(cell, 'board stays full');
            if (!cell.stone) assert.ok(Number.isSafeInteger(cell.v) && cell.v >= 2);
            if (before.board[r][c].stone) assert.ok(cell.stone, 'stone turned back');
          }
        }
        assert.ok(after.stones >= before.stones);
        assert.equal(after.over, !E.hasLegalChain(after));
        assert.equal(after.over, E.listChains(after, {limit: 1}).length === 0);
      },
    });
    assert.ok(end.state.over, `game ${g} did not end`);
  }
});

test('legal chains: the walk matches a brute-force check', () => {
  const rng = makeRng(3);
  for (let t = 0; t < 40; t++) {
    const rows = Array.from({length: H}, () => Array.from({length: W}, () => (rng() < 0.08 ? 'S' : 2 ** (1 + Math.floor(rng() * 3)))));
    const s = stateFrom(rows);
    const L = 5;
    const walk = new Set(E.listChains(s, {maxLength: L}).map(ch => JSON.stringify(ch)));
    const brute = new Set();
    let frontier = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (!s.board[r][c].stone) frontier.push([[c, r]]);
    for (let len = 2; len <= L; len++) {
      const next = [];
      for (const path of frontier) {
        for (let r = 0; r < H; r++) {
          for (let c = 0; c < W; c++) {
            const cand = path.concat([[c, r]]);
            if (E.chainError(s, cand) === null) { next.push(cand); brute.add(JSON.stringify(cand)); }
          }
        }
      }
      frontier = next;
    }
    assert.deepEqual([...walk].sort(), [...brute].sort());
  }
});

test('undo restores everything exactly, and the same move then gives the same tiles', () => {
  const session = E.createSession({}, 4242);
  const first = E.listChains(session.state, {limit: 1})[0];
  session.move(first);
  const before = JSON.stringify(session.state);
  const chain = E.listChains(session.state, {limit: 1})[0];
  session.move(chain);
  const afterFp = E.fingerprint(session.state);
  assert.equal(session.undo(), true);
  assert.equal(JSON.stringify(session.state), before);
  assert.equal(session.undo(), false, 'one step only');
  session.move(chain);
  assert.equal(E.fingerprint(session.state), afterFp);
});

test('replay: 50 random games with undos replay to the identical board and score', () => {
  for (let g = 0; g < 50; g++) {
    const settings = {
      poolSize: 4 + (g % 4), poolStart: [2, 4, 8][g % 3], fallOdds: ['halving', 'soft', 'gentle', 'equal'][g % 4],
      slideTrigger: ['tile', 'score', 'moves'][(g >> 1) % 3], pacing: ['steady', 'speeds-up', 'slows-down'][(g >> 2) % 3],
    };
    const {session} = playRandomGame(settings, 10000 + g, {undoEvery: 7});
    const record = JSON.parse(JSON.stringify(session.finish('no-chains', '2026-10-28T00:00:00Z')));
    const back = E.replay(record);
    assert.ok(back.ok, back.problems.join('; '));
    assert.equal(E.fingerprint(back.state), E.fingerprint(session.state));
    assert.equal(back.state.score, record.result.score);
  }
});

test('a snapshot saved at game end replays, and undo still works after it', () => {
  const {session} = playRandomGame({}, 88, {});
  const snap = session.snapshot('no-chains', 'x');
  assert.ok(E.replay(snap).ok);
  assert.equal(session.record.result, null);
  assert.equal(session.undo(), true);
  const chain = E.listChains(session.state, {limit: 1})[0];
  session.move(chain);
  assert.ok(E.replay(session.snapshot('no-chains', 'y')).ok);
});

test('replay refuses a tampered record', () => {
  const {session} = playRandomGame({}, 77, {});
  const record = JSON.parse(JSON.stringify(session.finish('no-chains', 'x')));
  record.result.finalFingerprint = '00000000';
  assert.equal(E.replay(record).ok, false);
  record.engine = 'other';
  assert.throws(() => E.replay(record), /engine/);
});

test('bot views: fair hides the seed and needs its own randomness; future-seeing is labelled', () => {
  const state = E.newGame({}, 31337);
  const fair = E.botView(state);
  assert.equal(fair.mode, 'fair');
  assert.equal('seed' in fair.state, false);
  assert.ok(!JSON.stringify(fair.state).includes('31337'));
  const chain = fair.legalChains({limit: 1})[0];
  assert.throws(() => fair.simulate(fair.state, chain), /own random/);
  const sim = fair.simulate(fair.state, chain, makeRng(1));
  assert.equal('seed' in sim.state, false);
  const future = E.botView(state, 'future-seeing');
  assert.match(future.label, /MEASURING ONLY/);
  const real = E.applyMove(state, chain);
  assert.equal(E.fingerprint(future.simulate(future.state, chain).state), E.fingerprint(real.state));
  assert.equal(future.peekRoll(0, 7), E.dropRoll(31337, 0, 7));
  assert.throws(() => E.botView(state, 'cheat'), /mode/);
});

test('same result everywhere: a fixed game has a frozen fingerprint', () => {
  // Integer-only random numbers and exact sums. If this changes, saved games
  // from the phone no longer replay; bump ENGINE_VERSION instead.
  const {session} = playRandomGame({fallOdds: 'halving'}, 2248, {});
  assert.equal(E.fingerprint(session.state), GOLDEN.fp);
  assert.equal(session.state.score, GOLDEN.score);
});

const GOLDEN = require('./golden.json');

test('best tile counts a bigger value that starts falling after a climb', () => {
  const settings = E.normalizeSettings({slideTrigger: 'moves', slideAmount: 3, fallOdds: 'equal'});
  let st = E.newGame(settings, 26);
  for (let i = 0; i < 6 && !st.over; i++) {
    st = E.applyMove(st, E.listChains(st, {limit: 1})[0]).state;
    let max = 0;
    for (const row of st.board) for (const c of row) if (!c.stone) max = Math.max(max, c.v);
    assert.ok(st.bestTile >= max, `move ${i + 1}: bestTile ${st.bestTile} < ${max}`);
  }
});

test('the engine does not touch the input state', () => {
  const s = E.newGame({}, 5);
  const saved = JSON.stringify(s);
  E.applyMove(s, E.listChains(s, {limit: 1})[0]);
  assert.equal(JSON.stringify(s), saved);
});
