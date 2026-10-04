'use strict';
// Sequential phases: each pool closes before the next phase creates its pool.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {run:controls}=require('./resume-controls');
const ROOT=path.resolve(__dirname,'../..');
async function run(){
  await controls();
  const output=execFileSync(process.execPath,['solver/policy-lab/resume-recompute.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  fs.writeFileSync(path.join(ROOT,'solver/policy-lab/runs/resume/control-recompute-output.txt'),output);
  process.stdout.write(output);
  if(!output.includes('PASS complete journal jobs 232')||!output.includes('MATCH retained arithmetic'))throw new Error('independent complete-control qualification absent');
  const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'solver/policy-lab/runs/resume/controls-raw.json')));
  if(raw.headlines.path==='C'){console.log('READY_FOR_PATH_C_CLOSEOUT: no idea was judged');return;}
  if(raw.headlines.path!=='CONTROLS_PASSED')throw new Error('unexpected control disposition');
  await require('./resume-proposals').run();
  const proposal=execFileSync(process.execPath,['solver/policy-lab/resume-proposal-recompute.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  fs.writeFileSync(path.join(ROOT,'solver/policy-lab/runs/resume/proposal-recompute-output.txt'),proposal);
  process.stdout.write(proposal);
  console.log('NEXT: close the actual B/D disposition or freeze/register the actual selected candidate before one conditional confirmation.');
}
if(require.main===module)run().catch(error=>{console.error('PIPELINE_STOP',error.stack);process.exitCode=1;});
module.exports={run};
