const fs=require('fs'),crypto=require('crypto');
const P=process.argv[2];const buf=fs.readFileSync(P);const c=JSON.parse(buf);
const sha=crypto.createHash('sha256').update(buf).digest('hex');
const issues=[];
function arm(a,r,name){ // independent descriptor check from trace + witness coords
  if(!a||a.standing!=='replayed_witness_proxy'||!a.reference||!a.reference.reachesTarget) return null;
  const pz=a.puzzle; if(pz.level!==r.level||pz.seed!==r.seed) issues.push(`${name} ${r.level}/${r.seed} identity mismatch`);
  if(a.reference.score<pz.target) issues.push(`${name} ${r.level}/${r.seed} score<target`);
  const w=a.reference.witness, diam=Math.max(pz.gridW,pz.gridH)-1;
  if(w.length!==a.trace.length) issues.push(`${name} ${r.level}/${r.seed} witness/trace length`);
  if(w.length>pz.moves) issues.push(`${name} ${r.level}/${r.seed} over move budget`);
  const spans=w.map(ch=>{const xs=ch.map(p=>p[0]),ys=ch.map(p=>p[1]);return Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))/diam;});
  const mean=spans.reduce((s,x)=>s+x,0)/spans.length;
  const peak=Math.max(...a.trace.map(t=>t.mergeDepth));
  if(Math.abs(mean-a.descriptors.meanNormalizedChainSpan)>1e-12) issues.push(`${name} ${r.level}/${r.seed} span mismatch ${mean} vs ${a.descriptors.meanNormalizedChainSpan}`);
  if(peak!==a.descriptors.peakMergeDepth) issues.push(`${name} ${r.level}/${r.seed} depth mismatch`);
  return {peak,mean};
}
const rows=c.rows.map(r=>({level:r.level,seed:r.seed,s:arm(r.shallow,r,'shallow'),d:arm(r.deep,r,'deep')}));
const deep=rows.filter(r=>r.d);
const profiles=new Set(deep.map(r=>r.level));
const P1=deep.length>=30&&profiles.size===4&&rows.length===32;
const dc={};deep.forEach(r=>dc[r.d.peak]=(dc[r.d.peak]||0)+1);
const pop=Object.values(dc).filter(n=>n>=4).length;
const sp=deep.map(r=>r.d.mean);const range=Math.max(...sp)-Math.min(...sp);
const P2=pop>=2&&range>=0.15;
const pairs=rows.filter(r=>r.s&&r.d);
const same=pairs.filter(r=>r.s.peak===r.d.peak).length;
const stab=pairs.filter(r=>Math.abs(r.s.mean-r.d.mean)<=0.10).length;
const P3=pairs.length>=28&&same/pairs.length>=0.75&&stab/pairs.length>=0.75;
const out={corpusSha256:sha,puzzles:rows.length,
 P1:{deepWitnessRows:deep.length,profiles:profiles.size,verdict:P1?'SUPPORTED':'INCONCLUSIVE'},
 P2:{depthCounts:dc,valuesWith4plus:pop,spreadRange:range,verdict:P2?'SUPPORTED':'INCONCLUSIVE'},
 P3:{pairs:pairs.length,sameDepth:same,sameDepthRate:same/pairs.length,stableSpread:stab,stableRate:stab/pairs.length,verdict:P3?'SUPPORTED':'INCONCLUSIVE'},
 P4:{verdict:(P1&&P2&&P3)?'SUPPORTED if C1-C5 pass (not recomputable from corpus)':'INCONCLUSIVE'},
 missing:rows.filter(r=>!r.s||!r.d).map(r=>({level:r.level,seed:r.seed,shallow:!!r.s,deep:!!r.d})),
 issues,corpusSelfReport:c.decision};
console.log(JSON.stringify(out,null,1));
