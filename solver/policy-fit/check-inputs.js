'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
// DECISION-0013: src/game.js may change for browser-only fixes. Its pinned
// bytes must still exist in history, so the study's input stays recoverable.
// A pilot execution receipt is re-derived whenever src/game.js changes, and
// only its two runtime identity fields move: every other field must still
// match the pinned bytes exactly.
const LIVE_GAME='src/game.js';
const REDERIVED_RECEIPT=/^pilots\/[A-Za-z0-9-]+\/execution-receipt\.json$/;
const RUNTIME_IDENTITY_FIELDS=['artifactIdentity','runtimeBundleIdentity'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function pinnedHistoricalBytes(input,hash){
 const commits=execFileSync('git',['log','--format=%H','--',input],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const commit of commits){
  let bytes; try{bytes=execFileSync('git',['show',`${commit}:${input}`],{cwd:root});}catch{continue;}
  if(sha(bytes)===hash) return bytes;
 }
 return null;
}
function sameApartFromRuntimeIdentity(live,pinned){
 const strip=bytes=>{const value=JSON.parse(bytes.toString('utf8')); for(const field of RUNTIME_IDENTITY_FIELDS) delete value[field]; return JSON.stringify(value);};
 return strip(live)===strip(pinned);
}
function checkInputs(manifest){
 const archive='solver/candidates-archive';
 for(const name of fs.readdirSync(path.join(root,archive)).filter(n=>n.endsWith('.json'))){
  const input=archive+'/'+name;
  if(!Object.hasOwn(manifest,input)) throw new Error('Unpinned archive input: '+input);
 }
 for(const [input,hash] of Object.entries(manifest)){
  const live=fs.readFileSync(path.join(root,input));
  if(sha(live)===hash) continue;
  const pinned=input===LIVE_GAME||REDERIVED_RECEIPT.test(input)?pinnedHistoricalBytes(input,hash):null;
  if(!pinned||(input!==LIVE_GAME&&!sameApartFromRuntimeIdentity(live,pinned))) throw new Error('Historical input drift: '+input);
 }
 return Object.keys(manifest).length;
}
if(require.main===module){const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/goals/policy-learned-judge/historical-inputs.json'),'utf8')); console.log('PASS complete historical input manifest: '+checkInputs(manifest)+' files, archived candidates and receipts included');}
module.exports={checkInputs,sameApartFromRuntimeIdentity};
