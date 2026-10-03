'use strict';
// Freeze executable closeout identities before invoking their terminal audits.
// This does not alter the measurement registration or assign a verdict.
const fs=require('node:fs');
const path=require('node:path');
const {createPin}=require('./audit-source-pin');
const {requiredAudits}=require('./recovery-closure-state');
const ROOT=path.resolve(__dirname,'../../..');
const read=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const optional=file=>fs.existsSync(path.join(ROOT,file))?read(file):null;
const dir='docs/goals/policy-terms-loop/';
function pin() {
  const plan=fs.readFileSync(path.join(ROOT,dir+'RECOVERY_PLAN.md'),'utf8');
  const {result}=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(plan)[1]);
  const closure=read(`experiments/${result}/closure.json`);
  const audits=requiredAudits({closure,controls:optional('solver/policy-lab/runs/recovery/controls-raw.json'),
    proposals:optional('solver/policy-lab/runs/recovery/proposals-raw.json'),confirmation:optional(`experiments/${result}/raw-pairs.json`),verdict:optional(`experiments/${result}/verdict.json`)});
  const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
  const receipt={...createPin([...commands.map(c=>c.split(' ')[0]),dir+'recovery-closeout.js',dir+'recovery-closure-state.js',dir+'audit-source-pin.js',dir+'pin-recovery-closeout.js'],{root:ROOT}),result,path:closure.path,commands};
  const file=path.join(ROOT,dir+'recovery-closeout-audits.json');
  fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log('CLOSEOUT_AUDIT_PIN',JSON.stringify(receipt));
}
if(require.main===module){try{pin();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={pin};
