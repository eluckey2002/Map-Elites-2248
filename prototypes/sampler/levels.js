(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SamplerLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Kinds sampler v5, the final round (owner's final review, 2026-10-18). Only the kinds the owner kept, one board each, in
     play order: Feed the Next (entry), a revised Make It Here, Shared Material, See It Coming, Through the Gate, and
     The Drought (boss) last. Dropped: Feed the Next — Advanced and its two-part cap, and the Three Separate control. Owner picks applied:
     no Next-tiles strip on normal boards (normal shared refills again); See It Coming alone shows one tile per column;
     the gate opens when a 128 tile (or bigger) sits beside it; The Drought is the round 2 board he won and liked.
     Standing rules kept: one refill rule (2..64) on every normal board, powers of two, only the announced boss changes
     refills, no leave-N goals. Budgets come from play across many refill draws (calibrate.js), not the solver's best
     line. Screens are not evidence. */
  const spawnValues=[2,4,8,16,32,64];
  return [
    {id:'feed-the-next',kind:'feeding-orders-parts',name:'Feed the Next',focus:'Each order makes a part; the next order needs a part',
      ruleTitle:'Three orders, joined by parts.',rule:'Fill A, then B, then C. The tile an order makes becomes a part (●). B’s chain and C’s chain must each include a part.',
      hint:'Choose a chain. B and C each need a part (●) in the chain.',
      seed:38,moves:12,spawnValues,goal:{type:'orders',parts:true,orders:[{make:64,from:16},{make:256,from:64},{make:1024,from:256}]},
      grid:[[16,64,8,2,64],[32,64,256,64,4],[16,64,64,16,8],[64,64,32,16,4],[16,16,16,256,64],[2,8,64,64,16]]},
    {id:'make-it-here',kind:'recipe-spot-chain',name:'Make It Here',focus:'Where you fill A matters for B',oneAtATime:true,
      ruleTitle:'Fill each order on its ◎.',rule:'Fill A on its ◎, then B on its ◎. A’s 64 can be one of B’s four.',
      hint:'',
      seed:42,moves:18,spawnValues,goal:{type:'orders',orders:[{make:64,from:16,at:[3,2]},{make:256,from:64,at:[1,4]}]},
      grid:[[8,16,4,8,16],[64,8,16,8,16],[16,8,16,8,16],[16,8,8,16,8],[8,16,8,4,8],[4,4,8,4,16]]},
    {id:'shared-material',kind:'shared-material',name:'Shared Material',focus:'Two orders want the same green 3s, and there is one to spare',
      ruleTitle:'Two orders, one pile of green 3s.',rule:'Order A and order B each want four green 3s in one chain. The board has nine 3s and there will never be more. Fill one order so the other still has four 3s that can touch.',
      hint:'Choose a chain. Both orders eat green 3s.',
      seed:64,moves:19,spawnValues,goal:{type:'orders',orders:[{make:12,from:3},{make:12,from:3}]},
      grid:[[8,4,32,4,3],[3,4,3,4,2],[32,4,3,3,16],[3,16,4,3,16],[4,8,3,4,2],[8,3,4,4,32]]},
    {id:'see-it-coming',kind:'forecast-relay',name:'See It Coming',focus:'Make 256, then 512 using it; plan with the next tiles',
      ruleTitle:'Watch the next tiles: make 256, then 512 using it.',rule:'Next tiles: the dark strip above the board shows the next tile that drops into each column. Make a 256 (it gets a ●), then a 512 with a chain that includes it.',
      hint:'Choose a chain. Check the next tiles first.',
      seed:4,moves:22,spawnValues,forecast:true,forecastShow:1,goal:{type:'relay',stages:[256,512]},
      grid:[[2,8,2,16,2],[8,8,4,2,4],[8,4,32,16,32],[4,2,4,8,2],[2,2,16,4,32],[8,16,16,8,32]]},
    {id:'through-the-gate',kind:'rooms-gate',name:'Through the Gate',focus:'Get a 128 next to the gate, then link both ★',
      ruleTitle:'Open the gate, then connect the rooms.',rule:'A wall splits the board into two rooms. The gate opens when a 128 tile, or bigger, sits next to it. Then one chain must pass through both ★ cells.',
      hint:'Choose a chain. Open the gate first.',
      seed:3,moves:13,spawnValues,stone:[[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],gate:{at:[3,4],tile:128},goal:{type:'connect',marks:[[0,4],[6,5]]},
      grid:[[8,16,64,0,4,32,32],[16,8,4,0,16,8,16],[16,4,8,0,16,4,4],[8,16,16,0,8,4,64],[4,2,4,0,16,64,16],[2,4,32,0,4,4,64]]},
    {id:'the-drought',kind:'boss-no-refill',name:'The Drought',focus:'Boss: nothing refills. Make one 512',
      ruleTitle:'Boss: make one 512. Nothing refills.',rule:'This is a boss board: nothing refills, so every tile you use is gone for good. Make one tile of 512.',
      hint:'Choose a chain. Nothing will refill.',
      seed:22,moves:10,spawnValues,refill:false,boss:{title:'Boss: The Drought',text:'Nothing refills on this board.'},goal:{type:'exact',make:512},
      grid:[[128,8,64,8,64],[32,4,8,4,8],[16,8,64,128,16],[128,32,8,32,32],[128,2,8,2,64],[8,32,32,64,16]]}
  ];
});
