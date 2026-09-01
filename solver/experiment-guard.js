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
  addedIn, parseFrontmatter, sha16,
} = require('../tools/verify-experiments.js');

const ROOT = path.join(__dirname, '..');

class UnregisteredExperiment extends Error {}

function flagValue(argv, name) {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return null;
  const next = argv[index + 1];
  return next && !next.startsWith('--') ? next : null;
}

function requireProtocol(argv, { name = 'this experiment' } = {}) {
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
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    throw new UnregisteredExperiment(
      `No protocol at ${rel}. Register it before running, not after:\n`
      + `  node tools/new-experiment.js ${resultId}`,
    );
  }

  const protocolCommit = addedIn(rel);
  if (!protocolCommit) {
    throw new UnregisteredExperiment(
      `${rel} exists but is not committed. An uncommitted protocol records no point in time,\n`
      + '  which is the only thing that makes it a PRE-registration. Commit it, then run.',
    );
  }

  const front = parseFrontmatter(fs.readFileSync(abs, 'utf8'));
  if (!front) throw new UnregisteredExperiment(`${rel} has no frontmatter`);
  if (front.result !== resultId) {
    throw new UnregisteredExperiment(`${rel} declares result ${front.result}, not ${resultId}`);
  }

  const freeze = front.version_freeze;
  if (freeze && typeof freeze === 'object') {
    for (const [file, expected] of Object.entries(freeze)) {
      if (String(expected).startsWith('<')) continue;
      const target = path.join(ROOT, file);
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

module.exports = { UnregisteredExperiment, flagValue, registrationStamp, requireProtocol };
