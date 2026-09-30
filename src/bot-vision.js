(() => {
  'use strict';

  const ui = Object.fromEntries([
    'sessionForm', 'levelInput', 'seedInput', 'notice', 'openGamePicker', 'gamePicker', 'closeGamePicker', 'gamePickerStatus', 'gameRows', 'recordedView', 'previewView',
    'branchMode', 'clearBranch', 'startTakeover', 'manualChain', 'routeProjection', 'runBranch', 'branchResult', 'branchHint', 'branchBoard',
    'boardShell', 'board', 'chainPath', 'previousMove', 'playPause', 'nextMove',
    'moveLabel', 'timeline', 'scoreValue', 'targetValue', 'outcomeValue', 'gridValue',
    'minChainValue', 'sessionIdentity', 'topCount', 'sortMode', 'candidateRows',
    'decisionReason', 'recordedChain', 'inspectedChain', 'survivorValue',
    'predictedNext', 'actualNext', 'rerankCallout', 'contributionRows',
    'weightControls', 'resetWeights', 'structuralParams', 'observationText',
    'saveObservation', 'exportObservation', 'importObservation', 'observationState',
  ].map((id) => [id, document.getElementById(id)]));

  const model = {
    session: null,
    moveIndex: 0,
    inspectedId: null,
    view: 'recorded',
    weights: null,
    playing: null,
    branchMode: false,
    manualChain: [],
    branchResult: null,
    takeover: null,
  };

  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const ACTIVE_TAKEOVER_KEY = 'bot-vision-active-takeover-v1';

  function setNotice(message, error = false) {
    ui.notice.textContent = message;
    ui.notice.classList.toggle('error', error);
  }

  function shortIdentity(value) {
    return value ? value.slice(0, 12) : '—';
  }

  function chainText(chain) {
    if (!chain || chain.length === 0) return 'None';
    return chain.map(({ value }) => number.format(value)).join('–');
  }

  function compactChainText(chain) {
    if (!chain || chain.length === 0) return 'None';
    const runs = [];
    for (const { value } of chain) {
      const last = runs[runs.length - 1];
      if (last && last.value === value) last.count += 1;
      else runs.push({ value, count: 1 });
    }
    return runs.map(({ value, count }) => (
      count === 1 ? number.format(value) : `${number.format(value)}×${count}`
    )).join('–');
  }

  function candidateScore(candidate) {
    const raw = candidate.raw;
    return raw.immediate
      + model.weights.wRoll * raw.rollout
      + model.weights.wPlace * raw.placement
      + model.weights.turnover * raw.turnover
      + model.weights.wHarvest * raw.harvest;
  }

  function policyRanking(candidates) {
    return candidates.slice().sort((a, b) => (
      candidateScore(b) - candidateScore(a) || a.generationRank - b.generationRank
    ));
  }

  function displayRanking(candidates) {
    const mode = ui.sortMode.value;
    if (mode === 'policy') return policyRanking(candidates);
    const metric = mode === 'twoMove'
      ? 'twoMovePoints'
      : mode === 'immediate' ? 'immediatePoints' : 'chainLength';
    return candidates.slice().sort((a, b) => (
      b[metric] - a[metric] || a.generationRank - b.generationRank
    ));
  }

  function currentMove() {
    return model.session.moves[model.moveIndex];
  }

  function recordedCandidate(move = currentMove()) {
    return move.decision.candidates.find(({ id }) => id === move.decision.selectedId);
  }

  function inspectedCandidate(move = currentMove()) {
    return move.decision.candidates.find(({ id }) => id === model.inspectedId)
      || recordedCandidate(move);
  }

  function observationKey() {
    return model.session ? `bot-vision-observation:${model.session.sessionIdentity}:${model.moveIndex}` : null;
  }

  function canExtendChain(board, selected, x, y) {
    const tile = board[y] && board[y][x];
    if (!tile || tile.blocker === 'stone' || selected.some((entry) => entry.x === x && entry.y === y)) return false;
    const previous = selected.at(-1);
    if (!previous) return true;
    const prior = board[previous.y] && board[previous.y][previous.x];
    const adjacent = Math.max(Math.abs(previous.x - x), Math.abs(previous.y - y)) === 1;
    if (!adjacent) return false;
    return selected.length === 1
      ? tile.value === prior.value
      : tile.value === prior.value || tile.value === prior.value * 2;
  }

  function manualBoard() {
    return model.takeover ? model.takeover.board : currentMove().boardBefore;
  }

  function manualTile(x, y) {
    const board = manualBoard();
    return board[y] && board[y][x];
  }

  function canExtendManual(x, y) {
    return canExtendChain(manualBoard(), model.manualChain, x, y);
  }

  function toggleManualTile(x, y) {
    const last = model.manualChain.at(-1);
    if (last && last.x === x && last.y === y) model.manualChain.pop();
    else if (canExtendManual(x, y)) model.manualChain.push({ x, y });
    else {
      setNotice('That tile does not continue a legal small-to-large chain.', true);
      return;
    }
    if (!model.takeover) {
      model.branchResult = null;
      model.branchEvidence = null;
    }
    saveActiveTakeover();
    render();
  }

  function manualChainSnapshots() {
    return model.manualChain.map(({ x, y }) => ({ x, y, ...manualTile(x, y) }));
  }

  function chainMultiplier(length) {
    if (length >= 9) return 5;
    if (length >= 7) return 3;
    if (length >= 5) return 2;
    if (length >= 3) return 1.5;
    return 1;
  }

  function routeProjection(chain) {
    const total = chain.reduce((sum, tile) => sum + tile.value, 0);
    return {
      endingValue: total,
      points: Math.floor(total * chainMultiplier(chain.length)),
    };
  }

  function tileColor(value) {
    if (!value) return '#43505a';
    const exponent = Math.max(1, Math.log2(value));
    const hues = [192, 182, 144, 110, 72, 40, 24, 8, 330, 286, 250, 218];
    return `hsl(${hues[Math.floor(exponent) % hues.length]} 42% 38%)`;
  }

  function drawPath(chain) {
    const svg = ui.chainPath;
    const polyline = svg.querySelector('polyline');
    const shellRect = ui.boardShell.getBoundingClientRect();
    const points = chain.map(({ x, y }) => {
      const tile = ui.board.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (!tile) return null;
      const rect = tile.getBoundingClientRect();
      return `${rect.left - shellRect.left + rect.width / 2},${rect.top - shellRect.top + rect.height / 2}`;
    }).filter(Boolean);
    svg.setAttribute('viewBox', `0 0 ${shellRect.width} ${shellRect.height}`);
    polyline.setAttribute('points', points.join(' '));
    svg.classList.toggle('preview', model.view === 'preview');
    svg.classList.toggle('branch', model.branchMode);
  }

  function renderBoard(move) {
    const chosen = model.view === 'preview' ? inspectedCandidate(move) : recordedCandidate(move);
    const chain = model.branchMode ? manualChainSnapshots() : model.takeover ? [] : chosen ? chosen.chain : [];
    const order = new Map(chain.map((tile, index) => [`${tile.x},${tile.y}`, index + 1]));
    ui.board.style.setProperty('--grid-w', model.session.gridW);
    ui.board.replaceChildren();

    const board = model.takeover ? model.takeover.board : move.boardBefore;
    board.forEach((row, y) => row.forEach((tile, x) => {
      const cell = document.createElement('div');
      cell.className = tile ? 'tile' : 'tile empty';
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (!tile) {
        ui.board.append(cell);
        return;
      }
      cell.style.setProperty('--tile-color', tileColor(tile.value));
      if (tile.blocker) cell.classList.add(tile.blocker);
      const position = order.get(`${x},${y}`);
      if (position) {
        cell.classList.add(model.branchMode ? 'selected-branch' : model.view === 'preview' ? 'selected-preview' : 'selected-recorded');
        const badge = document.createElement('span');
        badge.className = 'order';
        badge.textContent = position;
        cell.append(badge);
      }
      const value = document.createElement('span');
      value.textContent = tile.blocker === 'stone' ? '◆' : number.format(tile.value);
      cell.append(value);
      if (tile.blocker) {
        const mark = document.createElement('small');
        mark.className = 'blocker-mark';
        mark.textContent = tile.blocker === 'bomb'
          ? `B${tile.bombTimer}`
          : tile.blocker === 'ice' ? `I${tile.blockerDuration}` : tile.blocker.toUpperCase();
        cell.append(mark);
      }
      if (model.branchMode && tile.blocker !== 'stone') {
        cell.classList.add('branchable');
        const isLastSelected = position === model.manualChain.length;
        const isLegalNext = !position && canExtendManual(x, y);
        cell.classList.toggle('legal-next', isLegalNext || isLastSelected);
        cell.classList.toggle('route-locked', !position && !isLegalNext);
        cell.tabIndex = 0;
        cell.setAttribute('role', 'button');
        const state = isLastSelected ? ', last selected: click to undo'
          : isLegalNext ? ', legal next tile'
            : ', cannot continue this route';
        cell.setAttribute('aria-label', `Route tile ${number.format(tile.value)} at column ${x + 1}, row ${y + 1}${state}`);
        cell.addEventListener('click', () => toggleManualTile(x, y));
        cell.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          toggleManualTile(x, y);
        });
      }
      ui.board.append(cell);
    }));
    requestAnimationFrame(() => drawPath(chain));
  }

  function renderTimeline() {
    ui.timeline.replaceChildren();
    const takeoverLocked = Boolean(model.takeover && !model.takeover.outcome);
    model.session.moves.forEach((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = index < model.moveIndex ? 'done' : index === model.moveIndex ? 'current' : '';
      button.title = `Move ${index + 1}`;
      button.setAttribute('aria-label', `Show move ${index + 1}`);
      button.disabled = takeoverLocked;
      button.addEventListener('click', () => setMove(index));
      ui.timeline.append(button);
    });
  }

  function renderCandidateRows(move) {
    const ranked = displayRanking(move.decision.candidates);
    const policyRanked = policyRanking(move.decision.candidates);
    const policyLeader = policyRanked[0];
    const limit = ui.topCount.value === 'all' ? ranked.length : Number(ui.topCount.value);
    const visible = ranked.slice(0, limit);
    const recorded = recordedCandidate(move);
    if (recorded && !visible.some(({ id }) => id === recorded.id)) visible.push(recorded);
    ui.candidateRows.replaceChildren();

    visible.forEach((candidate) => {
      const row = document.createElement('tr');
      row.className = 'candidate-row';
      if (candidate.id === move.decision.selectedId) row.classList.add('recorded');
      if (candidate.id === policyLeader.id) row.classList.add('hypothetical');
      if (model.view === 'preview' && candidate.id === model.inspectedId) row.classList.add('inspecting');
      row.tabIndex = 0;
      row.title = candidate.chain.map(({ x, y, value }) => `${number.format(value)} @ ${x},${y}`).join(' → ');
      const rank = ranked.findIndex(({ id }) => id === candidate.id) + 1;
      const values = [
        rank,
        compactChainText(candidate.chain),
        candidate.chainLength,
        number.format(candidate.chainSum),
        number.format(candidate.immediatePoints),
        number.format(candidate.raw.rollout),
        number.format(candidate.twoMovePoints),
        number.format(candidateScore(candidate)),
      ];
      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const inspect = () => {
        model.inspectedId = candidate.id;
        model.view = 'preview';
        render();
      };
      row.addEventListener('click', inspect);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') inspect();
      });
      ui.candidateRows.append(row);
    });
  }

  function contributionRows(candidate) {
    return [
      ['Immediate', candidate.raw.immediate, 1, candidate.raw.immediate],
      ['Rollout', candidate.raw.rollout, model.weights.wRoll, candidate.raw.rollout * model.weights.wRoll],
      ['Placement', candidate.raw.placement, model.weights.wPlace, candidate.raw.placement * model.weights.wPlace],
      ['Turnover', candidate.raw.turnover, model.weights.turnover, candidate.raw.turnover * model.weights.turnover],
      ['Harvest', candidate.raw.harvest, model.weights.wHarvest, candidate.raw.harvest * model.weights.wHarvest],
    ];
  }

  function renderInspector(move) {
    const recorded = recordedCandidate(move);
    const inspected = inspectedCandidate(move);
    const policyLeader = policyRanking(move.decision.candidates)[0];
    const nextMove = model.session.moves[model.moveIndex + 1];
    ui.decisionReason.textContent = `Recorded choice · ${move.decision.reason.replaceAll('-', ' ')}`;
    ui.recordedChain.textContent = chainText(recorded && recorded.chain);
    ui.inspectedChain.textContent = chainText(inspected && inspected.chain);
    ui.survivorValue.textContent = inspected && inspected.survivor
      ? `${number.format(inspected.survivor.value)} at (${inspected.survivor.x}, ${inspected.survivor.y})`
      : 'None';
    ui.predictedNext.textContent = inspected && inspected.predictedNext
      ? `${chainText(inspected.predictedNext.chain)} · ${number.format(inspected.predictedNext.points)} pts`
      : 'No predicted chain';
    ui.actualNext.textContent = nextMove
      ? `${chainText(nextMove.chain)} · ${number.format(nextMove.points)} pts`
      : 'Session ended';

    const same = policyLeader && recorded && policyLeader.id === recorded.id;
    const override = move.decision.reason !== 'normal-weighted-ranking';
    ui.rerankCallout.textContent = override
      ? `Recorded choice used ${move.decision.reason.replaceAll('-', ' ')}. Weight changes do not override that recorded decision.`
      : same
        ? 'Hypothetical rerank — recorded move unchanged. Current displayed weights still rank it #1.'
        : `Hypothetical rerank — recorded move unchanged. Displayed weights rank ${chainText(policyLeader.chain)} #1.`;

    ui.contributionRows.replaceChildren();
    contributionRows(inspected).forEach(([name, raw, weight, contribution]) => {
      const row = document.createElement('tr');
      [name, number.format(raw), number.format(weight), number.format(contribution)].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      ui.contributionRows.append(row);
    });
  }

  function renderFacts(move) {
    const takeoverLocked = Boolean(model.takeover && !model.takeover.outcome);
    ui.moveLabel.textContent = model.takeover
      ? `Takeover · move ${model.takeover.movesUsed} / ${model.session.maxMoves}`
      : `Move ${model.moveIndex + 1} / ${model.session.moves.length}`;
    ui.scoreValue.textContent = number.format(model.takeover ? model.takeover.score : move.scoreBefore);
    ui.targetValue.textContent = `of ${number.format(model.session.targetScore)}`;
    ui.outcomeValue.textContent = `${model.session.outcome.result.toUpperCase()} · ${number.format(model.session.outcome.finalScore)}`;
    ui.gridValue.textContent = `${model.session.gridW} × ${model.session.gridH}`;
    ui.minChainValue.textContent = model.session.minChain;
    ui.sessionIdentity.textContent = shortIdentity(model.session.sessionIdentity);
    ui.sessionIdentity.title = model.session.sessionIdentity;
    ui.previousMove.disabled = takeoverLocked || model.moveIndex === 0;
    ui.nextMove.disabled = takeoverLocked || model.moveIndex === model.session.moves.length - 1;
    ui.playPause.disabled = takeoverLocked;
    ui.playPause.textContent = takeoverLocked
      ? 'Recorded replay locked'
      : model.playing ? 'Ⅱ Pause recording' : '▶ Recorded replay';
  }

  function renderViewSwitch() {
    ui.recordedView.classList.toggle('active', model.view === 'recorded' && !model.branchMode);
    ui.previewView.classList.toggle('active', model.view === 'preview' && !model.branchMode);
    ui.branchMode.classList.toggle('active', model.branchMode);
  }

  function renderReview() {
    const selected = manualChainSnapshots();
    const takeover = model.takeover;
    ui.manualChain.textContent = selected.length
      ? `${selected.length} tile${selected.length === 1 ? '' : 's'} · ${chainText(selected)}`
      : 'No route selected';
    const projection = routeProjection(selected);
    const [endingTile, turnPoints] = ui.routeProjection.querySelectorAll('dd');
    endingTile.textContent = selected.length ? number.format(projection.endingValue) : '—';
    turnPoints.textContent = selected.length >= model.session.minChain
      ? `${number.format(projection.points)} points`
      : '—';
    ui.runBranch.disabled = selected.length < model.session.minChain || Boolean(takeover?.outcome);
    ui.runBranch.textContent = takeover ? 'Play this turn' : 'Play this route forward';
    ui.startTakeover.textContent = takeover ? 'Restart takeover' : 'Take over from this move';
    ui.branchHint.textContent = takeover?.outcome
      ? 'Takeover complete. Its terminal result is tied to this exact move and route transcript.'
      : takeover
        ? `You are playing from recorded move ${takeover.startMoveIndex + 1}. Bright tiles can continue your route; this takeover saves automatically after every choice.`
        : model.branchMode
      ? `Click touching tiles in order. Bright tiles can continue your route; you need ${model.session.minChain} or more tiles.`
      : 'Choose “Build my route,” then select touching tiles in order.';
    ui.branchResult.textContent = takeover
      ? model.branchResult || `Takeover active · ${takeover.turns.length} turn${takeover.turns.length === 1 ? '' : 's'} played · ${takeover.movesRemaining} moves remaining.`
      : model.branchResult || '';
    renderBranchBoard();
    const saved = JSON.parse(localStorage.getItem(observationKey()) || 'null');
    if (document.activeElement !== ui.observationText) ui.observationText.value = saved?.comment || '';
    ui.observationState.textContent = model.takeover && !model.takeover.outcome
      ? 'Takeover auto-saved'
      : saved ? 'Saved locally' : 'Local draft';
  }

  function renderBranchBoard() {
    const branch = model.takeover ? null : model.branchEvidence;
    ui.branchBoard.replaceChildren();
    ui.branchBoard.classList.toggle('visible', Boolean(branch));
    if (!branch) return;
    ui.branchBoard.style.setProperty('--branch-grid-w', model.session.gridW);
    branch.boardAfter.forEach((row) => row.forEach((tile) => {
      const cell = document.createElement('div');
      cell.className = tile ? 'tile' : 'tile empty';
      if (tile) {
        cell.style.setProperty('--tile-color', tileColor(tile.value));
        if (tile.blocker) cell.classList.add(tile.blocker);
        cell.textContent = tile.blocker === 'stone' ? '◆' : number.format(tile.value);
      }
      ui.branchBoard.append(cell);
    }));
  }

  function render() {
    if (!model.session || model.session.moves.length === 0) return;
    const move = currentMove();
    renderViewSwitch();
    renderBoard(move);
    renderTimeline();
    renderCandidateRows(move);
    renderInspector(move);
    renderFacts(move);
    renderReview();
  }

  function stopPlayback() {
    if (model.playing) window.clearInterval(model.playing);
    model.playing = null;
    if (!model.takeover) ui.playPause.textContent = '▶ Recorded replay';
  }

  function setMove(index) {
    if (model.takeover) return;
    model.moveIndex = Math.max(0, Math.min(index, model.session.moves.length - 1));
    model.inspectedId = model.session.moves[model.moveIndex].decision.selectedId;
    model.view = 'recorded';
    model.branchMode = false;
    model.manualChain = [];
    model.branchResult = null;
    model.branchEvidence = null;
    model.takeover = null;
    clearActiveTakeover();
    render();
  }

  function setWeightInputs() {
    ui.weightControls.querySelectorAll('[data-weight]').forEach((input) => {
      input.value = model.weights[input.dataset.weight];
    });
  }

  function renderStructuralParams(params) {
    const labels = [['width', 'Candidate width'], ['bombMax', 'Bomb max'], ['pathWidth', 'Path width'], ['tieBreak', 'Tie break'], ['offerFull', 'Offer full']];
    ui.structuralParams.replaceChildren();
    labels.forEach(([key, label]) => {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = label;
      value.textContent = params[key];
      group.append(term, value);
      ui.structuralParams.append(group);
    });
  }

  function renderRecordedGames(rows) {
    ui.gameRows.replaceChildren();
    rows.forEach((row) => {
      const result = `${row.botMoves - row.humanMoves} faster`;
      const tr = document.createElement('tr');
      [row.level, number.format(row.seed), `${row.humanMoves} moves`, `${row.botMoves} moves`].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.append(td);
      });
      const resultCell = document.createElement('td');
      resultCell.className = 'game-result faster';
      resultCell.textContent = result;
      tr.append(resultCell);
      const actionCell = document.createElement('td');
      const load = document.createElement('button');
      load.className = 'load-game-button';
      load.type = 'button';
      load.dataset.level = row.level;
      load.dataset.seed = row.seed;
      load.textContent = 'Load';
      actionCell.append(load);
      tr.append(actionCell);
      ui.gameRows.append(tr);
    });
  }

  async function openRecordedGames() {
    ui.gamePicker.showModal();
    ui.gamePickerStatus.textContent = 'Loading your paired human-versus-bot games…';
    ui.gameRows.replaceChildren();
    try {
      const response = await fetch('/api/human-benchmark');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load recorded games');
      renderRecordedGames(body.rows);
      ui.gamePickerStatus.textContent = 'Your fastest wins are first. Load one to inspect or take it over.';
    } catch (error) {
      ui.gamePickerStatus.textContent = error.message;
    }
  }

  async function loadRecordedGame(level, seed) {
    clearActiveTakeover();
    ui.levelInput.value = String(level);
    ui.seedInput.value = String(seed);
    ui.gamePicker.close();
    await runSession();
  }

  async function fetchSession(level, seed) {
    const response = await fetch(`/api/session?level=${encodeURIComponent(level)}&seed=${encodeURIComponent(seed)}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  }

  function applySession(session, moveIndex = 0) {
    if (!session.moves[moveIndex]) throw new Error('This evidence file points to a move that is not in its recording');
    model.session = session;
    model.moveIndex = moveIndex;
    model.inspectedId = session.moves[moveIndex].decision.selectedId;
    model.view = 'recorded';
    model.branchMode = false;
    model.manualChain = [];
    model.branchResult = null;
    model.branchEvidence = null;
    model.takeover = null;
    model.weights = {
      wRoll: session.policy.params.wRoll,
      wPlace: session.policy.params.wPlace,
      turnover: session.policy.params.turnover,
      wHarvest: session.policy.params.wHarvest,
    };
    setWeightInputs();
    renderStructuralParams(session.policy.params);
  }

  async function runSession() {
    stopPlayback();
    const level = ui.levelInput.value;
    const seed = ui.seedInput.value;
    setNotice(`Generating Level ${level}, seed ${seed} through the real bot…`);
    document.querySelector('.workbench').setAttribute('aria-busy', 'true');
    try {
      const body = await fetchSession(level, seed);
      applySession(body);
      render();
      setNotice(`Exact recording ready · ${body.moves.length} moves · ${body.outcome.result} at ${number.format(body.outcome.finalScore)}.`);
    } catch (error) {
      setNotice(error.message, true);
    } finally {
      document.querySelector('.workbench').setAttribute('aria-busy', 'false');
    }
  }

  async function restoreEvidence(record) {
    const plan = window.BotVisionEvidence.restorePlan(record);
    setNotice(`Restoring Level ${plan.level}, seed ${plan.seed} from evidence…`);
    document.querySelector('.workbench').setAttribute('aria-busy', 'true');
    try {
      const session = await fetchSession(plan.level, plan.seed);
      if (session.sessionIdentity !== plan.sessionIdentity) {
        throw new Error('This export was made from a different recording and cannot be safely restored');
      }
      let takeover = null;
      if (plan.takeoverRequest) {
        const response = await fetch('/api/takeover', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(plan.takeoverRequest),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not replay the exported takeover');
        takeover = { ...body, chains: plan.takeoverRequest.chains };
      }
      const board = takeover ? takeover.board : session.moves[plan.moveIndex].boardBefore;
      const restoredChain = [];
      for (const tile of plan.manualChain) {
        if (!canExtendChain(board, restoredChain, tile.x, tile.y)) {
          throw new Error('The saved unfinished route is not legal on its replayed board');
        }
        restoredChain.push(tile);
      }

      stopPlayback();
      applySession(session, plan.moveIndex);
      model.takeover = takeover;
      model.branchMode = Boolean(takeover || restoredChain.length);
      model.manualChain = restoredChain;
      model.branchResult = takeover
        ? `Restored takeover · ${takeover.turns.length} turn${takeover.turns.length === 1 ? '' : 's'} played · ${takeover.movesRemaining} moves remaining.`
        : null;
      ui.levelInput.value = String(plan.level);
      ui.seedInput.value = String(plan.seed);
      render();
      ui.observationText.value = plan.comment;
      saveObservation(false);
      saveActiveTakeover();
      setNotice(takeover ? 'Exact takeover restored. Continue building your next route.' : 'Evidence restored.');
    } finally {
      document.querySelector('.workbench').setAttribute('aria-busy', 'false');
    }
  }

  async function loadLevels() {
    try {
      const response = await fetch('/api/levels');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load levels');
      body.levels.forEach((level) => {
        const option = document.createElement('option');
        option.value = level.level;
        option.textContent = `${level.level} · ${level.gridW}×${level.gridH}`;
        if (level.level === 52) option.selected = true;
        ui.levelInput.append(option);
      });
      const savedTakeover = localStorage.getItem(ACTIVE_TAKEOVER_KEY);
      if (!savedTakeover) {
        await runSession();
        return;
      }
      try {
        await restoreEvidence(JSON.parse(savedTakeover));
      } catch (error) {
        clearActiveTakeover();
        await runSession();
        setNotice(`Could not restore the previous takeover: ${error.message}`, true);
      }
    } catch (error) {
      setNotice(error.message, true);
    }
  }

  async function runBranch() {
    if (model.takeover) return runTakeoverTurn();
    const chain = manualChainSnapshots().map(({ x, y }) => ({ x, y }));
    if (chain.length < model.session.minChain) return;
    ui.runBranch.disabled = true;
    model.branchResult = 'Playing your route forward under the same refill sequence…';
    renderReview();
    try {
      const response = await fetch('/api/counterfactual', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          levelNumber: model.session.level,
          seed: model.session.seed,
          moveIndex: model.moveIndex,
          chain,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not play the branch');
      const botOutcome = model.session.outcome;
      const delta = body.outcome.movesUsed - botOutcome.movesUsed;
      const comparison = body.outcome.result !== botOutcome.result
        ? `Your branch ${body.outcome.result}; recorded bot ${botOutcome.result}.`
        : delta === 0 ? 'It finishes in the same number of moves as the recorded bot.'
          : delta < 0 ? `It finishes ${Math.abs(delta)} move${Math.abs(delta) === 1 ? '' : 's'} sooner than the recorded bot.`
            : `It finishes ${delta} move${delta === 1 ? '' : 's'} later than the recorded bot.`;
      model.branchResult = `${number.format(body.points)} points now · ${comparison}`;
      model.branchEvidence = body;
    } catch (error) {
      model.branchResult = error.message;
      model.branchEvidence = null;
    }
    render();
  }

  function beginTakeover() {
    const move = currentMove();
    model.takeover = {
      startMoveIndex: model.moveIndex,
      board: move.boardBefore,
      score: move.scoreBefore,
      movesUsed: move.index,
      movesRemaining: model.session.maxMoves - move.index,
      turns: [],
      chains: [],
      outcome: null,
    };
    model.branchMode = true;
    model.manualChain = [];
    model.branchEvidence = null;
    model.branchResult = `Takeover starts before recorded move ${model.moveIndex + 1}. Your first route now replaces that bot choice.`;
    saveActiveTakeover();
    render();
  }

  async function runTakeoverTurn() {
    const chain = manualChainSnapshots().map(({ x, y }) => ({ x, y }));
    if (chain.length < model.session.minChain || model.takeover.outcome) return;
    const chains = [...model.takeover.chains, chain];
    ui.runBranch.disabled = true;
    model.branchResult = 'Applying your turn with the fixed refill sequence…';
    renderReview();
    try {
      const response = await fetch('/api/takeover', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          levelNumber: model.session.level,
          seed: model.session.seed,
          moveIndex: model.takeover.startMoveIndex,
          chains,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not play takeover turn');
      model.takeover = { ...body, chains };
      model.manualChain = [];
      const latest = body.turns.at(-1);
      if (body.outcome) {
        const botOutcome = model.session.outcome;
        const delta = body.outcome.movesUsed - botOutcome.movesUsed;
        const comparison = body.outcome.result !== botOutcome.result
          ? `Your takeover ${body.outcome.result}; recorded bot ${botOutcome.result}.`
          : delta === 0 ? 'It finishes in the same number of moves as the recorded bot.'
            : delta < 0 ? `It finishes ${Math.abs(delta)} move${Math.abs(delta) === 1 ? '' : 's'} sooner than the recorded bot.`
              : `It finishes ${delta} move${delta === 1 ? '' : 's'} later than the recorded bot.`;
        model.branchResult = `${number.format(latest.points)} points this turn · ${comparison}`;
        model.branchMode = false;
      } else {
        model.branchResult = `${number.format(latest.points)} points this turn · ${body.movesRemaining} moves remaining. Build your next route.`;
      }
      saveActiveTakeover();
    } catch (error) {
      model.branchResult = error.message;
    }
    render();
  }

  function observationRecord() {
    return {
      schemaVersion: 1,
      sessionIdentity: model.session.sessionIdentity,
      level: model.session.level,
      seed: model.session.seed,
      moveIndex: model.moveIndex,
      botChain: recordedCandidate().chain,
      manualChain: manualChainSnapshots(),
      branch: model.branchEvidence || null,
      takeover: model.takeover ? { ...model.takeover, chains: model.takeover.chains } : null,
      comment: ui.observationText.value.trim(),
      savedAt: new Date().toISOString(),
    };
  }

  function saveObservation(announce = true) {
    const key = observationKey();
    const record = observationRecord();
    localStorage.setItem(key, JSON.stringify(record));
    ui.observationState.textContent = 'Saved locally';
    if (announce) setNotice(`Saved observation for move ${model.moveIndex + 1}. Export it when you want to turn it into evidence.`);
    return record;
  }

  function saveActiveTakeover() {
    if (!model.takeover || model.takeover.outcome) {
      clearActiveTakeover();
      return;
    }
    localStorage.setItem(ACTIVE_TAKEOVER_KEY, JSON.stringify(observationRecord()));
  }

  function clearActiveTakeover() {
    localStorage.removeItem(ACTIVE_TAKEOVER_KEY);
  }

  function exportObservation() {
    saveObservation();
    const record = localStorage.getItem(observationKey());
    const blob = new Blob([`${JSON.stringify(JSON.parse(record), null, 2)}\n`], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bot-observation-level${model.session.level}-seed${model.session.seed}-move${model.moveIndex + 1}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  ui.sessionForm.addEventListener('submit', (event) => { event.preventDefault(); clearActiveTakeover(); runSession(); });
  ui.openGamePicker.addEventListener('click', openRecordedGames);
  ui.closeGamePicker.addEventListener('click', () => ui.gamePicker.close());
  ui.gameRows.addEventListener('click', (event) => {
    const button = event.target.closest('.load-game-button');
    if (button) loadRecordedGame(Number(button.dataset.level), Number(button.dataset.seed));
  });
  ui.previousMove.addEventListener('click', () => setMove(model.moveIndex - 1));
  ui.nextMove.addEventListener('click', () => setMove(model.moveIndex + 1));
  ui.playPause.addEventListener('click', () => {
    if (model.takeover) return;
    if (model.playing) { stopPlayback(); return; }
    if (model.moveIndex === model.session.moves.length - 1) setMove(0);
    ui.playPause.textContent = 'Ⅱ Pause recording';
    model.playing = window.setInterval(() => {
      if (model.moveIndex >= model.session.moves.length - 1) { stopPlayback(); return; }
      setMove(model.moveIndex + 1);
    }, 1200);
  });
  ui.recordedView.addEventListener('click', () => {
    model.view = 'recorded';
    model.branchMode = false;
    model.takeover = null;
    clearActiveTakeover();
    render();
  });
  ui.previewView.addEventListener('click', () => {
    model.view = 'preview';
    model.branchMode = false;
    model.takeover = null;
    clearActiveTakeover();
    render();
  });
  ui.branchMode.addEventListener('click', () => {
    model.branchMode = !model.branchMode;
    model.manualChain = [];
    model.branchResult = null;
    model.branchEvidence = null;
    render();
  });
  ui.clearBranch.addEventListener('click', () => {
    model.manualChain = [];
    if (!model.takeover) {
      model.branchResult = null;
      model.branchEvidence = null;
    }
    saveActiveTakeover();
    render();
  });
  ui.startTakeover.addEventListener('click', beginTakeover);
  ui.runBranch.addEventListener('click', runBranch);
  ui.saveObservation.addEventListener('click', saveObservation);
  ui.exportObservation.addEventListener('click', exportObservation);
  ui.importObservation.addEventListener('change', async () => {
    const [file] = ui.importObservation.files;
    ui.importObservation.value = '';
    if (!file) return;
    try {
      await restoreEvidence(JSON.parse(await file.text()));
    } catch (error) {
      setNotice(error.message || 'Could not restore that evidence file', true);
    }
  });
  ui.topCount.addEventListener('change', render);
  ui.sortMode.addEventListener('change', render);
  ui.weightControls.addEventListener('input', (event) => {
    const key = event.target.dataset.weight;
    if (!key) return;
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    model.weights[key] = value;
    render();
  });
  ui.resetWeights.addEventListener('click', () => {
    const params = model.session.policy.params;
    model.weights = { wRoll: params.wRoll, wPlace: params.wPlace, turnover: params.turnover, wHarvest: params.wHarvest };
    setWeightInputs();
    render();
  });
  window.addEventListener('resize', () => model.session && renderBoard(currentMove()));

  loadLevels();
})();
