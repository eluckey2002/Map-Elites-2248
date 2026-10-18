/* Builds one self-contained page (engine + shipped Connection rules + boards + view) for the playtest Artifact.
   Usage: node prototypes/connection-relay/build.js <out.html> */
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const umd=(file,name)=>`(function(){var module={exports:{}};${read(file)}\nwindow.${name}=module.exports;})();`;
const script=[
  umd('../../solver/engine.js','ChainCore'),read('../../src/connection-rules.js'),read('../../src/connection-math.js'),
  read('levels.js'),read('app.js'),
].join('\n;\n').replace(/<\/script/gi,'<\\/script');
const out=process.argv[2]||path.join(__dirname,'relay.html');
fs.writeFileSync(out,read('page.html')+`\n<script>\n${script}\n</script>\n`);
console.log('wrote',out);
