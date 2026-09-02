# Report — RESULT-0024

RESULT-0024 is the fresh-seed entitlement retry for RESULT-0023. Its complete
protocol, runner, primary verifier, independent recomputation, permanent
negative tests, and Check Card were committed at `e6da102` before any
RESULT-0024 game ran.

The empirical verdict is **INCONCLUSIVE**. The aggregate evidence entitlement
verdict is **PASS — ENTITLED**, with one explicitly narrowed intermediate
field: `verification.json` labels its own partial result `ENTITLED` before
reading the independent recomputation or final challenge. That field does not
stand alone; final entitlement comes from the complete artifact set below.

## Canonical evidence

- Control artifact: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/controls.json`,
  identity `aa69b1233176124e…`, 144 cells executed twice.
- Control entitlement receipt: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/control-entitlement.json`,
  identity `dabcb1b3e8313b7b…`.
- Confirmation artifact: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/confirmation.json`,
  identity `77a8d7d623d23d12…`, 2,400 reportable cells.
- Primary verification: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/verification.json`,
  identity `6634724c54ee448a…`.
- Independent recomputation: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/independent-recomputation.json`,
  identity `049534b508eeedd7…`.
- Challenge receipt: `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/challenge-receipt.json`,
  identity `e04ae952677fd59c…`.
- Check Card and permanent test: `docs/CHECK-CARDS.md`,
  `topology-control-outcomes-differ`; and
  `experiments/RESULT-0024/control-gate.test.js`.

## C1 — negative repeat control — **PASS**

All 144 control cells repeated exactly through the real `playToBudget` seam.
The first pass took 9,603.31 ms and the repeat 7,471.73 ms. Runtime is
diagnostic; exact outcome equality is the control.

## C2 — outcome-only positive control and broken twin — **PASS**

All 48 paired one-stone/two-stone controls differed in at least one gameplay
outcome field. Identity fields were excluded.

The same check then received a twin made by copying `score`, `movesUsed`,
`behaviorTotals`, and `behavior` from every one-stone cell into its two-stone
partner. The twin independently counted **zero changed outcomes** and returned
**FAIL** with `positive control: zero gameplay outcome pairs differ`.

The permanent pre-run garbage test reproduced the same PASS/FAIL boundary, and
all four RESULT-0024 control/consumer tests passed before real controls.

## C3 — subject, source, receipt, and matrix closure — **PASS**

Both run artifacts reproduce four policy identities, three layout identities,
eleven frozen source identities, and the exact fresh seed sets. The
confirmation contains exactly 2,400 unique expected cells and no RESULT-0023 or
control seed. Every raw behavior summary recomputes from its totals.

Confirmation consumed control receipt `dabcb1b3e8313b7b…` for control identity
`aa69b1233176124e…` and verifier identity `8466cc76849c8f…`. Those exact
identities are recorded inside confirmation artifact `77a8d7d623d23d12…`.
The runner's permanent refusal test proves that confirmation cannot run without
the qualified receipt.

## P1 — primary empirical prediction — **INCONCLUSIVE**

| Policy | Identity | Two-stone vs one-stone response |
| --- | --- | ---: |
| current base | `0de51bc557de` | -18.338% |
| historical long-chain | `a61e8b8e23b7` | -22.071% |
| historical short-chain | `4cbec6509c34` | -19.866% |
| historical late-score | `ebeb9e326a01` | -19.815% |

The interaction spread was **0.0373308**, or **3.733 percentage points**. It is
above the `< 0.02` falsification band and below the `>= 0.05` support band.

The fixed-half extremes were unstable:

| Half | Most affected | Least affected |
| --- | --- | --- |
| `23000000..23000099` | current base `0de51bc557de` | late-score `ebeb9e326a01` |
| `23000100..23000199` | long-chain `a61e8b8e23b7` | current base `0de51bc557de` |

These policies therefore do not establish a stable, materially different
response to this exact topology contrast. The result also does not falsify that
premise under the frozen rule.

## P2 — distinct-style guard — **PASS**

On the open layout, the across-policy range was **1.95104 tiles** in aggregate
mean chain length and **0.0509318** in late-score share. Both clear their
predeclared guards (`0.15` and `0.02`).

The inconclusive P1 is not caused by these policies becoming behaviorally
indistinguishable on the open board. Their measured style differences simply
did not yield a stable five-point topology-response separation.

## P3 — diagnostics and independent recomputation — **PASS**

The confirmation ran all 2,400 cells in **145,197.92 ms**. Only one cell ended
before 24 moves: long-chain on the two-stone layout, an early-termination rate
of `0.005`; all other policy-layout rates were zero. Runtime and early
termination do not affect P1.

The separately implemented recomputation agreed exactly on the verdict, guard,
and half-orderings, and within `1e-12` on every load-bearing number and policy
response. Interaction spread differed only by floating-point evaluation order:
`0.03733081406203867` versus `0.03733081406203864`.

## P4 — evidence entitlement — **PASS — ENTITLED**

The aggregate evidence satisfies every predeclared prerequisite:

- registered source closure strictly preceded control and confirmation;
- real control PASS and outcome-identical control twin FAIL;
- confirmation consumed the exact control receipt;
- complete fresh matrix and identities PASS;
- independent recomputation PASS;
- valid full artifact PASS and one-score identity twin FAIL;
- repository experiment gate PASS, focused tests 19/19 PASS, and RESULT-0024
  tests 4/4 PASS.

### Precision correction on the intermediate receipt

`verification.json` contains `"entitlementVerdict": "ENTITLED"`, but that
script does not read `independent-recomputation.json` or
`challenge-receipt.json`. Read alone, the field overstates its coverage. It is
narrowed here to mean **primary artifact chain PASS**, not final P4 entitlement.
The final P4 verdict above is the report-level join over all six identified
artifacts.

This is documented rather than silently rewritten because the verifier is
frozen evidence code after execution. A reusable aggregate experiment-admission
gate that consumes every component receipt remains queued scope; it is not
invented inside this completed result.

## Campaign disposition

The trustworthy answer is now: **this exact topology-response premise is
INCONCLUSIVE**. Do not spend a larger MAP-Elites, OpenEvolve, or co-evolution
run trying to exploit it as though it were established.

The next useful move is not more seeds on the same contrast. It is a new
premise choice: either define a topology contrast with a stronger mechanical
reason to separate strategies, or test a different descriptor tied directly to
the planning behavior observed in human play. That decision is outside this
run.

No game, solver, policy, champion, archive, pilot, ledger, candidate corpus, or
current-navigation record changed. No claim is made about human personas, fun,
difficulty, shipping, mechanic correctness, or promotion.
