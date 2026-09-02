---
id: SV-RESEARCH-001
run: 2026-09-01-seed-variance-verdict
status: complete
executor: orch-research
pack: orch-research-pack
depends_on:
  - b149eda598d59a9db3750cbbf721c3a9f6dad078
write_scope:
  - experiments/RESULT-0021/
  - EVIDENCE_LEDGER.md
  - .orch/runs/2026-09-01-seed-variance-verdict/
  - .orch/tickets/2026-09-01-seed-variance-verdict/
excluded_actions:
  - change executable code
  - rerun on alternate seeds
  - decide qualitative human-play needs
bound: one registered confirmation and one challenge
claimed_by: root-codex
claimed_at: 2026-09-01T23:59:00Z
---

# SV-RESEARCH-001 — Registered seed-variance verdict

## Completion test

All seven rigor conditions and all six runnable checks in the frozen research
spec pass. The exact historical claim and the current result are reported as
separate evidence propositions.

## Result

- **Evidence revision:** `1e5311ef53d9fbf5c3e694e1bce371fd18ca4381`.
- **Canonical storage:** `experiments/RESULT-0021/`.
- **Historical reconstruction:** `INCONCLUSIVE`. Commit `c782111d` introduced
  the `r = 0.98` sentence by changing only `HANDOFF.md`; no primary measurement
  artifact, seed ranges, or computation was found.
- **Current registered result:** `r = 0.999428550196873`; pooled within-level
  variance `84,459,875.4064`; between-candidate variance component
  `2,481,397,518.7770`; between/within `29.3796x`; single-seed reliability
  `0.9670831763`.
- **Design verdict:** `NOT_SUPPORTED_AS_NECESSARY_FOR_SEED_CONTROL`. This is
  deliberately silent about qualitative human play.
- **Challenge receipt:** `95d4552269c15c8ff8f61631c3c5c03b930071a93da59673fe77e03490d2ce86`.
  Valid PASS, controlled broken twin FAIL, exact-batch consumer PASS/FAIL, and
  evaluator-identity mutation invalidation all replay through the production
  verifier.
- **Admission receipt:** `aae5beca8a054b5d495e62f3da6c9d689a41ec2c2496200ff6382f4b61518549`.

## Verification

- `node experiments/RESULT-0021/verify.js` — PASS after the evidence commit.
- `node tools/verify-experiments.js` — PASS after ledger admission.
- Focused generator/evaluator/seed-variance/experiment suite — 43/43 PASS.
- Full suite with required capabilities — 280/284, with exactly the four
  pre-run failures and no new failure.
- `git diff --check` — PASS.

## Residual limits

- The protocol file remains byte-frozen with `status: registered`; changing
  the frontmatter after data would invalidate the protocol identity embedded
  in the artifact. Completion lives in the report, ledger, and this ticket.
- The full repository suite is not globally green: three stale receipts and
  unrelated root-worktree `.orch` state remain explicit failures.
