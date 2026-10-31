// Plays one check board with one of the step-1/step-2 bots and prints
// {seed, top, moves, s}. Runs used for TD6-RUN.md:
//   node check-bot.js la3 <seed>
//   node check-bot.js td6 <seed> model.bin
//   node check-bot.js td6-la3 <seed> model.bin
//   node check-bot.js tds <seed> model.bin      (staged learner, tds.js)
//   node check-bot.js tds-la3 <seed> model.bin
//   node check-bot.js la4 <seed>
const fs = require('fs');
const P = require('./players');
const {lookaheadChooser} = require('./lookahead');
const td6 = require('./td6');
const tds = require('./tds');

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
const seed = Number(seedArg);
const chooser = bot === 'la3' ? lookaheadChooser(LA3)
  : bot === 'td6' ? td6.tdChooser(loadWeights(model))
  : bot === 'td6-la3' ? lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leaf: td6.leaf(loadWeights(model))})
  : bot === 'tds' ? tds.tdChooser(loadWeights(model, tds.STAGES * tds.N))
  : bot === 'tds-la3' ? lookaheadChooser({depth: 3, widths: [8, 6, 4], samples: [4, 2], leaf: tds.leaf(loadWeights(model, tds.STAGES * tds.N))})
  : bot === 'la4' ? lookaheadChooser({depth: 4, widths: [8, 6, 4, 3], samples: [4, 2, 2], leafPlays: 2})
  : null;
if (!chooser) throw new Error('bot must be la3, la4, td6, td6-la3, tds or tds-la3');
const t = Date.now();
let top = 0;
const r = P.playRandomGame(SETTINGS, seed, {chooser, onMove: (x, y) => { top = Math.max(top, bestTile(y)); }});
console.log(JSON.stringify({seed, top, moves: r.state.moves, s: Math.round((Date.now() - t) / 1000)}));
