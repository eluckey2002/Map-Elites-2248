(async function () {
  'use strict';
  const game=window.Connections,$=id=>document.getElementById(id);
  let state,selection=[],actions=[],session,identity,preview=false,dragging=false,note='';
  let saveQueue=Promise.resolve();
  try {
    const response=await fetch('/api/identity');if(!response.ok)throw new Error();
    identity=(await response.json()).identity;
  } catch {$('capture').textContent='Could not connect. Reload to begin recording.';return;}
  function persist() {
    session.actions=actions;session.feedback=$('feedback').value;session.revision++;
    const body=JSON.stringify(session),id=session.sessionId;
    $('capture').textContent='Saving this play…';
    saveQueue=saveQueue.then(async()=>{
      try {
        const response=await fetch('/api/session',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true});
        if(!response.ok)throw new Error();
        if(session.sessionId===id){$('capture').textContent='Play saved locally.';$('capture').classList.remove('error');}
      } catch {if(session.sessionId===id){$('capture').textContent='Could not save. Download this play to keep a copy.';$('capture').classList.add('error');}}
    });
  }
  function begin() {
    if(session)persist();
    state=game.create();selection=[];actions=[];preview=false;note='';
    session={sessionId:crypto.randomUUID(),identity,level:'connections',actions,feedback:'',revision:0};
    $('feedback').value='';render();persist();
  }
  function render() {
    const prediction=game.valid(state,selection)?game.move(state,selection):null;
    const shown=preview&&prediction?prediction:state;
    $('chain-sum').textContent=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0).toLocaleString();
    $('completed').textContent=`${shown.goals.filter(g=>g.done).length} / ${shown.goals.length}`;
    $('moves').textContent=shown.maxMoves-shown.moves;$('score').textContent=shown.score.toLocaleString();
    document.body.classList.toggle('previewing',preview&&Boolean(prediction));
    $('preview-label').hidden=!preview;
    $('goals').replaceChildren();
    for(const goal of shown.goals) {
      const card=document.createElement('div');card.className=`goal-card goal-${goal.id}${goal.done?' done':''}`;
      const badge=document.createElement('span');badge.className='goal-letter';badge.textContent=goal.done?'✓':goal.id;
      const content=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small');
      title.textContent=`${goal.id} · ${goal.label}`;
      detail.textContent=goal.done?'Complete':goal.kind==='tiles'?'Moving tiles · connect the labels':'Fixed places · connect the corners';
      content.append(title,detail);card.append(badge,content);$('goals').append(card);
    }
    $('board').style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;$('board').replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++) {
      const tile=shown.grid[y][x],cell=document.createElement('button');
      cell.type='button';cell.className=`tile ${tile.value>64?'built':`v${tile.value}`}`;
      cell.dataset.x=x;cell.dataset.y=y;cell.append(document.createTextNode(tile.value));
      let label=`Column ${x+1}, row ${y+1}: ${tile.value}`;
      if(tile.mark) {
        const tag=document.createElement('span');tag.className=`mark mark-${tile.mark.goal}`;
        tag.textContent=`${tile.mark.goal}${tile.mark.end}`;cell.classList.add(`marked-${tile.mark.goal}`);cell.append(tag);
        label+=`, moving endpoint ${tag.textContent}`;
      }
      for(const goal of shown.goals.filter(g=>g.kind==='cells')) {
        const end=goal.ends.findIndex(([gx,gy])=>gx===x&&gy===y);
        if(end<0)continue;
        const tag=document.createElement('span');tag.className='fixed-tag';tag.textContent=`${goal.id}${end+1}${goal.done?' ✓':''}`;
        cell.classList.add(goal.done?'fixed-done':'fixed-end');cell.append(tag);label+=`, fixed endpoint ${goal.id}${end+1}`;
      }
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('selected');const tag=document.createElement('span');tag.className='order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||shown.outcome!=='playing';cell.setAttribute('aria-label',label);cell.setAttribute('aria-pressed',String(order>=0&&!preview));
      $('board').append(cell);
    }
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);
    $('path').setAttribute('preserveAspectRatio','none');$('path').replaceChildren();
    if(!preview&&selection.length>1) {
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [name,value] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:'#e59a59','stroke-width':'5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(name,value);
      $('path').append(line);
    }
    $('merge').disabled=!prediction;$('preview').disabled=!prediction;$('clear').disabled=!selection.length;
    $('preview').textContent=preview?'Back to board':'Preview result';$('undo').disabled=state.moves===0;
    const first=selection.length?state.grid[selection[0][1]][selection[0][0]]:null;
    $('selection').textContent=note || (prediction
      ? `${preview?'PREVIEW · ':''}${selection.length} tiles · ${prediction.last.landing.value} lands at column ${prediction.last.landing.x+1}, row ${prediction.last.landing.y+1}. ${prediction.last.completed.length?`Completes ${prediction.last.completed.join(' + ')}.`:'Setup move — no connection completed.'}`
      : first?.mark?`Connecting ${first.mark.goal}: finish at ${first.mark.goal}${first.mark.end===1?2:1}. Start with an equal neighbor; use at least three tiles.`
      : selection.length?`${selection.length} selected. Start with two equal tiles, then continue equal or double.`:'Connect labeled endpoints, or make an ordinary chain to prepare the board.');
    $('outcome').hidden=shown.outcome==='playing';
    $('outcome').textContent=shown.outcome==='won'?`${preview?'Preview: ':''}All three connected in ${shown.moves} moves. Which goal shaped your next decision?`
      :shown.outcome==='no-chains'?'No legal chains remain. Undo to try a different route.':'No moves left. Undo or restart the same board.';
  }
  function select(x,y) {
    if(preview||state.outcome!=='playing')return;
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0){selection=selection.slice(0,prior+1);note='';render();return;}
    const next=[...selection,[x,y]];
    if(game.valid(state,next,false)){selection=next;note='';}
    else note='That tile cannot extend this chain. Follow equal/double values; marked tiles must be the two ends of their own connection.';
    render();
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
    if(event.detail!==0)return;const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;
    const {x,y}=cell.dataset;select(Number(x),Number(y));$('board').querySelector(`[data-x="${x}"][data-y="${y}"]`)?.focus();
  });
  $('clear').onclick=()=>{selection=[];preview=false;note='';render();};
  $('preview').onclick=()=>{preview=!preview;note='';render();};
  $('merge').onclick=()=>{
    if(state.outcome!=='playing'||!game.valid(state,selection))return;
    state=game.move(state,selection);actions.push({type:'move',chain:selection.map(p=>[...p]),swapped:false});
    selection=[];preview=false;note='';render();persist();
  };
  $('undo').onclick=()=>{
    if(state.moves===0)return;actions.push({type:'undo'});state=game.replay('connections',actions);
    selection=[];preview=false;note='';render();persist();
  };
  $('restart').onclick=begin;$('save-feedback').onclick=persist;$('feedback').onchange=persist;
  $('export').onclick=()=>{
    const blob=new Blob([JSON.stringify({...session,actions,feedback:$('feedback').value,finalState:state},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`connections-${session.sessionId}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  begin();
})();
