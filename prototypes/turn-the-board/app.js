(async function () {
  'use strict';
  const game = window.Archetypes, $ = id => document.getElementById(id);
  const gravityNames = {down:'↓ Down',left:'← Left',up:'↑ Up',right:'→ Right'};
  const gravityOrder = ['down','left','up','right'];
  let state, selection=[], preview=false, turn=null, actions=[], session, dragging=false, identity;
  let saveQueue = Promise.resolve();
  try {
    const response = await fetch('/api/identity');
    if (!response.ok) throw new Error();
    identity = (await response.json()).identity;
  } catch {
    $('capture').textContent='Could not connect. Reload to begin recording.';
    $('capture').classList.add('error'); return;
  }
  function persist() {
    session.actions=actions; session.feedback=$('feedback').value; session.revision++;
    const payload=JSON.stringify(session), id=session.sessionId;
    $('capture').textContent='Saving this play…';
    saveQueue=saveQueue.then(async()=>{
      try {
        const response=await fetch('/api/session',{method:'POST',headers:{'content-type':'application/json'},body:payload,keepalive:true});
        if (!response.ok) throw new Error(await response.text());
        if (session.sessionId===id) {
          $('capture').textContent='Play saved locally. Restart begins a separate play.';
          $('capture').classList.remove('error');
        }
      } catch {
        if (session.sessionId===id) {
          $('capture').textContent='Could not save. Download this play to keep a copy.';
          $('capture').classList.add('error');
        }
      }
    });
  }
  function begin() {
    if (session) persist();
    state=game.create('turn'); selection=[]; preview=false; turn=null; actions=[];
    session={sessionId:crypto.randomUUID(),identity,level:'turn',actions,feedback:'',revision:0};
    $('feedback').value=''; $('feedback-panel').open=false; render(); persist();
  }
  function projected() {
    if (state.outcome!=='playing') return null;
    return turn ? game.rotate(state,turn) : game.valid(state,selection) ? game.move(state,selection) : null;
  }
  function resetSelection() { selection=[]; preview=false; turn=null; }
  function render() {
    const prediction=projected(), shown=preview&&prediction ? prediction : state;
    document.body.classList.toggle('previewing',preview&&Boolean(prediction));
    $('score').textContent=`${shown.score.toLocaleString()} / ${shown.targetScore.toLocaleString()}`;
    $('moves').textContent=shown.maxMoves-shown.moves;
    $('gravity').textContent=gravityNames[shown.gravity];
    $('gravity-label').textContent=preview ? 'GRAVITY · PREVIEW' : 'GRAVITY';
    $('chain-sum').textContent=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0).toLocaleString();
    const board=$('board'); board.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`; board.replaceChildren();
    for (let y=0;y<shown.gridHeight;y++) for (let x=0;x<shown.gridWidth;x++) {
      const tile=shown.grid[y][x], cell=document.createElement(tile ? 'button' : 'div');
      cell.dataset.x=x; cell.dataset.y=y;
      if (!tile) { cell.className='empty'; cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: empty`); board.append(cell); continue; }
      cell.type='button'; cell.className='tile'; cell.classList.add(tile.value>64 ? 'built' : `v${tile.value}`);
      cell.append(document.createTextNode(tile.value));
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if (order>=0&&!preview) {
        cell.classList.add('selected'); const tag=document.createElement('span');
        tag.className='order'; tag.textContent=order+1; cell.append(tag);
      }
      cell.disabled=preview||state.outcome!=='playing';
      cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${tile.value}`);
      cell.setAttribute('aria-pressed',String(order>=0&&!preview)); board.append(cell);
    }
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);
    $('path').setAttribute('preserveAspectRatio','none'); $('path').replaceChildren();
    if (!preview&&selection.length>1) {
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      line.setAttribute('points',selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '));
      line.setAttribute('fill','none'); line.setAttribute('stroke','#e59a59'); line.setAttribute('stroke-width','5');
      line.setAttribute('stroke-linecap','round'); line.setAttribute('stroke-linejoin','round'); $('path').append(line);
    }
    $('preview').disabled=!prediction; $('merge').disabled=!prediction;
    $('clear').disabled=!preview&&!selection.length; $('clear').textContent=preview ? 'Cancel' : 'Clear';
    $('preview').textContent=preview ? 'Back to board' : 'Preview result';
    $('merge').textContent=turn ? 'Commit turn · 1 move' : 'Merge chain';
    $('undo').disabled=state.moves===0;
    $('turn-cw').disabled=$('turn-ccw').disabled=state.outcome!=='playing';
    const directionIndex=gravityOrder.indexOf(state.gravity);
    $('turn-cw').textContent=`↷ Preview ${gravityNames[gravityOrder[(directionIndex+1)%4]]}`;
    $('turn-ccw').textContent=`↶ Preview ${gravityNames[gravityOrder[(directionIndex+3)%4]]}`;
    $('selection').textContent=turn ? `PREVIEW · gravity ${gravityNames[prediction.gravity]} · 1 move · no points or new tiles. Commit or go back.` :
      prediction ? `${preview?'PREVIEW · ':''}${selection.length} tiles · +${prediction.last.points.toLocaleString()} points · ${prediction.last.landing.value} lands at column ${prediction.last.landing.x+1}, row ${prediction.last.landing.y+1}` :
      selection.length ? `${selection.length} selected. ${selection.length<2?'Add an equal neighbor.':'Continue with equal or double values.'}` :
      'Choose a chain, or preview a turn. Empty cells are open space.';
    $('outcome').hidden=state.outcome==='playing';
    $('outcome').textContent=state.outcome==='won' ? `Complete in ${state.moves} actions. Try another plan, or share what changed your choice.` : 'No moves left. Undo or restart the same board.';
  }
  function select(x,y) {
    if (preview||state.outcome!=='playing') return;
    const existing=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if (existing>=0) { if(existing!==selection.length-1){selection=selection.slice(0,existing+1);render();} return; }
    const next=[...selection,[x,y]];
    if (game.valid(state,next,false)) { selection=next; render(); }
  }
  $('board').addEventListener('pointerdown',event=>{
    const cell=event.target.closest('button[data-x]'); if(!cell||cell.disabled)return;
    event.preventDefault(); dragging=true; select(Number(cell.dataset.x),Number(cell.dataset.y));
  });
  window.addEventListener('pointermove',event=>{
    if (!dragging) return;
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#board button[data-x]');
    if (cell&&!cell.disabled) select(Number(cell.dataset.x),Number(cell.dataset.y));
  });
  window.addEventListener('pointerup',()=>dragging=false); window.addEventListener('pointercancel',()=>dragging=false);
  $('board').addEventListener('click',event=>{
    if(event.detail!==0)return; const cell=event.target.closest('button[data-x]');
    if(cell&&!cell.disabled){select(Number(cell.dataset.x),Number(cell.dataset.y));$('board').querySelector(`[data-x="${cell.dataset.x}"][data-y="${cell.dataset.y}"]`)?.focus();}
  });
  for (const direction of ['cw','ccw']) $('turn-'+direction).onclick=()=>{
    if (state.outcome!=='playing') return;
    selection=[]; turn=direction; preview=true; render();
  };
  $('clear').onclick=()=>{resetSelection();render();};
  $('preview').onclick=()=>{if(turn){resetSelection();}else preview=!preview;render();};
  $('merge').onclick=()=>{
    if(!projected())return;
    const action=turn ? {type:'rotate',direction:turn} : {type:'move',chain:selection.map(point=>[...point])};
    state=projected(); actions.push(action); resetSelection(); render(); persist();
    if(state.outcome!=='playing')$('feedback-panel').open=true;
  };
  $('undo').onclick=()=>{if(state.moves===0)return;actions.push({type:'undo'});state=game.replay('turn',actions);resetSelection();render();persist();};
  $('restart').onclick=begin; $('save-feedback').onclick=persist; $('feedback').onchange=persist;
  $('export').onclick=()=>{
    const blob=new Blob([JSON.stringify({...session,actions,feedback:$('feedback').value,finalState:state},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');link.href=url;link.download=`turn-${session.sessionId}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  begin();
})();
