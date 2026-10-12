const test=require('node:test');const assert=require('node:assert');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const rules=require('./model'),search=require('./search');
const S=require('./shared-search');

const isThree=v=>{let n=v;while(n%2===0)n/=2;return n===3&&v>3;};
const F=(grid,seed=7,orders=2,moves=16)=>S.makeLevel({grid,seed,orders},moves);

// Hand-made board: two rows of four greens, a setup chain of 4+4+4 on the top row that fills nothing.
const HAND=[[4,4,4,8,32,2],
            [3,3,3,3,16,2],
            [3,3,3,3,8,32],
            [32,8,32,8,32,8],
            [8,32,8,32,8,32],
            [2,16,2,16,2,16]];
const FILL_A=[[0,1],[1,1],[2,1],[3,1]],FILL_B=[[0,2],[1,2],[2,2],[3,2]],SETUP=[[0,0],[1,0],[2,0]];

// A real keeper found by the instrument (seed 1 smoke run); the planted-keeper tests re-run the whole keeper test on it.
const KEEPER=JSON.parse(fs.readFileSync(path.join(__dirname,'shared-search.keeper.json'),'utf8'));
let keeperRun=null;const keeperEval=()=>keeperRun||(keeperRun=S.evaluate(S.genomeOf(KEEPER.board)));

test('descriptors on a hand-made board: spare greens, orders, setup moves, cell',()=>{
  const level=F(HAND);
  assert.equal(S.greensOn(level),8);assert.equal(S.spareGreens(level),0);
  assert.equal(S.spareGreens(F(HAND,7,3)),-4,'three orders on eight greens is unwinnable');
  assert.equal(S.binX(-4),null);assert.equal(S.binX(0),0);assert.equal(S.binX(1),1);assert.equal(S.binX(2),2);assert.equal(S.binX(9),2);
  const spare=HAND.map(r=>r.slice());spare[3][0]=3;spare[3][1]=3;
  assert.equal(S.spareGreens(F(spare)),2);
  assert.equal(S.binZ(0),0);assert.equal(S.binZ(1),1);assert.equal(S.binZ(2),2);assert.equal(S.binZ(7),2);assert.equal(S.binZ(Infinity),null);
  assert.equal(S.setupMoves(level,[FILL_A,FILL_B]),0);
  assert.equal(S.setupMoves(level,[SETUP,FILL_A,FILL_B]),1,'one move that fills nothing first');
  assert.equal(S.setupMoves(level,[SETUP]),Infinity);
  assert.equal(S.cellOf(level,0),'X0|Y2|Z0');assert.equal(S.cellOf(F(spare),1),'X2+|Y2|Z1');assert.equal(S.cellOf(F(HAND,7,3),0),null);
  assert.equal(S.ALL_CELLS.length,18);
  // the lines really win through model.js
  assert.equal(rules.replay(level,[FILL_A,FILL_B].map(chain=>({type:'move',chain}))).outcome,'won');
});

test('budget = max(best + 6, 3 x orders + 4); the family is forecast, 6x6, plain 12-from-3 orders',()=>{
  assert.equal(S.budgetFor(4,2),10);assert.equal(S.budgetFor(5,2),11);assert.equal(S.budgetFor(4,3),13);assert.equal(S.budgetFor(8,3),14);
  const level=F(HAND);
  assert.deepEqual(S.familyProblems(level),[]);
  assert.equal(level.forecast,true);assert.equal(level.grid.length,6);assert.equal(level.grid[0].length,6);
  assert.deepEqual(level.goal.orders,[{make:12,from:3},{make:12,from:3}]);
  assert.ok(S.familyProblems({...level,forecast:undefined}).length,'forecast is required');
  assert.ok(S.familyProblems({...level,goal:{...level.goal,anyOrder:true,parts:true}}).length,'anyOrder/parts are not the family');
  assert.ok(S.familyProblems({...level,goal:{type:'orders',orders:[{make:24,from:3},{make:12,from:3}]}}).length);
  const odd=HAND.map(r=>r.slice());odd[5][5]=6;assert.ok(S.familyProblems(F(odd)).length,'6 is not a power of two 2..64 or a green');
  assert.ok(S.familyProblems({...level,grid:level.grid.slice(0,5)}).length);
});

test('no refill is ever a 3 and refills stay on the spawn list, so flushing the board cannot rebuild greens',()=>{
  const level=F(KEEPER.board.grid,KEEPER.board.seed,KEEPER.board.goal.orders.length,1e6);
  assert.ok(level.forecast);
  let state=rules.create(level),seen=0,rng=5;
  for(let n=0;n<600&&seen<400;n++){
    const all=state.outcome==='playing'?rules.chains(state,3):[];
    if(!all.length){state=rules.create(level);continue;}
    rng=(rng*1103515245+12345)%2147483648;
    state=rules.move(level,state,all[rng%all.length]);
    for(const r of state.last.refill){seen++;assert.ok(S.SPAWN.includes(r.value));assert.notEqual(r.value,3);assert.ok(!isThree(r.value));}
  }
  assert.ok(seen>=400,'saw '+seen+' refills');
  // no chain can make a 3 either: every sum of three or more tiles of at least 2 is at least 6
  assert.ok(Math.min(...S.SPAWN)*3>3);
  // too few greens cannot be won by flushing: seven greens for two orders has no win in the search
  const poor=HAND.map(r=>r.slice());poor[2][3]=8;
  assert.equal(S.greensOn(F(poor)),7);
  assert.equal(search.solve(F(poor),{beam:100,maxLength:6,budget:10}),null);
});

test('boards that must fail: too few greens, immediate wins, no spare chains',()=>{
  const poor=HAND.map(r=>r.slice());poor[2][3]=8;
  assert.match(S.evaluate({grid:poor,seed:7,orders:2}).reason,/too few greens/);
  // hand board: both orders fill on move 1 and 2, so it is won in 2 moves
  const r=S.evaluate({grid:HAND,seed:7,orders:2});
  assert.equal(r.ok,false,'a board won in 2 moves is not a keeper: '+r.reason);
});

test('planted keeper: the full keeper test passes and every gate is visible in the entry',()=>{
  const r=keeperEval();
  assert.equal(r.ok,true,r.reason);
  const e=r.entry,level=e.board;
  assert.equal(e.cell,KEEPER.cell);assert.equal(e.best,KEEPER.best);
  assert.equal(level.moves,S.budgetFor(e.best,level.goal.orders.length));
  assert.ok(e.best>=4);assert.ok(e.openingChains>=60);assert.ok(e.firstMoves>=3);assert.equal(e.fitness,e.firstMoves);
  assert.equal(e.ordinary.outcome,'won');assert.ok(e.ordinary.moves<=level.moves);
  assert.equal(search.exhaustive(level,3).win,null);
  assert.equal(rules.replay(level,e.witness.map(chain=>({type:'move',chain}))).outcome,'won');
  const d=e.difficulty;
  assert.equal(d.trials,20);assert.equal(d.epsilon,0.2);assert.ok(d.winRate>=0&&d.winRate<=1);
  assert.equal(d.bin,d.winRate>=0.8?'easy':d.winRate>=0.4?'medium':'hard');
  assert.deepEqual(S.difficulty(level),d,'difficulty is deterministic');
  assert.ok(d.winRate===0||d.avgWinMoves>=e.best);
  assert.ok(e.split&&typeof e.split.fills==='number'&&Array.isArray(e.split.afterFill));
  assert.equal(typeof e.bites.harvestObviousGreedyLose,'boolean','bite is reported');
  assert.deepEqual(S.verifyEntry(e.cell,e,{}),[]);
  // a clear loss for a lower-fitness copy: better() prefers more first moves, then the smaller best line, then the hash
  assert.ok(S.better({...e,fitness:5},{...e,fitness:4}));
  assert.ok(S.better({...e,fitness:4,best:4},{...e,fitness:4,best:5}));
  assert.ok(S.better({...e,hash:'a'},{...e,hash:'b'}));
});

test('the ordinary player prefers moves toward an unfilled order, sees one move ahead, and wins the planted keeper',()=>{
  const level=F(HAND);
  const p=S.ordinaryPlayer(level);
  assert.equal(p.outcome,'won');assert.equal(p.moves,2,'takes the two fills');
  const keeper=KEEPER.board;
  assert.equal(S.ordinaryPlayer(keeper).outcome,'won');
  // it never wastes greens when a fill is on the table: the score of a fill beats any non-fill
  const state=rules.create(level);
  const start=S.greensOn(level);
  assert.ok(S.playerScore(rules.move(level,state,FILL_A),start)>S.playerScore(rules.move(level,state,SETUP),start));
});

test('winning first chains are counted from replayable lines',()=>{
  const level=KEEPER.board;
  const lines=S.winningFirstMoves(level,S.DEFAULT_CFG.first,[]);
  assert.ok(lines.length>=3);
  const firsts=new Set(lines.map(l=>JSON.stringify(l[0])));
  assert.equal(firsts.size,lines.length);
  for(const l of lines)assert.equal(rules.replay(level,l.map(chain=>({type:'move',chain}))).outcome,'won');
});

test('archive round trip; the verifier accepts it and rejects tampered boards, witnesses, budgets and fitness',()=>{
  const e={...keeperEval().entry,evalIndex:1};
  const cells=new Map([[e.cell,e]]);
  const archive=S.buildArchive({seed:1,evals:1,maxSeconds:Infinity,cfg:S.DEFAULT_CFG,cells,stats:{evaluated:1,rejected:{}},stoppedBy:'evals',seconds:0});
  const file=path.join(os.tmpdir(),'shared-search-test-'+process.pid+'.json');
  S.writeArchive(archive,file);
  const back=S.readArchive(file);fs.unlinkSync(file);
  assert.deepEqual(back,JSON.parse(JSON.stringify(archive)),'round trip');
  assert.ok(back.versions.model&&back.versions.search&&back.versions.sharedSearch&&back.args.seed===1);
  const ok=S.verifyArchive(back);assert.equal(ok.ok,true,JSON.stringify(ok));
  const mutate=fn=>{const c=JSON.parse(JSON.stringify(back));fn(c.cells[e.cell]);return S.verifyArchive(c);};
  // a changed tile: hash and witness no longer hold
  assert.equal(mutate(x=>{x.board.grid[5][5]=x.board.grid[5][5]===2?4:2;}).ok,false,'tampered tile');
  assert.equal(mutate(x=>{const y=x.board.grid.findIndex(r=>r.includes(2)||r.includes(8)||r.includes(4)),xx=x.board.grid[y].findIndex(v=>v!==3);x.board.grid[y][xx]=3;}).ok,false,'tampered greens');
  assert.equal(mutate(x=>{x.witness=x.witness.slice(0,-1);}).ok,false,'truncated witness');
  assert.equal(mutate(x=>{x.board.moves+=1;}).ok,false,'budget changed');
  assert.equal(mutate(x=>{x.fitness+=1;}).ok,false,'fitness changed');
  assert.equal(mutate(x=>{x.difficulty.winRate=0;}).ok,false,'difficulty changed');
  assert.equal(mutate(x=>{x.board.forecast=false;}).ok,false,'forecast switched off');
  assert.equal(mutate(x=>{x.paths.pop();}).ok,false,'fewer paths than the recorded fitness');
  const wrongCell=JSON.parse(JSON.stringify(back));wrongCell.cells['X0|Y2|Z0']=wrongCell.cells[e.cell];delete wrongCell.cells[e.cell];wrongCell.cellCount=1;
  if(e.cell!=='X0|Y2|Z0')assert.equal(S.verifyArchive(wrongCell).ok,false,'entry filed in the wrong cell');
  // the CLI verifier agrees
  const f2=path.join(os.tmpdir(),'shared-search-test-b-'+process.pid+'.json');
  S.writeArchive(back,f2);
  const log=console.log;console.log=()=>{};let code;try{code=S.main(['--verify',f2]);}finally{console.log=log;fs.unlinkSync(f2);}
  assert.equal(code,0);
});

// Cheaper solver settings for the runs below; the keeper gates are the same, only the beams are narrower.
const FAST={...S.DEFAULT_CFG,beams:[{beam:150,maxLength:7},{beam:60,maxLength:6}],collect:{beam:60,maxLength:6,cap:50},first:{tries:12,cap:5,beam:12,maxLength:6}};

test('a fixed seed gives identical output in a tiny run, and a different seed differs in what it tried',()=>{
  const a=S.runSearch({seed:11,evals:8,cfg:FAST}),b=S.runSearch({seed:11,evals:8,cfg:FAST}),c=S.runSearch({seed:12,evals:8,cfg:FAST});
  const strip=x=>JSON.stringify({cells:x.cells,rejected:x.stats.rejected,args:x.args,family:x.family,evaluated:x.stats.evaluated});
  const noMs=x=>JSON.parse(strip(x),(k,v)=>k==='ms'?undefined:v);
  assert.deepEqual(noMs(a),noMs(b));
  assert.notDeepEqual(a.stats.rejected,c.stats.rejected);
});

test('positive control: the first five start boards of the sampler (seed 2, setup-needing) keep cells in at least two X bins and two Z bins',{timeout:150000},()=>{
  // The sampler's own start boards, run through the whole keeper test. (A full MAP-Elites loop needs minutes per cell;
  // the real smoke-run figures are in the report, not asserted here.)
  const rng=S.makeRng(2),cells=[];
  for(let i=0;i<5;i++){
    const g=S.sampleBoard(rng,{orders:2+(i%2),spare:Math.floor(i/2)%4,tight:[0,0.25,0.5][i%3],minBlobs:3+(i%4),noFill:true});
    const r=S.evaluate(g,FAST);
    if(r.ok){cells.push(r.entry.cell);assert.deepEqual(S.verifyEntry(r.entry.cell,r.entry,{cfg:FAST}),[]);}
  }
  const xs=new Set(cells.map(k=>k.split('|')[0])),zs=new Set(cells.map(k=>k.split('|')[2]));
  assert.ok(xs.size>=2,'X bins: '+[...xs]+' from '+cells);
  assert.ok(zs.size>=2,'Z bins: '+[...zs]+' from '+cells);
});
