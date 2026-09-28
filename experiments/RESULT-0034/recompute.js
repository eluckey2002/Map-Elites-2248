const fs=require('fs'),crypto=require('crypto');
const P=process.argv[2];const buf=fs.readFileSync(P);const c=JSON.parse(buf);
const sha=crypto.createHash('sha256').update(buf).digest('hex');
const K=JSON.stringify;
function derive(s){ // recompute proxies from raw witnesses, independent of stored descriptors
  if(!s||!Array.isArray(s.successes)||s.successes.length===0) return {status:'UNKNOWN'};
  const W=s.successes.map(x=>x.witness);
  const openings=new Set(W.map(w=>K(w[0])));
  const cw=s.canonicalWitness; let forced=0;
  for(let i=0;i<cw.length;i++){const pre=K(cw.slice(0,i));
    const nxt=new Set(W.filter(w=>w.length>i&&K(w.slice(0,i))===pre).map(w=>K(w[i])));
    if(nxt.size===1) forced++;}
  return {status:'MEASURED',forced:forced/cw.length,div:openings.size,
    storedForced:s.descriptors&&s.descriptors.forcedPrefixRatio,storedDiv:s.descriptors&&s.descriptors.distinctOpeningMoves};
}
const rows=c.rows.map(r=>({level:r.level,seed:r.seed,shallow:derive(r.shallow),deep:derive(r.deep)}));
const mism=rows.flatMap(r=>['shallow','deep'].filter(k=>r[k].status==='MEASURED'&&(Math.abs(r[k].forced-r[k].storedForced)>1e-12||r[k].div!==r[k].storedDiv)).map(k=>`${r.level}/${r.seed}/${k}`));
const deep=rows.filter(r=>r.deep.status==='MEASURED');
const profiles=new Set(deep.map(r=>r.level));
const P1=deep.length>=30&&profiles.size===4;
const fr=deep.map(r=>r.deep.forced);const range=Math.max(...fr)-Math.min(...fr);
const hist={};deep.forEach(r=>hist[r.deep.div]=(hist[r.deep.div]||0)+1);
const pop=Object.values(hist).filter(n=>n>=4).length;
const P2=range>=0.15&&pop>=2;
const pairs=rows.filter(r=>r.deep.status==='MEASURED'&&r.shallow.status==='MEASURED');
const sf=pairs.filter(r=>Math.abs(r.deep.forced-r.shallow.forced)<=0.15+1e-12).length;
const sd=pairs.filter(r=>r.deep.div===r.shallow.div).length;
const P3=pairs.length>=28&&sf/pairs.length>=0.75&&sd/pairs.length>=0.75;
const out={sha256:sha,descriptorMismatchesVsStored:mism,
 P1:{deepMeasured:deep.length,profiles:profiles.size,verdict:P1?'SUPPORTED':'INCONCLUSIVE'},
 P2:{forcedRange:range,diversityHistogram:hist,valuesWith4Rows:pop,verdict:P2?'SUPPORTED':'INCONCLUSIVE'},
 P3:{pairs:pairs.length,stableForced:sf,stableDiv:sd,verdict:P3?'SUPPORTED':'INCONCLUSIVE'},
 C1_C4:'not computable from corpus.json',
 P4:(P1&&P2&&P3)?'SUPPORTED if C1-C4 pass':'REVISE BEFORE MAP USE (INCONCLUSIVE)',
 unknownRows:rows.filter(r=>r.deep.status!=='MEASURED'||r.shallow.status!=='MEASURED').map(r=>({level:r.level,seed:r.seed,shallow:r.shallow.status,deep:r.deep.status}))};
console.log(JSON.stringify(out,null,1));
