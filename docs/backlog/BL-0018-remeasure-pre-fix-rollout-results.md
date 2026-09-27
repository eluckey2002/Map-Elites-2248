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

1. RESULT-0011 is re-measured first, at the current head of whichever branch
   carries CORRECTION-0017 (which already revises RESULT-0011).
2. RESULT-0018/RESULT-0020 and RESULT-0026 are re-run under their registered
   protocols on the fixed bot, with old and new values side by side.
3. Each remaining listed result gets a re-measurement or a ledger note
   explaining why its conclusion does not depend on the rollout.
4. Nothing re-measured here edits a prior record's statement; changes land as
   corrections.

## Current evidence

EVIDENCE_LEDGER.md note under RESULT-0018/RESULT-0020 (the `rolloutValue`
fix); RESULT-0026; RESULT-0027; CORRECTION-0017 (branch-only today, PR #46).

## Next action

Re-read RESULT-0011 and CORRECTION-0017 at the branch head and register its
re-measurement.

## History

- 2026-09-27: Proposed from the blast-radius audit.
