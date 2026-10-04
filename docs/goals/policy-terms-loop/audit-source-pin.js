'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function createPin(files,{root}) {
  const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const sourceHashes={};
  for(const file of [...new Set(files)].sort()){
    const committed=execFileSync('git',['show',`${sourceCommit}:${file}`],{cwd:root,maxBuffer:64*1024*1024});
    const actual=fs.readFileSync(path.join(root,file));
    if(digest(committed)!==digest(actual))throw new Error(`audit must be committed before pinning: ${file}`);
    sourceHashes[file]=digest(actual);
  }
  return{kind:'committed-closeout-audit-identities',sourceCommit,sourceHashes};
}
function verifyPin(pin,requiredFiles,{root}) {
  if(pin?.kind!=='committed-closeout-audit-identities'||!pin.sourceCommit||!pin.sourceHashes)throw new Error('committed closeout audit pin required');
  execFileSync('git',['merge-base','--is-ancestor',pin.sourceCommit,'HEAD'],{cwd:root});
  for(const file of requiredFiles){
    const expected=pin.sourceHashes[file];
    if(!expected)throw new Error(`closeout audit identity differs: ${file}`);
    if(digest(fs.readFileSync(path.join(root,file)))!==expected){
      // Old receipts remain immutable. Only the separately anchored exact
      // RESULT-0082 navigation/adapter correction can explain a byte change.
      const eligible=(file==='docs/goals/policy-terms-loop/audit-source-pin.js'&&expected==='9b86b3b21d71ca033b35dac58efd315337320e32c59cef71325e6ab648f68f17')
        ||(['EVIDENCE_LEDGER.md','CURRENT.md','LEDGER-INDEX.md'].includes(file)&&pin.sourceCommit==='d9b5475fd5faaadc7ca6d6b296030592e31d6294');
      if(!eligible)throw new Error(`closeout audit identity differs: ${file}`);
      require('./resume-route-correction').verifyCorrectedInput(pin,file,expected,{root});
    }
    const committed=execFileSync('git',['show',`${pin.sourceCommit}:${file}`],{cwd:root,maxBuffer:64*1024*1024});
    if(digest(committed)!==expected)throw new Error(`closeout audit pin lacks committed bytes: ${file}`);
  }
  return true;
}
function readAnchoredPin(file,{root}) {
  const bytes=fs.readFileSync(path.join(root,file));
  const additions=execFileSync('git',['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--',file],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
  if(!additions.length)throw new Error('pin receipt must be committed before validation');
  // CI's merge tree may inherit this receipt from one parent. Only the single
  // ordinary addition is a legitimate anchor; competing branch additions fail.
  if(additions.length!==1)throw new Error('multiple receipt additions in full history');
  const first=additions[0];
  const registered=execFileSync('git',['show',`${first}:${file}`],{cwd:root});
  if(digest(bytes)!==digest(registered))throw new Error('retained pin receipt differs from its first-added bytes');
  const pin=JSON.parse(bytes);
  execFileSync('git',['merge-base','--is-ancestor',pin.sourceCommit,first],{cwd:root});
  return pin;
}
module.exports={createPin,verifyPin,readAnchoredPin};
