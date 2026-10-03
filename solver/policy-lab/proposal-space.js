'use strict';
// Deterministic orchestration, without game execution or statistical rules.
const DOSES = {occupancy: [0.001, 1, 8, 128, 1000000], width: [28, 32, 40, 48, 64], pathWidth: [10, 12, 16, 20, 24]};
function jointSpace(accepted) {
  if (!accepted.length) return [];
  const axes = Object.keys(DOSES).filter(key => accepted.some(row => row.coordinate === key)).map(key => {
    const indices = new Set();
    for (const row of accepted.filter(row => row.coordinate === key)) {
      const i = DOSES[key].indexOf(row.dose);
      if (i < 0) throw new Error('accepted dose outside registration');
      for (const n of [i - 1, i, i + 1]) if (n >= 0 && n < DOSES[key].length) indices.add(n);
    }
    return [key, [...indices].sort((a,b) => a-b).map(i => DOSES[key][i])];
  });
  let space = [{}];
  for (const [key, values] of axes) space = space.flatMap(spec => values.map(value => ({...spec, [key]: value})));
  // Rank around the strongest fresh accepted dose on each coordinate, rather
  // than spending the finite prefix solely on the lowest first-coordinate
  // doses. Every active coordinate varies jointly; ties are deterministic.
  const centers=Object.fromEntries(axes.map(([key])=>{
    const best=accepted.filter(r=>r.coordinate===key).sort((a,b)=>(b.recheck?.meanMovesSaved??0)-(a.recheck?.meanMovesSaved??0)||a.dose-b.dose)[0];
    return[key,DOSES[key].indexOf(best.dose)];
  }));
  const distance=spec=>axes.reduce((s,[key])=>s+Math.abs(DOSES[key].indexOf(spec[key])-centers[key]),0);
  space.sort((a,b)=>distance(a)-distance(b)||axes.reduce((difference,[key])=>difference||a[key]-b[key],0));
  return space.slice(0, 31).map(spec => {
    const policy = {kind: 'lab'};
    if (Object.hasOwn(spec, 'occupancy')) policy.weights = {occupancy: spec.occupancy};
    const params = Object.fromEntries(Object.entries(spec).filter(([k]) => k !== 'occupancy'));
    if (Object.keys(params).length) policy.params = params;
    return policy;
  });
}
function changeCount(policy) {return Object.keys(policy.weights || {}).length + Object.keys(policy.params || {}).length;}
function selectFrozen(rows) {
  const eligible = rows.filter(r => r.outcome === 'ACCEPTED' && r.recheck);
  return eligible.sort((a,b) => b.recheck.meanMovesSaved - a.recheck.meanMovesSaved
    || changeCount(a.policy) - changeCount(b.policy) || a.id.localeCompare(b.id))[0] || null;
}
module.exports = {DOSES, jointSpace, changeCount, selectFrozen};
