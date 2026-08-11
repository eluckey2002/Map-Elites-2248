# Runtime composition: BL-0001 compact-signature experiment

- **name:** `bl0001-compact-signature-2026-08-11`
- **description:** Build, run, and admit one frozen compact-state signature experiment without promoting bounded results.
- **entry:** `named`
- **request:** Execute the owner-approved BL-0001 priority and derive only the infrastructure justified by its real run.

## Steps

1. **id:** `code`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** `.orch/runs/bl0001-compact-signature-code-v2-2026-08-11/spec.md`
   - **context packet:** implement a deterministic, tested compact-signature experiment runner and frozen scenario manifest; produce no research conclusion.
   - **lens:** code-pack correctness, contract, scope, and shape lens.
   - **profile:** `orch-planner` for the delivery body; pack executors retain their bound profiles.
2. **id:** `research`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** pending until `code` returns its fixed result identity; `orch-spec` must create `.orch/runs/bl0001-compact-signature-research-2026-08-11/spec.md` with that identity in evidence.
   - **context packet:** execute the fixed runner against the frozen manifest, independently verify the receipt, and answer which declared signatures collide at the bounded horizons.
   - **lens:** research-pack rigor, provenance, claim-boundary, and synthesis lens.
   - **profile:** `orch-planner` for the delivery body; pack executors retain their bound profiles.
3. **id:** `records`
   - **unit:** `orch-deliver`
   - **pack:** `orch-content-pack`
   - **spec:** pending until `research` returns its fixed result identity; `orch-spec` must create `.orch/runs/bl0001-compact-signature-records-2026-08-11/spec.md` with that identity in evidence.
   - **context packet:** update the experiment protocol, BL-0001, CURRENT, BL-0002, and the evidence ledger at exactly the verified research standing.
   - **lens:** content-pack voice, structure, skim, length, claims, and audience lens.
   - **profile:** `orch-planner` for the delivery body; pack executors retain their bound profiles.

## Edges

- **seq:** `code` result identity becomes required evidence for the `research` spec.
- **seq:** `research` result identity becomes required evidence for the `records` spec.

## Superseded step attempt

- `.orch/runs/bl0001-compact-signature-code-2026-08-11/spec.md` was rejected before execution because its no-commit live-checkout contract could not satisfy `orch-tdd`'s isolated clean baseline and per-slice commit requirements. Its worklog and failed ticket preserve the defect; it produced no deliverable change. The `code` step above points only to the corrected v2 spec.

## Invariants

- The `code` step may define and test measurements but may not state that a signature is retained, rejected, or useful beyond its test fixtures.
- The `research` step may claim only what the frozen receipt and independent verifier establish; resource exhaustion or an unfinished fixture is `INCONCLUSIVE`, not collision-free.
- The `records` step may update planning and evidence standing but may not change code, rerun the experiment, select a later proof formulation, or rewrite historical ledger claims.
- Every step preserves the shipped rule semantics, the frozen Level 26 proof classes, existing dirty work, and the protected historical handoff.
- No step may treat a reduced-board fixture as a proof about the full 5x8, 32-move Level 26 horizon.
- No step commits, publishes, or starts BL-0002's proof-formulation work.

## Done check

A fresh verifier, given only the final records result and this composition, must confirm that: the named code checks pass; the frozen experiment receipt re-verifies; every reported collision has a reproducible exact counterexample; bounded non-collisions are not promoted to exactness; BL-0001 and CURRENT reflect the verified outcome; BL-0002 is no stronger than owner-authorized; the ledger uses an exact proof class and scope; all local links resolve; and no surface outside the three step scopes changed because of this composition.

## Require

- Owner authorization to execute the accepted priority sequence.
- Completed intake investigation `.orch/tickets/bl0001-compact-signature-2026-08-11/intake-investigation.md`.
- Live access to the repository and its pre-existing dirty solver evidence.

## Return

- Result envelope with terminal result identity, end-to-end verification verdict, per-step result identities, changed artifacts, uncovered remainder, queued scope, and this composition path.
