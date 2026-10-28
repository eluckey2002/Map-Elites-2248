// Choice G: simple players play the default settings before evan does, to
// catch a game that is far too short or never ends. Also a speed check.
// Usage: node prototypes/climb/check-defaults.js [games]
const E = require('./engine');
const {playRandomGame, greedyChain} = require('./players');

const games = Number(process.argv[2] || 200);
const pct = (xs, p) => xs.slice().sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))];

function run(name, chooser, n) {
  const rows = [];
  const t0 = Date.now();
  for (let g = 0; g < n; g++) {
    const {state, capped} = playRandomGame({}, 1 + g, {chooser, maxMoves: 5000});
    rows.push({...E.summary(state), capped});
  }
  const ms = Date.now() - t0;
  const col = k => rows.map(r => r[k]);
  const line = k => `${k}: median ${pct(col(k), 0.5)}, 10%-90% ${pct(col(k), 0.1)}-${pct(col(k), 0.9)}, max ${Math.max(...col(k))}`;
  return {
    player: name, games: n, neverEnded: rows.filter(r => r.capped).length,
    moves: line('moves'), climbs: line('climbs'), stones: line('stones'), oddTiles: line('oddTiles'),
    msPerGame: +(ms / n).toFixed(1),
  };
}

const out = [run('random', undefined, games), run('greedy (longest chain)', s => greedyChain(s), Math.min(games, 100))];
console.log(JSON.stringify(out, null, 2));
