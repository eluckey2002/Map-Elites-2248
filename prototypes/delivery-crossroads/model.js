/* Throwaway Delivery layout: compare two placements, not new rules. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../archetype-trio/model'));
  else root.Archetypes = factory(root.Archetypes);
})(typeof globalThis === 'object' ? globalThis : this, function (rules) {
  return rules.withLevels({delivery:{
    name:'Delivery · Crossroads', subtitle:'The same value can lead somewhere different',
    seed:520, moves:8, exit:2,
    rule:'Deliver the parcel through the bottom of its column. Your last selected tile becomes the sum; choose what should stay and what should fall.',
    question:'Did you weigh different places to leave a tile? Did the next steps need planning, or did another easy sweep appear?',
    grid:[
      [2,4,4,2,4],
      [4,8,'cargo',4,2],
      [8,8,8,8,4],
      [16,32,16,4,8],
      [16,16,32,32,4],
      [64,32,128,256,8],
    ],
  }});
});
