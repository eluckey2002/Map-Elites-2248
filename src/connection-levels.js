(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ConnectionLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  return [
    {id:'crosscurrent',name:'Crosscurrent',focus:'Arrange the connection',refillSeed:2353,moves:9,
      grid:[[16,64,32,4,8],[32,8,2,64,8],[8,128,16,2,8],[8,128,16,8,64],[128,128,2,4,4],[8,2,8,4,32]],
      objectives:[{ends:[[0,5],[2,2]],target:48},{ends:[[3,2],[0,1]],target:20},{ends:[[3,4],[4,1]],target:40}]},
    {id:'keep-a-line',name:'Keep a Line',focus:'Preserve useful material',refillSeed:2581,moves:9,
      grid:[[2,32,8,8,16],[16,128,64,128,8],[8,4,16,64,128],[8,16,32,4,2],[32,8,16,4,4],[16,64,64,16,4]],
      objectives:[{ends:[[2,1],[0,4]],target:80},{ends:[[3,5],[1,2]],target:128},{ends:[[0,1],[1,4]],target:576}]},
    {id:'borrow-a-space',name:'Borrow a Space',focus:'Balance growth and recovery',refillSeed:2799,moves:10,
      grid:[[1024,512,512,8,16],[128,4,64,2,4],[16,128,8,16,4],[4,32,128,8,32],[8,128,16,32,128],[2,128,32,8,2]],
      objectives:[{ends:[[3,1],[3,4]],target:96},{ends:[[1,1],[0,4]],target:20},{ends:[[3,1],[2,4]],target:48}]}
  ];
});
