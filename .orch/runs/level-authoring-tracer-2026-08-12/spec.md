# Spec: level-authoring tracer

- **run:** `level-authoring-tracer-2026-08-12`
- **objective:** The repository can turn one declared level shape and pacing intent into a measured-target candidate, open that candidate as a seeded playable level, and persist a replayable human playthrough without changing the 50 shipped levels.
- **routing:**
  - **pack:** `orch-code-pack`

## Non-goals

- Shipping candidate 51 into `src/game.js` `LEVELS` or changing any shipped target, rule, bot policy, or curve gate.
- Producing five accepted levels before the first end-to-end authoring seam receives owner review.
- Adopting a permanent Chapter 6 demand curve; the first candidate's demand is proposal data.
- Building transcript playback, bot/human comparison visualization, account storage, or a production server.
- Updating `EVIDENCE_LEDGER.md` before a candidate outcome has been independently verified and accepted.

## Acceptance

1. A checked-in shape manifest can declare level number, demand, moves, minimum chain, grid dimensions, and blockers but cannot declare target or tile scale; one command deterministically derives the chapter tile scale, measures achievable score on fitting seeds, rounds the target by the shipped policy, and writes a canonical candidate plus a self-identifying receipt.
   - **runnable check:** `node --test solver/tests/levelAuthor.test.js` and `node solver/author-level.js --shape solver/candidate-shapes/level-51-split-channel.json --write`; require all named validation/derivation/identity controls to pass and both output files to be reproducible; **oracle_class:** deterministic.
2. A disjoint holdout of 300 seeds measures the written candidate, records win, lockout, bomb, and terminal-reason rates, and rejects incomplete runs, any lockout, bomb rate above 5%, or win rate below the shipped 20% floor; fitting outcomes are retained separately from holdout outcomes.
   - **runnable check:** `node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json`; require `PASS`, 300 holdout seeds beginning at 100000, zero lockouts, bomb rate at most 5%, and win rate at least 20%; negative-control tests must reject a tampered receipt and an invalid candidate; **oracle_class:** deterministic.
3. A local authoring server serves the existing game, exposes the candidate store read-only, and accepts only schema-valid playthrough JSON into `recordings/`; traversal, unknown candidate, malformed body, oversized body, and duplicate recording identity fail closed.
   - **runnable check:** `node --test solver/tests/authoringServer.test.js`; require valid serve/list/write behavior and every named failure-path control to pass; **oracle_class:** deterministic.
4. The browser can open `?candidate=51&seed=1`, initialize the arbitrary candidate through the same game path as shipped levels, expose the candidate/seed in the UI, record each legal chain as ordered coordinates and values, and submit exactly one outcome with score and moves on win or loss. Normal `?level=N`, restart, next-level, and level-select behavior remain shipped-level behavior.
   - **runnable checks:** `node --test solver/tests/customLevel.test.js solver/tests/levelJump.test.js`; then browser smoke at the served candidate URL demonstrating the candidate label, playable board, and recording status; **oracle_class:** deterministic for helpers and judged for the rendered smoke.
5. The shipped `LEVELS` array remains byte-equivalent as data, the live curve gate remains green, all solver tests pass, and the result has no whitespace errors or changes outside the authorized surfaces.
   - **runnable checks:** `node -e "const crypto=require('node:crypto'); const {LEVELS}=require('./src/game'); process.stdout.write(crypto.createHash('sha256').update(JSON.stringify(LEVELS)).digest('hex')+'\\n')"` must return `162fff8123052a8eb5a3584172115844d6ea4675657b6005e1120cdad80e7cff`; `node solver/verify-loop.js`; `node --test solver/tests/*.test.js`; `git diff --check`; scoped `git diff --name-only`; **oracle_class:** deterministic.
6. The implementation follows the repository's explicit CommonJS, small-module, static-call-site idiom; authoring-only behavior stays behind named seams and ordinary gameplay does not depend on the local server.
   - **oracle:** fresh code-pack lens judgment against the standards owner and craft reference; **oracle_class:** judged.

## Binding constraints

- `AGENTS.md`, then `EVIDENCE_LEDGER.md`, then `CURRENT.md` govern proof and planning language. Candidate measurements remain heuristic observations until separately admitted to the ledger.
- Reuse `solver/engine.js`, `solver/bot.js`, and the browser `Game` transition behavior; do not fork chain legality, scoring, gravity, blockers, spawn weights, or win/loss rules.
- Target is derived from measured achievable score times manifest demand and the existing `game-tester.js` rounding policy. Tile scale is `2 ** floor((level - 1) / 10)`. Moves and demand are explicit candidate design inputs; target and tile scale are forbidden manifest inputs.
- Candidate fitting uses seeds 0-149. Candidate verification uses 300 disjoint seeds beginning at 100000. Every receipt records the exact shape identity, code/input identities, seed ranges, score quantiles, target derivation, and terminal-rate counts.
- The first shape is a proposal for review, not a rule or shipped level. Its manifest may use demand `0.70` as a provisional Chapter 6 opener and must label that assumption.
- The authoring server binds localhost only, uses Node built-ins, never serves arbitrary filesystem paths, writes only schema-valid recordings under `recordings/`, and treats duplicate content identity as idempotent rather than destructive overwrite.
- Ordinary shipped play continues using `Math.random`; seeded RNG injection applies only to the custom candidate entry point.
- `src/game.js` may be refactored to accept an arbitrary level object, but `JSON.stringify(LEVELS)` must retain its frozen identity `162fff8123052a8eb5a3584172115844d6ea4675657b6005e1120cdad80e7cff`.
- TDD begins at a clean isolated worktree, writes a failing test before each production slice, and commits each green slice. No push or remote publication is authorized.
- Keep `EVIDENCE_LEDGER.md`, `HANDOFF.md`, and existing historical run artifacts unchanged. Planning records may change only as intake bookkeeping outside the code result identity.

## Evidence

- Completed intake `.orch/tickets/level-authoring-tracer-2026-08-12/intake-investigation.md`.
- Baseline Git revision `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6` with clean worktree and live checks: seven curve checks passed; 73 solver tests passed.
- `CURRENT.md` SHA-256 `8d3d731654b00213f4aaa92eb714bcb94fc8d2a4f64fefbe0653f951762824bc` at intake.
- `EVIDENCE_LEDGER.md` SHA-256 `365469662ef4c1a4905b00875243c2f98ba4d6bc3cf2281f92db9ca4c448fc6c` at intake, especially `DECISION-0003`, `RESULT-0008`, and Resume boundary.
- Historical authoring design SHA-256 `b605ff64e3f5aff5705014cc0b973c6110447b262f4ddc3502302620441ac02c`; retained as scope lineage, with superseded assumptions identified in the intake.
- Executable seams at intake: `solver/game-tester.js` SHA-256 `ca6884517556af122301ae29b5b3b0af8939a4b4dcf833331ed3fc17fd688445`; `solver/sweep.js` SHA-256 `ef6ea2f8be1959fb33ff504c5df8eabaf4818c4243dcca62c1df3221798bdf89`; `src/game.js` SHA-256 `632c3eb85aa3c0869270155b495f454629199c1ce353ee36248a4a37906e1311`.
- Owner approval in this session to activate and begin the refreshed level-authoring loop.

## Affected surfaces

- `solver/level-author.js`
- `solver/author-level.js`
- `solver/authoring-server.js`
- `solver/candidate-shapes/level-51-split-channel.json`
- `solver/candidate-levels.json`
- `solver/candidate-levels.receipt.json`
- `solver/tests/levelAuthor.test.js`
- `solver/tests/authoringServer.test.js`
- `solver/tests/customLevel.test.js`
- `src/game.js`
- `src/index.html`
- `recordings/.gitkeep`
- Run and ticket bookkeeping under `.orch/runs/level-authoring-tracer-2026-08-12/` and `.orch/tickets/level-authoring-tracer-2026-08-12/`.

## Exemplars

- `solver/game-tester.js` at SHA-256 `ca6884517556af122301ae29b5b3b0af8939a4b4dcf833331ed3fc17fd688445`: imitate measured target derivation, score quantiles, rounding, and explicit policy language; extract only what the authoring seam needs.
- `solver/sweep.js` at SHA-256 `ef6ea2f8be1959fb33ff504c5df8eabaf4818c4243dcca62c1df3221798bdf89`: imitate arbitrary-level CommonJS seams and deterministic RNG use.
- `solver/tests/sweep.test.js` at SHA-256 `fd48993d13358c86a1957c5093a25910e23f431522f025571a7c532dd99c46ae`: imitate small behavioral fixtures and named failure cases.
- `src/game.js` at baseline revision `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`: imitate the existing level initialization and UI lifecycle; preserve shipped behavior while extracting the custom-level seam.

## Target repository

- `/Users/eluckey/Developer/research and games/2248-challenge` at clean baseline Git revision `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6` on branch `level-curve-retune`.
- Delivery isolation: a run-scoped Git worktree below `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo`, created from that baseline.

## Standards owner

- `AGENTS.md` at SHA-256 `478afe52937882710a474736b75c44c830b2bf5b71d18abaa5d90d6ca8e5bb72` owns project evidence, correction, and rule-change discipline.
- `solver/README.md` at SHA-256 `d01ee5063fd9f2227bb42276712ce63c0c72a5969df53ae7fea3d2d403df2fff` owns solver terminology, CommonJS seams, and exact-versus-heuristic language.
- Existing tests under `solver/tests/` own Node test idioms and regression behavior.

## Acceptance as runnable checks

```sh
node --test solver/tests/levelAuthor.test.js solver/tests/authoringServer.test.js solver/tests/customLevel.test.js solver/tests/levelJump.test.js
node solver/author-level.js --shape solver/candidate-shapes/level-51-split-channel.json --write
node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json
node solver/verify-loop.js
node --test solver/tests/*.test.js
node -e "const crypto=require('node:crypto'); const {LEVELS}=require('./src/game'); process.stdout.write(crypto.createHash('sha256').update(JSON.stringify(LEVELS)).digest('hex')+'\\n')"
git diff --check
git diff --name-only 8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6..HEAD
```

Browser smoke uses the local URL printed by `node solver/authoring-server.js`, opens `/index.html?candidate=51&seed=1`, and checks the rendered candidate label, board dimensions, authoring status, and successful recording submission.

## Bound

- **effort:** one end-to-end tracer ticket, one independent code gate, at most one correction pass, and final verification.
- **runtime:** focused tests under 60 seconds, candidate fitting plus 300-seed verification under 5 minutes, full regression under 2 minutes.
- **candidate count:** exactly one reviewable candidate in this delivery; the historical five-level/ten-iteration bound remains future scope.
- **plan_gate:** false; the owner explicitly approved activation and execution.

## Risks

- The browser and solver can drift if custom play forks initialization or RNG semantics; shared level validation and explicit seeded injection reduce that risk.
- Candidate quality is only bot-measured until human review. The result must say “reviewable,” not “accepted” or “fun.”
- Server-side recording is local development infrastructure, not a production security boundary; fail-closed path/body/schema checks are still required.
- A single candidate may expose that the 0.70 provisional demand or declared move budget feels wrong. That is useful tracer evidence, not a reason to auto-ship or silently retune.

## Assumptions

- Level 51 begins the next ten-level scale chapter, so tile scale 32 follows directly from accepted doubling-per-chapter policy.
- Demand 0.70 is a provisional opener value extrapolated for candidate review, not an accepted project rule.
- A 5x7, minimum-chain-four shape with declared pacing can exercise the current renderer and solver without a new mechanic.
- The local authoring server is the smallest honest way to make `recordings/` persistence real in the existing static app.
