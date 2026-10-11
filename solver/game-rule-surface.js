'use strict';
// DECISION-0013. src/game.js mixes game rules with input, animation and
// drawing. Frozen results may let the browser code change, but never the rules.
// The rule surface is the source text of every declaration below, with comments
// and whitespace normalized. Two versions of game.js play by the same rules
// only if their rule surfaces are equal; a missing declaration is an error, so
// a rename cannot drop a rule out of the comparison silently.
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const TOP_LEVEL = [
  'BLOCKER_TYPES', 'LEVELS', 'Tile', 'makeSeededRng', 'rngForLevel', 'requirePlayableInteger',
  'playableTileScale', 'validatePlayableLevel', 'createInitialGrid',
];
const GAME_METHODS = [
  'isAdjacent', 'canExtendChain', 'isValidChain', 'calculateChainValue', 'getChainMultiplier',
  'executeChain', 'applyGravity', 'spawnNewTiles', 'tickBlockers', 'checkBombs', 'checkWinLose',
  'hasValidMoves', 'canFormValidChain',
];
// Bookkeeping that lets a level reload cancel a pending merge. It decides
// whether the callback runs on the board it belongs to, not what the callback does.
const BOOKKEEPING = [['this.mergeTimer = setTimeout(() => { this.mergeTimer = null;', 'setTimeout(() => {']];

// Index just past the bracket that closes the one at `open`, skipping strings and comments.
function matchClose(source, open) {
  const pairs = { '{': '}', '[': ']', '(': ')' };
  const stack = [];
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === '\\') i++;
      continue;
    }
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === '}' || c === ']' || c === ')') {
      if (stack.pop() !== c) throw new Error(`unbalanced ${c} at ${i}`);
      if (stack.length === 0) return i + 1;
    }
  }
  throw new Error('unterminated declaration');
}

function declaration(source, pattern, name) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`game rule surface: ${name} not found in src/game.js`);
  const start = match.index;
  const bodyOpen = source.indexOf(match[0].endsWith('[') ? '[' : '{', start + match[0].length - 1);
  return source.slice(start, matchClose(source, bodyOpen));
}

function normalize(text) {
  let out = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/\s+/g, ' ').trim();
  for (const [from, to] of BOOKKEEPING) out = out.split(from).join(to);
  return out;
}

function gameRuleSurface(source) {
  const text = Buffer.isBuffer(source) ? source.toString('utf8') : source;
  const parts = TOP_LEVEL.map((name) => declaration(
    text, new RegExp(`^(?:const ${name} = [\\[{]|function ${name}\\([^)]*\\) \\{|class ${name} \\{)`, 'm'), name));
  const gameStart = text.search(/^class Game \{/m);
  if (gameStart < 0) throw new Error('game rule surface: class Game not found in src/game.js');
  const game = text.slice(gameStart);
  for (const name of GAME_METHODS) {
    parts.push(declaration(game, new RegExp(`^    ${name}\\([^)]*\\) \\{`, 'm'), name));
  }
  return parts.map(normalize).join('\n');
}

function gameRuleIdentity(source) {
  return crypto.createHash('sha256').update(gameRuleSurface(source)).digest('hex');
}

// The bytes of `file` at whichever commit hashed to `hash`, or null.
function historicalBytes(root, file, hash) {
  const commits = execFileSync('git', ['log', '--format=%H', '--', file], { cwd: root, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const commit of commits) {
    let bytes;
    try { bytes = execFileSync('git', ['show', `${commit}:${file}`], { cwd: root }); } catch { continue; }
    if (crypto.createHash('sha256').update(bytes).digest('hex') === hash) return bytes;
  }
  return null;
}

module.exports = { TOP_LEVEL, GAME_METHODS, gameRuleSurface, gameRuleIdentity, historicalBytes };
