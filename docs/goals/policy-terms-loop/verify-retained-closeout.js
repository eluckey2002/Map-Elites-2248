'use strict';
// Recurring full-tree check. No games, evidence writes, or self-acceptance.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requiredAudits}=require('./recovery-closure-state');
const {loadInputs,assertBindings,evidencePaths}=require('./closure-inputs');
const {verifyPin,readAnchoredPin}=require('./audit-source-pin');
const {audit,verifyFailure,MANIFEST,RAW}=require('./interrupted-recovery');
const dir='docs/goals/policy-terms-loop/';
const failureSources=(result,root)=>{
  const raw=JSON.parse(fs.readFileSync(path.join(root,RAW),'utf8'));
  return [...new Set([dir+'interrupted-recovery.js',dir+'verify-retained-closeout.js',dir+'closure-inputs.js',dir+'audit-source-pin.js',
    'solver/policy-lab/recovery-recompute.js',dir+'RECOVERY_PLAN.md',MANIFEST,RAW,dir+'recovery-transport-observation.json',`experiments/${result}/closure.json`,
    ...Object.keys(raw.config.harnessFreeze),...Object.keys(raw.config.carryForward.sourceHashes)])].sort();
};
function verify(root) {
  const plan=fs.readFileSync(path.join(root,dir+'RECOVERY_PLAN.md'),'utf8');
  const {result}=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(plan)[1]);
  const receipt=path.join(root,dir+'recovery-closeout-audits.json');
  const file=path.join(root,`experiments/${result}/closure.json`);
  if(!fs.existsSync(receipt)&&!fs.existsSync(file))return{pending:true};
  if(fs.existsSync(file)){
    const failed=JSON.parse(fs.readFileSync(file,'utf8'));
    if(failed.closure_status==='UNVERIFIED'){
      if(fs.existsSync(receipt))throw new Error('failed interruption cannot retain a completed-path audit pin');
      const pin=readAnchoredPin(dir+'recovery-interruption-audits.json',{root});
      if(pin.result!==result||pin.disposition!=='UNVERIFIED')throw new Error('failed receipt pin identity differs');
      verifyPin(pin,failureSources(result,root),{root});
      const observed=audit(root),retained=JSON.parse(fs.readFileSync(path.join(root,MANIFEST),'utf8'));
      if(JSON.stringify(observed)!==JSON.stringify(retained))throw new Error('partial journal differs from pinned interruption manifest');
      verifyFailure(failed,observed);assertBindings(failed,loadInputs(root,result));
      const numeric=execFileSync(process.execPath,['solver/policy-lab/recovery-recompute.js'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
      if(!numeric.includes('MATCH retained arithmetic')||!numeric.includes('UNVERIFIED aggregate'))throw new Error('failed-receipt independent arithmetic disposition differs');
      return{pending:false,failedReceipt:true,scientificComplete:false,result,path:'NONE',closure_status:'UNVERIFIED'};
    }
  }
  if(!fs.existsSync(receipt)||!fs.existsSync(file))throw new Error('retained closure and audit pin must both exist');
  const pin=readAnchoredPin(dir+'recovery-closeout-audits.json',{root});
  const closure=JSON.parse(fs.readFileSync(file,'utf8'));
  const inputs=loadInputs(root,result);assertBindings(closure,inputs);
  const audits=requiredAudits({...inputs,closure});
  const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
  if(pin.result!==result||pin.path!==closure.path||JSON.stringify(pin.commands)!==JSON.stringify(commands))throw new Error('retained audit pin does not bind this closure');
  verifyPin(pin,[...commands.map(c=>c.split(' ')[0]),...evidencePaths(result,closure,inputs),...['recovery-closeout.js','recovery-closure-state.js','audit-source-pin.js','pin-recovery-closeout.js','closure-inputs.js','verify-retained-closeout.js'].map(f=>dir+f)],{root});
  return{pending:false,result,path:closure.path,sourceCommit:pin.sourceCommit};
}
if(require.main===module){try{console.log('RETAINED_CLOSEOUT',JSON.stringify(verify(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={verify,failureSources};
