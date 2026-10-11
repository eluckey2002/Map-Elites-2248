'use strict';
// DECISION-0013. src/game.js mixes game rules with input, animation and
// drawing. Frozen results may let the browser code change, but never the rules.
// The rule surface is all of src/game.js as JavaScript tokens, less the
// browser-only declarations named below and two pieces of this PR's
// bookkeeping. Everything else, including any code added later (a method, a
// class field, a prototype patch, a helper), is part of the surface. Two
// versions of game.js play by the same rules only if their surfaces are equal.
// A browser-only declaration is left out only while it passes browserOnly():
// it may read game state and call the input actions named in INPUT_ACTIONS,
// but it may not write game state, call other rule code, or reach the game
// through reflection or a global. If it fails, it stays in the surface like
// any other code. The check reads tokens, so it does not try to follow code
// built from strings at run time (HTML handlers, computed property names) or
// game objects handed through several local variables; reviewers own those.
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const BROWSER_TOP_LEVEL = ['TILE_COLORS', 'formatTileValue'];
const BROWSER_METHODS = [
  'setupCanvas', 'setupEventListeners', 'getGridPos', 'updateUI', 'updateChainIndicator', 'showMultiplierPopup',
  'showLevelComplete', 'showGameOver', 'showLevelSelect', 'showModal', 'hideModal', 'render', 'drawTile',
  'roundRect', 'gameLoop', 'updateAuthoringStatus',
];
// Fields that only drawing reads. Browser-only code may write them.
const BROWSER_STATE = new Set(['canvas', 'ctx', 'tileSize']);
// Pure readers of game state that browser-only code may call.
const READERS = new Set(['calculateChainValue', 'getChainMultiplier', 'isValidChain', 'calculateStars']);
// Rule entry points that stand for a player's input, and where they may be called.
const INPUT_ACTIONS = {
  setupEventListeners: ['handleTileClick', 'submitChain', 'clearChain', 'undo', 'reloadCurrentLevel', 'nextLevel',
    'showLevelSelect'],
  showLevelSelect: ['loadLevel'],
};
// Names that reach the game object, its prototypes or code built at run time:
// as a variable, or also as a property.
const GLOBAL_ESCAPES = new Set(['Reflect', 'Object', 'Function', 'globalThis', 'self', 'frames', 'parent', 'top',
  'opener', 'import', 'require', 'super', 'arguments', 'with']);
const MEMBER_ESCAPES = new Set(['prototype', '__proto__', 'constructor', 'defineProperty', 'defineProperties',
  'setPrototypeOf', 'eval', 'Game', 'game', 'defaultView', 'ownerDocument', 'view']);
const WINDOW_MEMBERS = new Set(['innerWidth', 'innerHeight', 'devicePixelRatio', 'addEventListener', 'removeEventListener']);
const ARRAY_MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin',
  'set', 'add', 'delete', 'clear']);
// Keywords that can stand before `(...) {` without naming a method.
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'with', 'return', 'typeof', 'await']);
const WRITES = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=',
  '||=', '??=', '++', '--']);
// A beginLevel that only wraps initializeLevel with the bookkeeping below and a
// dead-board message reads as a direct initializeLevel call. Any other
// beginLevel is itself part of the surface.
const PASSTHROUGH = ['beginLevel', 'beginLevel(levelData, rng, authoringCapture = null) { clearTimeout(this.mergeTimer); '
  + "this.mergeTimer = null; this.initializeLevel(levelData, rng, authoringCapture); if (!this.hasValidMoves()) this.showGameOver('No valid moves!'); }",
'this.beginLevel(', 'this.initializeLevel('];
// Modifiers that belong to the declaration they precede.
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

// [start, end] token ranges of every declaration of `name` at nesting depth
// `level` within [from, to), modifiers included.
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
    while (start > from && depth[start - 1] === level && MODIFIERS.has(t(start - 1))) start--;
    found.push([start, end]);
    i = end;
  }
  return found;
}

// Index of the token that opens the bracket closed at `close`.
function matchOpen(tokens, close) {
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    if (closes(tokens[i])) depth++;
    else if (opens(tokens[i]) && --depth === 0) return i;
  }
  throw new Error('game rule surface: unbalanced brackets');
}

// Names of every method of every class, and of every top-level function,
// outside the browser-only declarations. Browser-only code may not name them.
function ruleNames(tokens, depth) {
  const methods = new Set(ARRAY_MUTATORS);
  const functions = new Set();
  tokens.forEach((token, i) => {
    if (token.kind !== 'identifier' || tokens[i + 1]?.t !== '(' || KEYWORDS.has(token.t)) return;
    if (depth[i] === 0 && tokens[i - 1]?.t === 'function') functions.add(token.t);
    if (depth[i] > 0 && tokens[i - 1]?.t !== '.' && tokens[matchClose(tokens, i + 1) + 1]?.t === '{') methods.add(token.t);
  });
  for (const name of BROWSER_TOP_LEVEL) functions.delete(name);
  for (const name of BROWSER_METHODS) methods.delete(name);
  for (const name of READERS) methods.delete(name);
  return { methods, functions };
}

// Whether the declaration in [start, end] only reads game state, calls its
// readers and the input actions allowed to `name`, and writes nothing but
// its own variables, the page and BROWSER_STATE.
function browserOnly(tokens, [start, end], name, rules) {
  const t = (i) => tokens[i] && tokens[i].t;
  const id = (i) => tokens[i] && tokens[i].kind === 'identifier';
  const actions = new Set(INPUT_ACTIONS[name] || []);
  const named = (word) => MEMBER_ESCAPES.has(word) || GLOBAL_ESCAPES.has(word) || ['window', 'document'].includes(word)
    || (rules.methods.has(word) && !ARRAY_MUTATORS.has(word)) || rules.functions.has(word);
  const locals = new Map(); // name -> true when a const holding a page or canvas object
  const isDocument = (i) => t(i) === 'document' && !locals.has('document');
  const page = (i) => isDocument(i) || (t(i) === 'this' && t(i + 1) === '.' && BROWSER_STATE.has(t(i + 2)))
    || locals.get(t(i)) === true;
  let params = start;
  while (params <= end && t(params) !== '(') params++;
  for (let i = params + 1; i < matchClose(tokens, params); i++) if (id(i) && t(i - 1) !== '=') locals.set(t(i), false);
  for (let i = start; i <= end; i++) {
    if (['const', 'let', 'var'].includes(t(i)) && id(i + 1)) locals.set(t(i + 1), t(i) === 'const' && t(i + 2) === '=' && page(i + 3));
    if (id(i) && t(i + 1) === '=>') locals.set(t(i), false);
    if (t(i) === '(' && t(matchClose(tokens, i) + 1) === '=>') {
      for (let k = i + 1; k < matchClose(tokens, i); k++) if (id(k) && t(k - 1) !== '=') locals.set(t(k), false);
    }
  }
  // Root of the member chain ending at `i`, whether the chain has members,
  // and whether any of them is computed (`a[b]`).
  const rootBefore = (i) => {
    let k = i;
    let members = false;
    let computed = false;
    for (;;) {
      if (t(k) === ']' || t(k) === ')') { computed ||= t(k) === ']'; k = matchOpen(tokens, k) - 1; members = true; continue; }
      if (!id(k)) return null;
      if (t(k - 1) === '.' || t(k - 1) === '?.') { k -= 2; members = true; continue; }
      return { root: k, members, computed };
    }
  };
  const writable = (target) => {
    if (!target) return false;
    const { root, members, computed } = target;
    if (t(root) === 'this') return false; // writes to BROWSER_STATE are allowed below
    if (members) return !computed && (isDocument(root) || locals.get(t(root)) === true);
    return locals.has(t(root));
  };
  for (let i = start; i <= end; i++) {
    const token = tokens[i];
    // A name spelled as a string, as in document['defaultView'], counts as that name.
    if (token.kind === 'string' && named(token.t.slice(1, -1))) return false;
    // A computed member that is called, or whose key holds a string, can name any method.
    if (token.t === '[' && (id(i - 1) || [']', ')'].includes(t(i - 1)))) {
      const close = matchClose(tokens, i);
      if (['(', '?.', '.'].includes(t(close + 1)) && (t(close + 1) !== '.' || ['call', 'apply', 'bind'].includes(t(close + 2)))) return false;
      for (let k = i + 1; k < close; k++) if (['string', 'template-head'].includes(tokens[k].kind)) return false;
    }
    // Escapes can spell any name (tile.t\u0069ckBlocker, 'g\x61me'), so browser-only code has none.
    if (token.t.includes('\\')) return false;
    if (token.kind === 'identifier' && (MEMBER_ESCAPES.has(token.t)
      || (GLOBAL_ESCAPES.has(token.t) && t(i - 1) !== '.' && t(i - 1) !== '?.'))) return false;
    if (token.t === 'window' && !(t(i + 1) === '.' && WINDOW_MEMBERS.has(t(i + 2)))) return false;
    if (token.t === 'this') {
      if (t(i + 1) !== '.' || !id(i + 2)) return false;
      const member = t(i + 2);
      if (BROWSER_STATE.has(member)) continue;
      // A rule method named at all, called or not (`?.()`, `.call`, a callback), must be allowed here.
      // A browser method that wires input is itself an input action: only its named callers may run it.
      const allowed = (BROWSER_METHODS.includes(member) && !Object.hasOwn(INPUT_ACTIONS, member))
        || READERS.has(member) || actions.has(member);
      if (!allowed && (rules.methods.has(member) || ['(', '?.'].includes(t(i + 3)) || ['string', 'template-head'].includes(tokens[i + 3]?.kind))) return false;
      if (WRITES.has(t(i + 3)) || ['++', '--', 'delete'].includes(t(i - 1))) return false;
    }
    if (WRITES.has(token.t) && token.kind === 'punctuator') {
      const prefix = (token.t === '++' || token.t === '--') && !(id(i - 1) || [']', ')'].includes(t(i - 1)));
      if (prefix) continue; // checked as the chain it precedes, below
      const target = rootBefore(i - 1);
      if (target && t(target.root) === 'this' && BROWSER_STATE.has(t(target.root + 2))) continue;
      if (!writable(target)) return false;
    }
    if (['++', '--', 'delete'].includes(token.t) && (id(i + 1) || t(i + 1) === '(')) {
      let k = i + 1;
      while (t(k + 1) === '.' || t(k + 1) === '?.' || t(k + 1) === '[') k = t(k + 1) === '[' ? matchClose(tokens, k + 1) : k + 2;
      const target = rootBefore(k);
      if (!(target && t(target.root) === 'this' && BROWSER_STATE.has(t(target.root + 2))) && !writable(target)) return false;
    }
    if (token.kind === 'identifier') {
      if (t(i - 1) === '.' || t(i - 1) === '?.') {
        const target = rootBefore(i);
        const direct = target && t(target.root) === 'this' && target.root + 2 === i; // checked above
        if (rules.methods.has(token.t) && !direct && !(target && page(target.root))) return false;
      } else if (rules.functions.has(token.t)) {
        return false;
      }
    }
  }
  return true;
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

function replaceAll(text, pairs) {
  let out = ` ${text} `;
  for (const [from, to] of pairs) out = out.split(` ${render(tokenize(from))} `).join(` ${render(tokenize(to))} `);
  return out.slice(1, -1);
}

// Whether a `const X = {...}` declaration is plain data: keys and values that
// are only strings, numbers and names, with no getters or calls.
function literal(tokens, [start, end]) {
  for (let i = start + 3; i <= end; i++) {
    const { t, kind } = tokens[i];
    if (kind === 'string' || kind === 'number') continue;
    if (['{', '}', ':', ','].includes(t)) continue;
    if (kind === 'identifier' && [':', ','].includes(tokens[i + 1].t) && !['get', 'set'].includes(t)) continue;
    return false;
  }
  return true;
}

function gameRuleSurface(source) {
  const text = Buffer.isBuffer(source) ? source.toString('utf8') : source;
  const tokens = tokenize(text);
  const depth = depths(tokens);
  const drop = new Set();
  const dropRange = ([start, end]) => { for (let i = start; i <= end; i++) drop.add(i); };

  const rules = ruleNames(tokens, depth);
  for (const name of BROWSER_TOP_LEVEL) {
    declarations(tokens, depth, name, 0, 0, tokens.length)
      .filter((range) => (tokens[range[0]].t === 'const' ? literal(tokens, range) : browserOnly(tokens, range, name, rules)))
      .forEach(dropRange);
    // Its shorthand entry in an object literal, such as module.exports.
    tokens.forEach((token, i) => {
      if (token.t !== name || drop.has(i) || !['{', ','].includes(tokens[i - 1]?.t) || ![',', '}'].includes(tokens[i + 1]?.t)) return;
      drop.add(i);
      if (tokens[i + 1].t === ',') drop.add(i + 1);
    });
  }

  // Level intro text is shown to the player and never read by a rule.
  for (const [start, end] of declarations(tokens, depth, 'LEVELS', 0, 0, tokens.length)) {
    for (let i = start; i < end - 3; i++) {
      if (tokens[i].t === ',' && tokens[i + 1].t === 'intro' && tokens[i + 2].t === ':' && tokens[i + 3].kind === 'string') {
        [i, i + 1, i + 2, i + 3].forEach((k) => drop.add(k));
      }
    }
  }

  const games = declarations(tokens, depth, 'Game', 0, 0, tokens.length);
  if (games.length !== 1) throw new Error('game rule surface: expected one class Game in src/game.js');
  let open = games[0][0];
  while (tokens[open].t !== '{') open++;
  const end = games[0][1];
  for (const name of BROWSER_METHODS) {
    declarations(tokens, depth, name, depth[open] + 1, open + 1, end)
      .filter((range) => browserOnly(tokens, range, name, rules))
      .forEach(dropRange);
  }
  const [wrapper, wrapperText, wrapperCall, directCall] = PASSTHROUGH;
  const wrappers = declarations(tokens, depth, wrapper, depth[open] + 1, open + 1, end);
  const passthrough = wrappers.length === 1
    && render(tokens.slice(wrappers[0][0], wrappers[0][1] + 1)) === render(tokenize(wrapperText));
  if (passthrough) dropRange(wrappers[0]);

  const surface = replaceAll(render(tokens.filter((_, i) => !drop.has(i))), BOOKKEEPING);
  return passthrough ? replaceAll(surface, [[wrapperCall, directCall]]) : surface;
}

function gameRuleIdentity(source) {
  return crypto.createHash('sha256').update(gameRuleSurface(source)).digest('hex');
}

// The oldest commit whose `file` hashed to `hash`, with those bytes, or null.
// The oldest one is where those bytes were first committed; a later commit
// that restores the same bytes, perhaps beside a changed verifier, cannot
// take its place.
function historicalVersion(root, file, hash) {
  const commits = execFileSync('git', ['log', '--reverse', '--format=%H', '--', file], { cwd: root, encoding: 'utf8' })
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

module.exports = { BROWSER_TOP_LEVEL, BROWSER_METHODS, tokenize, gameRuleSurface, gameRuleIdentity, historicalVersion, historicalBytes };
