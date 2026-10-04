'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;const read=p=>fs.readFileSync(path.join(dir,p),'utf8').trim();
const j=p=>JSON.parse(read(p));
console.log('$ Goal 3 revision 5 / RESULT-0083 / PATH E raw report');
const start=j('start-state.json');
console.log('$ git rev-parse HEAD; git branch --show-current (captured start)');
console.log(start.HEAD+'\n'+start.branch);
console.log('$ preliminary remote scan (superseded by literal-ID scan below)');
console.log(JSON.stringify({assigned:start.assigned,checkedRemoteRefs:start.remoteChecks.length,conflictingAssignedIdRefs:start.remoteChecks.filter(r=>r.assignedIdHits.length).map(r=>({ref:r.ref,matchingPathCount:r.assignedIdHits.length})),maximumExperimentDirectory:Math.max(...start.remoteChecks.map(r=>r.maxDirectoryId)),possibleSeedOverlapRows:start.possibleSeedOverlapRows},null,2));
const id=j('result-id-final-check.json'); console.log('$ final literal result-ID scan before publication');console.log(JSON.stringify({assigned:id.assigned,checkedRefs:id.checkedRefs,matches:id.matches,maximumOtherExperimentDirectory:id.maximumOtherExperimentDirectory},null,2));
console.log('$ node --test solver/tests/*.test.js (captured baseline)');console.log(read('baseline-summary-output.txt'));
console.log('$ experiments/SEEDS.md read at start');
const saved=read('start-output.txt');console.log(saved.slice(saved.indexOf('SEEDS.md:')));
console.log('$ node solver/policy-fit/preflight.js (retained historical output)');console.log(read('preflight-output.txt').split('\n').filter(line=>!line.startsWith('HUMAN BENCHMARK ')).join('\n'));
console.log('Same-seed recorded-board rows retained in human-benchmark.json');
console.log('$ git rev-parse HEAD (plan commit, before any fresh game)');console.log(read('plan-commit.txt'));
console.log('$ node solver/policy-fit/recompute-preflight.js');console.log(read('recompute-output.txt'));
console.log('$ node --test solver/tests/policyFitGeneration.test.js solver/tests/policyFitHistoricalCoverage.test.js solver/tests/policyFitInputManifest.test.js');console.log(read('qualification-output.txt'));
if(fs.existsSync(path.join(dir,'review-oracle-tests.txt'))){console.log('$ node --test solver/tests/policyFitReviewEvidence.test.js');console.log(read('review-oracle-tests.txt'));}
console.log('$ node solver/policy-fit/check-coverage.js');console.log(read('coverage-output.txt'));
console.log('$ game accounting');console.log(read('budget.json'));
console.log('PATH E: items 1–4 complete. Items 5–11: not run / UNVERIFIED_NOT_RUN. No claim about moves outside the diagnostic subset.');
if(fs.existsSync(path.join(dir,'closeout-output.txt'))) {console.log('$ final closeout checks');console.log(read('closeout-output.txt'));}else console.log('UNVERIFIED: closeout checks not yet collected');
if(fs.existsSync(path.join(dir,'publication-output.json'))) {console.log('$ live GitHub publication state');console.log(read('publication-output.json'));}else console.log('UNVERIFIED: publication and actual Codex review not yet collected');

if(fs.existsSync(path.join(dir,'CLOSEOUT_BLOCKER.md'))&&!fs.existsSync(path.join(dir,'OWNER_TEST_EXCEPTION.txt'))) {console.log('CURRENT FINISH: UNVERIFIED; required owner exception pending');console.log(read('CLOSEOUT_BLOCKER.md'));console.log(read('closeout-blocker-output.txt'));}

if(fs.existsSync(path.join(dir,'OWNER_TEST_EXCEPTION.txt'))) {console.log('$ owner-authorized test boundary exception');console.log(read('OWNER_TEST_EXCEPTION.txt'));}
