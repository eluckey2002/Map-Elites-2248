// Recompute the cited archive's stored score comparisons; no new game runs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { pairedLift } = require(path.join(root, 'solver/policy-eval'));
const file = 'solver/map-elites-output/archive.json';
const bytes = fs.readFileSync(path.join(root, file));
const archive = JSON.parse(bytes);
console.log(JSON.stringify({
  file, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  fitnessDefinition: archive.explanation.fitness,
  representatives: archive.representatives.map(row => ({
    policyId: row.policyId, storedHoldoutLift: row.holdout.lift,
    recomputedHoldoutLift: pairedLift(row.holdout.scores, archive.reference.holdout.scores,
      { levelCount: archive.config.holdout.levels.length,
        seedCount: archive.config.holdout.seeds.length }).lift,
  })),
}, null, 2));
