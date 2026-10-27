/* Builds a grader set play page: the kinds sampler page and rules with this set's boards and its own study id.
   Usage: node prototypes/grader-set/build.js <out.html>          (v1, 18 boards)
          node prototypes/grader-set/build.js <out.html> --hard   (v2, 12 harder boards from hard/levels.js) */
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const engine=fs.readFileSync(path.join(__dirname,'../../solver/engine.js'),'utf8');
const hard=process.argv.includes('--hard');
const script=[
  `(function(){var module={exports:{}};${engine}\nwindow.ChainCore=module.exports;})();`,
  hard?`window.SamplerStudy='grader-set-v2';window.SamplerStorageKey='graderSet.v2';window.SamplerGiveUp=true;`
    :`window.SamplerStudy='grader-set-v1';window.SamplerStorageKey='graderSet.v1';window.SamplerGiveUp=true;`,
  read('../sampler/model.js'),read(hard?'hard/levels.js':'levels.js'),read('../sampler/app.js'),
].join('\n;\n').replace(/<\/script/gi,'<\\/script');
const out=(process.argv[2]!=='--hard'&&process.argv[2])||path.join(__dirname,'grader-set.html');
fs.writeFileSync(out,read('../sampler/page.html').replace('KINDS SAMPLER',hard?'HARDER BOARDS':'GRADER SET').replace('<title>Kinds Sampler</title>',hard?'<title>2248 Harder Boards</title>':'<title>2248 Grader Set</title>')+`\n<script>\n${script}\n</script>\n`);
console.log('wrote',out);
