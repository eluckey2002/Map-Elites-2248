const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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

// Recordings whose candidate identity exists nowhere on disk. They can never be
// replayed: the board definition is gone. Five at the moment this landed, all
// residue of authoring overwriting a candidate store before --out existed
// (fixed in 36d8e73). This is a ratchet -- it may fall, never rise.
const ORPHAN_CEILING = 5;

// Vacuity guard. Zero replayable recordings must fail rather than read as
// "every recording verified": nothing-checked and all-clear must not print the
// same green.
const REPLAYABLE_FLOOR = 1;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Recordings bind to a candidate by content hash, not by path, so a store can
// move between solver/ and the archive without orphaning anything.
function candidateIndex(dirs = [SOLVER_DIR, ARCHIVE_DIR]) {
  const index = new Map();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
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
