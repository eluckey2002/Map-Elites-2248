'use strict';
// New orchestration for the prospective continuation. Historical sources stay frozen.
const {atomicJson, charge, assertPanel, paired} = require('./recovery-core');
const {accepted} = require('./decision');
const ARMS = ['champion', 'zero', 'handicap10', 'handicap5'];
const blocks = n => Array.from({length:n}, (_,i) => `C${i+1}`);
function initialRaw(previous, closure, config, registration) {
  if (JSON.stringify(previous.counts)!==JSON.stringify(config.carryForward.counts)
      || JSON.stringify(closure.chargedAccounting)!==JSON.stringify(previous.counts)) throw new Error('carried charges changed');
  if (closure.closure_status!=='UNVERIFIED' || closure.completeControlBlocks!==11
      || closure.proposalRounds!==0 || closure.confirmationGames!==0) throw new Error('unexpected previous boundary');
  if (JSON.stringify(previous.headlines.controls.map(r=>r.block))!==JSON.stringify(blocks(11))) throw new Error('eleven ordered carried controls required');
  for (const block of blocks(11)) for (const arm of ARMS) {
    const selected=previous.panels.filter(p=>p.block===block&&p.arm===arm);
    if(selected.length!==1) throw new Error('incomplete carried control');
    assertPanel(selected[0], config);
  }
  if(previous.panels.some(p=>p.block==='C12')) throw new Error('previous C12 must remain excluded');
  return {kind:'exploration-diagnostic-resumed', result:config.result, registration, config,
    levelDefinitions:structuredClone(previous.levelDefinitions), panels:structuredClone(previous.panels),
    excludedOriginalPanels:structuredClone(previous.excludedOriginalPanels),
    excludedPreviousC12:structuredClone(config.carryForward.excludedPreviousC12),
    counts:structuredClone(previous.counts), dispatches:[], parity:structuredClone(previous.parity),
    inert:structuredClone(previous.inert), filesRead:[],
    headlines:{controls:structuredClone(previous.headlines.controls)}, status:'RUNNING'};
}
function aggregate(rows, historicalMde) {
  const zeroAccepted=rows.filter(r=>accepted(r.zero)).length;
  const strongDetected=rows.filter(r=>Number.isFinite(r.strong.moveCi95[1])&&r.strong.moveCi95[1]<0).length;
  const mildDetected=rows.filter(r=>Number.isFinite(r.mild.moveCi95[1])&&r.mild.moveCi95[1]<0).length;
  const zeroMdes=rows.map(r=>({block:r.block,se:r.zero.moveSe,smallestDetectableGain80:2.8*r.zero.moveSe}));
  const zeroMde=Math.max(...zeroMdes.map(r=>r.smallestDetectableGain80));
  return {bars:{zeroAccepted,zeroCeiling:1,strongDetected,strongTotal:12,strongRequired:0.8,mildDetected,
    zeroMdes,historicalMde,zeroMde,reportedDetectableGain:Math.max(historicalMde,zeroMde)},
    path:zeroAccepted>1||strongDetected/12<0.8?'C':'CONTROLS_PASSED'};
}
function completionProblems(raw) {
  const problems=[], panels=raw.panels.filter(p=>/^C\d+$/.test(p.block));
  for(const block of blocks(12)) for(const arm of ARMS) {
    const selected=panels.filter(p=>p.block===block&&p.arm===arm);
    if(selected.length!==1) problems.push(`${block}/${arm}: expected exactly one panel`);
    else try{assertPanel(selected[0],raw.config);}catch(e){problems.push(e.message);}
  }
  if(panels.length!==48) problems.push('expected exactly48 control panels');
  if(JSON.stringify(raw.headlines.controls.map(r=>r.block))!==JSON.stringify(blocks(12))) problems.push('twelve ordered summaries required');
  const expected=structuredClone(raw.config.carryForward.counts);
  const seen=new Set();
  for(const d of raw.dispatches) {
    if(d.block!=='C12'||!ARMS.includes(d.arm)||seen.has(d.arm)||d.budget!=='controls'||d.games!==580) problems.push('only four distinct replacement C12 dispatches allowed');
    seen.add(d.arm); expected.controls+=d.games;
    const p=panels.find(p=>p.block===d.block&&p.arm===d.arm);
    if(!p||JSON.stringify(p.policy)!==JSON.stringify(d.policy)||JSON.stringify(p.seeds)!==JSON.stringify(d.seeds)) problems.push('dispatch differs from retained replacement panel');
  }
  if(raw.dispatches.length!==4||seen.size!==4) problems.push('four replacement dispatches required');
  if(JSON.stringify(expected)!==JSON.stringify(raw.counts)) problems.push('carried/new accounting mismatch');
  const derived=aggregate(raw.headlines.controls,raw.config.historicalMde);
  if(JSON.stringify(derived.bars)!==JSON.stringify(raw.headlines.bars)||derived.path!==raw.headlines.path) problems.push('aggregate bars or disposition changed');
  return problems;
}
module.exports={ARMS,atomicJson,charge,assertPanel,paired,initialRaw,aggregate,completionProblems};
