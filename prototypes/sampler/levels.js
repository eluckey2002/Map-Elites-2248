(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SamplerLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Kinds sampler: each board is one core idea plus one layer that makes the steps depend on each other (PDL-038:
     Recipe alone "is not enough"; orders that feed each other "looks promising"). Kinds and layers are from
     level-archetypes/11-five-kinds-expanded.md. Three Separate is the control (three orders that share nothing).
     Screened with search.js: a beam-solver win in (moves - 2) that needs at least 4 moves, the largest-sum harvest
     proxy loses, the "do the obvious" proxy (fill any goal the moment it can, else the largest sum) loses, and the
     twist checks in search.necessity pass. Refills mix in 6, 12 and 24 so long chains are rarer. */
  const spawnValues=[4,6,8,12,16,24,32];
  return [
    {id:'make-it-here',kind:'recipe-spot-chain',name:'Make It Here',focus:'Two orders, each on its own spot; the first feeds the second',
      ruleTitle:'Make each order on its spot.',rule:'Order A is 144 from three 48s, ending on the first ◎. Order B is 432 from three 144s, ending on the second ◎. The 144 you make for A counts as one of B’s 144s, so where you put it matters.',
      hint:'Choose a chain. Each order must end on its ◎.',
      seed:161,moves:7,spawnValues,goal:{type:'orders',orders:[{make:144,from:48,at:[2,3]},{make:432,from:144,at:[2,5]}]},
      grid:[[144,6,24,24,12],[8,12,48,24,6],[12,12,24,12,12],[8,144,12,4,24],[24,16,12,6,16],[24,4,24,12,12]]},
    {id:'feed-the-next',kind:'feeding-orders',name:'Feed the Next',focus:'Each order makes an ingredient for the next',
      ruleTitle:'Three orders that feed each other.',rule:'Three 8s make a 24, an ingredient for order B. Three 24s make a 72, an ingredient for order C. The board starts short of 24s and 72s.',
      hint:'Choose a chain. Each order needs one chain made only of its ingredient.',
      seed:61,moves:7,spawnValues,goal:{type:'orders',orders:[{make:24,from:8},{make:72,from:24},{make:216,from:72}]},
      grid:[[8,48,8,8,8],[8,12,16,4,4],[12,8,72,8,8],[48,8,4,8,24],[24,8,12,8,16],[8,72,48,8,8]]},
    {id:'shared-material',kind:'shared-material',name:'Shared Material',focus:'Two orders want the same 24s, and there aren’t enough',
      ruleTitle:'Two orders, one pile of 24s.',rule:'Order A needs three 24s, order B needs four. The board has four 24s, and no 12s or 24s fall in. Two 12s make a 24.',
      hint:'Choose a chain. Both orders eat 24s.',
      seed:25,moves:7,spawnValues:[4,6,8,16,32],goal:{type:'orders',orders:[{make:72,from:24},{make:96,from:24}]},
      grid:[[16,6,8,6,8],[6,6,8,4,8],[16,12,24,6,8],[12,12,24,8,24],[6,12,4,12,24],[12,12,4,12,12]]},
    {id:'three-separate',kind:'separate-orders',name:'Three Separate',focus:'Three orders that don’t share anything',
      ruleTitle:'Three separate orders.',rule:'Three orders, each made from its own ingredient. No order makes or uses another’s tiles.',
      hint:'Choose a chain. Each order needs one chain made only of its ingredient.',
      seed:13,moves:7,spawnValues,goal:{type:'orders',orders:[{make:96,from:24},{make:256,from:64},{make:384,from:128}]},
      grid:[[6,64,128,24,24],[16,64,64,6,64],[16,128,24,24,6],[24,64,128,128,6],[64,64,64,16,16],[128,12,16,32,6]]},
    {id:'see-it-coming',kind:'forecast-relay',name:'See It Coming',focus:'Make 96, then 192 using it, with the refills shown',
      ruleTitle:'Make 96, then 192 using it.',rule:'First make exactly 96; that tile gets a ●. Then make exactly 192 with a chain that includes the ● tile. The next two tiles that drop into each column show above it.',
      hint:'Choose a chain. Watch what drops into each column.',
      seed:1,moves:7,spawnValues,forecast:true,goal:{type:'relay',stages:[96,192]},
      grid:[[12,16,24,32,4],[24,16,16,32,4],[32,6,6,4,4],[8,12,4,8,12],[24,4,16,6,32],[8,8,4,6,12]]},
    {id:'dry-well',kind:'dry-well-ice',name:'Dry Well',focus:'No refills, two frozen tiles: finish with one tile',
      ruleTitle:'No new tiles. Finish with one.',rule:'Nothing refills. Frozen tiles can’t be used until a chain ends beside them, which thaws them. Merge everything down to one tile.',
      hint:'Choose a chain. Nothing will refill.',
      seed:194,moves:6,spawnValues,refill:false,rust:{cells:[[0,3],[1,1]],every:0,ice:true},goal:{type:'leftover',max:1},
      grid:[[24,24,16,24],[48,48,24,16],[12,12,6,6],[12,24,8,8]]},
    {id:'through-the-gate',kind:'rooms-gate',name:'Through the Gate',focus:'Open the wall with an exact sum, then link both ★',
      ruleTitle:'Open the gate, then connect the rooms.',rule:'A wall splits the board. The gate opens when a chain of exactly 48 ends beside it. Then one chain must pass through both ★ cells.',
      hint:'Choose a chain. Open the gate first.',
      seed:14,moves:8,spawnValues,stone:[[2,0],[2,1],[2,2],[2,3],[2,4],[2,5]],gate:{at:[2,3],sum:48},goal:{type:'connect',marks:[[0,1],[4,4]]},
      grid:[[6,8,0,8,4],[8,8,0,8,8],[6,16,0,32,8],[6,32,0,32,12],[16,8,0,6,4],[24,16,0,32,24]]},
    {id:'rust',kind:'rust-scrape',name:'Rust',focus:'Rust spreads every move; only a 48 scrapes it',
      ruleTitle:'Make exactly 192 before the rust takes it.',rule:'Rusted tiles can’t be used. After every move, rust spreads to one tile beside it. Only a chain of exactly 48 that ends beside rust scrapes it off.',
      hint:'Choose a chain. Rust spreads after every move.',
      seed:129,moves:7,spawnValues,rust:{cells:[[4,3],[0,2]],every:1,scrape:48},goal:{type:'exact',make:192},
      grid:[[6,8,24,12,12],[16,8,24,16,12],[6,12,16,12,6],[6,8,6,12,6],[12,8,16,24,24],[24,12,48,8,16]]}
  ];
});
