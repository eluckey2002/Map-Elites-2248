const { test } = require('node:test');
const assert = require('node:assert/strict');

const { curve } = require('../profile-shapes');

// backload is the share of the score earned in the second half of the moves,
// so a flat game sits at 0.5 by construction and anything above that means the
// score arrived late.
test('a flat game is neither back- nor front-loaded', () => {
  const flat = curve([100, 100, 100, 100]);
  assert.equal(flat.backload, 0.5);
});

test('backload rises when the score arrives late and falls when it arrives early', () => {
  const late = curve([10, 10, 100, 100]);
  const early = curve([100, 100, 10, 10]);
  assert.ok(late.backload > 0.5, `late game backload ${late.backload}`);
  assert.ok(early.backload < 0.5, `early game backload ${early.backload}`);
  assert.equal(Number((late.backload + early.backload).toFixed(10)), 1, 'the two are mirror images');
});

// An odd number of moves has no exact midpoint. The split puts the extra move
// in the first half, so a flat game with an odd move count reads slightly
// below 0.5 rather than above it - the metric understates how late the score
// arrived and never overstates it. Ranking candidates by backload must not be
// able to promote a level for having an odd number of moves.
test('an odd move count biases backload down, never up', () => {
  const flatOdd = curve([20, 20, 20, 20, 20]);
  assert.equal(flatOdd.backload, 0.4, 'moves 4 and 5 are the second half of 5');
  assert.ok(flatOdd.backload < 0.5);

  const allLate = curve([0, 0, 0, 50, 50]);
  assert.equal(allLate.backload, 1, 'a score earned entirely in the second half reads as 1');
});

test('spike is the largest single move as a share of the score', () => {
  assert.equal(curve([25, 25, 25, 25]).spike, 0.25);
  assert.equal(curve([10, 10, 70, 10]).spike, 0.7);
  assert.equal(curve([0, 0, 100, 0]).spike, 1, 'one move earning everything is a full spike');
});

// A game that scored nothing has no curve to report; returning zeros would
// look like a real flat measurement and would be averaged in as one.
test('a scoreless or empty game reports no curve at all', () => {
  assert.equal(curve([]), null);
  assert.equal(curve([0, 0, 0]), null);
});

// The human gen-0010 playthrough is the reference case the metric exists to
// capture: 23% of the score in the first half, 36% of it in one chain.
test('the human gen-0010 playthrough reads as strongly back-loaded and spiky', () => {
  const gains = [5120, 1024, 1024, 3840, 3072, 5120, 5120, 2048, 5120, 1536, 5120, 40960, 10560, 8320, 8960, 8000];
  const shape = curve(gains);
  assert.equal(shape.total, 114944);
  assert.equal(Number(shape.backload.toFixed(2)), 0.77);
  assert.equal(Number(shape.spike.toFixed(2)), 0.36);
});
