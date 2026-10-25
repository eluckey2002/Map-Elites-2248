/* Kinds sampler playtest page. Click tiles to build a chain (no drag), preview, merge. Runs and answers save to the
   Artifact db when it is available; play works without it. Layout and saving follow the Recipe page. */
(function(){
  'use strict';
  const rules=window.SamplerRules,levels=window.SamplerLevels,$=id=>document.getElementById(id);
  // A page built from another set (prototypes/grader-set/build.js) names its own study before this script runs.
  const STUDY=window.SamplerStudy||'kinds-sampler-v5',LS=window.SamplerStorageKey||'kindsSampler.v5';
  const COLORS=['#c03a7a','#3d7fb8','#7a4fc0','#2f7d6b'],LETTERS='ABCD',RINGS=['ing-a','ing-b','ing-c','ing-d'];
  let local={current:0,played:{}};
  try{Object.assign(local,JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){/* storage unavailable */}
  const keep=()=>{try{localStorage.setItem(LS,JSON.stringify(local));}catch(e){/* fine */}};
  if(!(local.current in levels))local.current=0;
  if(!local.played||typeof local.played!=='object')local.played={};
  let level,state,history,selection,previewing,run,answers={},giveUpArmed=null;
  let dbPromise=null;
  // Only a database handle that was actually acquired is cached; a rejection or null is retried on the next save.
  const database=()=>(dbPromise||=(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null))
    .then(db=>{if(!db)dbPromise=null;return db;},e=>{dbPromise=null;throw e;}));

  const valueAt=(s,[x,y])=>s.grid[y][x].value;
  const fmt=n=>n.toLocaleString('en-US');
  const goal=()=>level.goal,orders=()=>goal().type==='orders'?goal().orders:[];
  const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
  // The reason a run is saved with once it is over: a give-up (grader set) stays a give-up.
  const overReason=()=>state.outcome==='gave-up'?'gave-up':'finished';
  function ingredientCount(s,o){let n=0;for(const row of s.grid)for(const t of row)if(t&&t.value===o.from)n++;return n;}
  // `oneAtATime` boards (Make It Here, v3) show only the first unfinished order in full; later orders stay greyed and
  // small, and their ingredient rings are hidden, until the orders before them are filled.
  const active=(s,i)=>!level.oneAtATime||s.done.indexOf(false)===i;
  // Chip wording: in-turn parts say "with a part"; any-order boards (Advanced) say which of the tiles must be ●.
  const partsLabel=i=>{const n=goal().parts?rules.partsNeeded(level,i):0;if(!n)return '';
    if(goal().anyOrder)return n===1?', one of them ●':n===2?', two of them ●':`, ${n} of them ●`;
    return n===1?', with a part':n===2?', with two parts':`, with ${n} parts`;};
  // Colour family: the 2 line (2, 4, 8 ...) uses the main palette; the 3 line (3, 6, 12, 24 ...) is green, so the page
  // shows how scarce those tiles are (CONTEXT.md: a family is one doubling progression shown by one colour).
  const family=v=>{let n=v;while(n%2===0)n/=2;return n===1?'two':n===3?'three':'other';};
  const tierOf=v=>{const green=family(v)==='three';return Math.min(9,Math.max(1,Math.round(Math.log2(green?v/3:v))-(green?0:1)));};
  function tileClasses(value){const f=family(value);return ['tile',(f==='three'?'g':'t')+tierOf(value)].concat(f==='other'?['odd']:[]);}
  function miniTile(value){const t=document.createElement('span');t.className='mini '+tileClasses(value).slice(1).join(' ');t.textContent=fmt(value);return t;}

  function begin(fresh){
    level=levels[local.current];state=rules.create(level);history=[];selection=[];previewing=false;
    if(fresh!==false)run={id:`${level.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,study:STUDY,board:level.id,
      kind:level.kind,number:local.current+1,startedAt:new Date().toISOString(),actions:[],rev:0,savedRev:0,previews:0,undos:0};
    render();
  }

  function goalChips(shown){
    const g=goal(),chip=(parts,color,done,later)=>{const c=document.createElement('span');c.className='chip'+(done?' done':'')+(later?' later':'');c.style.setProperty('--c',color);
      c.append(...[].concat(parts).map(p=>typeof p==='number'?miniTile(p):document.createTextNode(p)));if(done)c.append(' ✓');return c;};
    // An order chip shows the ingredient as a small tile and how many: [32] × 4. The total is never written as a sum.
    if(g.type==='orders')return g.orders.map((o,i)=>chip([g.orders.length>1?LETTERS[i]+' · ':'',o.from,` × ${o.make/o.from}${o.at?' on ◎':''}${partsLabel(i)}`],COLORS[i],shown.done[i],!shown.done[i]&&!active(shown,i)));
    if(g.type==='exact')return [chip(['Make one ',g.make],COLORS[0],shown.done[0])];
    if(g.type==='relay')return g.stages.map((v,i)=>chip(i?['then ',v,', using it']:['Make ',v],COLORS[i],shown.done[i]));
    if(g.type==='leftover')return [chip(`Leave ${g.max} tile${g.max>1?'s':''}`,COLORS[0],rules.goalMet(level,shown))];
    const link=chip('One chain through both ★',COLORS[0],shown.done[0]);
    return level.gate?[chip(level.gate.tile?['Gate: get a ',level.gate.tile,' next to it']:[`Gate: a chain adding up to ${fmt(level.gate.sum)}+, ending beside it`],COLORS[1],shown.gateOpen),link]:[link];
  }
  function progressText(shown){
    const g=goal();
    // One line per ingredient (two orders can share one).
    if(g.type==='orders')return g.orders.filter((o,i)=>active(shown,i)&&g.orders.findIndex(q=>q.from===o.from)===i).map(o=>`${o.from}s ${Math.min(ingredientCount(shown,o),o.make/o.from)}/${o.make/o.from}`)
      .join(matchMedia('(max-width:760px)').matches?' · ':'\n');
    if(g.type==='leftover')return `${rules.tileCount(shown)} tiles`;
    if(level.gate)return '';
    return '—';
  }

  function describeSelection(){
    const g=goal();
    if(!selection.length)return {text:level.hint||'',tone:''};
    const values=selection.map(p=>valueAt(state,p)),sum=values.reduce((a,b)=>a+b,0);
    if(!rules.valid(state,selection)){
      return {text:selection.length<rules.MIN_CHAIN?`${values.join(' + ')}. Use at least ${rules.MIN_CHAIN} tiles: start with two equal, then equal or double.`:'Not a legal chain.',tone:''};
    }
    const base=`${values.join(' + ')} → ${fmt(sum)} on the last tile.`;
    if(g.type==='orders'){
      const order=rules.completes(level,state,selection);
      if(order>=0)return {text:`${values.length} × ${g.orders[order].from} → ${fmt(sum)}${g.orders[order].at?' on the spot':''}. Completes the order${g.orders.length>1?' '+LETTERS[order]:''}.`,tone:'good'};
      const recipe=rules.recipeOnly(level,state,selection);
      if(recipe>=0){
        const o=g.orders[recipe],[ex,ey]=selection.at(-1);
        if(o.at&&!(o.at[0]===ex&&o.at[1]===ey))return {text:`Right recipe, wrong spot: the chain has to end on ◎.`,tone:'warn'};
        if(g.parts&&!g.anyOrder&&state.done.indexOf(false)!==recipe)return {text:`Right recipe, but order ${LETTERS[state.done.indexOf(false)]} comes first.`,tone:'warn'};
        // Two orders can share a recipe: name the parts rule that stops every order this chain's recipe could fill.
        const fits=g.orders.map((q,i)=>!state.done[i]&&q.from===o.from&&q.make===o.make?i:-1).filter(i=>i>=0);
        const short=fits.filter(i=>rules.partsIn(state,selection)<rules.partsNeeded(level,i));
        if(g.parts&&short.length===fits.length){const n=rules.partsNeeded(level,short[0]);return {text:`Right recipe, but ${g.anyOrder?'order '+LETTERS[short[0]]+'’s':'the'} chain has to include ${n===1?'a part':n===2?'two parts':n+' parts'} (●).`,tone:'warn'};}
        if(g.parts&&g.cap!==undefined&&rules.partsAfter(state,selection)>g.cap){
          const big=g.orders.findIndex((q,i)=>!state.done[i]&&rules.partsNeeded(level,i)>0);
          if(g.anyOrder&&big>=0)return {text:`Two ● are already on the board. Use them up first (${LETTERS[big]}’s chain uses two) before filling another order.`,tone:'warn'};
          return {text:`That would make a third part, so it does not fill the order. The tiles would still merge and use a move. At most ${g.cap} parts at once.`,tone:'warn'};
        }
        return {text:'Right recipe, but it does not fill an order here.',tone:'warn'};
      }
      for(const [i,o] of g.orders.entries()){
        if(state.done[i]||!active(state,i))continue;
        const used=values.filter(v=>v===o.from).length;
        if(sum===o.make&&used<values.length)return {text:`${base} The chain mixes values: every tile in the chain must show ${o.from}.`,tone:'warn'};
        if(used>0)return {text:`${base} Uses ${used} of your ${o.from}s (${ingredientCount(state,o)-used} left).`,tone:'warn'};
      }
    }
    if(g.type==='exact'){
      if(sum===g.make)return {text:`${base} That makes ${fmt(g.make)}: wins.`,tone:'good'};
      if(sum>g.make)return {text:`${base} Over ${fmt(g.make)}.`,tone:'warn'};
    }
    if(g.type==='relay'){
      const i=state.done.indexOf(false),stage=rules.relayStage(level,state,selection);
      if(stage>=0)return {text:`${base} Exactly ${fmt(g.stages[stage])}${stage?', using the tile you made':''}.${stage===g.stages.length-1?' Wins.':''}`,tone:'good'};
      if(i>0&&sum===g.stages[i])return {text:`${base} Right sum, but it has to include the ${fmt(g.stages[i-1])} you made (●).`,tone:'warn'};
      if(sum>g.stages[i])return {text:`${base} Over ${fmt(g.stages[i])}.`,tone:'warn'};
    }
    if(level.gate&&!state.gateOpen&&level.gate.tile){
      const after=rules.preview(level,state,selection);
      if(after&&after.gateOpen)return {text:`${base} Leaves a ${fmt(level.gate.tile)} or bigger next to the gate: opens it.`,tone:'good'};
    }
    if(level.gate&&!state.gateOpen&&level.gate.sum!==undefined){
      const beside=Math.max(Math.abs(selection.at(-1)[0]-level.gate.at[0]),Math.abs(selection.at(-1)[1]-level.gate.at[1]))===1,big=rules.opensGate(level,sum);
      if(big&&beside)return {text:`${base} Adds up to ${fmt(sum)} (${fmt(level.gate.sum)} or more) and ends beside the gate: opens it.`,tone:'good'};
      if(big)return {text:`${base} Adds up to ${fmt(sum)}, which is ${fmt(level.gate.sum)} or more, but the chain has to end on a tile beside the gate to open it.`,tone:'warn'};
      if(beside)return {text:`${base} Ends beside the gate, but it adds up to ${fmt(sum)}: it has to add up to ${fmt(level.gate.sum)} or more.`,tone:'warn'};
    }
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
    $('progress-k').textContent=goal().type==='orders'?'INGREDIENTS':goal().type==='leftover'?'ON BOARD':'';
    $('ingredients').textContent=progressText(shown);
    // Live ● counter (boards with parts); warning-coloured when the board is full.
    const dots=$('dots'),dotsOn=!!goal().parts&&goal().cap!==undefined;dots.hidden=!dotsOn;
    if(dotsOn){const n=rules.partCount(shown);dots.textContent=`● ${n} of ${goal().cap}`;dots.classList.toggle('full',n>=goal().cap);
      dots.setAttribute('aria-label',`${n} of ${goal().cap} dots on the board`);}
    const how=$('howto');how.hidden=!level.howto;how.textContent=level.howto||'';
    $('rule-extra').hidden=goal().type!=='orders';
    $('moves').textContent=`${shown.maxMoves-shown.moves} / ${shown.maxMoves}`;
    // Forecast strip (v3: labelled, larger, high contrast): the next three tiles that drop into each column (a chain of four stacked in one column uses three), nearest at
    // the bottom, right above its column. A stone column shows nothing.
    const fc=$('forecast');fc.hidden=!level.forecast;
    if(level.forecast){const row=$('forecast-row');row.style.gridTemplateColumns=`repeat(${shown.gridWidth},minmax(0,1fr))`;
      row.replaceChildren(...Array.from({length:shown.gridWidth},(_,x)=>{const d=document.createElement('div');d.className='next';
        if(Array.from({length:shown.gridHeight},(_,y)=>rules.isStone(shown,x,y)).every(Boolean)&&!(level.gate&&shown.gateOpen&&level.gate.at[0]===x)){d.classList.add('wall');return d;}
        // v5 (owner pick): See It Coming shows one tile per column (`forecastShow`), other boards show no strip.
        const n=level.forecastShow||3,next=rules.upcoming(level,shown,x,n);
        for(const v of next.slice().reverse()){const t=miniTile(v);t.classList.add('ftile');d.append(t);}
        d.setAttribute('aria-label',`Column ${x+1}: next ${next.join(', then ')}`);return d;}));}
    // board
    const boss=$('boss');boss.hidden=!(level.boss&&state.moves===0);
    if(level.boss){$('boss-title').textContent=level.boss.title;$('boss-text').textContent=level.boss.text;}
    $('shell').style.setProperty('--aspect',String(shown.gridHeight/shown.gridWidth));
    const board=$('board');board.style.gridTemplateColumns=`repeat(${shown.gridWidth},minmax(0,1fr))`;board.replaceChildren();
    const spots=orders().map((o,i)=>o.at?{at:o.at,i,done:shown.done[i]}:null).filter(Boolean),marks=goal().type==='connect'?goal().marks:[];
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';cell.dataset.x=x;cell.dataset.y=y;
      if(level.gate&&!shown.gateOpen&&same(level.gate.at,[x,y])){cell.className='tile stone gate';cell.disabled=true;cell.textContent=level.gate.tile?fmt(level.gate.tile):fmt(level.gate.sum)+'+';cell.setAttribute('aria-label',level.gate.tile?`Gate wall: opens when a ${level.gate.tile} tile or bigger sits next to it`:`Gate wall: opens when a chain adding up to ${level.gate.sum} or more ends on a tile beside it`);board.append(cell);continue;}
      if(rules.isStone(shown,x,y)){cell.className='tile stone';cell.disabled=true;cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: wall`);board.append(cell);continue;}
      if(!tile){cell.className='tile empty';cell.disabled=true;cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: empty`);board.append(cell);continue;}
      cell.className=tileClasses(tile.value).join(' ');
      cell.textContent=fmt(tile.value);
      orders().forEach((o,i)=>{if(tile.value===o.from&&!shown.done[i]&&active(shown,i))cell.classList.add(RINGS[i]);});
      const spot=spots.find(s=>same(s.at,[x,y]));if(spot&&!spot.done){cell.classList.add('spot');cell.classList.add('spot-'+'ab'[spot.i]);if(!active(shown,spot.i))cell.classList.add('spot-later');}
      if(marks.some(m=>same(m,[x,y])))cell.classList.add('mark');
      if(level.gate&&!shown.gateOpen&&Math.max(Math.abs(x-level.gate.at[0]),Math.abs(y-level.gate.at[1]))===1)cell.classList.add('gate-next');
      if(tile.made)cell.classList.add('made');
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!previewing){cell.classList.add('sel');const tag=document.createElement('span');tag.className='ord';tag.textContent=order+1;cell.append(tag);}
      if(previewing&&predicted&&predicted.last.landing.x===x&&predicted.last.landing.y===y)cell.classList.add('landed');
      cell.disabled=previewing||state.outcome!=='playing';cell.setAttribute('aria-pressed',String(order>=0&&!previewing));
      cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${tile.value}${spot?`, spot for order ${LETTERS[spot.i]}`:''}${tile.made?(goal().parts?', part':', made'):''}${family(tile.value)==='three'?', green':''}`);
      board.append(cell);
    }
    const path=$('path');path.setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);path.setAttribute('preserveAspectRatio','none');path.replaceChildren();
    if(!previewing&&selection.length>1){
      const good=legal&&(rules.completes(level,state,selection)>=0||rules.connects(level,selection)||rules.relayStage(level,state,selection)>=0||goal().type==='exact'&&selection.reduce((s,p)=>s+valueAt(state,p),0)===goal().make);
      const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [k,v] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:good?COLORS[0]:'#8a8f86','stroke-width':'6','stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'}))line.setAttribute(k,v);
      path.append(line);
    }
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length;$('undo').disabled=!history.length||state.outcome==='gave-up';
    $('preview').textContent=previewing?'Back to board':'Preview result';
    document.body.classList.toggle('previewing',previewing);
    const line=$('status');
    if(previewing&&predicted){
      const bits=[];
      if(predicted.outcome==='won')bits.push('This wins.');
      if(predicted.last.opened)bits.push('Opens the gate.');
      line.textContent=`PREVIEW · nothing spent. ${bits.join(' ')}`;line.dataset.tone=predicted.outcome==='won'?'good':'';
    }else if(state.outcome==='gave-up'){line.textContent=`Gave up after ${state.moves} move${state.moves===1?'':'s'}.`;line.dataset.tone='';}
    else{const d=describeSelection();line.textContent=d.text;line.dataset.tone=d.tone;}
    $('boards').replaceChildren(...levels.map((l,i)=>{const b=document.createElement('button');b.type='button';b.textContent=i+1;b.title=l.name;
      b.className=(i===local.current?'on ':'')+(answers[l.id]&&answers[l.id].different&&answers[l.id].wantMore?'answered':'');b.setAttribute('aria-label',`Board ${i+1}: ${l.name}`);b.onclick=()=>switchBoard(i);return b;}));
    $('title').textContent=`${local.current+1}. ${level.name}`;$('focus').textContent=level.focus;
    $('rule-title').textContent=level.ruleTitle;$('rule-body').textContent=level.rule;
    const over=state.outcome!=='playing';
    $('result').hidden=!over;
    if(over){
      $('result-title').textContent=state.outcome==='won'?'Done':state.outcome==='gave-up'?'Gave up':'Attempt finished';
      $('result-detail').textContent=state.outcome==='won'?`Done in ${state.moves} of ${state.maxMoves} moves.`:state.outcome==='gave-up'?`Gave up after ${state.moves} move${state.moves===1?'':'s'}.`:
        `${state.outcome==='out-of-moves'?'Out of moves':'No legal chain left'}. Undo, or retry the same board.`;
    }
    // Give up (grader set only): shown while the board is in play; the first tap arms it, a second tap within 3 seconds gives up.
    const quit=$('giveup');quit.hidden=!window.SamplerGiveUp||over;
    if(quit.hidden||!giveUpArmed){quit.textContent='Give up';quit.classList.remove('armed');}
    renderQuestions();
    fitBoard();
  }

  // v3 (owner: "the scale needs to be reduced"): the board is about a quarter smaller than v2 and sized so the board,
  // the order chips and the forecast strip fit the first screen at 390 × 844 and 1280 × 720. Tiles stay at least
  // 36 px wide (tap targets); a 7-wide board gets the room that needs.
  const GAP=5,PAD=7,MIN_TILE=36;
  function fitBoard(){
    const shell=$('shell'),cols=state.gridWidth,rows=state.gridHeight,phone=matchMedia('(max-width:760px)').matches;
    shell.style.width='';
    const room=shell.parentElement.clientWidth,top=shell.getBoundingClientRect().top+window.scrollY;
    const fc=$('forecast'),fcH=fc.hidden?0:fc.offsetHeight+6;
    const below=phone?$('actions-bar').offsetHeight+8:$('actions-bar').offsetHeight+$('status').offsetHeight+22;
    const tallest=(window.innerHeight-top-below-fcH-2*PAD-(rows-1)*GAP)/rows;
    const tile=Math.max(MIN_TILE,Math.min(phone?48:40,tallest,(room-2*PAD-(cols-1)*GAP)/cols));
    shell.style.width=Math.floor(tile*cols+(cols-1)*GAP+2*PAD)+'px';
    $('board').style.setProperty('--tf',Math.round(Math.max(12,Math.min(20,tile*.36)))+'px');
  }
  function renderQuestions(){
    const a=answers[level.id]||{};
    document.querySelectorAll('#questions .chips').forEach(group=>{
      group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(a[group.dataset.q]===b.dataset.v)));
    });
    if(document.activeElement!==$('note'))$('note').value=a.note||'';
    const played=!!local.played[level.id];
    document.querySelectorAll('#questions button,#note').forEach(el=>{el.disabled=!played;});
    if(!played)$('q-status').textContent='Make a move on this board first.';
    else if($('q-status').textContent==='Make a move on this board first.')$('q-status').textContent='';
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
    // Skip only a repeat of what is already saved: same actions and same reason (an `active` save must not swallow a
    // later `left-board`, `retried` or `closed`).
    if(!r.actions.length||r.savedRev===r.rev&&r.savedReason===reason)return;
    const doc=JSON.parse(JSON.stringify(Object.assign({},r,{endedAt:new Date().toISOString(),reason,outcome:state.outcome,movesUsed:state.moves,
      budget:state.maxMoves,done:state.done,finalGrid:state.grid.map(row=>row.map(t=>t?t.value:0))})));
    delete doc.savedRev;delete doc.savedReason;
    pending['runs/'+r.id]={collection:'runs',id:r.id,doc,statusEl:$('run-status'),done:()=>{if(doc.rev>=(r.savedRev||0)){r.savedRev=doc.rev;r.savedReason=reason;}}};flush();
  }
  function saveAnswer(a){const id=`${STUDY}--${a.board}`;pending['answers/'+id]={collection:'answers',id,doc:JSON.parse(JSON.stringify(a)),statusEl:$('q-status')};flush();}
  async function flush(){
    if(flushing){again=true;return;}flushing=true;
    try{
      for(const key of Object.keys(pending)){
        const item=pending[key];
        if(await saveDoc(item.collection,item.id,item.doc,item.statusEl)){
          if(item.done)item.done();
          if(pending[key]===item)delete pending[key];
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
    local.played[level.id]=run.id;keep();
    saveRun(state.outcome==='playing'?'active':'finished');
    render();
  }
  function disarm(){if(giveUpArmed){clearTimeout(giveUpArmed);giveUpArmed=null;}}
  function select(x,y){
    disarm();
    if(previewing||state.outcome!=='playing')return;
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0)selection=selection.slice(0,prior);
    else if(rules.valid(state,[...selection,[x,y]],false))selection.push([x,y]);
    else if(rules.valid(state,[[x,y]],false))selection=[[x,y]];
    render();
  }
  function switchBoard(i){
    if(i===local.current)return;
    if(run.actions.length)saveRun(state.outcome==='playing'?'left-board':overReason());
    local.current=i;keep();begin();
  }
  $('board').addEventListener('click',e=>{const cell=e.target.closest('button[data-x]');if(cell&&!cell.disabled)select(+cell.dataset.x,+cell.dataset.y);});
  $('merge').onclick=()=>{if(state.outcome==='playing'&&rules.valid(state,selection))apply(selection.map(p=>[...p]));};
  $('preview').onclick=()=>{if(rules.valid(state,selection)){previewing=!previewing;if(previewing){run.previews++;run.actions.push({type:'preview',chain:selection.map(p=>[...p]),at:Date.now()});run.rev++;}render();}};
  $('clear').onclick=()=>{selection=[];previewing=false;render();};
  $('undo').onclick=()=>{if(!history.length)return;state=history.pop();run.undos++;run.actions.push({type:'undo',at:Date.now()});run.rev++;selection=[];previewing=false;saveRun('active');render();};
  $('giveup').onclick=()=>{
    if(state.outcome!=='playing')return;
    if(!giveUpArmed){giveUpArmed=setTimeout(()=>{giveUpArmed=null;render();},3000);const b=$('giveup');b.textContent='Tap again to give up';b.classList.add('armed');return;}
    disarm();state=Object.assign({},state,{outcome:'gave-up'});selection=[];previewing=false;
    run.actions.push({type:'give-up',moves:state.moves,at:Date.now()});run.rev++;local.played[level.id]=run.id;keep();
    saveRun('gave-up');render();$('result').scrollIntoView({block:'nearest',behavior:'smooth'});
  };
  document.querySelectorAll('.actions button,#undo,#retry,#next').forEach(b=>b.addEventListener('click',()=>{if(giveUpArmed){disarm();render();}},true));
  $('retry').onclick=()=>{if(run.actions.length)saveRun(state.outcome==='playing'?'retried':overReason());begin();};
  $('next').onclick=()=>switchBoard((local.current+1)%levels.length);
  document.querySelectorAll('#questions .chips').forEach(group=>group.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!local.played[level.id])return;
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,kind:level.kind,number:local.current+1},answers[level.id]||{},{[group.dataset.q]:b.dataset.v,[group.dataset.q+'Run']:local.played[level.id],runId:local.played[level.id],savedAt:new Date().toISOString()});
    renderQuestions();render();saveAnswer(a);
  }));
  $('note').addEventListener('change',()=>{
    if(!local.played[level.id])return;
    const a=answers[level.id]=Object.assign({study:STUDY,board:level.id,kind:level.kind,number:local.current+1},answers[level.id]||{},{note:$('note').value.slice(0,500),noteRun:local.played[level.id],runId:local.played[level.id],savedAt:new Date().toISOString()});
    saveAnswer(a);render();
  });
  window.addEventListener('pagehide',()=>{if(run&&run.actions.length)saveRun(state.outcome==='playing'?'closed':overReason());});
  // Stored answers (this study only; v1 docs are keyed by bare board id) load in the background; a board answered locally in the meantime keeps its newer copy.
  (async()=>{try{const db=await database();if(!db)return;const snap=await db.collection('answers').get();
    (snap.docs||snap).forEach(d=>{const v=d.data?d.data():d;if(!v||v.study!==STUDY)return;/* other versions' answers stay out */if(v.board&&(!answers[v.board]||(answers[v.board].savedAt||'')<(v.savedAt||'')))answers[v.board]=v;if(v.board&&v.runId&&!local.played[v.board])local.played[v.board]=v.runId;});render();}catch(e){/* offline is fine */}})();
  window.addEventListener('resize',()=>{if(state)fitBoard();});
  begin();
})();
