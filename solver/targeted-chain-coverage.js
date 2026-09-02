#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { analyzeMove } = require('./bot');
const {
  applyGravity,
  chainValue,
  createLevelState,
  executeChain,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('./engine');
const { recordSession } = require('./record-session');
const {
  actionIdentity,
  exactChainIdentity,
  generateTargetedChains,
} = require('./targeted-chain-generator');

const DEFAULT_REQUIREMENTS = Object.freeze({
  states: 39,
  productionExact: 2,
  productionEquivalent: 4,
  minimumChallengerEquivalent: 5,
});

function includesChain(chains, target, identity) {
  const targetIdentity = identity(target);
  return chains.some((chain) => identity(chain) === targetIdentity);
}

function stateFromBotMove(session, move) {
  return {
    grid: move.boardBefore.map((row, y) => row.map((tile, x) => (
      tile ? { x, y, ...tile } : null
    ))),
    gridWidth: session.gridW,
    gridHeight: session.gridH,
    score: move.scoreBefore,
    moves: move.index,
    maxMoves: session.maxMoves,
    targetScore: session.targetScore,
    minChain: session.minChain,
    tileScale: session.tileScale,
  };
}

function botSecondDecisionHasSum(fixture, generatorOptions, targetSum) {
  const session = recordSession(fixture.level, fixture.sessions[0].seed);
  if (session.moves.length < 2) return false;
  const state = stateFromBotMove(session, session.moves[1]);
  const generated = generateTargetedChains(state, generatorOptions);
  return generated.candidates.some(({ chain }) => chainValue(chain) === targetSum);
}

function evaluateCoverage(fixture, generatorOptions = {}) {
  const production = { exact: 0, equivalent: 0 };
  const challenger = { exact: 0, equivalent: 0 };
  const search = {
    states: 0,
    completeStates: 0,
    cappedStates: 0,
    nodesVisited: 0,
    actionsConsidered: 0,
    candidatesAvailable: 0,
    candidatesReturned: 0,
    elapsedMs: 0,
    capReasons: {},
    records: [],
  };
  let opening24TileSum3456 = false;

  for (const session of fixture.sessions) {
    const rng = makeRng(session.seed);
    const state = createLevelState(fixture.level, rng);

    session.chains.forEach((recorded, moveIndex) => {
      const productionChains = analyzeMove(state).candidates.map(({ chain }) => chain);
      const generated = generateTargetedChains(state, generatorOptions);
      const challengerChains = generated.candidates.map(({ chain }) => chain);
      const human = recorded.tiles;

      if (includesChain(productionChains, human, exactChainIdentity)) production.exact += 1;
      if (includesChain(productionChains, human, actionIdentity)) production.equivalent += 1;
      if (includesChain(challengerChains, human, exactChainIdentity)) challenger.exact += 1;
      if (includesChain(challengerChains, human, actionIdentity)) challenger.equivalent += 1;

      if (session.sourceFile.startsWith('64eef933') && moveIndex === 0) {
        opening24TileSum3456 = human.length === 24
          && chainValue(human) === 3456
          && includesChain(challengerChains, human, actionIdentity);
      }

      search.states += 1;
      search.nodesVisited += generated.telemetry.nodesVisited;
      search.actionsConsidered += generated.telemetry.actionsConsidered;
      search.candidatesAvailable += generated.telemetry.candidatesAvailable;
      search.candidatesReturned += generated.telemetry.candidatesReturned;
      search.elapsedMs += generated.telemetry.elapsedMs;
      if (generated.complete) search.completeStates += 1;
      else search.cappedStates += 1;
      for (const reason of generated.telemetry.capReasons) {
        search.capReasons[reason] = (search.capReasons[reason] || 0) + 1;
      }
      search.records.push({
        sourceFile: session.sourceFile,
        sourceSha256: session.sourceSha256,
        moveIndex,
        humanActionIdentity: actionIdentity(human),
        complete: generated.complete,
        nodesVisited: generated.telemetry.nodesVisited,
        actionsConsidered: generated.telemetry.actionsConsidered,
        candidatesAvailable: generated.telemetry.candidatesAvailable,
        candidatesReturned: generated.telemetry.candidatesReturned,
        elapsedMs: generated.telemetry.elapsedMs,
        capReasons: [...generated.telemetry.capReasons],
        limits: { ...generated.telemetry.limits },
      });

      const live = human.map(({ x, y }) => state.grid[y][x]);
      executeChain(state, live);
      applyGravity(state);
      spawnNewTiles(state, rng);
      tickBlockers(state);
    });
  }

  search.elapsedMs = Number(search.elapsedMs.toFixed(3));
  return {
    fixture: {
      level: fixture.level.level,
      seed: fixture.sessions[0].seed,
      sessions: fixture.sessions.length,
      sourceSha256: fixture.sessions.map(({ sourceSha256 }) => sourceSha256),
    },
    states: search.states,
    production,
    challenger,
    anchors: {
      opening24TileSum3456,
      productionBotSecondDecisionSum2048: botSecondDecisionHasSum(
        fixture,
        generatorOptions,
        2048,
      ),
    },
    search,
  };
}

function assessCoverage(report, requirements = DEFAULT_REQUIREMENTS) {
  const failures = [];
  if (report.states !== requirements.states) {
    failures.push(`expected ${requirements.states} real states, observed ${report.states}`);
  }
  if (report.production.exact !== requirements.productionExact) {
    failures.push(`production exact coverage drifted from ${requirements.productionExact}`);
  }
  if (report.production.equivalent !== requirements.productionEquivalent) {
    failures.push(`production equivalent coverage drifted from ${requirements.productionEquivalent}`);
  }
  if (report.challenger.equivalent < requirements.minimumChallengerEquivalent) {
    failures.push(`challenger equivalent coverage must reach ${requirements.minimumChallengerEquivalent}`);
  }
  if (report.challenger.equivalent <= report.production.equivalent) {
    failures.push('challenger equivalent coverage must exceed production');
  }
  if (!report.anchors.opening24TileSum3456) failures.push('opening anchor was not recovered');
  if (!report.anchors.productionBotSecondDecisionSum2048) {
    failures.push('production-bot second-decision sum-2048 anchor was not recovered');
  }
  return { pass: failures.length === 0, failures };
}

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index === -1 ? fallback : argv[index + 1];
  };
  const number = (name) => {
    const flag = `--${name}`;
    const index = argv.indexOf(flag);
    if (index === -1) return undefined;
    const raw = argv[index + 1];
    const parsed = Number(raw);
    if (raw === undefined || raw.startsWith('--') || !Number.isSafeInteger(parsed) || parsed < 1) {
      throw new Error(`${flag} requires a positive integer value`);
    }
    return parsed;
  };
  return {
    fixture: value('fixture', path.join(__dirname, 'test-fixtures', 'level52-seed2000000-human-games.json')),
    generatorOptions: {
      maxNodes: number('max-nodes'),
      candidateLimit: number('candidate-limit'),
      pathWidth: number('path-width'),
    },
  };
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const fixture = JSON.parse(fs.readFileSync(path.resolve(options.fixture), 'utf8'));
  const generatorOptions = Object.fromEntries(
    Object.entries(options.generatorOptions).filter(([, value]) => value !== undefined),
  );
  const report = evaluateCoverage(fixture, generatorOptions);
  const assessment = assessCoverage(report);
  console.log(JSON.stringify({
    verdict: assessment.pass ? 'PASS' : 'FAIL',
    failures: assessment.failures,
    ...report,
  }, null, 2));
  process.exitCode = assessment.pass ? 0 : 1;
}

if (require.main === module) main();

module.exports = {
  DEFAULT_REQUIREMENTS,
  assessCoverage,
  evaluateCoverage,
  main,
};
