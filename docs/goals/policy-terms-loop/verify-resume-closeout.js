'use strict';
// Read-only recurring fence. Never launches games or turns a live phase into a result.
const fs=require('node:fs');
const path=require('node:path');
const {loadInputs,assertBindings,evidencePaths}=require('./resume-closure-inputs');
const {requiredAudits}=require('./resume-closure-state');
const {requireCompletedAudit}=require('./resume-closure-state');
const {execFileSync}=require('node:child_process');
const {audit:proofAudit}=require('./resume-proof-audit');
const {requireHandoff}=require('./resume-handoff-presence');
const {verifyPin,readAnchoredPin}=require('./audit-source-pin');
const DIR='docs/goals/policy-terms-loop/';
function executePinnedAudits(root,audits,closure,{execute=execFileSync}={}){
  for(const command of audits){
    const output=execute(process.execPath,command.split(' '),{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
    requireCompletedAudit(command,output,closure);
  }
}
function verify(root){
  const plan=fs.readFileSync(path.join(root,DIR+'RESUME_PLAN.md'),'utf8');
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(plan)[1]);
  const file=`experiments/${config.result}/closure.json`,receipt=DIR+'resume-closeout-audits.json';
  if(!fs.existsSync(path.join(root,file))&&!fs.existsSync(path.join(root,receipt)))return{pending:true,scientificComplete:false,result:config.result};
  if(!fs.existsSync(path.join(root,file))||!fs.existsSync(path.join(root,receipt)))throw new Error('retained completed closure and committed audit pin must both exist');
  requireHandoff(root,config.result);
  const closure=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const inputs=loadInputs(root,config.result);assertBindings(closure,inputs);
  const audits=requiredAudits({...inputs,closure});
  const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
  const pin=readAnchoredPin(receipt,{root});
  if(pin.result!==config.result||pin.path!==closure.path||JSON.stringify(pin.commands)!==JSON.stringify(commands))throw new Error('committed pin does not bind this closure and command list');
  const files=[...commands.map(c=>c.split(' ')[0]),...evidencePaths(config.result,closure,inputs),
    ...['resume-closeout.js','resume-closure-state.js','audit-source-pin.js','pin-resume-closeout.js','resume-closure-inputs.js','verify-resume-closeout.js'].map(f=>DIR+f)];
  verifyPin(pin,files,{root});
  executePinnedAudits(root,audits,closure);
  if(closure.path==='A')proofAudit(root);
  return{pending:false,scientificComplete:true,result:config.result,path:closure.path,sourceCommit:pin.sourceCommit,scientificAcceptance:false};
}
if(require.main===module){try{console.log('RETAINED_RESUMED_CLOSEOUT',JSON.stringify(verify(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={verify,executePinnedAudits};
