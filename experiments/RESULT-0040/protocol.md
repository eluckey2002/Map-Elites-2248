---
result: RESULT-0040
status: registered
registered: 2026-09-16T22:34:41Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0040/challenge.json: 2be50b1fac3dbce4
  experiments/RESULT-0040/registered-protocol.md: 68af107fe586cf35
  experiments/RESULT-0040/closeout-contract.json: d0a460ea53845a10
  src/game.js: 3d405595707621ce
  solver/engine.js: 0ed4b31004df13e3
  solver/oracle/search.js: 6c362d2d309edb49
  solver/oracle/simulation.js: 9cafa661bfb9bed1
  solver/oracle/verify.js: 6eeba60f146e1641
  solver/oracle/cli.js: 83dc49aa494b3352
  solver/benchmark-replay.js: a714232d4e4bf308
  solver/tests/oracle.test.js: 594cb21402d44218
  tools/play-server.js: 836e4787cca1bafe
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — two fresh owner-versus-oracle boards

**Registered:** 2026-09-16, before either seeded board was rendered, played,
searched, or scored.

This lifecycle record binds the immutable scientific protocol at
`registered-protocol.md` (SHA-256
`68af107fe586cf35f4c43d45713a5fd82f9bcc89809138ec50a90c93d77fa11e`),
the board/arm manifest at `challenge.json` (final subject identity
`2be50b1fac3dbce4787401b3189783478e78e72fc457c6078f9c21c20f50e7c1`),
and the executable closure contract at `closeout-contract.json` (SHA-256
`d0a460ea53845a10c9379f8f39878ef61cd04c55dcc86e455e1f2e13d806cd40`).

## Experiment declaration

- Primary profile: `ab-comparison`, full SHA-256
  `a6f1c86ab5ce9c942a12888b0b8f9885d4ca53e5530683d382a7666d1a0fade9`.
- Context profile: `simulation-policy`, full SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Design: exact paired comparison of owner and oracle on two fixed, fresh
  level/seed puzzle identities.
- Unit: each exact puzzle. The two-case panel is the intersection of the two
  decisions, not an estimate of a future-board population rate.

## Question, matrix, and outcome

The complete matrix is two boards by two arms. Board 1 is shipped Level 56,
seed 41,000,000. Board 2 is shipped Level 58, seed 41,000,001. On both, does
the 30-second oracle win and use no more moves than the owner's first completed
attempt when that attempt wins?

The owner plays first, once per board; the oracle is withheld until both
terminal captures exist. Both arms use identical rules and seeded streams and
stop on the first target-crossing move. A win beats a loss; among mutual wins,
fewer moves wins and equal moves tie.

- `SUPPORTED`: oracle wins both, never slower than a human win.
- `FALSIFIED`: oracle is slower than any human win, loses where the human wins,
  or fails to win a board the human loses.
- `INCONCLUSIVE`: missing, contaminated, invalid, or unreplayable evidence.

No aggregate uncertainty interval is meaningful for two fixed cases. Both raw
paired outcomes and move differences are reported; no population inference is
made. The exact design, controls, contamination rules, diagnostics, and failure
meanings are frozen in `registered-protocol.md`.

## Starting state and evidence budget

- Parent HEAD: `520553523506af82490871e7dca762ba1d277fd4` on isolated branch
  `feat/bounded-authoring-oracle`.
- Repository baseline from the immediately preceding oracle delivery: 435 tests,
  430 pass, the same four deliberate failures, one skip. Oracle qualification:
  14/14 pass. Experiment gate: PASS before registration.
- Repository and full-history searches found no prior use of either seed. They
  are reserved in `experiments/SEEDS.md`.
- Human budget: one selected terminal capture per board, first received.
- Oracle budget: one reportable run per board, 30,000 ms including baseline.
- Verification and deterministic recomputation may repeat. Search and human
  attempts may not. No replacement seed, tuning, extra board, time increase,
  or best-of selection is permitted after outcomes.

The challenge adapter does not yet exist. Before reportable oracle search, it
may be implemented only as a mechanical bridge from these two exact captures
to the frozen oracle and verifier. Its known-good/known-bad controls and full
source identity must be recorded before search. Any change to the algorithm,
rules, matrix, comparator, or outcome logic requires a superseding protocol.

## Adoption boundary

This experiment can decide only whether the oracle meets the frozen relationship
on these two unopened boards. It cannot prove optimality or general superiority,
and it automatically changes no live policy, level, authoring bar, or product rule.
