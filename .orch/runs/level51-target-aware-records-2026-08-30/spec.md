# Spec: record the Level 51 target-aware learning result

- **run:** `level51-target-aware-records-2026-08-30`
- **objective:** Record the fixed evaluation result in a plain-language report and one append-only ledger entry without promoting the challenger.
- **routing:**
  - **pack:** `orch-content-pack`

## Audience

The owner, who wants to know whether the champion learned a useful lesson from the two human Level 51 strategies and what decision remains.

## Voice contract

- Direct, non-technical, and evidence-first.
- Distinguish “faster to the target” from “higher terminal score.”
- Call the implementation an experimental challenger, not the champion.
- State that the rule was extracted from human play; do not describe this as autonomous learning.

## Throughline and arc

The human replays exposed a safe endgame rule; a frozen challenger applying only that rule generalized on unseen cases; the evidence supports considering promotion but does not itself authorize it.

## Length budget

- Report: at most 1,200 words.
- Ledger entry: at most 350 words.

## Citation policy

Every numeric claim must trace to the fixed screen, holdout, or independent verification artifact. The Level 51 seed-1 example must be labeled training-only. Code-behavior claims must cite the frozen challenger source or diagnosis report.

## Acceptance

1. The report states verdict `SUPPORTED`, all primary-gate results, the compute and terminal-score caveats, and the no-promotion boundary.
2. `EVIDENCE_LEDGER.md` receives exactly one append-only `RESULT-0018` entry; no existing record is edited.
3. Both documents distinguish 9,354 faster both-win cells from 9 challenger-only wins.
4. Claims resolve to holdout artifact identity `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0` and independent verification SHA-256 `5bdf5baa5b55672337d52379d5b43920671f5ae2e9ef4a8fd0d51063010e41e9`.
5. Champion, engine, levels, targets, receipts, recordings, calibration, and authoring remain unchanged.

## Bound

- Two prose surfaces: the evaluation report and one ledger entry.
- No policy promotion, product change, receipt refresh, commit, push, or merge.
- **plan_gate:** false.

## Evidence

- `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/report.md`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/screen.json`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/verification.json`
- `solver/target-aware-challenger.js`
