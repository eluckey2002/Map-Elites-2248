# Pre-registration — generated-level corpus v1

**Protocol:** `generated-level-corpus-v1`

**Registered:** 2026-08-29, before any corpus generation or policy evaluation under this protocol

**Status:** frozen protocol; execution not authorized

**Purpose:** build a bounded fixture corpus for later policy optimization and evaluation, not a queue of levels to ship

This record freezes one corpus-building run. Changing a source identity, sample
space, structural family, partition rule, seed range, admission rule, bound, or
stopping threshold invalidates this version. The change belongs in a new
pre-registration; it is not an edit made after outcomes are visible.

## Question

Can the existing legal-shape generator produce a structurally broader,
replayable set of level fixtures that is large enough to replace the present
six-level optimization selection panel as the only search universe, while
keeping whole level families and gameplay seeds out of the partitions that
selected them?

This run answers only whether the corpus meets the frozen construction and
coverage criteria below. It does not test a new policy and cannot establish
policy lift, generalization, human difficulty, fun, or shipping fitness.

## Why this is the next bounded inquiry

The accepted fixed-axis MAP-Elites round selected policies on only six shipped
levels, `[1, 10, 20, 30, 40, 52]`, or 11.3% of the 53-level shipped curve. Its
three representatives were then checked on twelve shipped levels, and none had
positive holdout lift. `RESULT-0019` admits that bounded result and explicitly
does not treat it as broad generalization evidence. `UNIVERSE.md` therefore
names evaluation-universe coverage as the first current frontier.

The repository already has the other half of the path: `solver/generate-levels.js`
samples legal shapes, cheaply screens them without a target, sends selected
survivors through the 450-game authoring path, and verifies candidates before
writing. Its current shortlist, however, is ordered by the incumbent bot's win
rate. That ordering is useful when choosing which level a human should play,
but it is the wrong construction rule for a corpus intended to optimize that
same bot: it would condition the universe on the incumbent's behavior. This
protocol therefore uses the existing legality, screen, authoring, calibration,
and replay machinery, but freezes selection by structural family before any
score or win-rate ranking.

## Scope and non-goals

The single deliverable of a later execution is a versioned manifest plus its
identity-bound shapes, candidates, receipts, dispositions, and coverage report.
The corpus has two explicitly different measured pools:

- `playable-core`: identity-confirmed candidates that pass the current
  authoring gates and may be used as optimization or evaluation fixtures.
- `adversarial-stress`: identity-confirmed candidates that fail at least one
  current authoring gate and may be used only for separately reported
  robustness diagnostics.

Screen rejections and duplicate shapes remain in the manifest with their
dispositions. Up to twelve screen rejections receive full measurement through
the frozen stress-probe quota below; unselected screen rejections and
duplicates are not members of either measured pool.

This protocol does **not** authorize any of the following:

- running the generator, implementing a corpus runner, or starting MAP-Elites;
- changing rules, scoring, the champion, calibration, or generator defaults;
- refreshing or overwriting a live candidate store or historical receipt;
- selecting, playtesting, or shipping Level 54 or any other level;
- treating a bot gate as evidence of human difficulty or fun;
- reporting the legacy six-level selection panel as independent validation;
- using `adversarial-stress` cases in the main fitness average or a positive
  generalization claim.

Any implementation needed to execute this exact protocol is a separate,
owner-approved change. The current generator does not itself build a global
multi-seed manifest, assign structural-family partitions, or select survivors
by the family-first rule below; invoking its present default shortlist four
times would not satisfy this pre-registration.

## Frozen source identities

All identities are observations at registration. A later run checks them
before generating its first shape. Any mismatch yields `INVALIDATED`; it does
not get explained away as an equivalent implementation.

| source | frozen identity or standing |
|---|---|
| registration revision | `71dde27f53435ea5b71faedda2801ba1f6135442` |
| protected policy champion | commit `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`, standing unchanged |
| `solver/bot.js` | SHA-256 `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840` |
| `solver/engine.js` | SHA-256 `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6` |
| `solver/generate-levels.js` | SHA-256 `d7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842` |
| `solver/level-author.js` | SHA-256 `defa481e1e45e1de7caa851d479171330a7d832f41c057e5cae75c3646b6454d` |
| `solver/calibration.js` | SHA-256 `584f99aae3dafd7fccd7dc25e0adcb2ae9867f85d267a79261d528c40e1f774f` |
| shipped level source, `src/game.js` | SHA-256 `541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee` |
| target ruler | `calib-1`, solver identity `53550f5ea9b8ab428db02f0c94c5a89f92c5d282221a6da935eddfe6d59370f7` |
| current MAP evidence | `RESULT-0019`: 23/25 cells, 0/3 representatives positive on holdout, champion unchanged |

The `calib-1` parameter snapshot is also frozen by value:
`wRoll=1`, `wPlace=1`, `turnover=40`, `width=24`, `bombMax=9`,
`tieBreak=degree`, `wHarvest=0`, `offerFull=0`, and `pathWidth=1`.
The live champion differs on `wHarvest=2` and `pathWidth=8`; target derivation
must use the calibration snapshot, never those live defaults.

## Frozen current-code facts

These are existing instrument facts, not protocol choices:

- Shape screen: seeds `500000–500023`, 24 games, no target.
- Target fitting: seeds `0–149`, 150 games.
- Candidate holdout: seeds `100000–100299`, 300 games.
- Full authoring cost: 450 games per candidate before verifier replay.
- Current gates: zero lockouts, bomb rate at most 5%, win rate at least 20%.
- Tile scale is derived from level number as `2 ** floor((level - 1) / 10)`.
- A shape cannot control `target` or `tileScale`.
- The shape signature includes grid dimensions, moves, minimum chain, demand,
  and sorted blocker details, but ignores the display name and blocker order.

## Frozen generation envelope

The values in this section are proposed protocol choices frozen before the
run. They are not observations and they do not amend generator defaults.

- Candidate level number: `54`. This selects the current chapter's tile scale;
  it does not reserve or propose shipping Level 54.
- Sampler seeds: `2026082901`, `2026082902`, `2026082903`, and `2026082904`.
- Draws per sampler seed: 120.
- Raw draw bound: **480** shapes total.
- Full-authoring bound: at most **72** globally unique shapes: up to 60
  clean-screen survivors plus up to 12 screen-rejected stress probes.
- One execution only. There is no second sampler-seed batch if coverage is low.

The current sampling space is frozen exactly:

| control | values |
|---|---|
| grid width | integers 4–7 |
| grid height | integers 5–8 |
| minimum chain | 3 or 4 |
| demand | 0.80, 0.85, 0.90, or 0.95 |
| wanted blockers | integers 0–3; coordinate collisions may reduce the realized count |
| blocker types | stone, ice, bomb |
| ice duration | integers 3–12 |
| bomb timer | integers 8–20 |
| moves per cell | a uniform draw from the current integer range formed by rounded 0.50–0.75 × board area |

All **480** shapes are drawn before any outcome is used for selection. Names
are namespaced by sampler seed and draw index. Global deduplication uses the
current canonical shape signature and happens before screening.

## Structural family definition

The physical family key intentionally excludes demand, exact blocker
coordinates, timer/duration, target, tile scale, bot score, and bot win rate.
It is the tuple:

`area-band / move-density-band / min-chain / blocker-class`

Its frozen bins are:

- Area: `compact` for 20–29 cells, `medium` for 30–41, `large` for 42–56.
- Move density, using `moves / cells`: `tight` below 7/12, `middle` from
  7/12 through 2/3 inclusive, `loose` above 2/3.
- Minimum chain: `3` or `4`.
- Blocker class: `none`; `static-only` when every blocker is stone;
  `timed-no-bomb` when at least one ice blocker is present and no bomb is
  present; `bomb-present` whenever at least one bomb is present.

This yields 3 × 3 × 2 × 4 = 72 possible physical families. Demand is recorded
separately as one of four exact strata so that target pressure remains visible
without defining two otherwise identical physical shapes as unrelated
families.

## Incumbent-independent full-authoring selection

The later runner must perform these steps in this order:

1. Draw all shapes, canonicalize them, record duplicates, assign physical
   family and demand stratum, and compute all partition hashes.
2. Run the existing target-free screen on every globally unique shape and split
   the results into clean-screen and screen-rejected pools.
3. Within every nonempty physical family in each pool, order shapes by
   `SHA-256("generated-level-corpus-v1/candidate/" + shapeSignature)`.
4. Traverse physical family keys in lexical order, taking the next unselected
   clean-screen shape from each family in round-robin order until 60 have been
   selected or that pool is exhausted.
5. Independently traverse the screen-rejected pool by the same family-first
   rule until 12 stress probes have been selected or that pool is exhausted.
   A screen-rejection slot is never transferred to the clean pool, or vice
   versa, after the two pool sizes are visible.
6. Only then run `deriveCandidate` and the receipt replay on the combined set,
   capped at 72.

No screen median, screen minimum, fitted median, target, holdout score, gate
margin, win rate, bomb rate, lockout count, incumbent policy behavior, or
human judgment may order candidates within or between families. The categorical
screen result assigns only the frozen 60/12 measurement quota, and full-gate
outcomes become labels; neither is a fitness function for corpus construction.

## Frozen level-family partitions

Whole physical families, not individual level instances, are partitioned
before screening and full authoring. Compute:

`bucket = first_uint32_be(SHA-256("generated-level-corpus-v1/partition/" + physicalFamilyKey)) mod 10`

Here `physicalFamilyKey` is the exact slash-joined lower-case spelling shown in
the family definition (for example, `compact/tight/3/none`), and
`first_uint32_be` reads digest bytes 0–3 as one unsigned big-endian integer.
Across the complete 72-family map this rule assigns 40 families to
`optimization`, 15 to `development-check`, and 17 to `audit`; observed
playability may still make the admitted counts imbalanced.

- buckets 0–5: `optimization` partition;
- buckets 6–7: `development-check` partition;
- buckets 8–9: `audit` partition.

Every shape with the same physical family key therefore belongs to exactly one
partition, including its other demand values, blocker coordinates, timers, and
durations. A family may not be moved to repair an imbalanced split after its
outcomes are known. The partition mapping for all 72 possible family keys must
be materialized before the first screen game and included in the manifest.

The `optimization` partition may select policies. `development-check` may be
read during method development but may not select the final reported policy.
The `audit` partition is evaluated once after the final policy identity is
frozen; no audit result may feed mutation, hyperparameter choice,
representative choice, stopping, rerunning, or corpus revision.

## Frozen gameplay seed partitions

These seeds are for later paired policy evaluation on the generated fixtures;
they are separate from the generator's screen, target-fitting, and candidate-
holdout ranges.

| level-family partition | seed range | games per fixture and arm | allowed use |
|---|---:|---:|---|
| `optimization` | `20,000,000–20,000,011` | 12 | policy selection |
| `development-check` | `21,000,000–21,000,023` | 24 | method checks; not final policy selection |
| `audit` | `22,000,000–22,000,047` | 48 | one final report after policy freeze |

Within a fixture, candidate and champion play identical seeds. The three ranges
are pairwise disjoint and, at registration revision, have no other declared use
in the repository. A later collision invalidates this version before play; it
does not authorize choosing replacement seeds in the same run.

## Admission labels and allowed claims

Every fully authored shape receives exactly one of these dispositions:

- `playable-core`: its candidate and receipt replay exactly at the frozen code
  and `calib-1` identities and it passes the unmodified default gates: zero
  lockouts, bomb rate ≤5%, and win rate ≥20% on `100000–100299`.
- `adversarial-stress`: its candidate and measured receipt are identity- and
  replay-confirmed, but the default gate result is FAIL. Every failed gate and
  exact count remains attached. If the existing verifier must be called with
  relaxed gates to separate replay integrity from admission, that call proves
  replay integrity only and must not be shown as an authoring PASS.
- `unverified`: replay or identity confirmation did not complete. It belongs
  to neither usable pool.

Only `playable-core` counts toward the coverage bar or the primary policy
fitness corpus. `adversarial-stress` is reported by failure mode and partition,
never mixed into a headline mean and never used to claim playable quality.
Screen failures, duplicates, crashes, timeouts, and missing outputs are
operational/disposition records, not evidence that a level is difficult.

## Corpus manifest and receipts

The execution writes a new run-scoped evidence directory and does not overwrite
`solver/candidate-levels*.json`, historical receipts, or the retired candidate
archive. At minimum, its canonical manifest records:

- protocol name and SHA-256 of this pre-registration;
- run command, start revision, dirty-state check, and every frozen source hash;
- complete `calib-1` stamp and current default champion parameters;
- sampler seed, draw index, shape name, canonical shape, and shape signature;
- physical family key, demand stratum, partition bucket, and partition name;
- duplicate-of identity or screen measurement and rejection, as applicable;
- selection hash and full-authoring selection disposition;
- candidate, candidate identity, receipt identity, input identities, fitting
  range, target derivation, calibration stamp, and holdout range;
- exact gate counts, gate failures, replay-integrity result, admission label,
  and allowed-use label;
- hashes for every emitted artifact and a coverage table by axis, family,
  demand, partition, and disposition.

The manifest also records all 480 raw draw slots, even when two slots collapse
to one canonical shape. A report derived from it is a view; the manifest and
identity-bound receipts are the evidence.

## Coverage criterion

The corpus is sufficient to authorize a later optimization inquiry only if all
of these preregistered conditions PASS:

1. At least **36** distinct physical families contain one or more
   `playable-core` fixtures.
2. Those families include all three area bands, all three move-density bands,
   both minimum-chain values, and all four blocker classes.
3. Each exact demand value, 0.80, 0.85, 0.90, and 0.95, appears in at least six
   `playable-core` fixtures.
4. The family-hash split yields at least 18 `playable-core` families in
   `optimization`, six in `development-check`, and six in `audit`.
5. Every retained fixture and receipt has a unique identity and exact replay;
   every duplicate, rejection, failure, and incomplete outcome is accounted
   for in the manifest.

The bar is structural coverage, not raw count. Seventy-two variants from six
families fail; 36 family-covered fixtures can pass. `adversarial-stress` cases
are valuable retained evidence but cannot fill a missing `playable-core` cell.

## Compute bound and stopping rules

The hard worst-case bound is **76,320 bot games**:

- at most 480 unique screens × 24 games = 11,520;
- at most 72 full authoring measurements × 450 games = 32,400;
- at most 72 identity/replay confirmations × 450 games = 32,400.

Duplicates reduce the first term; screen failures reduce the later terms. The
bound may not be spent on replacement seeds, expanded ranges, extra draws, or
post-hoc family repair.

Stopping and result states are frozen:

1. If the source, calibration, champion, or seed-collision preflight fails,
   stop before generation and report `INVALIDATED`.
2. If the runner cannot materialize the full family map and all 480 raw draw
   slots before screening, stop and report `BLOCKED`.
3. After screening, full-author exactly the family-first selection, up to 72.
4. After confirmation, evaluate the five coverage conditions once.
5. If all five pass, report corpus construction `PASS`. This authorizes only a
   separately preregistered optimization inquiry.
6. If any coverage condition fails, report `INCONCLUSIVE`. Do not draw more
   shapes, move a family, lower a threshold, widen a range, or repeat under
   this version.
7. Operational crashes and timeouts remain `BLOCKED` or `unverified`; they are
   never counted as hard levels or empirical falsification.

## Legacy comparison panel

For continuity with `RESULT-0019`, a future report may separately replay the
unchanged shipped-level panels:

- selection: `[1, 10, 20, 30, 40, 52]`, historically 12 seeds per level;
- representative holdout: `[1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52]`,
  historically 24 seeds per level.

These panels overlap in levels, were used in the prior inquiry, and are not
members of the new family-disjoint split. They are comparator-only and cannot
satisfy the new corpus coverage threshold or serve as fresh generalization
evidence. Level 53 remains omitted from the historical panel exactly as
`RESULT-0019` records; this document does not silently repair that denominator.

## Reporting and proof classes

The later corpus report must separate:

- direct-source facts: identities, sampler outputs, family assignment,
  partitions, seed use, exact replays, gate counts, and coverage arithmetic;
- heuristic observations: champion scores, gate pass/fail as a bot-based proxy,
  and any later policy performance on these fixtures;
- owner decisions: whether to implement the runner, execute this protocol,
  launch optimization, playtest, or ship anything.

A corpus `PASS` means only that the frozen construction yielded the required
fixture coverage. It is not evidence that the generator represents all useful
levels, that the champion is weak or strong, that any fixture is fun, or that a
future optimized policy generalizes beyond the frozen corpus.

## Amendment and authorization boundary

This file is frozen at registration. Before execution, a typo-only correction
that changes no operational meaning is appended as a dated correction record;
it does not rewrite the original statement. Any operational change creates
`generated-level-corpus-v2` with a new identity and explains why v1 was not
run or was invalidated. After outcomes exist, all corrections and
supersessions are append-only.

Creating this pre-registration authorizes no execution. Generation, runner
implementation, optimization, champion comparison, playtesting, ledger
admission, and shipping each require their own later approval and evidence
boundary.
