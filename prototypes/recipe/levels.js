(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.RecipeLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Screened with search.js: each board has a beam-solver win in (moves - 2), and the largest-sum harvest proxy loses. */
  const spawnValues=[8,16,32];
  return [
    {id:'four-of-a-kind',name:'Four of a Kind',focus:'Build four 128s, then join only them',seed:1,moves:6,spawnValues,
      orders:[{make:512,from:128}],
      grid:[[32,32,64,64,8],[64,32,32,64,8],[64,16,16,8,8],[16,32,16,32,32],[64,8,32,16,128],[16,32,8,16,32]]},
    {id:'leave-the-256',name:'Leave the 256',focus:'The big tiles are in the way',seed:14,moves:5,spawnValues,
      orders:[{make:512,from:128}],
      grid:[[16,32,32,16,16],[32,32,32,16,64],[256,16,16,256,128],[64,64,32,16,8],[128,64,256,128,32],[256,16,32,128,128]]},
    {id:'three-quarters',name:'Three Quarters',focus:'A 384 is three 128s and nothing else',seed:20,moves:6,spawnValues,
      orders:[{make:384,from:128}],
      grid:[[64,32,32,64,32],[64,32,64,256,8],[16,64,16,256,32],[8,64,8,16,256],[128,16,64,16,8],[64,16,8,16,32]]},
    {id:'two-orders',name:'Two Orders',focus:'The 64s are ingredients for both',seed:8,moves:7,spawnValues,
      orders:[{make:512,from:128},{make:256,from:64}],
      grid:[[16,8,16,16,16],[32,16,32,64,16],[16,32,32,64,64],[32,32,8,32,128],[32,32,8,32,16],[128,32,32,64,64]]},
    {id:'the-big-one',name:'The Big One',focus:'A 1024 is four 256s',seed:8,moves:6,spawnValues:[16,32,64],
      orders:[{make:1024,from:256}],
      grid:[[32,16,32,32,32],[64,32,64,128,32],[32,64,64,128,128],[64,64,16,64,256],[64,64,16,64,32],[256,64,64,128,128]]},
    {id:'both-ways',name:'Both Ways',focus:'The 32s fill order A and build the 64s for B',seed:5,moves:6,spawnValues:[8,16],
      orders:[{make:128,from:32},{make:256,from:64}],
      grid:[[16,16,32,16,128],[8,64,8,64,16],[32,64,128,64,64],[32,16,16,16,32],[32,16,8,32,128],[8,64,16,16,16]]},
    {id:'leave-the-128s',name:'Leave the 128s',focus:'The order wants 64s; the 128s are in the way',seed:5,moves:6,spawnValues,
      orders:[{make:256,from:64}],
      grid:[[16,16,128,16,128],[8,128,8,128,16],[128,128,128,128,128],[64,32,32,32,128],[64,32,16,64,128],[8,128,32,32,32]]},
    {id:'three-courses',name:'Three Courses',focus:'Each order is built from the one below it',seed:27,moves:7,spawnValues,
      orders:[{make:128,from:32},{make:256,from:64},{make:512,from:128}],
      grid:[[128,64,64,16,32],[16,8,32,16,32],[32,16,16,128,16],[32,64,16,16,16],[64,16,16,32,8],[32,16,32,32,64]]}
  ];
});
