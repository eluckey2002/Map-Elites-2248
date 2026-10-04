const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const rules=require('../src/connection-rules');
const levels=require('../src/connection-levels');
const ROOT=path.resolve(__dirname,'..');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ASSETS=['index.html','game-library.js','connection-rules.js','connection-levels.js','connection-game.js','connection-math.js','connection-style.css'];
const INPUTS=['solver/engine.js','tools/connection-capture.js','tools/play-server.js',...ASSETS.map(file=>'src/'+file)];
function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
function createConnectionCapture({store=path.join(ROOT,'connection-sessions')}={}){
  const sources=Object.fromEntries(INPUTS.map(file=>[file,fs.readFileSync(path.join(ROOT,file))]));
  const hash=crypto.createHash('sha256');
  for(const file of INPUTS)hash.update(file).update('\0').update(sources[file]);
  const identity=hash.digest('hex');
  const assets=Object.fromEntries(ASSETS.map(file=>['/'+file,sources['src/'+file]]));
  assets['/connection-core.js']=Buffer.from(`(function(){const module={exports:{}};\n${sources['solver/engine.js'].toString()}\nwindow.ChainCore=module.exports;})();`);
  function readAttempt(id){
    if(!UUID.test(id))return null;
    const file=path.join(store,id+'.json');
    try{return JSON.parse(fs.readFileSync(file,'utf8'));}
    catch(error){if(error.code==='ENOENT')return null;throw error;}
  }
  function saveAttempt(payload){
    if(!payload||payload.schemaVersion!==1||!UUID.test(payload.attemptId)||payload.identity!==identity||
      !Number.isSafeInteger(payload.revision)||payload.revision<1||typeof payload.feedback!=='string'||payload.feedback.length>1000)throw new Error('Invalid attempt identity or metadata');
    const level=levels.find(level=>level.id===payload.levelId);if(!level)throw new Error('Unknown puzzle');
    const finalState=rules.replay(level,payload.actions);
    if(payload.finalState!==undefined&&canonical(payload.finalState)!==canonical(finalState))throw new Error('Reported state does not replay');
    const record={schemaVersion:1,standing:'Unreviewed local Connection playtest; not experiment evidence',
      attemptId:payload.attemptId,identity,levelId:level.id,revision:payload.revision,
      actions:payload.actions,feedback:payload.feedback,finalState};
    const prior=readAttempt(payload.attemptId);
    if(prior){
      const {savedAt,...previous}=prior;
      if(prior.identity!==identity||prior.levelId!==level.id||prior.revision>payload.revision||
        (prior.revision===payload.revision&&canonical(previous)!==canonical(record)))return {status:409,body:{error:'Stale or conflicting attempt revision'}};
      if(prior.revision===payload.revision)return {status:200,body:{saved:true,revision:prior.revision}};
    }
    fs.mkdirSync(store,{recursive:true});
    const file=path.join(store,payload.attemptId+'.json'),temporary=file+'.tmp';
    fs.writeFileSync(temporary,JSON.stringify({...record,savedAt:new Date().toISOString()},null,2)+'\n');
    fs.renameSync(temporary,file);
    return {status:200,body:{saved:true,revision:payload.revision}};
  }
  return {identity,assets,readAttempt,saveAttempt};
}
module.exports={createConnectionCapture};
