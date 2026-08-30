// Worker for one or more level blocks in the fixed target-aware evaluation.
const { parentPort } = require('node:worker_threads');
const { LEVELS } = require('../src/game');
const { evaluatePairWithTimings } = require('./target-aware-evaluation');

parentPort.on('message', ({ levelNumbers, seeds }) => {
  const levels = levelNumbers.map((number) => {
    const level = LEVELS.find((candidate) => candidate.level === number);
    if (!level) throw new Error(`missing level ${number}`);
    return level;
  });
  parentPort.postMessage(evaluatePairWithTimings(levels, seeds));
});
