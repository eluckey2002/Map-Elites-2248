---
id: BL-0018
title: Re-measure results that ran on the bot's pre-fix rollout
status: proposed
milestone: policy-strategy
depends_on: []
updated: 2026-09-27
---

# BL-0018 — Re-measure pre-fix rollout results

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class. It comes from a 2026-09-26/27 owner-session
blast-radius audit. "Checked" means read by that session; "reported" means
found by an audit agent and confirmed by a second, independent agent.

## Desired outcome

Every accepted result measured with `solver/bot.js`'s `rolloutValue` between
commit `4ded51c` (2026-08-20) and the fix `a2bf18d` (2026-09-04) either has a
post-fix re-measurement beside it or an explicit ledger note saying why none
is needed.

## Why

- Checked: `a2bf18d` fixed `rolloutValue` ignoring the bot's own
  tie-break and path-width settings; the ledger's RESULT-0018/RESULT-0020 note
  says the fix changed the chosen move on roughly 30% of a sample and that
  their lift was not re-measured.
- Reported: the frozen commits of RESULT-0011, 0013, 0014, 0016, 0017, 0018,
  0020, 0021, 0024 and 0026 (plus 0049 and 0050 on branch
  `eluckey2002/Map-Elites-QA`) and the Level 53 receipt all load the pre-fix
  rollout. The ledger names only RESULT-0018 and RESULT-0020.
- Checked: RESULT-0026's policy hands bomb states and fallbacks to the live
  reference `chooseMove`
  (`experiments/RESULT-0026/frozen-handmade-policy.js`, lines 12, 92, 112), and
  its run commit `d59e783` predates `a2bf18d`. Its six deciding regressions
  are on bomb levels 47 and 50.
- The `calib-1` ruler's own simple rollout is a deliberate frozen property
  (RESULT-0027), not part of this item.

## Acceptance criteria

1. RESULT-0011 is re-measured first, as a NEW superseding result (fresh
   protocol, fresh seeds, registered before any post-fix outcome data),
   registered at the current head of whichever branch carries
   CORRECTION-0017 (which already revises RESULT-0011). RESULT-0011's frozen
   protocol is never re-invoked: its own text says a completed run is never
   re-run on new seeds.
2. RESULT-0018/RESULT-0020 and RESULT-0026 are never re-run under their own
   registered protocols — both are frozen, one-confirmation-only protocols
   that require supersession, not re-invocation, when inputs move
   (`experiments/RESULT-0020/protocol.md:256-260`: "One confirmation run. No
   re-runs on different seeds"; any frozen hash moving "supersedes this
   record rather than editing it"; `experiments/RESULT-0026/protocol.md:29-30`:
   "Any policy... change creates a superseding result rather than editing
   this run"; `:209-215`: "Invoke confirmation exactly once. Do not retry").
   Each gets a NEW result registered under its own fresh protocol, and that
   protocol runs both the frozen PRE-fix `rolloutValue` (commit `4ded51c`)
   and the POST-fix `rolloutValue` (`a2bf18d` or later) bot implementations
   on the SAME fresh, freshly-drawn seed set (paired, not two separate seed
   samples), so the pre/post comparison is internally controlled; the old
   record's historical figures are cited as context only, never mixed into
   the new protocol's own comparison.
3. Each remaining listed result gets a new superseding re-measurement — same
   rule: fresh protocol registered first, paired PRE-fix/POST-fix bot runs on
   identical fresh seeds, historical figures as context only, never a re-run
   of the old protocol — or a ledger note explaining why its conclusion does
   not depend on the rollout.
4. Nothing re-measured here edits a prior record's statement or re-invokes
   its frozen protocol; each re-measurement is a new result registered under
   its own protocol, and the superseded record gets a `CORRECTION-NNNN`
   citing the new result.

## Current evidence

EVIDENCE_LEDGER.md note under RESULT-0018/RESULT-0020 (the `rolloutValue`
fix); RESULT-0026; RESULT-0027; CORRECTION-0017 (branch-only today, PR #46).

## Next action

Re-read RESULT-0011 and CORRECTION-0017 at the branch head and register its
re-measurement.

## History

- 2026-09-27: Proposed from the blast-radius audit.
- 2026-09-27: Codex review (finding 4117059299) noted RESULT-0020's protocol
  (`experiments/RESULT-0020/protocol.md:256-260`) allows one confirmation and
  requires supersession when frozen hashes move, and RESULT-0026's
  (`experiments/RESULT-0026/protocol.md:29-30,209-215`) freezes the policy
  and allows confirmation once — so re-running either under its own
  registered protocol is not permitted. Confirmed by reading both files.
  Rewrote criteria 1-4 so RESULT-0011, RESULT-0018/0020, RESULT-0026, and
  each remaining result are re-measured as NEW superseding results, each
  registered under its own fresh protocol and seeds before any post-fix
  outcome data, with the old records corrected to cite the new ones.
- 2026-09-27: Codex review (finding 4117108536) noted the criteria did not
  require the pre/post comparison to be paired on identical seeds. Confirmed
  by re-reading criteria 2-3. Rewrote them so each superseding protocol runs
  the frozen PRE-fix (`4ded51c`) and POST-fix (`a2bf18d`+) `rolloutValue`
  implementations on the SAME fresh seed set, with historical figures cited
  as context only.
