'use strict';
const { stageDecision, admit, compareFitness } = require('../ruler/core');

// The owner's stricter speed interval is an additional gate; all statistics
// and the underlying win-first order remain the imported ruler's unchanged.
function promising(s) { return stageDecision(s, 3) === 'NOMINATE' && s.netWins >= 0 && s.meanMovesSaved > 0; }
function accepted(s) { return s.netWins >= 0 && s.meanMovesSaved > 0 && s.moveCi95[0] > 0; }
function disposition(gate, recheck) {
  if (!promising(gate)) return 'NOT_PROMISING';
  if (!recheck) return 'PROMISING_UNRECHECKED';
  return admit(gate, recheck).admitted && accepted(recheck) ? 'ACCEPTED' : 'NOT_ACCEPTED';
}
module.exports = { promising, accepted, disposition, compareFitness };
