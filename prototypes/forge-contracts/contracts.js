// PROTOTYPE — pure contract state for the Forge Contracts playtest.

(function expose(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ForgeContracts = api;
}(typeof window === 'undefined' ? null : window, () => {
  const CONTRACTS = Object.freeze({
    spread: Object.freeze({
      id: 'spread',
      name: 'Spread Forge',
      description: 'Hold four 1,024 tiles at once',
      bonus: 15000,
    }),
    tower: Object.freeze({
      id: 'tower',
      name: 'Tower Forge',
      description: 'Create one tile worth exactly 4,096',
      bonus: 24000,
    }),
  });

  function observe(grid) {
    const values = grid.flat().filter(Boolean).map((tile) => tile.value);
    return {
      exact1024: values.filter((value) => value === 1024).length,
      exact4096: values.includes(4096),
      maximum: values.length ? Math.max(...values) : 0,
      towerProgress: values.filter((value) => value <= 4096).reduce((maximum, value) => Math.max(maximum, value), 0),
    };
  }

  function progress(contractId, observation) {
    if (contractId === 'spread') {
      return {
        current: Math.min(observation.exact1024, 4),
        required: 4,
        label: `${observation.exact1024}/4 tiles worth 1,024`,
        complete: observation.exact1024 >= 4,
      };
    }
    if (contractId === 'tower') {
      return {
        current: observation.towerProgress,
        required: 4096,
        label: `${observation.towerProgress.toLocaleString()}/4,096 exact tower`,
        complete: observation.exact4096,
      };
    }
    throw new Error(`unknown forge contract: ${contractId}`);
  }

  function advance(state, grid) {
    if (state.awarded) return state;
    const nextProgress = progress(state.contractId, observe(grid));
    return {
      ...state,
      progress: nextProgress,
      awarded: nextProgress.complete,
      bonusAwarded: nextProgress.complete ? CONTRACTS[state.contractId].bonus : 0,
    };
  }

  return { CONTRACTS, advance, observe, progress };
}));
