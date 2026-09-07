---
run: 2026-09-07T01-48-15Z-synthetic-descriptor-validation-harness
routing:
  pack: orch-code-pack
---

# Synthetic descriptor validation harness

## Objective

A committed experiment-local harness exposes a deterministic 3x3 synthetic
policy family whose two controls separately shift beam-relative capture greed
and early-versus-late harvesting, reports correctly defined half-score timing
against the full move budget, and fails closed before producing evidence when
registration, coverage, identity, or artifact integrity is absent.

## Non-goals

- Execute, interpret, or report the generalizing synthetic experiment.
- Claim that the beam-relative maximum is the exhaustive legal-chain maximum.
- Formalize either descriptor as a production or MAP-Elites axis.
- Change `src/game.js`, `solver/engine.js`, `solver/level-author.js`,
  `solver/bot.js`, shipped levels, targets, scoring, or the champion.
- Edit `EVIDENCE_LEDGER.md`, `CURRENT.md`, prior protocols, receipts, or
  accepted artifacts.
- Repair the four known repository-wide test failures.

## Acceptance

1. **Correct episode descriptor.** A public harness function reports the first
   move reaching half of terminal score divided by the level's full move
   budget, and a fixture ending before budget proves it does not divide by
   moves used.
   - oracle: `node --test solver/tests/syntheticDescriptorValidation.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
2. **Two distinct synthetic controls.** On fixed literal states, changing only
   greed center shifts the selected beam-relative capture ratio, while changing
   only timing slope changes the early/late target schedule around the same
   center. The complete exported subject grid is exactly three greed centers by
   three signed timing slopes with stable identities.
   - oracle: `node --test solver/tests/syntheticDescriptorValidation.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
3. **Real legal candidate seam.** Synthetic selection consumes
   `solver/engine.js#findGreedyChains`, widens only with legal prefixes of those
   returned chains, returns a legal chain deterministically, and records the
   chosen score divided by the maximum score in that exact pool as
   `beamGreedRatio`.
   - oracle: `node --test solver/tests/syntheticDescriptorValidation.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; must cross the run gate
4. **Experiment ordering fails closed.** Invoking the real CLI without a
   committed registered protocol exits nonzero and creates no output; output
   overwrite is refused.
   - oracle: `node --test solver/tests/syntheticDescriptorValidation.test.js`
   - oracle_class: deterministic
   - provenance: authored-here through the production CLI; must cross the run gate
5. **Artifact integrity reads the real artifact.** The production verifier
   accepts a fixed good fixture and rejects a one-field tampered twin through
   the same path; missing subjects/cells, non-finite descriptors, illegal
   outcomes, duplicate coverage, source drift, and identity mismatch fail
   closed.
   - oracle: `node --test solver/tests/syntheticDescriptorValidation.test.js`
   - oracle_class: deterministic
   - provenance: authored-here; permanent negative test required
6. **No premature evidence.** Tests use fixed hand-built or tiny deterministic
   fixtures only; no shipped-level population, fresh seed range, controls, or
   confirmation artifact is executed or written by this run.
   - oracle: inspection of the test fixtures and `git status --short`
   - oracle_class: judged
   - provenance: authored-here; gate re-verifies
7. **Protected surfaces and baseline remain exact.** The protected files named
   in non-goals have no diff. The full suite remains 361 tests / 357 pass with
   exactly the two receipt failures and two Universe Map failures recorded in
   the investigation packet.
   - oracle: `git diff --name-only 9d125e8 -- src/game.js solver/engine.js solver/level-author.js solver/bot.js EVIDENCE_LEDGER.md CURRENT.md` and `node --test solver/tests/*.test.js`
   - oracle_class: deterministic
   - provenance: pre-existing Git and Node runners
8. **Check scope is explicit.** `docs/CHECK-CARDS.md` contains one card for the
   experiment-local verifier, including its exact scope, crafted-bypass test,
   enforcement rung, decay path, and enumerated `Does NOT catch` limits.
   - oracle: gate-check review plus `rg -n "Synthetic descriptor validation" docs/CHECK-CARDS.md`
   - oracle_class: judged for the card; deterministic for presence
   - provenance: authored-here; gate re-verifies
9. **Repository hygiene.** Formatting is clean and the code-pack lens finds no
   correctness, contract, scope, or shape defect.
   - oracle: `git diff --check` plus the orch-code-pack lens at the single run gate
   - oracle_class: deterministic for diff check; judged for lens
   - provenance: pre-existing plus authored-here gate

## Binding constraints

- Name the approximation `beamGreedRatio` and the pool maximum
  `beamMaxPoints`; never export either as `greedRatio` or `maxPointsAny`.
- The greed schedule is `clamp(greedCenter + timingSlope * (2p - 1))`, where
  `p` is normalized move position across the full budget. Greed center and
  timing slope are separate subject fields and neither is inferred from the
  observed descriptors.
- The subject grid is factorial: greed centers `[0.35, 0.60, 0.85]` crossed
  with timing slopes `[-0.25, 0, 0.25]`.
- Candidate widening may use only prefixes of chains returned by the public
  bounded beam seam; it may not call exhaustive enumeration.
- The runner stops on the actual game terminal conditions and computes
  half-score timing only after terminal score is known.
- The CLI uses `solver/experiment-guard.js` before any game execution, stamps
  registration into output, refuses overwrite, and emits a self-identifying
  canonical JSON artifact.
- One production verifier owns valid artifact, broken twin, coverage, source
  closure, and identity checks; no test-only verifier.
- Preserve unrelated user work and compare baseline failures by test identity,
  not count.

## Evidence

- Baseline revision: `9d125e8c94f41282388a90402b1fba0b22ae83a8`.
- Investigation packet:
  `.orch/tickets/2026-09-07-adhoc-synthetic-descriptor-validation-investigation/INV-0001.md`,
  SHA-256 `ed993bf19514b9cd904184bbd4aaab40b9ca1197dd137aac8e9b2300edb6c962`.
- Source identities at baseline:
  - `solver/engine.js` — `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`
  - `solver/bot.js` — `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`
  - `solver/policy-eval.js` — `217d8691742ca6d0176acd49f7915117afd44d2b3b817adb88fcb35d4833bcfc`
  - `solver/behavior-descriptors.js` — `6e20bc6294003b75ff29f11d367b864a1d97650c1bcd9068eeaa537494a70987`
  - `src/game.js` — `22ebc237b6750fff04251c1b123cc6be749b8b75f3146d6e42576c509dc97bf2`
  - `experiments/README.md` — `515f125ac95759577e23b22c996bb9528dd8e301e4dd40d2924d9758d5d68cd7`
  - `experiments/SEEDS.md` — `927e336d092c0d8574acd50b09820d537108789026891c2fd335b05da4a6c16a`

## Affected surfaces

- `experiments/RESULT-0029/run.js` (new)
- `experiments/RESULT-0029/verify.js` (new)
- `solver/tests/syntheticDescriptorValidation.test.js` (new)
- `docs/CHECK-CARDS.md`
- run worklog and ticket state under `.orch/`

## Exemplars

- `experiments/RESULT-0024/run.js` at baseline revision: imitate protocol-first
  CLI guarding, canonical artifact self-identity, source closure, and
  refuse-overwrite behavior.
- `solver/tests/behaviorDescriptors.test.js` at baseline revision: imitate a
  literal worked fixture that drives the production seam and fails if the
  measurement disappears.
- `docs/CHECK-CARDS.md`, card `Stranded-cell pressure through the real post-move
  seam`: imitate explicit granularity, scope, blind spots, crafted bypass,
  enforcement, and decay fields.

## Bound

- One tracer ticket and one correction pass.
- No controls, pilot, confirmation, or shipped-level synthetic games.
- `plan_gate: false`; the user confirmed this continuation after the handoff
  orientation, and this spec narrows rather than expands it.

## Target repository

`/private/tmp/2248-synthetic-descriptor-validation-20260906` on branch
`work/synthetic-descriptor-validation-20260906`. This is an isolated temporary
worktree because another Codex session remains attached to the canonical root
checkout. It will not merge or rebase onto `main` automatically.

## Standards owner by pointer

- `AGENTS.md`
- `EVIDENCE_LEDGER.md`
- `experiments/README.md`
- `docs/CHECK-CARDS.md`

## Acceptance as runnable checks

```bash
node --test solver/tests/syntheticDescriptorValidation.test.js
node --test solver/tests/*.test.js
git diff --name-only 9d125e8 -- src/game.js solver/engine.js solver/level-author.js solver/bot.js EVIDENCE_LEDGER.md CURRENT.md
git diff --check
```

## Risks

- A schedule unit test could pass while the real chooser ignores it; the
  positive fixture must observe the selected chain and realized ratio through
  `chooseSyntheticMove`.
- A verifier can validate its own reconstructed values without reading the
  artifact; the permanent tampered twin must mutate serialized artifact input
  and cross the exported production verifier.
- Candidate pools can collapse on some boards. The code harness records the
  realized pool and descriptors; the successor research protocol must make
  coverage a pre-measurement stop condition.
- Stopping on target makes early wins shorter episodes. Using full move budget
  in the timing denominator is therefore load-bearing and explicitly tested.

## Assumptions

- `findGreedyChains` remains the affordable public bounded candidate seam.
- Legal prefixes of a legal returned chain remain legal actions under the
  engine's existing chain rule.
- `RESULT-0029` and seed ranges beginning at 32,000,000 and 33,000,000 remain
  unused until the successor research spec freezes them.
