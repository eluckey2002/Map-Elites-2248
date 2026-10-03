'use strict';
// Recurring full-tree check. No games, evidence writes, or self-acceptance.
const fs=require('node:fs');
const path=require('node:path');
const {requiredAudits}=require('./recovery-closure-state');
const {loadInputs,assertBindings}=require('./closure-inputs');
const {verifyPin}=require('./audit-source-pin');
const dir='docs/goals/policy-terms-loop/';
function verify(root) {
  const plan=fs.readFileSync(path.join(root,dir+'RECOVERY_PLAN.md'),'utf8');
  const {result}=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(plan)[1]);
  const receipt=path.join(root,dir+'recovery-closeout-audits.json');
  const file=path.join(root,`experiments/${result}/closure.json`);
  if(!fs.existsSync(receipt)&&!fs.existsSync(file))return{pending:true};
  if(!fs.existsSync(receipt)||!fs.existsSync(file))throw new Error('retained closure and audit pin must both exist');
  const closure=JSON.parse(fs.readFileSync(file,'utf8'));
  const inputs=loadInputs(root,result);assertBindings(closure,inputs);
  const audits=requiredAudits({...inputs,closure});
  const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
  const pin=JSON.parse(fs.readFileSync(receipt,'utf8'));
  if(pin.result!==result||pin.path!==closure.path||JSON.stringify(pin.commands)!==JSON.stringify(commands))throw new Error('retained audit pin does not bind this closure');
  verifyPin(pin,[...commands.map(c=>c.split(' ')[0]),...['recovery-closeout.js','recovery-closure-state.js','audit-source-pin.js','pin-recovery-closeout.js','closure-inputs.js','verify-retained-closeout.js'].map(f=>dir+f)],{root});
  return{pending:false,result,path:closure.path,sourceCommit:pin.sourceCommit};
}
if(require.main===module){try{console.log('RETAINED_CLOSEOUT',JSON.stringify(verify(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={verify};
