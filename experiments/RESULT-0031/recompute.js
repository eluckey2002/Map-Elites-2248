const fs=require('fs'),crypto=require('crypto');
const P=process.argv[2];const buf=fs.readFileSync(P);const c=JSON.parse(buf);
const sha=crypto.createHash('sha256').update(buf).digest('hex');
const lv={};for(const l of c.panel.levels)lv[l.level]=l;
const EXPECT_CAPS=[2,3,4,6,8,12];
let capViol=0,capRuns=0,idMismatch=0,witnessIssues=[],unknownIssues=[];
function arm(row,a,name){
  const L=lv[row.level];const cells=L.gridW*L.gridH;
  const caps=[...EXPECT_CAPS,cells];
  if(JSON.stringify(a.testedCaps)!==JSON.stringify(caps))witnessIssues.push(`${row.level}/${row.seed}/${name} caps ${a.testedCaps}`);
  if(a.puzzleIdentity!==row.puzzleIdentity)idMismatch++;
  let best=null;
  for(const r of a.runs){
    capRuns++;const d=r.diagnostics;
    if(d.actionsPerState!==16||!(d.generatedActions<=d.expandedStates*16))capViol++;
    const ok=r.reachesTarget===true&&r.standing==='replayed_upper_bound';
    if(!ok){ if(r.standing!=='UNKNOWN')unknownIssues.push(`${row.level}/${row.seed}/${name}/cap${r.maxChainLength}`); continue;}
    // structural checks only (no engine replay possible blind)
    const w=r.witness;
    if(w.length!==r.movesUsed||r.movesUsed>L.moves||w.some(ch=>ch.length>r.maxChainLength||ch.length<L.minChain))
      witnessIssues.push(`${row.level}/${row.seed}/${name}/cap${r.maxChainLength} structural`);
    if(r.score<L.target)witnessIssues.push(`${row.level}/${row.seed}/${name}/cap${r.maxChainLength} score<target`);
    if(!best)best={moves:r.movesUsed,cap:r.maxChainLength};
    else{best.moves=Math.min(best.moves,r.movesUsed);best.cap=Math.min(best.cap,r.maxChainLength);}
  }
  const exp=a.runs.reduce((s,r)=>s+r.diagnostics.expandedStates,0);
  if(!best)return{witness:false,exp};
  const t=best.moves/L.moves;
  return{witness:true,exp,moves:best.moves,tight:t,cap:best.cap,bin:(t<=0.5?'relaxed':'tight')+'-'+(best.cap<=12?'short':'long')};
}
const rows=c.rows.map(row=>{const s=arm(row,row.shallow,'shallow'),d=arm(row,row.deep,'deep');
  return{level:row.level,seed:row.seed,s,d,corpusBins:[row.shallowBin,row.deepBin],corpusExp:row.deterministicCost};});
const deepRows=rows.filter(r=>r.d.witness);const profs=new Set(deepRows.map(r=>r.level));
const P1=deepRows.length>=7&&profs.size===4&&rows.length===8?'SUPPORTED':'INCONCLUSIVE';
const paired=rows.filter(r=>r.s.witness&&r.d.witness);
const same=paired.filter(r=>r.s.bin===r.d.bin).length;
const worse=paired.filter(r=>r.d.moves>r.s.moves||r.d.cap>r.s.cap).length;
const rate=paired.length?same/paired.length:0;
const P2=paired.length>=6&&rate>=0.75&&worse===0?'SUPPORTED':'INCONCLUSIVE';
const sE=rows.reduce((a,r)=>a+r.s.exp,0),dE=rows.reduce((a,r)=>a+r.d.exp,0);
const expMissing=c.rows.some(r=>r.shallow.runs.concat(r.deep.runs).some(x=>typeof x.diagnostics.expandedStates!=='number'));
const P3=expMissing?'FAIL':'PASS';
const C2=capViol===0?'PASS':'FAIL';
const C4partial=(idMismatch===0&&unknownIssues.length===0&&witnessIssues.length===0)?'PASS (partial)':'FAIL';
const P4=(C2==='PASS'&&C4partial!=='FAIL'&&P1==='SUPPORTED'&&P2==='SUPPORTED')?'SUPPORTED (conditional on C1/C3/C4 unverifiable parts)':'INCONCLUSIVE';
const out={sha256:sha,C2:{outcome:C2,runs:capRuns,violations:capViol},C4partial:{outcome:C4partial,idMismatch,unknownIssues,witnessIssues},
 P1:{outcome:P1,deepWitnessRows:deepRows.length,profiles:profs.size},
 P2:{outcome:P2,paired:paired.length,sameBin:same,rate,worsenedPairs:worse},
 P3:{outcome:P3,shallow:sE,deep:dE,ratio:dE/sE},P4,
 rows:rows.map(r=>({level:r.level,seed:r.seed,shallow:r.s,deep:r.d,corpusBins:r.corpusBins,expMatch:r.corpusExp.shallowExpandedStates===r.s.exp&&r.corpusExp.deepExpandedStates===r.d.exp}))};
console.log(JSON.stringify(out,null,1));
