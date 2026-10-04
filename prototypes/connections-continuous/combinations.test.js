const {test}=require('node:test');
const assert=require('node:assert/strict');

test('352 includes the six- and seven-tile arithmetic recipes',()=>{
  const {recipes}=require('./combinations');
  const result=recipes(352);
  assert.ok(result.some(r=>JSON.stringify(r)==='[32,32,32,64,64,128]'));
  assert.ok(result.some(r=>JSON.stringify(r)==='[32,32,32,64,64,64,64]'));
});

test('examples obey actual value rules and exact sums across supported target types',()=>{
  const {recipes}=require('./combinations');
  for(const target of [6,8,16,24,64,128,192,352,640,1024,4096,65536]){
    const result=recipes(target);assert.ok(result.length>0,`Examples exist for ${target}`);
    assert.ok(result.length<=6);
    for(const chain of result){
      assert.equal(chain.reduce((sum,n)=>sum+n,0),target);
      assert.ok(chain.length>=3&&chain.length<=30);assert.equal(chain[0],chain[1]);
      assert.ok(chain.every(n=>n>=2&&Number.isInteger(Math.log2(n))));
      for(let i=2;i<chain.length;i++)assert.ok(chain[i]===chain[i-1]||chain[i]===2*chain[i-1]);
    }
    assert.equal(new Set(result.map(r=>r.length)).size,result.length);
  }
});

test('recipe generation honors tile budget and does not fabricate examples for unsupported sums',()=>{
  const {recipes}=require('./combinations');
  assert.deepEqual(recipes(352,5),[]);
  assert.deepEqual(recipes(352,6),[[32,32,32,64,64,128]]);
  for(const target of [0,1,2,4,7,11])assert.deepEqual(recipes(target),[]);
});
