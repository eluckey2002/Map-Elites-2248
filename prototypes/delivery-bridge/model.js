/* Throwaway Delivery contrast. Shared chain, gravity and parcel rules are unchanged. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../archetype-trio/model'));
  else root.Archetypes=factory(root.Archetypes);
})(typeof globalThis==='object'?globalThis:this,function(rules){
  return rules.withLevels({delivery:{
    name:'Delivery · Landing',subtitle:'One parcel. Choose where the value stays.',
    seed:728,moves:8,exit:2,spawnValues:[2,4,8,16,32,64,128],
    rule:'Deliver the parcel through the bottom of its column. The last tile becomes the sum, then gravity acts. Refills range from 2 to 128.',
    question:'Did choosing where the merged tile stayed change your plan? If a route failed, could you see what to change?',
    grid:[
      [4,32,8,64,2],
      [64,8,'cargo',4,32],
      [128,16,16,32,8],
      [64,4,16,16,128],
      [4,2,2,4,4],
      [128,8,64,128,8],
    ],
  }});
});
