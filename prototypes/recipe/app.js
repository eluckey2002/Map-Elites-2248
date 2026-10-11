/* Recipe playtest page. Click tiles to build a chain (no drag), preview, merge. Runs and answers save to the
   Artifact db when it is available; play works without it. */
(function(){
  'use strict';
  const rules=window.RecipeRules,levels=window.RecipeLevels,$=id=>document.getElementById(id);
  const STUDY='recipe-prototype-v1',LS='recipeProto.v1';
  const COLORS=['#d9822b','#3d7fb8','#3f8f5a'],LETTERS='ABC',RINGS=['ing-a','ing-b','ing-c'];
  let local={current:0};
  try{Object.assign(local,JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){/* storage unavailable */}
  const keep=()=>{try{localStorage.setItem(LS,JSON.stringify(local));}catch(e){/* fine */}};
  if(!(local.current in levels))local.current=0;
  let level,state,history,selection,previewing,run,answers={};
  let dbPromise=null;
  // Only a database handle that was actually acquired is cached; a rejection or null is retried on the next save.
  const database=()=>(dbPromise||=(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null))
    .then(db=>{if(!db)dbPromise=null;return db;},e=>{dbPromise=null;throw e;}));

  const valueAt=(s,[x,y])=>s.grid[y][x].value;
  const fmt=n=>n.toLocaleString('en-US');
  function orderText(o){return `${fmt(o.make)} from ${o.from}s`;}
  function ingredientCount(s,o){let n=0;for(const row of s.grid)for(const t of row)if(t.value===o.from)n++;return n;}

  function begin(fresh){
    level=levels[local.current];state=rules.create(level);history=[];selection=[];previewing=false;
    if(fresh!==false)run={id:`${level.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,study:STUDY,board:level.id,
      number:local.current+1,startedAt:new Date().toISOString(),actions:[],rev:0,savedRev:0,previews:0,undos:0};
    render();
  }

  function describeSelection(){
    if(!selection.length)return {text:level.orders.length>1?'Choose a chain. Each order needs one chain made only of its ingredient.':'Choose a chain. The order needs one chain made only of its ingredient.',tone:''};
    const values=selection.map(p=>valueAt(state,p)),sum=values.reduce((a,b)=>a+b,0);
    if(!rules.valid(state,selection)){
      return {text:selection.length<rules.MIN_CHAIN?`${values.join(' + ')}. Use at least ${rules.MIN_CHAIN} tiles: start with two equal, then equal or double.`:'Not a legal chain.',tone:''};
    }
    const order=rules.completes(level,state,selection);
    if(order>=0)return {text:`${values.length} × ${level.orders[order].from} → ${fmt(sum)} on the last tile. Completes the order${level.orders.length>1?' '+LETTERS[order]:''}.`,tone:'good'};
    for(const [i,o] of level.orders.entries()){
      if(state.done[i])continue;
      const used=values.filter(v=>v===o.from).length;
      if(sum===o.make&&used<values.length)return {text:`${values.join(' + ')} = ${fmt(sum)}, but the chain mixes values. Doesn't count.`,tone:'warn'};
      if(used===values.length&&sum>o.make)return {text:`${values.length} × ${o.from} → ${fmt(sum)}. Too many: the order needs exactly ${o.make/o.from}.`,tone:'warn'};
      if(used>0){const left=ingredientCount(state,o)-used;
        return {text:`${values.join(' + ')} → ${fmt(sum)} on the last tile. Uses ${used} of your ${o.from}s (${left} left).`,tone:'warn'};}
    }
    return {text:`${values.join(' + ')} → ${fmt(sum)} on the last tile.`,tone:''};
  }

  function render(){
    const legal=state.outcome==='playing'&&rules.valid(state,selection);
    const predicted=legal?rules.preview(level,state,selection):null,shown=previewing&&predicted?predicted:state;
    // orders + ingredients + moves
    $('orders').replaceChildren(...level.orders.map((o,i)=>{const chip=document.createElement('span');chip.className='chip'+(shown.done[i]?' done':'');
      chip.style.setProperty('--c',COLORS[i]);chip.textContent=`${level.orders.length>1?LETTERS[i]+' · ':''}${fmt(o.make)} = ${o.make/o.from} × ${o.from}${shown.done[i]?' ✓':''}`;return chip;}));
    $('ingredients').textContent=level.orders.map(o=>`${o.from}s ${Math.min(ingredientCount(shown,o),o.make/o.from)}/${o.make/o.from}`).join('\n');
    $('moves').textContent=`${shown.maxMoves-shown.moves} / ${shown.maxMoves}`;
    // board
    const board=$('board');board.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;board.replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';cell.dataset.x=x;cell.dataset.y=y;
      const tier=Math.min(9,Math.max(1,Math.round(Math.log2(tile.value))-2));cell.className='tile t'+tier;
      cell.textContent=fmt(tile.value);
      level.orders.forEach((o,i)=>{if(tile.value===o.from&&!shown.done[i]){cell.classList.add(RINGS[i]);}});
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!previewing){cell.classList.add('sel');const tag=document.createElement('span');tag.className='ord';tag.textContent=order+1;cell.append(tag);}
      if(previewing&&predicted&&predicted.last.landing.x===x&&predicted.last.landing.y===y)cell.classList.add('landed');
      cell.disabled=previewing||state.outcome!=='playing';cell.setAttribute('aria-pressed',String(order>=0&&!previewing));
      cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${tile.value}`);
      board.append(cell);
    }
    const path=$('path');path.setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);path.setAttribute('preserveAspectRatio','none');path.replaceChildren();
    if(!previewing&&selection.length>1){
      const ord=legal?rules.completes(level,state,selection):-1;
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [k,v] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:ord>=0?COLORS[ord]:'#8a8f86','stroke-width':'6','stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'}))line.setAttribute(k,v);
      path.append(line);
    }
    // controls
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length;$('undo').disabled=!history.length;
    $('preview').textContent=previewing?'Back to board':'Preview result';
    document.body.classList.toggle('previewing',previewing);
    const line=$('status');
    if(previewing&&predicted){
      const filled=predicted.done.map((d,i)=>d&&!state.done[i]?i:-1).filter(i=>i>=0);
      line.textContent=`PREVIEW · nothing spent. After this move: ${level.orders.map(o=>`${o.from}s on board ${ingredientCount(predicted,o)}`).join(', ')}.${filled.length?' Completes the order.':''}`;line.dataset.tone='';
    }else{const d=describeSelection();line.textContent=d.text;line.dataset.tone=d.tone;}
    // board strip
    $('boards').replaceChildren(...levels.map((l,i)=>{const b=document.createElement('button');b.type='button';b.textContent=i+1;b.title=l.name;
      b.className=(i===local.current?'on ':'')+(answers[l.id]&&answers[l.id].different&&answers[l.id].wantMore?'answered':'');b.setAttribute('aria-label',`Board ${i+1}: ${l.name}`);b.onclick=()=>switchBoard(i);return b;}));
    $('title').textContent=`${local.current+1}. ${level.name}`;$('focus').textContent=level.focus;
    // result + questions
    const over=state.outcome!=='playing';
    $('result').hidden=!over;
    if(over){
      const filled=state.done.filter(Boolean).length;
      $('result-title').textContent=state.outcome==='won'?(level.orders.length>2?'All orders filled':level.orders.length>1?'Both orders filled':'Order filled'):'Attempt finished';
      $('result-detail').textContent=state.outcome==='won'?`Done in ${state.moves} of ${state.maxMoves} moves.`:
        `${state.outcome==='out-of-moves'?'Out of moves':'No legal chain left'}. ${filled} of ${level.orders.length} order${level.orders.length>1?'s':''} filled. Undo, or retry the same board.`;
    }
    renderQuestions();
  }

  function renderQuestions(){
    const a=answers[level.id]||{};
    document.querySelectorAll('#questions .chips').forEach(group=>{
      group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(a[group.dataset.q]===b.dataset.v)));
    });
    if(document.activeElement!==$('note'))$('note').value=a.note||'';
  }

  async function saveDoc(collection,id,doc,statusEl){
    if(statusEl)statusEl.textContent='Saving…';
    try{const db=await database();if(!db)throw new Error('no db');await db.collection(collection).doc(id).set(doc);if(statusEl)statusEl.textContent='Saved';return true;}
    catch(e){if(statusEl)statusEl.textContent='Not saved (open the page signed in).';return false;}
  }
  // Each save snapshots the run (deep copy, with its revision) into a pending queue keyed by run id, then flushes the queue.
  // A snapshot leaves the queue only after its write succeeds, so a failed save, from this run or an earlier board, is
  // retried on the next save. A run counts as saved only up to the revision that was actually written.
  const pending={};let flushing=false,again=false;
  function saveRun(reason){
    const r=run;
    if(!r.actions.length||r.savedRev===r.rev)return;
    const doc=JSON.parse(JSON.stringify(Object.assign({},r,{endedAt:new Date().toISOString(),reason,outcome:state.outcome,movesUsed:state.moves,
      budget:state.maxMoves,ordersFilled:state.done,finalGrid:state.grid.map(row=>row.map(t=>t.value))})));
    delete doc.savedRev;
    pending[r.id]={run:r,rev:r.rev,doc};flush();
  }
  async function flush(){
    if(flushing){again=true;return;}flushing=true;
    try{
      for(const id of Object.keys(pending)){
        const item=pending[id];
        if(await saveDoc('runs',id,item.doc,$('run-status'))){
          item.run.savedRev=Math.max(item.run.savedRev||0,item.rev);
          if(pending[id]===item)delete pending[id];
        }
      }
    }finally{flushing=false;}
    if(again){again=false;flush();}
  }
  function apply(chain){
    const values=chain.map(p=>valueAt(state,p)),order=rules.completes(level,state,chain);
    history.push(state);state=rules.move(level,state,chain);
    run.actions.push({type:'move',chain,values,order,mixed:new Set(values).size>1,at:Date.now()});run.rev++;
    selection=[];previewing=false;
    if(state.outcome!=='playing')saveRun('finished');
    render();
  }
  function select(x,y){
    if(previewing||state.outcome!=='playing')return;
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0)selection=selection.slice(0,prior);
    else if(rules.valid(state,[...selection,[x,y]],false))selection.push([x,y]);
    else if(rules.valid(state,[[x,y]],false))selection=[[x,y]];
    render();
  }
  function switchBoard(i){
    if(i===local.current)return;
    if(run.actions.length)saveRun(state.outcome==='playing'?'left-board':'finished');
    local.current=i;keep();begin();
  }
  $('board').addEventListener('click',e=>{const cell=e.target.closest('button[data-x]');if(cell&&!cell.disabled)select(+cell.dataset.x,+cell.dataset.y);});
  $('merge').onclick=()=>{if(state.outcome==='playing'&&rules.valid(state,selection))apply(selection.map(p=>[...p]));};
  $('preview').onclick=()=>{if(rules.valid(state,selection)){previewing=!previewing;if(previewing)run.previews++;render();}};
  $('clear').onclick=()=>{selection=[];previewing=false;render();};
  $('undo').onclick=()=>{if(!history.length)return;state=history.pop();run.undos++;run.actions.push({type:'undo',at:Date.now()});run.rev++;selection=[];previewing=false;render();};
  $('retry').onclick=()=>{if(run.actions.length)saveRun(state.outcome==='playing'?'retried':'finished');begin();};
  $('next').onclick=()=>switchBoard((local.current+1)%levels.length);
  document.querySelectorAll('#questions .chips').forEach(group=>group.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,number:local.current+1},answers[level.id]||{},{[group.dataset.q]:b.dataset.v,savedAt:new Date().toISOString()});
    renderQuestions();render();saveDoc('answers',level.id,a,$('q-status'));
  }));
  $('note').addEventListener('change',()=>{
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,number:local.current+1},answers[level.id]||{},{note:$('note').value.slice(0,500),savedAt:new Date().toISOString()});
    saveDoc('answers',level.id,a,$('q-status'));render();
  });
  window.addEventListener('pagehide',()=>{if(run&&run.actions.length)saveRun(state.outcome==='playing'?'closed':'finished');});
  // Stored answers load in the background; a board answered locally in the meantime keeps its newer copy.
  (async()=>{try{const db=await database();if(!db)return;const snap=await db.collection('answers').get();
    (snap.docs||snap).forEach(d=>{const v=d.data?d.data():d;if(v&&v.board&&(!answers[v.board]||(answers[v.board].savedAt||'')<(v.savedAt||'')))answers[v.board]=v;});render();}catch(e){/* offline is fine */}})();
  begin();
})();
