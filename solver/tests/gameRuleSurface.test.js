const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gameRuleSurface } = require('../game-rule-surface');

/**
 * DECISION-0013 lets src/game.js change for browser-only fixes while frozen
 * results stay bound to its game rules. These checks pin what counts as a rule.
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
  assert.equal(gameRuleSurface(edited('this.mergeTimer = setTimeout(() => {\n            this.mergeTimer = null;', 'setTimeout(() => {')), surface);
  assert.equal(gameRuleSurface(edited("if (!this.hasValidMoves()) this.showGameOver('No valid moves!');", '')), surface);
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
    ['    isAdjacent(tile1, tile2) {', '    isAdjacent() { return true; }\n    isAdjacent(tile1, tile2) {'],
  ]) {
    assert.notEqual(gameRuleSurface(edited(from, to)), surface, `not detected: ${to}`);
  }
});

test('reformatting a declaration signature is not a rule change', () => {
  assert.equal(gameRuleSurface(edited('return newTile.value === lastTile.value || newTile.value', 'return newTile.value === lastTile.value ||\n            newTile.value')), surface);
  assert.equal(gameRuleSurface(edited('    checkWinLose() {', '  checkWinLose ( )\n  {')), surface);
  assert.equal(gameRuleSurface(edited('function createInitialGrid(levelData, rng) {', 'function  createInitialGrid(levelData, rng)\n{')), surface);
});

test('a rule declaration that disappears is refused, not skipped', () => {
  assert.throws(() => gameRuleSurface(edited('    hasValidMoves() {', '    hasAnyMoves() {')), /hasValidMoves not found/);
});

test('the gate refuses a live game.js whose rules moved since admission', () => {
  const { gameRuleProblems } = require('../../tools/verify-experiments.js');
  const admission = 'd9b5475fd5faaadc7ca6d6b296030592e31d6294';
  assert.deepEqual(gameRuleProblems('RESULT-0082', admission, Buffer.from(source)), []);
  const changed = Buffer.from(edited('if (this.moves >= this.maxMoves) {', 'if (this.moves > this.maxMoves) {'));
  assert.match(gameRuleProblems('RESULT-0082', admission, changed).join('\n'), /changed a game rule since admission commit d9b5475f/);
});
