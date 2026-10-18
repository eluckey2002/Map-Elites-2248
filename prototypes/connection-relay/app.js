/* Phone playtest page for the Relay connection puzzles. Game rules are
   src/connection-rules.js unchanged; relay-play.js moves a marker with the tile it sits on. */
(function(){
  'use strict';
  const rules=window.ConnectionRules,relay=window.RelayPlay,levels=window.RelayLevels,$=id=>document.getElementById('cx-'+id);
  const STUDY='connection-relay-v2';
  let level,state,actions=[],history=[],selection=[],preview=false,removing=false,dragging=false;
  let attemptId,startedAt,saved=false,retryArmed=false,combinationsKey='',combinationsOpen=false,dbPromise=null;
  // A failed or empty answer is not kept, so the next save asks again.
  const database=()=>(dbPromise||=(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null)).catch(()=>null)
    .then(db=>{if(!db)dbPromise=null;return db;}));
  const store={get(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
  function resetSelection(){selection=[];preview=false;removing=false;dragging=false;retryArmed=false;}
  function newId(){try{return crypto.randomUUID();}catch{return 'a'+Date.now().toString(36)+Math.random().toString(36).slice(2);}}
  async function save(final){
    if(!actions.length)return;
    const id=attemptId;
    const doc={study:STUDY,levelId:level.id,levelName:level.name,attemptId:id,startedAt,updatedAt:new Date().toISOString(),
      outcome:state.outcome,completed:state.completed,moves:state.moves,budget:level.moves,actions,note:$('feedback').value||''};
    const shown=text=>{if(id===attemptId)$('save').textContent=text;};
    try{const db=await database();if(!db)throw new Error();await db.collection('runs').doc(id).set(doc);
      shown(final?'Saved. Thanks for playing this one.':'Progress saved.');}
    catch{shown('Not saved here (open the page while signed in to keep plays).');}
  }
  function picker(){
    const wins=store.get('relayWins')||{};
    $('levels').replaceChildren(...levels.map((item,i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=String(i+1);
      b.className=(item.id===level?.id?'on ':'')+(wins[item.id]?'won':'');b.setAttribute('aria-label',`Puzzle ${i+1}, ${item.name}${wins[item.id]?', completed':''}`);
      b.onclick=()=>open(item.id);return b;}));
  }
  function render(){
    const legal=!removing&&state.outcome==='playing'&&rules.valid(state,selection);
    const predicted=legal?relay.preview(state,selection):null,shown=preview&&predicted?predicted:state;
    const goal=state.objective,total=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0);
    $('progress').textContent=`${state.completed} / ${level.objectives.length}`;
    $('moves').textContent=String(state.maxMoves-state.moves);$('charges').textContent=`${state.charges} / ${rules.CAPACITY}`;
    $('goal-number').textContent=goal?`Connection ${state.completed+1} of ${level.objectives.length}`:'All connections complete';
    $('goal-title').textContent=goal?`Connect ① and ② · make ${goal.target.toLocaleString()}`:'Puzzle complete';
    $('goal-hint').textContent=goal?.hint||'Start and end on the marked places and make the exact sum.';
    const halves=[];if(goal){let value=goal.target;halves.push(value);while(value>1&&value%2===0&&halves.length<6){value/=2;halves.push(value);}}
    $('halves').textContent=halves.map(value=>value.toLocaleString()).join(' → ');
    $('sum').textContent=total.toLocaleString();
    const difference=goal?goal.target-total:0;
    $('balance').textContent=!goal||!selection.length?'':difference>0?`${difference.toLocaleString()} to go`:difference<0?`${(-difference).toLocaleString()} over`:'Exact sum · check the ends';
    const board=$('board');board.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;board.replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';
      cell.className=`cx-tile ${tile.value>128?'cx-built':'cx-v'+tile.value}`;cell.dataset.x=x;cell.dataset.y=y;
      cell.append(document.createTextNode(tile.value.toLocaleString()));if(tile.value>=1000)cell.classList.add('cx-long');
      const endpoint=goal?.ends.findIndex(([gx,gy])=>gx===x&&gy===y)??-1;
      if(endpoint>=0){const tag=document.createElement('span');tag.className='cx-endpoint';tag.textContent=endpoint?'②':'①';cell.append(tag);cell.classList.add('cx-marked');}
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('cx-selected');const tag=document.createElement('span');tag.className='cx-order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||state.outcome!=='playing';
      cell.setAttribute('aria-label',`${removing?'Remove ':''}Column ${x+1}, row ${y+1}: ${tile.value}${endpoint>=0?', marker '+(endpoint+1):''}`);
      board.append(cell);
    }
    const path=$('path');path.setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);path.setAttribute('preserveAspectRatio','none');path.replaceChildren();
    if(!preview&&selection.length>1){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      line.setAttribute('points',selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '));line.setAttribute('class','cx-line');path.append(line);}
    $('merge').disabled=!legal||preview;$('preview').disabled=!legal;$('clear').disabled=!selection.length&&!removing;
    $('preview').textContent=preview?'Back':'Preview';$('undo').disabled=!history.length;
    $('retry').textContent=retryArmed?'Tap again to start over':'Start over';
    $('remove').disabled=preview||state.outcome!=='playing'||!state.charges;
    $('remove').textContent=removing?'Cancel removal':'Remove a tile';$('remove').setAttribute('aria-pressed',String(removing));
    document.body.classList.toggle('cx-removing',removing);document.body.classList.toggle('cx-previewing',preview);
    $('powerup-status').textContent=removing?'Tap one tile. It costs one removal and one move.':
      predicted?.last.powerupEarned?`${preview?'Preview: this merge would earn':'This merge earns'} one removal.`:
      state.charges?'You have a removal saved.':'Make a tile of 2,048 or more to earn a removal.';
    $('selection').textContent=removing?'Tap a tile to clear it, or cancel.':preview?'Preview only. Nothing is spent.':
      predicted?`${selection.length} tiles → ${total.toLocaleString()}. ${rules.matches(state,selection)?'This completes the connection.':'Normal merge; the connection stays open.'}`:
      selection.length?'Start with two equal tiles, then go equal or double.':'Tap tiles to make a chain.';
    $('result').hidden=state.outcome==='playing';$('result-title').textContent=state.outcome==='won'?'Puzzle complete':'Out of moves';
    $('result-detail').textContent=state.outcome==='won'?`All three connections in ${state.moves} of ${state.maxMoves} moves.`:
      state.moves>=state.maxMoves?'Start over to try again. The board and new tiles come out the same.':'No merge or removal is left. Undo or start over.';
    const key=goal?`${level.id}/${state.completed}`:'';
    if(key!==combinationsKey){combinationsKey=key;combinationsOpen=false;$('recipes').replaceChildren();}
    $('combinations-toggle').hidden=!goal;$('combinations-toggle').textContent=combinationsOpen?'Hide combinations':'Show combinations';
    $('combinations-toggle').setAttribute('aria-expanded',String(combinationsOpen));$('combinations').hidden=!combinationsOpen;
  }
  function apply(action){
    const next=action.type==='move'?relay.move(state,action.chain):relay.remove(state,action.position);
    history.push(state);state=next;actions.push(action);resetSelection();render();
    if(state.outcome==='won'){const wins=store.get('relayWins')||{};wins[level.id]=true;store.set('relayWins',wins);picker();}
    save(state.outcome!=='playing');
  }
  function select(x,y){
    if(preview||state.outcome!=='playing')return;
    if(removing){if(rules.canRemove(state,[x,y]))apply({type:'remove',position:[x,y]});return;}
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0)selection=selection.slice(0,prior+1);
    else if(rules.valid(state,[...selection,[x,y]],false))selection.push([x,y]);
    retryArmed=false;render();
  }
  function open(id){
    level=levels.find(item=>item.id===id)||levels[0];store.set('relayLevel',level.id);
    state=relay.create(level);actions=[];history=[];attemptId=newId();startedAt=new Date().toISOString();
    resetSelection();$('feedback').value='';$('save').textContent='';
    $('title').textContent=level.name;$('subtitle').textContent=level.focus;picker();render();
  }
  $('board').addEventListener('click',event=>{const cell=event.target.closest('button[data-x]');if(cell&&!cell.disabled)select(+cell.dataset.x,+cell.dataset.y);});
  $('merge').onclick=()=>{if(state.outcome==='playing'&&rules.valid(state,selection))apply({type:'move',chain:selection.map(p=>[...p])});};
  $('preview').onclick=()=>{if(rules.valid(state,selection)){preview=!preview;render();}};
  $('clear').onclick=()=>{resetSelection();render();};
  $('remove').onclick=()=>{if(preview||state.outcome!=='playing'||!state.charges)return;const armed=!removing;resetSelection();removing=armed;render();};
  $('undo').onclick=()=>{if(!history.length)return;state=history.pop();actions.push({type:'undo'});resetSelection();render();save(false);};
  $('retry').onclick=()=>{if(actions.length&&!retryArmed&&state.outcome==='playing'){retryArmed=true;render();return;}open(level.id);};
  $('again').onclick=()=>open(level.id);
  $('next').onclick=()=>{const i=levels.indexOf(level);open(levels[(i+1)%levels.length].id);window.scrollTo({top:0});};
  $('feedback').onchange=()=>save(state.outcome!=='playing');
  $('combinations-toggle').onclick=()=>{
    if(!state.objective)return;
    if(!combinationsOpen&&!$('recipes').children.length)for(const values of window.ConnectionMath.recipes(state.objective.target,state.gridWidth*state.gridHeight)){
      const item=document.createElement('li');item.textContent=`${values.length} tiles · ${values.map(v=>v.toLocaleString()).join(' + ')}`;$('recipes').append(item);}
    combinationsOpen=!combinationsOpen;render();
  };
  open(store.get('relayLevel')||levels[0].id);
})();
