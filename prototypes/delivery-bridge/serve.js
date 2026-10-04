const fs=require('node:fs');
const path=require('node:path');
const {createServer:sharedServer}=require('../archetype-trio/serve');
const game=require('./model');
function createServer({sessionsDir=path.join(__dirname,'sessions')}={}){
  const rulesSource=fs.readFileSync(path.join(__dirname,'../archetype-trio/model.js'),'utf8')
    +'\n'+fs.readFileSync(path.join(__dirname,'model.js'),'utf8');
  return sharedServer({sessionsDir,game,rulesSource,
    pageSource:fs.readFileSync(path.join(__dirname,'index.html'))});
}
if(require.main===module){
  const port=Number(process.env.DELIVERY_PORT||8283),server=createServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Delivery · Landing: http://127.0.0.1:${port}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createServer};
