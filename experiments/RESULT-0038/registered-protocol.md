# Frozen protocol — deterministic exact greed-ratio closure replication

**Registered:** 2026-09-16, before any confirmation seed was opened.

## Declaration and question

- Primary profile: `candidate-measure`, SHA-256
  `5b1edc87a2e4c7bdcea493c7ba6b03c017fae6a13d05044b8df99586e5d167e4`.
- Context profile: `simulation-policy`, SHA-256
  `63dbce14106578b3973cf6308f1820de8395099558c9b4ae91438aa3b0461f8a`.
- Assurance profile: `mutation-qualification`, SHA-256
  `dc67e21d0c4938b85e853e4e9c4868408f53a9a85e88006e029a500d8f08632f`.
- Frozen subject identity:
  `2f17ec3c4db62546a7d1f0d328e3b69d30b411186eadba1ec4bb742fe3ba34b2`.

Does deterministic exact-denominator greed ratio respond to four fixed
immediate-reward percentile policies, track policy win rate without merely
tracking score, and remain seed-stable on a fresh paired panel?

`SUPPORTED` makes greed ratio eligible for a separate owner adoption decision
and later pairing experiment. No outcome adopts it or validates half-score
move. RESULT-0037's preserved 128-game diagnostics are excluded: this successor
keeps its design and thresholds but corrects only the frozen executable
closeout command, which now emits the independent corpus reduction on stdout.

## Proxy, bounds, and non-claims

`greedRatio` is the mean across moves of played points divided by the exact
maximum points of any legal chain on the same pre-move board. Enumeration stops
at 500,000 unique `(tail tile, visited tile set)` path states in deterministic
order. Completion yields `exact_result`; reaching the cap yields
`UNKNOWN/work-limit` at exactly 500,000 states and makes the entire game's
ratio unknown. Partial traces are never averaged. The played move is included,
so measured values are in `[0,1]`.

A 30,000 ms child-process watchdog is infrastructure protection only; any
timeout invalidates the run. Half-score move is diagnostic only. Build
potential remains a policy term. No difficulty, fun, preference, human,
fitness, MAP-Elites, content, rule, timing-axis, or outside-panel claim follows.

## Policies, panel, and execution semantics

Policies at percentiles 0.25, 0.50, 0.75, and 1.00 use the production
strong-settings greedy generator (`degree`, path width 8, untrimmed, candidate
limit 24) and choose the candidate closest to their fixed fraction of the
strongest candidate's points, preferring higher points on ties.

Each policy plays shipped Levels 10, 31, 53, and 54 on fresh seeds
33,500,000–33,500,007: 128 ordered games, percentile then level then seed.
Boards and spawn streams are paired. Arms play to the shipped move budget or a
genuine no-move/bomb terminal; target crossing records a win but does not stop
play. The unit of generalization is the fixed policy over this four-level
panel, not individual seeds. Missing cells or any watchdog timeout invalidate
the run; deterministic work-limit games remain recorded and feed P1.

## Controls

- **C1, candidate-measure, positive/negative:** descriptor arithmetic through
  the production trace seam passes measured and unknown fixtures. Failure stops.
- **C2, candidate-measure + simulation-policy + mutation-qualification,
  positive/negative/restoration:** exact fixture returns 24; repeated capped
  large-board results are byte-identical; clean fixture passes afterward.
  Failure stops.
- **C3, candidate-measure, positive manipulation:** planted 25/50/75/100-point
  candidates map to matching percentiles. Failure stops.
- **C4, simulation-policy, reference/objective-equivalence:** qualification
  seed 33,300,000 produces identical score, win, moves, and terminal reason in
  proxy and deterministic measurement modes. Failure stops.
- **C5, mutation-qualification, known-kill/independent oracle/restoration:**
  registered analysis and independent corpus reducer byte-match on a planted
  panel; body, work-cap, standing, and coherent source substitutions fail;
  final artifact and executable closeout pass. Failure yields no domain outcome.
- **C6, common reference:** solver suite retains exactly four documented
  deliberate failures and one skip. Any new failure stops confirmation.

The qualified shared measurement and analysis identity is carried from
RESULT-0037; RESULT-0038's wrapper, seed panel, source closure, registration,
matrix, and corrected closeout command are separately identity-checked before
confirmation.

## Predictions

- **P1 exact coverage:** `SUPPORTED` at 128 games, >=25% exact overall,
  >=12.5% per policy, and >=1 exact game per policy/level; `FALSIFIED` for an
  incomplete matrix, <10% overall, or an empty policy; otherwise `INCONCLUSIVE`.
- **P2 controlled response:** `SUPPORTED` for strictly rising policy means
  spanning >=0.30; `FALSIFIED` when unordered/missing or spanning <0.15;
  otherwise `INCONCLUSIVE`.
- **P3 win tracking:** `SUPPORTED` at policy Pearson `r >=0.50`; `FALSIFIED`
  at `r <=0`; otherwise `INCONCLUSIVE`.
- **P4 score non-redundancy:** `SUPPORTED` at per-game `|r| <0.70`;
  `FALSIFIED` at `|r| >=0.85`; otherwise `INCONCLUSIVE`.
- **P5 greed-bin stability:** `SUPPORTED` when every policy places >=80% of
  exact games in its modal or adjacent fixed greed bin (`low <0.45`, `mid
  0.45..<0.75`, `high >=0.75`); `FALSIFIED` below 60%; otherwise
  `INCONCLUSIVE`.
- **P6 primary:** all P1–P5 supported and C1–C6 passing gives `SUPPORTED`; any
  falsified prediction gives `FALSIFIED`; otherwise `INCONCLUSIVE`.

## Budget and forbidden adaptations

Commit this protocol and executable contract before opening confirmation
seeds. After controls pass, run exactly one 128-game confirmation. No retries,
replacement seeds, threshold/cap/bin/policy/level changes, discarded work-limit
games, partial-trace averages, or alternate enumerators. Artifact verification
and one stdout-emitting independent reduction of the immutable corpus are
allowed; neither plays another game. The report records every prediction and
diagnostic without making an adoption decision.
