'use strict';
// Before F only: add an executable closeout contract to the unchanged renderer.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {render}=require('./prepare-resume-confirmation-protocol');
const {failureNames,validateSuite}=require('./live-suite');
const ROOT=path.resolve(__dirname,'../../..');
const DIR='experiments/RESULT-0082/';
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
function prepare(){
  if(['raw-pairs.json','verdict.json','closure.json','report.md'].some(f=>fs.existsSync(path.join(ROOT,DIR+f)))||fs.existsSync(path.join(ROOT,'solver/policy-lab/runs/resume/confirmation')))throw new Error('F output already exists; registration cannot be rewritten');
  const suite=fs.readFileSync(path.join(ROOT,'docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt'),'utf8');
  const baseline=fs.readFileSync(path.join(ROOT,'docs/goals/policy-terms-loop/baseline-output.txt'),'utf8');
  const totals=validateSuite(suite,baseline,1);
  let body=render().replace('editss are','edits are');
  body=body.replace(/^- Full-suite totals before F: .*$/m,`- Full-suite totals before F: ${JSON.stringify(totals)}; current raw transcript is docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt.`);
  if(JSON.stringify(failureNames(suite))!==JSON.stringify(failureNames(baseline)))throw new Error('current baseline changed');
  // Avoid a circular hash: the immutable protocol snapshot predates the added
  // contract link; final protocol.md pins both snapshot and contract identities.
  const candidate=fs.readFileSync(path.join(ROOT,'solver/policy-lab/resume-frozen-candidate.js'));
  const contract={schema_version:1,protocol:{path:'registered-protocol.md',sha256:sha(body)},
    final_subject_identity:sha(candidate),required_claims:['C1','C2','C3'],
    required_artifacts:['raw-pairs','verdict','report','primary-recomputation'],requires_primary_outcome:true,
    recomputation:{argv:['node','../../solver/policy-lab/resume-proposal-recompute.js','--confirmation','--json'],cwd:'.',expected_exit_code:0,output_artifact_id:'primary-recomputation'}};
  const contractBody=JSON.stringify(contract,null,2)+'\n';
  const extra={
    [DIR+'registered-protocol.md']:sha(body).slice(0,16),[DIR+'closeout-contract.json']:sha(contractBody).slice(0,16),
    'docs/goals/policy-terms-loop/prepare-resume-registration.js':sha(fs.readFileSync(__filename)).slice(0,16),
    'docs/goals/policy-terms-loop/advance-resume-reviewed.py':sha(fs.readFileSync(path.join(ROOT,'docs/goals/policy-terms-loop/advance-resume-reviewed.py'))).slice(0,16),
    'docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt':sha(suite).slice(0,16),
  };
  const entries=Object.entries(extra).map(([f,h])=>`  ${f}: ${h}\n`).join('');
  const finalized=body.replace('version_freeze:\n','version_freeze:\n'+entries)
    +`\n## Executable closeout identity\n\nRegistered snapshot: registered-protocol.md (${sha(body)}).\nCloseout contract: closeout-contract.json (${sha(contractBody)}), committed before F.\nFinal subject identity is the exact frozen candidate code SHA256 ${sha(candidate)}.\nRequired instrument claims C1/C2/C3 govern valid closure; primary FALSIFIED\nor INCONCLUSIVE remains a valid CLOSED result, never an instrumentation failure.\n`;
  fs.writeFileSync(path.join(ROOT,DIR+'registered-protocol.md'),body,{flag:'wx'});
  fs.writeFileSync(path.join(ROOT,DIR+'closeout-contract.json'),contractBody,{flag:'wx'});
  fs.writeFileSync(path.join(ROOT,DIR+'protocol.md'),finalized);
  console.log('PREPARED_ONE_SHOT_REGISTRATION',sha(candidate),sha(contractBody));
}
if(require.main===module){try{prepare();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={prepare};
