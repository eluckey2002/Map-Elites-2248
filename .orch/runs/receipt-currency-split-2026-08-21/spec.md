---
run: receipt-currency-split-2026-08-21
routing:
  pack: code
bound: 3 iterations
plan_gate: true
target_repository: /Users/eluckey/Developer/research and games/2248-challenge
standards_owner:
  - solver/tests/receiptGate.test.js
  - docs/CHECK-CARDS.md
  - /Users/eluckey/.claude/skills/gate-check/references/check-card.md
---

# Spec — separate receipt integrity from receipt currency

> **SUPERSEDED 2026-08-21, before any execution. Do not deliver this spec.**
>
> It requires editing `solver/level-author.js` (acceptance 1, 2, 3, 9). That file
> is one of the three inputs hashed into every receipt's `inputIdentities`, so
> **any** edit to it — proven with a single appended comment — flips every
> currently-passing receipt to `code/input identity mismatch`:
> `candidate-levels` and `candidate-levels-54` both failed the probe and both
> recovered on restore.
>
> Delivering this spec would therefore turn all three receipts red and require
> re-authoring each, including level 52 — the exact action the owner declined on
> 2026-08-21 after measuring its cost (+4.9% harder for players, bot win rate
> unmoved). The spec would compel the decision it was written to make
> unnecessary. That is a defect in the spec, not in the decision.
>
> Superseded by ad-hoc ticket `.orch/tickets/curve-debt-2026-08-21/T-004.md`,
> which reaches the same end state entirely inside the test layer and touches no
> hashed file. The integrity/currency split remains the right architecture if the
> corpus ever grows beyond one authored shipped level; revisit this document then,
> and budget re-authoring the whole corpus as part of it.


## objective

A candidate receipt yields two independently checkable verdicts instead of one:
**integrity** (the recorded numbers are internally consistent and name the code
that produced them — a historical fact that never expires) and **currency** (that
code is the code at HEAD). The receipt gate blocks on integrity always, and on
currency only for candidates that are not shipped-and-playtested; for those it
reports staleness without failing. Level 52 verifies, the suite is green, and the
stale count is visible in the run output.

## non_goals

- Changing any shipped level's target. Level 52 stays at 102000 unless a separate
  decision moves it.
- Adding an `--out` flag to `author-level.js`. Logged as friction (three
  occurrences, run `curve-debt-2026-08-21`); a separate mechanization.
- Recovering level 51's lost candidate store. Discovered during intake, tracked
  separately — see risks.
- Backfilling receipts for levels 1..51, which have no authoring provenance.
- Re-targeting the difficulty curve to the current bot.
- Unifying `solver/game-tester.js`'s third `roundTarget` copy, which is a test
  harness and not on the verification path.

## acceptance

Every criterion is a runnable check. Failure behavior is covered explicitly.

1. **Integrity verifies regardless of code drift.** A receipt whose
   `inputIdentities` do not match HEAD still passes an integrity check, provided
   its signature, candidate binding, shape binding, terminal totals, and its own
   recorded target derivation are self-consistent.
   oracle: `node --test solver/tests/*.test.js` — a named test asserting
   `candidate-levels-52` passes integrity while its `inputIdentities` differ from
   `defaultInputIdentities()`. oracle_class: `deterministic`.
2. **Integrity still refuses a tampered receipt.** Mutating any recorded number
   fails integrity, at the signature.
   oracle: named test; the crafted input is a holdout win count incremented by 1,
   expected fault `receipt identity mismatch`. oracle_class: `deterministic`.
3. **Integrity refuses a receipt whose internal derivation is inconsistent**, even
   when signed — a `roundedTarget` that does not equal
   `roundTarget(measuredMedian * demand)` fails, without re-running the bot.
   oracle: named test with a re-signed receipt carrying a mismatched
   `roundedTarget`. oracle_class: `deterministic`.
4. **Currency is a separate verdict, and is accurate.** For each store the gate
   reports current or stale; `candidate-levels-52` reports stale,
   `candidate-levels` and `candidate-levels-54` report current.
   oracle: named test asserting the three verdicts by name. oracle_class:
   `deterministic`.
5. **Currency blocks for a candidate that is not shipped-and-playtested.** A
   stale candidate with no bound winning recording fails the suite.
   oracle: named test over a staged corpus. oracle_class: `deterministic`.
6. **Currency does not block for a shipped, playtested level.** Exemption
   requires BOTH: the candidate's `level` appears in `src/game.js`, AND at least
   one file in `recordings/` has `candidateIdentity` equal to the candidate's
   identity and `outcome: "win"`. Neither alone suffices.
   oracle: named tests — the exemption holds for `candidate-levels-52`; a staged
   candidate satisfying only one half does NOT get the exemption.
   oracle_class: `deterministic`.
7. **The exemption cannot be claimed by editing prose.** It is computed from
   `src/game.js` and `recordings/` at run time, never read from a flag in the
   receipt, the manifest, or a config file.
   oracle: named test asserting a receipt that declares itself exempt is still
   evaluated on the computed facts. oracle_class: `deterministic`.
8. **Stale-but-exempt is visible, never silent.** Every exempt-stale store emits
   a diagnostic naming the store and the reason, and the run prints a count.
   oracle: named test capturing the diagnostic text. oracle_class:
   `deterministic`.
9. **The duplicate implementation cannot drift.** `solver/fixed-board.js` and
   `solver/level-author.js` do not carry two independent copies of the derivation
   assertions.
   oracle: a test asserting both call one shared implementation — by identity, not
   by reading similar source. oracle_class: `deterministic`.
10. **No shipped level changes.** `git status --porcelain src/game.js` is empty
    at the end of the run.
    oracle: `git status --porcelain src/game.js`. oracle_class: `deterministic`.
11. **The suite is green.** `node --test solver/tests/*.test.js` reports `fail 0`,
    with the level 52 staleness surfaced as a diagnostic rather than a failure.
    oracle: the suite. oracle_class: `deterministic`.
12. **Every existing receipt still verifies for currency where it did before.**
    `candidate-levels` and `candidate-levels-54` continue to pass the strict
    current check; the change does not weaken them.
    oracle: `node solver/author-level.js --verify` on both pairs prints `PASS`.
    oracle_class: `deterministic`.

## binding_constraints

- `src/game.js` is read-only for this run.
- No shipped level's `target` may change.
- `solver/candidate-levels*.json` and their receipts are read-only except where a
  schema addition is required; any receipt schema change must keep every existing
  committed receipt verifying, or migrate it in the same commit.
- The strict current-verification path must remain available and unweakened —
  `author-level.js --verify` keeps its present meaning.
- Every new or modified check goes through `gate-check` before it ships, and
  lands a card in `docs/CHECK-CARDS.md` in the same commit.
- The exemption is computed, never declared. A receipt may not assert its own
  exemption.
- Existing corpus manifest semantics hold: a store may not leave the gate without
  a manifest edit in the same commit.

## evidence

- `solver/level-author.js` — derivation at 198, 221-225; assertions at 264
  (`code/input identity mismatch`), 269-275, 298-302.
- `solver/fixed-board.js` — duplicate derivation at 199, 226-229; duplicate
  assertions at 283-287.
- `solver/tests/receiptGate.test.js` — the gate as it stands, at commit `d0a384d`.
- `solver/candidate-corpus.json` — corpus membership, 3 stores.
- `docs/CHECK-CARDS.md` — three existing cards at `d0a384d`.
- Candidate identities: `candidate-levels-52` = `6f99c09bfae98500...`,
  `candidate-levels` = `043ca53f234d4092...`, `candidate-levels-54` =
  `0a3b9adfd4ca7e31...`.
- Playtest bindings, verified by parse of `recordings/*.json`:
  `f0ae3e75...` -> `6f99c09b...` (level 52, win);
  `7061bbf0...` -> `043ca53f...` (level 53, win).
- `src/game.js` — 52 level entries, contiguous 1..52, verified by parse.
- Ticket `T-003` (`.orch/tickets/curve-debt-2026-08-21/T-003.md`) — level 52
  measured: target would move 102000 -> 107000 (+4.9%), holdout win rate
  96.7% -> 97.0%.

## affected_surfaces

- `solver/level-author.js` — split verification into integrity and currency.
- `solver/fixed-board.js` — call the shared implementation instead of its copy.
- `solver/tests/receiptGate.test.js` — gate reports both verdicts.
- `solver/tests/levelAuthor.test.js` — cover the new integrity path.
- `docs/CHECK-CARDS.md` — cards for each new or changed check.

## exemplars

- `solver/tests/receiptGate.test.js` — imitate: crafted-bypass cases that assert
  the *expected fault*, not merely that something threw (pinned by the existing
  `a receipt whose code has drifted is refused, not verified`); a corpus walk
  that is store-driven so absence is a failure; a vacuity floor.
- `docs/CHECK-CARDS.md` — imitate: one card per distinct check, with
  **Does NOT catch** enumerated and never "n/a" (pinned by the three cards at
  `d0a384d`, carrying 7, 6, and 6 blind spots).
- `/Users/eluckey/.claude/skills/gate-check/references/check-card.md` — the card
  template that owns the field list; do not restate its rules here.

## risks

- The receipt schema may need a version bump. Every committed receipt must keep
  verifying or be migrated in the same commit; a partial migration would create
  exactly the silent-staleness this run exists to remove.
- The exemption computed from `recordings/` inherits that corpus's weakness: all
  human evidence is n=1. A single winning recording licenses a non-blocking
  verdict, which is thin evidence carrying real weight.
- Level 51 ships and its candidate store is lost — three recordings bind to
  `524f37c0063d61e5`, an identity no receipt now carries; `HANDOFF.md` records it
  was overwritten in `candidate-levels.json`. Out of scope here, but it means the
  gate can never cover the shipped curve, only authored candidates.
- Splitting one verdict into two creates a new way to be wrong: reporting
  integrity-PASS as though it were an all-clear. Acceptance criterion 8 is the
  guard, and it is the criterion most worth attacking at review.

## assumptions

- "Playtested" is defined as at least one recording bound by `candidateIdentity`
  with `outcome: "win"` — a human demonstrably completed the level at that
  target. A loss recording proves a human played it, not that it is completable,
  so losses do not license the exemption. Stated here because it is a judgment,
  not a measurement.
- Levels 1..51 are out of scope permanently, not temporarily: they have no
  authoring provenance and none is planned.
- `solver/game-tester.js`'s `roundTarget` is a test harness off the verification
  path; leaving it duplicated is deliberate.
