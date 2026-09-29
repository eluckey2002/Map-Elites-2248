---
id: BL-0023
title: Reserve ledger IDs across branches before they collide on main
status: proposed
milestone: experiment-discipline
depends_on: []
updated: 2026-09-27
---

# BL-0023 — Reserve ledger IDs across branches

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class. It comes from a 2026-09-27 owner-session blast-radius
audit.

## Desired outcome

A RESULT/CORRECTION ID is reserved in one place on `main` before any branch
uses it, so two branches can never independently claim the same ID for
different work and collide when one lands.

## Why

- Checked: branch `feat/family-board-map-elites-20260919` (no open PR; 14
  commits ahead of `origin/main`, last commit 2026-09-19) defines
  `EVIDENCE_LEDGER.md` entries RESULT-0044 ("Bounded 2048 opportunity counts
  distinguish four captured board starts"), RESULT-0045 ("First board
  MAP-Elites confirmation is invalid because its verifier contradicts the
  producer"), RESULT-0046 ("Verified board MAP-Elites archive spans both
  agreed axes"), and RESULT-0047 ("Five retained board elites replay and
  receive distinct owner judgments"), with `experiments/RESULT-0045/` and
  `experiments/RESULT-0046/` folders.
- Checked: `origin/main`'s current `EVIDENCE_LEDGER.md` has since used
  RESULT-0044 ("Fresh-board owner-vs-oracle comparison (corrected identity,
  blocked pending owner play)"), RESULT-0045 ("Oracle witnesses meet every
  frozen captured-puzzle move comparator"), and RESULT-0047 ("Evolved
  harvesting policy transfers broadly but two regressions falsify strict
  dominance (corrected identity, closed)") for three unrelated experiments.
  RESULT-0046 is unused on `main`.
- Checked: `eluckey2002/Map-Elites-QA` (PR #46) originally defined RESULT-0049 ("A
  120-mutation MAP-Elites archive on re-calibrated axes occupies 24 of 25
  cells without replacing the `52f500c` champion") in its
  `EVIDENCE_LEDGER.md`. Merged PR #49 separately added
  `experiments/RESULT-0049/` for champion confirmation — a different result,
  same original ID. The PR #46 records are therefore renumbered on the
  reconciliation branch as RESULT-0050, RESULT-0051, and RESULT-0052.
- No existing mechanism reserves an ID before a branch starts using it; two
  branches can each pick the next free ID on `main` at branch time and drift
  apart as `main` moves.

## Acceptance criteria

1. An ID registry file lives on `main` (for example
   `docs/ledger-id-registry.json` or a section of `EVIDENCE_LEDGER.md`
   itself) that records every RESULT/CORRECTION ID already claimed, by whom,
   and on which branch, before that branch's experiment gate will pass.
2. `tools/verify-experiments.js` (or an adjacent gate) fails when a branch
   uses a RESULT/CORRECTION ID that is (a) already claimed by a different
   title/branch in the registry, or (b) not present in the registry at all
   (unreserved).
3. Claiming an ID is a single append to the registry on `main`, so two
   branches racing to claim the same next ID discover the collision at merge
   time via a normal merge conflict on that one file, rather than silently
   both landing.
4. RESULT-0044, RESULT-0045, RESULT-0046, and RESULT-0047 as defined on
   `feat/family-board-map-elites-20260919` are renumbered to fresh,
   registry-reserved IDs (or explicitly dropped, if the owner judges the
   branch's work superseded), and either brought to `main` under their new
   IDs by the frozen-renumbering procedure in criterion 7, or the
   branch is deleted with the drop recorded here.
5. The RESULT-0049 collision between `eluckey2002/Map-Elites-QA` (PR #46) and
   PR #49 is resolved by whichever of the two lands second renumbering its
   RESULT-0049 to a fresh, registry-reserved ID by the frozen-renumbering
   procedure in criterion 7.
6. A History note is added here, and to each renumbered ledger entry, that
   records the old ID, the new ID, and the date of the rename.
7. A frozen-renumbering procedure exists and the gate enforces it. Renaming
   a frozen experiment must not change any hashed artifact or orphan its
   registration: the renumbered ledger record carries an explicit alias
   (new ID -> original ID, original branch and commit); the artifacts stay
   byte-identical under their original experiment ID; the original
   registration and protocol commits are kept reachable from `main` by
   merging the source history rather than copying files; and the gate
   resolves a record to its artifacts through the alias instead of the
   folder name. Tested on the family-board records: every reverify command
   gives the same outcome before and after renumbering.

## Current evidence

- `origin/main`'s `EVIDENCE_LEDGER.md`: RESULT-0044, RESULT-0045, RESULT-0047
  (current, unrelated titles).
- `feat/family-board-map-elites-20260919`'s `EVIDENCE_LEDGER.md`:
  RESULT-0044..0047 (stranded, colliding titles) and
  `experiments/RESULT-0045/`, `experiments/RESULT-0046/`.
- `eluckey2002/Map-Elites-QA`'s original `EVIDENCE_LEDGER.md`: RESULT-0049
  (PR #46), now mapped to RESULT-0050 on the reconciliation branch; its two
  following direct-source records map from RESULT-0050/0051 to RESULT-0051/0052.
- Merged PR #49: `experiments/RESULT-0049/` and the authoritative champion
  confirmation record.

- 2026-09-27 port attempt (branch `port/family-board-map-elites`, paused as a
  work-in-progress commit): a file-level copy renamed `experiments/RESULT-0046`
  to `RESULT-0054`, but its frozen `output/archive.json` still embeds
  `RESULT-0046` and its registration commit `4091e60f` is not reachable from
  `main`, so `tools/verify-experiments.js` failed. The embedded ID is covered
  by the artifact identity and cannot be edited. The source branch itself
  still reverifies: RESULT-0046 PASS (artifact `a3a8cd7b...`), RESULT-0047
  replay matches, RESULT-0045 closes INVALID as recorded (its raw verifier
  fails at the artifact-identity check, earlier than the assertion its
  reverify line names).

## Next action

Decide the registry's file location and shape, then wire it into
`tools/verify-experiments.js` as a required check before renumbering the
stranded family-board records.

## History

- 2026-09-27: Proposed from the blast-radius audit, with the
  family-board-branch and RESULT-0049 collisions confirmed by `git show`,
  `git log`, and `gh pr view` against `origin/main`,
  `feat/family-board-map-elites-20260919`, `eluckey2002/Map-Elites-QA`, and
  PR #49.
- 2026-09-27: Owner chose to pause the family-board port until this record defines frozen renumbering (criterion 7 added; criteria 4-5 now point to it). The source branch stays on GitHub.
- 2026-09-27: The owner approved resolving the PR #46/PR #49 collision by landing PR #49 first, then mapping PR #46's RESULT-0049 → RESULT-0050, RESULT-0050 → RESULT-0051, and RESULT-0051 → RESULT-0052. All three are direct-source records without preregistered experiment directories, so the reconciliation preserves their cited artifact bytes and original branch/commit while changing only ledger labels and references. The registry and frozen-experiment alias mechanism remain open for the separate family-board records.
