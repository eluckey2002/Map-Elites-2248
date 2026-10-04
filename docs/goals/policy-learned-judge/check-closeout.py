import pathlib, subprocess,json,re,hashlib
root=pathlib.Path.cwd();goal=root/'docs/goals/policy-learned-judge'
def git(*args):return subprocess.check_output(['git',*args],text=True,encoding='utf-8').strip()
base='6fea334c2f5fd61a86cce4a1842cb9b03f709ee1'
text=(goal/'closeout-tests.txt').read_text(encoding='utf-8-sig')
names=sorted(set(re.findall(r'^✖ ([^\n]+) \([0-9.]+ms\)',text,re.M)))
expected=json.loads((goal/'baseline-summary.json').read_text(encoding='utf-8'))['failureNames']
assert names==expected, json.dumps({'baseline':expected,'final':names},indent=2)
protected=['solver/bot.js','solver/engine.js','solver/level-author.js','solver/generate-levels.js','src/game.js','solver/calibrations/calib-1.js','solver/ruler/','experiments/RESULT-0058/']
assert not git('diff',base,'--',*protected), 'protected source changed'
assert not git('diff','--name-only','--diff-filter=MDR',base,'--','solver/tests/'), 'existing test changed'
changed=git('diff','--name-only',base).splitlines()
allowed=['solver/policy-fit/','solver/tests/','experiments/RESULT-0083/','docs/goals/policy-learned-judge/']
fixed=['experiments/SEEDS.md','EVIDENCE_LEDGER.md','LEDGER-INDEX.md','CURRENT.md']
assert all(p in fixed or any(p.startswith(a) for a in allowed) for p in changed), changed
before=git('show',base+':experiments/SEEDS.md');now=(root/'experiments/SEEDS.md').read_text(encoding='utf-8')
assert now.startswith(before),'seed log not append-only'
manifest=json.loads((goal/'historical-inputs.json').read_text(encoding='utf-8'))
assert all(hashlib.sha256((root/p).read_bytes()).hexdigest()==h for p,h in manifest.items()), 'historical input drift'
rows=[line for line in text.splitlines() if line.startswith('ℹ ') or line.startswith('✖ ')]
output='PASS baseline failure names exactly unchanged\n'+json.dumps(names,indent=2)+'\nPASS protected files unchanged\nPASS existing tests unchanged; new boundary tests only\nPASS allowed tracked write scope\nPASS seed log append-only\nPASS historical input hashes unchanged\nNo backlog touched; no History update required\n'+'\n'.join(rows)+'\n'
(goal/'closeout-output.txt').write_text(output,encoding='utf-8');print(output)
for argv in [['node','tools/verify-experiments.js'],['node','tools/verify-ledger-authorship.js'],['node','tools/ledger-index.js','--check']]:
 p=subprocess.run(argv,capture_output=True,text=True,encoding='utf-8');output='$ '+' '.join(argv)+'\n'+p.stdout+p.stderr
 with (goal/'closeout-output.txt').open('a',encoding='utf-8') as f:f.write(output)
 print(output);assert p.returncode==0,argv
