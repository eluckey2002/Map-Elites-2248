'use strict';
// Append-only pin exception for an exact operational navigation correction.
// Never permits changed claims, scientific sources, raw data or old receipts.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {parseLedgerRecords,renderIndex}=require('../../../tools/ledger-index');
const DIR='docs/goals/policy-terms-loop/';
const BASE='d9b5475fd5faaadc7ca6d6b296030592e31d6294';
const OLD_ADAPTER='9b86b3b21d71ca033b35dac58efd315337320e32c59cef71325e6ab648f68f17';
const NAV=['EVIDENCE_LEDGER.md','CURRENT.md','LEDGER-INDEX.md'];
const NOTE='\n  Verification-routing correction, 2026-10-04: the original recipe at d9b5475fd5faaadc7ca6d6b296030592e31d6294 is retained by the immutable original closeout pin. The two executable commands above now use the reviewed full-history entry point. This changes navigation only; the statement, proof class, standing, author, measurements, subject, artifacts and original receipts remain unchanged. The separate routing-correction pin binds the exact new navigation and adapter bytes.\n';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
function expectedNavigation(root,base=BASE){
  const before=git(root,['show',base+':EVIDENCE_LEDGER.md']);
  const start=before.indexOf('### RESULT-0082 '),end=before.indexOf('\n## Assembly cut log',start);
  if(start<0||end<0)throw new Error('missing historical RESULT-0082');
  let record=before.slice(start,end);
  const oldTerminal='`node '+DIR+'resume-closeout.js`',oldVerify='`node '+DIR+'verify-resume-closeout.js`';
  if(record.split(oldTerminal).length!==2||record.split(oldVerify).length!==2)throw new Error('ambiguous historical routing');
  record=record.replace(oldTerminal,'`node '+DIR+'resume-reviewed-closeout.js --terminal`')
    .replace(oldVerify,'`node '+DIR+'resume-reviewed-closeout.js --verify`')+NOTE;
  const ledger=before.slice(0,start)+record+before.slice(end);
  const oldCurrent=git(root,['show',base+':CURRENT.md']);
  const oldLink='[completed-path verifier]('+DIR+'verify-resume-closeout.js)';
  if(oldCurrent.split(oldLink).length!==2)throw new Error('ambiguous CURRENT routing');
  const current=oldCurrent.replace(oldLink,'[completed-path verifier]('+DIR+'resume-reviewed-closeout.js)');
  return{'EVIDENCE_LEDGER.md':ledger,'CURRENT.md':current,'LEDGER-INDEX.md':renderIndex(parseLedgerRecords(ledger))};
}
function validateNavigation(root,base=BASE){
  for(const[file,expected]of Object.entries(expectedNavigation(root,base)))
    if(fs.readFileSync(path.join(root,file),'utf8')!==expected)throw new Error('routing correction changes more than the exact navigation: '+file);
  return true;
}
function verifyCorrectedInput(previous,file,expected,{root}){
  if(file===DIR+'audit-source-pin.js'){
    if(expected!==OLD_ADAPTER)throw new Error('unexpected historical pin adapter identity');
  }else if(!NAV.includes(file)||previous.sourceCommit!==BASE)throw new Error('unapproved pin exception: '+file);
  const {readAnchoredPin}=require('./audit-source-pin');
  const pin=readAnchoredPin(DIR+'resume-route-correction-pin.json',{root});
  if(pin.result!=='RESULT-0082'||pin.operation!=='exact authoritative reverify routing correction'||pin.previousAdapterSha256!==OLD_ADAPTER||pin.navigationBase!==BASE)throw new Error('wrong routing correction pin');
  // Check every amended-source identity directly, avoiding recursive exceptions.
  for(const[name,digest]of Object.entries(pin.sourceHashes)){
    if(sha(fs.readFileSync(path.join(root,name)))!==digest||sha(execFileSync('git',['show',pin.sourceCommit+':'+name],{cwd:root,maxBuffer:64*1024*1024}))!==digest)throw new Error('routing correction input drift: '+name);
  }
  if(!pin.sourceHashes[file])throw new Error('corrected input is not pinned: '+file);
  if(sha(execFileSync('git',['show',previous.sourceCommit+':'+file],{cwd:root,maxBuffer:64*1024*1024}))!==expected)throw new Error('historical pinned input differs: '+file);
  validateNavigation(root);
  // Even a historical command must pass the current stronger custody proof.
  require('./resume-reviewed-proof').audit(root);
  return true;
}
module.exports={expectedNavigation,validateNavigation,verifyCorrectedInput,BASE,OLD_ADAPTER,NAV,NOTE};
