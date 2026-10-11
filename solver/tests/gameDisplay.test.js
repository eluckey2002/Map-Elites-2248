const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Game } = require('../../src/game.js');

/**
 * Display and accessibility bugs from the 2026-10-11 repo review: the board
 * was drawn at one canvas pixel per CSS pixel, so it blurred on high-density
 * screens; the page blocked pinch zoom; and the board had no accessible name.
 */

function sizedGame(devicePixelRatio) {
  const previousWindow = global.window;
  const transforms = [];
  global.window = { innerWidth: 440, devicePixelRatio, addEventListener() {} };
  try {
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      gridWidth: 5,
      gridHeight: 8,
      tilePadding: 6,
      canvas: { style: {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) },
      ctx: { setTransform: (...args) => transforms.push(args) },
      render() {},
    });
    game.setupCanvas();
    return { game, transforms };
  } finally {
    global.window = previousWindow;
  }
}

test('the board is drawn at the screen pixel density and laid out in CSS pixels', () => {
  const { game, transforms } = sizedGame(2);
  const cssWidth = 5 * game.tileSize + 6 * 6;
  const cssHeight = 8 * game.tileSize + 6 * 9;
  assert.equal(game.canvas.style.width, `${cssWidth}px`);
  assert.equal(game.canvas.style.height, `${cssHeight}px`);
  assert.equal(game.canvas.width, cssWidth * 2);
  assert.equal(game.canvas.height, cssHeight * 2);
  assert.deepEqual(transforms.at(-1), [2, 0, 0, 2, 0, 0]);

  // A tap is still read in CSS pixels: the centre of column 2, row 3.
  const centre = (index) => 6 + index * (game.tileSize + 6) + game.tileSize / 2;
  assert.deepEqual(game.getGridPos(centre(2), centre(3)), { col: 2, row: 3 });
});

test('a screen without a pixel ratio draws one canvas pixel per CSS pixel', () => {
  const { game, transforms } = sizedGame(undefined);
  assert.equal(game.canvas.width, parseInt(game.canvas.style.width, 10));
  assert.deepEqual(transforms.at(-1), [1, 0, 0, 1, 0, 0]);
});

test('the page allows pinch zoom and names the board for screen readers', () => {
  const html = fs.readFileSync(path.join(__dirname, '../../src/index.html'), 'utf8');
  const viewport = html.match(/<meta name="viewport" content="([^"]*)"/)[1];
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale/);
  assert.match(html, /<canvas id="gameCanvas"[^>]*role="img"[^>]*aria-label="[^"]+"/);
});
