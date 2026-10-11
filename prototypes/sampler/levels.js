(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SamplerLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Kinds sampler v2 (PDL-039). Each board is one core idea plus one layer that makes the steps depend on each other
     (PDL-038). Standing owner rules for v2: one refill rule, 2..64, on every normal board; every target, order, gate
     and scrape number is a power of two; only a boss changes refills, and says so before the first move; off-family
     (green, 3-line) tiles are only ever placed on the starting board; no "leave N tiles" goals. Feed the Next —
     Advanced is v1's Feed the Next kept as built (owner: "a keeper - advanced level"), so it keeps its own spawn list.
     Screened with search.js (see model.test.js and the README); screens are not evidence. */
  const spawnValues=[2,4,8,16,32,64];
  return [
    {id:'make-it-here',kind:'recipe-spot-chain',name:'Make It Here',focus:'Two orders, each on its own spot; the first feeds the second',
      ruleTitle:'Make each order on its spot.',rule:'Order A wants four 16s in one chain that ends on the first ◎. Order B wants four 64s in one chain that ends on the second ◎. The 64 you make for A can be one of B’s four, so where you make it matters.',
      hint:'Choose a chain. Each order must end on its ◎.',
      seed:1,moves:7,spawnValues,goal:{type:'orders',orders:[{make:64,from:16,at:[1,3]},{make:256,from:64,at:[2,5]}]},
      grid:[[16,16,4,8,4],[4,16,16,8,2],[8,8,16,2,4],[32,16,4,64,16],[64,2,16,16,2],[32,32,4,8,16]]},
    {id:'feed-the-next',kind:'feeding-orders-parts',name:'Feed the Next',focus:'Each order makes a part; the next order needs a part',
      ruleTitle:'Three orders, joined by parts.',rule:'Fill A, then B, then C. The tile an order makes becomes a part (●). B’s chain and C’s chain must each include at least one part, any part. At most two parts can be on the board at once.',
      hint:'Choose a chain. B and C each need a part (●) in the chain.',
      seed:38,moves:6,spawnValues,goal:{type:'orders',parts:true,orders:[{make:64,from:16},{make:256,from:64},{make:1024,from:256}]},
      grid:[[16,64,8,2,64],[32,64,256,64,4],[16,64,64,16,8],[64,64,32,16,4],[16,16,16,256,64],[2,8,64,64,16]]},
    {id:'feed-the-next-advanced',kind:'feeding-orders',name:'Feed the Next — Advanced',focus:'Advanced: each order makes an ingredient for the next',
      ruleTitle:'Advanced: three orders that feed each other.',rule:'Fill A, then B, then C. The tile each order makes gets a ●, and the next order’s chain must include it: A’s 24 goes into B, B’s 72 goes into C. The board starts short of 24s and 72s.',
      hint:'Choose a chain. Each order needs one chain made only of its ingredient.',
      seed:61,moves:7,spawnValues:[4,6,8,12,16,24,32],goal:{type:'orders',feeds:true,orders:[{make:24,from:8},{make:72,from:24},{make:216,from:72}]},
      grid:[[8,48,8,8,8],[8,12,16,4,4],[12,8,72,8,8],[48,8,4,8,24],[24,8,12,8,16],[8,72,48,8,8]]},
    {id:'shared-material',kind:'shared-material',name:'Shared Material',focus:'Two orders want the same green 3s, and there is one to spare',
      ruleTitle:'Two orders, one pile of green 3s.',rule:'Order A and order B each want four green 3s in one chain. The board has nine 3s and there will never be more: green tiles never fall in, and no chain can make a 3. Fill one order so the other still has four 3s that can touch.',
      hint:'Choose a chain. Both orders eat green 3s.',
      seed:64,moves:6,spawnValues,goal:{type:'orders',orders:[{make:12,from:3},{make:12,from:3}]},
      grid:[[8,4,32,4,3],[3,4,3,4,2],[32,4,3,3,16],[3,16,4,3,16],[4,8,3,4,2],[8,3,4,4,32]]},
    {id:'three-separate',kind:'separate-orders',name:'Three Separate',focus:'Three orders that don’t share anything',
      ruleTitle:'Three separate orders.',rule:'Three orders, each made from its own ingredient. No order makes or uses another’s tiles.',
      hint:'Choose a chain. Each order needs one chain made only of its ingredient.',
      seed:2,moves:7,spawnValues,goal:{type:'orders',orders:[{make:32,from:8},{make:256,from:64},{make:512,from:128}]},
      grid:[[32,128,32,4,64],[128,128,64,128,64],[64,128,128,4,128],[128,64,64,8,64],[8,2,4,16,16],[4,8,64,32,8]]},
    {id:'see-it-coming',kind:'forecast-relay',name:'See It Coming',focus:'Make 128, then 256 using it, with the refills shown',
      ruleTitle:'Make 128, then 256 using it.',rule:'First make a 128; that tile gets a ●. Then make a 256 with a chain that includes the ● tile. The next two tiles that drop into each column show above it.',
      hint:'Choose a chain. Watch what drops into each column.',
      seed:20,moves:6,spawnValues,forecast:true,goal:{type:'relay',stages:[128,256]},
      grid:[[8,8,8,16,4],[8,4,8,32,2],[2,16,4,32,4],[2,8,2,4,32],[16,2,8,2,2],[8,2,2,4,4]]},
    {id:'the-drought',kind:'boss-no-refill',name:'The Drought',focus:'Boss: nothing refills. Make one 512',
      ruleTitle:'Boss: make one 512. Nothing refills.',rule:'This is a boss board: nothing refills, so every tile you use is gone for good. Make one tile of 512.',
      hint:'Choose a chain. Nothing will refill.',
      seed:22,moves:8,spawnValues,refill:false,boss:{title:'Boss: The Drought',text:'Nothing refills on this board.'},goal:{type:'exact',make:512},
      grid:[[128,8,64,8,64],[32,4,8,4,8],[16,8,64,128,16],[128,32,8,32,32],[128,2,8,2,64],[8,32,32,64,16]]},
    {id:'through-the-gate',kind:'rooms-gate',name:'Through the Gate',focus:'Open the wall with a big enough chain, then link both ★',
      ruleTitle:'Open the gate, then connect the rooms.',rule:'A wall splits the board into two rooms. The gate opens when a chain of 64 or more ends beside it. Then one chain must pass through both ★ cells. The next two tiles that drop into each column show above it.',
      hint:'Choose a chain. Open the gate first.',
      seed:3,moves:7,spawnValues,forecast:true,stone:[[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],gate:{at:[3,4],sum:64},goal:{type:'connect',marks:[[0,4],[6,5]]},
      grid:[[8,16,64,0,4,32,32],[16,8,4,0,16,8,16],[16,4,8,0,16,4,4],[8,16,16,0,8,4,64],[4,2,4,0,16,64,16],[2,4,32,0,4,4,64]]},
    {id:'rust',kind:'rust-scrape',name:'Rust',focus:'Rust spreads every move; only a big chain scrapes it',
      ruleTitle:'Make one 512 before the rust takes it.',rule:'Rusted tiles can’t be used. After every move, rust spreads to one tile beside it. A chain of 64 or more that ends beside rust scrapes it off.',
      hint:'Choose a chain. Rust spreads after every move.',
      seed:30,moves:9,spawnValues,rust:{cells:[[0,4],[1,3]],every:1,scrape:64},goal:{type:'exact',make:512},
      grid:[[16,4,32,16,8],[128,16,8,8,128],[64,16,8,16,16],[4,8,8,16,8],[64,32,128,32,32],[16,32,2,32,64]]}
  ];
});
