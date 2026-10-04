'use strict';
// Arithmetic reimplementation: no producer, runner, loop, or ruler imports.
const fs=require('node:fs'); const path=require('node:path'); const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const average=a=>a.reduce((s,v)=>s+v,0)/a.length;
function sd(a) {if(a.length<2)return null;const m=average(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));}
function axes(a,L,S) {
 assert.equal(a.length,L*S);
 const valid=a.filter(v=>v!==null);
 const levels=Array.from({length:L},(_,i)=>a.slice(i*S,(i+1)*S).filter(v=>v!==null)).filter(a=>a.length).map(average);
 const seeds=Array.from({length:S},(_,j)=>Array.from({length:L},(_,i)=>a[i*S+j]).filter(v=>v!==null)).filter(a=>a.length).map(average);
 const sl=sd(levels),ss=sd(seeds);const seLevel=sl===null?null:sl/Math.sqrt(levels.length),seSeed=ss===null?null:ss/Math.sqrt(seeds.length);
 const se=seLevel===null||seSeed===null?null:Math.max(seLevel,seSeed);const mean=valid.length?average(valid):null;
 return {mean,se,seLevel,seSeed,ci95:se===null?[null,null]:[mean-1.96*se,mean+1.96*se],n:valid.length};
}
function same(a,b,name) {
 if(typeof a==='number'&&typeof b==='number')assert.ok(Math.abs(a-b)<1e-10,`${name}: ${a} != ${b}`);
 else if(Array.isArray(a)){assert.equal(a.length,b.length,name);a.forEach((v,i)=>same(v,b[i],name+'['+i+']'));}
 else if(a&&typeof a==='object'){for(const k of Object.keys(a))same(a[k],b[k],name+'.'+k);}
 else assert.equal(a,b,name);
}
const noise=read('docs/goals/policy-learned-judge/noise.json');
const historical=read('experiments/RESULT-0049/corpus.json');
const vals=historical.cells.map(c=>c.base.win&&c.champion.win?c.base.movesToTarget-c.champion.movesToTarget:null);
const rebuilt=axes(vals,58,300);same(rebuilt,noise.historical,'historical');
for(const r of noise.rows) {const c=historical.cells.filter(c=>c.level===r.level);assert.equal(c.length,300);const a=axes(c.map(c=>c.base.win&&c.champion.win?c.base.movesToTarget-c.champion.movesToTarget:null),1,300);same(a.seSeed**2*a.n,r.pairedVariance,'level '+r.level+' variance');}
const legacy=read('experiments/RESULT-0058/raw-games.json');
const panel=legacy.games.filter(g=>g.stage==='positive3000');
const candidate=new Map(panel.filter(g=>g.arm==='candidate').map(g=>[g.level+':'+g.seed,g.outcome]));
for(const r of noise.rows) {
 const refs=panel.filter(g=>g.level===r.level&&g.arm==='champion');
 assert.equal(refs.length,r.crossCheckCells);
 if(refs.length) {const a=axes(refs.map(g=>{const c=candidate.get(g.level+':'+g.seed);return c.win&&g.outcome.win?g.outcome.movesToTarget-c.movesToTarget:null;}),1,refs.length);same(a.seSeed*a.seSeed*a.n,r.crossCheckVariance,'cross-check level '+r.level);}
}
console.log('MATCH CROSS-CHECK: all twelve RESULT-0058 positive3000 level variances');
for(const d of noise.designs) {const sl=rebuilt.seLevel*Math.sqrt(58/d.levels),ss=rebuilt.seSeed*Math.sqrt(300/d.seeds);same({seLevel:sl,seSeed:ss,se:Math.max(sl,ss),halfWidth95:1.96*Math.max(sl,ss),detectableGain80:2.8*Math.max(sl,ss)},d,'noise design');}
console.log('MATCH NOISE: all 58 historical level variances, both axes, interval widths and detectable gains');
const ceilingFile='docs/goals/policy-learned-judge/ceiling.json';
if(!fs.existsSync(path.join(root,ceilingFile))) {console.log('UNVERIFIED GENERATION: diagnostic artifact absent');process.exitCode=1;}
else {
 const c=read(ceilingFile);
 const groups=[c.rows,c.rows.filter(r=>r.level>=56&&r.level<=58),c.rows.filter(r=>r.ownerFaster&&r.ownerPoints>r.botPoints)];
 groups.forEach((g,i)=>{const missed=g.filter(r=>r.poolBest<r.ownerPoints).length;same({n:g.length,poolBelowOwner:missed,botBelowOwner:g.filter(r=>r.botPoints<r.ownerPoints).length,fraction:g.length?missed/g.length:null},c.tables[i],'generation group '+i);});
 const d=groups[2];const eligible=c.issues.length===0&&d.length>=c.N_MIN;
 const bottleneck=eligible&&d.filter(r=>r.poolBest<r.ownerPoints).length*2>=d.length;
 assert.equal(c.path,bottleneck?'E':null);
 console.log('MATCH GENERATION: exact subset counts, comparison counts and unchanged N_MIN / majority stop');
 console.log(JSON.stringify(c.tables));
 console.log('Arithmetic reimplementation only; distinct reviewer acceptance is still required.');
}
