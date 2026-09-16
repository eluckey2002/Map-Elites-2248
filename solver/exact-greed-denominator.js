const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WORKER = path.join(__dirname, 'exact-greed-worker.js');

function exactGreedDenominator(state, { maxPathStates = 100000, timeoutMs = 5000 } = {}) {
  if (!Number.isInteger(maxPathStates) || maxPathStates < 1) {
    throw new Error('maxPathStates must be a positive integer');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer');
  const result = spawnSync(process.execPath, [WORKER], {
    input: JSON.stringify({ state, maxPathStates }),
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM') {
    return { standing: 'UNKNOWN', reason: 'timeout', maxPathStates, timeoutMs };
  }
  if (result.error) return {
    standing: 'UNKNOWN', reason: result.error.message, maxPathStates, timeoutMs,
  };
  if (result.status !== 0) {
    return {
      standing: 'UNKNOWN',
      reason: `worker exit ${result.status}: ${String(result.stderr || '').trim()}`,
      maxPathStates,
      timeoutMs,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return {
      standing: 'UNKNOWN', reason: 'worker returned malformed JSON', maxPathStates, timeoutMs,
    };
  }
  if (parsed.complete === false && parsed.reason === 'work-limit'
    && parsed.visitedPathStates === maxPathStates) {
    return {
      standing: 'UNKNOWN',
      reason: 'work-limit',
      maxPathStates,
      timeoutMs,
      visitedPathStates: parsed.visitedPathStates,
    };
  }
  if (parsed.complete !== true || !Number.isFinite(parsed.points)
    || !Number.isInteger(parsed.legalChains) || !Number.isInteger(parsed.visitedPathStates)) {
    return {
      standing: 'UNKNOWN', reason: 'worker returned invalid result', maxPathStates, timeoutMs,
    };
  }
  const { complete: _complete, ...measurement } = parsed;
  return { standing: 'exact_result', maxPathStates, timeoutMs, ...measurement };
}

module.exports = { exactGreedDenominator };
