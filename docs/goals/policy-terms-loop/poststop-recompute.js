'use strict';
// Runs the exact committed independent reducer; does not import a runner,
// statistics producer, chooser, or game loop. The sole historical fixture
// read is the explicitly disclosed, approved inventory-test exception.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../..');
const DIR='docs/goals/policy-terms-loop/';
const INVENTORY='solver/tests/failedRunLedger.test.js';
const OLD_PIN=DIR+'recovery-interruption-audits.json';
const PIN=DIR+'poststop-exception-audits.json';
const APPROVAL=DIR+'POST_STOP_APPROVAL.txt';
const NUMERIC='solver/policy-lab/recovery-recompute.js';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(root,args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
function anchored(root,file){
  const bytes=fs.readFileSync(path.join(root,file));
  const additions=git(root,['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--',file]).toString().trim().split('\n').filter(Boolean);
  if(additions.length!==1)throw new Error('post-stop receipt requires one committed addition');
  if(digest(bytes)!==digest(git(root,['show',additions[0]+':'+file])))throw new Error('post-stop receipt differs from its first-added identity');
  const value=JSON.parse(bytes);git(root,['merge-base','--is-ancestor',value.sourceCommit,additions[0]]);return value;
}
function inventoryException(before,current){
  const needle="'RESULT-0036', 'RESULT-0037', 'RESULT-0041', 'RESULT-0042', 'RESULT-0080',";
  if(before.split(needle).length!==2||current!==before.replace(needle,needle+" 'RESULT-0081',"))throw new Error('inventory differs beyond the approved RESULT-0081 addition');
  return{path:INVENTORY,beforeSha256:digest(before),afterSha256:digest(current)};
}
function validate(root=ROOT){
  const previous=anchored(root,OLD_PIN),pin=anchored(root,PIN);
  if(pin.result!=='RESULT-0081'||pin.disposition!=='UNVERIFIED'||pin.scientificComplete!==false||pin.previousPinSha256!==digest(fs.readFileSync(path.join(root,OLD_PIN))))throw new Error('post-stop pin does not bind the historical failure');
  const before=git(root,['show',previous.sourceCommit+':'+INVENTORY]).toString();
  if(digest(before)!==previous.sourceHashes[INVENTORY])throw new Error('historical inventory identity differs');
  const exception=inventoryException(before,fs.readFileSync(path.join(root,INVENTORY),'utf8'));
  if(JSON.stringify(exception)!==JSON.stringify(pin.inventoryException))throw new Error('post-stop inventory receipt differs');
  for(const file of [APPROVAL,PIN.replace('poststop-exception-audits.json','poststop-recompute.js'),NUMERIC,INVENTORY,OLD_PIN]){
    const hash=pin.sourceHashes[file];if(!hash||digest(fs.readFileSync(path.join(root,file)))!==hash||digest(git(root,['show',pin.sourceCommit+':'+file]))!==hash)throw new Error('post-stop committed source differs '+file);
  }
  const approval=fs.readFileSync(path.join(root,APPROVAL),'utf8');
  if(!approval.includes('"You have my approval to move this forward"')||!approval.includes('apply exactly the one-line RESULT-0081 inventory addition'))throw new Error('post-stop authorization absent');
  const source=fs.readFileSync(path.join(root,NUMERIC),'utf8');
  if(digest(source)!==previous.sourceHashes[NUMERIC])throw new Error('original independent reducer changed');
  return{pin,previous,before,exception,source};
}
function recompute(root=ROOT,{print=console.log}={}){
  const checked=validate(root),target=path.resolve(root,INVENTORY);
  print('APPROVED_POST_STOP_INVENTORY',JSON.stringify({...checked.exception,historicalFixtureSource:checked.previous.sourceCommit+':'+INVENTORY}));
  const historicalFs={...fs,readFileSync(file,options){
    if(typeof file==='string'&&path.resolve(file)===target){const bytes=Buffer.from(checked.before);return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;}
    return fs.readFileSync(file,options);
  }};
  const moduleObject={exports:{}},execution={argv:[process.execPath,NUMERIC],execPath:process.execPath,exitCode:0};
  const allowed=new Set(['node:fs','node:path','node:crypto','node:child_process']);
  const builtinRequire=name=>{if(!allowed.has(name))throw new Error('independent reducer attempted a non-builtin import');return name==='node:fs'?historicalFs:require(name);};
  builtinRequire.main=moduleObject;
  vm.runInNewContext(checked.source,{require:builtinRequire,module:moduleObject,__dirname:path.join(root,'solver/policy-lab'),process:execution,
    console:{log:(...args)=>print(...args),error:(...args)=>print(...args)},structuredClone,Buffer},{filename:NUMERIC});
  if(execution.exitCode)throw new Error('historical independent reducer refused the retained inputs');
}
if(require.main===module){try{recompute();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={inventoryException,validate,recompute,PIN,OLD_PIN,APPROVAL,INVENTORY,NUMERIC};
