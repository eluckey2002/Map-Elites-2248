'use strict';
// Operational output-capacity repair. Preserve all original audit arguments,
// output bytes, exit codes and explicit limits; no measurement code changes.
const childProcess=require('node:child_process');
const path=require('node:path');
const {readAnchoredPin,verifyPin}=require('./audit-source-pin');
const ROOT=path.resolve(__dirname,'../../..');
const DIR='docs/goals/policy-terms-loop/';
const FILES=[DIR+'resume-terminal-buffer.js',DIR+'resume-closeout.js',DIR+'audit-source-pin.js',
  DIR+'resume-closeout-audits.json',DIR+'resume-terminal-buffer-failure.txt',
  DIR+'resume-terminal-buffer-tests.txt','solver/tests/policyLabTerminalBuffer.test.js'];
function withCompleteGitOutput(run){
  const original=childProcess.execFileSync;
  childProcess.execFileSync=function(command,args,options){
    const settings=command==='git'&&options?.maxBuffer===undefined
      ?{...options,maxBuffer:64*1024*1024}:options;
    return original(command,args,settings);
  };
  try{return run();}finally{childProcess.execFileSync=original;}
}
function main(){
  const pin=readAnchoredPin(DIR+'resume-terminal-buffer-pin.json',{root:ROOT});
  if(pin.result!=='RESULT-0082'||pin.operation!=='complete terminal Git output')throw new Error('wrong operational repair pin');
  verifyPin(pin,FILES,{root:ROOT});
  console.log('PASS separately anchored Git output-capacity repair',JSON.stringify(pin));
  return withCompleteGitOutput(()=>require('./resume-closeout.js'));
}
if(require.main===module){try{main();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={withCompleteGitOutput,FILES};
