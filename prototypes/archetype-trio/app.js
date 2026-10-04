(async function () {
  'use strict';
  const game=window.Archetypes,$=id=>document.getElementById(id);
  let state,selection=[],swapped=false,preview=false,actions=[],session,dragging=false,identity;
  let saveQueue=Promise.resolve();
  try { const response=await fetch('/api/identity'); if(!response.ok) throw new Error(); identity=(await response.json()).identity; }
  catch { $('capture').textContent='Could not connect. Reload to begin recording.'; $('capture').classList.add('error'); return; }
  function persist() {
    session.actions=actions; session.feedback=$('feedback').value;session.revision++;
    const payload=JSON.stringify(session),id=session.sessionId;
    $('capture').textContent='Saving this play…';
    saveQueue=saveQueue.then(async()=>{
      try {
        const response=await fetch('/api/session',{method:'POST',headers:{'content-type':'application/json'},body:payload,keepalive:true});
        if(!response.ok) throw new Error(await response.text());
        if(session.sessionId===id) { $('capture').textContent='Play saved locally. Restart begins a separate play.'; $('capture').classList.remove('error'); }
      } catch { if(session.sessionId===id) { $('capture').textContent='Could not save. Download this play to keep a copy.'; $('capture').classList.add('error'); } }
    });
  }
  function begin(id) {
    if(session) persist();
    state=game.create(id);selection=[];swapped=false;preview=false;actions=[];
    session={sessionId:crypto.randomUUID(),identity,level:id,actions,feedback:'',revision:0};
    $('feedback').value='';$('feedback-panel').open=false;
    history.replaceState(null,'',`?level=${id}`);render();persist();
  }
  function projected() { return game.valid(state,selection)?game.move(state,selection,swapped):null; }
  function render() {
    const level=game.LEVELS[state.id],prediction=projected(),shown=preview&&prediction?prediction:state;
    $('chain-sum').textContent=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0).toLocaleString();
    document.body.classList.toggle('previewing',preview&&Boolean(prediction));
    document.querySelectorAll('[data-level]').forEach(button=>{
      const active=button.dataset.level===state.id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    $('number').textContent=`PROTOTYPE 0${Object.keys(game.LEVELS).indexOf(state.id)+1}`;
    $('name').textContent=level.name;$('subtitle').textContent=level.subtitle;$('rule').textContent=level.rule;
    $('detail').textContent=state.id==='gates'?'Dashed tiles are open passages. A closed gate holds its tile in place. The outlined switch stays on the board.':
      state.id==='delivery'?'The parcel cannot join a chain. Get it to the bottom of its column. A large merged tile can get in its way.':
      'Queues fill each column from top to bottom and repeat. Swap freely before merging; it costs no move.';
    $('goal-label').textContent=state.id==='delivery'?'PARCEL DELIVERED':'SCORE / TARGET';
    $('score').textContent=state.id==='delivery'?`${shown.delivered} / 1`:`${shown.score.toLocaleString()} / ${level.target.toLocaleString()}`;
    $('moves').textContent=shown.maxMoves-shown.moves;
    $('special-label').textContent=state.id==='gates'?'OPEN PASSAGE':state.id==='delivery'?'MERGE SCORE':'QUEUE ORDER';
    $('special').textContent=state.id==='gates'?(shown.gate==='lower'?'Lower':'Upper'):state.id==='delivery'?shown.score.toLocaleString():(swapped?'B · A':'A · B');
    $('exit').hidden=state.id!=='delivery';$('question').textContent=level.question;
    const board=$('board');board.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;board.replaceChildren();
    for(let y=0;y<shown.gridHeight;y++) for(let x=0;x<shown.gridWidth;x++) {
      const tile=shown.grid[y][x],wall=level.grid[y][x]===0;
      const cell=document.createElement(wall?'div':'button');cell.className=wall?'wall':'tile';
      if(wall){cell.setAttribute('aria-hidden','true');board.append(cell);continue;}
      cell.dataset.x=x;cell.dataset.y=y;cell.type='button';
      cell.classList.add(tile.value>64?'built':`v${tile.value}`);
      cell.append(document.createTextNode(tile.cargo?'▣':tile.value));
      const gateIndex=level.gates?.findIndex(([gx,gy])=>gx===x&&gy===y) ?? -1;
      let label=`Column ${x+1}, row ${y+1}: ${tile.cargo?'parcel':tile.value}`;
      if(tile.cargo){cell.classList.add('cargo');const tag=document.createElement('small');tag.textContent='PARCEL';cell.append(tag);}
      if(gateIndex>=0) {
        const closed=game.blocked(shown,x,y);cell.classList.add('gate');if(closed)cell.classList.add('closed');
        const tag=document.createElement('small');tag.textContent=closed?'CLOSED':'OPEN';cell.append(tag);label+=closed?', closed gate':', open gate';
      }
      if(level.switch?.[0]===x&&level.switch[1]===y){cell.classList.add('switch');const tag=document.createElement('small');tag.textContent='SWITCH';cell.append(tag);label+=', switch';}
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('selected');const tag=document.createElement('span');tag.className='order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||shown.outcome!=='playing'||tile.cargo||game.blocked(shown,x,y);
      cell.setAttribute('aria-label',label);cell.setAttribute('aria-pressed',String(order>=0&&!preview));board.append(cell);
    }
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);$('path').setAttribute('preserveAspectRatio','none');$('path').replaceChildren();
    if(!preview&&selection.length>1){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#e59a59');line.setAttribute('stroke-opacity','.7');line.setAttribute('stroke-width','5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');$('path').append(line);}
    $('feeders').hidden=state.id!=='feeders';
    if(state.id==='feeders') {
      $('feeders').replaceChildren();const queues=document.createElement('div');queues.className='queues';
      for(let column=0;column<2;column++) {
        const source=swapped?1-column:column,box=document.createElement('div'),title=document.createElement('strong'),values=document.createElement('span');
        title.textContent=`Column ${level.feeders[column]+1} ← Queue ${source?'B':'A'}`;
        values.className='queue-values';values.textContent=game.packet(shown,source).join('  ');box.append(title,values);queues.append(box);
      }
      const button=document.createElement('button');button.id='swap';button.className='secondary';button.textContent='⇄ Swap queues';button.disabled=state.outcome!=='playing';
      button.onclick=()=>{swapped=!swapped;render();};$('feeders').append(queues,button);
    }
    $('preview').disabled=!prediction;$('merge').disabled=!prediction||state.outcome!=='playing';
    $('clear').disabled=selection.length===0;$('preview').textContent=preview?'Back to board':'Preview result';
    $('undo').disabled=!actions.some(action=>action.type==='move')||state.moves===0;
    $('selection').textContent=prediction?
      `${preview?'PREVIEW · ':''}${selection.length} tiles · +${prediction.last.points.toLocaleString()} points · ${prediction.last.landing.value} lands at column ${prediction.last.landing.x+1}, row ${prediction.last.landing.y+1}${prediction.last.gateChanged?' · passages switch':''}${prediction.last.delivered?' · parcel delivered':''}`:
      selection.length?`${selection.length} selected. ${selection.length<2?'Add an equal neighbor.':'Continue with equal or double values.'}`:
      state.last?`Last move: +${state.last.points.toLocaleString()} points. Choose another chain.`:'Tap connected tiles or drag a path. Choose at least three.';
    $('outcome').hidden=state.outcome==='playing';
    $('outcome').textContent=state.outcome==='won'?`Complete in ${state.moves} moves. Try another approach, or move to the next idea.`:
      state.outcome==='no-chains'?'No legal chains remain. Undo to explore a different choice.':'No moves left. Undo or restart the same board.';
  }
  function select(x,y) {
    if(preview||state.outcome!=='playing')return;
    const existing=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(existing>=0) { if(existing===selection.length-1)return; selection=selection.slice(0,existing+1);render();return; }
    const next=[...selection,[x,y]];
    if(game.valid(state,next,false)){selection=next;render();}
  }
  $('board').addEventListener('pointerdown',event=>{
    const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;
    event.preventDefault();dragging=true;select(Number(cell.dataset.x),Number(cell.dataset.y));
  });
  window.addEventListener('pointermove',event=>{
    if(!dragging)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#board button[data-x]');
    if(cell&&!cell.disabled)select(Number(cell.dataset.x),Number(cell.dataset.y));
  });
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);
  $('board').addEventListener('click',event=>{
    if(event.detail!==0)return;const cell=event.target.closest('button[data-x]');
    if(cell&&!cell.disabled){const x=cell.dataset.x,y=cell.dataset.y;select(Number(x),Number(y));$('board').querySelector(`[data-x="${x}"][data-y="${y}"]`)?.focus();}
  });
  $('clear').onclick=()=>{selection=[];preview=false;render();};
  $('preview').onclick=()=>{preview=!preview;render();};
  $('merge').onclick=()=>{
    if(!game.valid(state,selection))return;
    state=game.move(state,selection,swapped);actions.push({type:'move',chain:selection.map(p=>[...p]),swapped});selection=[];preview=false;render();persist();
    if(state.outcome!=='playing')$('feedback-panel').open=true;
  };
  $('undo').onclick=()=>{if(state.moves===0)return;actions.push({type:'undo'});state=game.replay(state.id,actions);swapped=state.swapped;selection=[];preview=false;render();persist();};
  $('restart').onclick=()=>begin(state.id);
  document.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>{if(button.dataset.level!==state.id)begin(button.dataset.level);});
  $('save-feedback').onclick=persist;
  $('feedback').onchange=persist;
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify({...session,actions,feedback:$('feedback').value,finalState:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${state.id}-${session.sessionId}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const requested=new URLSearchParams(location.search).get('level');begin(Object.hasOwn(game.LEVELS,requested)?requested:Object.keys(game.LEVELS)[0]);
})();
