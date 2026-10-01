(() => {
  const $ = (id) => document.getElementById(id);
  const model = { data: null, index: 0 };
  const note = $('note');
  const label = (move) => move ? `+${move.points.toLocaleString()} points · survivor ${move.endingValue.toLocaleString()}${Number.isInteger(Math.log2(move.endingValue)) ? ' ✓ power of 2' : ''}` : '';
  function board(boardBefore, chain, gridW) {
    const chosen = new Set((chain || []).map(({ x, y }) => `${x},${y}`));
    const node = document.createElement('div'); node.className = 'board'; node.style.gridTemplateColumns = `repeat(${gridW}, 1fr)`;
    boardBefore.flatMap((row, y) => row.map((tile, x) => ({ tile, x, y }))).forEach(({ tile, x, y }) => {
      const cell = document.createElement('div'); cell.className = `tile${tile ? '' : ' empty'}${chosen.has(`${x},${y}`) ? ' chain' : ''}${tile?.blocker === 'bomb' ? ' bomb' : ''}`;
      cell.textContent = tile ? `${tile.blocker === 'bomb' ? '💣' : ''}${tile.value}` : '';
      node.append(cell);
    }); return node;
  }
  function panel(session) {
    const move = session.moves[model.index]; const box = document.createElement('article'); box.className = 'panel';
    const h2 = document.createElement('h2'); h2.textContent = session.label; box.append(h2);
    const facts = document.createElement('div'); facts.className = 'metrics';
    facts.textContent = move ? `${label(move)} · ${move.decision.reason.replaceAll('-', ' ')}` : `No move ${model.index + 1}: ${session.terminal.reason}.`;
    box.append(facts);
    if (move) box.append(board(move.boardBefore, move.chain, model.data.gridW));
    const footer = document.createElement('div'); footer.className = 'terminal'; footer.textContent = `Result: ${session.terminal.result} — ${session.terminal.reason}; ${session.terminal.finalScore.toLocaleString()} points in ${session.terminal.movesUsed} moves.`; box.append(footer);
    return box;
  }
  function render() {
    const { data } = model; const max = Math.max(data.champion.moves.length, data.powerOfTwo.moves.length);
    $('comparison').replaceChildren(panel(data.champion), panel(data.powerOfTwo));
    $('step').textContent = `Move ${Math.min(model.index + 1, max)} of ${max}`;
    $('previous').disabled = model.index === 0; $('next').disabled = model.index >= max - 1;
    note.textContent = `Level ${data.level}, seed ${data.seed}. Gold tiles are the chain selected on the board before the move.`;
  }
  async function load(event) {
    event?.preventDefault(); note.textContent = 'Replaying both policies…'; $('comparison').replaceChildren();
    try { const response = await fetch(`/api/policy-lab?level=${$('level').value}&seed=${$('seed').value}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); model.data = data; model.index = 0; render(); }
    catch (error) { note.textContent = `Could not load replay: ${error.message}`; }
  }
  $('load-form').addEventListener('submit', load); $('previous').addEventListener('click', () => { model.index -= 1; render(); }); $('next').addEventListener('click', () => { model.index += 1; render(); }); load();
})();
