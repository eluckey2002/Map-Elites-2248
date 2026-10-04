/* Throwaway Delivery layout. Shared move, gravity and parcel rules are unchanged. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../archetype-trio/model'));
  else root.Archetypes=factory(root.Archetypes);
})(typeof globalThis==='object'?globalThis:this,function(rules){
  return rules.withLevels({delivery:{
    name:'Delivery · Staggered',subtitle:'One parcel. More than one way down.',
    seed:624,moves:8,exit:2,spawnValues:[2,4,8,16,32,64,128],
    rule:'Deliver the parcel through the bottom of its column. The last tile becomes the sum, then gravity acts. Refills now range from 2 to 128.',
    question:'Did deciding what should fall first make a difference, or was the route still obvious? Did you recover from a different first move?',
    grid:[
      [2,32,4,16,64],
      [32,64,'cargo',8,2],
      [4,16,8,128,32],
      [2,16,128,64,4],
      [32,8,8,16,2],
      [128,4,4,8,32],
    ],
  }});
});
