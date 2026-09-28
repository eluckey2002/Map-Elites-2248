const { parentPort } = require('node:worker_threads');
const { LEVELS } = require('../../src/game');
const { evaluatePair } = require('./subject');

parentPort.on('message', ({ levelNumbers, seeds }) => {
  const cells = [];
  for (const levelNumber of levelNumbers) {
    const level = LEVELS.find(({ level: candidate }) => candidate === levelNumber);
    if (!level) throw new Error(`missing shipped level ${levelNumber}`);
    for (const seed of seeds) cells.push(evaluatePair(level, seed));
  }
  parentPort.postMessage(cells);
});
