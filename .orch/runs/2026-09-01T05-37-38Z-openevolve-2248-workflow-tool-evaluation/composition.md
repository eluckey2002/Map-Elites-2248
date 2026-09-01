# OpenEvolve 2248 workflow-tool evaluation

## Contract

- **name:** `openevolve-2248-workflow-tool-evaluation`
- **description:** Build, then run, a stable-descriptor matched-control evaluation of workflow tools on the 2248 solver-policy task.
- **entry:** `matched-control-harness`
- **Require:** Owner approval of this frozen composition and its first-stage code specification.
- **Return:** A verified research result that distinguishes tool effects from candidate-space, evaluator, descriptor, budget, and holdout effects.

## Steps

### 1. `matched-control-harness`

- **kind:** code
- **spec:** `../2026-09-01T05-37-38Z-openevolve-2248-matched-control-harness/spec.md`
- **returns:** An exact committed harness revision plus runnable verification receipts.
- **status:** specified; delivery not yet authorized

### 2. `matched-control-research-run`

- **kind:** research
- **requires:** Step 1's exact committed harness revision and passing receipts.
- **spec:** Not written yet. Freeze it only after Step 1 returns an exact result identity.
- **must freeze before execution:** the registered `RESULT-NNNN`, exact harness revision, OpenEvolve revision, provider/model identities, prompt bytes, candidate and evaluation budgets, retry and timeout policy, fresh screen and holdout inputs, stopping rule, analysis plan, cost ceiling, and all protected-file identities.
- **returns:** A repository-admitted result or an explicit `INCONCLUSIVE`/rejected outcome; never an automatic champion promotion.
- **status:** blocked on Step 1 identity and a separately approved execution specification

## Edges

`matched-control-harness` -> `matched-control-research-run`

The edge is strictly sequential. The research specification may cite only the committed harness result and its verification receipts, not a working-tree draft.

## Invariants

1. The subject is solver-policy search in `2248-challenge`, not renderer or art generation.
2. All arms use the same declarative solver-policy candidate schema, starting policy, screen evaluator, fixed behavior axes, screen inputs, candidate-count budget, and selection rule.
3. The accepted MAP-Elites behavior axes remain fixed by exact artifact and axes identity. No arm may fit, rescale, or relabel them from its own observations.
4. Search sees screen evidence only. Holdout inputs and outputs remain inaccessible until every arm is closed and the selected candidate identities are frozen.
5. OpenEvolve and direct-agent arms use the same provider/model, prompt contract, token ceilings, timeout policy, retry policy, and total proposal budget. Random mutation makes no provider calls and reports its zero model cost separately.
6. Candidate failures, duplicate proposals, parse failures, timeouts, evaluator failures, and exhausted retries remain distinct statuses. None silently becomes a free replacement attempt.
7. Raw provider responses are persisted before candidate parsing. Every result is reconstructable from immutable manifests and raw artifacts.
8. The game, levels, protected champion, accepted evidence, and ledger remain unchanged during harness delivery and experiment execution unless a later owner decision explicitly authorizes a separate change with its decision record in the same commit.
9. The experiment may conclude `INCONCLUSIVE`, rejected, or no advantage. No winning arm or candidate is promoted automatically.
10. The research run is registered and committed under `experiments/RESULT-NNNN/protocol.md` before any result data exists, and its live repository gate must pass on the real tree.
11. Previously exposed screen and holdout seeds are not reused for the generalizing result.
12. A missing, truncated, mismatched, or tampered real artifact fails verification; fixture-only tests cannot establish completion.

## Done check

This composition is complete only when:

1. Step 1 returns an exact committed harness revision and all specified positive and planted-negative checks pass against the real checkout and a real generated fixture bundle.
2. A successor research spec is frozen from that revision, registered before data, and separately approved for its stated model-call and cost envelope.
3. The one authorized research execution completes within its frozen bound.
4. Independent verification reconstructs arm accounting, screen selection, descriptor bins, holdout custody, and protected-file identities from the actual result directory.
5. The repository records the outcome with the correct epistemic status, including `INCONCLUSIVE` or rejection when warranted.

## Owner decision recorded with the freeze

On 2026-09-01 the owner selected `2248-challenge` and approved freezing the stable-descriptor, matched-control workflow-tool evaluation specification. This records specification authority only. It does not authorize harness implementation, model calls, experiment execution, result admission, or champion promotion.
