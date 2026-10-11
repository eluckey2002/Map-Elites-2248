(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.DeliveryLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  /* Boards are copied byte-for-value from the owner-played prototypes (PDL-011, PDL-019, PDL-021). */
  return [
    {id:'pair-drop',name:'Pair Drop',focus:'Make room for the right partner',prototype:'prototypes/delivery-pair-drop',seed:416,moves:8,exit:2,
      grid:[[2,4,8,4,2],[64,8,'cargo',4,4],[16,32,4,8,2],[16,32,4,8,4],[8,4,128,128,2],[8,8,8,16,16]]},
    {id:'staggered',name:'Staggered',focus:'Decide what should fall first',prototype:'prototypes/delivery-sequence',seed:624,moves:8,exit:2,spawnValues:[2,4,8,16,32,64,128],
      grid:[[2,32,4,16,64],[32,64,'cargo',8,2],[4,16,8,128,32],[2,16,128,64,4],[32,8,8,16,2],[128,4,4,8,32]]},
    {id:'landing',name:'Landing',focus:'Choose where the value stays',prototype:'prototypes/delivery-bridge',seed:728,moves:8,exit:2,spawnValues:[2,4,8,16,32,64,128],
      grid:[[4,32,8,64,2],[64,8,'cargo',4,32],[128,16,16,32,8],[64,4,16,16,128],[4,2,2,4,4],[128,8,64,128,8]]}
  ];
});
