const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharedReplay = require('../recording-replay');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  canExtendChain,
  isValidChain,
} = require('../engine');

const SOLVER_DIR = path.join(__dirname, '..');
const ROOT = path.join(SOLVER_DIR, '..');
const RECORDINGS_DIR = path.join(ROOT, 'recordings');
const ARCHIVE_DIR = path.join(SOLVER_DIR, 'candidates-archive');

// Human playthroughs license real decisions here: level 52 keeps its target
// because a person won it, and a level ships partly on a recorded win. Until
// this file existed nothing checked that a recording's moves actually produce
// its claimed score -- the authoring server validates a recording's *shape* on
// arrival (authoring-server.js:34) and never replays it.

// Recordings whose candidate identity exists nowhere the index looks. This is a
// ratchet -- it may fall, never rise.
//
// It stood at 5 when this file landed, with a comment saying those five "can
// never be replayed: the board definition is gone". That was wrong on every
// count. Four were one `git show` away (level 51's store was overwritten at
// 1468392, level 54's at 0965038) and the fifth was never lost at all -- it sits
// in solver/generated-batch-02.json at HEAD, invisible only because the index
// below read `candidate-levels*.json` and nothing else. All five now resolve and
// replay, so the ceiling is 0: a single new orphan is a real regression.
const ORPHAN_CEILING = 0;

// Vacuity guard. Zero replayable recordings must fail rather than read as
// "every recording verified": nothing-checked and all-clear must not print the
// same green.
const REPLAYABLE_FLOOR = 1;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Recordings bind to a candidate by content hash, not by path, so a store can
// move between solver/ and the archive without orphaning anything.
//
// Two file shapes hold candidates and both must be read. A store authored one
// level at a time is `candidate-levels*.json` beside a `.receipt.json` of the
// same basename. A bulk generation run is `generated-batch*.json`, whose
// `results` array holds {candidate, receipt, shape, verdict} entries -- the
// candidate and its identity are inside the one file. Reading only the first
// shape is what made recording 44d3802d look like a lost board for months.
//
// Reading a file is NOT the same as resolving an identity: only identities
// actually written down in one of these files enter the map, so an identity
// nobody recorded still misses and still counts as an orphan. Two crafted cases
// at the bottom of this file hold that line.
function indexStores(index, dir) {
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('candidate-levels') || !name.endsWith('.json')) continue;
    if (name.endsWith('.receipt.json')) continue;
    const receiptPath = path.join(dir, name.replace(/\.json$/, '.receipt.json'));
    if (!fs.existsSync(receiptPath)) continue;
    index.set(readJson(receiptPath).candidateIdentity, {
      candidate: readJson(path.join(dir, name)).candidates[0],
      source: name,
    });
  }
}

function indexBatches(index, dir) {
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('generated-batch') || !name.endsWith('.json')) continue;
    const results = readJson(path.join(dir, name)).results;
    if (!Array.isArray(results)) continue;
    for (const entry of results) {
      // `screened` entries and rejected results carry a shape but no candidate.
      // Skipping them is the difference between indexing a board and indexing
      // `undefined` under the key `undefined`.
      const identity = entry && entry.receipt && entry.receipt.candidateIdentity;
      if (typeof identity !== 'string' || !entry.candidate) continue;
      // A live store wins over a batch copy of the same identity, so a failure
      // message names the file a human would go and edit.
      if (index.has(identity)) continue;
      index.set(identity, { candidate: entry.candidate, source: `${name} (${entry.candidate.name})` });
    }
  }
}

function candidateIndex(dirs = [SOLVER_DIR, ARCHIVE_DIR]) {
  const index = new Map();
  const present = dirs.filter((dir) => fs.existsSync(dir));
  // Stores first, then batches, so the precedence above does not depend on
  // readdir order.
  for (const dir of present) indexStores(index, dir);
  for (const dir of present) indexBatches(index, dir);
  return index;
}

// Read at run time, never from a frozen list, so a playthrough recorded five
// minutes ago is checked without anyone editing this file.
function readRecordings(dir = RECORDINGS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ file: name, recording: readJson(path.join(dir, name)) }));
}

function partition(recordings, index) {
  const replayable = [];
  const orphans = [];
  for (const entry of recordings) {
    const found = index.get(entry.recording.candidateIdentity);
    if (found) replayable.push({ ...entry, ...found });
    else orphans.push(entry);
  }
  return { replayable, orphans };
}

// A first version of this checked only that the recorded tiles held the recorded
// values and that the arithmetic added up. A crafted control caught the hole: a
// chain rewritten to a DIFFERENT tile of the same value replayed clean, because
// nothing checked the moves were legal. On a board full of 64s that is most of
// them. Legality is the engine's own rules -- 8-way adjacency, no revisits, the
// value progression canExtendChain allows, and the level's minChain.
function chainLegality(tiles, minChain) {
  const problems = [];
  const seen = new Set();

  tiles.forEach((tile, i) => {
    const key = `${tile.x},${tile.y}`;
    if (seen.has(key)) problems.push(`revisits (${tile.x},${tile.y})`);
    seen.add(key);
    if (i === 0) return;

    const prev = tiles[i - 1];
    if (Math.abs(tile.x - prev.x) > 1 || Math.abs(tile.y - prev.y) > 1) {
      problems.push(`jumps (${prev.x},${prev.y}) -> (${tile.x},${tile.y}), not adjacent`);
    }
    if (!canExtendChain(tiles.slice(0, i), tile)) {
      problems.push(`value ${tile.value} at (${tile.x},${tile.y}) cannot follow ${prev.value}`);
    }
  });

  if (!isValidChain(tiles, minChain)) {
    problems.push(`chain of ${tiles.length} is not valid at minChain ${minChain}`);
  }
  return problems;
}

// Returns every discrepancy found, so a failure says which move broke rather
// than only that something did.
function replay(candidate, recording) {
  const problems = [];
  const rng = makeRng(recording.seed);
  const state = createLevelState(candidate, rng);

  recording.chains.forEach((chain, index) => {
    const move = index + 1;
    const live = chain.tiles.map((t) => {
      const row = state.grid[t.y];
      const tile = row && row[t.x];
      if (!tile) {
        problems.push(`move ${move}: no tile at (${t.x},${t.y})`);
        return null;
      }
      if (tile.value !== t.value) {
        problems.push(`move ${move}: tile (${t.x},${t.y}) holds ${tile.value}, recording claims ${t.value}`);
      }
      return tile;
    });
    if (live.some((tile) => !tile)) return;

    for (const issue of chainLegality(chain.tiles, candidate.minChain)) {
      problems.push(`move ${move}: illegal chain — ${issue}`);
    }

    const points = executeChain(state, live);
    if (points !== chain.points) {
      problems.push(`move ${move}: chain scored ${points}, recording claims ${chain.points}`);
    }
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
  });

  if (state.score !== recording.score) {
    problems.push(`final score ${state.score}, recording claims ${recording.score}`);
  }
  if (state.moves !== recording.movesUsed) {
    problems.push(`used ${state.moves} moves, recording claims ${recording.movesUsed}`);
  }

  const reachedTarget = state.score >= candidate.target;
  if (recording.outcome === 'win' && !reachedTarget) {
    problems.push(`claims a win, but replay reached ${state.score} of target ${candidate.target}`);
  }
  if (recording.outcome === 'lose' && reachedTarget) {
    problems.push(`claims a loss, but replay reached the target at ${state.score}`);
  }

  return { problems, score: state.score, moves: state.moves };
}

const INDEX = candidateIndex();
const { replayable: REPLAYABLE, orphans: ORPHANS } = partition(readRecordings(), INDEX);

test('at least one recording is replayable', () => {
  assert.ok(
    REPLAYABLE.length >= REPLAYABLE_FLOOR,
    `only ${REPLAYABLE.length} of ${REPLAYABLE.length + ORPHANS.length} recordings could be ` +
      'replayed. Zero replayable recordings must fail rather than pass silently — ' +
      'otherwise this whole file goes green having checked nothing.',
  );
});

test('the reusable replay predicate passes a real recording and refuses its broken twin', () => {
  const entry = firstReplayable();
  assert.deepEqual(sharedReplay.replay(entry.candidate, entry.recording).problems, []);
  const brokenTwin = { ...entry.recording, score: entry.recording.score + 1 };
  assert.ok(sharedReplay.replay(entry.candidate, brokenTwin).problems.some((problem) => /final score .* recording claims/.test(problem)));
});

for (const entry of REPLAYABLE) {
  const short = entry.file.slice(0, 12);
  test(`recording ${short} (level ${entry.recording.candidateLevel}, ${entry.recording.outcome}) replays exactly`, () => {
    const { problems } = replay(entry.candidate, entry.recording);
    assert.deepEqual(
      problems,
      [],
      `${entry.file} does not replay against ${entry.source}:\n  ` + problems.join('\n  '),
    );
  });
}

test('recordings whose candidate is gone are named, and their count cannot grow', (t) => {
  for (const orphan of ORPHANS) {
    t.diagnostic(
      `ORPHAN ${orphan.file.slice(0, 12)} (level ${orphan.recording.candidateLevel}, ` +
        `${orphan.recording.outcome}) wants candidate ${orphan.recording.candidateIdentity.slice(0, 12)}, ` +
        'which exists nowhere on disk — this playthrough can never be verified',
    );
  }
  assert.ok(
    ORPHANS.length <= ORPHAN_CEILING,
    `${ORPHANS.length} orphaned recordings, ceiling is ${ORPHAN_CEILING}. A new orphan means a ` +
      'candidate store was overwritten or deleted while a recording still referenced it, ' +
      'destroying the only proof a human ever played it. Recover the store rather than ' +
      'raising this ceiling.\n  ' +
      ORPHANS.map((o) => `${o.file.slice(0, 12)} -> ${o.recording.candidateIdentity.slice(0, 12)}`).join('\n  '),
  );
});

// --- Crafted bad inputs --------------------------------------------------
// Each must fail for the stated reason, not merely fail.

function firstReplayable() {
  assert.ok(REPLAYABLE.length > 0, 'these controls need one real recording to corrupt');
  return REPLAYABLE[0];
}

test('a recording claiming a score it did not reach is refused', () => {
  const entry = firstReplayable();
  const tampered = { ...entry.recording, score: entry.recording.score + 1 };
  const { problems } = replay(entry.candidate, tampered);
  assert.ok(
    problems.some((p) => /final score \d+, recording claims/.test(p)),
    `expected a final-score mismatch, got: ${JSON.stringify(problems)}`,
  );
});

test('a recording whose moves were altered is refused', () => {
  const entry = firstReplayable();
  const chains = entry.recording.chains.map((c) => ({ ...c, tiles: c.tiles.map((t) => ({ ...t })) }));
  // Move the first tile of the first chain somewhere it was not.
  chains[0].tiles[0] = { ...chains[0].tiles[0], x: (chains[0].tiles[0].x + 3) % 5 };
  const { problems } = replay(entry.candidate, { ...entry.recording, chains });
  assert.ok(
    problems.some((p) => /^move 1: (tile|no tile|illegal chain)/.test(p)),
    `expected the altered coordinate to be caught on move 1, got: ${JSON.stringify(problems)}`,
  );
});

// The control above shifts a coordinate, and the shifted tile almost always
// holds a different value -- so it is caught by the value check and passes
// happily even with chainLegality() deleted (measured 2026-08-21: delete the
// chainLegality loop in replay() and all other tests in this file stay green).
// It does not guard what its comment says it guards.
//
// This one does. Appending a repeat of the chain's first tile changes no
// coordinate and no value, so every tile still matches the board exactly; the
// only thing wrong with the move is that it is not a legal chain. If
// chainLegality() stops running, this test is the one that goes red.
test('a chain that revisits a tile is refused as illegal, not merely as mis-scored', () => {
  const entry = firstReplayable();
  const chains = entry.recording.chains.map((c) => ({ ...c, tiles: c.tiles.map((t) => ({ ...t })) }));
  chains[0].tiles.push({ ...chains[0].tiles[0] });

  const { problems } = replay(entry.candidate, { ...entry.recording, chains });
  assert.ok(
    problems.some((p) => /^move 1: illegal chain — revisits \(\d+,\d+\)/.test(p)),
    `expected move 1 to be refused for revisiting a tile, got: ${JSON.stringify(problems.slice(0, 5))}`,
  );
  assert.deepEqual(
    problems.filter((p) => /^move 1: (tile|no tile)/.test(p)),
    [],
    'move 1 must be caught by the legality rules alone — every tile it names really is on the ' +
      'board holding the value claimed. A value mismatch here would mean this control proves ' +
      'nothing about legality, which is exactly the flaw in the altered-coordinate case above.',
  );
});

test('a recording claiming a win it did not achieve is refused', () => {
  const entry = firstReplayable();
  const truncated = {
    ...entry.recording,
    chains: entry.recording.chains.slice(0, 1),
    movesUsed: 1,
    outcome: 'win',
  };
  const { problems } = replay(entry.candidate, truncated);
  assert.ok(
    problems.some((p) => /claims a win, but replay reached/.test(p)),
    `expected the false win to be caught, got: ${JSON.stringify(problems)}`,
  );
});

test('a recording added after this file was written is picked up without editing it', () => {
  const entry = firstReplayable();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recordings-'));
  fs.writeFileSync(path.join(dir, 'brand-new.json'), JSON.stringify(entry.recording));

  const found = readRecordings(dir);
  assert.equal(found.length, 1, 'the walk must read the directory at run time');

  const { replayable, orphans } = partition(found, INDEX);
  assert.equal(orphans.length, 0, 'a recording bound to a live candidate is not an orphan');
  assert.deepEqual(replay(replayable[0].candidate, replayable[0].recording).problems, []);
});

test('an unresolvable recording is classed as an orphan, not quietly dropped', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recordings-'));
  fs.writeFileSync(
    path.join(dir, 'ghost.json'),
    JSON.stringify({ candidateIdentity: '0'.repeat(64), candidateLevel: 99, outcome: 'win', chains: [] }),
  );

  const { replayable, orphans } = partition(readRecordings(dir), INDEX);
  assert.equal(replayable.length, 0);
  assert.equal(orphans.length, 1, 'an unknown identity must land in the orphan list, not vanish');
});

// --- The index reaches into generated batches, and no further ---------------
// Levels authored one at a time land in `candidate-levels*.json`; levels
// generated in bulk land inside `generated-batch*.json` as a `results` array of
// {candidate, receipt, shape, verdict}. Recording 44d3802d bound to a candidate
// of the second kind and was reported for months as unverifiable with its board
// "gone" -- it was in solver/generated-batch-02.json the whole time.
//
// These two cases are a pair and must stay a pair. The first says the widened
// index finds a batch-held candidate. The second says widening did not turn the
// index into something that answers yes to everything: the cheap way to make
// the orphan count reach zero is to make nothing capable of being an orphan,
// and the second case is what stops that.

const STAGED_IDENTITY = 'a'.repeat(64);
const UNKNOWN_IDENTITY = 'b'.repeat(64);

// Shaped from solver/generated-batch-02.json, read on 2026-08-21: top-level
// `results` (indexed) and `screened` (rejected shapes, no candidate, ignored).
function stageBatchDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-'));
  const candidate = {
    blockers: [],
    gridH: 5,
    gridW: 5,
    level: 52,
    minChain: 3,
    moves: 16,
    name: 'gen-9999',
    schemaVersion: 1,
    sourceShapeIdentity: 'c'.repeat(64),
    target: 69000,
    tileScale: 32,
  };
  fs.writeFileSync(
    path.join(dir, 'generated-batch-99.json'),
    JSON.stringify({
      schemaVersion: 1,
      gates: { maxBombRate: 0.05, minWinRate: 0.2, requireZeroLockouts: true },
      sampler: { count: 1, full: 1, level: 52, seed: 43 },
      screenSeeds: { count: 1, start: 0 },
      screened: [{ rejection: 'lockout', screen: { bombs: 0, lockouts: 1 }, shape: { name: 'gen-9998' } }],
      results: [
        {
          candidate,
          receipt: { candidateIdentity: STAGED_IDENTITY, schemaVersion: 1, shapeName: 'gen-9999' },
          shape: { name: 'gen-9999' },
          verdict: { failures: [], pass: true, verifierConfirmed: true, winRate: 0.7 },
        },
      ],
    }),
  );
  return { dir, candidate };
}

test('a candidate held only inside a generated batch file is found by the index', () => {
  const { dir, candidate } = stageBatchDir();
  const index = candidateIndex([dir]);

  const found = index.get(STAGED_IDENTITY);
  assert.ok(found, `the batch-held candidate was not indexed; index holds ${[...index.keys()]}`);
  assert.deepEqual(found.candidate, candidate, 'the indexed board must be the batch entry, unaltered');
  assert.match(
    found.source,
    /^generated-batch-99\.json/,
    'a replay failure must name the batch file it read the board out of',
  );

  const recording = { candidateIdentity: STAGED_IDENTITY, candidateLevel: 52, outcome: 'win', chains: [] };
  const { replayable, orphans } = partition([{ file: 'staged.json', recording }], index);
  assert.equal(orphans.length, 0, 'a recording bound to a batch-held candidate is not an orphan');
  assert.equal(replayable.length, 1);
});

test('widening the index to batch files still leaves an unknown identity an orphan', () => {
  const { dir } = stageBatchDir();
  const index = candidateIndex([dir]);

  assert.ok(index.has(STAGED_IDENTITY), 'precondition: this index really did read the batch file');
  assert.equal(
    index.get(UNKNOWN_IDENTITY),
    undefined,
    'an identity written down nowhere must not resolve. If it does, the index has stopped ' +
      'being a lookup and the orphan count is zero because nothing can be an orphan.',
  );

  const recording = { candidateIdentity: UNKNOWN_IDENTITY, candidateLevel: 99, outcome: 'win', chains: [] };
  const { replayable, orphans } = partition([{ file: 'ghost.json', recording }], index);
  assert.equal(replayable.length, 0);
  assert.equal(orphans.length, 1, 'the unknown identity must still be reported as an orphan');

  // And against the real index, over the real solver/ tree -- not just the
  // staged one, so this cannot pass on a directory that happens to hold little.
  assert.equal(INDEX.get(UNKNOWN_IDENTITY), undefined);
  assert.equal(partition([{ file: 'ghost.json', recording }], INDEX).orphans.length, 1);
});

test('a batch entry without a candidate identity is skipped, not indexed as undefined', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-'));
  fs.writeFileSync(
    path.join(dir, 'generated-batch-98.json'),
    JSON.stringify({
      schemaVersion: 1,
      results: [
        { shape: { name: 'gen-0001' }, verdict: { pass: false } },
        { candidate: { level: 52 }, receipt: {} },
        { candidate: { level: 52 } },
      ],
    }),
  );

  const index = candidateIndex([dir]);
  assert.equal(index.size, 0, `malformed batch entries must be skipped, got keys ${[...index.keys()]}`);
});
