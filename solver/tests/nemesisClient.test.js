'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function client() {
  const elements = new Map();
  function element() {
    return { children: [], listeners: {}, hidden: false, textContent: '', value: 'shipped',
      options: [{value:'shipped'}, {value:'wider-search'}],
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      addEventListener(event, callback) { this.listeners[event] = callback; } };
  }
  const document = {createElement: element, getElementById(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  }};
  const requests = [], ticks = [];
  const context = vm.createContext({ document, URL, URLSearchParams,
    location: {href:'http://localhost/nemesis.html', search:''}, history:{replaceState(){}},
    fetch(url) { return new Promise((resolve, reject) => requests.push({url,resolve,reject})); },
    setInterval(callback) { ticks.push(callback); return ticks.length; }, clearInterval() {} });
  const source = fs.readFileSync(path.join(__dirname,'../../src/nemesis.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(source,context);
  return { elements, requests, ticks, run: code => vm.runInContext(code,context) };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const challenge = (policy='shipped', attempts=1) => ({level:54,seed:3310936729,target:126000,
  policy:{id:policy,label:policy},bot:{outcome:'win',moves:15,score:126464},
  attempts,best:null,status:'open',latest:{outcome:'win',moves:14,score:126464,verdict:'beat'}});
function respond(request, body) { request.resolve({ok:true,json:async()=>body}); }

test('Nemesis ignores out-of-order list success and stale list failure after a policy change', async () => {
  const c = client();
  c.elements.get('policy').value='wider-search';
  c.elements.get('policy').listeners.change();
  respond(c.requests[1],{challenges:[challenge('wider-search')]}); await flush();
  const rendered = c.elements.get('boards').children;
  respond(c.requests[0],{challenges:[]}); await flush();
  assert.equal(c.elements.get('boards').children,rendered);
  c.elements.get('policy').listeners.change();
  c.elements.get('policy').listeners.change();
  respond(c.requests[3],{challenges:[challenge('wider-search')]}); await flush();
  const latest = c.elements.get('boards').children;
  c.requests[2].reject(new Error('stale failure')); await flush();
  assert.equal(c.elements.get('boards').children,latest);
});

test('Nemesis polling pins the opponent and ignores older attempt counts and obsolete play requests', async () => {
  const c = client();
  c.run(`startPlay(${JSON.stringify(challenge('wider-search'))})`);
  c.ticks[0](); c.ticks[0]();
  assert.match(c.requests[1].url,/policy=wider-search/);
  respond(c.requests[2],{challenge:challenge('wider-search',3)}); await flush();
  const text = c.elements.get('result').textContent;
  const older = challenge('wider-search',2); older.latest.verdict='loss';
  respond(c.requests[1],{challenge:older}); await flush();
  assert.equal(c.elements.get('result').textContent,text);
  c.ticks[0]();
  c.elements.get('back').listeners.click();
  respond(c.requests[3],{challenge:challenge('wider-search',4)}); await flush();
  assert.equal(c.elements.get('play').hidden,true);
  assert.equal(c.elements.get('game').src,'about:blank');
  c.run(`startPlay(${JSON.stringify(challenge('shipped'))})`);
  c.ticks[0]();
  respond(c.requests[5],{challenge:challenge('wider-search',5)}); await flush();
  assert.equal(c.elements.get('result').hidden,true);
  assert.match(c.elements.get('goalMeta').textContent,/shipped:/);
});
