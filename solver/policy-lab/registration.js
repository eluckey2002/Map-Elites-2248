'use strict';
const { execFileSync } = require('node:child_process');

function assertRegistration(root, commit, plan) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('registration is not a full commit identity');
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try { git(['merge-base', '--is-ancestor', commit, 'HEAD']); }
  catch { throw new Error('registration commit is not reachable in reviewed HEAD ancestry'); }
  const first = git(['log', '--diff-filter=A', '--format=%H', '--', plan]).trim().split('\n').at(-1);
  if (first !== commit) throw new Error('registration identity does not match the first addition of the plan');
  return git(['show', `${commit}:${plan}`]);
}
module.exports = { assertRegistration };
