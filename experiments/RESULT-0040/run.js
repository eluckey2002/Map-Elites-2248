#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { playPercentile } = require('../../solver/greed-descriptor-screen');
const { summarizeDeterministicGreed } = require('./result');
const {
  CONFIRMATION_SEEDS,
  EMERGENCY_TIMEOUT_MS,
  EXACT_MAX_PATH_STATES,
  EXPECTED_GAMES,
  PERCENTILES,
  RESULT,
  ROOT,
  artifactWithIdentity,
  profiles,
  sourceHashes,
  subjectIdentity,
} = require('./subject');

function buildCorpus({
  levels = profiles(),
  seeds = CONFIRMATION_SEEDS,
  percentiles = PERCENTILES,
  onCell = () => {},
} = {}) {
  const rows = [];
  for (const percentile of percentiles) {
    for (const level of levels) {
      for (const seed of seeds) {
        const row = playPercentile(level, seed, percentile, {
          denominator: 'exact',
          exactMaxPathStates: EXACT_MAX_PATH_STATES,
          exactTimeoutMs: EMERGENCY_TIMEOUT_MS,
        });
        if (row.denominatorObservations.some(({ reason }) => reason === 'timeout')) {
          throw new Error(`emergency watchdog fired at percentile ${percentile}, level ${level.level}, seed ${seed}`);
        }
        rows.push(row);
      }
      onCell({ percentile, level: level.level, completedGames: rows.length });
    }
  }
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    finalSubjectIdentity: subjectIdentity(),
    proofStanding: 'exact per-move denominator when deterministic path-state enumeration completes; UNKNOWN games at the frozen work limit; heuristic observation over the fixed policy/level/seed panel',
    definitions: {
      greedRatio: 'mean per-move points divided by the exact maximum legal-chain points on that pre-move board',
      halfScoreMove: 'diagnostic only: first move reaching half the final score, divided by moves used',
      player: 'selects the strong-settings greedy candidate nearest a fixed fraction of that candidate pool maximum',
      exclusions: ['human difficulty', 'fun', 'player preference', 'MAP-Elites fitness', 'build potential', 'half-score-move validation', 'levels outside the fixed panel', 'exact greed for work-limited games'],
    },
    panel: {
      levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({
        level, gridW, gridH, moves, minChain, tileScale, target, blockers,
      })),
      seeds,
      percentiles,
      exactMaxPathStates: EXACT_MAX_PATH_STATES,
      emergencyTimeoutMs: EMERGENCY_TIMEOUT_MS,
      expectedGames: EXPECTED_GAMES,
      termination: 'every arm plays to its shipped move budget or a genuine terminal state; target crossing records a win but does not stop play',
    },
    sources: sourceHashes(),
    rows,
    decision: summarizeDeterministicGreed(rows, {
      expectedGames: EXPECTED_GAMES,
      percentiles: PERCENTILES,
    }),
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable confirmation refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0040 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const body = buildCorpus({
    onCell: ({ percentile, level, completedGames }) => {
      process.stderr.write(`RESULT-0040 ${percentile} level ${level}: ${completedGames}/${EXPECTED_GAMES}\n`);
    },
  });
  const artifact = artifactWithIdentity(body, registrationStamp(registration));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(artifact)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { buildCorpus };
