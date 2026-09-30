(function exposeEvidenceParser(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BotVisionEvidence = api;
}(typeof globalThis === 'undefined' ? null : globalThis, () => {
  'use strict';

  function integer(value, name, minimum, maximum) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new Error(`${name} is not a valid saved value`);
    }
    return value;
  }

  function chain(value, name) {
    if (!Array.isArray(value)) throw new Error(`${name} must be a list of coordinates`);
    return value.map((tile) => ({
      x: integer(tile?.x, `${name} x`, 0, 99),
      y: integer(tile?.y, `${name} y`, 0, 99),
    }));
  }

  function restorePlan(record) {
    if (!record || typeof record !== 'object') throw new Error('Choose a Bot Vision evidence file');
    if (record.schemaVersion !== 1) throw new Error('This evidence file uses an unsupported format');
    if (typeof record.sessionIdentity !== 'string' || !record.sessionIdentity) {
      throw new Error('This evidence file is missing its session identity');
    }
    const level = integer(record.level, 'level', 1, 9999);
    const seed = integer(record.seed, 'seed', 0, 0xffffffff);
    const moveIndex = integer(record.moveIndex, 'move index', 0, 9999);
    const manualChain = chain(record.manualChain || [], 'manual chain');
    const comment = typeof record.comment === 'string' ? record.comment : '';
    if (!record.takeover) {
      return { sessionIdentity: record.sessionIdentity, level, seed, moveIndex, manualChain, comment, takeoverRequest: null };
    }
    const startMoveIndex = integer(record.takeover.startMoveIndex, 'takeover start move', 0, 9999);
    if (!Array.isArray(record.takeover.chains)) throw new Error('takeover chains must be a list of routes');
    const chains = record.takeover.chains.map((entry, index) => chain(entry, `takeover chain ${index + 1}`));
    return {
      sessionIdentity: record.sessionIdentity,
      level,
      seed,
      moveIndex,
      manualChain,
      comment,
      takeoverRequest: { levelNumber: level, seed, moveIndex: startMoveIndex, chains },
    };
  }

  return { restorePlan };
}));
