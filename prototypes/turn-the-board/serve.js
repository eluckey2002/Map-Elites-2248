const fs = require('node:fs');
const path = require('node:path');
const {createServer:sharedServer} = require('../archetype-trio/serve');
const game = require('./model');
function createServer({sessionsDir = path.join(__dirname,'sessions')} = {}) {
  const read = file => fs.readFileSync(path.join(__dirname,file),'utf8');
  return sharedServer({sessionsDir,game,rulesSource:read('model.js'),
    pageSource:read('index.html'),appSource:read('app.js'),
    styleSource:read('../archetype-trio/style.css')+'\n'+read('style.css')});
}
if (require.main === module) {
  const port = Number(process.env.TURN_PORT || 8284), server = createServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Turn the Board: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports = {createServer};
