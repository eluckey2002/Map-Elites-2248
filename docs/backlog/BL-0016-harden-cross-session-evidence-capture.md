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
| F9 | The only ledger gate checks RESULT records' `proof_class` and `.json` paths, nothing else | Reported: `tools/verify-experiments.js` parses only `### RESULT-` (:36). 5 of 7 bad records planted in a scratch clone passed (duplicate ID, invalid status/class, promoted class, fake commit, bad FACT citation); an empty ledger passes | Parse every `### ID` record: required fields, allowed values, unique IDs, fail on zero records (~40 lines in the existing gate) |
| F10 | Live vocabulary violation | Checked: `replayed_upper_bound` used at EVIDENCE_LEDGER.md:721, :736, :1157; allowed list has only `proven_upper_bound` (:176) | Owner call: add the class to the allowed list, or correct the three records |
| F11 | Nothing blocks rewriting history | Reported: no check that an existing record's `proof_class`/`statement`/`evidence` stays unchanged, or that `supersedes`/`superseded_by` point at each other | Gate diffs the parsed records against `main`: only a status change backed by a CORRECTION record is allowed; supersede links must match |
| F12 | Citations other than `.json` paths are not resolved | Reported: 0/10 hand samples broke; 27/27 labelled commits resolve; 4/145 paths unresolved, all shorthand or deliberately absent; 53 unlabelled hex strings can't be told apart | Label commits and hashes in prose (`commit`, `SHA-256`); the gate resolves every labelled citation |

Order: F9 → F10 → F12 → F11 → F1 runner (nightly, slow) → F5 JSONL
source of truth only after the gates exist.

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

Owner accepts or trims the fix list and decides F10; then F9 (smallest,
closes the most gaps).

## History

- 2026-09-26: Proposed from three-part audit (size/shape, finding quality,
  mechanizability pending).
- 2026-09-26: Mechanizability audit added F9–F12; F10 spot-checked.
- 2026-09-26: Owner decided F10: add `replayed_upper_bound` to the allowed proof classes (done in the ledger's class table and entry template).
- 2026-09-26: F9 built (`11bd925`) and hardened after an independent mutation audit: kill rate 16/27 -> 26/27, no false positives on the real ledger or 4 legitimate variants. Known survivor: a bad class written in prose without backticks beside a good backticked one (scanning bare snake_case risks false positives).
- 2026-09-26: F12 built (`2825cb0`) and hardened after an independent
  mutation audit: kill rate 7/22 -> 16/22, no false positives. Remaining misses
  are formats absent from the ledger (unbackticked paths, markdown links,
  6-character SHAs, notes field). The stricter check found 6 real gaps in the
  ledger, held in `KNOWN_CITATION_GAPS` so only new gaps fail; each needs a
  CORRECTION record: RESULT-0001 and RESULT-0004 cite verifiers deleted in
  `8e1e232`; RESULT-0026 cites two `/private/tmp` files; RESULT-0041 cites a
  script outside the repo; DECISION-0004 cites commit `6a07294`, which is on
  no branch.
- 2026-09-26: Owner chose corrections before F11. Added CORRECTION-0010
  (RESULT-0001/0004 verifiers deleted; re-run from `8e1e232^`, both PASS),
  CORRECTION-0011 (RESULT-0041 closure verifier vendored into
  `tools/vendor/close-experiment/`, re-run PASS), CORRECTION-0012
  (DECISION-0004's evidence commit `6a07294` existed on one machine only; now
  preserved as remote branch `evidence/result-0018-6a07294`). The RESULT-0026
  `/private/tmp` hits were scratch output arguments, not citations; the check
  now skips those. Known gaps are excused only while their correction exists.
  Full suite: 3 failures, the same 3 that fail at session start `ead3937`.
- 2026-09-26: F11 built. The gate compares the ledger with its branch point
  on `origin/main`: no record removed; type, scope, statement, question,
  evidence, proof_class, as_of, reverify unchanged; links and notes only grow.
  It also requires two-way supersede links. Planted rewrite in the real
  ledger went red; restored ledger passes. Repaired five one-way links
  (RESULT-0010/CORRECTION-0003, RESULT-0030, RESULT-0038, RESULT-0041).
  Past in-place rewrites found in history, before the check existed:
  RESULT-0027's proof_class (`3ce7f7e`, `85fe9b0`, 2026-09-03), evidence of
  FACT-0001..0003 (`e6e0f21`) and DECISION-0006 (`5f7bf21`).
- 2026-09-26: F11 hardened after an independent mutation audit: kill rate
  11/26 -> 17/25 text cases, plus direct pushes to main (the push run now
  compares with the pre-push commit; tested in a throwaway clone). Every
  field except status, updated, links and notes is frozen, including titles
  and ad hoc bold lines; a status change needs a new correction link (stale
  excepted); notes may only grow at the end. Accepted by design: appended
  contradicting notes, header rules and snapshot edits, free paragraphs,
  `updated` changes. GitHub already requires "experiment gate" on `main`,
  enforced for admins, with force pushes disabled (checked via `gh api`).
- 2026-09-26: F8 solved. The stray handoff is retired to
  `docs/history/2026-08-18-pivot-handoff.md` with a banner: it recommended a
  pivot to another game that was never taken; `HANDOFF.md` links updated.
  Run-folder shape: the 16 runs without a worklog are runs that were planned
  and never started (composition only) or stopped (stop-record). The minimum
  that matters is one outcome file (worklog or stop-record) naming a ledger ID
  or `not reportable`, which is F2's rule; F8's run-shape part is folded into
  F2 rather than adding a second check.
- 2026-09-26: F4 done for the four live results (RESULT-0029/0030 are
  superseded). Four fresh agents, each given only `protocol.md` and
  `corpus.json`, wrote `recompute.js` for RESULT-0031..0034; all four match
  the ledger statements and dispositions. Not covered: control checks and
  witness replay, which need the engine. RESULT-0033 and RESULT-0034 cleared
  their width-stability bar on exactly the minimum 28 pairs (feeds F6).
- 2026-09-26: F6 done. `experiments/TEMPLATE.md` has a "Sample size and margin" section (per-verdict n, how many misses flip it, a bar for any combined measure a later stage uses); the gate requires it for protocols registered from 2026-09-27. Planted a post-cutoff date on RESULT-0048: gate flagged it; restored.
