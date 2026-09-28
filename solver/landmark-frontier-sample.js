#!/usr/bin/env node

const { LEVELS } = require('../src/game');
const {
  analyzeLandmarkFrontier,
  initialPuzzle,
  replayLandmarkRoute,
} = require('./landmark-frontier');

// Fixed to four existing captured-human boards. The human recordings establish
// that these are real playable positions; they are not supplied to the search.
const PANEL = [
  { level: 55, seed: 2600645753, recording: '10e4dff8' },
  { level: 56, seed: 3504920448, recording: '31a5eae2' },
  { level: 57, seed: 2389915636, recording: 'b068afb0' },
  { level: 58, seed: 4255346895, recording: '640f5c64' },
];

const OPTIONS = Object.freeze({
  mode: 'bounded',
  maxNodes: 1,
  beamWidth: 1,
  actionsPerState: 32,
  pathWidth: 3,
  maxPathStates: 100_000,
  maxResults: 512,
  maxMoves: 1,
});

function runSample() {
  return PANEL.map((subject) => {
    const level = LEVELS.find(({ level: number }) => number === subject.level);
    const puzzle = initialPuzzle(level, subject.seed);
    const result = analyzeLandmarkFrontier({
      ...puzzle,
      landmark: 2048,
      options: OPTIONS,
    });
    for (const route of result.routes) {
      replayLandmarkRoute({ ...puzzle, landmark: 2048 }, route);
    }
    return {
      ...subject,
      standing: result.standing,
      distinctOutcomesFound: result.distinctOutcomeCountLowerBound,
      landmarkActionsFound: result.diagnostics.landmarkActions,
      duplicateOutcomesRemoved: result.diagnostics.duplicateLandmarkOutcomes,
      capReasons: result.diagnostics.capReasons,
    };
  });
}

function print(rows) {
  console.log('level  seed        recording  outcomes found  actions found  duplicates  bounds');
  for (const row of rows) {
    console.log(
      `${String(row.level).padStart(5)}  ${String(row.seed).padStart(10)}  ${row.recording.padStart(9)}`
      + `  ${String(row.distinctOutcomesFound).padStart(14)}`
      + `  ${String(row.landmarkActionsFound).padStart(13)}`
      + `  ${String(row.duplicateOutcomesRemoved).padStart(10)}`
      + `  ${(row.capReasons.join(', ') || 'none')}`,
    );
  }
  console.log('\nAll counts are replayed lower bounds. A capped count is especially not a total.');
}

if (require.main === module) print(runSample());

module.exports = { OPTIONS, PANEL, runSample };
