'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function loadInputs(root,result) {
  const inputs={result,artifacts:{}};
  for(const [id,file] of Object.entries({controls:'solver/policy-lab/runs/resume/controls-raw.json',
    proposals:'solver/policy-lab/runs/resume/proposals-raw.json',confirmation:`experiments/${result}/raw-pairs.json`,verdict:`experiments/${result}/verdict.json`})){
    const full=path.join(root,file);
    if(!fs.existsSync(full)){inputs[id]=null;continue;}
    const bytes=fs.readFileSync(full);inputs[id]=JSON.parse(bytes);
    inputs.artifacts[id]={path:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }
  return inputs;
}
function assertBindings(closure,inputs) {
  const {result,controls,proposals,confirmation,artifacts}=inputs;
  if(closure.result!==result||!controls||controls.result!==result
    ||(proposals&&proposals.result!==result)||(confirmation&&confirmation.result!==result))throw new Error('closure result identity differs from audited inputs');
  const registration=closure.registration;
  for(const key of ['recoveryPlanCommit','originalPlanCommit','previousPlanCommit'])if(registration?.[key]!==controls.registration[key])throw new Error(`closure registration differs: ${key}`);
  if(proposals&&registration.phaseCommit!==proposals.registration.phaseCommit)throw new Error('closure proposal phase identity differs');
  if(confirmation){
    for(const key of ['protocol','protocolCommit','exploratory'])if(registration[key]!==confirmation.registration[key])throw new Error(`closure confirmation identity differs: ${key}`);
    if(!inputs.verdict||inputs.verdict.result!==result||closure.primary_outcome!==inputs.verdict.primaryOutcome)throw new Error('closure primary outcome differs from retained verdict');
  }else if(registration.exploratory!==true)throw new Error('direct-source closure must retain exploratory standing');
  if(JSON.stringify(closure.diagnosticInputs)!==JSON.stringify(artifacts))throw new Error('closure raw artifact paths or hashes differ');
  const final=confirmation||proposals||controls;
  if(JSON.stringify(closure.chargedAccounting)!==JSON.stringify(final.counts))throw new Error('closure charged accounting differs');
  if(closure.proposalRounds!==(proposals?.proposalRounds||0))throw new Error('closure proposal-round accounting differs');
  return true;
}
function evidencePaths(result,closure,inputs) {
  const directory=`experiments/${result}/`;
  const inside=relative=>{
    if(typeof relative!=='string'||path.posix.isAbsolute(relative))throw new Error('escaping closure artifact');
    const full=path.posix.normalize(directory+relative);
    if(!full.startsWith(directory))throw new Error('escaping closure artifact');
    return full;
  };
  return [...new Set([directory+'closure.json',...Object.values(inputs.artifacts).map(a=>a.path),
    ...Object.keys(inputs.controls?.config?.harnessFreeze||{}),
    ...Object.keys(inputs.controls?.config?.carryForward?.sourceHashes||{}),
    ...Object.keys(inputs.proposals?.sourceHashes||{}),
    ...Object.keys(inputs.confirmation?.sources||{}),
    ...(closure.contract?[inside(closure.contract.path)]:[]),...(closure.artifacts||[]).map(a=>inside(a.path))])].sort();
}
module.exports={loadInputs,assertBindings,evidencePaths};
