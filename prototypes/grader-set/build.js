/* Builds the grader set v1 play page: the kinds sampler page and rules with this set's boards and its own study id.
   Usage: node prototypes/grader-set/build.js <out.html> */
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const engine=fs.readFileSync(path.join(__dirname,'../../solver/engine.js'),'utf8');
const script=[
  `(function(){var module={exports:{}};${engine}\nwindow.ChainCore=module.exports;})();`,
  `window.SamplerStudy='grader-set-v1';window.SamplerStorageKey='graderSet.v1';window.SamplerGiveUp=true;`,
  read('../sampler/model.js'),read('levels.js'),read('../sampler/app.js'),
].join('\n;\n').replace(/<\/script/gi,'<\\/script');
const out=process.argv[2]||path.join(__dirname,'grader-set.html');
fs.writeFileSync(out,read('../sampler/page.html').replace('KINDS SAMPLER','GRADER SET').replace('<title>Kinds Sampler</title>','<title>2248 Grader Set</title>')+`\n<script>\n${script}\n</script>\n`);
console.log('wrote',out);
