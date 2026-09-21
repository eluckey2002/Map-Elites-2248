const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const QUALIFICATION_TESTS = Object.freeze([
  'experiments/RESULT-0040/result.test.js',
  'experiments/RESULT-0040/run.test.js',
  'experiments/RESULT-0040/verify.test.js',
  'solver/tests/behaviorDescriptors.test.js',
  'solver/tests/exact-score.test.js',
  'solver/tests/exactGreedDenominator.test.js',
  'solver/tests/greedDescriptorScreen.test.js',
]);
const SOURCE_ENTRY_PATHS = Object.freeze([
  'experiments/RESULT-0040/manifest.js',
  'experiments/RESULT-0040/subject.js',
  'experiments/RESULT-0040/result.js',
  'experiments/RESULT-0040/recompute.js',
  'experiments/RESULT-0040/run.js',
  'experiments/RESULT-0040/verify.js',
  'experiments/RESULT-0040/qualify.js',
  'solver/exact-greed-worker.js',
  ...QUALIFICATION_TESTS,
]);
const SOURCE_DOCS = Object.freeze([
  'experiments/RESULT-0040/registered-protocol.md',
  'experiments/RESULT-0040/closeout-contract.json',
]);

function resolveLocalRequire(fromRelative, request) {
  if (!request.startsWith('.')) return null;
  const base = path.resolve(ROOT, path.dirname(fromRelative), request);
  const candidates = [base, `${base}.js`, path.join(base, 'index.js')];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) throw new Error(`cannot resolve ${request} from ${fromRelative}`);
  const relative = path.relative(ROOT, resolved).split(path.sep).join('/');
  if (relative.startsWith('../')) throw new Error(`dependency escapes repository: ${request}`);
  return relative;
}

function sourcePaths() {
  const seen = new Set();
  const pending = [...SOURCE_ENTRY_PATHS];
  while (pending.length) {
    const relative = pending.pop();
    if (seen.has(relative)) continue;
    seen.add(relative);
    const text = fs.readFileSync(path.join(ROOT, relative), 'utf8');
    const requires = text.matchAll(/require\(['"]([^'"]+)['"]\)/g);
    for (const match of requires) {
      const dependency = resolveLocalRequire(relative, match[1]);
      if (dependency && !seen.has(dependency)) pending.push(dependency);
    }
  }
  return [...new Set([...SOURCE_DOCS, ...seen])].sort();
}

function qualificationCommand() {
  return [process.execPath, '--test', ...QUALIFICATION_TESTS];
}

module.exports = {
  QUALIFICATION_TESTS,
  ROOT,
  SOURCE_DOCS,
  SOURCE_ENTRY_PATHS,
  qualificationCommand,
  sourcePaths,
};
