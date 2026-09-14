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
