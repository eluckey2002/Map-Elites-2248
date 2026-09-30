const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stylesheet = fs.readFileSync(
  path.join(__dirname, '../../src/keeper-motion-prototype.css'),
  'utf8',
);

test('Keeper theme leaves the chain indicator below the board', () => {
  const rule = stylesheet.match(/\.chain-indicator\s*\{([^}]*)\}/);

  assert.ok(rule, 'Keeper theme has a chain indicator rule');
  assert.doesNotMatch(
    rule[1],
    /\bbottom\s*:/,
    'the theme must not override the base below-canvas placement',
  );
});
