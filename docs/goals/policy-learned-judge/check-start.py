import json, subprocess, pathlib, re
root=pathlib.Path.cwd(); out=root/'docs/goals/policy-learned-judge'
def git(*args):
 p=subprocess.run(['git',*args],capture_output=True,text=True,encoding='utf-8'); return p.stdout.strip()
refs=git('for-each-ref','--format=%(refname)','refs/remotes/origin').splitlines()
checks=[]; maximum=81; overlaps=[]
for ref in refs:
 tree=git('ls-tree','-r','--name-only',ref)
 ids=[int(x) for x in re.findall(r'RESULT-(\d+)',tree)]; maximum=max([maximum,*ids])
 hits=git('grep','-I','-l','RESULT-0081',ref,'--')
 checks.append({'ref':ref,'maxDirectoryId':max(ids,default=0),'assignedIdHits':hits.splitlines()})
 seeds=git('show',ref+':experiments/SEEDS.md')
 lines=[line for line in seeds.splitlines() if re.search(r'7\d(?:,?\d{3}){2}',line)]
 if lines: overlaps.append({'ref':ref,'rows':lines})
assigned='RESULT-'+str(maximum+1 if any(x['assignedIdHits'] for x in checks) else 81).zfill(4)
data={'HEAD':git('rev-parse','HEAD'),'branch':git('branch','--show-current'),'assigned':assigned,'remoteChecks':checks,'possibleSeedOverlapRows':overlaps}
(out/'start-state.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
print(json.dumps(data,indent=2)); print('SEEDS.md:\n'+(root/'experiments/SEEDS.md').read_text(encoding='utf-8'))
