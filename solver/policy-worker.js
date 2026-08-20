// Worker half of the policy search: evaluates one policy on one fixed game set.
// Policies are independent, the game sets are identical across workers, and
// every game is seeded, so parallelism changes wall-clock and nothing else.
const { parentPort } = require('node:worker_threads');
const path = require('node:path');
const { LEVELS } = require(path.join(__dirname, '..', 'src', 'game.js'));
const { evaluatePolicy } = require('./policy-eval');

parentPort.on('message', ({ id, params, levelNumbers, seeds }) => {
  const levels = levelNumbers.map((n) => LEVELS.find((l) => l.level === n));
  const result = evaluatePolicy(params, levels, seeds);
  parentPort.postMessage({ id, ...result });
});
