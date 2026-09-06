# Independent contract review

Review 1; received 2026-09-05 (America/Chicago). Reviewer:
`/root/contract_review_gpt_5_6_sol_ultra`; fresh no-context `orch_planner`
profile applying `orch-verify`, read-only and message-only. The root author
transcribed the returned text below without changing its verdict or scope.

## Verbatim return

Reviewed identities:

- Base: `76d4e82b967ec1370b83bd8195c646ff4c27e9e0`
- Ticket at review time: `857b8d9b3f8b7ca17b6c811e7a62158d48a1f31ce04186e52cb6f5fa8acad8cd`
- Reviewed ticket slice, lines 19–94: `dda3206fb39288870b60311fcd5368146cdc0c130100064ae6d010616beafe34`
- Plan: `6310780fa70e31951345f3fa35f1160b3b13fa5bc39bc22410e49a9765fadfb2`
- Contract: `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`
- Inputs: `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`
- Consulted source identities:
  - `src/game.js`: `22ebc237b6750fff04251c1b123cc6be749b8b75f3146d6e42576c509dc97bf2`
  - `solver/engine.js`: `0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873`
  - `solver/bot.js`: `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`
  - `solver/human-benchmark.js`: `833ffd97f18ef0969584a824c7c460fad30633ef980564baa5ceacfdbb0429c6`

### C2

- `verdict`: `PASS`
- `oracle_class`: `judged`
- `oracle`: Fresh independent judgment against every Step 1 requirement and ticket C2’s binary failure anchors.
- `evidence`:
  - Identity and pairing are operationally fixed in contract §§2–4: exact reference entrypoint/defaults; authoring-evaluator exclusion; canonical subject identity; case identity; strict uint32 seed acceptance; paired subjects/seeds; separate live RNG streams; fixed lookahead convention; and distinct historical provenance panels.
  - Terminal semantics are explicit in §3. Contract lines 37–39 require validation, merge/scoring, gravity, refill, blocker tick, then bomb → target → budget → no-legal-move precedence. This matches `game.js` lines 626–629 and 687–728; a same-move bomb therefore defeats a target crossing, while crossing on move B precedes budget exhaustion.
  - Reliability, weighting, and missingness are explicit in §§4–5: any lost reference win vetoes eligibility; required unresolved rows prevent a complete-panel verdict; duplicate attempts receive fractional within-case weight; byte/canonical-payload copies count once; cases receive equal weight; speed uses the fixed reference-win set S; converted wins precede speed; empty panels, empty S, ties, and no-success cases have stated treatments.
  - Score treatment in §6 fixes a common external horizon, preserves original B in policy state, requires the target-disabled variant to be identified, treats genuine early failure as absorbing rather than fabricated zero, leaves incomplete traces unavailable, and forbids unequal-horizon or mixed-objective results from becoming performance claims.
  - Unknown historical provenance is not promoted: ordinary play remains `current-subject replay`, candidate recordings require receipt resolution, inspected records are not fresh holdout, and panels cannot be pooled.
  - Finite-set labels are expressly separated from statistical significance, universal reliability, and promotion in lines 96 and 116–120. The absent numeric improvement and cost limits are correctly deferred to committed later protocols, as the plan requires.
  - No Step 2–4 work is executed or authorized by the contract; §§7 and 9 preserve the required sequence.
- `coverage`: Ticket Objective, Fixed inputs, and Completion test; plan R1–R6 and Step 1; complete frozen contract and inputs identities above; relevant source-bound semantics from the four cited source files.
- `defects`: None found under the declared failure anchors.

### C3

- `verdict`: `PASS`
- `oracle_class`: `evidence`
- `oracle`: Source-defined terminal order, direct arithmetic, and independent application of contract rules to E01–E18.
- `evidence`: Source order cited above. Direct calculation produced E01 `D=2`; E02 joint-win diagnostic `+4`; E03 `N=1`, `N/n=0.5`, `D=-2`; E04 `D=0`; E06 per-case values `+2,-4`, therefore `D=-1`, versus the incorrect pooled `+0.5`; E16 raw delta `+20`. Every remaining interpretation follows directly from the written eligibility, missingness, terminal, horizon, and identity rules.
- `coverage`: Contract §§3–8, all eighteen worked examples, contract/input identities, and the cited game/engine terminal semantics.

Independent E01–E18 interpretations:

- E01: Eligible; `N=0`, `D=+2`; `FASTER_ON_THIS_SET`.
- E02: `INELIGIBLE`; the surviving joint win’s `+4` diagnostic cannot offset the lost reference win.
- E03: Eligible; `N=1`, `N/n=0.5`, `D=-2`; `BETTER_ON_THIS_SET_BY_WINS`, slowdown disclosed.
- E04: `N=0`, `D=0`; `TIED_ON_THIS_SET`; score cannot break the tie.
- E05: `S=∅`, `N=0`, `D=N/A`; `NO_SUCCESS_OBSERVED`.
- E06: Case A mean saving `+2`; case B `-4`; equal case weighting gives `D=-1`, hence `SLOWER_ON_THIS_SET`. Attempt pooling’s `+0.5` is invalid.
- E07: Two retained paths, one captured attempt; metrics unchanged.
- E08: Full panel `UNRESOLVED`; any resolved-subset output must be labeled.
- E09: Bomb loss; `t=null`.
- E10: Valid win at `t=20`.
- E11: No score-quality inference; human score at move 20 is unavailable.
- E12: Matched-horizon, mixed/unknown-intent diagnostic only; bot retains original `B=20` and stops externally at `H=10`.
- E13: Horizon completion in target-disabled score mode; not a target-game loss.
- E14: Absorbing score `70` through H; actual moves `4`; bomb failure retained.
- E15: Harness failure is unresolved; only separately reproduced illegal/no-choice policy behavior on valid input is `policy-failure`.
- E16: Raw delta `+20`; percentage unavailable.
- E17: Distinct cases because target is part of subject identity; record the initialized-grid collision without claiming independence.
- E18: Eligible; `N>0`, `D=N/A`; `BETTER_ON_THIS_SET_BY_WINS`.

Not checked:

- C1’s complete manifest/source/recording resolution.
- C4’s repository-wide diff and scope inventory.
- C5’s committed freeze, acceptance record, links, or deterministic gate.
- No games, replays, benchmark runs, production tests, candidate evaluation, or prior-result assessment were performed.

`changed_artifacts`: `[]`
