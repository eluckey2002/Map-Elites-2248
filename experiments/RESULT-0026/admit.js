#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { RESULT, ROOT, canonicalJson, identity } = require('./subject');
const { validateChallengeReceipt, verifyArtifact } = require('./gate');
const { receiptForArtifact } = require('./recompute');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));
}

function validateIndependent(receipt, confirmation, expectedSummary) {
  const expectedReceipt = receiptForArtifact(confirmation);
  if (canonicalJson(receipt) !== canonicalJson(expectedReceipt)) {
    throw new Error('independent receipt does not match execution of the frozen recomputation');
  }
  if (canonicalJson(receipt.summary) !== canonicalJson(expectedSummary)) {
    throw new Error('independent recomputation disagrees with primary verifier');
  }
  return expectedReceipt.artifactIdentity;
}

function admissionBody(confirmation, qualification, challengeReceipt, independentReceipt) {
  const challenge = validateChallengeReceipt(challengeReceipt, qualification);
  if (confirmation.kind !== 'confirmation') throw new Error('admission requires the confirmation artifact');
  if (confirmation.challengeEntitlement?.receiptIdentity !== challenge.receiptIdentity) {
    throw new Error('confirmation did not consume this challenge receipt');
  }
  const verification = verifyArtifact(confirmation);
  const independentIdentity = validateIndependent(
    independentReceipt,
    confirmation,
    verification.summary,
  );
  return {
    schemaVersion: 1,
    result: RESULT,
    authority: 'ledger-admission',
    status: 'ADMISSIBLE',
    empiricalVerdict: verification.summary.primaryVerdict,
    confirmationIdentity: confirmation.artifactIdentity,
    challengeReceiptIdentity: challenge.receiptIdentity,
    qualificationIdentity: challenge.qualificationIdentity,
    independentRecomputationIdentity: independentIdentity,
    verification,
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  const confirmation = flag(argv, '--confirmation');
  const qualification = flag(argv, '--qualification');
  const challenge = flag(argv, '--challenge-receipt');
  const independent = flag(argv, '--independent');
  const output = flag(argv, '--out');
  if (!confirmation || !qualification || !challenge || !independent || !output) {
    throw new Error('usage: admit.js --confirmation <path> --qualification <path> --challenge-receipt <path> --independent <path> --out <path>');
  }
  const body = admissionBody(
    readJson(confirmation),
    readJson(qualification),
    readJson(challenge),
    readJson(independent),
  );
  const admission = { ...body, artifactIdentity: identity(body) };
  writeNew(path.resolve(ROOT, output), admission);
  console.log(`ADMITTED ${admission.empiricalVerdict} ${admission.artifactIdentity}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { admissionBody, validateIndependent };
