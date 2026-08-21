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

// BLOCKING, and currently RED on purpose. Levels 52 and 54 ship in the game
// with receipts measured against an older bot, so they fail here. That is a
// true fact about this project and the suite states it rather than hiding it.
//
// They were briefly archived on 2026-08-21 to make this green, and put back the
// same day: clearing a red gate by removing its input is the exact failure this
// gate exists to catch. See docs/CHECK-CARDS.md.
//
// What clears these two honestly: a deliberate re-targeting pass. Re-authoring
// alone will not do it -- the receipt derives target as `median x demand` and
// asserts the recorded median matches a fresh measurement, so refreshing the
// receipt necessarily RAISES the target of a shipped level, making it harder
// for humans because the bot got better at searching. That is a design decision
// about the difficulty curve, not a test fix.
//
// One test per store, so a failure names the offending file rather than
// reporting a count.
for (const storeName of candidateStores(SOLVER_DIR)) {
  test(`${storeName} has a receipt that verifies against the current bot`, () => {
    const fault = faultFor(SOLVER_DIR, storeName);
    assert.equal(
      fault,
      null,
      `${storeName}: ${fault}\n` +
        'This receipt was measured against different code. Re-author the ' +
        'candidate against the current bot, or move it to ' +
        'solver/candidates-archive/ and stop quoting its numbers. Do not ' +
        'weaken this check to clear it.',
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
