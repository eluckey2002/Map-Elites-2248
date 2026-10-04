const fs=require('node:fs');
const path=require('node:path');
const {createServer:sharedServer}=require('../archetype-trio/serve');
const game=require('./model');
function createServer({sessionsDir=path.join(__dirname,'sessions')}={}){
  const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
  const server=sharedServer({sessionsDir,game,
    rulesSource:read('../archetype-trio/model.js')+'\n'+read('../connections-continuous/model.js')+'\n'+read('model.js'),
    pageSource:read('index.html'),appSource:read('../connections-continuous/combinations.js')+'\n'+read('app.js'),
    styleSource:read('../archetype-trio/style.css')+'\n'+read('../connections-continuous/style.css')+'\n'+read('style.css')});
  const handler=server.listeners('request')[0];
  server.removeListener('request',handler);
  server.on('request',(req,res)=>{
    const match=new URL(req.url,'http://localhost').pathname.match(/^\/api\/session\/([0-9a-f-]{36})$/);
    if(req.method!=='GET'||!match)return handler(req,res);
    try{
      const saved=JSON.parse(fs.readFileSync(path.join(sessionsDir,`${match[1]}.json`),'utf8'));
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
      res.end(JSON.stringify({sessionId:saved.sessionId,identity:saved.identity,level:saved.level,actions:saved.actions,feedback:saved.feedback}));
    }catch{res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify({error:'Saved run not found'}));}
  });
  return server;
}
if(require.main===module){
  const server=createServer(),port=Number(process.env.CONNECTION_POWERUP_PORT||8285);
  server.listen(port,'127.0.0.1',()=>console.log(`Connection Run + Power-up: http://127.0.0.1:${port}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createServer};
