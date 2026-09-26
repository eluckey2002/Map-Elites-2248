---
id: BL-0016
title: Make cross-session evidence capture compact, machine-checked, and reviewed
status: proposed
milestone: descriptor-discovery
depends_on: []
updated: 2026-09-26
---

# BL-0016 — Harden cross-session evidence capture

## Authority

This record is intent, not evidence. Proof standing lives in the
[evidence ledger](../../EVIDENCE_LEDGER.md); nothing here changes any record's
status or proof class. Failures below come from a 2026-09-26 audit (three
read-only subagents plus owner-session spot checks); each lists the command or
line that shows it.

## Desired outcome

A fresh agent reads a small, current slice of project memory; every ledger
invariant that can be checked by code is checked by code against the real
ledger; and no finished run or corrected claim can silently fall out of sync.

## Failures found and proposed fixes

Ranked worst first. "Checked" means re-run by the owner session, not only
reported by a subagent.

| # | Failure | Evidence | Proposed fix |
|---|---|---|---|
| F1 | Ledger `reverify` commands have gone stale, yet the registration gate passes | Checked: `node solver/verify-map-elites.js solver/map-elites-output` exits 1, `protected file changed: solver/bot.js` (RESULT-0017). Reported: RESULT-0031/0032 reverify fail `source identity closure mismatch` | Point every completed result's `reverify` at `tools/verify-frozen-experiment.js RESULT-XXXX` (as RESULT-0030 does); add a gate that executes each `reverify` line and fails on any red |
| F2 | Finished verified runs never reach the ledger | Checked: `ab8ed417` (2026-08-28 independent-round archive, 23/25 coverage) appears 0 times in `EVIDENCE_LEDGER.md` and `CURRENT.md` | A run is not complete without a ledger ID or an explicit `not reportable` note; gate scans `.orch/runs/*/worklog.md` for completed runs lacking either |
| F3 | Superseded records keep their wrong sentence | Checked: EVIDENCE_LEDGER.md:704 (RESULT-0029) still states "screened 104 distinct starting boards" after CORRECTION-0005 | Inline `[corrected by CORRECTION-NNNN: …]` at the affected sentence; gate: non-empty `superseded_by` requires the body to name that ID |
| F4 | No independent recompute for RESULT-0029 to RESULT-0034 | Reported: only same-session `verify.js` exists; `recompute.js` starts at RESULT-0035 | Fresh-context agent backfills `recompute.js` from `corpus.json` + `protocol.md` only; require it for any heuristic result |
| F5 | Mandatory read chain is ~82k tokens before any code | Reported: AGENTS.md 7.4 KB + ledger 176.6 KB (66 records, 9 superseded inline) + CURRENT.md 20.2 KB + linked backlog | Keep structured records in a JSONL source of truth; generate a live-records view (accepted/provisional/open) and a separate superseded archive |
| F6 | Stability verdicts rest on tiny samples | Reported: 8 pairs (RESULT-0031), 28 pairs (RESULT-0033); joint same-cell rate 22/28 never a registered bar, and RESULT-0035 then fell to 54.8% | Protocol template requires a minimum sample per verdict and a registered test of the joint quantity the next stage consumes |
| F7 | Same fact restated in many files with no pointer | Reported: "140,544 points in 20 moves" in 4 files, 6 places (all agree today) | Non-ledger files cite the record ID instead of restating the number |
| F8 | Handoff outside the read chain; uneven run shape | Reported: `HANDOFF-NEXT-MAP-ELITES.md` not linked from AGENTS.md or CURRENT.md; worklog in 26/42 runs, spec in 24/42 | Link or retire the handoff; fixed minimum file set per run, checked by the gate |

Pending: the mechanizability audit (which invariants code enforces, whether
checkers read the real ledger, citation resolvability) has not reported yet;
its findings get appended to History.

## Acceptance criteria

- A planted bad record (stale reverify, missing ledger link for a finished run,
  superseded body without correction ID) turns the gate red; the unchanged
  ledger passes.
- Mandatory read chain measured and recorded before and after.
- F4 recomputes written by an agent that did not see the original run.

## Current evidence

RESULT-0017, RESULT-0029, CORRECTION-0005, RESULT-0031 to RESULT-0035 in the
[ledger](../../EVIDENCE_LEDGER.md);
`.orch/runs/2026-08-28-map-elites-independent-round-verification/worklog.md`.

## Next action

Owner accepts or trims the fix list; then F1 (smallest, highest value).

## History

- 2026-09-26: Proposed from three-part audit (size/shape, finding quality,
  mechanizability pending).
