# MAP-Elites comparable-round composition

- **name:** `map-elites-comparable-round`
- **description:** Add measurement controls, then run one shared-axis MAP-Elites archive with wholly fresh evaluation seeds.
- **entry:** `routed`

## Steps

1. **id:** `measurement-controls`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** `.orch/runs/2026-08-28-map-elites-measurement-controls/spec.md`
   - **binding:** Return a committed code revision whose runnable acceptance checks pass.
2. **id:** `independent-round`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** `.orch/runs/2026-08-28-map-elites-independent-round/spec.md`, to be drafted and stamped only after `measurement-controls` returns its fixed revision identity.
   - **binding:** Use the predecessor revision as evidence and run exactly one frozen-axis, disjoint-evaluation-seed archive.

## Edges

- **seq:** `measurement-controls` -> `independent-round`; the committed code revision and its final verification become evidence in the successor research spec.

## Invariants

Never modify the shipped game, champion, bot, engine, authoring system, generator, accepted original MAP-Elites archive, or prior 2026-08-28 transition archive. Never compare archives as shared-coordinate coverage unless the verifier proves that their chain-style and patience bin axes are identical. Never call a selected-screen winner stronger without positive disjoint holdout lift at the existing `t > 3` bar. Never draft the successor research spec before the predecessor code result identity exists.

## Done check

PASS only when: the code step returns a clean committed revision with every code-spec criterion passing; the research step returns a verifier-passing run-scoped archive whose recorded axes identity equals the accepted original archive's axes identity and whose screen and holdout seed sets are disjoint from each other and from both prior archives; every protected identity remains exact; and the synthesis separates coverage, selection fitness, holdout generalization, and champion standing. Otherwise return FAIL or UNVERIFIED with all partial evidence retained.

Require: the owner's accepted instruction to continue, the frozen code spec, the accepted original archive identity, the protected baseline identities, and the predecessor result envelope at the sequential boundary.

Return: result envelope containing status, code revision identity and verification, research artifact identities and verification, protected-baseline verdict, synthesis identity, uncovered remainder, decision gaps, queued scope, and feedback.

## Recovery record

The `independent-round` run returned failed after its frozen spec named an incorrect full SHA-256 for the already-existing prior transition map. The evolution itself is not retried. Corrected run `2026-08-28-map-elites-independent-round-verification` takes the fixed new archive/map identities plus the prior ticket's exact map identity as evidence and owns final verification and synthesis. This changes the defective input, not the experimental method or result.
