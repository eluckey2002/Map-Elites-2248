(async function(){
  'use strict';
  const game=window.Continuous,$=id=>document.getElementById(id);
  let state,selection=[],actions=[],history=[],restoredUndoCount=0,session,identity,preview=false,dragging=false,note='';
  let saveQueue=Promise.resolve();
  let combinationGoal=null,combinationsOpen=false;
  try{const response=await fetch('/api/identity');if(!response.ok)throw new Error();identity=(await response.json()).identity;}
  catch{$('capture').textContent='Could not connect. Reload to begin recording.';return;}
  function persist(){
    session.actions=actions;session.feedback=$('feedback').value;session.revision++;
    const body=JSON.stringify(session),id=session.sessionId,revision=session.revision;
    $('capture').textContent='Saving this play…';
    saveQueue=saveQueue.then(async()=>{
      try{
        const response=await fetch('/api/session',{method:'POST',headers:{'content-type':'application/json'},body});
        if(!response.ok)throw new Error();
        if(session.sessionId===id&&session.revision===revision){$('capture').textContent='Play saved locally.';$('capture').classList.remove('error');}
      }catch{if(session.sessionId===id){$('capture').textContent='Could not save. Download this play to keep a copy.';$('capture').classList.add('error');}}
    });
  }
  function begin(saved){
    const restored=saved?game.replay('continuous',saved.actions):null;
    if(session)persist();
    state=restored||game.create();selection=[];actions=saved?JSON.parse(JSON.stringify(saved.actions)):[];history=[];preview=false;note='';
    combinationGoal=null;combinationsOpen=false;
    restoredUndoCount=actions.reduce((n,a)=>a.type==='undo'?n-1:['move','skip','new-board'].includes(a.type)?n+1:n,0);
    session={sessionId:crypto.randomUUID(),identity,level:'continuous',actions,feedback:'',revision:0};
    $('feedback').value=saved?.feedback||'';$('feedback-status').textContent='';
    $('resume-status').hidden=!saved;$('resume-status').textContent=saved?`Continued your saved run at move ${state.totalMoves}. Your original capture is unchanged.`:'';
    window.history.replaceState({},'',`?session=${session.sessionId}`);render();persist();
  }
  function render(){
    const legal=state.outcome==='playing'&&game.valid(state,selection);
    const prediction=legal?game.preview(state,selection):null,shown=preview&&prediction?prediction:state;
    const objective=state.objective,total=selection.reduce((n,[x,y])=>n+state.grid[y][x].value,0);
    const goalKey=objective?`${state.boardNumber}/${objective.number}/${objective.target}`:null;
    if(goalKey!==combinationGoal){combinationGoal=goalKey;combinationsOpen=false;$('combination-list').replaceChildren();}
    $('show-combinations').hidden=!objective;$('show-combinations').textContent=combinationsOpen?'Hide combinations':'Show combinations';
    $('show-combinations').setAttribute('aria-expanded',String(combinationsOpen));$('combinations').hidden=!combinationsOpen||!objective;
    $('combinations-title').textContent=objective?`Ways to make ${objective.target.toLocaleString()}`:'';
    $('chain-sum').textContent=total.toLocaleString();$('target-hint').textContent=objective?`Target ${objective.target.toLocaleString()} · exact sum`:'';
    const difference=objective?objective.target-total:0;
    $('target-balance').textContent=!objective?'':difference>0?`${difference.toLocaleString()} remaining`:difference<0?`${(-difference).toLocaleString()} over target`:'Exact sum · check the endpoints';
    $('target-math').hidden=!objective;
    const halves=[];
    if(objective){let value=objective.target;halves.push(value);while(value>1&&value%2===0){value/=2;halves.push(value);}}
    $('target-halves').textContent=halves.map(n=>n.toLocaleString()).join(' → ');
    $('completed').textContent=state.completed;$('moves').textContent=state.totalMoves;$('skipped').textContent=state.skipped;
    $('objective-number').textContent=objective?`Challenge ${objective.number} · bank ${objective.bankCard} / ${game.BANK.length}`:'Between challenges';
    $('objective-title').textContent=objective?`Connect ① and ② · create ${objective.target.toLocaleString()}`:'Keep the board moving';
    $('objective-detail').textContent=objective?'Start and finish on the marked places. Other plays leave this challenge active.':'No spaced challenge available here. Make a normal merge or deal a new board.';
    document.body.classList.toggle('previewing',preview&&Boolean(prediction));$('preview-label').hidden=!preview;
    $('board').style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;$('board').replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');
      cell.type='button';cell.className=`tile ${tile.value>128?'built':`v${tile.value}`}`;cell.dataset.x=x;cell.dataset.y=y;cell.append(document.createTextNode(tile.value));
      let label=`Column ${x+1}, row ${y+1}: ${tile.value}`;
      const endpoint=objective?.ends.findIndex(([gx,gy])=>gx===x&&gy===y)??-1;
      if(endpoint>=0){const tag=document.createElement('span');tag.className='endpoint-tag';tag.textContent=endpoint===0?'①':'②';cell.append(tag);cell.classList.add('endpoint');label+=`, fixed endpoint ${endpoint+1}`;}
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('selected');const tag=document.createElement('span');tag.className='order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||shown.outcome!=='playing';cell.setAttribute('aria-label',label);cell.setAttribute('aria-pressed',String(order>=0&&!preview));$('board').append(cell);
    }
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);$('path').setAttribute('preserveAspectRatio','none');$('path').replaceChildren();
    if(!preview&&selection.length>1){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');for(const [name,value]of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:'#e59a59','stroke-width':'5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(name,value);$('path').append(line);}
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length;$('undo').disabled=!history.length&&!restoredUndoCount;$('skip').disabled=!objective;
    $('preview').textContent=preview?'Back to board':'Preview result';
    $('selection').textContent=note||(prediction?`${preview?'PREVIEW · ':''}${selection.length} tiles → ${total.toLocaleString()}. ${game.matches(state,selection)?`Completes challenge ${objective.number}.`:'Normal merge — the challenge stays active.'}`:selection.length?`${selection.length} selected. Start with two equal tiles, then continue equal or double.`:'Choose a chain. Use normal moves to arrange the connection.');
    $('outcome').hidden=state.outcome==='playing';$('outcome').textContent='No legal chains remain. Undo, or use “New board + next challenge” in Run controls.';
    const selected=$('feedback-target').value;$('feedback-target').replaceChildren();
    const choices=[...(objective?[{number:objective.number,status:'active'}]:[]),...state.log.slice(-8).reverse()];
    for(const entry of choices){const option=document.createElement('option');option.value=String(entry.number);option.textContent=`Challenge ${entry.number} · ${entry.status}`;$('feedback-target').append(option);}
    $('feedback-target').value=choices.some(e=>String(e.number)===selected)?selected:String(choices[0]?.number??'');
    $('recent').replaceChildren();
    for(const entry of state.log.slice(-8).reverse()){const li=document.createElement('li');li.textContent=`#${entry.number} · ${entry.target} · ${entry.status} · ${entry.movesSpent} moves`;$('recent').append(li);}
    for(const rating of ['interesting','obvious','stuck','confusing'])$(`rate-${rating}`).disabled=!choices.length;
  }
  function resetSelection(){selection=[];preview=false;dragging=false;note='';}
  function select(x,y){
    if(preview||state.outcome!=='playing')return;
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0){selection=selection.slice(0,prior+1);note='';render();return;}
    const next=[...selection,[x,y]];
    if(game.valid(state,next,false)){selection=next;note='';}else note='That tile cannot extend this chain. Start equal, then follow equal or double values.';
    render();
  }
  $('board').addEventListener('pointerdown',event=>{const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;event.preventDefault();dragging=true;select(Number(cell.dataset.x),Number(cell.dataset.y));});
  window.addEventListener('pointermove',event=>{if(!dragging)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#board button[data-x]');if(cell&&!cell.disabled)select(Number(cell.dataset.x),Number(cell.dataset.y));});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);
  $('board').addEventListener('click',event=>{if(event.detail!==0)return;const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;const{x,y}=cell.dataset;select(Number(x),Number(y));$('board').querySelector(`[data-x="${x}"][data-y="${y}"]`)?.focus();});
  $('clear').onclick=()=>{resetSelection();render();};$('preview').onclick=()=>{preview=!preview;note='';render();};
  $('show-combinations').onclick=()=>{
    if(!state.objective)return;
    if(!combinationsOpen&&!$('combination-list').children.length){
      const examples=window.ValueCombinations.recipes(state.objective.target,state.gridWidth*state.gridHeight);
      for(const values of examples){
        const item=document.createElement('li'),count=document.createElement('strong'),equation=document.createElement('span');
        count.textContent=`${values.length} tiles`;
        equation.textContent=`${values.map(n=>n.toLocaleString()).join(' + ')} = ${state.objective.target.toLocaleString()}`;
        item.append(count,equation);$('combination-list').append(item);
      }
      if(!examples.length){const item=document.createElement('li');item.textContent='No power-of-two example fits this tile budget. This does not mean the challenge is impossible.';$('combination-list').append(item);}
    }
    combinationsOpen=!combinationsOpen;render();
  };
  function apply(action,operation){history.push(state);state=operation(state);actions.push(action);resetSelection();render();persist();}
  $('merge').onclick=()=>{
    if(state.outcome!=='playing'||!game.valid(state,selection))return;
    const chain=selection.map(p=>[...p]),completed=game.matches(state,chain),number=state.objective?.number;
    apply({type:'move',chain},s=>game.move(s,chain));
    if(completed){note=`Challenge ${number} complete. ${state.objective?`Challenge ${state.objective.number} is ready on the same board.`:'Keep playing or deal a new board.'}`;$('feedback-target').value=String(number);render();}
  };
  $('skip').onclick=()=>{if(state.objective)apply({type:'skip'},game.skip);};
  $('new-board').onclick=()=>apply({type:'new-board'},game.newBoard);
  $('undo').onclick=()=>{
    if(!history.length&&!restoredUndoCount)return;
    actions.push({type:'undo'});
    if(history.length)state=history.pop();else{state=game.replay('continuous',actions);restoredUndoCount--;}
    resetSelection();render();persist();
  };
  for(const rating of ['interesting','obvious','stuck','confusing'])$(`rate-${rating}`).onclick=()=>{
    const objective=Number($('feedback-target').value);if(!objective)return;
    const action={type:'feedback',objective,rating,note:$('feedback').value};actions.push(action);
    state=JSON.parse(JSON.stringify(state));state.notes.push({objective,rating,note:action.note,atMove:state.totalMoves});
    $('feedback').value='';$('feedback-status').textContent=`Saved ${rating} for challenge ${objective}.`;persist();
  };
  $('feedback').onchange=persist;$('restart').onclick=()=>begin();
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify({...session,actions,feedback:$('feedback').value,finalState:state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`connection-run-${session.sessionId}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const resumeId=new URLSearchParams(window.location.search).get('session');
  if(resumeId){
    try{
      if(!/^[0-9a-f-]{36}$/.test(resumeId))throw new Error();
      const response=await fetch(`/api/session/${resumeId}`);if(!response.ok)throw new Error();
      const saved=await response.json();if(saved.identity!==identity||saved.level!=='continuous')throw new Error();
      begin(saved);
    }catch{
      begin();$('resume-status').hidden=false;$('resume-status').textContent='Could not restore that saved run. This is a fresh board; the original saved play is unchanged.';
    }
  }else begin();
})();
