// Inspect one recorded position through the live policy and exact chain search.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const engine = require(path.join(root, 'solver/engine'));
const { analyzeMove } = require(path.join(root, 'solver/bot'));
const dir = path.join(root, 'pilots/HUMAN-PILOT-0002');
const candidate = JSON.parse(fs.readFileSync(path.join(dir, 'candidate.json'))).candidates[0];
const recording = JSON.parse(fs.readFileSync(path.join(dir, 'recordings', fs.readdirSync(path.join(dir, 'recordings'))[0])));
const rng = engine.makeRng(recording.seed);
const state = engine.createLevelState(candidate, rng);
for (const recorded of recording.chains.slice(0, 19)) {
  const chain = recorded.tiles.map(t => state.grid[t.y][t.x]);
  engine.executeChain(state, chain);
  engine.applyGravity(state);
  engine.spawnNewTiles(state, rng);
  engine.tickBlockers(state);
}
const options = { lookaheadRngFactory: () => engine.makeRng(987654321 + 19) };
const analysis = analyzeMove(state, options);
const full = analyzeMove(state, { ...options, params: { offerFull: 1 } });
const exact = engine.findBestChain(state);
const selected = analysis.candidates.find(c => c.id === analysis.selectedId);
const fullSelected = full.candidates.find(c => c.id === full.selectedId);
console.log(JSON.stringify({
  subject: 'HUMAN-PILOT-0002, immediately before recorded move 20',
  scoreBefore: state.score, target: state.targetScore,
  budget: state.maxMoves, movesAlreadyUsed: state.moves,
  pointsNeeded: state.targetScore - state.score,
  humanPoints: recording.chains[19].points,
  selected: { reason: analysis.reason, immediate: selected.immediatePoints,
    policyScore: selected.policyScore, contributions: selected.contributions },
  maxImmediateInDefaultPool: Math.max(...analysis.candidates.map(c => c.immediatePoints)),
  selectedWithOfferFull: fullSelected.immediatePoints,
  maxImmediateWithOfferFull: Math.max(...full.candidates.map(c => c.immediatePoints)),
  exactBestPoints: exact.points,
  exactChain: exact.chain.map(({x,y,value}) => ({x,y,value})),
  exactImmediatelyWins: state.score + exact.points >= state.targetScore,
  defaultImmediatelyWins: state.score + selected.immediatePoints >= state.targetScore,
}, null, 2));
