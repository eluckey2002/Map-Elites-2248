// Refuse to produce evidence for a generalizing claim before the claim was
// registered. Called by every experiment script at startup, BEFORE any compute
// is spent — catching this at test time means the run already cost 30 minutes
// and the results already exist, which is exactly when backfilling gets
// tempting.
//
//   const { requireProtocol } = require('./experiment-guard');
//   const registration = requireProtocol(process.argv);
//   // ... registration.protocolCommit goes into the output artifact

const fs = require('node:fs');
const path = require('node:path');
const {
  addedIn, canonicalJson, freezeProblem, parseFrontmatter, protocolDrift, sha16, showAtCommit,
} = require('../tools/verify-experiments.js');

const ROOT = path.join(__dirname, '..');

class UnregisteredExperiment extends Error {}

function flagValue(argv, name) {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return null;
  const next = argv[index + 1];
  return next && !next.startsWith('--') ? next : null;
}

function requireProtocol(argv, { name = 'this experiment', root = ROOT } = {}) {
  if (argv.includes('--exploratory')) {
    return { exploratory: true, protocolCommit: null, resultId: null };
  }

  const resultId = flagValue(argv, 'protocol');
  if (!resultId) {
    throw new UnregisteredExperiment(
      `${name} produces evidence for a claim that generalizes, so it needs a registered protocol.\n`
      + '  Register one:  node tools/new-experiment.js RESULT-NNNN\n'
      + '  Then run with: --protocol RESULT-NNNN\n'
      + '  Just poking around? --exploratory runs without one, but stamps the output\n'
      + '  exploratory and the ledger gate will not let it back a heuristic_observation.',
    );
  }
  if (!/^RESULT-\d+$/.test(resultId)) {
    throw new UnregisteredExperiment(`--protocol expects RESULT-NNNN, got "${resultId}"`);
  }

  const rel = path.join('experiments', resultId, 'protocol.md');
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    throw new UnregisteredExperiment(
      `No protocol at ${rel}. Register it before running, not after:\n`
      + `  node tools/new-experiment.js ${resultId}`,
    );
  }

  const protocolCommit = addedIn(rel, root);
  if (!protocolCommit) {
    throw new UnregisteredExperiment(
      `${rel} exists but is not committed. An uncommitted protocol records no point in time,\n`
      + '  which is the only thing that makes it a PRE-registration. Commit it, then run.',
    );
  }

  const diskBytes = fs.readFileSync(abs);
  const diskText = diskBytes.toString('utf8');
  const front = parseFrontmatter(diskText);
  if (!front) throw new UnregisteredExperiment(`${rel} has no frontmatter`);
  if (front.result !== resultId) {
    throw new UnregisteredExperiment(`${rel} declares result ${front.result}, not ${resultId}`);
  }
  if (front.status !== 'registered') {
    throw new UnregisteredExperiment(
      `${rel} is status: ${front.status}. A finished or superseded protocol cannot mint new evidence;\n`
      + '  register a new one that supersedes it.',
    );
  }

  // The freeze is read from the registration commit, not from disk. The
  // working-tree copy is whatever the experimenter last wrote; the committed
  // copy is the one that provably predates the data. If the two disagree, the
  // protocol was rewritten after registration, which is the edit the freeze
  // exists to make impossible.
  const registeredBytes = showAtCommit(protocolCommit, rel, root, { raw: true }) || Buffer.alloc(0);
  const registeredText = registeredBytes.toString('utf8');
  const registered = parseFrontmatter(registeredText);
  const commit8 = protocolCommit.slice(0, 8);
  if (!registered) {
    throw new UnregisteredExperiment(`${rel} has no frontmatter at its registration commit ${commit8}`);
  }
  if (registered.result !== resultId) {
    throw new UnregisteredExperiment(`${rel} at ${commit8} declares result ${registered.result}, not ${resultId}`);
  }
  const emptiness = freezeProblem(registered.version_freeze);
  if (emptiness) {
    throw new UnregisteredExperiment(
      `${rel} at registration ${commit8} ${emptiness}.\n`
      + '  A protocol that freezes nothing cannot show what code the evidence came from.\n'
      + `  Register with: node tools/new-experiment.js ${resultId}  (it records real hashes)`,
    );
  }
  const freeze = registered.version_freeze;
  if (canonicalJson(front.version_freeze || null) !== canonicalJson(freeze)) {
    throw new UnregisteredExperiment(
      `${rel} version_freeze on disk differs from the copy registered at ${commit8}.\n`
      + '  A protocol rewritten after registration is a reconstruction, not a pre-registration.\n'
      + '  Restore the registered copy, or supersede it with a new protocol against the current code.',
    );
  }

  // Beyond the freeze: the question, checks, thresholds, stopping rules and
  // seeds are the pre-registration. Only `status:` may differ from the
  // registration commit. (BL-0007 item 1, closed 2026-09-03.)
  const drift = protocolDrift(diskBytes, registeredBytes);
  if (drift) {
    throw new UnregisteredExperiment(
      `${rel} differs from the copy registered at ${commit8} beyond the status line\n`
      + `  (${drift}).\n`
      + '  A protocol edited after registration is a reconstruction, not a pre-registration.\n'
      + '  Restore the registered copy, or supersede it with a new protocol.',
    );
  }

  for (const [file, expected] of Object.entries(freeze)) {
    const target = path.join(root, file);
    if (!fs.existsSync(target)) {
      throw new UnregisteredExperiment(`${rel} freezes ${file}, which is missing`);
    }
    const actual = sha16(target);
    if (actual !== expected) {
      throw new UnregisteredExperiment(
        `Version freeze broken before the run: ${file} is ${actual}, registered as ${expected}.\n`
        + '  This record is invalid. Supersede it with a new protocol against the current code;\n'
        + '  do not edit the frozen one. (This is what invalidated chain-offer-v1.)',
      );
    }
  }

  return { exploratory: false, protocolCommit, resultId };
}

// Every experiment artifact carries the registration it was produced under, so
// the evidence itself proves the protocol predated it — a commit SHA that did
// not exist yet cannot be embedded.
function registrationStamp(registration) {
  return registration.exploratory
    ? { exploratory: true }
    : { exploratory: false, protocol: registration.resultId, protocolCommit: registration.protocolCommit };
}

// CLI wrapper: an unregistered run is a rule being enforced, not a crash, so
// it prints the reason and exits 1 instead of throwing a stack trace an agent
// might read as a bug worth working around.
function requireProtocolOrExit(argv, options) {
  try {
    return requireProtocol(argv, options);
  } catch (error) {
    if (!(error instanceof UnregisteredExperiment)) throw error;
    console.error(`\nEXPERIMENT NOT REGISTERED\n\n${error.message}\n`);
    process.exit(1);
  }
  return null;
}

module.exports = {
  UnregisteredExperiment, flagValue, registrationStamp, requireProtocol, requireProtocolOrExit,
};
