const fs=require('node:fs');
const path=require('node:path');
const {createServer:sharedServer}=require('../archetype-trio/serve');
const game=require('./model');
function createServer({sessionsDir=path.join(__dirname,'sessions')}={}) {
  const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
  const page=read('../connections/index.html')
    .replace('Connections · 2248 Playtest','Connections · Across the Board')
    .replace('Connections / first playtest','Connections / separated endpoints')
    .replace('Make the connections.','Build a path across.')
    .replace('Complete all three in any order. Every merge changes the board for the goals still left.',
      'Three connections across one board. Arrange the values between the endpoints; every merge changes what comes next.');
  return sharedServer({sessionsDir,game,
    rulesSource:read('../archetype-trio/model.js')+'\n'+read('../connections/model.js')+'\n'+read('model.js'),
    pageSource:page,appSource:read('../connections/app.js'),
    styleSource:read('../archetype-trio/style.css')+'\n'+read('../connections/style.css')});
}
if(require.main===module) {
  const server=createServer();
  server.listen(8278,'127.0.0.1',()=>console.log('Connections · Across the Board: http://127.0.0.1:8278'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createServer};
