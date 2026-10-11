const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gameRuleSurface } = require('../game-rule-surface');

/**
 * DECISION-0013 lets src/game.js change for browser-only fixes while frozen
 * results stay bound to its game rules. The rule surface is the whole file less
 * a named list of drawing, layout and input declarations, so anything new is
 * bound by default. These checks pin both sides of that line.
 */

const ROOT = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(ROOT, 'src/game.js'), 'utf8');
const surface = gameRuleSurface(source);

function edited(from, to) {
  assert.ok(source.includes(from), `fixture text missing: ${from}`);
  return source.replace(from, to);
}

test('comments, whitespace and browser-only code are not game rules', () => {
  assert.equal(gameRuleSurface(edited('// Check lose (out of moves)', '// out of moves')), surface);
  assert.equal(gameRuleSurface(edited('intro: "Connect matching numbers!"', 'intro: "Match two equal tiles!"')), surface);
  assert.equal(gameRuleSurface(edited("const textColor = tile.value >= 8 ? '#fff' : '#776e65';", "const textColor = '#fff';")), surface);
  assert.equal(gameRuleSurface(edited("2: '#EEE4DA',", "2: '#FFFFFF',")), surface);
  assert.equal(gameRuleSurface(edited('function formatTileValue(value) {\n    return String(value);\n}', 'function formatTileValue(value) {\n    return `${value}`;\n}')), surface);
  assert.equal(gameRuleSurface(edited('this.mergeTimer = setTimeout(() => {\n            this.mergeTimer = null;', 'setTimeout(() => {')), surface);
  // Calling initializeLevel directly, as main did before beginLevel existed, is the same rule.
  const direct = edited('this.beginLevel(levelData, makeSeededRng(seed), capture);', 'this.initializeLevel(levelData, makeSeededRng(seed), capture);')
    .replace('this.beginLevel(session.levelData, makeSeededRng(session.seed), capture);', 'this.initializeLevel(session.levelData, makeSeededRng(session.seed), capture);');
  assert.equal(gameRuleSurface(direct), surface);
});

test('a changed win/lose check, chain rule, level, spawn weight or outcome string is a rule change', () => {
  for (const [from, to] of [
    ['if (this.moves >= this.maxMoves) {', 'if (this.moves > this.maxMoves) {'],
    ['if (len >= 9) return 5;', 'if (len >= 9) return 6;'],
    ['{ level: 1, target: 520,', '{ level: 1, target: 521,'],
    ['if (rand < 0.5) value = 2;', 'if (rand < 0.6) value = 2;'],
    ['this.tickBlockers();\n            this.checkBombs();', 'this.checkBombs();\n            this.tickBlockers();'],
    ['this.minChain = levelData.minChain;', 'this.minChain = 2;'],
    ['this.targetScore = levelData.target;', 'this.targetScore = levelData.target - 1;'],
    ['state.randomState !== null', 'state.randomState === undefined'],
    ['return newTile.value === lastTile.value || newTile.value === lastTile.value * 2;', 'return\n            newTile.value === lastTile.value || newTile.value === lastTile.value * 2;'],
    ['if (!this.isAdjacent(lastTile, tile)) return;', ''],
    ['if (this.isValidChain()) {', 'if (true) {'],
    ["this.finishAuthoring('win', 'target reached');", "this.finishAuthoring('w/*ignored*/in', 'target reached');"],
    ["this.finishAuthoring('win', 'target reached');", "this.finishAuthoring('w//in', 'target reached');"],
    ['this.maxHistory = 10;', 'this.maxHistory = 0;'],
    ['this.beginLevel(levelData, makeSeededRng(seed), capture);', 'this.beginLevel(levelData, Math.random, capture);'],
    ['this.beginLevel(session.levelData, makeSeededRng(session.seed), capture);', 'this.beginLevel(session.levelData, Math.random, capture);'],
    ['this.initializeLevel(levelData, rng, authoringCapture);', 'this.initializeLevel(levelData, Math.random, authoringCapture);'],
    ["if (!this.hasValidMoves()) this.showGameOver('No valid moves!');", "if (!this.hasValidMoves()) { this.gameOver = true; }"],
    ['this.maxHistory = 10;', 'this.maxHistory = 10;\n        this.checkWinLose = () => {};'],
    ['    checkWinLose() {', '    *checkWinLose() {'],
    ['    checkWinLose() {', '    async checkWinLose() {'],
    ['    checkWinLose() {', '    static checkWinLose() {'],
    ['    isAdjacent(tile1, tile2) {', '    isAdjacent() { return true; }\n    isAdjacent(tile1, tile2) {'],
    ['class Game {', 'class Game {\n    checkWinLose = () => {};'],
    ['function createInitialGrid(levelData, rng) {', 'async function createInitialGrid(levelData, rng) {'],
    ['function makeSeededRng(seed) {', 'async function makeSeededRng(seed) {'],
    ['    recordChain(tiles, points) {', '    recordChain(tiles, points) {\n        points = 0;'],
    ['score: this.score, movesUsed: this.moves', 'score: 0, movesUsed: this.moves'],
    ['class Game {', 'class Game {\n    newRule() { return 1; }'],
  ]) {
    assert.notEqual(gameRuleSurface(edited(from, to)), surface, `not detected: ${to}`);
  }
});

test('reformatting a declaration signature is not a rule change', () => {
  assert.equal(gameRuleSurface(edited('return newTile.value === lastTile.value || newTile.value', 'return newTile.value === lastTile.value ||\n            newTile.value')), surface);
  assert.equal(gameRuleSurface(edited('    checkWinLose() {', '  checkWinLose ( )\n  {')), surface);
  assert.equal(gameRuleSurface(edited('function createInitialGrid(levelData, rng) {', 'function  createInitialGrid(levelData, rng)\n{')), surface);
});

test('a bound method replaced from outside the class is a rule change', () => {
  for (const patch of [
    'Game.prototype.checkWinLose = function () {};',
    "Game.prototype['hasValidMoves'] = () => true;",
    'Game.prototype.beginLevel = function () {};',
  ]) {
    assert.notEqual(gameRuleSurface(`${source}\n${patch}\n`), surface, `not detected: ${patch}`);
  }
});

test('removing or renaming rule code is a rule change', () => {
  assert.notEqual(gameRuleSurface(edited('this.maxHistory = 10;', '')), surface);
  assert.notEqual(gameRuleSurface(edited('    hasValidMoves() {', '    hasAnyMoves() {')), surface);
});

test('every browser declaration in game.js today is free to change', () => {
  // Appending a harmless statement to each body leaves the surface alone only
  // while that body passes the browser-only check.
  const { BROWSER_METHODS } = require('../game-rule-surface');
  for (const name of BROWSER_METHODS) {
    const head = source.match(new RegExp(`\\n    ${name}\\([^)]*\\) \\{\\n`));
    assert.ok(head, `missing ${name}`);
    assert.equal(gameRuleSurface(source.replace(head[0], `${head[0]}        const unusedForTest = 1;\n`)), surface, name);
  }
  assert.equal(gameRuleSurface(edited('    return String(value);', '    const unusedForTest = 1;\n    return String(value);')), surface);
});

test('a browser declaration that writes game state or calls rule code is bound like rule code', () => {
  const into = (method, line) => {
    const head = source.match(new RegExp(`\\n    ${method}\\([^)]*\\) \\{\\n`))[0];
    return source.replace(head, `${head}        ${line}\n`);
  };
  for (const [method, line] of [
    ['setupEventListeners', 'this.checkWinLose = () => {};'],
    ['setupEventListeners', 'this.score += 100;'],
    ['setupEventListeners', 'this.grid[0][0] = null;'],
    ['setupEventListeners', '[this.moves] = [0];'],
    ['setupEventListeners', 'delete this.chain;'],
    ['setupEventListeners', '++this.moves;'],
    ['setupEventListeners', 'this.history.length = 0;'],
    ['updateUI', 'this.chain.push(this.grid[0][0]);'],
    ['updateUI', 'this.grid[0][0].tickBlocker();'],
    ['updateUI', 'this.executeChain();'],
    ['updateUI', 'this.undo();'],
    ['render', 'this.handleTileClick(0, 0);'],
    ['drawTile', 'tile.value = 2048;'],
    ['drawTile', 'tile.setBlocker(null);'],
    ['drawTile', 'tile.tickBlocker?.();'],
    ['drawTile', 'tile.tickBlocker.call(tile);'],
    ['drawTile', 'tile.tickBlocker`x`;'],
    ['updateUI', 'this.undo?.();'],
    ['updateUI', 'this.undo.call(this);'],
    ['updateUI', 'setTimeout(this.executeChain.bind(this));'],
    ['updateUI', 'setTimeout(createInitialGrid);'],
    ['updateUI', 'this.someHelper();'],
    ['setupEventListeners', "document['defaultView']['game']['checkWinLose'] = () => {};"],
    ['setupEventListeners', "document.body[key] = null;"],
    ['updateUI', "const name = 'executeChain';"],
    ['updateUI', 'const self = this; self.score = 0;'],
    ['updateUI', 'Object.assign(this, { score: 0 });'],
    ['updateUI', 'Game.prototype.checkWinLose = () => {};'],
    ['updateUI', 'window.game.score = 0;'],
    ['updateUI', 'document.defaultView.game.score = 0;'],
    ['updateUI', 'this[\'score\'] = 0;'],
    ['updateUI', 'score = 0;'],
    ['updateUI', 'const document = this.grid; document.x = 0;'],
    ['updateUI', 'let el = document.body; el = this.grid[0]; el[0] = null;'],
    ['updateUI', 'createInitialGrid(LEVELS[0], Math.random);'],
  ]) {
    assert.ok(gameRuleSurface(into(method, line)) !== surface, `${method}: ${line}`);
  }
  assert.notEqual(gameRuleSurface(edited("2: '#EEE4DA',", "get 2() { return '#EEE4DA'; },")), surface);
  assert.notEqual(gameRuleSurface(edited('    return String(value);', '    value.x = 1;\n    return String(value);')), surface);
});

test('only the named browser declarations are free to change', () => {
  const { BROWSER_TOP_LEVEL, BROWSER_METHODS } = require('../game-rule-surface');
  assert.deepEqual(BROWSER_TOP_LEVEL, ['TILE_COLORS', 'formatTileValue']);
  assert.deepEqual(BROWSER_METHODS, [
    'setupCanvas', 'setupEventListeners', 'getGridPos', 'updateUI', 'updateChainIndicator', 'showMultiplierPopup',
    'showLevelComplete', 'showGameOver', 'showLevelSelect', 'showModal', 'hideModal', 'render', 'drawTile',
    'roundRect', 'gameLoop', 'updateAuthoringStatus',
  ]);
});

test('the gate refuses a live game.js whose rules moved since admission', () => {
  const { gameRuleProblems } = require('../../tools/verify-experiments.js');
  const admission = 'd9b5475fd5faaadc7ca6d6b296030592e31d6294';
  assert.deepEqual(gameRuleProblems('RESULT-0082', admission, Buffer.from(source)), []);
  const changed = Buffer.from(edited('if (this.moves >= this.maxMoves) {', 'if (this.moves > this.maxMoves) {'));
  assert.match(gameRuleProblems('RESULT-0082', admission, changed).join('\n'), /changed a game rule since admission commit d9b5475f/);
});
