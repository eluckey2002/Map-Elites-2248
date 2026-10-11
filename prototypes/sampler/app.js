/* Kinds sampler playtest page. Click tiles to build a chain (no drag), preview, merge. Runs and answers save to the
   Artifact db when it is available; play works without it. Layout and saving follow the Recipe page. */
(function(){
  'use strict';
  const rules=window.SamplerRules,levels=window.SamplerLevels,$=id=>document.getElementById(id);
  const STUDY='kinds-sampler-v1',LS='kindsSampler.v1';
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
  const goal=()=>level.goal,orders=()=>goal().type==='orders'?goal().orders:[];
  const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
  function ingredientCount(s,o){let n=0;for(const row of s.grid)for(const t of row)if(t&&!t.rust&&t.value===o.from)n++;return n;}
  function rustCount(s){let n=0;for(const row of s.grid)for(const t of row)if(t&&t.rust)n++;return n;}

  function begin(fresh){
    level=levels[local.current];state=rules.create(level);history=[];selection=[];previewing=false;
    if(fresh!==false)run={id:`${level.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,study:STUDY,board:level.id,
      kind:level.kind,number:local.current+1,startedAt:new Date().toISOString(),actions:[],rev:0,savedRev:0,previews:0,undos:0};
    render();
  }

  function goalChips(shown){
    const g=goal(),chip=(text,color,done)=>{const c=document.createElement('span');c.className='chip'+(done?' done':'');c.style.setProperty('--c',color);c.textContent=text+(done?' ✓':'');return c;};
    if(g.type==='orders')return g.orders.map((o,i)=>chip(`${g.orders.length>1?LETTERS[i]+' · ':''}${fmt(o.make)} = ${o.make/o.from} × ${o.from}${o.at?' on ◎':''}`,COLORS[i],shown.done[i]));
    if(g.type==='exact')return [chip(`Make exactly ${fmt(g.make)}`,COLORS[0],shown.done[0])];
    if(g.type==='relay')return g.stages.map((v,i)=>chip(i?`then ${fmt(v)}, using it`:`Make ${fmt(v)}`,COLORS[i],shown.done[i]));
    if(g.type==='leftover')return [chip(`Leave ${g.max} tile${g.max>1?'s':''}`,COLORS[0],rules.goalMet(level,shown))];
    return [chip('One chain through both ★',COLORS[0],shown.done[0])];
  }
  function progressText(shown){
    const g=goal();
    if(g.type==='orders')return g.orders.map(o=>`${o.from}s ${Math.min(ingredientCount(shown,o),o.make/o.from)}/${o.make/o.from}`).join('\n');
    if(g.type==='leftover')return `${rules.tileCount(shown)} tiles`;
    if(level.rust)return `${level.rust.ice?'ice':'rust'} ${rustCount(shown)}`;
    if(level.gate)return shown.gateOpen?'gate open':'gate shut';
    return '—';
  }

  function describeSelection(){
    const g=goal();
    if(!selection.length)return {text:level.hint,tone:''};
    const values=selection.map(p=>valueAt(state,p)),sum=values.reduce((a,b)=>a+b,0);
    if(!rules.valid(state,selection)){
      return {text:selection.length<rules.MIN_CHAIN?`${values.join(' + ')}. Use at least ${rules.MIN_CHAIN} tiles: start with two equal, then equal or double.`:'Not a legal chain.',tone:''};
    }
    const base=`${values.join(' + ')} → ${fmt(sum)} on the last tile.`;
    if(g.type==='orders'){
      const order=rules.completes(level,state,selection);
      if(order>=0)return {text:`${values.length} × ${g.orders[order].from} → ${fmt(sum)} on the spot. Completes the order${g.orders.length>1?' '+LETTERS[order]:''}.`,tone:'good'};
      const recipe=rules.recipeOnly(level,state,selection);
      if(recipe>=0)return {text:`Right recipe, wrong spot: the chain has to end on ◎.`,tone:'warn'};
      for(const [i,o] of g.orders.entries()){
        if(state.done[i])continue;
        const used=values.filter(v=>v===o.from).length;
        if(sum===o.make&&used<values.length)return {text:`${base} The chain mixes values, so it doesn't count.`,tone:'warn'};
        if(used>0)return {text:`${base} Uses ${used} of your ${o.from}s (${ingredientCount(state,o)-used} left).`,tone:'warn'};
      }
    }
    if(g.type==='exact'){
      if(sum===g.make)return {text:`${base} That's exactly ${fmt(g.make)}: wins.`,tone:'good'};
      if(sum>g.make)return {text:`${base} Over ${fmt(g.make)}.`,tone:'warn'};
    }
    if(g.type==='relay'){
      const i=state.done.indexOf(false),stage=rules.relayStage(level,state,selection);
      if(stage>=0)return {text:`${base} Exactly ${fmt(g.stages[stage])}${stage?', using the tile you made':''}.${stage===g.stages.length-1?' Wins.':''}`,tone:'good'};
      if(i>0&&sum===g.stages[i])return {text:`${base} Right sum, but it has to include the ${fmt(g.stages[i-1])} you made (●).`,tone:'warn'};
      if(sum>g.stages[i])return {text:`${base} Over ${fmt(g.stages[i])}.`,tone:'warn'};
    }
    if(level.gate&&!state.gateOpen&&sum===level.gate.sum&&Math.max(Math.abs(selection.at(-1)[0]-level.gate.at[0]),Math.abs(selection.at(-1)[1]-level.gate.at[1]))===1)
      return {text:`${base} Ends beside the gate with exactly ${level.gate.sum}: opens it.`,tone:'good'};
    if(level.rust&&level.rust.scrape&&sum===level.rust.scrape)return {text:`${base} Exactly ${level.rust.scrape}: scrapes off any ${level.rust.ice?'ice':'rust'} it ends beside.`,tone:''};
    if(g.type==='connect'){
      if(rules.connects(level,selection))return {text:`${base} Goes through both ★: wins.`,tone:'good'};
      const hit=g.marks.filter(m=>selection.some(p=>same(p,m))).length;
      if(hit)return {text:`${base} Touches ${hit} of 2 ★.`,tone:''};
    }
    if(g.type==='leftover')return {text:`${base} Leaves ${rules.tileCount(state)-selection.length+1} tiles.`,tone:''};
    return {text:base,tone:''};
  }

  function render(){
    const legal=state.outcome==='playing'&&rules.valid(state,selection);
    const predicted=legal?rules.preview(level,state,selection):null,shown=previewing&&predicted?predicted:state;
    $('orders').replaceChildren(...goalChips(shown));
    $('progress-k').textContent=goal().type==='orders'?'INGREDIENTS':goal().type==='leftover'?'ON BOARD':level.rust?'RUST':'';
    $('ingredients').textContent=progressText(shown);
    $('moves').textContent=`${shown.maxMoves-shown.moves} / ${shown.maxMoves}`;
    // forecast row: the next tile for each column
    const fc=$('forecast');fc.hidden=!level.forecast;
    if(level.forecast){fc.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;
      fc.replaceChildren(...Array.from({length:shown.gridWidth},(_,x)=>{const d=document.createElement('div');d.className='next';
        const [a,b]=rules.upcoming(level,shown,x,2);d.innerHTML=`<b>${a}</b><small>then ${b}</small>`;return d;}));}
    // board
    const board=$('board');board.style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;board.replaceChildren();
    const spots=orders().map((o,i)=>o.at?{at:o.at,i,done:shown.done[i]}:null).filter(Boolean),marks=goal().type==='connect'?goal().marks:[];
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';cell.dataset.x=x;cell.dataset.y=y;
      if(level.gate&&!shown.gateOpen&&same(level.gate.at,[x,y])){cell.className='tile stone gate';cell.disabled=true;cell.textContent=level.gate.sum;cell.setAttribute('aria-label',`Gate: opens with a chain of exactly ${level.gate.sum} ending beside it`);board.append(cell);continue;}
      if(rules.isStone(shown,x,y)){cell.className='tile stone';cell.disabled=true;cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: wall`);board.append(cell);continue;}
      if(!tile){cell.className='tile empty';cell.disabled=true;cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: empty`);board.append(cell);continue;}
      const tier=Math.min(9,Math.max(1,Math.round(Math.log2(tile.value))-1));cell.className='tile t'+tier;
      if(Math.log2(tile.value)%1)cell.classList.add('odd');
      cell.textContent=fmt(tile.value);
      orders().forEach((o,i)=>{if(tile.value===o.from&&!shown.done[i])cell.classList.add(RINGS[i]);});
      const spot=spots.find(s=>same(s.at,[x,y]));if(spot&&!spot.done){cell.classList.add('spot');}
      if(marks.some(m=>same(m,[x,y])))cell.classList.add('mark');
      if(tile.rust)cell.classList.add(level.rust.ice?'ice':'rust');
      if(tile.made)cell.classList.add('made');
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!previewing){cell.classList.add('sel');const tag=document.createElement('span');tag.className='ord';tag.textContent=order+1;cell.append(tag);}
      if(previewing&&predicted&&predicted.last.landing.x===x&&predicted.last.landing.y===y)cell.classList.add('landed');
      cell.disabled=previewing||state.outcome!=='playing'||tile.rust;cell.setAttribute('aria-pressed',String(order>=0&&!previewing));
      cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${tile.value}${tile.rust?(level.rust.ice?', frozen':', rusted'):''}${spot?', spot':''}${tile.made?', made':''}`);
      board.append(cell);
    }
    const path=$('path');path.setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);path.setAttribute('preserveAspectRatio','none');path.replaceChildren();
    if(!previewing&&selection.length>1){
      const good=legal&&(rules.completes(level,state,selection)>=0||rules.connects(level,selection)||rules.relayStage(level,state,selection)>=0||goal().type==='exact'&&selection.reduce((s,p)=>s+valueAt(state,p),0)===goal().make);
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [k,v] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:good?COLORS[0]:'#8a8f86','stroke-width':'6','stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'}))line.setAttribute(k,v);
      path.append(line);
    }
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length;$('undo').disabled=!history.length;
    $('preview').textContent=previewing?'Back to board':'Preview result';
    document.body.classList.toggle('previewing',previewing);
    const line=$('status');
    if(previewing&&predicted){
      const bits=[];
      if(predicted.outcome==='won')bits.push('This wins.');
      if(predicted.last.opened)bits.push('Opens the gate.');
      if(predicted.last.cleared.length)bits.push(level.rust.ice?`Thaws ${predicted.last.cleared.length} ice.`:`Scrapes off ${predicted.last.cleared.length} rust.`);
      if(predicted.last.rusted)bits.push('Then rust spreads to one tile.');
      line.textContent=`PREVIEW · nothing spent. ${bits.join(' ')}`;line.dataset.tone=predicted.outcome==='won'?'good':'';
    }else{const d=describeSelection();line.textContent=d.text;line.dataset.tone=d.tone;}
    $('boards').replaceChildren(...levels.map((l,i)=>{const b=document.createElement('button');b.type='button';b.textContent=i+1;b.title=l.name;
      b.className=(i===local.current?'on ':'')+(answers[l.id]&&answers[l.id].different&&answers[l.id].wantMore?'answered':'');b.setAttribute('aria-label',`Board ${i+1}: ${l.name}`);b.onclick=()=>switchBoard(i);return b;}));
    $('title').textContent=`${local.current+1}. ${level.name}`;$('focus').textContent=level.focus;
    $('rule-title').textContent=level.ruleTitle;$('rule-body').textContent=level.rule;
    const over=state.outcome!=='playing';
    $('result').hidden=!over;
    if(over){
      $('result-title').textContent=state.outcome==='won'?'Done':'Attempt finished';
      $('result-detail').textContent=state.outcome==='won'?`Done in ${state.moves} of ${state.maxMoves} moves.`:
        `${state.outcome==='out-of-moves'?'Out of moves':'No legal chain left'}. Undo, or retry the same board.`;
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
  // A snapshot leaves the queue only after its write succeeds, so a failed save is retried on the next save.
  const pending={};let flushing=false,again=false;
  function saveRun(reason){
    const r=run;
    if(!r.actions.length||r.savedRev===r.rev)return;
    const doc=JSON.parse(JSON.stringify(Object.assign({},r,{endedAt:new Date().toISOString(),reason,outcome:state.outcome,movesUsed:state.moves,
      budget:state.maxMoves,done:state.done,finalGrid:state.grid.map(row=>row.map(t=>t?t.value:0))})));
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
    const values=chain.map(p=>valueAt(state,p));
    history.push(state);state=rules.move(level,state,chain);
    run.actions.push({type:'move',chain,values,at:Date.now()});run.rev++;
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
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,kind:level.kind,number:local.current+1},answers[level.id]||{},{[group.dataset.q]:b.dataset.v,savedAt:new Date().toISOString()});
    renderQuestions();render();saveDoc('answers',level.id,a,$('q-status'));
  }));
  $('note').addEventListener('change',()=>{
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,kind:level.kind,number:local.current+1},answers[level.id]||{},{note:$('note').value.slice(0,500),savedAt:new Date().toISOString()});
    saveDoc('answers',level.id,a,$('q-status'));render();
  });
  window.addEventListener('pagehide',()=>{if(run&&run.actions.length)saveRun(state.outcome==='playing'?'closed':'finished');});
  // Stored answers load in the background; a board answered locally in the meantime keeps its newer copy.
  (async()=>{try{const db=await database();if(!db)return;const snap=await db.collection('answers').get();
    (snap.docs||snap).forEach(d=>{const v=d.data?d.data():d;if(v&&v.board&&(!answers[v.board]||(answers[v.board].savedAt||'')<(v.savedAt||'')))answers[v.board]=v;});render();}catch(e){/* offline is fine */}})();
  begin();
})();
