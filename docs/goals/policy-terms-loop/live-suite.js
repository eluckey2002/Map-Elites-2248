'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const failureNames=s=>s.split('\n').filter(l=>/^not ok /.test(l)).map(l=>l.replace(/^not ok \d+ - /,'')).sort();
function validateSuite(output,baseline,status){
  if(status!==1||JSON.stringify(failureNames(output))!==JSON.stringify(failureNames(baseline))
    ||!/^# fail 3$/m.test(output)||!/^# skipped 1$/m.test(output)||!/^# cancelled 0$/m.test(output))throw new Error('current full suite does not match the original named failures and skip');
  const fields={};for(const key of ['tests','pass','fail','skipped']){
    const found=output.match(new RegExp('^# '+key+' (\\d+)$','m'));if(!found)throw new Error('incomplete current test transcript');fields[key]=Number(found[1]);
  }
  if(fields.tests!==fields.pass+fields.fail+fields.skipped)throw new Error('current test totals differ');
  return fields;
}
function runCurrentSuite(root,{execute=execFileSync}={}){
  const files=fs.readdirSync(path.join(root,'solver/tests')).filter(f=>f.endsWith('.test.js')).sort().map(f=>'solver/tests/'+f);
  if(!files.length)throw new Error('current test discovery is empty');
  const suiteEnv={...process.env};delete suiteEnv.NODE_TEST_CONTEXT;
  let output,status=0;
  try{output=execute(process.execPath,['--test','--test-reporter=tap',...files],{cwd:root,env:suiteEnv,encoding:'utf8',maxBuffer:64*1024*1024});}
  catch(error){if(error.status!==1||typeof error.stdout!=='string')throw error;output=error.stdout;status=error.status;}
  const baseline=fs.readFileSync(path.join(root,'docs/goals/policy-terms-loop/baseline-output.txt'),'utf8');
  let totals;try{totals=validateSuite(output,baseline,status);}catch(error){error.stdout=output;throw error;}
  return{output,status,totals,files};
}
if(require.main===module){
  try{const current=runCurrentSuite(path.resolve(__dirname,'../../..'));process.stdout.write(current.output);console.log('PASS freshly executed full suite',JSON.stringify(current.totals));}
  catch(error){if(error.stdout)process.stdout.write(error.stdout);console.error(error.stack);process.exitCode=1;}
}
module.exports={runCurrentSuite,validateSuite,failureNames};
