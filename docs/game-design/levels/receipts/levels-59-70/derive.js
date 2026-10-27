const R=require('path').resolve(__dirname,'../../../../..');
const {deriveCandidate}=require(R+'/solver/level-author.js');
const shapes=require(__dirname+'/shapes.json');const lv=+process.argv[2];const over=process.argv[3]?JSON.parse(process.argv[3]):{};
const s={schemaVersion:1,demandStatus:'provisional-proposal',...shapes.find(x=>x.level===lv),...over};
const {store,receipt}=deriveCandidate(s);
const c=store.candidates[0],h=receipt.holdout.terminalCounts;
console.log(JSON.stringify({level:lv,name:c.name,demand:s.demand,moves:c.moves,target:c.target,median:receipt.fitting.scoreQuantiles.median,win:+(h.win/h.total).toFixed(3),lock:h.noValidMoves,bomb:h.bombExploded,fitLock:receipt.fitting.terminalCounts.noValidMoves,fitBomb:receipt.fitting.terminalCounts.bombExploded}));
require('fs').writeFileSync(__dirname+`/out-${lv}.json`,JSON.stringify({shape:s,store,receipt},null,1));
