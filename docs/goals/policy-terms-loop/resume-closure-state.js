'use strict';
// Completion fence only. Arithmetic is qualified separately by executable audits.
function requiredAudits({closure,controls,proposals,confirmation,verdict}) {
  if(!closure||closure.closure_status!=='CLOSED'||!['A','B','C','D'].includes(closure.path))throw new Error('completed named closure required');
  const completeControls=controls?.status==='CONTROLS_COMPLETE'&&controls.headlines?.controls?.length===12;
  const qualifiedControls=completeControls&&controls.headlines.path==='CONTROLS_PASSED';
  const commands=['solver/policy-lab/resume-recompute.js'];
  if(closure.path==='C'){
    if(!completeControls||controls.headlines.path!=='C'||proposals||confirmation)throw new Error('Path C requires completed failing controls and no ideas judged');
  }else if(closure.path==='B'){
    if(!qualifiedControls||proposals?.status!=='EXPLORATION_COMPLETE'||proposals.path!=='B'||proposals.candidate!=='NO_CANDIDATE'||confirmation)throw new Error('Path B requires completed no-candidate exploration');
  }else if(closure.path==='A'){
    if(!qualifiedControls||proposals?.status!=='EXPLORATION_COMPLETE'||proposals.path!=='CONFIRMATION_REGISTRATION_PENDING'
      ||confirmation?.status!=='PAIRS_COMPLETE'||!['SUPPORTED','FALSIFIED','INCONCLUSIVE'].includes(verdict?.primaryOutcome))throw new Error('Path A requires complete one-shot pairs and verdict');
  }else{
    const stopped=proposals||controls;
    if(stopped?.status!=='BUDGET_STOP'||(proposals&&proposals.path!=='D')||!stopped.error?.budget||confirmation)throw new Error('Path D requires a retained budget or effort stop');
  }
  if(proposals)commands.push('solver/policy-lab/resume-proposal-recompute.js');
  if(confirmation)commands.push('solver/policy-lab/resume-proposal-recompute.js --confirmation');
  return commands;
}
function requireCompletedAudit(command,output,{path}) {
  if(command.endsWith('--confirmation')){
    if(!output.includes('MATCH confirmation arithmetic')||!output.includes('PASS confirmation coverage'))throw new Error('complete confirmation audit required');
  }else if(command.includes('resume-proposal-recompute')){
    if(!output.includes('PASS completed proposal journal jobs')||!output.includes('MATCH retained proposal arithmetic'))throw new Error('complete proposal audit required');
  }else if(!output.includes('MATCH retained arithmetic')||(path!=='D'&&!output.includes('PASS complete journal jobs 232')))throw new Error('complete control audit required');
  if(/UNVERIFIED/.test(output))throw new Error('incomplete audit cannot qualify closeout');
}
module.exports={requiredAudits,requireCompletedAudit};
