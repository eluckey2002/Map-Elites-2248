(function(){
  'use strict';
  const rules=window.DeliveryRules,levels=window.DeliveryLevels,$=id=>document.getElementById('dx-'+id);
  const params=new URLSearchParams(window.location.search),index=levels.findIndex(item=>item.id===params.get('puzzle')),level=levels[index];
  let state,history=[],selection=[],preview=false,dragging=false;
  function resetSelection(){selection=[];preview=false;dragging=false;}
  function parcelText(current){
    if(current.delivered)return 'Delivered';
    const parcel=rules.parcel(current);
    return parcel.rowsToGo===0?'At the exit':`${parcel.rowsToGo} row${parcel.rowsToGo===1?'':'s'} to go`;
  }
  function render(){
    const legal=state.outcome==='playing'&&rules.valid(state,selection);
    const predicted=legal?rules.preview(level,state,selection):null,shown=preview&&predicted?predicted:state;
    const total=selection.reduce((sum,[x,y])=>sum+state.grid[y][x].value,0);
    $('parcel').textContent=parcelText(shown);$('moves').textContent=String(shown.maxMoves-shown.moves);$('score').textContent=shown.score.toLocaleString();
    $('board').style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;$('board').replaceChildren();
    for(let y=0;y<shown.gridHeight;y++)for(let x=0;x<shown.gridWidth;x++){
      const tile=shown.grid[y][x],cell=document.createElement('button');cell.type='button';cell.dataset.x=x;cell.dataset.y=y;
      if(tile.cargo){cell.className='cx-tile dx-parcel';cell.append(document.createTextNode('▣'));}
      else{cell.className=`cx-tile ${tile.value>128?'cx-built':'cx-v'+tile.value}`;cell.append(document.createTextNode(tile.value));}
      if(x===level.exit)cell.classList.add('dx-shaft');
      const order=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
      if(order>=0&&!preview){cell.classList.add('cx-selected');const tag=document.createElement('span');tag.className='cx-order';tag.textContent=order+1;cell.append(tag);}
      cell.disabled=preview||state.outcome!=='playing'||tile.cargo;cell.setAttribute('aria-pressed',String(order>=0&&!preview));
      cell.setAttribute('aria-label',`Column ${x+1}, row ${y+1}: ${tile.cargo?'parcel':tile.value}${x===level.exit?', exit column':''}`);
      $('board').append(cell);
    }
    $('exit').style.gridTemplateColumns=`repeat(${shown.gridWidth},1fr)`;$('exit').replaceChildren();
    for(let x=0;x<shown.gridWidth;x++){const mark=document.createElement('span');mark.textContent=x===level.exit?'↓ EXIT':'';$('exit').append(mark);}
    $('path').setAttribute('viewBox',`0 0 ${shown.gridWidth*100} ${shown.gridHeight*100}`);$('path').setAttribute('preserveAspectRatio','none');$('path').replaceChildren();
    if(!preview&&selection.length>1){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      for(const [name,value] of Object.entries({points:selection.map(([x,y])=>`${x*100+50},${y*100+50}`).join(' '),fill:'none',stroke:'#e59a59','stroke-width':'5','stroke-linecap':'round','stroke-linejoin':'round'}))line.setAttribute(name,value);
      $('path').append(line);
    }
    $('merge').disabled=!legal;$('preview').disabled=!legal;$('clear').disabled=!selection.length;
    $('preview').textContent=preview?'Back to board':'Preview result';$('undo').disabled=!history.length;
    document.body.classList.toggle('cx-previewing',preview);
    let effect='';
    if(predicted){
      const before=rules.parcel(state).rowsToGo,after=predicted.delivered?-1:rules.parcel(predicted).rowsToGo;
      effect=predicted.delivered?'Delivers the parcel.':after<before?`The parcel drops ${before-after} row${before-after===1?'':'s'}.`:'The parcel stays where it is.';
    }
    $('selection').textContent=preview?`PREVIEW ONLY · Nothing has been spent. ${effect}`:
      predicted?`${selection.length} tiles → ${total.toLocaleString()} on the last tile. ${effect}`:
      selection.length?'Start with two equal tiles, then continue equal or double.':'Choose a chain. Clear the tiles under the parcel.';
    $('result').hidden=state.outcome==='playing';
    $('result-title').textContent=state.outcome==='won'?'Parcel delivered':'Attempt finished';
    $('result-detail').textContent=state.outcome==='won'?`Delivered in ${state.moves} of ${state.maxMoves} moves. Retry to try another route.`:
      state.outcome==='out-of-moves'?'No moves remain. Undo, or retry with the same board and refills.':'No legal chain remains. Undo, or retry.';
  }
  function apply(chain){
    history.push(state);state=rules.move(level,state,chain);resetSelection();render();
    if(state.outcome==='won')try{
      const completed=JSON.parse(localStorage.getItem('deliveryPuzzleWins')||'{}');completed[level.id]=true;localStorage.setItem('deliveryPuzzleWins',JSON.stringify(completed));
    }catch{}
  }
  function select(x,y){
    if(preview||state.outcome!=='playing')return;
    const prior=selection.findIndex(([sx,sy])=>sx===x&&sy===y);
    if(prior>=0)selection=selection.slice(0,prior+1);
    else if(rules.valid(state,[...selection,[x,y]],false))selection.push([x,y]);
    render();
  }
  function begin(){state=rules.create(level);history=[];resetSelection();render();}
  $('board').addEventListener('pointerdown',event=>{const cell=event.target.closest('button[data-x]');if(!cell||cell.disabled)return;event.preventDefault();dragging=true;select(+cell.dataset.x,+cell.dataset.y);});
  window.addEventListener('pointermove',event=>{if(!dragging)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#dx-board button[data-x]');if(cell&&!cell.disabled)select(+cell.dataset.x,+cell.dataset.y);});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);
  $('board').addEventListener('click',event=>{if(event.detail!==0)return;const cell=event.target.closest('button[data-x]');if(cell&&!cell.disabled){select(+cell.dataset.x,+cell.dataset.y);$('board').querySelector(`[data-x="${cell.dataset.x}"][data-y="${cell.dataset.y}"]`)?.focus();}});
  $('merge').onclick=()=>{if(state.outcome==='playing'&&rules.valid(state,selection))apply(selection.map(position=>[...position]));};
  $('preview').onclick=()=>{if(rules.valid(state,selection)){preview=!preview;render();}};
  $('clear').onclick=()=>{resetSelection();render();};
  $('undo').onclick=()=>{if(!history.length)return;state=history.pop();resetSelection();render();};
  $('retry').onclick=()=>{if(state.moves&&state.outcome==='playing'&&!window.confirm('Start this puzzle again? Your current moves will be lost.'))return;begin();};
  try{
    if(!level)throw new Error('Unknown puzzle. Choose one from the library.');
    document.title=`2248 · ${level.name}`;$('title').textContent=`${index+1}. ${level.name}`;$('subtitle').textContent=level.focus;
    const next=levels[index+1],library=window.GameLibrary;
    $('next').href=library?library.deliveryUrl(window.location.search,next?.id):'?mode=delivery';
    $('next').textContent=next?`Next: ${next.name} →`:'Back to the Delivery puzzles →';
    $('play').hidden=false;begin();
  }catch(error){$('error').hidden=false;$('error').textContent=error.message;}
})();
