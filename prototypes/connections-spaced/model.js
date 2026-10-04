(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports=factory(require('../connections/model'));
  else root.Connections=factory(root.Connections);
})(typeof globalThis === 'object' ? globalThis : this, function (game) {
  return game.withLayout({
    goals:[
      {id:'A',kind:'tiles',label:'16 ↔ 16',ends:[[0,2],[4,4]]},
      {id:'B',kind:'tiles',label:'16 → 64',ends:[[0,4],[4,1]]},
      {id:'C',kind:'cells',label:'C1 ↔ C2',ends:[[0,5],[4,5]]},
    ],
    level:{name:'Connections · Across the Board',seed:624,moves:10,target:Number.MAX_SAFE_INTEGER,
      grid:[
        [4,2,4,2,4],
        [8,4,2,4,64],
        [16,16,4,64,8],
        [2,4,8,16,8],
        [16,16,32,16,16],
        [2,4,8,16,32],
      ],
    },
  });
});
