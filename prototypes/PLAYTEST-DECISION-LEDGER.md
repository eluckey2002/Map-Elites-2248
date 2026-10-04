# Playtest Decision Ledger

This ledger records what prototype playtests taught us about level design. It
is deliberately separate from [`EVIDENCE_LEDGER.md`](../EVIDENCE_LEDGER.md):
these are design decisions from throwaway prototypes, not promoted claims
about shipped levels, policy strength, or population difficulty.

The current product goal is to create fixed-board, fixed-seed challenges where
the player can fairly try to beat a named bot benchmark **and** where success
requires a meaningful choice beyond the owner's normal build-and-harvest plan.

## How to read and update this ledger

Evidence labels mean:

- **captured play** — a saved move-by-move session exists.
- **exact reference** — the prototype supplies an exact bot result for the
  same board and seed. It is not a population claim.
- **owner report** — the result or reaction was stated during play but is not
  recoverable from a saved session.
- **reconstructed decision** — the disposition was backfilled from the
  prototype notes and conversation after the play, rather than frozen before
  it.
- **unknown** — the required information was not captured. Do not infer it.

Decisions mean:

- **KEEP** — preserve the design question and validate it on more fixed seeds.
- **REVISE** — the question remains useful, but the current mechanism or
  layout is not ready to preserve.
- **RETIRE** — stop tuning this design; its failure answered the question.
- **UNRESOLVED** — the prototype has not received the play needed to decide.

This file is append-only after backfill. Do not silently rewrite an old entry
when new evidence arrives. Add a dated update that names the entry it
supplements or supersedes, and retain the original decision.

## Current decision map

| ID | Prototype | Human result | Same-seed bot | Decision | Main learning |
|---|---|---:|---:|---|---|
| PDL-001 | Bank and Break, first pass | unknown | unknown | RETIRE iteration | Movable ice did not preserve a gate, and the rooms were too large. |
| PDL-002 | Bank and Break, fixed bottom gate | 46,016 in 10 | 40,768 in 10 | KEEP | The board produced a perceptible bank-then-release arc. |
| PDL-003 | Funnel Sprint | 24,704 in 7 | 41,216 in 8 | REVISE | Lane coordination was visible, but agency felt spawn-sensitive. |
| PDL-004 | Builder Pocket | incomplete | 68,416 in 9 | RETIRE | Reserved space felt wasted instead of valuable. |
| PDL-005 | No-Blocker Nemesis | 93,504 in 9 | 95,488 in 10 | RETIRE | A special opening disappeared after one or two refills. |
| PDL-006 | Sequential Defusal Relay | 64,448 in 7; 57,920 in 6 | 54,976 in 8 | RETIRE | Ordinary maximum chains cleared the bombs automatically. |
| PDL-007 | Double Vault Rescue | unknown | 45,184 in 7 | REVISE | The comparison arm is not the owner's captured baseline, so the board is not ready for another play. |
| PDL-008 | Cash or Compound | 59,648 in 7 | 59,000 target in 8 | RETIRE | It selected the owner's existing strategy, not a new choice. |
| PDL-009 | Forge Contracts | Tower: 74,176 in 10; Spread: 82,520 in 9 and 96,216 in 8 | both contracts in 7 | RETIRE | The reward changed accounting, but did not clearly change board reading. |
| PDL-010 | Three Forge Docks | 62,976 in 8 | 55,680 in 9 | RETIRE | It rewarded the owner's normal build-and-harvest plan again. |

The comparison column is a **target-race** benchmark: moves to the common
target on the same board and seed. A higher score at the finish is not, by
itself, evidence of better or more interesting play.

## Backfilled playtests

### PDL-001 — Bank and Break, movable-ice first pass

- **Backfilled:** 2026-09-14
- **Design question:** Would a temporary divider make the player build in two
  regions and then reconnect them?
- **Intended choice:** Bank value on both sides while the gate is closed, then
  decide how to harvest after it opens.
- **Normal strategy expected to fail:** Treat the full board as one open field
  and repeatedly take the largest convenient chain.
- **Board, seed, and bot:** The first 7x6 layout was not retained; exact seed
  and bot result are **unknown**.
- **Human evidence:** Owner report only. Exact score and move count are
  **unknown**.
- **Owner reaction:** Ice that melted after a few moves merely left a column
  containing a 64, and the two sides were large enough that the play did not
  feel very different.
- **Decision:** **RETIRE iteration** — reconstructed decision.
- **Consequence:** A timed separator must remain spatially fixed until it
  opens, and each region must be cramped enough to matter. This led to the
  bottom-row fixed-gate version.
- **Missing evidence:** Original board identity, seed, bot trace, and captured
  human session.
- **Source:** [Bank and Break README, rejected first pass](bank-and-break/README.md#rejected-first-pass).

### PDL-002 — Bank and Break, fixed bottom gate

- **Played:** 2026-09-11 (session file timestamp); backfilled 2026-09-14.
- **Design question:** Does a fixed four-move gate between two cramped rooms
  create a build-separately, open, connect, and harvest arc?
- **Intended choice:** Create and retain value in the separate rooms before
  deciding how to connect them after the thaw.
- **Normal strategy expected to fail:** Search the currently open cells for the
  largest chain without valuing the later cross-wall connection.
- **Board, seed, and bot:** Candidate 5904, seed 316, 5x5, target 40,000,
  16-move budget. The exact bot reached 40,768 on move 10; its full-budget
  score was 51,968.
- **Human evidence:** **Captured play** `fd2781d0`: 46,016 on move 10. The
  player scored 35,520 of those points in moves 8-10 and reused seven built
  tiles.
- **Owner reaction:** "Definitely not ordinary play"; the two large banked
  values were visible and interesting.
- **Decision:** **KEEP** — reconstructed decision. Preserve the family, not a
  claim that seed 316 is generally good.
- **Consequence:** Validate the same mechanism on the already selected seeds
  268, 511, and 93. Do not tune seed 316 further from this single success.
- **Missing evidence:** Human plays on the three validation seeds and a result
  showing whether the perceived strategy survives unfavorable spawns.
- **Sources:** [prototype rationale and outcome](bank-and-break/README.md),
  [captured session](bank-and-break/sessions/bank-break-fixed-bottom-gate/fd2781d0dfa2894b4fe228fba5af46af25c99a22eb4d531bef8f81cfae238b7a.json).

### PDL-003 — Funnel Sprint

- **Played:** 2026-09-11 (session file timestamp); backfilled 2026-09-14.
- **Design question:** Do three feeder lanes and a short budget create a
  routing-and-timing problem?
- **Intended choice:** Decide which lane to develop or preserve before joining
  their material in the shared lower zone.
- **Normal strategy expected to fail:** Ignore lane state and take whichever
  long chain is immediately available.
- **Board, seed, and bot:** Seed 403, 5x5, target 22,000, eight-move budget.
  The exact bot reached 41,216 on move 8.
- **Human evidence:** **Captured play** `7b967a64`: 24,704 on move 7. The final
  13-tile chain scored 17,280 and crossed all three lanes.
- **Owner reaction:** Coordinating the lanes was the objective, but the result
  felt like "a little bit of both" strategy and luck depending on spawns.
- **Decision:** **REVISE** — reconstructed decision. Keep the routing question;
  do not preserve this layout as solved.
- **Consequence:** A future lane design needs a persistent, player-controlled
  commitment whose payoff cannot be replaced by a favorable refill.
- **Missing evidence:** A fixed-seed counterfactual showing that two legible
  lane choices lead to meaningfully different later opportunities.
- **Sources:** [prototype rationale and outcome](funnel-sprint/README.md),
  [captured session](funnel-sprint/sessions/7b967a64e93d3d6c887119ae138cb7e20875c3f6c519f05c75852e578c4073e6.json).

### PDL-004 — Builder Pocket

- **Backfilled:** 2026-09-14
- **Design question:** Can a side pocket make storing and later reclaiming a
  valuable tile feel deliberate?
- **Intended choice:** Spend scarce board space to park a survivor, work
  elsewhere, then route back to it for a payoff.
- **Normal strategy expected to fail:** Consume value immediately without
  reserving a protected tile.
- **Board, seed, and bot:** Seed 447, 5x5, target 60,000, 12-move budget. The
  exact bot stored a 1,024 and reached 68,416 on move 9.
- **Human evidence:** The owner stopped before completion. No session, score,
  or move result was captured.
- **Owner reaction:** The pocket did not feel meaningful and made the other
  tiles in that area feel wasted.
- **Decision:** **RETIRE** — reconstructed decision.
- **Consequence:** Restricted cells need a legible strategic return; merely
  designating storage space is not enough. Do not tune the mouth, target, or
  seed.
- **Missing evidence:** Exact stopping position. It is unnecessary for the
  concept-level rejection.
- **Source:** [Builder Pocket README](builder-pocket/README.md).

### PDL-005 — No-Blocker Nemesis

- **Played:** 2026-09-11 (session file timestamp); backfilled 2026-09-14.
- **Design question:** Can a selected seed alone make an open board a legible
  setup puzzle and fair beat-the-bot challenge?
- **Intended choice:** Recognize a sparse opening and invest in a setup before
  larger chains appear.
- **Normal strategy expected to fail:** Treat the opening as disposable and
  resume ordinary chain hunting after refill.
- **Board, seed, and bot:** Seed 3190, open 6x5, target 90,000, 12-move budget.
  The exact bot reached 95,488 on move 10.
- **Human evidence:** **Captured play** `486e3cb4`: 93,504 on move 9, including
  a 19-tile, 45,120-point chain on move 7.
- **Owner reaction:** After one or two moves it felt like a fresh board; the
  authored opening did not create anything new.
- **Decision:** **RETIRE** — reconstructed decision.
- **Consequence:** A distinct opening is not a distinct board family when
  refills erase its identity. Stop seed-searching for a layout-only fix.
- **Missing evidence:** None needed for this design question; the competitive
  result and the strategic rejection can both be true.
- **Sources:** [prototype rationale and outcome](no-blocker-nemesis/README.md),
  [captured session](no-blocker-nemesis/sessions/486e3cb439d51932b0243d2cbdc404d82f93d59c2d892b85477a92044e501481.json).

### PDL-006 — Sequential Defusal Relay

- **Played:** 2026-09-11 (session file timestamps); backfilled 2026-09-14.
- **Design question:** Can two differently timed bombs force the player's
  priority to change twice before ordinary score play resumes?
- **Intended choice:** Clear the reachable bomb, prepare for the thawed route,
  then switch to scoring.
- **Normal strategy expected to fail:** Take a maximum chain every move and
  allow objectives to resolve incidentally.
- **Board, seed, and bot:** Candidate 5908, seed 27, target 50,000. The exact
  bot cleared the bombs on moves 1 and 6 and reached 54,976 on move 8.
- **Human evidence:** Two **captured plays**. The first reached 64,448 on move
  7; both bombs were swept into ordinary long chains. In the second, the owner
  deliberately took the maximum available chain every turn and improved to
  57,920 on move 6; all six chains contained 21-24 tiles.
- **Owner reaction:** The board did not change play. The second run used no
  special strategy and could still have been faster.
- **Decision:** **RETIRE** — reconstructed decision.
- **Consequence:** Under the current rule, a bomb consumable anywhere in an
  ordinary chain is a visible objective, not necessarily a strategic one. A
  meaningful relay requires a different bomb interaction, not another layout.
- **Missing evidence:** None needed to reject this mechanism under the current
  rules.
- **Sources:** [prototype rationale and outcome](sequential-defusal-relay/README.md),
  [first captured play](sequential-defusal-relay/sessions/1d8ce49dae5a37edf6985485d92f16be7f947afe50cafdc0af14a3a1e68bb10d.json),
  [maximum-chain play](sequential-defusal-relay/sessions/60f08f535aa3d6b16a7a6f65b2141c262a8f46b1a38ebb6c210db2b9e9a9bd14.json).

### PDL-007 — Double Vault Rescue

- **Prepared:** 2026-09-13 or 2026-09-14; exact authoring time is not recorded
  here. Backfilled 2026-09-14.
- **Design question:** If bombs occupy true dead ends, will a required short
  rescue chain feel like an investment because its survivor can be harvested
  later?
- **Intended choice:** Reject a tempting 15-tile opening, make a three-tile
  rescue, retain the survivor, and deliberately reuse it after the second
  vault opens.
- **Normal strategy expected to fail:** Repeated bounded-largest-chain play;
  the frozen baseline explodes after move 3 with 22,080.
- **Board, seed, and bot:** Seed 34, target 45,000. The exact reference bot
  clears the left bomb on move 1, reuses its survivor on move 5, clears the
  right bomb on move 6, and reaches 45,184 on move 7.
- **Human evidence:** **Unknown.** No completed session exists in the
  prototype's session directory, and no result is being inferred from nearby
  plays of other prototypes.
- **Owner reaction:** **Unknown.** This design has not received its deciding
  play.
- **Decision:** **UNRESOLVED**.
- **Consequence:** This is the next useful new-board playtest. One play is
  enough for the current question: keep only if the rescue feels like a
  deliberate investment and the survivor changes a later choice.
- **Missing evidence:** One completed human play and the owner's answer to the
  stated rejection condition.
- **Source:** [Double Vault Rescue README](double-vault-rescue/README.md).

### PDL-008 — Cash or Compound

- **Played:** 2026-09-13 (session file timestamp); backfilled 2026-09-14.
- **Design question:** Can the current rules create a voluntary cash-now versus
  compound-later choice without blockers or timers?
- **Intended choice:** Give up immediate points to retain built tiles and
  combine them into a later payoff.
- **Normal strategy expected to fail:** Cash the highest immediate score and
  ignore future reuse.
- **Board, seed, and bot:** Candidate 5910, seed 5, open 5x5, target 59,000,
  16-move budget. The harvest-aware exact bot reached the target in eight
  moves; the no-harvest and bounded cash-now policies took 10 and 13.
- **Human evidence:** **Captured play** `7803db10`: 59,648 on move 7. Moves
  1-4 each created a 1,024; move 5 created a 512; move 6 joined all five built
  tiles in an 18-tile, 29,440-point chain.
- **Owner reaction:** "Oh come ojn - thats always my plan."
- **Decision:** **RETIRE as a new design** — reconstructed decision. Preserve
  the play as a useful baseline example of the owner's ordinary strategy.
- **Consequence:** Later prototypes must create a choice *within*
  build-and-harvest: which values to build, where to keep them, or when to
  consume them.
- **Missing evidence:** None needed for the rejection. More seeds would only
  optimize a strategy already known to be ordinary for this player.
- **Sources:** [prototype rationale and outcome](cash-or-compound/README.md),
  [captured session](cash-or-compound/sessions/7803db10b99b71919ed7d223e28111a545368aeb2c42121eee8a25945da8d936.json).

### PDL-009 — Forge Contracts

- **Played:** 2026-09-14; backfilled the same day.
- **Design question:** Does choosing a Spread or Tower reward create a
  meaningful decision inside build-and-harvest play?
- **Intended choice:** Either keep four separate 1,024 tiles or combine four
  1,024s into an exact 4,096, accepting different timing and rewards.
- **Normal strategy expected to fail:** Build several 1,024s and harvest them
  without changing the plan for the selected contract.
- **Board, seed, and bot:** Seed 5, open 5x5, target 69,000, 12-move budget. The
  exact contract-aware bot reached the target in seven moves under both
  contracts: Spread at 69,976 and Tower at 74,176.
- **Human evidence:** Mixed capture quality. The owner reported a first Tower
  win in eight moves, but it was not captured. A captured Tower play reached
  74,176 on move 10 and earned the 24,000 bonus by joining four 1,024s on move
  6. At backfill inspection, a separate Spread snapshot was still changing
  and had not recorded a finished outcome, so it is not used as a final
  result. The owner also reported finishing a Spread game whose exact final
  result is **unknown**.
- **Owner reaction:** Tower was completed quickly while learning the mode;
  afterward it remained unclear what the prototype was teaching or what goal
  the player was pursuing.
- **Decision:** **RETIRE the contract mechanism as a gameplay innovation** —
  reconstructed decision. The wrapper and capture format may still be useful
  prototype infrastructure.
- **Consequence:** A bonus label is insufficient when the rewarded construction
  is already produced by normal play. The next design must change which move
  looks best on the board, not merely award points after familiar play.
- **Missing evidence:** The uncaptured Spread final result. It is not needed to
  support the current design decision and should remain unknown.
- **Sources:** [Forge Contracts README](forge-contracts/README.md),
  [captured Tower snapshot](forge-contracts/snapshots/5e5e6963-2719-4a68-96d6-6eac27f8da14.json),
  [Spread snapshot](forge-contracts/snapshots/7bb9256d-4ae3-4ab1-b272-867ff3000029.json).

## What the accumulated plays now say

1. **Competitive difficulty and strategic novelty are separate.** The owner
   beat the same-seed bot on several rejected boards. Those were valid
   beat-the-bot challenges, but they did not force new decisions.
2. **An authored opening is too weak.** Refill erased No-Blocker Nemesis after
   one or two moves. A new board needs state that survives long enough to
   affect a later choice.
3. **A visible objective is too weak.** Bombs and contract counters were easy
   to satisfy while following ordinary high-scoring play.
4. **Restricted space must pay rent.** Builder Pocket consumed useful cells
   without making the stored value feel worth protecting.
5. **Bank and Break remains the strongest positive signal.** Its gate changed
   how one play felt, but one player on one seed is not enough to adopt it.
6. **Double Vault Rescue is not ready for another play.** Its dead ends preserve
   the resulting survivors, but its comparison arm is a solver heuristic rather
   than the owner's captured baseline. First name the exact seed-34 state where
   build-and-harvest would choose the wrong move; retire it without a play if no
   such state exists.

## Template for the next playtest

Copy this block beneath the latest entry before a prototype is treated as a
design result:

```markdown
### PDL-___ — Prototype name

- **Played:** YYYY-MM-DD
- **Design question:**
- **Intended choice:**
- **Normal strategy expected to fail:**
- **Board, seed, and bot:**
- **Human evidence:**
- **Owner reaction:**
- **Decision:** KEEP | REVISE | RETIRE | UNRESOLVED
- **Consequence:**
- **Missing evidence:**
- **Sources:**
```

## Corrections and updates

### PDL-010 — Three Forge Docks

- **Played:** 2026-09-14.
- **Design question:** Can a fixed opening with no dealt 512s make the location
  of the first forged 512 into a readable strategic choice?
- **Intended choice:** Reject a 17-tile, 8,000-point opening chain and instead
  forge a 512 into one of two bottom docks for later reuse.
- **Normal strategy expected to fail:** The screen used bounded longest-chain
  play as its baseline. That was the wrong baseline: captured owner play had
  already established build-and-harvest as normal.
- **Board, seed, and bot:** Candidate 5911, seed 83, 5x6, target 55,000. The
  exact current bot reached 55,680 on move 9; the bounded longest-chain line
  reached 55,680 on move 8; the scripted forge-first line reached 67,072 on
  move 7.
- **Human evidence:** **Captured play** `c393d0f9`: 62,976 on move 8. The owner
  forged 512 survivors on moves 2 and 5. The move-5 survivor was one of six
  built tiles reused in the 16-tile, 35,200-point finishing chain.
- **Owner reaction:** The owner asked whether a 512 was supposed to spawn and
  said the work had gone backward in its learnings.
- **Decision:** **RETIRE**. A fast same-seed win did not establish a new
  strategic decision; the prototype rewarded the owner's existing strategy.
- **Consequence:** Keep deterministic opening/refill control and forged-tile
  tracking only as authoring capabilities. Before another prototype, name the
  owner's captured baseline and the exact state where the proposed design
  makes that baseline move suboptimal. A solver proxy cannot substitute.
- **Missing evidence:** None needed for rejection. Do not tune another seed,
  rewrite the instructions, or revise the dock layout.
- **Sources:** [durable rejection record](three-forge-docks/README.md),
  [captured session](three-forge-docks/sessions/c393d0f955a79c60791001c987fb0e11e9acbbd8a58a191ae2802a30a1459adc.json).

### PDL-007 correction — Double Vault readiness

- **Corrected:** 2026-09-14 during pre-commit project-standards review.
- **Supersedes:** The earlier `UNRESOLVED` standing treated the frozen
  bounded-largest-chain comparison as the normal strategy expected to fail.
- **Correction:** That comparison is a solver heuristic, not a captured owner
  baseline. Double Vault is therefore **REVISE**, not ready for the deciding
  owner play described above.
- **Consequence:** Before play, use a captured build-and-harvest session to name
  the exact seed-34 state where its expected move is suboptimal. If that cannot
  be demonstrated, retire the board without another owner play.
- **Source:** [corrected prototype boundary](double-vault-rescue/README.md).

### PDL-009 correction — completed Spread captures

- **Corrected:** 2026-09-14 during pre-commit artifact review.
- **Supersedes:** The backfilled PDL-009 statement that the exact Spread result
  was unknown. That statement remains above as the state observed during the
  initial backfill.
- **Captured results:** Snapshot `7bb9256d` is a completed Spread win at 82,520
  points in nine moves. Snapshot `7a3206e6` is a second completed Spread win at
  96,216 points in eight moves.
- **Decision:** PDL-009 remains **RETIRE**. The additional results resolve the
  capture gap but do not change the owner's reaction or show a strategy beyond
  ordinary build-and-harvest play.
- **Sources:** [nine-move Spread capture](forge-contracts/snapshots/7bb9256d-4ae3-4ab1-b272-867ff3000029.json),
  [eight-move Spread capture](forge-contracts/snapshots/7a3206e6-cbb3-49ed-b208-541c35b1145a.json).

### PDL-011 — Delivery: Pair Drop

- **Played:** 2026-10-01.
- **Design question:** Does making a matching value while lowering its partner
  create a satisfying dependency inside build-and-harvest play?
- **Intended choice:** Choose a survivor location based on the connection it
  will have after gravity, not merely its value.
- **Baseline:** The owner's captured baseline is build-and-harvest (PDL-008).
  This is an endpoint-choice variation, not a claim that building is new.
- **Board, seed, and bot:** Pair Drop, seed 416, five columns by six rows,
  eight-move allowance, parcel delivery objective. No bot comparison run.
- **Human evidence:** Captured session `f268a423-e38c-4cc6-a72e-f9ac77f11254`
  replays exactly to delivery in three moves. The authored four-move witness
  is not optimality evidence. Owner opening: 8 → 8 → 16 → 32; the second,
  13-tile chain includes one refill 4; the last is 64 → 64 → 128 → 128.
- **Owner reaction:** The layout felt a little easy, but had the right idea;
  the owner wondered whether the first move had been lucky. They agreed with
  refining placement consequences rather than simply requiring more moves.
  Earlier, they named Delivery the clear winner and described planning how
  one tile's movement enables another as the enjoyable part. Feeder Choice
  remains undecided; Gates did not require a meaningful decision.
- **Decision:** **REVISE layout**, retaining the Delivery question — owner
  report and captured play, recorded after that feedback.
- **Consequence:** Try two plausible same-value placements with different
  follow-up needs. Preserve multiple solutions. Check authored routes without
  requiring favorable refills; do not claim they exhaust the board.
- **Missing evidence:** Whether the next layout makes the choice feel
  consequential. One short win does not establish general ease or luck.
- **Sources:** [Pair Drop design](delivery-pair-drop/README.md),
  [local captured play](delivery-pair-drop/sessions/f268a423-e38c-4cc6-a72e-f9ac77f11254.json),
  owner conversation on 2026-10-01. Sessions are locally ignored playtest
  records, not the receipted experiment corpus.

### PDL-012 — Delivery: Crossroads

- **Played:** 2026-10-01.
- **Design question:** Do two same-value survivor placements create different
  preparation decisions worth thinking through?
- **Human evidence:** Session `6e769452-70df-4ef5-bb7c-9d022a2bfd0c` replays
  exactly to a two-move win. Origin tracking confirmed no refill tile was
  selected. The first chain built 128 above the existing 128; the second
  selected 128 → 128 → 256, ending outside the parcel shaft.
- **Owner reaction:** This was planned, not refill luck. They reported several
  two-move wins; only the named capture is verified here. The visible ladder
  `64, 32, 128, 256` makes the missing 64 easy to recognize and construct.
- **Decision:** **REVISE design direction** — different construction routes
  need not constitute different strategic decisions. No broad difficulty or
  optimality claim follows from this play.
- **Consequence:** The owner proposed reducing incidental connections via a
  wider value pool, and fixed-place/moving-tile connection goals. They then
  requested several goals per board and authorized trying that shared-board
  objective. Pool changes remain proposed, not implemented. Keep the new
  playtest separate from shipped gameplay and the Delivery prototypes.
- **Sources:** [Crossroads design](delivery-crossroads/README.md),
  [local play capture](delivery-crossroads/sessions/6e769452-70df-4ef5-bb7c-9d022a2bfd0c.json),
  owner conversation on 2026-10-01. Owner enjoyment of Connections is unknown.

### PDL-013 — Connections: endpoint spacing

- **Feedback:** 2026-10-01, owner report: "you put them all nxt to eachother".
- **Observed layout:** A's marked pair and C's fixed pair were adjacent. B's
  pair was two king-move steps apart. All three goals had opening solutions.
- **Decision:** **REVISE layout**. The prototype did not represent the intended
  challenge of arranging a path between separated endpoints.
- **Consequence:** Separate every pair across the board and leave genuine
  connection gaps. Check solvability without making a difficulty claim.
  Preserve the same objective rules, live sum, undo and refill pool.
- **Missing evidence:** Owner judgment of the revised layout. Do not infer
  perceived difficulty merely from endpoint distance or a longer witness.
- **Sources:** [original layout](connections/model.js), owner conversation,
  [revised layout and checks](connections-spaced/README.md).

### PDL-014 — Connections: one unrestricted, exact-value objective at a time

- **Feedback:** 2026-10-01. Spaced Connections was a little more fun, but three
  simultaneous goals meant six colored endpoints. The owner also reported
  goals combining under gravity and requested spawn values through 128.
- **Observed capture:** Spaced session `c8c56763-dc13-40d4-9eb7-543e8dda47b8`
  has five moves, A and B completed, C pending. On move four, A1 landed at C1's
  fixed position; the labels co-located, rather than numerically auto-merging.
  C1 occurred inside that chain rather than at its start, so C did not complete.
- **Owner's clarified rule:** All normal plays remain possible. The challenge
  changes only when its conditions are satisfied; do not protect endpoints,
  reject other merges, or reset the objective. Add an exact resulting-tile-value
  condition before additional constraints. The owner then requested a bank of
  objectives for extended continuous play.
- **Decision:** **REVISE prototype**, one active objective with exact-value
  completion, an ongoing board, and a broader spawn pool. No production adoption.
- **Implementation interpretation:** Fixed positions preserve the objective
  while tiles change. This choice, a board-adapted bank, and a manual skip were
  announced. Fixed-position selection is not independently accepted evidence
  against the moving-tile alternative.
- **Consequence:** [Connection Run](connections-continuous/README.md) runs
  separately on 8279. Its 24-entry recipe bank repeats on changing boards;
  completions advance without redealing. Ratings attach to challenge numbers.
  Nonmatching moves retain the goal, even when further progress becomes hard.
- **Missing evidence:** Where this feels satisfying, trivial, or stuck during
  owner play. Construction witnesses and passing replay checks do not decide it.
- **Sources:** Owner conversation on 2026-10-01,
  [local spaced play](connections-spaced/sessions/c8c56763-dc13-40d4-9eb7-543e8dda47b8.json),
  [continuous model](connections-continuous/model.js). Local prototype captures
  are unreviewed playtest records, not the receipted experiment corpus.

### PDL-015 — Connection Run: arithmetic assistance

- **Feedback:** Owner reports solving the first two challenges after some
  thought, and finding the non-power-of-two third target a welcome surprise
  that distinguishes these rules. They then request help with repeatedly
  halving 352 and doing target arithmetic.
- **Decision:** Keep existing objective rules. Add UI arithmetic assistance:
  successive whole-number halves, plus remaining/over-target amount alongside
  the selected chain sum. Label the halves as reference, not a required chain.
- **Consequence:** Updated page on 8280 can continue a saved run into a fresh
  capture without changing its board or goal. The original 8279 game remains
  running. Actual saved session `a9daa6bf-f4eb-45a7-a514-00e54ca1e4bf` replays
  exactly to move nine, objective three, target 352.
- **Missing evidence:** Whether the aid removes enough arithmetic burden while
  keeping the spatial puzzle readable. No long-run difficulty claim follows.
- **Sources:** Owner conversation, [updated UI](connections-continuous/app.js),
  [local capture](connections-continuous/sessions/a9daa6bf-f4eb-45a7-a514-00e54ca1e4bf.json).

### PDL-016 — Connection Run: optional compositions, not spatial hints

- **Feedback:** Owner clarified that they understood bringing the 64 into place.
  What they had not recognized was the seven-tile decomposition of 352 into
  three 32s and four 64s. Do not reinterpret this as evidence that the spatial
  preparation was the source of their difficulty.
- **Checked route:** Replaying the original goal-three issuance position from
  the named PDL-015 capture verified a two-move completion. Its second chain
  has seven tiles. This is a specific route, not a claim that short solutions
  are easy for humans or that every later position retains that route.
- **Decision:** Owner approved an optional Show combinations button before
  further mechanics or a full objective-aware bot. Keep all gameplay unchanged.
- **Consequence:** Page on 8281 shows arithmetic examples with tile counts,
  including the accepted six- and seven-tile 352 decompositions. The helper
  receives only the target and tile budget, not board coordinates or a solution.
  Its power-of-two examples are explicitly non-exhaustive and are not claims
  of a currently available spatial route. It resets closed for each new goal.
- **Next checkpoint:** Does optional access remove unwanted arithmetic burden,
  or remove a part of the puzzle the owner enjoys? No outcome inferred yet.
- **Sources:** Owner conversation, [helper](connections-continuous/combinations.js),
  [interaction checks](connections-continuous/app.test.js), original PDL-015 capture.

### PDL-017 — Consolidation and combinations-aid feedback

- **Reported:** 2026-10-02, owner conversation; supplements PDL-016.
- **Exact owner feedback:** "It does give away enjoyable discvoery and truly help makes it enjoyable. Lets do the bounded consolkidation pass,. If you can use sub-agents that are cheap to take care of some other work that woukd be great"
- **Interpretation:** The wording acknowledges disclosure of enjoyable discovery
  and also describes help/enjoyment. Preserve both parts; it is not evidence
  that spoilers have no cost or an instruction to remove the optional aid.
- **Authorized action:** Bounded documentation and preservation consolidation,
  with economical delegation. No gameplay changes, new mechanic, full bot,
  portfolio replacement, server retirement or production adoption implied.
- **Disposition:** Leave the optional aid unchanged during consolidation.
  Delivery remains a direction to refine, Connections an active exploration,
  Feeder undecided and the current Gates design parked. Original collection
  completion remains open; see the [workbench](../docs/game-design/levels/archetype-workbench.md).
- **Standing:** Owner report and explicit consolidation authorization, not a
  controlled assisted-versus-unassisted comparison or acceptance of all tasks.
- **Source:** Current owner message in this conversation; exact text retained
  above, not an independently archived full transcript. ARCHETYPES-CONSOLIDATE-1
  records the resulting bounded work.

### PDL-018 — Delivery: Staggered, ready for play

- **Prepared:** 2026-10-02. The owner said "Great, lets proeed" in response to
  the recommendation to return to Delivery for one bounded design/play cycle.
- **Question:** Does clearing order create a meaningful alignment decision,
  rather than another almost-complete ascending ladder? Baseline remains the
  owner's build-and-harvest play (PDL-008); this refines Delivery, not a new
  claim about replacing that strategy.
- **Constructed scene:** Equal-value builds can leave their survivor high or
  low; clearing the bottom first advances the parcel but shifts a later shaft
  tile past its intended outside partner. The exact scene and recovery routes
  are in the [design](delivery-sequence/README.md).
- **Scope:** Isolated layout, existing rules/UI, eight moves, seed 624. The
  owner's earlier wider-pool proposal is applied here as refills through 128.
  Earlier Delivery games and Connection Run remain untouched. Layout and pool
  changed together, so this is not a causal comparison of either parameter.
- **Verification:** Actual model/HTTP/UI-stand-in checks, tagged-material routes,
  and a bounded opening check. Authored three-, four- and five-move routes do not
  establish human difficulty or required continuation lengths. No human result
  exists for this board yet; do not infer enjoyment from checks.
- **Disposition:** **AWAIT OWNER PLAY**, http://127.0.0.1:8282. Ask whether the
  order/placement choice mattered or another obvious route dominated. No
  production adoption or portfolio acceptance. Native browser/touch QA unverified.
- **Sources:** Current owner authorization; [actual layout](delivery-sequence/model.js),
  [witnesses](delivery-sequence/witnesses.json), [checks](delivery-sequence/model.test.js).
  Operational task: DELIVERY-SEQUENCE-1; reviewer: owner.

### PDL-019 — Staggered: owner reports learning from the first loss

- **Reported:** 2026-10-02; supplements PDL-018's pre-play standing.
- **Owner feedback, verbatim:** "That was a much better puzzle!" Then:
  "definitely not obvious and I even lost the first time~". Asked whether the
  loss helped reveal a better plan, the owner replied: "It helped me pa better."
- **Interpretation:** In that question's context, read the final response as
  helping the owner plan better. The owner reports a more enjoyable, non-obvious
  puzzle and a useful first failure. Do not attribute a particular move, final
  win, attempt count beyond the reported first loss, or exact learning to this
  feedback; those were not established here.
- **Working disposition:** **KEEP as a Delivery reference**, based on owner
  reaction, not a final collection acceptance. Preserve this layout and its
  refill configuration instead of automatically increasing difficulty.
- **Consequence:** A future contrasting variation should test whether useful
  learning through retry can recur. This is a proposed next design question,
  not evidence that the family reliably produces it or authorization to start
  another bounded build in this feedback-recording turn.
- **Limits:** Conversation report only in this update; no saved play was replayed
  or matched to these statements. Layout and refill pool changed together, so
  their separate contribution remains unknown. No formal task acceptance inferred.
- **Sources:** The three owner messages in the current conversation; previous
  design and checked routes remain in [Staggered](delivery-sequence/README.md).

### PDL-020 — Delivery: Landing, contrasting layout ready for play

- **Prepared:** 2026-10-02. The owner approved a contrasting Delivery layout
  with "Ok proceed", then directed: "Finish shortcut checks and bring the
  contrasting Delivery layout back for your playtest."
- **Question:** Can choosing between immediate parcel progress and useful
  survivor placement produce learnable play distinct from Staggered? Preserve
  the owner's build-and-harvest baseline (PDL-008) and Staggered's encouraging
  feedback (PDL-019); neither establishes enjoyment of this new board.
- **Constructed scene:** The same four 16s create 64 with equal points. Ending
  inside the shaft advances the parcel less but leaves the survivor closer to
  a later partner. Ending outside advances it farther and requires a different
  support clear. Both have checked winning routes; recovery is possible.
- **Scope:** New isolated layout, seed 728. Staggered's rules, eight moves,
  refills through 128 and shared UI remain unchanged. All nine older live
  identities and 39 prior runtime source files were checked unchanged.
- **Verification:** Six new tests pass, including actual HTTP capture and
  served-model parity. Three stored routes select no refill tiles and replay
  exactly. Full opening enumeration through two moves finds no win, including
  normal refills; easy-board and forced-cutoff controls pass. This applies only
  to this seeded opening and does not establish human difficulty. Shared UI
  stand-in interactions pass; native browser/touch QA remains unverified.
- **Review:** A low-cost, read-only correctness pass found no concrete issue
  in the same-tile contrast, refill tagging, aggregate cutoff or UI wiring.
- **Disposition:** **AWAIT OWNER PLAY**, http://127.0.0.1:8283. Keep routes
  hidden. Ask whether survivor placement affected planning and whether a failed
  route revealed what to change; a loss is not a design requirement. No family
  acceptance, scientific experiment result or production adoption inferred.
- **Sources:** Owner authorization in this conversation;
  [design](delivery-bridge/README.md), [layout](delivery-bridge/model.js),
  [routes](delivery-bridge/witnesses.json), [tests](delivery-bridge/model.test.js).
  Operational task: DELIVERY-BRIDGE-1; reviewer: owner.

### PDL-021 — Landing: placement choice affected planning and felt satisfying

- **Reported:** 2026-10-02; supplements PDL-020's pre-play standing.
- **Owner feedback, verbatim:** "I would say yes and yes" after being asked
  whether they considered different chain endpoints, whether the resulting
  positions affected the next move, and whether a failed plan revealed what
  to change. The follow-up interpreted the first two questions as affirmed
  and asked: "Did working through that choice feel satisfying?" The owner
  replied "yws", read in context as yes.
- **Interpretation:** The owner reports a noticeable endpoint choice that
  affected subsequent planning and was satisfying to work through. The initial
  two affirmations do not establish the third, retry-learning question.
- **Working disposition:** **KEEP as a contrasting Delivery reference**
  alongside Staggered. Preserve both layouts and existing rules/refill settings;
  no automatic difficulty increase or additional mechanic follows.
- **Limits:** Conversation feedback only; no capture matched or replayed in
  this update. No exact route, win/loss, move count or retry-learning outcome
  established. This supports retaining these examples, not general enjoyment,
  formal operational-task acceptance or completion of the 3–5-archetype goal.
- **Next recommendation:** Extract Delivery authoring guidance from the two
  retained decision scenes before adding further layouts. This records a
  recommendation, not a new build or a replacement of the portfolio goal.
- **Sources:** The two owner messages and intervening question in this
  conversation; [Landing design](delivery-bridge/README.md). Operational task:
  DELIVERY-BRIDGE-1; reviewer remains owner.

### PDL-022 — Delivery guide and return to the remaining archetypes

- **Prepared:** 2026-10-02. After the recommendation to capture what makes
  the retained Delivery layouts work in an authoring guide, then return to the
  other archetypes, the owner replied "Ok, proceed".
- **Deliverable:** [Delivery authoring guide](../docs/game-design/levels/delivery-authoring-guide.md).
  It separates the build-and-harvest baseline (PDL-008), earlier easy-pattern
  revisions (PDL-011–012), Staggered feedback (PDL-019) and Landing feedback
  (PDL-021) from constructed decision scenes and future design recommendations.
- **Next recommendation / checkpoint:** Revisit the existing selected Feeder
  Choice prototype at http://127.0.0.1:8274/?level=feeders. Its verdict remains
  undecided; it tests incoming-material allocation, distinct from Delivery's
  space/alignment choice. Ask whether queue assignment changes the chain the
  owner prepares and whether that planning is worthwhile. No route disclosed.
- **Scope:** Documentation and existing local play availability. No new
  mechanic, layout, spawn pool, bot, hint, difficulty rating or gameplay edit.
  Staggered and Landing remain references; Gates stays parked and Heat / Turn
  the Board remain reserves. Connections retains its own unresolved work.
- **Limits:** No new human outcome or scientific result inferred. The guide
  is a source-grounded first version, not proof of repeatable authoring quality.
  No final collection acceptance, commit, publication or production adoption.
  Earlier preservation archives do not include this later documentation.
- **Sources:** Owner authorization in this conversation; PDL-008, PDL-011–012,
  PDL-019, PDL-021; [trio design and checks](archetype-trio/README.md);
  [working plan](../docs/plans/2026-10-01-level-archetypes-approach.md).
  Operational task: DELIVERY-GUIDE-1; reviewer: owner.

### PDL-023 — Feeder Choice did not change the owner's play

- **Reported:** 2026-10-02; resolves the undecided standing in PDL-011 and the
  revisit prepared in PDL-022.
- **Owner feedback, verbatim:** "Ya, feeder choice didn't really do anything.
  I just played normal".
- **Interpretation:** The visible refill allocation did not create a perceived
  change from normal play for this owner. Different mechanically available
  follow-up chains did not establish an interesting planning choice.
- **Working disposition:** **PARK current Feeder design**. Preserve the source
  and captures; do not tune another layout solely to rescue it. This is not
  proof that all possible incoming-material mechanics fail.
- **Consequence:** Delivery remains retained with two references and a first
  authoring guide. Connections remains an exploration. Current Gates and Feeder
  are parked, so a third retained family requires another concept decision.
  Recommend the previously proposed Turn the Board reserve: changing gravity
  can gain one alignment while sacrificing another, at a visible move cost.
  It remains a proposal until the owner selects it; no new build authorized by
  this feedback alone.
- **Limits:** Conversation report, not a matched capture or exact win/loss.
  No general difficulty, population preference or final portfolio acceptance
  claim. Existing games and rules remain unchanged; no server was retired.
- **Sources:** Current owner message; [Feeder scene](archetype-trio/README.md),
  [original reserve concepts](../docs/game-design/levels/2026-10-01-archetype-concepts.md).
  Operational task: DELIVERY-GUIDE-1; reviewer: owner.

### PDL-024 — Turn the Board selected and ready for play

- **Prepared:** 2026-10-02. The owner replied "sure" to trying the previously
  proposed Turn the Board reserve after the current Feeder design was parked.
- **Question:** Does spending a move to change gravity create a worthwhile
  alignment choice within the owner's build-and-harvest baseline (PDL-008)?
- **Exact scene:** A ready down-gravity `32 → 32 → 64` is separated by a left
  turn, which connects two previously separated 64s with a 128. Harvesting
  first changes the later preparation. Both approaches have checked wins
  selecting only initial/built material; neither is declared globally better.
  The ordinary opening harvest also retains an ordinary follow-up.
- **Essential convention:** A full rectangle cannot shift under a new gravity
  direction. This version therefore retains eight open cells: turns settle
  existing material without refill, while merges replace only removed tiles
  in their affected lanes. This was explicitly announced before implementation.
  Gravity and sparse occupancy are being tried together, not isolated causally.
- **Scope:** New isolated model/UI/server, seed 905, eight actions, score target,
  refills through 128. Clockwise/counterclockwise quarter-turns cost one move
  and no points; full previews are free. Undo and local capture include turns.
  No earlier gameplay or shipped engine edited.
- **Verification:** Ten actual-model/UI-script/HTTP tests pass. Four-direction
  settling, sparse refill, preview immutability, guards, tagged routes,
  replay/undo and invalid-save rejection are checked. The full bounded opening
  enumeration includes turns/refills and finds no one/two-action win on this
  exact board; an earlier ladder shortcut made it fail before layout revision.
  Known-easy and deliberate-cutoff controls pass. No difficulty claim follows.
- **Disposition:** **AWAIT OWNER PLAY**, http://127.0.0.1:8284. Routes remain
  hidden. Ask what drove turning, waiting or clearing first, and whether it was
  worthwhile or merely an emergency reshuffle. Native rendered/touch QA remains
  unverified; blocked browser access was not retried.
- **Limits / sources:** No human result, third-family acceptance, scientific
  experiment result or production adoption inferred. Current conversation;
  [design and checks](turn-the-board/README.md), [model](turn-the-board/model.js),
  [routes](turn-the-board/witnesses.json). Task: TURN-BOARD-1; reviewer: owner.

### PDL-025 — Turn the Board interesting but mixed; park this archetype version

- **Reported:** 2026-10-02; resolves the owner-play checkpoint prepared in
  PDL-024 without altering that historical preparation record.
- **Owner feedback, verbatim:** "Ok, it was interesting. I am mixed on it - if
  it felt worthwhile or I just used it to get the pieces more compact and
  re-aligned". The owner then clarified: "it wasn't that I was trying to
  create a setup or strategy".
- **Interpretation:** The intended prospective alignment-planning choice did
  not emerge in the owner's reported play. The mixed reaction is not rejection
  of all rotation mechanics, nor evidence that the authored tradeoff cannot
  exist. Compacting/re-aligning may be useful board control; that is a design
  possibility, not a demonstrated strategic archetype or new build selection.
- **Recommendation and owner decision:** Recommended parking this version as
  an archetype while keeping rotation as a possible board-control mechanic.
  The owner replied "Ok. I agree". **PARK current Turn the Board archetype
  version**; preserve source, captures and playable reference unchanged.
- **Consequence:** Delivery remains the strongest endorsed direction, with
  two retained references and a first guide. Connections remains an exploration.
  Current Gates, Feeder Choice and Turn the Board are parked. A replacement
  concept needs selection; Heat is not automatically selected. The original
  3–5-family goal remains unfinished.
- **Limits:** Conversation report, not a matched capture, exact move, win/loss,
  population preference, difficulty or causal result. No further tuning,
  constraint, server shutdown, release or formal task acceptance inferred.
  The preserved Turn checkpoint predates this feedback; older archives remain
  unchanged. Native rendered/touch QA remains unverified.
- **Sources:** The three owner messages and intervening recommendation in this
  conversation; [prototype design and prior checks](turn-the-board/README.md).
  Operational task: TURN-BOARD-1; reviewer: owner.

### PDL-026 — Keep the strong single Connections mode; no forced third family

- **Decided:** 2026-10-02; supersedes the original minimum-count goal and the
  replacement-concept queue following PDL-025. Earlier records remain history.
- **Owner message, verbatim:** "We have done alot today and I think having
  connections, just the 1 , which is really strong, is good. We don;t have to
  force having 3".
- **Scope:** Retain current Connection Run as the single Connections mode.
  Remove the requirement to find three families or manufacture a contrasting
  Connections variant for coverage. Existing Delivery Staggered and Landing
  remain retained; no instruction to retire them was given. Parked Gates,
  Feeder Choice and Turn the Board stay parked. Heat remains unselected.
- **Consequence:** Stop the third-family/replacement-concept queue for this
  pass. The original 3–5 target is superseded, not failed or unfinished
  mandatory work. Preserve current play, rules, feedback and captures.
- **Limits:** Owner design endorsement and scope change, not a matched replay,
  general difficulty result, exclusive Connections-only product pivot, native
  QA completion, formal task acceptance, publication or production adoption.
  No new prototype, aid change, bot study or server action authorized by this
  message. Prior preservation checkpoints do not include this later decision.
- **Sources:** Current owner message; [updated plan](../docs/plans/2026-10-01-level-archetypes-approach.md),
  [current Connections mode](connections-continuous/README.md), PDL-019, PDL-021,
  PDL-023–025. Operational task: ARCHETYPES-SCOPE-1; reviewer: owner.

### PDL-027 — Sustained Connection Run exposes stranded material

- **Reported:** 2026-10-02, after retaining the single Connections mode and
  discussing close-out. PDL-026's scope choice remains unchanged.
- **Owner report, verbatim:** "So, after playing connection run for many turns
  this is what inevitably happens. Since every 3 forces the creation of a
  non power of 2. And those non power of 2 tiles are then mainly dead tiles as
  they don't merge as easily. So the bored becomes filled with non playable
  tiles. There is no way to addres this right now".
- **Source-confirmed mechanism:** Every third bank card prefers a non-power
  target, but mode/span ranking and fallback mean this is not a hard force.
  Objectives leave normal merge results intact. Chains start with equal values
  and extend equal/double; refills supply only 2–128 powers of two. Ordinary
  merges can also leave non-power results, so restricting targets alone would
  not remove the source of residue. Singletons cannot get a matching partner
  from that refill pool, though the player can separately build compatible values.
- **Exact local observation:** Frozen save
  `742d35a0-74af-4111-a059-8eddea90b020`, saved at 22:46:14.965 UTC, replays
  exactly to 41 moves on board 0, with three completed objectives. The current
  96, 288 and 18 cannot participate in any legal complete chain. The 288 was
  produced completing objective 3; the 18 and 96 came from ordinary moves.
  This snapshot still permits ordinary play; it does not demonstrate a fully
  locked board, monotonic accumulation, inevitable saturation or permanent
  impossibility of building compatible partners.
- **Checks / controls:** Replayed the immutable capture twice against copied
  identity-matching rules. Bounded exact participation search completes without
  exhaustion. Constructed controls show a stranded 96 alongside an ordinary
  playable chain, legal `96 → 96 → 192`, and ordinary `32 → 32 → 32` creating
  96. Skip leaves the grid unchanged; New board resets values. A diagnostic
  no-stranded assertion fails on the frozen capture as expected.
- **Coverage gap:** Existing long-run completion tests can explicitly deal a
  new board when no objective is available. They verify witnessed goals/replay,
  not a healthy material lifecycle on one persistent board. No new population,
  difficulty or scientific experiment result follows.
- **Disposition:** **Retain concept; material-lifecycle decision needed before
  sustained-play close-out.** Diagnosis only. The earlier objective-only-observes
  contract would need explicit reconsideration if completion starts consuming
  material. No recycling, cash-out, refill, rounding, target or chain-rule repair
  selected or implemented. Do not mask the issue with another archetype.
- **Sources:** Current owner report; model/engine and existing tests; frozen
  capture, copied rules and reproducible probe under workspace
  `preservation/connections-residue-20261002/`; [diagnosis receipt](../.blackboard/runtime/CONNECTIONS-RESIDUE-1.md).
  Task: CONNECTIONS-RESIDUE-1; reviewer: owner.

### PDL-028 — Earned tile removal selected; isolated trial ready

- **Prepared:** 2026-10-02, after PDL-027's sustained-play concern. PDL-026's
  retained-mode/no-quota direction remains unchanged.
- **Owner intent:** Suggested earning removal by a 2k tile or score meter,
  described both as ways to earn a power-up, and said they would save charges
  with a possible maximum of three. They expect more planning and encouragement
  to build and score high tiles. Selected large-tile milestone over score meter,
  then 2048-or-higher over exactly 2048. Latest authorization: "ok proceed".
- **Selected contract:** One charge per ordinary merge creating 2048 or more,
  including non-power results above the threshold. Save up to three; choose any
  tile to remove. Apply ordinary gravity/refill without score or objective
  completion; the current objective remains unchanged. Preview grants nothing;
  cancel is free, and undo restores inventory along with the board.
- **Announced first-trial defaults:** Start with zero, discard excess awards at
  capacity, count removal as one move (no move limit), preserve bank on Skip/New
  board and clear on Restart. These are not separately validated balance choices.
- **Isolation:** New mode at http://127.0.0.1:8285, with its own rules identity
  and authoritative action capture. Original 8281, Delivery references, ordinary
  chain rules, board/seed, refill pool and objective bank are unchanged. Old
  captures are not retroactively awarded charges. No new archetype is inferred.
- **Verification:** Fifteen new-mode model/UI-script/HTTP checks pass; the wider
  focused run passes 88. Missing award, control and actual served-page behavior
  failed before implementation. Checks cover capacity, removal/gravity/refill,
  no-chain rescue, preview, undo/resume and rejected invalid/stale saves. A
  hidden earning witness is feasibility, not optimality or human difficulty.
- **Boundaries:** Full solver suite: 585 pass, four fail, one skip. Three are
  documented receipt/view failures; the fourth is a pre-existing collector gap
  reproduced with the new mode excluded and one actual old capture. Collector
  repair was not folded into this build. Native rendering/touch QA and dedicated
  independent review remain open. No release, adoption or acceptance claimed.
- **Disposition:** **AWAIT OWNER PLAY**. Assess whether rewards arrive before
  clutter becomes troublesome and whether saving versus spending creates useful
  decisions. The trial does not yet prove healthy sustained-board play.
- **Sources:** Current owner dialogue; [concept/trial record](../docs/backlog/BL-0024-connections-earned-cleanup.md),
  [play contract](connections-powerup/README.md), [implementation receipt](../.blackboard/runtime/CONNECTIONS-POWERUP-1.md).
  Task: CONNECTIONS-POWERUP-1; reviewer: owner.

### PDL-029 — Earned-removal loop is fun; owner wants finite levels

- **Reported:** 2026-10-03, following the isolated trial in PDL-028.
- **Owner feedback, verbatim:** "oh this is all a good balance! It is hard even to save them up! It is constant change of organize the board for growth to trying to accomplish the connection objective to getting that 2k tile fior a removal bonus".
- **Follow-up, verbatim:** "Yes it is fun. I kind of wish there were \"levels\"".
- **Interpretation:** The owner reports enjoying the competing priorities of growth, objective progress and earning recovery, with meaningful difficulty saving charges. A finite finish line is now the requested addition, not a replacement earning rule.
- **Disposition:** Keep the current earning threshold and cap unchanged while exploring level structure. Preserve the endless version and earlier games. Do not infer that long-run board health is solved.
- **Limits:** Conversation report, not a matched capture, causal comparison, population balance result, task acceptance or native-QA approval. No new gameplay implementation follows from this feedback alone.
- **Sources:** Current conversation; [existing play contract](connections-powerup/README.md), PDL-028. Later scope is recorded separately in PDL-030.

### PDL-030 — Separate budgeted Connection puzzles; design scope confirmed

- **Decided:** 2026-10-03. Extends the retained Connections direction without restoring the superseded archetype quota.
- **Owner preference, verbatim:** "I thnk they are both great modes to have for the user. I think 2 is easier to pull off at the moment. I personally wanted 1". Offered options were separate puzzles and chapters retaining the same board; prioritize separate puzzles. Chapters remain appealing but deferred.
- **Pressure choice:** Owner selected "1" for a move budget over unlimited moves and board-health pressure.
- **Removal choice:** Owner selected "1" for spending one budgeted move over free removal; the cost matters within the finite allowance.
- **Confirmed scope:** Owner replied "yes" to three separate puzzles, each with a designed starting board, three ordered connection objectives shown one at a time, and one shared move budget. Each starts with zero charges, charges do not carry between levels, retry restores the same board/objectives/refills, and objectives cannot be skipped to win. Preserve the existing merge/recovery rules and all endless play.
- **Design intent:** Test alignment, useful material retention and growth versus objective progress. At least one level should make earned removal useful. Allow credible alternative plans rather than demanding an exact hidden route.
- **Authority boundary:** Confirmation authorizes saving the requirements brief. Concrete boards, budgets, feasibility and owner play remain ahead; no level mode has been built or verified by this record. No score-rule adoption, server action, commit, PR or publication authorized.
- **Sources:** Current conversation and the confirmed synthesis; [requirements brief](../docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md). Task: CONNECTIONS-LEVELS-BRIEF-1; reviewer: owner.

### PDL-031 — Retained designs belong in the original game

- **Clarified:** 2026-10-03, after the owner challenged wording that confused the standalone prototype with the existing tile game.
- **Owner confirmation, verbatim:** "Yes, I agree. So these will become the level variants in that game yes?"
- **Destination:** The original 2248 Challenge app, not a separate product. Connections is the first priority; Delivery remains a retained candidate. The existing prototypes are isolated playtests and have not been integrated.
- **Carried decisions:** PDL-030's finite puzzles, ordered objectives, shared budget, recovery cost and repeatable retries still stand. Integration does not reset them; endless play remains preserved.
- **Latest planning authority, verbatim:** "Can I continue playing here while you make progress in these items".
- **Disposition:** Reconcile and enrich the existing level brief while the owner continues unchanged play. The resulting plan makes the destination explicit; it does not claim implementation, select a full campaign order or authorize publication.
- **Sources:** Current owner dialogue; [enriched plan](../docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md). Task: CONNECTIONS-INTEGRATION-PLAN-1; reviewer: owner.

### PDL-032 — Prototype visual design preferred

- **Reported:** 2026-10-03, following the original-game destination clarification.
- **Owner preference, verbatim:** "Ok, as an FYI - I prefer the visual design of this one vs the 2248".
- **Interpretation:** Use the current Connections prototype as the visual reference for its integrated view. Keeping the original game does not require copying its older presentation.
- **Limits:** A visual preference, not native-QA approval, a selected brand change or permission to replace every legacy screen. Whole-game visual scope remains a later decision.
- **Sources:** Current owner dialogue; R17 in the [enriched plan](../docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md).

### PDL-033 — Original-app finite pack built locally; owner play next

- **Authorized:** 2026-10-03. Owner replied "Ok proceed" after the integration
  planning handoff. The scope is local implementation of that plan while the
  owner continues the unchanged 8285 run; no commit, publication or main adoption.
- **Delivered candidate:** Crosscurrent, Keep a Line and Borrow a Space in the
  original app's Connections category, served separately at
  http://127.0.0.1:8286/?mode=connections. Three fixed ordered goals are shown
  one at a time. Shared budgets, paid recovery, independent inventory and
  identical retries retain PDL-030. Prototype visuals guide this view only.
- **Concrete authoring:** The captured baseline remains build-and-harvest
  (PDL-008). The [candidate scenes](../docs/game-design/levels/connection-pack/README.md)
  identify actual material, placement and recovery consequences. Alternative
  legal plans remain allowed; no hidden route is mandatory.
- **Verification standing:** Actual model, page-controller and HTTP replay
  checks pass. Whole-level routes are legal and private. All first objectives
  have found two-move routes within the reported search bounds; no human
  difficulty rating or shortest whole-level claim follows. See the
  [build receipt](../.blackboard/runtime/CONNECTIONS-LEVELS-BUILD-1.md) for exact
  test results, source preservation and capture boundaries.
- **Limits:** Native visual/touch QA is unavailable through the enabled browser
  surface, and independent review remains open. The full solver suite retains
  its four existing failures; no check was weakened. The work stays uncommitted
  on the feature worktree. This does not establish sustained-board health,
  select campaign ordering, integrate Delivery or approve a whole-game restyle.
- **Disposition:** **AWAIT OWNER PLAY**. Does a finite finish make choosing a
  plan and learning through retry more satisfying than the continuous run?
  No owner result, release approval or task acceptance is inferred.
- **Sources:** Current owner authorization; [implementation plan](../docs/plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md),
  [actual catalog](../src/connection-levels.js), [authoring limits](../docs/game-design/levels/connection-pack/README.md).
  Task: CONNECTIONS-LEVELS-BUILD-1; reviewer: owner.

### PDL-034 — Keep a Line planning concern; column forecast remains proposed

- **Reported:** 2026-10-03. The owner asked whether their final Keep a Line
  objective was winnable with three moves remaining, then questioned how they
  could know to uncover the required tiles. They described preserving useful
  material, mapping plausible paths and clearing supports while hoping the
  falling material helps.
- **Exact-attempt boundary:** KEEP-A-LINE-PATH-1 records a replayed continuation
  for the saved board, not proof that it was the only winning plan or a route
  the owner could foresee. No difficulty, fairness or strongest-bot result.
- **Correction:** Free Preview result already shows exact immediate refills.
  The earlier chat statement that the owner had no way to know was too strong
  and was corrected. The owner said they had never used the control. Do not
  confuse missing information in the ordinary board with unavailable information.
- **Proposal, verbatim:** "So, my idea is that above each column you show the
  next tile." BL-0025 retains this as proposed. A stable per-column promise
  would change the current shared refill assignment; that behavior is not
  selected. No forecast or puzzle retuning follows from this feedback.
- **Current direction:** The owner then said "Just continue on with waht you
  were doing". Continue the existing finite-pack handoff, preserving active
  play; no new mechanic, campaign, commit or release authority is inferred.
- **Sources:** Current owner dialogue; [exact-attempt receipt](../.blackboard/runtime/KEEP-A-LINE-PATH-1.md),
  [proposed idea](../docs/backlog/BL-0025-connections-next-tile-forecast.md).
  Task: CONNECTIONS-LEVELS-HANDOFF-1; reviewer: owner.

### PDL-035 — Land the selected Connections work in the main project

- **Authorized:** 2026-10-04. Owner: "so we need to  get this work onto the main project".
- **Scope:** Land the existing original-app finite Connections pack and retain
  the archetype prototypes, plans and design history as references. This is the
  same Git repository, not a separate game. Preserve ongoing play and captures.
- **Settled boundaries:** Do not add column forecasts, integrate Delivery into
  the app, renumber/unlock the campaign, retune puzzles or restyle legacy screens.
  The endless power-up trial remains a retained prototype, not a second newly
  selected original-app mode.
- **Process:** Commit owned work on the feature branch, integrate current main,
  run the existing experiment/ledger and compatibility gates, obtain actual
  GitHub Codex review, address findings and merge through a PR. No direct push
  to main, self-acceptance or waiver of known test failures.
- **Information management:** The [receipt archive](../docs/game-design/levels/receipts/README.md)
  supplies durable snapshots by original task ID. Earlier local-only receipt
  links remain historical; their originals and same-machine backups are kept.
- **Standing:** Main integration is authorized, not yet completed by this
  decision entry. Native gameplay/touch QA remains incomplete. The release
  state and fresh verification belong in the [integration record](../docs/game-design/levels/connections-integration.md).
  Task: CONNECTIONS-MAIN-INTEGRATION-1; reviewer: owner.
