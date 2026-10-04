'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requireHandoff,handoffPaths}=require('../../docs/goals/policy-terms-loop/resume-handoff-presence');
test('reviewed coordinator refuses a real pre-staged protected change, source drift and a verdict-only collision',()=>{
  const source=path.resolve(__dirname,'../../docs/goals/policy-terms-loop/advance-resume-reviewed.py');
  const script=String.raw`
import hashlib,importlib.util,json,subprocess,tempfile
from pathlib import Path
import sys
spec=importlib.util.spec_from_file_location('reviewed',sys.argv[1]);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
def refused(call,fragment):
    try:call()
    except RuntimeError as e:
        assert fragment in str(e),str(e)
    else:raise AssertionError('unsafe state admitted: '+fragment)
with tempfile.TemporaryDirectory() as directory:
    root=Path(directory)
    def command(args,**options):return subprocess.check_output(args,cwd=root,text=True)
    command(['git','init','-q'])
    protected=root/'protected.txt';protected.write_text('must not enter evidence commit')
    command(['git','add','protected.txt'])
    refused(lambda:mod.assert_selection_checkout(execute=command),'pre-staged')
    assert command(['git','diff','--cached','--name-only']).strip()=='protected.txt'
    assert not (root/'solver/policy-lab/resume-frozen-candidate.js').exists()
    command(['git','rm','--cached','protected.txt']);protected.unlink()
    owned=root/'solver/policy-lab/runs/resume';owned.mkdir(parents=True);(owned/'raw.json').write_text('{}')
    mod.assert_selection_checkout(execute=command)
    extra=root/'unrelated.txt';extra.write_text('leave unchanged')
    refused(lambda:mod.assert_selection_checkout(execute=command),'unknown checkout')
    source=root/'coordinator.py';source.write_text('launch-time source')
    digest=hashlib.sha256(source.read_bytes()).hexdigest();marker=root/'launch.json';marker.write_text(json.dumps({'pid':17,'sourceSha256':digest}))
    mod.assert_runtime_identity(source=source,marker=marker,expected_sha=digest,expected_pid=17)
    source.write_text('new committed bytes are not the running interpreter')
    refused(lambda:mod.assert_runtime_identity(source=source,marker=marker,expected_sha=digest,expected_pid=17),'source identity')
    verdict=root/'experiments/RESULT-0082/verdict.json';verdict.parent.mkdir(parents=True);verdict.write_text('{}')
    refused(lambda:mod.reject_existing_outputs(root=root),'verdict.json')
    refused(lambda:mod.reject_existing_outputs(root=root,before_registration=False),'verdict.json')
    assert verdict.read_text()=='{}'
print('PASS actual staged-index, source-drift and verdict-only negatives; no games or protocol')
`;
  const output=execFileSync('python',['-B','-c',script,source],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  assert.match(output,/PASS actual staged-index/);
});
test('resumed completion requires report, provisional ledger, index, CURRENT and both backlog histories',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'resume-handoff-'));const result='RESULT-0082';
  const report=`experiments/${result}/report.md`;
  const write=(file,text)=>{const full=path.join(root,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,text);};
  try{
    assert.throws(()=>requireHandoff(root,result),/handoff absent/);
    write(report,'Actual completed result');
    assert.throws(()=>requireHandoff(root,result),/handoff absent/);
    write('EVIDENCE_LEDGER.md',`### ${result} — Actual completed run\n\n- **status:** provisional\n- **written_by:** producer\n- **evidence:** ${report}; experiments/${result}/closure.json\n`);
    write('LEDGER-INDEX.md',`| ${result} | actual result |`);
    write('CURRENT.md',`[${result}](EVIDENCE_LEDGER.md#result-0082--actual-completed-run)`);
    for(const f of handoffPaths(result).filter(f=>f.startsWith('docs/backlog/')))write(f,`## History\n- Actual closure ${report}\n`);
    assert.equal(requireHandoff(root,result),true);
    for(const file of handoffPaths(result)){
      const full=path.join(root,file),bytes=fs.readFileSync(full);fs.unlinkSync(full);
      assert.throws(()=>requireHandoff(root,result),/handoff absent/);fs.writeFileSync(full,bytes);
    }
    write('CURRENT.md','RESULT-0082 pending');assert.throws(()=>requireHandoff(root,result),/CURRENT ledger citation/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
