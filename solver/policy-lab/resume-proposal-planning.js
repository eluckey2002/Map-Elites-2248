'use strict';
// Historical board reader. This separate process plays no games and is never
// imported by the worker or the measurement loop.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {syncDirectory} = require('./journaled-pool');
const ROOT = path.resolve(__dirname, '../..');
const coordinates = [
  ['occupancy', [0.001, 1, 8, 128, 1000000]],
  ['width', [28, 32, 40, 48, 64]],
  ['pathWidth', [10, 12, 16, 20, 24]],
];
function specification(round) {
  if (!Number.isInteger(round) || round < 1 || round > 15) throw new Error('registered proposal round must be 1..15');
  const [coordinate, doses] = coordinates[Math.floor((round - 1) / 5)];
  const dose = doses[(round - 1) % 5];
  const policy = coordinate === 'occupancy' ? {kind: 'lab', weights: {occupancy: dose}} : {kind: 'lab', params: {[coordinate]: dose}};
  const hypothesis = coordinate === 'occupancy'
    ? `Offering untrimmed chains with occupancy price ${dose} may recover useful chains while charging their off-lattice occupancy cost.`
    : coordinate === 'width'
      ? `Retaining ${dose} candidates may preserve useful chains omitted by the immediate-points cut and reduce moves to target.`
      : `Keeping ${dose} partial paths per start may find useful chains absent from the champion pool and reduce moves to target.`;
  return {round, coordinate, dose, kind: 'generation', hypothesis, policy};
}
function plan(round, {root = ROOT} = {}) {
  const spec = specification(round);
  const file = 'solver/policy-lab/runs/generation.json';
  const source = fs.readFileSync(path.join(root, file));
  const generation = JSON.parse(source);
  if (generation.branch !== 'GENERATION') throw new Error('registered generation branch differs');
  const boards = generation.moves.filter(m => m.ownerFaster && m.diagnostic);
  if (boards.length < 3) throw new Error('fewer than three historical owner-faster boards');
  const chosen = Array.from({length: 3}, (_, i) => boards[((round - 1) * 3 + i) % boards.length]);
  if (new Set(chosen.map(b => `${b.file}/${b.move}`)).size !== 3) throw new Error('duplicate planning board');
  const configPath = `solver/policy-lab/runs/resume/candidates/round-${String(round).padStart(2, '0')}.js`;
  const full = path.join(root, configPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  const code = `'use strict';\n// ${spec.hypothesis}\nmodule.exports = ${JSON.stringify(spec.policy, null, 2)};\n`;
  const fd = fs.openSync(full, 'wx');
  try {fs.writeFileSync(fd, code); fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
  syncDirectory(path.dirname(full));
  return {...spec, configPath, configHash: crypto.createHash('sha256').update(code).digest('hex'),
    historicalSource: {file, sha256: crypto.createHash('sha256').update(source).digest('hex')},
    filesRead: [file], boards: chosen};
}
if (require.main === module) {
  try {console.log(JSON.stringify(plan(Number(process.argv[2]))));}
  catch (e) {console.error(e.stack); process.exitCode = 1;}
}
module.exports = {coordinates, specification, plan};
