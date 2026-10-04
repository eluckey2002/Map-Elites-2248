import pathlib,subprocess,json,re
out=pathlib.Path('docs/goals/policy-learned-judge/result-id-final-check.json')
def git(*args):
 p=subprocess.run(['git',*args],capture_output=True,text=True,encoding='utf-8');return p.stdout.strip()
refs=git('for-each-ref','--format=%(refname)','refs/heads','refs/remotes/origin').splitlines()
rows=[]
for ref in refs:
 if ref=='refs/heads/codex/policy-learned-judge-r5':continue
 tree=git('ls-tree','-r','--name-only',ref)
 ids=[int(i) for i in re.findall(r'experiments/RESULT-(\d+)/',tree)]
 matches=git('grep','-I','-l','RESULT-0083',ref,'--')
 rows.append({'ref':ref,'maxExperimentDirectory':max(ids,default=0),'assignedIdHits':matches.splitlines()})
result={'assigned':'RESULT-0083','checkedRefs':len(rows),'matches':[r for r in rows if r['assignedIdHits']],'maximumOtherExperimentDirectory':max(r['maxExperimentDirectory'] for r in rows),'rows':rows}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
assert not result['matches'],'RESULT-0083 is already held by another branch'
assert result['maximumOtherExperimentDirectory']<83,'assigned ID is not above allocated directory IDs'
