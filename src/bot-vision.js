(() => {
  'use strict';

  const ui = Object.fromEntries([
    'sessionForm', 'levelInput', 'seedInput', 'notice', 'recordedView', 'previewView',
    'boardShell', 'board', 'chainPath', 'previousMove', 'playPause', 'nextMove',
    'moveLabel', 'timeline', 'scoreValue', 'targetValue', 'outcomeValue', 'gridValue',
    'minChainValue', 'sessionIdentity', 'topCount', 'sortMode', 'candidateRows',
    'decisionReason', 'recordedChain', 'inspectedChain', 'survivorValue',
    'predictedNext', 'actualNext', 'rerankCallout', 'contributionRows',
    'weightControls', 'resetWeights', 'structuralParams',
  ].map((id) => [id, document.getElementById(id)]));

  const model = {
    session: null,
    moveIndex: 0,
    inspectedId: null,
    view: 'recorded',
    weights: null,
    playing: null,
  };

  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

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
  }

  function renderBoard(move) {
    const chosen = model.view === 'preview' ? inspectedCandidate(move) : recordedCandidate(move);
    const chain = chosen ? chosen.chain : [];
    const order = new Map(chain.map((tile, index) => [`${tile.x},${tile.y}`, index + 1]));
    ui.board.style.setProperty('--grid-w', model.session.gridW);
    ui.board.replaceChildren();

    move.boardBefore.forEach((row, y) => row.forEach((tile, x) => {
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
        cell.classList.add(model.view === 'preview' ? 'selected-preview' : 'selected-recorded');
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
      ui.board.append(cell);
    }));
    requestAnimationFrame(() => drawPath(chain));
  }

  function renderTimeline() {
    ui.timeline.replaceChildren();
    model.session.moves.forEach((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = index < model.moveIndex ? 'done' : index === model.moveIndex ? 'current' : '';
      button.title = `Move ${index + 1}`;
      button.setAttribute('aria-label', `Show move ${index + 1}`);
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
    ui.moveLabel.textContent = `Move ${model.moveIndex + 1} / ${model.session.moves.length}`;
    ui.scoreValue.textContent = number.format(move.scoreBefore);
    ui.targetValue.textContent = `of ${number.format(model.session.targetScore)}`;
    ui.outcomeValue.textContent = `${model.session.outcome.result.toUpperCase()} · ${number.format(model.session.outcome.finalScore)}`;
    ui.gridValue.textContent = `${model.session.gridW} × ${model.session.gridH}`;
    ui.minChainValue.textContent = model.session.minChain;
    ui.sessionIdentity.textContent = shortIdentity(model.session.sessionIdentity);
    ui.sessionIdentity.title = model.session.sessionIdentity;
    ui.previousMove.disabled = model.moveIndex === 0;
    ui.nextMove.disabled = model.moveIndex === model.session.moves.length - 1;
  }

  function renderViewSwitch() {
    ui.recordedView.classList.toggle('active', model.view === 'recorded');
    ui.previewView.classList.toggle('active', model.view === 'preview');
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
  }

  function stopPlayback() {
    if (model.playing) window.clearInterval(model.playing);
    model.playing = null;
    ui.playPause.textContent = '▶ Play';
  }

  function setMove(index) {
    model.moveIndex = Math.max(0, Math.min(index, model.session.moves.length - 1));
    model.inspectedId = model.session.moves[model.moveIndex].decision.selectedId;
    model.view = 'recorded';
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

  async function runSession() {
    stopPlayback();
    const level = ui.levelInput.value;
    const seed = ui.seedInput.value;
    setNotice(`Generating Level ${level}, seed ${seed} through the real bot…`);
    document.querySelector('.workbench').setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(`/api/session?level=${encodeURIComponent(level)}&seed=${encodeURIComponent(seed)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
      model.session = body;
      model.moveIndex = 0;
      model.inspectedId = body.moves[0] && body.moves[0].decision.selectedId;
      model.view = 'recorded';
      model.weights = {
        wRoll: body.policy.params.wRoll,
        wPlace: body.policy.params.wPlace,
        turnover: body.policy.params.turnover,
        wHarvest: body.policy.params.wHarvest,
      };
      setWeightInputs();
      renderStructuralParams(body.policy.params);
      render();
      setNotice(`Exact recording ready · ${body.moves.length} moves · ${body.outcome.result} at ${number.format(body.outcome.finalScore)}.`);
    } catch (error) {
      setNotice(error.message, true);
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
      await runSession();
    } catch (error) {
      setNotice(error.message, true);
    }
  }

  ui.sessionForm.addEventListener('submit', (event) => { event.preventDefault(); runSession(); });
  ui.previousMove.addEventListener('click', () => setMove(model.moveIndex - 1));
  ui.nextMove.addEventListener('click', () => setMove(model.moveIndex + 1));
  ui.playPause.addEventListener('click', () => {
    if (model.playing) { stopPlayback(); return; }
    if (model.moveIndex === model.session.moves.length - 1) setMove(0);
    ui.playPause.textContent = 'Ⅱ Pause';
    model.playing = window.setInterval(() => {
      if (model.moveIndex >= model.session.moves.length - 1) { stopPlayback(); return; }
      setMove(model.moveIndex + 1);
    }, 1200);
  });
  ui.recordedView.addEventListener('click', () => { model.view = 'recorded'; render(); });
  ui.previewView.addEventListener('click', () => { model.view = 'preview'; render(); });
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
