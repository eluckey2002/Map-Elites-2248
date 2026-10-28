// Climb engine: the rules only, no screen code. The phone page and any bot
// share this file. Every function returns new data and never changes its
// input, so a bot can try moves freely.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ClimbEngine = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const ENGINE_VERSION = 'climb-engine-1';
  const SETTINGS_VERSION = 1;
  const RECORD_FORMAT = 'climb-record';
  const RECORD_VERSION = 1;

  // Fixed in phase 1. Listed so the page can show them and records carry them.
  const FIXED = Object.freeze({
    width: 5,
    height: 7,
    minChain: 2,
    chainBonus: [[9, 5], [7, 3], [5, 2], [3, 1.5]],
    undo: 'one step',
    mergeResult: 'exact sum',
    strandedTiles: 'warned one move, then stone if they still cannot merge',
  });

  const CHOICES = Object.freeze({
    poolSize: [4, 5, 6, 7],
    poolStart: [2, 4, 8],
    fallOdds: ['halving', 'equal'],
    slideTrigger: ['tile', 'score', 'moves'],
    pacing: ['steady', 'speeds-up', 'slows-down'],
  });

  // ---------- settings ----------

  function defaultSlideAmount(trigger, poolStart) {
    if (trigger === 'tile') return 8;
    if (trigger === 'score') return 1000 * (poolStart / 2);
    return 15;
  }

  function defaultSettings() {
    return {
      version: SETTINGS_VERSION,
      poolSize: 5,
      poolStart: 2,
      fallOdds: 'halving',
      slideTrigger: 'tile',
      slideAmount: 8,
      pacing: 'steady',
    };
  }

  // Fills in anything missing and refuses bad values with a plain message.
  function normalizeSettings(input) {
    const given = input || {};
    const out = defaultSettings();
    for (const key of Object.keys(given)) {
      if (!(key in out)) throw new Error(`Unknown setting: ${key}`);
    }
    if (given.version !== undefined && given.version !== SETTINGS_VERSION) {
      throw new Error(`Settings version ${given.version} is not ${SETTINGS_VERSION}`);
    }
    for (const key of Object.keys(CHOICES)) {
      if (given[key] === undefined) continue;
      if (!CHOICES[key].includes(given[key])) {
        throw new Error(`${key} must be one of ${CHOICES[key].join(', ')}`);
      }
      out[key] = given[key];
    }
    out.slideAmount = given.slideAmount === undefined
      ? defaultSlideAmount(out.slideTrigger, out.poolStart)
      : given.slideAmount;
    const amount = out.slideAmount;
    if (!Number.isInteger(amount)) throw new Error('slideAmount must be a whole number');
    if (out.slideTrigger === 'tile' && ![2, 4, 8, 16, 32, 64].includes(amount)) {
      throw new Error('For "tile made", slideAmount must be 2, 4, 8, 16, 32 or 64 (times the pool top)');
    }
    if (out.slideTrigger === 'score' && (amount < 100 || amount > 10000000)) {
      throw new Error('For "score", slideAmount must be 100 to 10,000,000 points');
    }
    if (out.slideTrigger === 'moves' && (amount < 3 || amount > 200)) {
      throw new Error('For "moves", slideAmount must be 3 to 200 moves');
    }
    return out;
  }

  // ---------- random drops ----------
  // A new tile depends only on the seed, its column and how many tiles have
  // dropped into that column before it. Two players on one seed get the same
  // drops however they play, and undo then the same move gives the same tiles.

  function mix(a) {
    let t = (a + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  function dropRoll(seed, col, n) {
    let h = mix(seed >>> 0);
    h = mix(h ^ Math.imul(col + 1, 0x85ebca6b));
    h = mix(h ^ Math.imul(n + 1, 0xc2b2ae35));
    return h / 4294967296;
  }

  function poolValues(state) {
    const out = [];
    for (let i = 0; i < state.settings.poolSize; i++) out.push(state.poolBottom * 2 ** i);
    return out;
  }

  function fallWeights(settings) {
    const w = [];
    for (let i = 0; i < settings.poolSize; i++) {
      w.push(settings.fallOdds === 'halving' ? 2 ** (settings.poolSize - 1 - i) : 1);
    }
    return w;
  }

  // Share of each pool value, smallest first, as fractions that add to 1.
  function fallOdds(settings) {
    const w = fallWeights(settings);
    const total = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / total);
  }

  function pickValue(state, roll) {
    const w = fallWeights(state.settings);
    const total = w.reduce((a, b) => a + b, 0);
    const x = roll * total;
    let cum = 0;
    for (let i = 0; i < w.length; i++) {
      cum += w[i];
      if (x < cum) return state.poolBottom * 2 ** i;
    }
    return state.poolBottom * 2 ** (w.length - 1);
  }

  // ---------- slides ----------

  function poolTop(state) {
    return state.poolBottom * 2 ** (state.settings.poolSize - 1);
  }

  function tileMultiplier(settings, slides) {
    const step = Math.floor(slides / 2);
    if (settings.pacing === 'speeds-up') return Math.max(settings.slideAmount / 4, settings.slideAmount / 2 ** step);
    if (settings.pacing === 'slows-down') return Math.min(settings.slideAmount * 4, settings.slideAmount * 2 ** step);
    return settings.slideAmount;
  }

  function scoreGapFactor(pacing) {
    if (pacing === 'speeds-up') return 1.5;
    if (pacing === 'slows-down') return 3;
    return 2;
  }

  function moveGapStep(pacing) {
    if (pacing === 'speeds-up') return -2;
    if (pacing === 'slows-down') return 2;
    return 0;
  }

  function firstSlideGoal(settings) {
    if (settings.slideTrigger === 'tile') return {kind: 'tile', need: null};
    return {kind: settings.slideTrigger, gap: settings.slideAmount, at: settings.slideAmount};
  }

  function nextSlideGoal(settings, goal) {
    if (goal.kind === 'tile') return goal;
    if (goal.kind === 'score') {
      const gap = Math.round(goal.gap * scoreGapFactor(settings.pacing));
      return {kind: 'score', gap, at: goal.at + gap};
    }
    // Speeding up stops at 5 moves, but never raises a shorter gap the
    // player chose.
    const step = moveGapStep(settings.pacing);
    const gap = step < 0 ? Math.max(Math.min(5, goal.gap), goal.gap + step) : goal.gap + step;
    return {kind: 'moves', gap, at: goal.at + gap};
  }

  // The tile value that triggers the next slide when the trigger is "tile made".
  function tileNeeded(state) {
    return tileMultiplier(state.settings, state.slides) * poolTop(state);
  }

  function slideReady(state, mergedValue) {
    const goal = state.slideGoal;
    if (goal.kind === 'tile') return mergedValue >= tileNeeded(state);
    if (goal.kind === 'score') return state.score >= goal.at;
    return state.moves >= goal.at;
  }

  // Plain words for the page: how close the next slide is.
  function slideStatus(state) {
    const goal = state.slideGoal;
    if (goal.kind === 'tile') return `Slide at: make a ${tileNeeded(state).toLocaleString('en-US')}`;
    if (goal.kind === 'score') return `Slide at ${goal.at.toLocaleString('en-US')} points`;
    const left = goal.at - state.moves;
    return `Slide in ${left} move${left === 1 ? '' : 's'}`;
  }

  // ---------- board helpers ----------

  const isTile = cell => !!cell && !cell.stone;
  const copyBoard = board => board.map(row => row.map(cell => (cell ? {...cell} : null)));

  function forEachCell(board, fn) {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) fn(board[r][c], c, r);
    }
  }

  // Today's gravity: stone holds the tiles above it; tiles fall inside each
  // stretch between stones.
  function applyGravity(board) {
    const h = board.length;
    const w = board[0].length;
    for (let c = 0; c < w; c++) {
      let write = h - 1;
      for (let r = h - 1; r >= 0; r--) {
        const cell = board[r][c];
        if (cell && cell.stone) {
          write = r - 1;
        } else if (cell) {
          if (r !== write) {
            board[write][c] = cell;
            board[r][c] = null;
          }
          write--;
        }
      }
    }
  }

  // Today's refill: every empty square gets a new tile, column by column,
  // top to bottom.
  function refill(state, board, spawnCount, draw) {
    const dropped = [];
    for (let c = 0; c < FIXED.width; c++) {
      for (let r = 0; r < FIXED.height; r++) {
        if (board[r][c]) continue;
        const roll = draw(c, spawnCount[c]);
        spawnCount[c]++;
        const v = pickValue(state, roll);
        board[r][c] = {v, risk: false};
        dropped.push([c, r, v]);
      }
    }
    return dropped;
  }

  // ---------- chains ----------

  function chainBonus(length) {
    for (const [len, mult] of FIXED.chainBonus) if (length >= len) return mult;
    return 1;
  }

  const adjacent = (a, b) => {
    const dc = Math.abs(a[0] - b[0]);
    const dr = Math.abs(a[1] - b[1]);
    return dc <= 1 && dr <= 1 && dc + dr > 0;
  };

  // Returns null when the chain is legal, else a short reason.
  function chainError(state, cells) {
    if (!Array.isArray(cells) || cells.length < FIXED.minChain) return 'too short';
    const seen = new Set();
    let prev = null;
    for (let i = 0; i < cells.length; i++) {
      const p = cells[i];
      if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !Number.isInteger(p[1])) return 'bad square';
      const [c, r] = p;
      if (c < 0 || c >= FIXED.width || r < 0 || r >= FIXED.height) return 'off the board';
      const key = c * 100 + r;
      if (seen.has(key)) return 'square used twice';
      seen.add(key);
      const cell = state.board[r][c];
      if (!isTile(cell)) return 'not a tile';
      if (prev) {
        if (!adjacent(prev, p)) return 'not touching';
        const before = state.board[prev[1]][prev[0]].v;
        if (i === 1 ? cell.v !== before : cell.v !== before && cell.v !== before * 2) return 'wrong value';
      }
      prev = p;
    }
    return null;
  }

  function hasLegalChain(state) {
    const b = state.board;
    for (let r = 0; r < FIXED.height; r++) {
      for (let c = 0; c < FIXED.width; c++) {
        if (!isTile(b[r][c])) continue;
        for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
          const nc = c + dc;
          const nr = r + dr;
          if (nc < 0 || nc >= FIXED.width || nr >= FIXED.height) continue;
          if (isTile(b[nr][nc]) && b[nr][nc].v === b[r][c].v) return true;
        }
      }
    }
    return false;
  }

  // Every legal chain, found by walking out from each square. Long boards of
  // equal tiles have very many chains, so callers can cap the count.
  function listChains(state, opts) {
    const limit = (opts && opts.limit) || Infinity;
    const maxLength = (opts && opts.maxLength) || Infinity;
    const out = [];
    const b = state.board;
    const used = Array.from({length: FIXED.height}, () => new Array(FIXED.width).fill(false));
    const path = [];
    function walk(c, r) {
      if (out.length >= limit) return;
      if (path.length >= FIXED.minChain) out.push(path.map(p => p.slice()));
      if (path.length >= maxLength) return;
      const v = b[r][c].v;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = c + dc;
          const nr = r + dr;
          if (nc < 0 || nc >= FIXED.width || nr < 0 || nr >= FIXED.height || used[nr][nc]) continue;
          const next = b[nr][nc];
          if (!isTile(next)) continue;
          const ok = path.length === 1 ? next.v === v : next.v === v || next.v === v * 2;
          if (!ok) continue;
          used[nr][nc] = true;
          path.push([nc, nr]);
          walk(nc, nr);
          path.pop();
          used[nr][nc] = false;
          if (out.length >= limit) return;
        }
      }
    }
    for (let r = 0; r < FIXED.height; r++) {
      for (let c = 0; c < FIXED.width; c++) {
        if (!isTile(b[r][c])) continue;
        used[r][c] = true;
        path.push([c, r]);
        walk(c, r);
        path.pop();
        used[r][c] = false;
      }
    }
    return out;
  }

  // ---------- stranded tiles and stone ----------

  // Lowest row a tile could ever fall to: just above the next stone below it.
  function floorRow(board, c, r) {
    for (let rr = r + 1; rr < FIXED.height; rr++) if (board[rr][c] && board[rr][c].stone) return rr - 1;
    return FIXED.height - 1;
  }

  // Could tiles at a and b ever touch? Tiles only move down and never
  // sideways, so b must be in the same or a neighbouring column, with no stone
  // between them in a way that keeps them apart.
  function canMeet(board, a, b) {
    const [ca, ra] = a;
    const [cb, rb] = b;
    if (Math.abs(ca - cb) > 1) return false;
    if (ca === cb) {
      const lo = Math.min(ra, rb);
      const hi = Math.max(ra, rb);
      for (let r = lo + 1; r < hi; r++) if (board[r][ca] && board[r][ca].stone) return false;
      return true;
    }
    return ra <= floorRow(board, cb, rb) + 1 && rb <= floorRow(board, ca, ra) + 1;
  }

  // evan's test: could this tile still merge? Yes if a same-value tile, or two
  // tiles of half its value, can still reach it.
  function canStillMerge(board, c, r) {
    const v = board[r][c].v;
    let halves = 0;
    for (let cc = Math.max(0, c - 1); cc <= Math.min(FIXED.width - 1, c + 1); cc++) {
      for (let rr = 0; rr < FIXED.height; rr++) {
        if (cc === c && rr === r) continue;
        const other = board[rr][cc];
        if (!isTile(other)) continue;
        if (other.v !== v && other.v * 2 !== v) continue;
        if (!canMeet(board, [c, r], [cc, rr])) continue;
        if (other.v === v) return true;
        halves++;
        if (halves >= 2) return true;
      }
    }
    return false;
  }

  // A stranded tile that cannot merge is first marked at risk. If it still
  // cannot merge after the next move, it turns to stone. Stone never turns back.
  function checkStranded(state, board) {
    const warned = [];
    const stoned = [];
    const verdicts = [];
    forEachCell(board, (cell, c, r) => {
      if (!isTile(cell)) return;
      if (cell.v >= state.poolBottom) {
        cell.risk = false;
        return;
      }
      verdicts.push([c, r, canStillMerge(board, c, r)]);
    });
    for (const [c, r, ok] of verdicts) {
      const cell = board[r][c];
      if (ok) cell.risk = false;
      else if (cell.risk) {
        board[r][c] = {stone: true};
        stoned.push([c, r]);
      } else {
        cell.risk = true;
        warned.push([c, r]);
      }
    }
    return {warned, stoned};
  }

  // ---------- game ----------

  function seedDraw(seed) {
    return (col, n) => dropRoll(seed, col, n);
  }

  function newGame(settingsInput, seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Seed must be a whole number from 0 to 4294967295');
    const settings = normalizeSettings(settingsInput);
    const state = {
      engine: ENGINE_VERSION,
      settings,
      seed,
      board: Array.from({length: FIXED.height}, () => new Array(FIXED.width).fill(null)),
      spawnCount: new Array(FIXED.width).fill(0),
      poolBottom: settings.poolStart,
      slides: 0,
      slideGoal: firstSlideGoal(settings),
      score: 0,
      moves: 0,
      bestTile: 0,
      stones: 0,
      over: false,
      endReason: null,
    };
    refill(state, state.board, state.spawnCount, seedDraw(seed));
    forEachCell(state.board, cell => { state.bestTile = Math.max(state.bestTile, cell.v); });
    if (!hasLegalChain(state)) {
      state.over = true;
      state.endReason = 'no-chains';
    }
    return state;
  }

  // One move, in the plan's order: merge, maybe slide, fall and refill, check
  // stranded tiles, check for game end. `draw(col, n)` replaces the seeded
  // drops; a fair bot passes its own random numbers here.
  function applyMove(state, cells, draw) {
    if (state.over) throw new Error('The game is over');
    const err = chainError(state, cells);
    if (err) throw new Error(`Illegal chain: ${err}`);
    const next = {
      ...state,
      settings: state.settings,
      board: copyBoard(state.board),
      spawnCount: state.spawnCount.slice(),
      slideGoal: {...state.slideGoal},
    };
    const values = cells.map(([c, r]) => state.board[r][c].v);
    const sum = values.reduce((a, b) => a + b, 0);
    const bonus = chainBonus(cells.length);
    const points = Math.floor(sum * bonus);
    for (let i = 0; i < cells.length - 1; i++) next.board[cells[i][1]][cells[i][0]] = null;
    const [ec, er] = cells[cells.length - 1];
    next.board[er][ec] = {v: sum, risk: false};
    next.score += points;
    next.moves += 1;
    next.bestTile = Math.max(next.bestTile, sum);

    let slid = null;
    if (slideReady(next, sum)) {
      const stopped = next.poolBottom;
      next.poolBottom *= 2;
      next.slides += 1;
      next.slideGoal = nextSlideGoal(next.settings, next.slideGoal);
      slid = {stopped, started: poolTop(next)};
    }

    applyGravity(next.board);
    const dropped = refill(next, next.board, next.spawnCount, draw || seedDraw(next.seed));
    for (const [, , v] of dropped) next.bestTile = Math.max(next.bestTile, v);
    const {warned, stoned} = checkStranded(next, next.board);
    next.stones += stoned.length;
    if (!hasLegalChain(next)) {
      next.over = true;
      next.endReason = 'no-chains';
    }
    return {state: next, events: {points, bonus, sum, slid, dropped, warned, stoned}};
  }

  // ---------- views for bots ----------
  // Fair is the default: the bot sees the board and the odds, never the seed,
  // and any look-ahead uses random numbers the bot supplies. Future-seeing is
  // a measuring mode only: it sees the real upcoming drops, and says so.

  function publicState(state) {
    const {seed, ...rest} = state;
    return JSON.parse(JSON.stringify(rest));
  }

  function botView(state, mode) {
    const chosen = mode || 'fair';
    if (chosen === 'fair') {
      return {
        mode: 'fair',
        label: 'Fair: knows the board and the odds, not the upcoming tiles',
        state: publicState(state),
        odds: fallOdds(state.settings),
        pool: poolValues(state),
        legalChains: opts => listChains(state, opts),
        // rand() must return numbers in [0, 1); the real seed is never used.
        simulate: (view, cells, rand) => {
          if (typeof rand !== 'function') throw new Error('A fair simulation needs your own random function');
          const hidden = {...view, seed: 0};
          const result = applyMove(hidden, cells, () => rand());
          return {state: publicState(result.state), events: result.events};
        },
      };
    }
    if (chosen === 'future-seeing') {
      return {
        mode: 'future-seeing',
        label: 'MEASURING ONLY: sees the real upcoming tiles. Not a fair player.',
        state: JSON.parse(JSON.stringify(state)),
        odds: fallOdds(state.settings),
        pool: poolValues(state),
        legalChains: opts => listChains(state, opts),
        simulate: (full, cells) => applyMove(full, cells),
        peekRoll: (col, n) => dropRoll(state.seed, col, n),
      };
    }
    throw new Error('mode must be "fair" or "future-seeing"');
  }

  // ---------- record and replay ----------

  function fingerprint(state) {
    let s = `${state.score}|${state.moves}|${state.poolBottom}|${state.slides}|${state.stones}|`;
    for (const row of state.board) {
      for (const cell of row) s += !cell ? '_,' : cell.stone ? '#,' : `${cell.v}${cell.risk ? '!' : ''},`;
    }
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  const isPowerOfTwo = v => v > 0 && Number.isInteger(Math.log2(v));

  function summary(state) {
    let oddTiles = 0;
    forEachCell(state.board, cell => { if (isTile(cell) && !isPowerOfTwo(cell.v)) oddTiles++; });
    return {
      climbs: state.slides,
      score: state.score,
      moves: state.moves,
      bestTile: state.bestTile,
      slides: state.slides,
      stones: state.stones,
      oddTiles,
    };
  }

  // A game in progress with its record and one step of undo. The page and
  // the test bot both play through this.
  function createSession(settingsInput, seed) {
    const settings = normalizeSettings(settingsInput);
    let state = newGame(settings, seed);
    let previous = null;
    const record = {
      format: RECORD_FORMAT,
      formatVersion: RECORD_VERSION,
      engine: ENGINE_VERSION,
      settings,
      seed,
      startFingerprint: fingerprint(state),
      events: [],
      result: null,
    };
    return {
      get state() { return state; },
      get canUndo() { return !!previous && !record.result; },
      record,
      move(cells) {
        if (record.result) throw new Error('The game is saved and closed');
        const out = applyMove(state, cells);
        previous = state;
        state = out.state;
        record.events.push({
          t: 'move',
          chain: cells.map(p => [p[0], p[1]]),
          fp: fingerprint(state),
          slides: state.slides,
          stones: state.stones,
        });
        return out.events;
      },
      undo() {
        if (!previous || record.result) return false;
        state = previous;
        previous = null;
        record.events.push({t: 'undo', fp: fingerprint(state)});
        return true;
      },
      // A finished copy of the record that leaves the game open, so the page
      // can save at game end and still allow undo from the end screen.
      snapshot(end, date) {
        const copy = JSON.parse(JSON.stringify(record));
        copy.result = {...summary(state), end, date: date || new Date().toISOString(), finalFingerprint: fingerprint(state)};
        return copy;
      },
      // end: 'no-chains' when the game is over, or 'quit'.
      finish(end, date) {
        if (record.result) return record;
        record.result = {...summary(state), end, date: date || new Date().toISOString(), finalFingerprint: fingerprint(state)};
        return record;
      },
    };
  }

  // Plays a saved game back through the engine and checks every fingerprint.
  function replay(record) {
    if (!record || record.format !== RECORD_FORMAT) throw new Error('Not a Climb record');
    if (record.formatVersion !== RECORD_VERSION) throw new Error(`Record version ${record.formatVersion} is not ${RECORD_VERSION}`);
    if (record.engine !== ENGINE_VERSION) throw new Error(`Record engine ${record.engine} is not ${ENGINE_VERSION}`);
    let state = newGame(record.settings, record.seed);
    let previous = null;
    const problems = [];
    if (record.startFingerprint && fingerprint(state) !== record.startFingerprint) problems.push('start board differs');
    record.events.forEach((e, i) => {
      if (e.t === 'move') {
        previous = state;
        state = applyMove(state, e.chain).state;
      } else if (e.t === 'undo') {
        if (!previous) throw new Error(`Event ${i}: undo with nothing to undo`);
        state = previous;
        previous = null;
      } else throw new Error(`Event ${i}: unknown type ${e.t}`);
      if (e.fp !== fingerprint(state)) problems.push(`event ${i} fingerprint differs`);
    });
    if (record.result && record.result.finalFingerprint !== fingerprint(state)) problems.push('final board differs');
    return {state, ok: problems.length === 0, problems};
  }

  return {
    ENGINE_VERSION, SETTINGS_VERSION, RECORD_FORMAT, RECORD_VERSION, FIXED, CHOICES,
    defaultSettings, defaultSlideAmount, normalizeSettings,
    dropRoll, pickValue, fallOdds, poolValues, nextSlideGoal, firstSlideGoal, tileMultiplier, poolTop, tileNeeded, slideStatus,
    chainBonus, chainError, hasLegalChain, listChains,
    canMeet, canStillMerge, checkStranded, applyGravity,
    newGame, applyMove, botView, publicState,
    fingerprint, summary, createSession, replay,
  };
});
