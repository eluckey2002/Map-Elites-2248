/* Builds one self-contained page (engine + rules + boards + UI) for the private sampler playtest Artifact.
   Usage: node prototypes/sampler/build.js <out.html> */
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const engine=fs.readFileSync(path.join(__dirname,'../../solver/engine.js'),'utf8');
const script=[
  `(function(){var module={exports:{}};${engine}\nwindow.ChainCore=module.exports;})();`,
  read('model.js'),read('levels.js'),read('app.js'),
].join('\n;\n').replace(/<\/script/gi,'<\\/script');
const out=process.argv[2]||path.join(__dirname,'sampler.html');
fs.writeFileSync(out,read('page.html')+`\n<script>\n${script}\n</script>\n`);
console.log('wrote',out);
