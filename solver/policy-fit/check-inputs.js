'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {gameRuleIdentity,historicalVersion}=require('../game-rule-surface');
const root=path.resolve(__dirname,'../..');
// DECISION-0015: src/game.js may change for browser-only fixes. Its pinned
// bytes must still exist in history and its game rules must still equal theirs
// (solver/game-rule-surface.js). A pilot execution receipt is re-derived
// whenever src/game.js changes, and only its two runtime identity fields move:
// every other field must still match the pinned bytes exactly, and the pilot's
// own qualify.js must verify the new receipt (self-hash, runtime bundle, replay).
// That qualify.js must be byte-identical to the one at the commit that first held the
// pinned receipt, so weakening the verifier cannot admit a receipt.
const LIVE_GAME='src/game.js';
const REDERIVED_RECEIPT=/^pilots\/[A-Za-z0-9-]+\/execution-receipt\.json$/;
const RUNTIME_IDENTITY_FIELDS=['artifactIdentity','runtimeBundleIdentity'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function sameApartFromRuntimeIdentity(live,pinned){
 const strip=bytes=>{const value=JSON.parse(bytes.toString('utf8')); for(const field of RUNTIME_IDENTITY_FIELDS) delete value[field]; return JSON.stringify(value);};
 return strip(live)===strip(pinned);
}
function rederivedReceiptVerifies(input,live,pinnedCommit,liveQualifier){
 const relative=path.dirname(input)+'/qualify.js',qualify=path.join(root,relative);
 if(!pinnedCommit||!fs.existsSync(qualify)) return false;
 let pinnedQualifier;
 try{pinnedQualifier=execFileSync('git',['show',pinnedCommit+':'+relative],{cwd:root,stdio:['ignore','pipe','ignore']});}catch{return false;}
 if(!pinnedQualifier.equals(liveQualifier||fs.readFileSync(qualify))) return false;
 try{return require(qualify).verifyExecution(JSON.parse(live.toString('utf8'))).status==='PASS';}catch{return false;}
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
  const pinned=input===LIVE_GAME||REDERIVED_RECEIPT.test(input)?historicalVersion(root,input,hash):null;
  const accepted=pinned&&(input===LIVE_GAME?gameRuleIdentity(live)===gameRuleIdentity(pinned.bytes):sameApartFromRuntimeIdentity(live,pinned.bytes)&&rederivedReceiptVerifies(input,live,pinned.commit));
  if(!accepted) throw new Error('Historical input drift: '+input);
 }
 return Object.keys(manifest).length;
}
if(require.main===module){const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/goals/policy-learned-judge/historical-inputs.json'),'utf8')); console.log('PASS complete historical input manifest: '+checkInputs(manifest)+' files, archived candidates and receipts included');}
module.exports={checkInputs,sameApartFromRuntimeIdentity,rederivedReceiptVerifies};
