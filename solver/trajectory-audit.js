const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const {
  makeRng, createLevelState, cloneState, canExtendChain, isValidChain,
  isBlockedTile, executeChain, applyGravity, spawnNewTiles, tickBlockers,
} = require('./engine');
const { chooseMove, analyzeMove, DEFAULT_PARAMS } = require('./bot');
const { validateSeed } = require('./benchmark-inputs');
const { classifyTerminal } = require('./benchmark-replay');
const { identity, snapshotBoard } = require('./record-session');
const { actionIdentity } = require('./targeted-chain-generator');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;

function fileIdentity(relativePath) {
  return crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, relativePath)))
    .digest('hex');
}

function expectedCodeIdentities() {
  return {
    bot: { path: 'solver/bot.js', sha256: fileIdentity('solver/bot.js') },
    engine: { path: 'solver/engine.js', sha256: fileIdentity('solver/engine.js') },
    recorder: { path: 'solver/record-session.js', sha256: fileIdentity('solver/record-session.js') },
    levels: { path: 'src/game.js', sha256: fileIdentity('src/game.js') },
  };
}

function same(actual, expected, label, reasons) {
  if (!isDeepStrictEqual(actual, expected)) reasons.push(`${label} mismatch`);
}

function chainSnapshot(chain) {
  return chain && chain.map(({ x, y, value }) => ({ x, y, value }));
}

function trackedRng(seed) {
  const source = makeRng(seed);
  let draws = 0;
  return {
    next() {
      draws += 1;
      return source();
    },
    draws: () => draws,
  };
}

function spawnedTiles(boardAfterGravity, state) {
  const spawned = [];
  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      if (boardAfterGravity[y][x] === null && state.grid[y][x]) {
        spawned.push({ x, y, value: state.grid[y][x].value });
      }
    }
  }
  return spawned;
}

function unresolved(reasons, extra = {}) {
  return { status: 'UNRESOLVED', reasons, session: null, positions: [], ...extra };
}

function readArtifact(artifactPath) {
  if (typeof artifactPath !== 'string' || !artifactPath) throw new Error('artifact path is required');
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

function verifySessionArtifact(artifactPath, subject) {
  const reasons = [];
  let session;
  try {
    session = readArtifact(artifactPath);
  } catch (error) {
    return unresolved([`artifact unreadable: ${error.message}`]);
  }

  try {
    validateSeed(session.seed);
    if (!subject || typeof subject !== 'object') throw new Error('subject is required');
    same(session.schemaVersion, 2, 'schemaVersion', reasons);
    same(session.generatedBy, 'solver/record-session.js', 'generatedBy', reasons);
    same(session.level, subject.level, 'level', reasons);
    same(session.gridW, subject.gridW, 'gridW', reasons);
    same(session.gridH, subject.gridH, 'gridH', reasons);
    same(session.minChain, subject.minChain, 'minChain', reasons);
    same(session.maxMoves, subject.moves, 'maxMoves', reasons);
    same(session.targetScore, subject.target, 'targetScore', reasons);
    same(session.tileScale, subject.tileScale || 1, 'tileScale', reasons);
    same(session.policy && session.policy.params, DEFAULT_PARAMS, 'policy params', reasons);
    same(session.policy && session.policy.identity, identity(DEFAULT_PARAMS), 'policy identity', reasons);
    same(session.identities && session.identities.level, identity(subject), 'subject identity', reasons);
    same(session.identities && session.identities.code, expectedCodeIdentities(), 'source identity', reasons);
    same(session.identities && session.identities.lookahead,
      `mulberry32:${LOOKAHEAD_BASE}+moveIndex`, 'lookahead convention', reasons);
    const withoutIdentity = structuredClone(session);
    delete withoutIdentity.sessionIdentity;
    same(session.sessionIdentity, identity(withoutIdentity), 'session identity', reasons);
    if (!Array.isArray(session.moves)) reasons.push('moves must be an array');
    else if (session.moves.length === 0) reasons.push('session contains no auditable positions');
    if (reasons.length) return unresolved(reasons);

    const live = trackedRng(session.seed);
    const state = createLevelState(subject, live.next);
    const positions = [];
    let terminal = null;

    for (let index = 0; index < session.moves.length; index++) {
      const recorded = session.moves[index];
      if (terminal) {
        reasons.push(`move ${index}: continuation after terminal ${terminal.reason}`);
        break;
      }
      const beforeState = cloneState(state);
      const rngDraws = live.draws();
      const options = {
        lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + index),
        params: DEFAULT_PARAMS,
      };
      const productionChoice = chooseMove(state, options);
      const analysis = analyzeMove(state, options);
      same(recorded.index, index, `move ${index} index`, reasons);
      same(recorded.boardBefore, snapshotBoard(state), `move ${index} boardBefore`, reasons);
      same(recorded.scoreBefore, state.score, `move ${index} scoreBefore`, reasons);
      same(recorded.chain, chainSnapshot(productionChoice), `move ${index} production choice`, reasons);
      same(recorded.decision, analysis, `move ${index} decision`, reasons);
      if (!productionChoice) {
        reasons.push(`move ${index}: artifact records a move after production returned no choice`);
        break;
      }

      const chain = productionChoice.map(({ x, y }) => state.grid[y][x]);
      const points = executeChain(state, chain);
      same(recorded.points, points, `move ${index} points`, reasons);
      same(recorded.scoreAfter, state.score, `move ${index} scoreAfter`, reasons);
      applyGravity(state);
      const afterGravity = snapshotBoard(state);
      same(recorded.boardAfterGravity, afterGravity, `move ${index} boardAfterGravity`, reasons);
      spawnNewTiles(state, live.next);
      same(recorded.spawnDelta, spawnedTiles(afterGravity, state), `move ${index} spawnDelta`, reasons);
      tickBlockers(state);
      same(recorded.boardAfter, snapshotBoard(state), `move ${index} boardAfter`, reasons);
      terminal = classifyTerminal(state, { hasLegalMove: true });
      positions.push({
        moveIndex: index,
        precedingMoves: index,
        state: beforeState,
        liveRng: { seed: session.seed, draws: rngDraws },
        decision: analysis,
        productionChoice: chainSnapshot(productionChoice),
      });
    }

    if (!terminal && reasons.length === 0) {
      const nextIndex = session.moves.length;
      const choice = chooseMove(state, {
        lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + nextIndex),
        params: DEFAULT_PARAMS,
      });
      if (!choice) terminal = { outcome: 'lose', reason: 'no valid moves', firstCrossing: null };
      else reasons.push('incomplete session before terminal event');
    }
    const expectedOutcome = terminal && {
      result: terminal.outcome,
      ...(terminal.outcome === 'lose' ? { reason: terminal.reason } : {}),
      movesUsed: state.moves,
      finalScore: state.score,
    };
    same(session.finalBoard, snapshotBoard(state), 'finalBoard', reasons);
    same(session.outcome, expectedOutcome, 'outcome', reasons);
    if (reasons.length) return unresolved(reasons);

    return {
      status: 'VERIFIED',
      reasons: [],
      session: {
        identity: session.sessionIdentity,
        subjectIdentity: session.identities.level,
        seed: session.seed,
        params: session.policy.params,
        moves: session.moves.length,
        outcome: session.outcome,
      },
      positions,
    };
  } catch (error) {
    return unresolved([...reasons, `verification fault: ${error.message}`]);
  }
}

function positiveLimit(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}

function nonNegativeLimit(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
  return value;
}

function rngAt({ seed, draws }) {
  validateSeed(seed);
  if (!Number.isSafeInteger(draws) || draws < 0) throw new Error('rng draws must be a non-negative integer');
  const rng = makeRng(seed);
  for (let index = 0; index < draws; index++) rng();
  return rng;
}

function replayAction(state, chain, rngState) {
  const replay = cloneState(state);
  const liveChain = chain.map(({ x, y }) => replay.grid[y][x]);
  const points = executeChain(replay, liveChain);
  applyGravity(replay);
  const boardAfterGravity = snapshotBoard(replay);
  spawnNewTiles(replay, rngAt(rngState));
  tickBlockers(replay);
  const outcome = classifyTerminal(replay, { hasLegalMove: true });
  return {
    points,
    boardAfterGravity,
    boardAfter: snapshotBoard(replay),
    scoreAfter: replay.score,
    outcome,
  };
}

function searchImmediateWin(state, rngState, options = {}) {
  const now = options.now || Date.now;
  const limits = {
    maxNodes: nonNegativeLimit(options.maxNodes === undefined ? 100_000 : options.maxNodes, 'maxNodes'),
    maxElapsedMs: positiveLimit(
      options.maxElapsedMs === undefined ? 1_000 : options.maxElapsedMs,
      'maxElapsedMs',
    ),
  };
  let nodes = 0;
  const capReasons = [];
  const testedActions = new Set();
  let witness = null;
  let startedAt = null;
  let observedAt = null;

  function faultResult(error) {
    return {
      disposition: 'UNKNOWN', complete: false, witness: null,
      nodes, actionsTested: testedActions.size,
      testedActionIdentities: [...testedActions],
      searchElapsedMs: startedAt === null || observedAt === null ? null : observedAt - startedAt,
      limits, capReasons: ['fault'], fault: error.message,
    };
  }

  try {
    startedAt = now();
    observedAt = startedAt;
  } catch (error) {
    return faultResult(error);
  }

  function capped() {
    if (nodes >= limits.maxNodes) {
      capReasons.push('maxNodes');
      return true;
    }
    observedAt = now();
    if (observedAt - startedAt >= limits.maxElapsedMs) {
      capReasons.push('maxElapsedMs');
      return true;
    }
    return false;
  }

  function visit(chain, seen) {
    if (capped()) return true;
    nodes += 1;
    if (isValidChain(chain, state.minChain)) {
      const actionId = actionIdentity(chain);
      if (!testedActions.has(actionId)) {
        testedActions.add(actionId);
        const transition = replayAction(state, chain, rngState);
        if (transition.outcome && transition.outcome.outcome === 'win') {
          witness = {
            actionIdentity: actionId,
            chain: chainSnapshot(chain),
            transition,
          };
          return true;
        }
      }
    }
    const last = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = last.x + dx;
        const y = last.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const tile = state.grid[y][x];
        const key = `${x},${y}`;
        if (!tile || isBlockedTile(tile) || seen.has(key) || !canExtendChain(chain, tile)) continue;
        chain.push(tile);
        seen.add(key);
        if (visit(chain, seen)) return true;
        seen.delete(key);
        chain.pop();
      }
    }
    return false;
  }

  try {
    rngAt(rngState);
    outer: for (const row of state.grid) {
      for (const tile of row) {
        if (!tile || isBlockedTile(tile)) continue;
        if (visit([tile], new Set([`${tile.x},${tile.y}`]))) break outer;
      }
    }
  } catch (error) {
    return faultResult(error);
  }

  try {
    observedAt = now();
  } catch (error) {
    return faultResult(error);
  }
  if (!witness && observedAt - startedAt >= limits.maxElapsedMs && !capReasons.includes('maxElapsedMs')) {
    capReasons.push('maxElapsedMs');
  }
  return {
    disposition: witness ? 'FOUND' : capReasons.length ? 'UNKNOWN' : 'NONE',
    complete: !witness && capReasons.length === 0,
    witness,
    nodes,
    actionsTested: testedActions.size,
    testedActionIdentities: [...testedActions],
    searchElapsedMs: observedAt - startedAt,
    limits,
    capReasons: [...new Set(capReasons)],
  };
}

function classifyAttribution(witness, decision, trace) {
  if (!witness) return null;
  if (trace.productionImmediateWin) return 'production-choice';
  if (trace.selectedActionIdentity === witness.actionIdentity) return 'production-choice';
  if (['bomb-priority', 'immediate-target-win'].includes(decision.reason)) return 'unresolved';
  if (trace.offeredActionIdentities.includes(witness.actionIdentity)) return 'ranking';
  if (['normal-weighted-ranking', 'immediate-points-ranking', 'no-valid-move']
    .includes(decision.reason)) return 'generation';
  return 'unresolved';
}

function auditSessionArtifact(artifactPath, subject, options = {}) {
  const replayNow = options.replayNow || Date.now;
  const replayStartedAt = replayNow();
  const verification = verifySessionArtifact(artifactPath, subject);
  const replayElapsedMs = replayNow() - replayStartedAt;
  if (verification.status !== 'VERIFIED') {
    return {
      status: 'UNRESOLVED',
      reasons: verification.reasons,
      positions: [],
      denominators: {
        sessionsRequested: 1,
        sessionsVerified: 0,
        unresolvedSessions: 1,
        positionsRequested: null,
        positionsReported: 0,
        foundPositions: 0,
        nonePositions: 0,
        unknownPositions: 0,
      },
      timing: { replayAndChooserMs: replayElapsedMs, searchMs: 0 },
    };
  }

  const positions = verification.positions.map((position) => {
    const search = searchImmediateWin(position.state, position.liveRng, {
      maxNodes: options.maxNodes,
      maxElapsedMs: options.maxElapsedMs,
      now: options.searchNow,
    });
    const selectedActionIdentity = actionIdentity(position.productionChoice);
    const productionTransition = replayAction(
      position.state,
      position.productionChoice,
      position.liveRng,
    );
    const offeredActionIdentities = position.decision.candidates
      .map(({ chain }) => actionIdentity(chain));
    const attribution = classifyAttribution(search.witness, position.decision, {
      selectedActionIdentity,
      offeredActionIdentities,
      productionImmediateWin: productionTransition.outcome
        && productionTransition.outcome.outcome === 'win',
    });
    return {
      sessionIdentity: verification.session.identity,
      subjectIdentity: verification.session.subjectIdentity,
      seed: verification.session.seed,
      moveIndex: position.moveIndex,
      precedingMoves: position.precedingMoves,
      production: {
        reason: position.decision.reason,
        poolType: position.decision.poolType,
        selectedActionIdentity,
        offeredActionIdentities,
        transition: productionTransition,
      },
      search,
      attribution,
    };
  });
  const count = (disposition) => positions.filter(({ search }) => search.disposition === disposition).length;
  return {
    status: 'COMPLETE',
    reasons: [],
    session: verification.session,
    positions,
    denominators: {
      sessionsRequested: 1,
      sessionsVerified: 1,
      unresolvedSessions: 0,
      positionsRequested: verification.positions.length,
      positionsReported: positions.length,
      foundPositions: count('FOUND'),
      nonePositions: count('NONE'),
      unknownPositions: count('UNKNOWN'),
    },
    timing: {
      replayAndChooserMs: replayElapsedMs,
      searchMs: positions.some(({ search }) => search.searchElapsedMs === null)
        ? null
        : positions.reduce((sum, { search }) => sum + search.searchElapsedMs, 0),
    },
  };
}

module.exports = {
  auditSessionArtifact,
  classifyAttribution,
  searchImmediateWin,
  verifySessionArtifact,
};
