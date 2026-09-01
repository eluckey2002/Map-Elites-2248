#!/usr/bin/env node
// Register an experiment before running it. Generates the protocol with the
// real HEAD and real file hashes, then COMMITS it — because a protocol sitting
// uncommitted records no point in time, and the point in time is the only
// thing that makes it a pre-registration.
//
//   node tools/new-experiment.js RESULT-0019

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { addedIn, sha16 } = require('./verify-experiments.js');

const ROOT = path.join(__dirname, '..');
const FROZEN_BY_DEFAULT = ['solver/bot.js', 'solver/engine.js', 'solver/policy-eval.js', 'src/game.js'];

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function main() {
  const resultId = process.argv[2];
  if (!resultId || !/^RESULT-\d+$/.test(resultId)) {
    console.error('usage: node tools/new-experiment.js RESULT-NNNN');
    process.exitCode = 1;
    return;
  }
  const dir = path.join(ROOT, 'experiments', resultId);
  // An id that was ever registered keeps its original registration commit
  // forever (addedIn takes the oldest add), so reusing one would inherit a
  // registration timestamp that belongs to a different experiment.
  const priorRegistration = addedIn(path.join('experiments', resultId, 'protocol.md'));
  if (priorRegistration) {
    console.error(`${resultId} was already registered at ${priorRegistration.slice(0, 8)}, even if the file is gone now.`);
    console.error('Ids are not reusable: git would date the new protocol from that old commit.');
    console.error('Use the next unused RESULT id.');
    process.exitCode = 1;
    return;
  }
  if (fs.existsSync(path.join(dir, 'protocol.md'))) {
    console.error(`${resultId} is already registered at experiments/${resultId}/protocol.md.`);
    console.error('A registered protocol is frozen. If the question or denominator changed,');
    console.error('that is a new record — pick the next RESULT id and supersede this one.');
    process.exitCode = 1;
    return;
  }

  const head = git(['rev-parse', 'HEAD']);
  const branch = git(['branch', '--show-current']);
  const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length;
  if (dirty > 0) {
    console.error(`Working tree has ${dirty} uncommitted change(s).`);
    console.error('Register against a clean checkout so the version freeze means something.');
    process.exitCode = 1;
    return;
  }

  const freeze = FROZEN_BY_DEFAULT
    .filter((f) => fs.existsSync(path.join(ROOT, f)))
    .map((f) => `  ${f}: ${sha16(path.join(ROOT, f))}`)
    .join('\n');

  const template = fs.readFileSync(path.join(ROOT, 'experiments', 'TEMPLATE.md'), 'utf8');
  const body = template
    .replace(/^result: RESULT-NNNN$/m, `result: ${resultId}`)
    .replace(/^registered: .*$/m, `registered: ${new Date().toISOString()}`)
    .replace(/^version_freeze:\n(?:  .*\n)+/m, `version_freeze:\n${freeze}\n`)
    .replace(/^- git HEAD <sha>, branch <name>\.$/m, `- git HEAD ${head.slice(0, 8)}, branch ${branch}.`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'protocol.md'), body);
  git(['add', path.join('experiments', resultId, 'protocol.md')]);
  git(['commit', '-m', `Register ${resultId} before running it\n\nProtocol registered against ${head.slice(0, 8)} on a clean checkout. Frozen\nfiles and their hashes are recorded in the protocol frontmatter; if any moves\nbefore the run, the record is invalid and must be superseded, not edited.`]);

  console.log(`Registered ${resultId} at commit ${git(['rev-parse', '--short', 'HEAD'])}`);
  console.log(`  1. Fill in experiments/${resultId}/protocol.md — question, checks, stopping rules.`);
  console.log('  2. Amend that commit while you are still writing it.');
  console.log(`  3. Run with --protocol ${resultId}. The guard refuses to run without it.`);
}

if (require.main === module) main();
module.exports = { FROZEN_BY_DEFAULT };
