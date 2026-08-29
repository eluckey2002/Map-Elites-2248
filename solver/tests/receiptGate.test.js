const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { defaultInputIdentities, verifyCandidate } = require('../level-author');

const SOLVER_DIR = path.join(__dirname, '..');

// Every candidate store that ships in solver/ must carry a receipt that still
// verifies against the code as it stands right now. verifyCandidate has always
// been able to detect a receipt measured against a bot that has since changed;
// until this file existed, nothing ever ran it over the receipts on disk, so
// drift was detectable for weeks and went undetected.
//
// The walk is store-driven, not receipt-driven, on purpose: if it globbed
// receipts, deleting a receipt would silently shrink the corpus and turn the
// suite green. A store with no receipt is a failure, not an absence.
const STORE_PREFIX = 'candidate-levels';
const RECEIPT_SUFFIX = '.receipt.json';

// Vacuity guard. A glob that matches nothing must not read as "all clean" --
// zero checked and zero failed would otherwise print the same green.
const STORE_FLOOR = 1;

// solver/candidates-archive/ is deliberately outside this walk; its README
// records that its receipts are stale and its numbers are not quotable.
function candidateStores(dir) {
  return fs
    .readdirSync(dir)
    .filter(
      (name) =>
        name.startsWith(STORE_PREFIX) &&
        name.endsWith('.json') &&
        !name.endsWith(RECEIPT_SUFFIX),
    )
    .sort();
}

function receiptFor(storeName) {
  return `${storeName.slice(0, -'.json'.length)}${RECEIPT_SUFFIX}`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Returns a fault description, or null when the store's receipt verifies.
function faultFor(dir, storeName) {
  const receiptName = receiptFor(storeName);
  const receiptPath = path.join(dir, receiptName);
  if (!fs.existsSync(receiptPath)) {
    return `no receipt: ${receiptName} is missing`;
  }
  try {
    // No options overrides: real defaultInputIdentities(), real bot replay.
    // Passing a stub play or stub identities here would make this test verify
    // its own fixtures instead of the shipped corpus.
    verifyCandidate(readJson(path.join(dir, storeName)), readJson(receiptPath));
    return null;
  } catch (error) {
    return error.message;
  }
}

test('the shipped candidate corpus is not empty', () => {
  const stores = candidateStores(SOLVER_DIR);
  assert.ok(
    stores.length >= STORE_FLOOR,
    `expected at least ${STORE_FLOOR} candidate store in solver/, found ${stores.length}; ` +
      'an empty corpus must fail rather than pass silently',
  );
});

// --- Exemption -----------------------------------------------------------
// A level that ships and that a human has completed is not re-targeted just
// because the bot got stronger: the receipt derives target as median x demand
// and asserts the recorded median matches a fresh measurement, so refreshing it
// necessarily RAISES a live level's target. Measured for level 52 (ticket
// T-003): +4.9% harder for players, while the bot's holdout win rate moved
// 290/300 -> 291/300. The debt is real and stays reported; it just does not
// block, because the only way to clear it would degrade shipped content.
//
// The exemption is COMPUTED from src/game.js and recordings/ on every run. It is
// never read from the receipt, the store, or the manifest -- a candidate that
// declares itself exempt gets nothing.
const GAME_FILE = path.join(SOLVER_DIR, '..', 'src', 'game.js');
const RECORDINGS_DIR = path.join(SOLVER_DIR, '..', 'recordings');

function shippedLevels(gameFile = GAME_FILE) {
  const source = fs.readFileSync(gameFile, 'utf8');
  const levels = new Set();
  const pattern = /\{\s*level:\s*(\d+),/g;
  let match;
  while ((match = pattern.exec(source)) !== null) levels.add(Number(match[1]));
  return levels;
}

function winningRecordingIdentities(dir = RECORDINGS_DIR) {
  const identities = new Set();
  if (!fs.existsSync(dir)) return identities;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const recording = readJson(path.join(dir, name));
    // A loss proves a human played it, not that it can be finished at this
    // target. Only a win licenses leaving the target alone.
    if (recording.outcome === 'win' && typeof recording.candidateIdentity === 'string') {
      identities.add(recording.candidateIdentity);
    }
  }
  return identities;
}

function exemptionFor(candidate, receipt, shipped, winners) {
  const ships = shipped.has(candidate.level);
  const played = winners.has(receipt.candidateIdentity);
  return { exempt: ships && played, ships, played };
}

function exemptionForStore(dir, storeName, shipped = shippedLevels(), winners = winningRecordingIdentities()) {
  const receiptPath = path.join(dir, receiptFor(storeName));
  const storePath = path.join(dir, storeName);
  if (!fs.existsSync(receiptPath) || !fs.existsSync(storePath)) {
    return { exempt: false, ships: false, played: false };
  }
  const candidate = readJson(storePath).candidates[0];
  return exemptionFor(candidate, readJson(receiptPath), shipped, winners);
}

// Every stale receipt fails. Being exempt does NOT buy a pass -- it only changes
// what the failure says.
//
// An earlier version of this let exempt stores pass with a diagnostic. That was
// the third time in one day this suite was made green by changing what it looked
// at rather than what was wrong: first by archiving the failing stores, then by
// exempting them. A gate that stops failing has stopped working, and a
// diagnostic among 175 passing tests is a footnote, not a signal.
function gateVerdict(fault) {
  return fault === null ? 'current' : 'stale';
}

// BLOCKING for anything stale that is not exempt. Level 52 is stale and exempt:
// it ships, and recording f0ae3e75... records a human completing it, so the gate
// reports it every run without failing. Level 53 (candidate-levels) and level 54
// are current and pass outright.
//
// Why level 52 is not simply fixed: refreshing its receipt re-derives its target
// from a fresh median, which with a stronger bot RAISES it -- measured at +4.9%
// for players while the bot's win rate on it moved one seed in three hundred
// (ticket T-003). The owner decided on 2026-08-21 that the target stays at
// 102000. The debt is real, reported, and deliberately unpaid.
//
// These two were briefly archived to force a green suite, and put back the same
// day: clearing a red gate by deleting its input is the exact failure this gate
// exists to catch. See docs/CHECK-CARDS.md.
//
// One test per store, so a failure names the offending file rather than
// reporting a count.
for (const storeName of candidateStores(SOLVER_DIR)) {
  test(`${storeName} has a receipt that verifies against the current bot`, () => {
    const fault = faultFor(SOLVER_DIR, storeName);
    if (gateVerdict(fault) === 'current') return;

    const { exempt, ships, played } = exemptionForStore(SOLVER_DIR, storeName);
    assert.fail(
      exempt
        ? `${storeName}: ${fault}\n\n` +
            'THIS FAILURE IS KNOWN AND DECIDED. It is not a new bug and it is not\n' +
            'yours to fix. This level ships, a human has completed it, and on\n' +
            '2026-08-21 the owner decided its target stays where it is. Refreshing\n' +
            'the receipt would re-derive the target from a stronger bot and raise it\n' +
            '4.9%, making a live level harder for players, while the bot\'s win rate\n' +
            'on it moved one seed in three hundred (ticket T-003).\n\n' +
            'Do NOT clear this by re-authoring, archiving, or exempting it. It fails\n' +
            'because the receipt genuinely predates the current bot, which is true.'
        : `${storeName}: ${fault}\n\n` +
            `Not exempt (ships=${ships}, human win recorded=${played}). This receipt\n` +
            'was measured against different code. Re-author it against the current\n' +
            'bot, or archive it and stop quoting its numbers. Do not weaken this\n' +
            'check to clear it.',
    );
  });
}

test('the walk inspected the whole corpus', () => {
  const stores = candidateStores(SOLVER_DIR);
  const receipted = stores.filter((name) => fs.existsSync(path.join(SOLVER_DIR, receiptFor(name))));
  assert.deepEqual(
    stores,
    receipted,
    'every candidate store must carry a receipt; a store whose receipt was ' +
      'deleted would otherwise drop out of the walk silently',
  );
});

// The identity set is only as complete as the file list it hashes. Today the
// closure happens to be complete -- bot.js pulls in only engine.js, and
// level-author.js pulls in only those two -- but that holds by luck of the
// current import graph, not by construction. The day a new local require lands
// in one of these files, the drift check would go quietly blind instead of
// failing. This test makes that a loud failure.
const HASHED_FILES = Object.freeze({
  bot: 'bot.js',
  calibration: 'calibration.js',
  engine: 'engine.js',
  levelAuthor: 'level-author.js',
});

function localRequires(file) {
  const source = fs.readFileSync(file, 'utf8');
  const found = new Set();
  const pattern = /require\(\s*['"]\.\/([\w./-]+)['"]\s*\)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    found.add(match[1].endsWith('.js') ? match[1] : `${match[1]}.js`);
  }
  return found;
}

// `dir` is a parameter so the crafted-bypass case below can run this walk
// against a staged fixture. A closure check that can only ever be pointed at
// the real solver/ cannot be shown to detect anything -- it would pass today
// and nobody would know whether it could fail.
function requireClosure(roots, dir = SOLVER_DIR) {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const name = queue.pop();
    if (seen.has(name)) continue;
    seen.add(name);
    const file = path.join(dir, name);
    // A require pointing at a file that is not there is still an edge worth
    // reporting, so record it and stop rather than throwing.
    if (!fs.existsSync(file)) continue;
    for (const dep of localRequires(file)) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return seen;
}

test('every file the measurement depends on is one of the hashed inputs', () => {
  assert.deepEqual(
    Object.keys(defaultInputIdentities()).sort(),
    Object.keys(HASHED_FILES).sort(),
    'defaultInputIdentities() changed shape; update HASHED_FILES to match, ' +
      'otherwise this closure check stops covering the real input set',
  );

  const hashed = new Set(Object.values(HASHED_FILES));
  const reached = requireClosure([HASHED_FILES.levelAuthor]);
  const unhashed = [...reached].filter((name) => !hashed.has(name)).sort();

  assert.deepEqual(
    unhashed,
    [],
    `these files feed the measurement but are not hashed into inputIdentities: ${unhashed.join(', ')}. ` +
      'Add them to defaultInputIdentities() in solver/level-author.js, or the ' +
      'drift check will pass while the code underneath it changes.',
  );
});

// --- Negative controls -------------------------------------------------
// Q3 of gate-check: craft the input that should fail, run it, and confirm the
// fault that landed is the one expected. A negative control that throws for
// the wrong reason tests the harness, not the check.

function stagedCorpus(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'receipt-gate-'));
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(body));
  }
  return dir;
}

test('a tampered receipt is refused rather than verified', () => {
  const storeName = 'candidate-levels.json';
  const receipt = readJson(path.join(SOLVER_DIR, receiptFor(storeName)));
  const tampered = {
    ...receipt,
    holdout: {
      ...receipt.holdout,
      terminalCounts: { ...receipt.holdout.terminalCounts, win: receipt.holdout.terminalCounts.win + 1 },
    },
  };
  const dir = stagedCorpus({
    [storeName]: readJson(path.join(SOLVER_DIR, storeName)),
    [receiptFor(storeName)]: tampered,
  });

  const fault = faultFor(dir, storeName);
  assert.match(
    String(fault),
    /receipt identity mismatch/i,
    `expected the tampered win count to fail the receipt signature, got: ${fault}`,
  );
});

test('a candidate store with no receipt is a failure, not an absence', () => {
  const storeName = 'candidate-levels-99.json';
  const dir = stagedCorpus({
    [storeName]: readJson(path.join(SOLVER_DIR, 'candidate-levels.json')),
  });

  assert.deepEqual(candidateStores(dir), [storeName], 'the staged store should be discovered');
  assert.match(
    String(faultFor(dir, storeName)),
    /no receipt/i,
    'a store whose receipt was deleted must fail rather than drop out of the walk',
  );
});

test('an empty corpus fails the floor instead of reading as clean', () => {
  const dir = stagedCorpus({});
  assert.equal(candidateStores(dir).length, 0);
  assert.ok(
    candidateStores(dir).length < STORE_FLOOR,
    'zero stores must be below the floor, so an empty glob cannot pass as green',
  );
});

// The drift case -- the one this whole gate exists for. A first attempt at this
// control zeroed the bot hash *inside the receipt*, which faulted at
// `receipt identity mismatch` before the drift comparison ever ran: it tested
// the harness, not the check. Drift means the receipt is internally consistent
// and the code underneath it moved, so the control has to move the code side.
//
// The on-disk version of this was run by hand once (append a comment to
// solver/bot.js, verify a passing receipt, restore) and produced
// `code/input identity mismatch`, confirming the guard fires on real drift.
// That is not landed as a test because a test that mutates solver/bot.js can
// leave the repo dirty if it fails midway. This uses the injection seam
// verifyCandidate already exposes, which reaches the same comparison.
test('a receipt whose code has drifted is refused, not verified', () => {
  const store = readJson(path.join(SOLVER_DIR, 'candidate-levels.json'));
  const receipt = readJson(path.join(SOLVER_DIR, receiptFor('candidate-levels.json')));
  const drifted = { ...defaultInputIdentities(), bot: '0'.repeat(64) };

  assert.throws(
    () => verifyCandidate(store, receipt, { inputIdentities: drifted }),
    /code\/input identity mismatch/i,
    'a moved bot.js must fail the drift comparison, not slip through',
  );

  // Positive control: with the real identities, this same store and receipt
  // reach a different outcome -- the walk above reports `OK candidate-levels.json`
  // in the same run. If known-good and known-bad printed the same thing, one of
  // them did not happen. Asserting it a second time here would repeat a ~9s
  // replay the walk already performed, which is the kind of cost that gets a
  // suite skipped.
});

// Crafted-bypass for the input-closure check. The failure it guards against is
// a new local require landing in the measurement path without being added to
// defaultInputIdentities(): the drift check would then pass while the code
// underneath it changed. Staged rather than reasoned about.
test('a new unhashed require in the measurement path is detected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'closure-'));
  fs.writeFileSync(path.join(dir, 'level-author.js'), "require('./engine');\nrequire('./heuristics');\n");
  fs.writeFileSync(path.join(dir, 'engine.js'), '// leaf\n');
  fs.writeFileSync(path.join(dir, 'heuristics.js'), '// newly added, never hashed\n');

  const hashed = new Set(Object.values(HASHED_FILES));
  const reached = requireClosure(['level-author.js'], dir);
  const unhashed = [...reached].filter((name) => !hashed.has(name)).sort();

  assert.deepEqual(
    unhashed,
    ['heuristics.js'],
    'a local require outside the hashed set must be reported, not walked past',
  );
});

// Declared blind spot, confirmed rather than assumed. The detector is a static
// regex over require('./x') and require("./x"). These two forms reach the same
// module at run time and are invisible to it, so a dependency introduced either
// way would leave the drift check silently incomplete. Recorded on the card.
test('the closure detector does not see computed or templated requires', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'closure-blind-'));
  fs.writeFileSync(
    path.join(dir, 'level-author.js'),
    'const n = "./heuristics";\nrequire(n);\nrequire(`./scoring`);\n',
  );

  const reached = requireClosure(['level-author.js'], dir);
  assert.deepEqual(
    [...reached].sort(),
    ['level-author.js'],
    'if this ever starts detecting these forms, the blind spot on the ' +
      'input-closure card is stale and must be updated',
  );
});

// --- Corpus membership -------------------------------------------------
// The gate walks whatever it finds in solver/, which means every failure it
// reports can be cleared by deleting the input -- and the suite would go green
// and say nothing. That happened once, on 2026-08-21, to these very two levels.
// STORE_FLOOR only defends against a corpus of zero; it permitted 3 -> 1.
//
// The manifest closes it. It records membership only, never pass/fail status,
// so it can never be used to excuse a stale receipt -- only to stop one
// disappearing quietly.
const CORPUS_MANIFEST = 'candidate-corpus.json';

function corpusDrift(live, declared) {
  const liveSet = new Set(live);
  const declaredSet = new Set(declared);
  return {
    missing: declared.filter((name) => !liveSet.has(name)).sort(),
    undeclared: live.filter((name) => !declaredSet.has(name)).sort(),
  };
}

test('the live corpus matches the committed manifest exactly', () => {
  const manifest = readJson(path.join(SOLVER_DIR, CORPUS_MANIFEST));
  assert.equal(manifest.schemaVersion, 1, 'unknown manifest schemaVersion');

  const drift = corpusDrift(candidateStores(SOLVER_DIR), manifest.stores);

  assert.deepEqual(
    drift.missing,
    [],
    `declared in ${CORPUS_MANIFEST} but not present in solver/: ${drift.missing.join(', ')}. ` +
      'A store cannot leave the gate silently. If you are retiring it, remove it ' +
      'from the manifest in the same commit -- that edit is the signature.',
  );
  assert.deepEqual(
    drift.undeclared,
    [],
    `present in solver/ but not declared in ${CORPUS_MANIFEST}: ${drift.undeclared.join(', ')}. ` +
      'Add it, so a new candidate cannot sit outside the gate unnoticed.',
  );
});

test('a store vanishing from the corpus is detected, not silently tolerated', () => {
  const declared = ['candidate-levels.json', 'candidate-levels-52.json'];

  const removed = corpusDrift(['candidate-levels.json'], declared);
  assert.deepEqual(
    removed.missing,
    ['candidate-levels-52.json'],
    'archiving a store without updating the manifest must be reported',
  );

  const added = corpusDrift([...declared, 'candidate-levels-99.json'], declared);
  assert.deepEqual(
    added.undeclared,
    ['candidate-levels-99.json'],
    'a new store outside the manifest must be reported too, or coverage can ' +
      'silently fail to grow',
  );

  assert.deepEqual(corpusDrift(declared, declared), { missing: [], undeclared: [] });
});

// --- Exemption controls --------------------------------------------------
// The exemption is the one place this gate deliberately does not block, so it
// is the place most worth attacking.

test('the exemption is computed, never declared', () => {
  // A candidate that asserts its own exemption gets nothing: the decision reads
  // src/game.js and recordings/, and never looks at the record itself.
  const liar = { level: 999, exempt: true, exemptionReason: 'trust me' };
  const receipt = { candidateIdentity: 'deadbeef', exempt: true };
  const result = exemptionFor(liar, receipt, new Set([999]), new Set());

  assert.equal(result.exempt, false, 'a self-declared exemption must be ignored');
  assert.equal(result.ships, true);
  assert.equal(result.played, false, 'no winning recording binds to it, whatever it claims');
});

test('shipping alone does not exempt', () => {
  const candidate = { level: 52 };
  const receipt = { candidateIdentity: 'aaaa' };
  const result = exemptionFor(candidate, receipt, new Set([52]), new Set(['other']));
  assert.deepEqual(result, { exempt: false, ships: true, played: false });
});

test('a human win alone does not exempt', () => {
  const candidate = { level: 53 };
  const receipt = { candidateIdentity: 'bbbb' };
  const result = exemptionFor(candidate, receipt, new Set([52]), new Set(['bbbb']));
  assert.deepEqual(result, { exempt: false, ships: false, played: true });
});

test('both halves together exempt, and only then', () => {
  const candidate = { level: 52 };
  const receipt = { candidateIdentity: 'cccc' };
  assert.equal(exemptionFor(candidate, receipt, new Set([52]), new Set(['cccc'])).exempt, true);
});

test('every stale receipt fails, exempt or not', () => {
  // Exemption changes the wording of the failure, never whether it fails.
  assert.equal(gateVerdict('code/input identity mismatch'), 'stale');
  assert.equal(gateVerdict('no receipt: missing'), 'stale');
  assert.equal(gateVerdict(null), 'current');
});

test('a losing recording does not license an exemption', () => {
  // Losses prove a human played it, not that it can be finished at this target.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recordings-'));
  fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify({ candidateIdentity: 'lost', outcome: 'lose' }));
  fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({ candidateIdentity: 'won', outcome: 'win' }));

  const winners = winningRecordingIdentities(dir);
  assert.equal(winners.has('won'), true);
  assert.equal(winners.has('lost'), false, 'a loss must not count as validation');
});

test('the real exemption facts hold for the shipped corpus', () => {
  const shipped = shippedLevels();
  assert.equal(shipped.has(52), true, 'level 52 must ship for its exemption to be legitimate');
  assert.equal(shipped.has(54), false, 'level 54 does not ship; it must never be exempt');
  // Level 53 shipped on 2026-08-21. Pinning the consequence rather than flipping
  // false to true: shipping it ARMS its exemption, because three winning
  // recordings bind to its identity. That is inert while its receipt verifies --
  // the gate returns `current` before consulting the exemption at all -- and
  // becomes load-bearing the next time the bot changes. Asserting both halves
  // keeps that state change visible instead of erasing it.
  assert.equal(shipped.has(53), true, 'level 53 shipped 2026-08-21');
  assert.equal(
    exemptionForStore(SOLVER_DIR, 'candidate-levels.json').exempt,
    true,
    'level 53 ships and three winning recordings bind to it, so its exemption is armed',
  );

  assert.equal(
    exemptionForStore(SOLVER_DIR, 'candidate-levels-52.json').exempt,
    true,
    'level 52 ships and recording f0ae3e75 records a human win against its identity',
  );
  assert.equal(
    exemptionForStore(SOLVER_DIR, 'candidate-levels-54.json').exempt,
    false,
    'level 54 is unshipped, so it must block if it ever goes stale',
  );
});
