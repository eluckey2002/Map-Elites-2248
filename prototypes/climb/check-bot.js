// Plays one check board with one of the step-1/step-2 bots and prints
// {seed, top, moves, s}. Runs used for TD6-RUN.md:
//   node check-bot.js la3 <seed>
//   node check-bot.js td6 <seed> model.bin
//   node check-bot.js td6-la3 <seed> model.bin
//   node check-bot.js tds <seed> model.bin      (staged learner, tds.js)
//   node check-bot.js tds-la3 <seed> model.bin
//   node check-bot.js la4 <seed>
//   node check-bot.js la5 <seed>
//   node check-bot.js la3-odd+stone+alive <seed>   (3 deep with habits)
//   node check-bot.js h3 <seed> [weights a|b|c] [drops]   (hand-made board score, heur.js)
//   node check-bot.js h4 / h5 <seed> [weights] [drops]
const fs = require('fs');
const P = require('./players');
const {lookaheadChooser} = require('./lookahead');
const td6 = require('./td6');
const tds = require('./tds');
const heur = require('./heur');

const SETTINGS = {poolSize: 7, poolStart: 8, fallOdds: 'equal'};
const LA3 = {depth: 3, widths: [8, 6, 4], samples: [4, 2], leafPlays: 2};

function loadWeights(file, n = td6.TUPLES.length * td6.SIZE) {
  const buf = Buffer.alloc(n * 4);
  const fd = fs.openSync(file, 'r');
  fs.readSync(fd, buf, 0, n * 4, 0);
  fs.closeSync(fd);
  return new Float32Array(buf.buffer, buf.byteOffset, n);
}

function bestTile(s) {
  let b = 0;
  for (const row of s.board) for (const c of row) if (c && !c.stone && Number.isInteger(Math.log2(c.v))) b = Math.max(b, c.v);
  return b;
}

const [bot, seedArg, model] = process.argv.slice(2);
// la3-<habits>: 3 deep with habits joined by '+': odd (no odd tiles),
// stone (no stones), alive (score lines by moves survived).
function habits(list) {
  const o = {};
  for (const h of list.split('+')) {
    if (h === 'odd') o.noOdd = true;
    else if (h === 'stone') o.noStone = true;
    else if (h === 'alive') o.objective = 'moves';
    else throw new Error('habits are odd, stone, alive');
  }
  return o;
}
function heurLeaf() {
  const w = heur.WEIGHTS[model || 'b'];
  if (!w) throw new Error('weights must be ' + Object.keys(heur.WEIGHTS).join(', '));
  return heur.leaf(w, Number(process.argv[5] || 1));
}
const seed = Number(seedArg);
const chooser = bot === 'la3' ? lookaheadChooser(LA3)
  : bot === 'td6' ? td6.tdChooser(loadWeights(model))
  : bot === 'td6-la3' ? lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leaf: td6.leaf(loadWeights(model))})
  : bot === 'tds' ? tds.tdChooser(loadWeights(model, tds.STAGES * tds.N))
  : bot === 'tds-la3' ? lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leaf: tds.leaf(loadWeights(model, tds.STAGES * tds.N))})
  : bot === 'la4' ? lookaheadChooser({depth: 4, widths: [8, 6, 4, 3], samples: [4, 2, 2], leafPlays: 2})
  : bot === 'la5' ? lookaheadChooser({depth: 5, widths: [8, 6, 4, 3, 3], samples: [4, 2, 2, 2], leafPlays: 2})
  : bot.startsWith('la3-') ? lookaheadChooser({...LA3, ...habits(bot.slice(4))})
  : bot === 'h3' ? lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leaf: heurLeaf()})
  : bot === 'h4' ? lookaheadChooser({depth: 4, widths: [8, 6, 4, 3], samples: [4, 2, 2], leaf: heurLeaf()})
  : bot === 'h5' ? lookaheadChooser({depth: 5, widths: [8, 6, 4, 3, 3], samples: [4, 2, 2, 2], leaf: heurLeaf()})
  : null;
if (!chooser) throw new Error('bot must be la3, la4, la5, td6, td6-la3, tds, tds-la3, h3, h4 or h5');
const t = Date.now();
let top = 0;
const r = P.playRandomGame(SETTINGS, seed, {chooser, onMove: (x, y) => { top = Math.max(top, bestTile(y)); }});
console.log(JSON.stringify({seed, top, moves: r.state.moves, s: Math.round((Date.now() - t) / 1000)}));
