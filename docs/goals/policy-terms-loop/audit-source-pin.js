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
    const committed=execFileSync('git',['show',`${sourceCommit}:${file}`],{cwd:root});
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
    if(!expected||digest(fs.readFileSync(path.join(root,file)))!==expected)throw new Error(`closeout audit identity differs: ${file}`);
    const committed=execFileSync('git',['show',`${pin.sourceCommit}:${file}`],{cwd:root});
    if(digest(committed)!==expected)throw new Error(`closeout audit pin lacks committed bytes: ${file}`);
  }
  return true;
}
module.exports={createPin,verifyPin};
