# MAP-Elites protected transition

- **run:** `2026-08-28-map-elites-transition`
- **objective:** A second-generation, independently verifiable MAP-Elites evidence packet exists beside the untouched 2248 product, showing whether a larger fresh-seed search expands the known behavior archive and whether its best screened elite retains a positive advantage on disjoint holdout games.
- **routing:**
  - **pack:** `orch-research-pack`
- **question:** With the shipped game, champion, level-authoring system, candidate receipts, recordings, ledger, and original MAP-Elites archive held fixed, what additional behavior coverage and holdout-supported policy evidence does a maximum-bounded fresh MAP-Elites run produce?
- **source policy:** Use only the clean isolated `map-elites-learning` checkout at commit `be843368be8e19ec59501aae38f19eebaf188b87`, its accepted `RESULT-0017`, its existing verified archive, its committed runner/verifier, and the new run's machine-readable outputs. The main 2248 checkout supplies preservation identities only. No web claims, retrospective prose, selected-screen score, or memory-derived fact may establish the result.
- **rigor bar:** Every load-bearing artifact claim must pass the committed independent verifier and carry a SHA-256 identity. Every policy-quality claim must be computed from the new artifact's disjoint holdout scores and labeled `heuristic_observation`; selected-screen lift is never promotion evidence. A stronger-policy conclusion additionally requires positive disjoint holdout lift at the project's existing `t > 3` bar. Any weaker outcome is reported as negative, mixed, or `INCONCLUSIVE`, never promoted. The protected identities below must match exactly after the run.

## Non-goals

- Do not change or recommit the shipped game, Level 53 work in progress, rules, scoring, targets, champion, bot, engine, authoring code, generator, candidates, receipts, recordings, ledger, backlog, or original MAP-Elites archive.
- Do not build a production MAP-Elites platform, a learned value function, deeper search, a deterministic puzzle game, or new descriptor axes.
- Do not nominate or adopt a replacement champion from selection evidence.
- Do not repair the three deliberately preserved candidate receipt-identity failures.

## Acceptance

1. **A fresh bounded archive is produced without overwriting prior evidence.**
   - Oracle: run `node solver/map-elites.js --seed 20260828 --iterations 120 --screen-seeds 12 --holdout-seeds 24 --bins 5 --out <absolute-run-evidence-path>` from the clean isolated checkout; require `archive.json` and `map.html` at the new run-scoped path and require the original archive hashes to remain unchanged.
   - Oracle class: `deterministic`.
2. **The new archive is structurally and replay valid.**
   - Oracle: `node solver/verify-map-elites.js <new-output-path>` must report `PASS`, occupied-cell/bin counts, three exact representative replays, and unchanged protected champion/authoring hashes.
   - Oracle class: `deterministic`.
3. **The transition preserves the existing product and research baselines.**
   - Oracle: re-hash every protected main-checkout file, candidate store/receipt, isolated-checkout file, and original archive named under `binding_constraints`; require exact equality with the frozen pre-run identities. The isolated checkout must remain clean.
   - Oracle class: `deterministic`.
4. **The larger run is compared honestly with the accepted 48-iteration baseline.**
   - Oracle: a synthesis packet reports old versus new occupied cells, axis span, evaluated policies, replacements, best screened representative, and every representative's screen/holdout lift from the two machine-readable archives, with observation separated from inference.
   - Oracle class: `evidence`.
5. **Any policy-improvement claim clears the holdout bar or is refused.**
   - Oracle: recompute paired holdout lift and clustered significance for the best-screen representative against the archived champion scores using committed `solver/policy-eval.js`; require positive lift and `t > 3` to call it stronger. Otherwise the synthesis must say no stronger policy was established.
   - Oracle class: `deterministic`.
6. **The result states what MAP-Elites yielded and what remains unknown.**
   - Oracle: the final synthesis answers coverage, behavioral diversity, generalization, champion standing, and next evidence needed, with a contradictions section and gaps register.
   - Oracle class: `evidence`.

## Binding constraints

- Run configuration is frozen at seed `20260828`, 120 mutations, 12 selection seeds, 24 disjoint holdout seeds, and five bins per axis. This is the committed runner's maximum mutation bound.
- New output may be written only under `.orch/runs/2026-08-28-map-elites-transition/evidence/` in the main checkout. The isolated source checkout is read-only.
- Main-checkout protected identities before execution:
  - `src/game.js` `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee`
  - `solver/bot.js` `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`
  - `solver/engine.js` `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
  - `solver/level-author.js` `305731fbfd7e664075dc177e8be48f5bf530d1f8475f5fd8c501cef84149b257`
  - `solver/generate-levels.js` `d7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842`
  - `EVIDENCE_LEDGER.md` `9ec0a0a184735b88f0eba5a8fd21a5cd0da01b0b62a51543c5cc2ff358aa17df`
  - `CURRENT.md` `4af04b57d4f1ae2b1d8062ebc3295bead827f44e7edec3f04cbda447a1b06a47`
  - `solver/candidate-levels-52.json` `6637108c3a067491a4ca6221e8d869a41dfc565f6095d740891c61a0e0aaaaba`
  - `solver/candidate-levels-52.receipt.json` `1f5428cedffe16f57d9bf6a0aa8cd4247f60cc7806c26efaba6a879998a213bd`
  - `solver/candidate-levels-54.json` `85fec476d726fde61f2d5e37f3c6c0540853e653d0a542f84936a925116cfa7e`
  - `solver/candidate-levels-54.receipt.json` `68bd8e99b85976c80ce108a3d92884904c3ead2c55dbc0b1d43cd384b916af9e`
  - `solver/candidate-levels.json` `0b046cfe11090e2b8a3836e0964913800c115b2a4d16f558acc08b725bdfedda`
  - `solver/candidate-levels.receipt.json` `261ad85e9566974cf709429bd566a627a4fe5413db0d15e90fe8efa0ec8a6e0b`
- Isolated-checkout protected identities before execution:
  - clean HEAD `be843368be8e19ec59501aae38f19eebaf188b87`
  - champion commit `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`
  - `src/game.js` `9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115`
  - `solver/bot.js` `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`
  - `solver/engine.js` `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`
  - `solver/level-author.js` `305731fbfd7e664075dc177e8be48f5bf530d1f8475f5fd8c501cef84149b257`
  - `solver/generate-levels.js` `d7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842`
  - `EVIDENCE_LEDGER.md` `ff30067d23e4d1bd1b40dd6c6882c7dda5ecf721e43127a0ab0f182e6766d716`
  - `CURRENT.md` `4af04b57d4f1ae2b1d8062ebc3295bead827f44e7edec3f04cbda447a1b06a47`
  - original `archive.json` `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c`
  - original `map.html` `c1e27d78431f64e4378c286bc6a3cb1882db131573f1aa0cbba357174a692b1a`
- Preserve the distinction between archive coverage, selected-screen fitness, disjoint holdout performance, optimality, and human strength.
- If execution fails, retain the partial run evidence and report the exact terminal state; do not widen bounds or change code in place.

## Evidence

- `.orch/tickets/2026-08-28-adhoc-current-overview/current-overview.md` — accepted intake investigation and pivot-readiness distinction.
- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/EVIDENCE_LEDGER.md`, `RESULT-0017` — accepted bounded archive result and proof class.
- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/.orch/tickets/2026-08-22-map-elites-learning/T-001.md` — original fixed run, oracles, protected hashes, and limitations.
- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/solver/map-elites-output/archive.json` — baseline archive identity `11e50d6b...`.
- The complete protected identities frozen under this spec's `binding_constraints`.

## Affected surfaces

- `.orch/runs/2026-08-28-map-elites-transition/spec.md`
- `.orch/runs/2026-08-28-map-elites-transition/worklog.md`
- `.orch/runs/2026-08-28-map-elites-transition/evidence/archive.json`
- `.orch/runs/2026-08-28-map-elites-transition/evidence/map.html`
- `.orch/runs/2026-08-28-map-elites-transition/evidence/synthesis.md`
- `.orch/tickets/2026-08-28-map-elites-transition/`

## Exemplars

- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/solver/map-elites-output/archive.json` at SHA-256 `11e50d6b...`: imitate its machine-readable separation of reference, screen evidence, archive cells, and representative holdout evidence.
- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/solver/map-elites-output/map.html` at SHA-256 `c1e27d78...`: imitate its visible 5x5 behavior map and separate selection/holdout labels.
- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites/.orch/tickets/2026-08-22-map-elites-learning/T-001.md`: imitate its protected-baseline discipline, verifier-first handoff, and refusal to promote selected results.

## Bound

- One fresh archive run with at most 120 mutants, one verifier pass, one baseline-preservation pass, and one synthesis.
- No retries with changed seeds or parameters. A failed run may be retried once only with the identical frozen command after a confirmed environmental interruption.
- `plan_gate: false` — the owner accepted the protected transition in chat on 2026-08-28.

## Risks

- The fixed axes still come from the eleven-policy pilot and may clip behavior outside that range.
- Holdout is computed for only three representatives, so most occupied cells remain selection-only evidence.
- Doubling screen and holdout samples reduces noise but does not remove stochastic fitness or winner's curse.
- The existing parameter genome cannot invent learned evaluation structure or deeper planning.

## Assumptions

- “Transition” means begin a MAP-Elites research lane beside the intact 2248 product, not replace the product or champion.
- The current dirty main checkout belongs to the owner and must remain untouched outside the named run-state paths.
- The isolated `map-elites-learning` checkout is the authoritative experiment source because it is clean, committed, and verifier-complete.
