const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const model = require('./model');

function createServer({ sessionsDir = path.join(__dirname,'sessions'), game = model,
  rulesSource, pageSource, appSource, styleSource } = {}) {
  const core = fs.readFileSync(path.join(__dirname,'../../solver/engine.js'),'utf8');
  const rules = rulesSource ?? fs.readFileSync(path.join(__dirname,'model.js'),'utf8');
  const identity = crypto.createHash('sha256').update(core).update(rules).digest('hex');
  const assets = {
    '/': ['text/html',pageSource ?? fs.readFileSync(path.join(__dirname,'index.html'))],
    '/app.js': ['text/javascript',appSource ?? fs.readFileSync(path.join(__dirname,'app.js'))],
    '/style.css': ['text/css',styleSource ?? fs.readFileSync(path.join(__dirname,'style.css'))],
    '/model.js': ['text/javascript',rules],
    '/core.js': ['text/javascript',`(function(){const module={exports:{}};\n${core}\nwindow.ChainCore=module.exports;})();`],
    '/api/identity': ['application/json',JSON.stringify({identity})],
  };
  function send(res,status,type,body) {
    res.writeHead(status,{'content-type':`${type}; charset=utf-8`,'cache-control':'no-store',
      'x-content-type-options':'nosniff'});res.end(body);
  }
  const json=(res,status,data)=>send(res,status,'application/json',JSON.stringify(data));
  return http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&assets[url.pathname]) {
      const [type,body]=assets[url.pathname];return send(res,200,type,body);
    }
    if(req.method!=='POST'||url.pathname!=='/api/session') return json(res,404,{error:'Not found'});
    let body='',tooLarge=false;
    req.setEncoding('utf8');
    req.on('data',chunk=>{
      if(tooLarge) return;
      body+=chunk;
      if(Buffer.byteLength(body)>512000) {tooLarge=true;body='';json(res,413,{error:'Session too large'});}
    });
    req.on('end',()=>{
      if(tooLarge)return;
      try {
        const payload=JSON.parse(body);
        if(!/^[0-9a-f-]{36}$/.test(payload.sessionId)||payload.identity!==identity
          ||!Number.isInteger(payload.revision)||payload.revision<0
          ||typeof payload.feedback!=='string'||payload.feedback.length>4000) throw new Error('Invalid session');
        const finalState=game.replay(payload.level,payload.actions);
        const record={schemaVersion:1,standing:'Unreviewed archetype playtest; not experiment evidence',
          sessionId:payload.sessionId,identity,level:payload.level,revision:payload.revision,
          actions:payload.actions,feedback:payload.feedback,finalState,savedAt:new Date().toISOString()};
        fs.mkdirSync(sessionsDir,{recursive:true});
        const target=path.join(sessionsDir,`${payload.sessionId}.json`);
        if(fs.existsSync(target)) {
          const prior=JSON.parse(fs.readFileSync(target,'utf8'));
          if(prior.revision>=payload.revision) return json(res,200,{saved:true,revision:prior.revision});
        }
        fs.writeFileSync(`${target}.tmp`,`${JSON.stringify(record,null,2)}\n`);
        fs.renameSync(`${target}.tmp`,target);
        json(res,200,{saved:true,revision:payload.revision});
      } catch(error) { json(res,400,{error:error.message}); }
    });
  });
}
if(require.main===module) {
  const port=Number(process.env.ARCHETYPE_PORT||8274),server=createServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Archetype playtest: http://127.0.0.1:${port}`));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createServer};
