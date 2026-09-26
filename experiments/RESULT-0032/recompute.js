const fs=require('fs'),crypto=require('crypto');
const p=process.argv[2];const buf=fs.readFileSync(p);const c=JSON.parse(buf);
const sha=crypto.createHash('sha256').update(buf).digest('hex');
const rate=a=>a&&a.descriptors?a.descriptors.oneDetourRecoveryWitnessRate:null;
const meas=v=>typeof v==='number'&&Number.isFinite(v);
const rows=c.rows, W=['shallow','deep'], B=['tight','slack'];
// P1
const ch=rows.map(r=>W.flatMap(w=>B.map(b=>r[w][b].descriptors.initialViableStartFraction)));
const inv=ch.filter(v=>v.every(x=>x===v[0])).length;
const op=ch.map(v=>v[0]);const range=Math.max(...op)-Math.min(...op);
const P1=(rows.length===32&&range>=0.20-1e-12&&inv===32)?'SUPPORTED':'INCONCLUSIVE';
// P2 deep arm
let elig=0,imp=0,dec=0;const nullArms=[];
for(const r of rows){const t=rate(r.deep.tight),s=rate(r.deep.slack);
 if(meas(t)&&meas(s)&&t<1){elig++;if(s-t>=0.125-1e-12)imp++;if(s<t)dec++;}}
const P2=(elig>=12&&imp/elig>=0.75&&dec===0)?'SUPPORTED':'INCONCLUSIVE';
// P3
let comp=0,stable=0;
for(const r of rows)for(const b of B){const a=rate(r.shallow[b]),d=rate(r.deep[b]);
 if(!meas(a)||!meas(b===b&&d)){nullArms.push(`${r.level}/${r.seed}/${b}`);continue}
 comp++;if(Math.abs(a-d)<=0.25+1e-12)stable++;}
const P3=(comp>=48&&stable/comp>=0.75)?'SUPPORTED':'INCONCLUSIVE';
const out={corpusSha256:sha,rowCount:rows.length,
 P1:{range,invariantRows:inv,outcome:P1},
 P2:{eligible:elig,improved:imp,decreased:dec,rate:elig?imp/elig:null,outcome:P2},
 P3:{comparable:comp,stable,rate:comp?stable/comp:null,unmeasuredArms:nullArms,outcome:P3},
 C1toC5:'NOT_COMPUTABLE_FROM_CORPUS',
 P4:(P1==='SUPPORTED'&&P2==='SUPPORTED'&&P3==='SUPPORTED')?'SUPPORTED_IF_C1_C5_PASS':'INCONCLUSIVE'};
console.log(JSON.stringify(out,null,1));
