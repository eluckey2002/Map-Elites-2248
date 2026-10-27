const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { LEVELS } = require('../../src/game.js');
const { MORE_LEVELS, allLevels } = require('../../src/more-levels.js');
const { tileScaleForLevel, validateShape } = require('../level-author');

const root = path.resolve(__dirname, '../..');

test('levels 59-70 follow on from game.js with no gaps and leave game.js alone', () => {
  const levels = allLevels(LEVELS);
  assert.equal(LEVELS.length, 58);
  assert.equal(levels.length, 70);
  levels.forEach((level, i) => assert.equal(level.level, i + 1));
  assert.deepEqual(levels.slice(0, 58), LEVELS);
});

test('each new level is a valid shape with the chapter tile scale', () => {
  for (const level of MORE_LEVELS) {
    const { target, tileScale, intro, ...shape } = level;
    validateShape({ ...shape, schemaVersion: 1, name: `level-${level.level}`, demand: 1, demandStatus: 'provisional-proposal' });
    assert.equal(tileScale, tileScaleForLevel(level.level), `level ${level.level} tile scale`);
    assert.ok(Number.isInteger(target) && target > 0, `level ${level.level} target`);
  }
});

test('the browser appends the levels and replays a ?level jump past 58', () => {
  const loads = [];
  const game = { unlockedLevel: 1, loadLevel: (n, options) => loads.push([n, options]) };
  const context = { document: {}, window: { game, location: { search: '?level=63&seed=7' } }, console, URLSearchParams };
  vm.createContext(context);
  const gameSource = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8')
    .replace(/\nif \(typeof document !== 'undefined'\) \{[\s\S]*?\n\}\n/, '\n');
  vm.runInContext(`${gameSource}\nthis.LEVELS_REF = LEVELS;`, context);
  vm.runInContext(fs.readFileSync(path.join(root, 'src/more-levels.js'), 'utf8'), context);
  assert.equal(context.LEVELS_REF.length, 70);
  assert.equal(JSON.stringify(loads), JSON.stringify([[63, { seed: 7 }]]));
  assert.equal(game.unlockedLevel, 63);
});
