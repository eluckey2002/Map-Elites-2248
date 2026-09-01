# Report — RESULT-0020

Resolves every check declared in [protocol.md](protocol.md), by name, in
order. Registered at commit `b09737b` before any game was played.

**Artifacts**

- Screen (diagnostic, not reportable):
  `.orch/runs/result-0020-target-aware-replication-2026-09-01/evidence/screen.json`
  identity `08a87042a4f66321…`, 520 paired cells.
- Holdout (reportable):
  `.orch/runs/result-0020-target-aware-replication-2026-09-01/evidence/holdout.json`
  identity `90c4dc6fffc4aab8…`, 15,600 paired cells, 52 levels x 300 seeds.

---

## C1 — negative control — **PASS**

`solver/bot.js` at commit `52f500c` has sha256
`9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`, which is
exactly the `champion` source hash recorded in `RESULT-0018`'s holdout
artifact. Its `chooseMove` was played against today's `chooseBaseMove` through
the evaluator's own `playToTerminal`, 52 levels x 10 screen seeds.

**520 of 520 plays identical** — move sequence, terminal score, move count and
stop reason all equal. The champion arm is the policy `RESULT-0018` measured,
so this run is a replication rather than a new experiment.

## C2 — positive control, run before any measurement — **PASS**

Same 52 levels x 10 screen seeds, comparing the two arms as the evaluation
wires them after commit `ab4b9d7`.

**480 of 520 cells differ, and all 52 of 52 levels show at least one differing
cell.** The declared bar was a strict majority differing with every level
represented; both hold.

Recorded for contrast, because this is the failure the check exists to catch:
before `ab4b9d7` the same measurement returned **520 of 520 identical**. The
champion arm pointed at `chooseMove`, which `DECISION-0004` had promoted to
the target-aware policy, so the instrument was comparing that policy with
itself. It exited 0 and would have written 15,600 cells of zero.

The screen artifact agrees independently: 479 of its 520 cells carry a
non-zero `changedMoveCount`.

## C3 — suite unchanged — **PASS**

`node --test solver/tests/*.test.js` at `ab4b9d7`: **270 tests, 267 pass, 3
fail.** The three failures are exactly the ones named in the protocol's
*Starting state*, all pre-existing known-decided receipt staleness:

- `candidate-levels-52.json has a receipt that verifies against the current bot`
- `candidate-levels-54.json has a receipt that verifies against the current bot`
- `candidate-levels.json has a receipt that verifies against the current bot`

No new failure. The total rose from 268 to 270 because this work added two
tests — one pinning `--protocol` and `--exploratory` as parseable, one
pinning the two arms apart. The protocol declared the ratio is not the check;
the named failures are.

---

## P1 — primary empirical prediction — **SUPPORTED**

All six predeclared counts reproduce **exactly**.

| Prediction | RESULT-0018 | This run | |
| --- | --- | --- | --- |
| existing wins made faster | 9,354 | **9,354** | match |
| tied | 6,186 | **6,186** | match |
| existing wins made slower | 0 | **0** | match |
| champion-win regressions | 0 | **0** | match |
| champion losses converted to wins | 9 | **9** | match |
| levels showing a faster case | 52 | **52** | match |

Both zeros hold — the two `DECISION-0004` rests on. 15,540 of 15,600 cells
were won by both arms.

The counts were computed by a script fixed against the screen artifact before
the holdout was opened, and applied to the holdout unchanged.

## P2 — guard against a worse system that scores better — **no breach**

Mean terminal score delta across all 15,600 cells: **−970.3 points**.
`RESULT-0018` recorded the challenger averaging 970 points lower. The
predeclared reading was that a deficit of that order is the known accepted
cost of stopping earlier with less overshoot, not a new finding, and that is
what the run returned. No new failure mode: no existing win made slower, no
champion win lost.

This remains the honest limit `RESULT-0018` stated. If maximizing terminal
score rather than reaching the target were the objective, neither result
supports the change.

## P3 — is the gain just more compute? — **BREACH of the predeclared band**

Predeclared 1.3x–1.6x, against `RESULT-0018`'s 1.45x (recomputed 1.453).
**Measured 1.965x.** That is outside the declared band and is reported as a
breach rather than rounded toward the original.

A mechanism accounts for most of it, and it is a defect in the tree rather
than a property of the policy. `bot.js`'s promoted `chooseMove` is
byte-identical to `chooseTargetAwareMove` apart from the identifiers — the
promotion copied the policy rather than moving it — and the challenger calls
`chooseMove` as its fallback. So the shipped challenger evaluates the
target-aware override **twice per move**: once inside the promoted bot, once
in its own body.

Timed on 52 levels x 5 screen seeds, three interleaved rounds after a warm-up:

| Arm | Mean | Ratio to champion |
| --- | --- | --- |
| champion, `chooseBaseMove` | 9,914 ms | 1.000 |
| challenger as shipped, two override checks | 20,133 ms | 2.031 |
| challenger with a single override check | 16,750 ms | 1.689 |

The two challenger variants produce **identical plays on all 260** — the
override is idempotent, so the second evaluation changes nothing and costs
~17%. Removing the duplication moves the ratio most of the way back toward the
original figure; the residual sits inside what wall-clock on a shared machine
across a different sample can explain, and the protocol declared timings
diagnostic for exactly that reason.

Recorded as a breach, not explained away. Two things follow and neither is
done here:

- `solver/target-aware-challenger.js` should call `chooseBaseMove`, not
  `chooseMove`. It is a frozen file for this record and is not touched.
- The duplication between `bot.js` and the challenger is dead weight left by
  the promotion. That is a code question, not an evidence question.

**No effect on P1, P2 or P4.** Those are deterministic move and score
outcomes, and they reproduced exactly. The doubled override changes cost, not
play.

## P4 — magnitude of the effect — **SUPPORTED**

Mean all-cell move saving **1.271**, matching `RESULT-0018`'s 1.271 exactly.
The declared `SUPPORTED` condition was exact equality.

## P5 — provenance — **PASS**

The holdout artifact carries:

```json
"registration": {
  "exploratory": false,
  "protocol": "RESULT-0020",
  "protocolCommit": "b09737b58e30e9263bb1ccc82c605a22f5f8b8ab"
}
```

`b09737b` is this protocol's own registration commit, and it is a strict
ancestor of the commit adding this report. The commit did not exist when the
protocol was written and cannot have been added to the artifact afterward
without rewriting it, which would break its `artifactIdentity`.

This is the property `RESULT-0018` could not have and the only thing this run
adds that the original lacked.

---

## What this run establishes, and what it does not

**Establishes:** `RESULT-0018`'s holdout result is reproducible from a clean
checkout of `main` under a protocol committed before the data existed. Every
move-based prediction matched to the unit on 15,600 paired games.

**Does not establish:** anything new about the policy. This is a replication,
not a stronger claim. `RESULT-0018` keeps its own standing and its own
`proof_class`; nothing here promotes it.

**Does not touch:** `solver/bot.js`. `DECISION-0004` is an `owner_decision`
and this run agreed with it, so there was nothing to re-put. Had P1 been
falsified, the correction would have been recorded and the code left alone.

**One thing the original could not have told us,** surfaced only by re-running
it: the promotion duplicated the policy instead of moving it, and the
experimental challenger has been paying for that duplication ever since. See
P3.

---

## Addendum — 2026-09-01, after adversarial review

Appended after this report was committed. It corrects commentary, not a check
outcome: P1, P2, P4 and P5 are unaffected, and P3 remains a **BREACH**.

**P3's corrective timing table does not reproduce, and understated itself.**

An independent re-run of the same procedure (52 levels x 5 screen seeds, three
interleaved rounds after warm-up) returned champion 19,721 ms, shipped
challenger 37,358 ms (**1.894x**), single-override challenger 28,029 ms
(**1.421x**) — a 25.0% saving from removing the duplication, not the ~17%
reported above. Absolute times differ from this report's by roughly 2x, which
is what an unpinned wall-clock measurement on a shared machine does.

Two things follow, and the second is the one this report got wrong.

1. The table has no artifact behind it and should not have been stated as
   precisely as it was. The claim it exists to support — that the two
   challenger variants play identically — is separately verified at a wider
   denominator (1,040 games, all 52 levels) and stands.
2. **This report's own corrected figure, 1.689x, is itself outside the
   declared 1.3x–1.6x band, and the report did not say so.** Writing that it
   "moves the ratio most of the way back toward the original figure" was true
   and incomplete. The honest statement is that removing the duplication does
   not by itself bring the ratio inside the declared band on this machine,
   though the independent re-run's 1.421x does land inside it — which is a
   further reason to treat the band, not the mechanism, as the defective part.

**The band should not have been a pass/fail check.** The protocol declares
wall-clock timings diagnostic under *Instrument bound* and then hangs a
predeclared threshold on them. Those two statements are in tension, and the
artifact records no CPU count, worker-pool size, or machine load that would
let anyone reproduce either figure. A future protocol should report the ratio
and explain a deviation, without a threshold that a second machine can move.

**Also corrected:** C2's supporting sentence above cites the screen artifact's
479-of-520 as independent agreement with C2's 480-of-520. Those are different
samples that coincidentally share a denominator — C2 ran 52 levels x 10 seeds,
the screen is 13 levels x 40 seeds — and `changedMoveCount` is a weaker measure
than C2's whole-sequence equality, since it compares positionwise only up to
the shorter sequence. The two numbers are consistent, but one does not
corroborate the other.
