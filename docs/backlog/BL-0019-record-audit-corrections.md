---
id: BL-0019
title: Record the ledger corrections the blast-radius audit found unrecorded
status: proposed
milestone: experiment-discipline
depends_on: []
updated: 2026-09-27
---

# BL-0019 — Record unrecorded corrections

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class. Items come from a 2026-09-26/27 owner-session
blast-radius audit; each must be re-verified at the branch head before it is
written as a correction.

## Desired outcome

Each defect below is either recorded as a CORRECTION in the ledger's own
schema, with supersede links both ways, or dropped with a stated reason.

## Items

| Item | Defect | Check |
|---|---|---|
| C1 | The ledger says RESULT-0026's FALSIFIED verdict is "not affected" by the pre-fix rollout; its policy calls the live reference bot on bomb states (see BL-0018) | Checked |
| C2 | The CORRECTION-0009 human-vs-bot headline is stale: the corpus grew, it counts the input-bug loss `8ac6c9d4`, and it counts five exploration sessions (see BL-0017). Speed-intent sessions only give an effectively even result | Checked: re-ran the benchmark at `e1eba23` (branch `eluckey2002/Map-Elites-QA`) |
| C3 | Level 53 entered `src/game.js` in `530deb3` with no ledger record | Reported |
| C4 | Some `reverify` commands still fail; for example RESULT-0003's prints 1720 against its recorded 430 because Level 26 now uses a x4 tile scale. CORRECTION-0013..0016 fixed part of this class | Reported by two independent agents |
| C5 | The greed-ratio line (RESULT-0036..0043) was motivated by the input-bug loss having the worst greed ratio (`HANDOFF.md`, 2026-09-06); its own data is unaffected | Reported |

## Acceptance criteria

1. Every line citation is re-resolved at the branch head before use.
2. Each item lands as a correction or is dropped with a History line.
3. `node tools/verify-experiments.js` passes and `LEDGER-INDEX.md` is
   regenerated with the ledger.

## Current evidence

RESULT-0026, CORRECTION-0009, RESULT-0003, RESULT-0009,
CORRECTION-0013..0016 (branch-only today, PR #46).

## Next action

Re-verify C1 and C2 at the branch head and write them first.

## History

- 2026-09-27: Proposed from the blast-radius audit.
