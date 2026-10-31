// Plays the 2-deep look-ahead on training seeds and writes every board it
// reaches (one JSON game state per line), for training that starts mid-game.
// node collect-boards.js out.jsonl fromSeed count
const fs = require('fs');
const P = require('./players');
const {lookaheadChooser} = require('./lookahead');

const SETTINGS = {poolSize: 7, poolStart: 8, fallOdds: 'equal'};
const [out, from, count] = process.argv.slice(2);
const chooser = lookaheadChooser({depth: 2, widths: [8, 6], samples: [4], leafPlays: 2});
for (let seed = Number(from); seed < Number(from) + Number(count); seed++) {
  const lines = [];
  P.playRandomGame(SETTINGS, seed, {chooser, onMove: (before, after) => { if (!after.over) lines.push(JSON.stringify(after)); }});
  fs.appendFileSync(out, lines.join('\n') + '\n');
}
