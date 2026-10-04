(async function(){
  'use strict';
  const rules=window.ConnectionRules,$=id=>document.getElementById('cx-'+id);
  const params=new URLSearchParams(window.location.search),level=window.ConnectionLevels.find(item=>item.id===params.get('puzzle'));
  let state,actions=[],history=[],selection=[],preview=false,removing=false,dragging=false;
  let identity,attemptId,revision=0,saveQueue=Promise.resolve(),combinationsKey='',combinationsOpen=false;
  function resetSelection(){selection=[];preview=false;removing=false;dragging=false;}
  function persist(){
    const current=attemptId,currentRevision=++revision;
    const body=JSON.stringify({schemaVersion:1,attemptId,identity,levelId:level.id,revision,actions,feedback:$('feedback').value});
    $('save').textContent='Saving this attempt…';
    saveQueue=saveQueue.then(async()=>{
      try{
        const response=await fetch('/api/connection-attempts',{method:'POST',headers:{'content-type':'application/json'},body});
        if(!response.ok)throw new Error();
        if(attemptId===current&&revision===currentRevision)$('save').textContent='Attempt saved locally.';
      }catch{if(attemptId===current)$('save').textContent='Could not save this attempt. Keep this tab open; your moves are still here.';}
    });
  }
  function render(){
    const legal=!removing&&state.outcome==='playing'&&rules.valid(state,selection);
    const predicted=legal?rules.preview(state,selection):null,shown=preview&&predicted?predicted:state;
    const goal=state.objective,total=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0);
    $('progress').textContent=`${state.completed} / ${level.objectives.length}`;
    $('moves').textContent=String(state.maxMoves-state.moves);$('charges').textContent=`${state.charges} / ${rules.CAPACITY}`;
    $('goal-number').textContent=goal?`Connection ${state.completed+1} of ${level.objectives.length}`:'All connections complete';
    $('goal-title').textContent=goal?`Connect ① and ② · create ${goal.target.toLocaleString()}`:'Puzzle complete';
    const halves=[];if(goal){let value=goal.target;halves.push(value);while(value>1&&value%2===0){value/=2;halves.push(value);}}
    $('halves').textContent=halves.map(value=>value.toLocaleString()).join(' → ');
    $('sum').textContent=total.toLocaleString();
    const difference=goal?goal.target-total:0;
    $('balance').textContent=!goal?'':difference>0?`${difference.toLocaleString()} remaining`:difference<0?`${(-difference).toLocaleString()} over target`:'Exact sum · check the endpoints';
    $('board').style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;$('board').replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';
      cell.className=`cx-tile ${tile.value>128?'cx-built':'cx-v'+tile.value}`;cell.dataset.x=x;cell.dataset.y=y;
      cell.append(document.createTextNode(tile.value));
      const endpoint=goal?.ends.findIndex(([gx,gy])=>gx===x&&gy===y)??-1;
      if(endpoint>=0){const tag=document.createElement('span');tag.className='cx-endpoint';tag.textContent=endpoint?'②':'①';cell.append(tag);cell.classList.add('cx-marked');}
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('cx-selected');const tag=document.createElement('span');tag.className='cx-order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||state.outcome!=='playing';cell.setAttribute('aria-pressed',String(order>=0&&!preview));
      cell.setAttribute('aria-label',`${removing?'Remove ':''}Column ${x+1}, row ${y+1}: ${tile.value}${endpoint>=0?', endpoint '+(endpoint+1):''}`);
      $('board').append(cell);
    }
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);$('path').setAttribute('preserveAspectRatio','none');$('path').replaceChildren();
    if(!preview&&selection.length>1){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [name,value] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:'#e59a59','stroke-width':'5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(name,value);
      $('path').append(line);
    }
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length&&!removing;
    $('preview').textContent=preview?'Back to board':'Preview result';$('undo').disabled=!history.length;
    $('remove').disabled=preview||state.outcome!=='playing'||!state.charges;
    $('remove').textContent=removing?'Cancel removal':'Remove a tile';$('remove').setAttribute('aria-pressed',String(removing));
    document.body.classList.toggle('cx-removing',removing);document.body.classList.toggle('cx-previewing',preview);
    $('powerup-status').textContent=removing?'Choose one tile. Removal costs one charge and one move.':
      predicted?.last.powerupEarned?`${preview?'Preview only · this merge would earn':'This merge earns'} one removal.`:
      state.charges===3?'Bank full. Further awards are discarded until you spend one.':
      state.charges?'Saved for a useful opening.':'Build a tile worth 2,048 or more to earn a removal.';
    $('selection').textContent=removing?'Choose a tile to clear, or cancel.':preview?'PREVIEW ONLY · Nothing has been spent.':
      predicted?`${selection.length} tiles → ${total.toLocaleString()}. ${rules.matches(state,selection)?'Completes this connection.':'Normal merge; the objective stays active.'}`:
      selection.length?'Start with two equal tiles, then continue equal or double.':'Choose a chain. Arrange the board around the marked places.';
    $('result').hidden=state.outcome==='playing';$('result-title').textContent=state.outcome==='won'?'Puzzle complete':'Attempt finished';
    $('result-detail').textContent=state.outcome==='won'?`All three connections in ${state.moves} moves. Retry to try another plan, or choose another puzzle.`:
      state.moves>=state.maxMoves?'No moves remain. Retry uses the same board and refills.':'No legal merge or earned removal remains. Undo or retry.';
    const key=goal?`${state.completed}/${goal.target}`:'';
    if(key!==combinationsKey){combinationsKey=key;combinationsOpen=false;$('recipes').replaceChildren();}
    $('combinations-toggle').hidden=!goal;$('combinations-toggle').textContent=combinationsOpen?'Hide combinations':'Show combinations';
    $('combinations-toggle').setAttribute('aria-expanded',String(combinationsOpen));$('combinations').hidden=!combinationsOpen;
  }
  function apply(action){
    const next=action.type==='move'?rules.move(state,action.chain):rules.remove(state,action.position);
    history.push(state);state=next;actions.push(action);resetSelection();render();
    if(state.outcome==='won')try{
      const completed=JSON.parse(localStorage.getItem('connectionPuzzleWins')||'{}');completed[level.id]=true;localStorage.setItem('connectionPuzzleWins',JSON.stringify(completed));
    }catch{}
    persist();
  }
  function select(x,y){
    if(preview||state.outcome!=='playing')return;
    if(removing){if(rules.canRemove(state,[x,y]))apply({type:'remove',position:[x,y]});return;}
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0)selection=selection.slice(0,prior+1);
    else if(rules.valid(state,[...selection,[x,y]],false))selection.push([x,y]);
    render();
  }
  $('board').addEventListener('pointerdown',event=>{const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;event.preventDefault();dragging=!removing;select(+cell.dataset.x,+cell.dataset.y);});
  window.addEventListener('pointermove',event=>{if(!dragging)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#cx-board button[data-x]');if(cell&&!cell.disabled)select(+cell.dataset.x,+cell.dataset.y);});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);
  $('board').addEventListener('click',event=>{if(event.detail!==0)return;const cell=event.target.closest('button[data-x]');if(cell&&!cell.disabled){select(+cell.dataset.x,+cell.dataset.y);$('board').querySelector(`[data-x="${cell.dataset.x}"][data-y="${cell.dataset.y}"]`)?.focus();}});
  $('merge').onclick=()=>{if(state.outcome==='playing'&&rules.valid(state,selection))apply({type:'move',chain:selection.map(position=>[...position])});};
  $('preview').onclick=()=>{if(rules.valid(state,selection)){preview=!preview;render();}};
  $('clear').onclick=()=>{resetSelection();render();};
  $('remove').onclick=()=>{if(preview||state.outcome!=='playing'||!state.charges)return;const armed=!removing;resetSelection();removing=armed;render();};
  $('undo').onclick=()=>{if(!history.length)return;state=history.pop();actions.push({type:'undo'});resetSelection();render();persist();};
  $('combinations-toggle').onclick=()=>{
    if(!state.objective)return;
    if(!combinationsOpen&&!$('recipes').children.length)for(const values of window.ConnectionMath.recipes(state.objective.target,state.gridWidth*state.gridHeight)){
      const item=document.createElement('li');item.textContent=`${values.length} tiles · ${values.map(value=>value.toLocaleString()).join(' + ')} = ${state.objective.target.toLocaleString()}`;$('recipes').append(item);
    }
    combinationsOpen=!combinationsOpen;render();
  };
  function begin(saved){
    state=rules.create(level);actions=[];history=[];
    if(saved)for(const action of saved.actions){
      if(action.type==='undo')state=history.pop();
      else{history.push(state);state=action.type==='move'?rules.move(state,action.chain):rules.remove(state,action.position);}
      actions.push(action);
    }
    attemptId=crypto.randomUUID();revision=0;resetSelection();$('feedback').value=saved?.feedback||'';
    const query=new URLSearchParams(window.location.search);query.set('attempt',attemptId);window.history.replaceState({},'','?'+query.toString());
    render();persist();
  }
  $('retry').onclick=()=>begin();$('feedback').onchange=persist;
  try{
    if(!level)throw new Error('Unknown puzzle. Choose one from the library.');
    const response=await fetch('/api/connection-identity');if(!response.ok)throw new Error('Could not connect to this puzzle runtime. Reload to try again.');
    identity=(await response.json()).identity;
    document.title=`2248 · ${level.name}`;$('title').textContent=level.name;$('subtitle').textContent=level.focus+' · three connections on one board';
    $('next').href=window.GameLibrary?window.GameLibrary.connectionsUrl(window.location.search):'?mode=connections';
    let saved=null;const source=params.get('attempt');
    if(source){
      const response=await fetch('/api/connection-attempts/'+encodeURIComponent(source));if(!response.ok)throw new Error('Saved attempt unavailable. Return to the library for a fresh attempt.');
      saved=await response.json();if(saved.identity!==identity||saved.levelId!==level.id)throw new Error('Saved attempt belongs to a different puzzle runtime.');
      rules.replay(level,saved.actions);
    }
    $('play').hidden=false;begin(saved);
  }catch(error){$('error').hidden=false;$('error').textContent=error.message;}
})();
