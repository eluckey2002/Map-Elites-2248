const fs=require('node:fs');
const path=require('node:path');
const {createServer:sharedServer}=require('../archetype-trio/serve');
const game=require('./model');
function createServer({sessionsDir=path.join(__dirname,'sessions')}={}) {
  const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
  return sharedServer({sessionsDir,game,
    rulesSource:read('../archetype-trio/model.js')+'\n'+read('model.js'),
    pageSource:read('index.html'),appSource:read('app.js'),
    styleSource:read('../archetype-trio/style.css')+'\n'+read('style.css')});
}
if(require.main===module) {
  const server=createServer();
  server.listen(8277,'127.0.0.1',()=>console.log('Connections: http://127.0.0.1:8277'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createServer};
