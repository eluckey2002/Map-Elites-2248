'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function checkInputs(manifest){
 const archive='solver/candidates-archive';
 for(const name of fs.readdirSync(path.join(root,archive)).filter(n=>n.endsWith('.json'))){
  const input=archive+'/'+name;
  if(!Object.hasOwn(manifest,input)) throw new Error('Unpinned archive input: '+input);
 }
 for(const [input,hash] of Object.entries(manifest)){
  const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,input))).digest('hex');
  if(actual!==hash) throw new Error('Historical input drift: '+input);
 }
 return Object.keys(manifest).length;
}
if(require.main===module){const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/goals/policy-learned-judge/historical-inputs.json'),'utf8')); console.log('PASS complete historical input manifest: '+checkInputs(manifest)+' files, archived candidates and receipts included');}
module.exports={checkInputs};
