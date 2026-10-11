'use strict';
// DECISION-0013. src/game.js mixes game rules with input, animation and
// drawing. Frozen results may let the browser code change, but never the rules.
// The rule surface is the token stream of every declaration below. Two
// versions of game.js play by the same rules only if their rule surfaces are
// equal; a missing declaration is an error, so a rename cannot drop a rule out
// of the comparison silently.
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const TOP_LEVEL = [
  'BLOCKER_TYPES', 'LEVELS', 'Tile', 'makeSeededRng', 'rngForLevel', 'requirePlayableInteger',
  'playableTileScale', 'validatePlayableLevel', 'createInitialGrid',
];
// handleTileClick and submitChain decide which chains the player can build and
// submit, and loadLevel and startCustomLevel decide which seed deals the board,
// so they are rules even though they also touch the page.
const GAME_METHODS = [
  'initializeLevel', 'loadLevel', 'startCustomLevel', 'handleTileClick', 'submitChain', 'isAdjacent', 'canExtendChain', 'isValidChain',
  'calculateChainValue', 'getChainMultiplier', 'executeChain', 'applyGravity', 'spawnNewTiles', 'tickBlockers',
  'checkBombs', 'checkWinLose', 'hasValidMoves', 'canFormValidChain', 'saveState', 'undo',
];
// Game fields read by bound rules but set elsewhere (the constructor): every
// assignment to them anywhere in class Game is bound.
const GAME_FIELDS = ['maxHistory'];
// A beginLevel that only wraps initializeLevel with the bookkeeping below and a
// dead-board message reads as a direct initializeLevel call. Any other
// beginLevel is itself part of the surface.
const PASSTHROUGH = ['beginLevel', 'beginLevel(levelData, rng, authoringCapture = null) { clearTimeout(this.mergeTimer); '
  + "this.mergeTimer = null; this.initializeLevel(levelData, rng, authoringCapture); if (!this.hasValidMoves()) this.showGameOver('No valid moves!'); }",
'this.beginLevel(', 'this.initializeLevel('];
// Method modifiers that change what calling the method does.
const MODIFIERS = new Set(['static', 'async', 'get', 'set', '*']);
// Bookkeeping that lets a level reload cancel a pending merge. It decides
// whether the callback runs on the board it belongs to, not what the callback does.
const BOOKKEEPING = [['this.mergeTimer = setTimeout(() => { this.mergeTimer = null;', 'setTimeout(() => {']];

const PUNCTUATORS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=',
  '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
];
// After these a `/` starts a regular expression rather than a division.
const BEFORE_EXPRESSION = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await']);
// A line break after these, or before ++ and --, changes how JavaScript parses
// the code. Anywhere else a line break means the same as a space: if inserting
// a semicolon at it mattered, the same text without the break would not parse.
const RESTRICTED = new Set(['return', 'throw', 'break', 'continue', 'yield', 'async']);
const LINE_BREAK = new RegExp('[\\n\\r\\u2028\\u2029]');
const ASSIGNMENT = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=',
  '&&=', '||=', '??=', '++', '--']);
const OPEN = new Set(['{', '[', '(']);
const CLOSE = new Set(['}', ']', ')']);
const IDENTIFIER = new RegExp('[A-Za-z_$#\\u0080-\\uffff][\\w$\\u0080-\\uffff]*', 'y');
const NUMBER = /(?:0[xXbBoO][\da-fA-F_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/y;

// JavaScript tokens with comments and whitespace removed. Strings, template
// pieces and regular expressions stay whole and byte-exact. `nl` marks a token
// that follows a line break.
function tokenize(text) {
  const tokens = [];
  const braces = []; // true where a `}` resumes a template literal
  let i = 0;
  let nl = false;
  const push = (t, kind) => { tokens.push({ t, kind, nl }); nl = false; };
  const template = (start) => { // from just after ` or }, through ${ or the closing `
    let j = start;
    for (;;) {
      if (j >= text.length) throw new Error('game rule surface: unterminated template literal');
      if (text[j] === '\\') { j += 2; continue; }
      if (text[j] === '`') return { end: j + 1, opens: false };
      if (text[j] === '$' && text[j + 1] === '{') return { end: j + 2, opens: true };
      j++;
    }
  };
  while (i < text.length) {
    const c = text[i];
    if (LINE_BREAK.test(c)) { nl = true; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && !LINE_BREAK.test(text[i])) i++; continue; }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('game rule surface: unterminated comment');
      if (LINE_BREAK.test(text.slice(i, end))) nl = true;
      i = end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1;
      if (j >= text.length) throw new Error('game rule surface: unterminated string');
      push(text.slice(i, j + 1), 'string');
      i = j + 1;
      continue;
    }
    if (c === '`' || (c === '}' && braces[braces.length - 1] === true)) {
      if (c === '}') braces.pop();
      const { end, opens } = template(i + 1);
      push(text.slice(i, end), c === '`' ? (opens ? 'template-head' : 'string') : (opens ? 'template-middle' : 'template-tail'));
      if (opens) braces.push(true);
      i = end;
      continue;
    }
    if (c === '/') {
      const prev = tokens[tokens.length - 1];
      const regex = !prev || (prev.kind === 'punctuator' && !CLOSE.has(prev.t))
        || (prev.kind === 'identifier' && BEFORE_EXPRESSION.has(prev.t)) || prev.kind.startsWith('template-h')
        || prev.kind === 'template-middle';
      if (regex) {
        let j = i + 1;
        let inClass = false;
        while (j < text.length && (inClass || text[j] !== '/')) {
          if (text[j] === '\\') j++;
          else if (text[j] === '[') inClass = true;
          else if (text[j] === ']') inClass = false;
          else if (text[j] === '\n') throw new Error('game rule surface: unterminated regular expression');
          j++;
        }
        j++;
        while (j < text.length && /[a-z]/.test(text[j])) j++;
        push(text.slice(i, j), 'regex');
        i = j;
        continue;
      }
    }
    NUMBER.lastIndex = i;
    if (/[\d.]/.test(c) && NUMBER.test(text) && NUMBER.lastIndex > i && !(c === '.' && !/\d/.test(text[i + 1]))) {
      push(text.slice(i, NUMBER.lastIndex), 'number');
      i = NUMBER.lastIndex;
      continue;
    }
    IDENTIFIER.lastIndex = i;
    if (IDENTIFIER.test(text)) {
      push(text.slice(i, IDENTIFIER.lastIndex), 'identifier');
      i = IDENTIFIER.lastIndex;
      continue;
    }
    const p = PUNCTUATORS.find((op) => text.startsWith(op, i)) || c;
    if (p === '{') braces.push(false);
    if (p === '}') braces.pop();
    push(p, 'punctuator');
    i += p.length;
  }
  return tokens;
}

function opens(token) { return token.kind === 'template-head' || (token.kind === 'punctuator' && OPEN.has(token.t)); }
function closes(token) { return token.kind === 'template-tail' || (token.kind === 'punctuator' && CLOSE.has(token.t)); }

// Index of the token that closes the bracket at `open`.
function matchClose(tokens, open) {
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    if (opens(tokens[i])) depth++;
    else if (closes(tokens[i]) && --depth === 0) return i;
  }
  throw new Error('game rule surface: unterminated declaration');
}

// Nesting depth before each token.
function depths(tokens) {
  const out = [];
  let depth = 0;
  for (const token of tokens) {
    if (closes(token)) depth--;
    out.push(depth);
    if (opens(token)) depth++;
  }
  return out;
}

// Every declaration of `name` at nesting depth `level` within [from, to): a
// second declaration of the same name would replace the first, so both count.
function declarations(tokens, depth, name, level, from, to) {
  const found = [];
  const t = (i) => tokens[i] && tokens[i].t;
  for (let i = from; i < to; i++) {
    if (depth[i] !== level) continue;
    let body = -1;
    if (level === 0) {
      if (t(i) === 'const' && t(i + 1) === name && t(i + 2) === '=' && (t(i + 3) === '[' || t(i + 3) === '{')) body = i + 3;
      else if (t(i) === 'function' && t(i + 1) === name && t(i + 2) === '(') body = matchClose(tokens, i + 2) + 1;
      else if (t(i) === 'class' && t(i + 1) === name) for (body = i + 2; body < to && t(body) !== '{'; body++);
    } else if (t(i) === name && t(i + 1) === '(') {
      body = matchClose(tokens, i + 1) + 1;
    }
    if (body < 0) continue;
    if (t(body) !== '{' && t(body) !== '[') throw new Error(`game rule surface: ${name} has no body`);
    const end = matchClose(tokens, body);
    let start = i;
    if (level > 0) while (start > from && depth[start - 1] === level && MODIFIERS.has(t(start - 1))) start--;
    found.push(tokens.slice(start, end + 1));
    i = end;
  }
  if (found.length === 0) throw new Error(`game rule surface: ${name} not found in src/game.js`);
  return found;
}

// Every statement in [from, to) that assigns this.<field>, through its `;`.
function fieldAssignments(tokens, depth, field, from, to) {
  const found = [];
  for (let i = from; i < to - 3; i++) {
    if (tokens[i].t !== 'this' || tokens[i + 1].t !== '.' || tokens[i + 2].t !== field) continue;
    const before = tokens[i - 1] && tokens[i - 1].t;
    if (!ASSIGNMENT.has(tokens[i + 3].t) && before !== '++' && before !== '--') continue;
    let end = i;
    while (end < to && !(depth[end] === depth[i] && (tokens[end].t === ';' || closes(tokens[end])))) end++;
    found.push(tokens.slice(i, end));
    i = end;
  }
  if (found.length === 0) throw new Error(`game rule surface: no assignment to this.${field} in class Game`);
  return found;
}

function render(tokens) {
  let out = '';
  tokens.forEach((token, i) => {
    if (i > 0) {
      const breaks = token.nl && (RESTRICTED.has(tokens[i - 1].t) || token.t === '++' || token.t === '--');
      out += breaks ? '\n' : ' ';
    }
    out += token.t;
  });
  return out;
}

// Level intro text is shown to the player and never read by a rule.
function withoutIntroCopy(tokens) {
  return tokens.filter((token, i) => {
    for (let k = 0; k < 4; k++) {
      const at = i - k;
      if (tokens[at] && tokens[at].t === ',' && tokens[at + 1]?.t === 'intro' && tokens[at + 2]?.t === ':'
        && tokens[at + 3]?.kind === 'string') return false;
    }
    return true;
  });
}

function withoutBookkeeping(text) {
  let out = ` ${text} `;
  for (const [from, to] of BOOKKEEPING) out = out.split(` ${render(tokenize(from))} `).join(` ${render(tokenize(to))} `);
  return out.slice(1, -1);
}

function gameRuleSurface(source) {
  const text = Buffer.isBuffer(source) ? source.toString('utf8') : source;
  const tokens = tokenize(text);
  const depth = depths(tokens);
  const parts = [];
  for (const name of TOP_LEVEL) {
    for (const part of declarations(tokens, depth, name, 0, 0, tokens.length)) {
      parts.push(render(name === 'LEVELS' ? withoutIntroCopy(part) : part));
    }
  }
  const games = declarations(tokens, depth, 'Game', 0, 0, tokens.length);
  if (games.length !== 1) throw new Error('game rule surface: expected one class Game in src/game.js');
  const start = tokens.indexOf(games[0][0]);
  const open = start + games[0].findIndex((token) => token.t === '{');
  const end = matchClose(tokens, open);
  const [wrapper, wrapperText, wrapperCall, directCall] = PASSTHROUGH;
  let wrappers = [];
  try { wrappers = declarations(tokens, depth, wrapper, depth[open] + 1, open + 1, end).map(render); } catch { /* absent */ }
  const passthrough = wrappers.length === 1 && wrappers[0] === render(tokenize(wrapperText));
  if (!passthrough) parts.push(...wrappers);
  for (const name of GAME_METHODS) {
    for (const part of declarations(tokens, depth, name, depth[open] + 1, open + 1, end)) {
      let text = withoutBookkeeping(render(part));
      if (passthrough) text = ` ${text} `.split(` ${render(tokenize(wrapperCall))} `).join(` ${render(tokenize(directCall))} `).slice(1, -1);
      parts.push(text);
    }
  }
  for (const field of GAME_FIELDS) {
    for (const part of fieldAssignments(tokens, depth, field, open + 1, end)) parts.push(render(part));
  }
  return parts.join('\n');
}

function gameRuleIdentity(source) {
  return crypto.createHash('sha256').update(gameRuleSurface(source)).digest('hex');
}

// The newest commit whose `file` hashed to `hash`, with those bytes, or null.
function historicalVersion(root, file, hash) {
  const commits = execFileSync('git', ['log', '--format=%H', '--', file], { cwd: root, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const commit of commits) {
    let bytes;
    try { bytes = execFileSync('git', ['show', `${commit}:${file}`], { cwd: root }); } catch { continue; }
    if (crypto.createHash('sha256').update(bytes).digest('hex') === hash) return { commit, bytes };
  }
  return null;
}

function historicalBytes(root, file, hash) {
  const version = historicalVersion(root, file, hash);
  return version && version.bytes;
}

module.exports = { TOP_LEVEL, GAME_METHODS, GAME_FIELDS, tokenize, gameRuleSurface, gameRuleIdentity, historicalVersion, historicalBytes };
