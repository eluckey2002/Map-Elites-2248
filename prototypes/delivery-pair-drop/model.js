(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../archetype-trio/model'));
  else root.Archetypes = factory(root.Archetypes);
})(typeof globalThis === 'object' ? globalThis : this, function (rules) {
  return rules.withLevels({delivery:{
    name:'Delivery · Pair Drop', subtitle:'Make room for the right partner',
    seed:416, moves:8, exit:2,
    rule:'Deliver the parcel through the bottom of its column. Build matching values and choose where your chains end; every cleared space changes what falls next.',
    question:'Did you plan where a matching tile would fall? Was the dependency satisfying or just obvious?',
    grid:[
      [2,4,8,4,2],
      [64,8,'cargo',4,4],
      [16,32,4,8,2],
      [16,32,4,8,4],
      [8,4,128,128,2],
      [8,8,8,16,16],
    ],
  }});
});
