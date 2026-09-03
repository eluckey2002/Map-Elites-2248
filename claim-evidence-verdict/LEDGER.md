# Claim–Evidence–Verdict Ledger

This ledger audits claims; it does not replace `EVIDENCE_LEDGER.md` as the
authority for a project's record standing. Audited sources remain read-only.

## CVE-RESULT-0020-001 — Registered holdout outcome

- **claim_id:** `CVE-RESULT-0020-001`
- **source_record:** `RESULT-0020`
- **producer:** `gpt_5_6_sol_high`
- **checked_by:** `orch-check:gpt_5_6_sol_high_1`
- **verdict:** `SUPPORTED AS BOUNDED`
- **verdict_state:** `independently checked; focused snapshot`
- **proof_class preserved:** `heuristic_observation` for any generalization over
  the fixed sample; `direct_source` for artifact identity, completeness,
  registration stamps, source hashes, and commit ordering

### Claim

On RESULT-0020's registered 52-level × 300-seed holdout (artifact identity
`90c4dc6fffc4aab824a6ca557a201c48ca10fe35dc9edaeb077b902163610ca8`;
recorded challenger SHA-256
`6b375b159c836b1eb672647b98fd9b2c6d1229bb8d04db67a18d13df118e2f15`),
the artifact-pinned target-aware challenger made 9,354 existing wins faster,
made zero existing wins slower, caused zero observed champion-win regressions,
converted 9 champion losses to wins, showed faster cases on all 52 levels, and
saved 1.271 terminal moves per cell on average across all 15,600 cells.

### Evidence

| Evidence | Locator | What it establishes |
| --- | --- | --- |
| Frozen holdout | `.orch/runs/result-0020-target-aware-replication-2026-09-01/evidence/holdout.json:1-373,312354-312380`; file SHA-256 `43faa3c3…`; internal identity `90c4dc6f…` | The registered artifact, 52 level identifiers, 300 seed identifiers, level-major cells, source hashes, identity, and protocol stamp. |
| Evaluator validator | `solver/target-aware-evaluation.js:147-162` | `validateArtifact` checks the 15,600-cell denominator, level-major completeness, paired-arm presence, and artifact identity before reduction. |
| Independent producer reduction | `claim-evidence-verdict/producer-recomputation.json` | After validation: 15,600 cells; 9,354 faster both-win; 6,186 tied both-win; 0 slower both-win; 0 champion-only wins; 9 challenger-only wins; 52 levels with a faster case; total terminal-move saving 19,827; mean 1.271 rounded to three decimals. |
| Registered protocol | `experiments/RESULT-0020/protocol.md:90-116,195-248` | Fixes the denominator, seeds, reportable holdout, six prediction counts, mean, and registration test before the run. |
| Report and correction | `experiments/RESULT-0020/report.md:64-94,137-180,185-226` | Reports the count and mean outcomes and preserves limits; the addendum corrects timing commentary without changing these outcomes. |
| Project standing | `EVIDENCE_LEDGER.md:493-506` | Records RESULT-0020 as accepted while preserving bounded heuristic standing and the zero-observed-regression limit. |
| Experiment custody gate | `node tools/verify-experiments.js` → `EXPERIMENT GATE PASS`; `docs/CHECK-CARDS.md:506-539,567-672` | Confirms the current structural/custody checks pass. The cards delimit what that PASS does not prove. |

`DECISION-0004` is excluded from the empirical chain. It is an owner decision
about the engineering champion (`EVIDENCE_LEDGER.md:554-567`), not evidence for
the 9,354 / 0 / 0 / 9 / 52 / 1.271 values.

### Verdict

`SUPPORTED AS BOUNDED` for the exact frozen sample and artifact-pinned arms.
Every quantitative clause recomputes from the artifact after exported
`validateArtifact` succeeds. The registration stamp resolves to protocol
commit `b09737b58e30e9263bb1ccc82c605a22f5f8b8ab`, a strict ancestor of report
commit `1fe26ee87a889d13d6c48159eef054f767feaedf`.

### Limits

- This is a stored-sample result, not proof of universal non-regression or a
  bound over unseen boards, seeds, future levels, or other policies.
- “1.271 moves per cell” means the mean of
  `champion.moves - challenger.moves` across all 15,600 cells, including loss
  cells. It is not a mean restricted to wins or a score-improvement claim.
- The result does not establish higher terminal score. The report records a
  lower mean terminal score because the challenger often stopped earlier.
- It does not establish equal-compute superiority, autonomous learning,
  evaluator correctness, whole-repository trustworthiness, or policy-promotion
  authority.
- `EXPERIMENT GATE PASS` proves specific custody and structural properties. Its
  cards say it does not prove that a report's verdict is true, that an artifact
  was correct when written, or that the stamped artifact was produced by the
  claimed compute.
- The gate does not prove that the frozen/source inventory is complete or
  measurement-relevant. This artifact names five source hashes while the
  protocol freezes seven files; `solver/target-aware-worker.js` is frozen but
  not source-bound in the artifact, and `solver/policy-eval.js` is frozen but
  not loaded by this evaluator. A measurement file absent from both lists would
  be invisible to the gate.
- The holdout records challenger SHA-256 `6b375b159c836b1e…`. Current
  `solver/target-aware-challenger.js` hashes to `3467c1a256cdd81a…` after the
  post-run routing fix at `c37c83a`. This entry does not treat those bytes as
  identical or independently establish behavioral equivalence.
- The audit is a focused two-round snapshot. It does not declare the
  experiment method, evaluator, policy, or repository trustworthy as a whole.

### Reopening conditions

Reopen this entry if any frozen source or artifact hash fails, if artifact
validation or the independent reduction returns a different value, if the
registration commit ceases to be a reachable strict ancestor of the report,
if a broader/current-implementation claim is substituted for the frozen-sample
claim, or if the independent checker rejects or modifies the producer verdict.

### Audit state

Two focused rounds and one fresh-context checker pass are complete. The checker
confirmed both design-risk findings and challenged `C-001`, `C-002`, `C-005`,
and `C-006` with unused completeness, outcome-partition, set-equality, and
alternate-denominator angles. No new failure class was found. This is a
`snapshot`, not an `accepted` or `saturated` audit, and it does not independently
replay the games or establish evaluator correctness.
