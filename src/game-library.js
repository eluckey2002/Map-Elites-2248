(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else{root.GameLibrary=factory();return root.GameLibrary.boot(root);}
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function resolveRoute(search,levels){
    const params=new URLSearchParams(search),mode=params.get('mode');
    if(!mode||mode==='legacy')return {mode:'legacy'};
    if(mode!=='connections'&&mode!=='delivery')return {mode:'error',message:'Unknown game variant. Choose a puzzle or return to your original levels.'};
    if(!params.has('puzzle'))return {mode:'library'};
    const puzzle=levels.find(level=>level.id===params.get('puzzle'));
    return puzzle?{mode:'puzzle',puzzle}:{mode:'error',message:'That puzzle is not in this pack. Choose one from the library.'};
  }
  function variantUrl(mode,search='',puzzle){
    const params=new URLSearchParams(search);params.set('mode',mode);params.delete('attempt');
    if(puzzle)params.set('puzzle',puzzle);else params.delete('puzzle');
    return '?'+params.toString();
  }
  function connectionsUrl(search='',puzzle){return variantUrl('connections',search,puzzle);}
  function deliveryUrl(search='',puzzle){return variantUrl('delivery',search,puzzle);}
  function legacyUrl(search=''){
    const params=new URLSearchParams(search);params.delete('mode');params.delete('puzzle');params.delete('attempt');
    return params.size?'?'+params.toString():'?mode=legacy';
  }
  // The play server builds connection-core.js from the solver engine. A
  // plain static server of the repository has no such file, so load the
  // engine itself as a CommonJS module instead.
  async function loadCore(root,load){
    try{await load('connection-core.js');return;}catch{}
    root.module={exports:{}};
    try{await load('../solver/engine.js');root.ChainCore=root.module.exports;}
    catch{throw new Error('Could not load the puzzle rules. Serve the repository root, or run node tools/play-server.js.');}
    finally{delete root.module;}
  }
  async function boot(root){
    const doc=root.document,$=id=>doc.getElementById(id),search=root.location.search;
    function load(src){return new Promise((resolve,reject)=>{const script=doc.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('Could not load '+src));doc.head.append(script);});}
    try{
      if(resolveRoute(search,[]).mode==='legacy'){
        $('connections-entry').href=connectionsUrl(search);$('delivery-entry').href=deliveryUrl(search);
        await load('game.js');await load('more-levels.js');return;
      }
      if(new URLSearchParams(search).get('mode')==='delivery')return await bootDelivery(root,load);
      $('legacy-app').hidden=true;$('connections-app').hidden=false;doc.body.classList.add('connection-mode');
      const style=doc.createElement('link');style.rel='stylesheet';style.href='connection-style.css';doc.head.append(style);
      $('cx-legacy').href=legacyUrl(search);$('cx-library-link').href=connectionsUrl(search);
      await load('connection-levels.js');
      const route=resolveRoute(search,root.ConnectionLevels);
      if(route.mode==='error'){
        $('cx-error').hidden=false;$('cx-error').textContent=route.message;return;
      }
      if(route.mode==='library'){
        doc.title='2248 · Connection puzzles';$('cx-library').hidden=false;
        let completed={};try{completed=JSON.parse(root.localStorage.getItem('connectionPuzzleWins')||'{}');}catch{}
        for(const level of root.ConnectionLevels){
          const link=doc.createElement('a');link.className='cx-level-card';link.href=connectionsUrl(search,level.id);
          const name=doc.createElement('h2'),detail=doc.createElement('p'),status=doc.createElement('span');
          name.textContent=level.name;detail.textContent=level.focus;status.textContent=`3 connections · ${level.moves} moves${completed[level.id]?' · Completed':''}`;
          link.append(name,detail,status);$('cx-level-list').append(link);
        }
        return;
      }
      await loadCore(root,load);for(const src of ['connection-rules.js','connection-math.js','connection-game.js'])await load(src);
    }catch(error){
      const alert=$('cx-error');alert.hidden=false;alert.textContent=error.message;
      if($('connections-app').hidden)$('legacy-app').append(alert);
    }
  }
  async function bootDelivery(root,load){
    const doc=root.document,$=id=>doc.getElementById(id),search=root.location.search;
    $('legacy-app').hidden=true;$('delivery-app').hidden=false;doc.body.classList.add('connection-mode');
    for(const href of ['connection-style.css','delivery-style.css']){const style=doc.createElement('link');style.rel='stylesheet';style.href=href;doc.head.append(style);}
    $('dx-legacy').href=legacyUrl(search);$('dx-library-link').href=deliveryUrl(search);
    try{
      await load('delivery-levels.js');
      const route=resolveRoute(search,root.DeliveryLevels);
      if(route.mode==='error'){$('dx-error').hidden=false;$('dx-error').textContent=route.message;return;}
      if(route.mode==='library'){
        doc.title='2248 · Delivery puzzles';$('dx-library').hidden=false;
        let completed={};try{completed=JSON.parse(root.localStorage.getItem('deliveryPuzzleWins')||'{}');}catch{}
        root.DeliveryLevels.forEach((level,index)=>{
          const link=doc.createElement('a');link.className='cx-level-card';link.href=deliveryUrl(search,level.id);
          const name=doc.createElement('h2'),detail=doc.createElement('p'),status=doc.createElement('span');
          name.textContent=`${index+1}. ${level.name}`;detail.textContent=level.focus;status.textContent=`1 parcel · ${level.moves} moves${completed[level.id]?' · Completed':''}`;
          link.append(name,detail,status);$('dx-level-list').append(link);
        });
        return;
      }
      await loadCore(root,load);for(const src of ['delivery-rules.js','delivery-game.js'])await load(src);
    }catch(error){$('dx-error').hidden=false;$('dx-error').textContent=error.message;}
  }
  return {resolveRoute,connectionsUrl,deliveryUrl,legacyUrl,boot};
});
