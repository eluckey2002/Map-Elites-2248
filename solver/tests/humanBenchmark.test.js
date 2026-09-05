// The benchmark's whole value is that it is not saturated and not
// cherry-picked, so the things worth guarding are its COVERAGE and its
// pairing, not its numbers. A silently shrinking board list would read as a
// clean result while measuring less and less.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { collect, playBot } = require('../human-benchmark');
const { makeRng } = require('../engine');

const ROOT = path.join(__dirname, '..', '..');

// collect() replays every board; once is enough for the whole file.
let cached = null;
const collectOnce = () => { if (!cached) cached = collect(); return cached; };

function recordingCount() {
  let total = 0;
  const dirs = [path.join(ROOT, 'recordings')];
  const pilotsDir = path.join(ROOT, 'pilots');
  if (fs.existsSync(pilotsDir)) {
    for (const pilot of fs.readdirSync(pilotsDir)) {
      const dir = path.join(pilotsDir, pilot, 'recordings');
      if (fs.existsSync(dir)) dirs.push(dir);
    }
  }
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    total += fs.readdirSync(dir).filter((n) => n.endsWith('.json')).length;
  }
  return total;
}

test('every recorded session resolves to a board and is paired', () => {
  const { rows, unresolved } = collectOnce();
  assert.deepEqual(
    unresolved, [],
    'a recording that cannot be resolved to its board is silently dropped from the benchmark',
  );
  assert.equal(
    rows.length, recordingCount(),
    'the benchmark must pair every recording on disk, not a subset',
  );
  // 12 as of 2026-09-05. A deliberate pin: this number should only ever go up,
  // and it going up should be a decision someone made, not a surprise.
  assert.ok(rows.length >= 12, `expected at least 12 paired boards, got ${rows.length}`);
});

test('each pair compares the same board and the same seed for both players', () => {
  const { rows } = collectOnce();
  for (const row of rows) {
    assert.ok(Number.isInteger(row.seed), `${row.file}: seed must be an integer`);
    assert.ok(row.human.score > 0, `${row.file}: human score missing`);
    assert.ok(row.bot.score > 0, `${row.file}: bot score missing`);
    assert.equal(
      row.scoreDelta, row.bot.score - row.human.score,
      `${row.file}: reported delta must be the difference actually measured`,
    );
    assert.ok(
      ['win', 'lose'].includes(row.human.outcome) && ['win', 'lose'].includes(row.bot.outcome),
      `${row.file}: both outcomes must be decided`,
    );
  }
});

test('the bot arm is deterministic for a given board and seed', () => {
  const { rows } = collectOnce();
  const row = rows[0];
  const dir = path.join(ROOT, 'recordings');
  const name = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()[0];
  const recording = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const { candidateIndex } = require('../recording-replay');
  const candidate = candidateIndex().get(recording.candidateIdentity).candidate;
  const first = playBot(candidate, recording.seed);
  const second = playBot(candidate, recording.seed);
  assert.deepEqual(first, second, 'the same board and seed must replay to the same bot result');
  assert.equal(first.score, row.bot.score, 'the table and a direct replay must agree');
});

test('a shifted seed is a different game, so the pairing is doing real work', () => {
  // Guards against the arm accidentally ignoring the seed, which would make
  // every "paired" comparison a comparison against one fixed game.
  const dir = path.join(ROOT, 'recordings');
  const name = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()[0];
  const recording = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const { candidateIndex } = require('../recording-replay');
  const candidate = candidateIndex().get(recording.candidateIdentity).candidate;
  const onSeed = playBot(candidate, recording.seed);
  const offSeed = playBot(candidate, recording.seed + 1);
  assert.notDeepEqual(
    onSeed, offSeed,
    'changing the seed produced an identical game; the seed is not reaching the board',
  );
  assert.ok(makeRng(recording.seed)() !== makeRng(recording.seed + 1)(), 'seeds must differ at the source');
});
