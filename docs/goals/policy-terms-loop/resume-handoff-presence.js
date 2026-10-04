'use strict';
const fs=require('node:fs');
const path=require('node:path');
const BACKLOGS=['docs/backlog/BL-0012-generator-cannot-build-climbing-chains.md','docs/backlog/BL-0013-policy-vocabulary-gaps.md'];
function handoffPaths(result){return [`experiments/${result}/report.md`,'EVIDENCE_LEDGER.md','LEDGER-INDEX.md','CURRENT.md',...BACKLOGS];}
function requireHandoff(root,result){
  const read=file=>{const full=path.join(root,file);if(!fs.existsSync(full))throw new Error('required evidence handoff absent: '+file);return fs.readFileSync(full,'utf8');};
  const report=`experiments/${result}/report.md`;
  if(!read(report).trim())throw new Error('required report is empty');
  const ledger=read('EVIDENCE_LEDGER.md');
  const section=new RegExp('^### '+result+' \\u2014 [^\\n]+\\n([\\s\\S]*?)(?=^### |^## |$(?![\\s\\S]))','m').exec(ledger)?.[1];
  if(!section||!section.includes('**status:** provisional')||!section.includes('**written_by:**')||!section.includes(report)||!section.includes(`experiments/${result}/closure.json`))throw new Error('required provisional ledger record and report/closure citations absent');
  if(!read('LEDGER-INDEX.md').includes('| '+result+' |'))throw new Error('required ledger index entry absent');
  if(!read('CURRENT.md').includes('EVIDENCE_LEDGER.md#'+result.toLowerCase()+'--'))throw new Error('required CURRENT ledger citation absent');
  for(const file of BACKLOGS){const text=read(file);const history=text.split('## History')[1];if(!history||!history.includes(report))throw new Error('required closure History citation absent: '+file);}
  return true;
}
module.exports={requireHandoff,handoffPaths};
