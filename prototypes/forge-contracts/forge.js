// PROTOTYPE — browser-only Forge Contracts layer over the unchanged game.

(function startForgePrototype() {
  const { CONTRACTS, advance, observe, progress } = window.ForgeContracts;

  function waitForGame() {
    if (!window.game) {
      window.setTimeout(waitForGame, 20);
      return;
    }
    install(window.game);
  }

  function install(game) {
    const style = document.createElement('style');
    style.textContent = `
      .forge-panel { width:100%; max-width:400px; margin:0 0 12px; padding:12px; border-radius:12px; background:rgba(255,255,255,.08); }
      .forge-title { font-size:16px; font-weight:800; margin-bottom:4px; }
      .forge-help { font-size:12px; opacity:.8; line-height:1.35; }
      .forge-options { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
      .forge-option { border:1px solid rgba(255,255,255,.2); border-radius:9px; padding:10px; color:#fff; background:rgba(255,255,255,.08); cursor:pointer; text-align:left; }
      .forge-option strong,.forge-option span { display:block; }
      .forge-option span { font-size:11px; opacity:.75; margin-top:4px; }
      .forge-option.spread { border-color:#67e8f9; }
      .forge-option.tower { border-color:#c084fc; }
      .forge-status { display:none; margin-top:8px; }
      .forge-status.active { display:block; }
      .forge-progress { height:7px; margin-top:7px; background:rgba(255,255,255,.12); border-radius:5px; overflow:hidden; }
      .forge-progress-fill { height:100%; width:0; background:linear-gradient(90deg,#67e8f9,#c084fc); transition:width .2s; }
      .forge-award { color:#facc15; font-weight:800; }
      .forge-capture { margin-top:7px; font-size:11px; opacity:.7; }
      .forge-capture.error { color:#fca5a5; opacity:1; }
      body.forge-choosing .game-container, body.forge-choosing .controls { opacity:.35; pointer-events:none; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('section');
    panel.className = 'forge-panel';
    panel.innerHTML = `
      <div class="forge-title">Choose how you want to build</div>
      <div class="forge-help">Both plans can beat the target. Pick one before your first move; the bonus is paid once.</div>
      <div class="forge-options">
        <button class="forge-option spread" data-contract="spread"><strong>Spread Forge · +15K</strong><span>Hold four 1,024 tiles at once</span></button>
        <button class="forge-option tower" data-contract="tower"><strong>Tower Forge · +24K</strong><span>Create one tile worth exactly 4,096</span></button>
      </div>
      <div class="forge-status">
        <div class="forge-status-line"></div>
        <div class="forge-progress"><div class="forge-progress-fill"></div></div>
        <div class="forge-capture">Recording starts when you choose.</div>
      </div>
    `;
    document.querySelector('.game-container').before(panel);
    document.body.classList.add('forge-choosing');

    let state = null;
    const status = panel.querySelector('.forge-status');
    const statusLine = panel.querySelector('.forge-status-line');
    const fill = panel.querySelector('.forge-progress-fill');
    const captureLine = panel.querySelector('.forge-capture');
    let capture = null;
    let finalPayload = null;

    function snapshotGrid() {
      return game.grid.map((row) => row.map((tile) => (tile ? {
        x: tile.x,
        y: tile.y,
        value: tile.value,
        blocker: tile.blocker,
        blockerDuration: tile.blockerDuration,
        bombTimer: tile.bombTimer,
      } : null)));
    }

    function bindFinalCapture() {
      if (!game.authoringCapture) return;
      game.authoringCapture.submit = (payload) => { finalPayload = payload; };
    }

    async function persistCapture() {
      if (!capture) return;
      capture.revision += 1;
      capture.updatedAt = new Date().toISOString();
      capture.score = game.score;
      capture.movesUsed = game.moves;
      capture.contractAwarded = state.awarded;
      capture.bonusAwarded = state.bonusAwarded;
      capture.progress = state.progress;
      capture.status = finalPayload ? 'complete' : 'in-progress';
      capture.outcome = finalPayload ? finalPayload.outcome : null;
      capture.reason = finalPayload ? finalPayload.reason : null;
      const snapshot = JSON.stringify(capture);
      captureLine.classList.remove('error');
      captureLine.textContent = finalPayload ? 'Saving completed run…' : `Saving move ${game.moves}…`;
      try {
        const response = await fetch('/api/forge-sessions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: snapshot,
          keepalive: true,
        });
        if (!response.ok) throw new Error(`capture failed: ${response.status}`);
        captureLine.textContent = finalPayload
          ? `Run recorded · ${game.moves} moves`
          : game.moves === 0 ? 'Run recording started' : `Move ${game.moves} recorded`;
      } catch (error) {
        captureLine.classList.add('error');
        captureLine.textContent = 'Recording failed — stop and tell Codex';
      }
    }

    function beginCapture(contractId) {
      finalPayload = null;
      bindFinalCapture();
      capture = {
        schemaVersion: 1,
        standing: 'throwaway Forge Contracts playtest; not evidence-ledger evidence',
        sessionId: crypto.randomUUID(),
        candidateIdentity: game.authoringCapture ? game.authoringCapture.candidateIdentity : null,
        candidateLevel: game.currentLevel,
        seed: game.authoringCapture ? game.authoringCapture.seed : 5,
        contractId,
        contract: CONTRACTS[contractId],
        startedAt: new Date().toISOString(),
        updatedAt: null,
        revision: 0,
        status: 'in-progress',
        outcome: null,
        reason: null,
        score: 0,
        movesUsed: 0,
        contractAwarded: false,
        bonusAwarded: 0,
        progress: state.progress,
        initialGrid: snapshotGrid(),
        moves: [],
      };
      panel.dataset.sessionId = capture.sessionId;
      persistCapture();
    }

    function render() {
      if (!state) return;
      const contract = CONTRACTS[state.contractId];
      status.classList.add('active');
      statusLine.innerHTML = state.awarded
        ? `<span class="forge-award">${contract.name} complete · +${contract.bonus.toLocaleString()}</span>`
        : `<strong>${contract.name}</strong> · ${state.progress.label}`;
      fill.style.width = `${100 * state.progress.current / state.progress.required}%`;
    }

    for (const button of panel.querySelectorAll('[data-contract]')) {
      button.addEventListener('click', () => {
        const contractId = button.dataset.contract;
        state = {
          contractId,
          awarded: false,
          bonusAwarded: 0,
          progress: progress(contractId, observe(game.grid)),
        };
        panel.querySelector('.forge-options').remove();
        document.body.classList.remove('forge-choosing');
        beginCapture(contractId);
        render();
      });
    }

    const originalExecute = game.executeChain.bind(game);
    const originalCheckWinLose = game.checkWinLose.bind(game);
    let deferTerminalCheck = false;

    game.checkWinLose = function checkForgeWinLose() {
      if (deferTerminalCheck) return;
      originalCheckWinLose();
    };

    game.executeChain = function executeForgeChain() {
      if (!state) return;
      const captureSource = game.authoringCapture;
      deferTerminalCheck = true;
      originalExecute();
      window.setTimeout(() => {
        try {
          const next = advance(state, game.grid);
          const bonus = next.bonusAwarded - state.bonusAwarded;
          state = next;
          if (bonus > 0) game.score += bonus;
          if (capture && captureSource) {
            const recorded = captureSource.chains[capture.moves.length];
            capture.moves.push({
              move: game.moves,
              tiles: recorded.tiles,
              chainPoints: recorded.points,
              bonus,
              scoreAfter: game.score,
              progress: state.progress,
            });
          }
        } finally {
          deferTerminalCheck = false;
        }
        game.updateUI();
        originalCheckWinLose();
        game.render();
        if (capture && captureSource) persistCapture();
        render();
      }, 230);
    };

    const originalReload = game.reloadCurrentLevel.bind(game);
    game.reloadCurrentLevel = function reloadForgeLevel() {
      const contractId = state && state.contractId;
      originalReload();
      if (contractId) {
        window.setTimeout(() => {
          state = {
            contractId,
            awarded: false,
            bonusAwarded: 0,
            progress: progress(contractId, observe(game.grid)),
          };
          beginCapture(contractId);
          render();
        }, 20);
      }
    };

    // Standard recording replay does not know this prototype-only bonus, so
    // completed runs are redirected into the separate Forge prototype store.
    // Standard undo does not save contract state and remains disabled.
    game.undo = () => {};
    const undo = document.getElementById('undoBtn');
    if (undo) {
      undo.disabled = true;
      undo.title = 'Undo is disabled in this throwaway contract prototype';
      new MutationObserver(() => {
        if (!undo.disabled) undo.disabled = true;
      }).observe(undo, { attributes: true });
    }
  }

  waitForGame();
}());
