const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WORKER = path.join(__dirname, 'exact-greed-worker.js');

function exactGreedDenominator(state, { timeoutMs = 5000 } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer');
  const result = spawnSync(process.execPath, [WORKER], {
    input: JSON.stringify(state),
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM') {
    return { standing: 'UNKNOWN', reason: 'timeout', timeoutMs };
  }
  if (result.error) return { standing: 'UNKNOWN', reason: result.error.message, timeoutMs };
  if (result.status !== 0) {
    return {
      standing: 'UNKNOWN',
      reason: `worker exit ${result.status}: ${String(result.stderr || '').trim()}`,
      timeoutMs,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return { standing: 'UNKNOWN', reason: 'worker returned malformed JSON', timeoutMs };
  }
  if (!Number.isFinite(parsed.points) || !Number.isInteger(parsed.legalChains)) {
    return { standing: 'UNKNOWN', reason: 'worker returned invalid result', timeoutMs };
  }
  return { standing: 'exact_result', timeoutMs, ...parsed };
}

module.exports = { exactGreedDenominator };
