'use strict';
function generationDecision(rows, issues, minimum = 30) {
 if (!Number.isInteger(minimum) || minimum < 1) throw Error('invalid minimum subset size');
 if (issues.length) return { path:null, status:'UNMET_ITEM', n:null, misses:null };
 const subset=rows.filter(r=>r.ownerFaster && r.ownerPoints>r.botPoints);
 const n=subset.length, misses=subset.filter(r=>r.poolBest<r.ownerPoints).length;
 if(n<minimum) return {path:null,status:'INCONCLUSIVE_SMALL_SUBSET',n,misses};
 return {path:misses*2>=n?'E':null,status:misses*2>=n?'GENERATION_BOTTLENECK':'CONTINUE',n,misses};
}
module.exports={generationDecision};
