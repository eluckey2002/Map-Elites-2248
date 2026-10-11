(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SamplerLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Kinds sampler v3 (PDL-040). Each board is one core idea plus one layer that makes the steps depend on each other
     (PDL-038). Standing owner rules kept from v2 (PDL-039): one refill rule, 2..64, on every normal board; every target,
     order and gate number is a power of two (Shared Material's placed green 3s are the only off-family tiles); only a
     boss changes refills, and says so before the first move; no "leave N tiles" goals. v3: Rust is retired; every
     budget is the best known line + 4; no board can be won in 3 moves or fewer (exhaustive check). Screened with
     search.js (see model.test.js and the README); screens are not evidence. */
  const spawnValues=[2,4,8,16,32,64];
  return [
    {id:'make-it-here',kind:'recipe-spot-chain',name:'Make It Here',focus:'Where you fill A matters for B',oneAtATime:true,
      ruleTitle:'Fill each order on its ◎.',rule:'Fill A with a chain that ends on its ◎, then B on its ◎. A’s 64 can be one of B’s four.',
      hint:'',
      seed:3,moves:8,spawnValues,goal:{type:'orders',orders:[{make:64,from:16,at:[3,2]},{make:256,from:64,at:[1,4]}]},
      grid:[[8,16,4,8,16],[64,8,16,8,16],[16,8,16,8,16],[16,8,8,16,8],[8,16,8,4,8],[4,4,8,4,16]]},
    {id:'feed-the-next',kind:'feeding-orders-parts',name:'Feed the Next',focus:'Each order makes a part; the next order needs a part',
      ruleTitle:'Three orders, joined by parts.',rule:'Fill A, then B, then C. The tile an order makes becomes a part (●). B’s chain and C’s chain must each include at least one part, any part. At most two parts can be on the board at once.',
      hint:'Choose a chain. B and C each need a part (●) in the chain.',
      seed:38,moves:8,spawnValues,goal:{type:'orders',parts:true,orders:[{make:64,from:16},{make:256,from:64},{make:1024,from:256}]},
      grid:[[16,64,8,2,64],[32,64,256,64,4],[16,64,64,16,8],[64,64,32,16,4],[16,16,16,256,64],[2,8,64,64,16]]},
    {id:'feed-the-next-advanced',kind:'parts-any-order',name:'Feed the Next — Advanced',focus:'Advanced: any order, but only two parts fit on the board',
      ruleTitle:'Advanced: four orders, any order, two parts at most.',rule:'Fill the orders in any order. Each fill turns its tile into a part (●), and at most two parts fit on the board: a fill that would make a third does not count (the tiles still merge and the move is spent). D’s chain must include two parts.',
      hint:'Choose a chain. Count your parts before each fill.',
      seed:3,moves:9,spawnValues,goal:{type:'orders',parts:true,anyOrder:true,orders:[{make:64,from:16},{make:32,from:8},{make:64,from:16},{make:256,from:64,parts:2}]},
      grid:[[8,32,16,4,64],[16,4,16,8,64],[8,4,64,8,16],[32,4,8,16,4],[4,16,4,16,8],[2,8,4,16,32]]},
    {id:'shared-material',kind:'shared-material',name:'Shared Material',focus:'Two orders want the same green 3s, and there is one to spare',
      ruleTitle:'Two orders, one pile of green 3s.',rule:'Order A and order B each want four green 3s in one chain. The board has nine 3s and there will never be more: green tiles never fall in, and no chain can make a 3. Fill one order so the other still has four 3s that can touch.',
      hint:'Choose a chain. Both orders eat green 3s.',
      seed:64,moves:8,spawnValues,goal:{type:'orders',orders:[{make:12,from:3},{make:12,from:3}]},
      grid:[[8,4,32,4,3],[3,4,3,4,2],[32,4,3,3,16],[3,16,4,3,16],[4,8,3,4,2],[8,3,4,4,32]]},
    {id:'three-separate',kind:'separate-orders',name:'Three Separate',focus:'Three orders that don’t share anything',
      ruleTitle:'Three separate orders.',rule:'Three orders, each made from its own ingredient. No order makes or uses another’s tiles.',
      hint:'Choose a chain. Each order needs one chain made only of its ingredient.',
      seed:2,moves:9,spawnValues,goal:{type:'orders',orders:[{make:32,from:8},{make:256,from:64},{make:512,from:128}]},
      grid:[[32,128,32,4,64],[128,128,64,128,64],[64,128,128,4,128],[128,64,64,8,64],[8,2,4,16,16],[4,8,64,32,8]]},
    {id:'see-it-coming',kind:'forecast-relay',name:'See It Coming',focus:'Make 256, then 512 using it; plan with the next tiles',
      ruleTitle:'Watch the next tiles: make 256, then 512 using it.',rule:'Next tiles: the dark strip above the board shows the next two tiles that drop into each column. Make a 256 (it gets a ●), then a 512 with a chain that includes it.',
      hint:'Choose a chain. Check the next tiles first.',
      seed:4,moves:8,spawnValues,forecast:true,goal:{type:'relay',stages:[256,512]},
      grid:[[2,8,2,16,2],[8,8,4,2,4],[8,4,32,16,32],[4,2,4,8,2],[2,2,16,4,32],[8,16,16,8,32]]},
    {id:'the-drought',kind:'boss-no-refill',name:'The Drought',focus:'Boss: nothing refills. Make one 512',
      ruleTitle:'Boss: make one 512. Nothing refills.',rule:'This is a boss board: nothing refills, so every tile you use is gone for good. Make one tile of 512.',
      hint:'Choose a chain. Nothing will refill.',
      seed:59,moves:10,spawnValues,refill:false,boss:{title:'Boss: The Drought',text:'Nothing refills on this board.'},goal:{type:'exact',make:512},
      grid:[[128,16,32,2,8],[64,2,4,4,4],[128,4,4,8,8],[16,16,2,2,32],[64,128,2,16,8],[4,4,16,16,2]]},
    {id:'through-the-gate',kind:'rooms-gate',name:'Through the Gate',focus:'Open the wall with a chain of 128 or more, then link both ★',
      ruleTitle:'Open the gate, then connect the rooms.',rule:'A wall splits the board into two rooms. The gate opens when a chain of 128 or more ends beside it. Then one chain must pass through both ★ cells. The next two tiles that drop into each column show above it.',
      hint:'Choose a chain. Open the gate first.',
      seed:3,moves:8,spawnValues,forecast:true,stone:[[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],gate:{at:[3,4],sum:128},goal:{type:'connect',marks:[[0,4],[6,5]]},
      grid:[[8,16,64,0,4,32,32],[16,8,4,0,16,8,16],[16,4,8,0,16,4,4],[8,16,16,0,8,4,64],[4,2,4,0,16,64,16],[2,4,32,0,4,4,64]]}
  ];
});
