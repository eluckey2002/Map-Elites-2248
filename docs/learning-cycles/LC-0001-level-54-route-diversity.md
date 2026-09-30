# LC-0001 — Level 54 route-diversity learning card

**Created:** 2026-09-27

**Status:** challenger implemented and qualification-audited; no outcome experiment registered

**Training case:** shipped Level 54, seed `1313839221`

**Protected boundary:** do not modify the champion, levels, targets, receipts, recordings, or level-authoring system

## Decision summary

Do not repeat the Level 51 learning experiment. Level 51 seed 1 already produced
the target-aware immediate-finish rule now used by the champion (`RESULT-0018`,
replicated by `RESULT-0020`, and confirmed as the current champion by
`RESULT-0049`). It is the positive control for this learning process, not a new
source of improvement.

Use the largest still-unlearned paired human advantage instead: the owner's
Level 54 seed `1313839221` win. The diagnostic supports one candidate mechanism:
the current generator omits a useful, mergeable route whose immediate score
ties the champion's choice but whose afterstate is much better. The next
challenger should add bounded **route/afterstate diversity** to candidate
generation. It must remain separate from `solver/bot.js`.

This card does not establish that the proposed mechanism generalizes and does
not authorize an experiment run or promotion.

## Frozen case identity

- Source revision: `0a7089b6d2e079650b267e480338c17f9d0caf84`
- Current champion source: `solver/bot.js`, SHA-256
  `3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65`
- Human recording:
  `play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json`,
  SHA-256 `ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78`
- Retained oracle artifact: `docs/oracle/runs/attempt-05-full-corpus.json`,
  SHA-256 `c9ca1f70a6f7c1308adf4ec7acb7aef95f729af4ca998d23f2c9f0fa6074da69`
- Oracle puzzle identity:
  `c1bd39cbead6dd2fe0da32839269b37b04e78b45eee61beaeb205a3957dc8406`

The board is 4×8, has stones at `(1,3)` and `(2,3)`, allows 24 moves,
and has target 126,000.

## Exact outcome

| Player | Target move | Crossing score | Standing |
| --- | ---: | ---: | --- |
| Owner | 15 | 127,040 | replay-valid direct source |
| Current champion | 23 | 129,856 | same board, seed, and target-stop objective |
| Oracle witness | 14 | 126,016 | retained best-known witness; not an optimality proof |

The eight-move owner/champion difference is the selection signal. Crossing
score is final-move overshoot and is not used to rank the policies.

## First consequential decision

After the owner's first move, the state is at score 10,240 with 23 moves
available. On the second decision:

| Property | Owner's route | Champion recommendation |
| --- | ---: | ---: |
| Immediate points | 5,120 | 5,120 |
| Chain sum | 1,024 | 1,024 |
| Chain length | 15 | 16 |
| Survivor before gravity | `(0,7)` | `(2,0)` |
| Present in champion candidate pool | no | yes |

The alternatives therefore tie on immediate score and mergeable sum. The
material difference is which cells are cleared and where the survivor is
placed around the stone barrier.

The same-seed takeover counterfactual isolates the effect:

| Prefix played by owner | Champion finishes on move |
| --- | ---: |
| none | 23 |
| move 1 only | 24 |
| moves 1–2 | 17 |

The first owner move alone does not explain the advantage: it makes the
champion one move slower. Adding the owner's second move makes the champion
seven moves faster than taking over after move 1, and six moves faster than
the untouched champion run. Later owner decisions account for the remaining
two moves between the 17-move takeover and the 15-move human result.

## Generator diagnosis

`analyzeMove` reports that the owner's second route is absent from the current
candidate pool, so this is not yet evidence of a bad ranking weight. The
lookahead cannot value a move it never receives.

The current pool contains six other 5,120-point candidates on that state. They
end at `(1,6)`, `(2,2)`, `(2,0)`, `(3,2)`, or `(2,1)`; none ends at `(0,7)`.
Increasing only the existing `pathWidth` through the tested sequence 1, 2, 4,
8, 16, 32, 64, 128, and 256 still produces neither the exact human route nor a
route with the same endpoint, length, and points. A wider setting of the
existing knob is therefore not a qualifying challenger.

### Observed

- The owner, champion, and oracle all replay to the outcomes above.
- The owner's second route is legal, mergeable, and absent from the current
  candidate pool.
- The equal-score route choice changes the champion takeover result from 24 to
  17 moves on this exact board.
- Widening the existing partial-path beam through 256 does not recover it.

### Hypothesis

The generator's global potential ordering collapses too many structurally
different routes before the lookahead can price their afterstates. Preserving
a bounded set of mergeable routes distinguished by survivor cell and cleared
cell pattern will expose useful setup moves that the current candidate list
misses.

### Not established

- Survivor position by itself is not proven to cause the gain.
- “Prefer corners,” “prefer longer chains,” and “prefer the human route” are
  not supported general rules.
- No general improvement, regression rate, or acceptable compute cost has
  been measured.

## One-rule challenger contract

Build a separate experimental challenger that supplements, but never removes
or reorders, the champion's existing candidates:

> Preserve a bounded route-diverse supplement: during pruning, reserve at
> least one mergeable route for every survivor cell reached by the supplemental
> search, then use any remaining supplement slots for distinct cleared-cell
> patterns; let the existing afterstate scorer choose between the original and
> supplemental candidates.

The implementation may use endpoint-stratified beam retention, mergeable-prefix
emission, or an equivalent bounded search, but its observable contract is the
sentence above. It must not name Level 54, seed `1313839221`, `(0,7)`, the
recording hash, or any recorded chain.

## Qualification before registration

These checks use known training and regression material. They are not outcome
evidence and may be repeated while implementing the challenger.

1. **Training-case generation:** on the state before human move 2, the
   supplement must expose the exact human route or an afterstate-equivalent
   route (same survivor and cleared cells). If it does not, stop.
2. **Training-case consequence:** selecting that route and handing control back
   to the unchanged champion must finish by move 17. If it does not, stop.
3. **Fallback identity:** whenever no supplemental candidate wins, the
   challenger must return the champion's exact chain. Plant a test that changes
   or removes the champion candidate and watch this check fail.
4. **Boundedness:** cap the supplement explicitly and record candidate count
   and wall-clock ratio on the frozen captured-puzzle corpus. Do not tune the
   cap on fresh experiment seeds.
5. **Negative control:** a non-mergeable route and a route duplicate with the
   same survivor and cleared-cell pattern must not enter the supplement. Plant
   each defect and watch the check fail.
6. **Protected surfaces:** `solver/bot.js`, `src/game.js`, targets, recordings,
receipts, and authoring files remain byte-identical.

### Qualification update — 2026-09-30

`solver/route-diverse-challenger.js` and its focused contract checks now exist.
The exact human move-two afterstate is recovered, the unchanged champion still
finishes that trajectory on move 17, shared-candidate scores agree with the
champion scorer, duplicates and non-mergeable routes are excluded, and fallback
returns the champion's exact chain. These are implementation qualifications,
not outcome evidence.

The boundedness audit in `LC-0021-route-diverse-boundedness.json` measures one
initial decision state from each of the 20 frozen captured puzzles (the Level
54 training puzzle plus 19 qualification puzzles). The supplement stays within
its explicit 128-route cap, but at the current default search width of 512 its
aggregate measured decision time is 4.72× the champion time on the 19
non-training puzzles. This exceeds the draft pilot's 2.0× compute gate.
Accordingly, do not register the draft pilot with this configuration. The
fixed 384/256/128/64 width ladder in `LC-0022-route-diverse-cost-ladder.json`
found no qualifying configuration: 384 alone recovered the human route and
still measured 4.73×, while smaller widths lost that route without a meaningful
cost reduction. A future repair needs a separately specified generator redesign
rather than another beam-width trial; it must rerun the existing training and
boundedness qualifications before registration is reconsidered.

The subsequent frozen-corpus attribution in
`LC-0023-route-diverse-cost-attribution.json` locates 83.6% of challenger-only
time in full afterstate scoring, not generation. A one-endpoint-representative
shortcut is rejected by a direct counterexample: it drops the human route.
The narrowly viable next candidate is instead an immediate-point eligibility
gate before expensive scoring. It keeps the full generated supplement and keeps
the human route scoreable because both it and the champion score 5,120
immediate points. This remains a candidate redesign only: it needs an explicit
lower-immediate-point/future-value counterexample before implementation.

## Small promotion experiment — draft, not registered

Registration must occur only after the challenger and its evaluator exist,
their tests pass, and their exact source identities can be frozen. At that
point reserve the next ledger result ID, copy `experiments/TEMPLATE.md`, freeze
the sources, add the seed range to `experiments/SEEDS.md`, and commit the
protocol before running any outcome cell.

### Data boundaries

- **Training only:** Level 54 seed `1313839221`, every owner-prefix takeover,
  and all states or candidates derived from them.
- **Qualification only:** the other 19 puzzles in the frozen oracle corpus.
  They can catch obvious regressions but are already inspected and cannot be
  fresh evidence.
- **Proposed fresh pilot:** all 58 shipped levels × 20 seeds
  `46,000,000–46,000,019`, paired by identical `(level, seed)`. This is 1,160
  pairs and 2,320 games. The range is only proposed until registration and
  must be rechecked against `experiments/SEEDS.md` and the repository before it
  is reserved.

### Primary measures

1. Champion-only wins versus challenger-only wins.
2. Champion-faster versus challenger-faster moves among mutual wins.
3. Mean paired target-cost change, with losses charged at the level move
   budget plus one.
4. Number of levels containing at least one challenger-faster mutual win or
   challenger-only win.
5. Challenger/champion wall-clock ratio as a diagnostic constraint, not a
   gameplay outcome.

### Frozen gates

- **Safety:** zero champion-only wins.
- **Speed safety:** zero challenger-slower mutual wins.
- **Signal:** positive mean target-cost reduction and beneficial cells on at
  least two levels.
- **Compute:** wall-clock ratio no greater than 2.0× on the same machine and
  run. A compute breach blocks confirmation even if gameplay gates pass.
- **Completeness:** exactly 1,160 unique paired cells are persisted before any
  verdict; no cells may be dropped.

### Verdict and stop rule

- `REJECT`: either safety gate fails. Record the exact regressing cells and
  stop; do not widen the rule or rerun on new seeds.
- `NO_SIGNAL`: safety passes but the signal gate fails. Stop; the one-case
  insight did not earn a larger test.
- `READY_FOR_CONFIRMATION`: every gate passes. Stop and ask the owner whether
  to preregister a separate larger confirmation. Do not promote automatically.
- `INVALID`: identities, pairing, completeness, persistence-before-verdict, or
  another protocol condition fails. Close it as a failed run, add exactly one
  row to `FAILED-RUN-LEDGER.CSV`, and land a prevention artifact with a planted
  negative test before trying again.

This pilot is one-fifteenth the game count of the 34,800-game champion
confirmation. Its job is only to decide whether the mechanism deserves that
kind of expense.

## Reproduction commands

```bash
node solver/human-benchmark.js \
  --recording play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json

node solver/board-trace.js \
  --recording play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json \
  --moves 1,2
```

The oracle convenience renderer is source-identity guarded and no longer runs
against this artifact from the current implementation. Inspect the retained
row directly without altering the guard:

```bash
jq '.rows[] | select(.puzzleIdentity | startswith("c1bd39cb")) | {assessment}' \
  docs/oracle/runs/attempt-05-full-corpus.json
```

The takeover and candidate-pool diagnostics in this card were computed from
the same frozen recording with `solver/engine.js`, `solver/bot.js`, and
`solver/human-benchmark.js` at the source revision above. A reusable diagnostic
command is intentionally deferred to the challenger implementation so its
tests can qualify the real seam rather than memorializing a one-off script.

## Verification at handoff

On 2026-09-27:

- the single-recording human benchmark reproduced 15 human moves versus 23
  champion moves;
- the two-move board trace reproduced the equal 5,120-point second choices;
- direct reduction of the retained oracle row reproduced 15/23/14 moves;
- the takeover table and candidate-pool inspection were recomputed from the
  frozen recording;
- `node tools/verify-experiments.js` returned `EXPERIMENT GATE PASS`;
- a direct document-integrity check read this file, found every required
  section, resolved its three pinned source paths, matched all three SHA-256
  identities, and rejected a deliberately corrupted hash; and
- only this learning-card directory is untracked. Protected surfaces retain
  the hashes recorded above.
