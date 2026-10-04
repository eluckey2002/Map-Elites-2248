const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const game = require('./model');

// Execute the actual UI script against a small DOM stand-in, not a copied renderer.
// Layout and native pointer behavior still require a browser smoke check.
async function openApp(level, rules = game, page = path.join(__dirname,'index.html')) {
  const html = fs.readFileSync(page, 'utf8');
  function element() {
    return {
      textContent:'', value:'', dataset:{}, style:{}, children:[], listeners:{},
      classList:{add(){}, remove(){}, toggle(){}},
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute(){}, addEventListener(type, fn) { this.listeners[type] = fn; },
      closest() { return this; }, focus(){},
    };
  }
  const nodes = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id]) => [id,element()]));
  const tabs = [...html.matchAll(/data-level="([^"]+)"/g)].map(([,id]) => ({...element(),dataset:{level:id}}));
  const document = {
    body:element(), getElementById:id => nodes[id], querySelectorAll:() => tabs,
    createElement:element, createElementNS:element, createTextNode:text => ({textContent:String(text)}),
  };
  await vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), {
    window:{Archetypes:rules, addEventListener(){}}, document,
    fetch:async () => ({ok:true, json:async () => ({identity:'ui-test'})}),
    history:{replaceState(){}}, location:{search:`?level=${level}`},
    crypto:{randomUUID:() => 'ui-test-session'}, URLSearchParams,
  });
  return {
    nodes,
    select(x,y) {
      const tile = nodes.board.children.find(node => node.dataset?.x === x && node.dataset?.y === y);
      assert.ok(tile, `Rendered tile ${x},${y} exists`);
      nodes.board.listeners.pointerdown({target:tile, preventDefault(){}});
    },
    navigate(id) { tabs.find(tab => tab.dataset.level === id).onclick(); },
  };
}

test('Pair Drop uses the shared live-sum UI and defaults to its only Delivery board', async () => {
  const variant = require('../delivery-pair-drop/model');
  const app = await openApp('',variant,path.join(__dirname,'../delivery-pair-drop/index.html'));
  const {nodes} = app;
  assert.equal(nodes.name.textContent,'Delivery · Pair Drop');
  app.select(0,2); assert.equal(nodes['chain-sum'].textContent,'16');
  app.select(0,3); assert.equal(nodes['chain-sum'].textContent,'32');
  app.select(1,3); assert.equal(nodes['chain-sum'].textContent,'64');
  nodes.preview.onclick(); assert.equal(nodes['chain-sum'].textContent,'64');
  nodes.preview.onclick();
  nodes.merge.onclick(); assert.equal(nodes['chain-sum'].textContent,'0');
  nodes.undo.onclick();
  app.select(0,2); assert.equal(nodes['chain-sum'].textContent,'16');
  nodes.restart.onclick(); assert.equal(nodes['chain-sum'].textContent,'0');
});

for (const level of ['gates','delivery','feeders']) {
  test(`${level}: chain sum is visible from the first tile and follows selection state`, async () => {
    const app = await openApp(level), {nodes} = app;
    assert.ok(nodes['chain-sum'], 'The actual page must contain a visible chain sum output');
    const sum = () => String(nodes['chain-sum'].textContent);
    const chain = level === 'delivery' ? [[2,3],[2,2],[1,2]] :
      level === 'feeders' ? [[1,0],[1,1],[2,1]] : [[0,0],[1,0],[2,0]];
    const value = level === 'delivery' ? 4 : 2;
    assert.equal(sum(),'0');
    app.select(...chain[0]); assert.equal(sum(),String(value));
    assert.equal(nodes.merge.disabled,true, 'Showing a sum must not enable a short chain');
    app.select(...chain[1]); assert.equal(sum(),String(value*2));
    app.select(...chain[2]); assert.equal(sum(),String(level === 'delivery' ? 12 : 8));
    assert.equal(nodes.merge.disabled,false);
    const beforePreview = sum();
    nodes.preview.onclick(); assert.equal(sum(),beforePreview, 'Preview uses selected original tiles');
    nodes.preview.onclick();
    app.select(...chain[1]); assert.equal(sum(),String(value*2), 'Backtracking removes the suffix');
    nodes.clear.onclick(); assert.equal(sum(),'0');
    chain.forEach(position => app.select(...position));
    nodes.merge.onclick(); assert.equal(sum(),'0');
    nodes.undo.onclick(); assert.equal(sum(),'0');
    app.select(...chain[0]);
    nodes.restart.onclick(); assert.equal(sum(),'0');
    app.select(...chain[0]);
    app.navigate(level === 'gates' ? 'delivery' : 'gates'); assert.equal(sum(),'0');
  });
}
