# Worklog: corrected target-aware promotion rehearsal

## Goal (frozen)

**Objective:** The isolated candidate at `ab8cbb5a381f3628a9084b738bc0836d1636fdef` either proves sampled behavioral equivalence to the frozen target-aware outputs and no regression on fixed Level 53 seeds, becoming `PROMOTION_ELIGIBLE`, or stops with a named non-promotion outcome; canonical main remains unchanged.

**Acceptance:** Criteria 1-8 from `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/spec.md`.

- **spec:** `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/spec.md`
- **tickets:** `.orch/tickets/target-aware-promotion-rehearsal-v2-2026-08-30/`

## Iterations

### 1 — corrected intake and workspace adoption

- Adopted clean isolated candidate worktree at `ab8cbb5a381f3628a9084b738bc0836d1636fdef`, derived from main `76871b12ebf5c75b2681360c1941fbd7ec908012`.
- Reused the original passing preflight and write-once pre-change Level 53 baseline; did not recapture or reveal promoted Level 53 results.
- Corrected historical `ba75b5…` versus committed `6b375b…`; frozen terminal outputs are the sampled behavioral oracle.

### 2 — ticket claimed

- Claimed `T-001` at `2026-08-30T23:30:42Z`; check card landed before the promoted Level 53 reveal.

### 3 — fixed replay and terminal outcome

- Focused controls PASS 26/26.
- Golden Levels 1-52 PASS: execution crossed `compareGolden52` and entered Level 53 after all 15,600 exact matches.
- Level 53 FAIL: `Level 53 changed same-speed winning outcome` at `solver/promotion-replay.js:184`; protocol outcome `RETAIN_CHAMPION`.
- No result artifact was written and no rerun or post-reveal change occurred.
- Ordinary regression evidence: full suite 242/245 with exactly the three baseline receipt failures; curve PASS; engine and game hashes unchanged.

## Blame classes

[]

## Failed approaches

- Original rehearsal cannot finish as written because its exemplar hash does not match committed challenger source. Superseded by this corrected run; no historical record was rewritten.

## Queued scope

- Merge, push, champion replacement, ledger/receipt updates, and Universe refresh remain separate owner-approved work.
- Future harness improvement: persist the first failing Level 53 seed and terminal diff before returning nonzero. It is intentionally not repaired after this reveal.

## Terminal

- **state:** failed
- **deciding evidence:** `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/promotion-failure.md`; named experiment outcome `RETAIN_CHAMPION`.

## Post-terminal correction

- The v2 replay was a duplicate: original run commit `73b1f3c` completed the authorized reveal at `2026-08-30T23:26:53Z`, before v2 was claimed at `2026-08-30T23:30:42Z`.
- V2 is `INVALIDATED`; its earlier `RETAIN_CHAMPION` classification is superseded by `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/correction.md`.
- The authoritative outcome remains the original run's `RETAIN_CHAMPION`, receipt SHA-256 `acc15f15fd87132d3343299b39083cc4d1037d65db5010ea757840b38bc980ec`.
