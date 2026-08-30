# Worklog: target-aware promotion rehearsal

## Goal (frozen)

**Objective:** An isolated current-main candidate either proves it is the exact supported target-aware policy with no regression on newly shipped Level 53 and becomes `PROMOTION_ELIGIBLE`, or stops with a named non-promotion outcome; canonical main remains unchanged.

**Acceptance:**

1. Clean exact preflight at main `76871b12ebf5c75b2681360c1941fbd7ec908012`, with the pinned champion, engine, Levels 1-52 projection, and Level 53.
2. Write-once 300-seed Level 53 baseline captured before `solver/bot.js` changes.
3. Exact minimal base-first target-aware port with unchanged public call shape and defaults.
4. Exact terminal-tuple equality on all 15,600 frozen Levels 1-52 challenger cells.
5. One sealed Level 53 run with no lost wins, slower wins, or changed losing outcomes.
6. No ordinary regression: focused tests, curve health, and full-suite failure identities no worse than baseline.
7. Strict path allowlist and clean diff.
8. Exactly one terminal experiment outcome: `PROMOTION_ELIGIBLE`, `RETAIN_CHAMPION`, `INCONCLUSIVE`, or `INVALIDATED`.
9. Owner approval remains required for merge, push, records, receipts, or derived-view refresh.

- **spec:** `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/spec.md` SHA-256 `169c19917decdc48ab1cd5b58a47a71e9e46bdd63507f97accf2e779f3ca06e6`
- **tickets:** `.orch/tickets/target-aware-promotion-rehearsal-2026-08-30/`

## Iterations

### 1 — workspace and preflight

- Preserved supported experiment on `map-elites-learning` at `6a07294571644d963a5a9b728f8e4aed3b29a835`.
- Preserved unrelated canonical-worktree records on local recovery branch at `9a86eb2` and parked August 29 work at `c3b8406`; neither entered main or the candidate.
- Candidate workspace: branch `codex/target-aware-promotion-rehearsal-2026-08-30`, base `76871b12ebf5c75b2681360c1941fbd7ec908012`.
- Baseline verifier PASS; Universe Map PASS; full suite 234/237 with exactly the three receipt failures; curve health PASS.
- Fixed evidence copied with expected hashes.

### 2 — sealed promotion rehearsal

- Captured and validated the write-once Level 53 champion baseline before changing `solver/bot.js`: 300 ordered cells, 296 wins and 4 out-of-moves losses; artifact identity `21ae8d14c949f9993a428fc2d6cbd078b9c086c17693efa258e4516b378d430a`.
- Implemented the exact target-aware public chooser on candidate commit `ab8cbb5a381f3628a9084b738bc0836d1636fdef`; candidate `solver/bot.js` SHA-256 `6f58e6c136f58dc52df5d1b4203d0c032b497109ef4c517cd0ca1628057e1fd1`.
- Reproduced all 15,600 frozen Levels 1-52 challenger terminal tuples exactly, with no translation correction.
- Ran the one authorized Level 53 promoted replay. The frozen comparator found a changed same-speed winning outcome, so criterion 4 failed and the protocol outcome is `RETAIN_CHAMPION`. Level 53 was not rerun.
- Join independently confirmed focused tests 26/26 PASS, full suite 242/245 with exactly the same three receipt failures, curve health `RESULT: PASS`, protected source hashes, and clean in-scope diff.

## Blame classes

[]

## Failed approaches

- Initial baseline verifier failed because an older registered worktree contained parked changes. Evidence: verifier named 18 dirty paths. Resolution: preserved those exact changes on their existing isolated branch, then baseline verifier passed.

## Queued scope

- If the candidate becomes eligible, updating the Universe Map, evidence records, receipts, pushing, or merging remains a separate owner-approved promotion step.

## Terminal

- **status:** failed
- **protocol outcome:** `RETAIN_CHAMPION`
- **deciding evidence:** `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/sealed-reveal.md`, SHA-256 `acc15f15fd87132d3343299b39083cc4d1037d65db5010ea757840b38bc980ec`
- **reason:** the deterministic Level 53 gate rejected at least one changed same-speed winning terminal outcome; the candidate is not promotion-eligible.
- **publication boundary:** current champion and canonical `main` remain unchanged; candidate is local, unmerged, and unpushed.
