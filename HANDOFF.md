> **Current authority:** This document is the snapshot stopped on 2026-08-20. Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) for current project status and proof boundaries; this file is navigation and history, not evidence. Sections are newest first — anything below the 2026-08-20 section is retained history and at least one instruction in it has since been narrowed. Read this section before acting on any older one.

# 2248 Challenge — Handoff

## 2026-08-20: the bot's own move generator was the bottleneck

**Two levels shipped, and the reference bot got 5% stronger from one tie-break.**

The bot chose its moves by walking from each tile to the lowest-value legal
neighbour and never backtracking. Being self-avoiding, that walk strands itself:
it builds 11-tile chains on boards where 19-tile chains exist. Points scale with
the chain sum, so it was leaving close to half the value of the board's best move
on the table, every move. Breaking ties by Warnsdorff's rule — among equal-value
tiles take the one with the fewest onward moves — is worth **+5.25%** median
score at t = 15.7 on 15,300 unseen games (`RESULT-0011`).

For scale: the preceding two-day hyperparameter search bought +1.10%. It was not
wrong, it was tuning how to rank a candidate list that was being crippled before
it arrived.

**Shipped:** Level 51 and Level 52, plus the drag-to-chain input replaced with
click-then-submit. All three had been sitting uncommitted; Level 52 had been
ready with zero work outstanding since 2026-08-17.

**Preserved:** the level generator and every run output it produced now have
commits on `codex/level-authoring-tracer`. They previously existed only as
untracked files on one disk.

### The "do not resume level generation" instruction below is too strong

The 2026-08-18 section says to stop generating 2248 levels because ranking them
is noise. The winner's-curse diagnosis in it is correct and worth reading. Its
scope is not. That verdict came from `board-search-01.json`, which ranked **400
boards of one identical shape**, differing only by spawn seed — the hardest
possible case, where the true differences between candidates are smaller than the
measurement error. Ranking levels that differ *structurally* is reliable and
cheap: scoring the shipped levels twice on disjoint seeds agrees at r = 0.98 at
60 games each.

So what is dead is **reseeding one shape and ranking the draws**. Generating
structurally varied levels and ranking those is not, and the generator that does
it is now committed.

Two more corrections to that section, both from measurement rather than opinion:

- It reports the candidate cap saturating because "boards offer a median of 15
  legal chains and at most 30". Boards offer 198,563 to 8,284,580. Fifteen to
  thirty is what the *generator* returned. See `CORRECTION-0003`.
- The branch it points at, `worktree-deterministic-2048-solver`, does not make
  2248 deterministic. It builds **vanilla 2048 with walls** — a different game.
  Seeding 2248 itself was measured separately and is tractable only on tiny
  boards: 4x4 resolves exactly in 669ms, 4x5 blows past the node cap.

### Open, ranked — what the next session should pick up

1. **Nothing is backed up off this machine.** No git remote exists. Every commit
   in this repo and in both worktrees lives on one disk.
2. **Two eras of level target now exist.** A target is `demand x measured
   achievable score`, and the bot now measures ~5% higher. Levels 1-52 were
   derived against the old bot; anything authored later will not be. Owner
   decision, unresolved: re-derive the curve, or accept the split and note it.
   `RESULT-0012` defers it for one level without settling it.
3. **Level 35's lockout rate moved 3% -> 7%** under the stronger bot (gate
   ceiling 10%). Longer chains consume more tiles and lockouts come from
   unmatchable sums accumulating, so there is a mechanism — but the gate samples
   ~40 seeds, so this is 1 game against 3. Measure on 300 seeds before believing
   it either way.
4. **The ledger has no status for "explanation narrowed, result intact".** The
   only correction-linked status is `superseded`, which would wrongly retire
   `RESULT-0010`. It is currently `accepted` with an appended note.
5. **The "41 of 43, 48 of 48" human-vs-bot claim has no receipt.** It appears
   once, as prose, in `HANDOFF-NEXT-MAP-ELITES.md`. Independent measurement
   points the same way and harder, but the figure itself is uncited.
6. **Candidate 54's open question is still open.** Raising demand from 70% to
   85% was playtested on a board the owner had already memorised, so it cannot
   separate "harder target" from "already knows the board". Needs a fresh seed.
7. **Batch candidate names collide.** They restart at `gen-0000` in every batch,
   so `gen-0010` names two unrelated levels.

## 2026-08-18 (late): the generator's rankings were noise; project is pivoting

Everything in the section below is accurate about what was built, but its rankings do not
survive re-evaluation. Selecting the top of a noisy estimate selected mostly for luck: the
top 6 boards dropped 10.3% when re-scored on unseen players, the board ranked #3 fell to
#220 of 400, and two independent estimates of the same board correlate at only r = 0.49.
The underlying board effect is real (true variation about 7.5 points of win rate) but the
samples were roughly 8x too small to see it.

**Do not resume 2248 level generation.** The decision taken at session end is to move to a
deterministic puzzle game and build a real MAP-Elites archive, because 2248's random tile
spawns are the source of the noise and cannot be engineered away.

> **Narrowed on 2026-08-20 — read the top section before acting on this.** The diagnosis
> here is sound; the instruction drawn from it is too broad. It generalises from a search
> over 400 boards of a single shape to all of 2248 level generation. Ranking structurally
> different levels measures reliably at 60 games (r = 0.98). Reseeding one shape and
> ranking the draws is what fails.

Read **[HANDOFF-NEXT-MAP-ELITES.md](HANDOFF-NEXT-MAP-ELITES.md)** first. It carries the full
history, the pathology and its numbers, the three domain-independent fixes, the game
recommendation, the build order, and the negative results not to re-litigate.

## 2026-08-18 session: the generator exists, and it found a problem upstream of itself

The level generator that the 2026-08-17 handoff listed as unstarted (fork 3) is
built and working. It lives in the tracer workspace at
`solver/generate-levels.js`, is uncommitted, and has 15 tests of its own
(`solver/tests/generateLevels.test.js`, `solver/tests/profileShapes.test.js`).
All 105 tests in the workspace pass.

**What it does.** Samples level shapes from a declared space, screens them on 24
seeds for a fraction of the cost, runs survivors through `level-author.js`
unchanged, and re-checks the shortlist with the pipeline's own
`verifyCandidate`. Three batches ran: `generated-batch-01/02/03.json`, 120-150
shapes each, ~4-10 minutes per batch.

**The finding that matters, and it is not about the generator.** Two human
playthroughs disagreed about difficulty in a way no level parameter explained.
Measuring the number of distinct opening moves each board offers shows why: for
one fixed level, across seeds, that count ranges from 124 to 1363. Across two
different levels, the medians are 536 and 467. **Seed variance beats level
design by roughly 10x.** The shipped game has no seedable RNG, so a player draws
a random board every attempt.

Consequence: a single playthrough cannot evaluate a level design, and four of
them across an evening did not. Any tuning done by playtest is measuring the
draw, not the level. This is the blocker on the whole authoring approach, not a
detail.

**Two forks, neither started, both needing no human play time:**

1. Gate on board variance — reject levels whose boards swing wildly, so a
   player's experience is at least consistent. Cheap, bot-only, does not make
   "is this level fun" answerable.
2. Fix the seed per level — ship a chosen board rather than a random one. Makes
   one playthrough real evidence and makes every hour of playtesting usable.
   This is a change to how the game works and is the owner's call. Recommended
   over (1) as of session end; not started.

**Measured and closed (do not re-open without new evidence):**

- *Score-curve ranking.* Backload and spike, measured from bot play
  (`solver/profile-shapes.js`), do not separate candidates: 44-53% and 10-21%
  across all fifteen in batch 01, with the dullest tying the best. Cause is
  structural — the bot cashes in every move, so its curve is flat on every
  board by construction. The metric measures the player, not the level. Kept
  because it is cheap to recompute against a stronger player; nothing ranks on
  it.
- *Minimum chain length as a difficulty lever.* Batch 03 held blockers at zero
  and varied `minChain` 3-5. A 5-tile minimum accounted for 23 of 25 screen
  drops and 8 of 9 gate failures — but the three that survived it were won by
  the bot 90-95% of the time. It removes boards; it does not make them
  demanding. Wrong knob.
- *Blockers as the difficulty lever.* Batch 03 ran with zero blockers and still
  produced a 69% candidate, harder than anything in batch 01, which had them
  throughout. Bombs specifically are near-free: replaying the human `gen-0017`
  game shows all three bombs cleared by move 2 without being aimed at, fuses
  never dropping below 10. A chain deletes every tile except its last, so a bomb
  anywhere in a chain is removed outright — it does not have to be the final
  tile, and bombs never restrict which chains are legal.

**Ranking, current state.** The shortlist sorts by bot win rate *ascending*
(hardest first), in `rankShortlist`. It rests on one playthrough: in batch 01
the lowest-win-rate candidate was the only one the owner enjoyed. The second
playthrough (`gen-0017`, 70%) then contradicted it by feeling easier than
`gen-0010` (75%). Treat as a placeholder, not a finding — and note that the
seed-variance result above means neither playthrough could have settled it.

**Known defect, unfixed:** candidate names restart at `gen-0000` in every batch,
so `gen-0010` names two unrelated levels across batches 01 and 03. Names should
carry the batch.

**Session-local:** the authoring server is stopped and
`solver/candidate-levels.json` is restored to the committed Level 51, so the
suite is green. Candidates played tonight are saved as
`solver/candidate-levels-gen0010.json` and `-gen0021.json`. Two new recordings
exist, both on seed 777: `d36e875d…` (batch-01 `gen-0010`, win, 114,944 in 16 of
21 moves) and `44d3802d…` (batch-02 `gen-0017`, win, 69,888 in 11 of 16).

## 2026-08-17 session (earlier history)

**Stopped:** 2026-08-17 at owner request, after a session that ran long enough to produce real confusion about what was actually being built. This document exists specifically to prevent that confusion from repeating in the next session.

## Read this first: two separate things got conflated this session

1. **A pipeline that *measures and validates* a level shape a person proposes.** This is real, built, tested, and used to ship a level (see below).
2. **A system that *invents* level shapes on its own**, with no human picking the grid size, blockers, or chain rule. **This does not exist.** Every candidate shape this session (51, 52, 53, 54) was hand-picked by the assistant, not generated by any algorithm. The bot only ever measured and validated shapes it was handed.

Early in the session, when the owner asked about "the agent proposing levels," the assistant said the pipeline was "basically built" — true only for (1), but this was never clearly re-flagged again, so the owner reasonably believed hand-picking three candidate shapes (52/53/54) later in the session was progress toward (2). It was not. Do not let this happen again: if the owner asks for the generator, that is unstarted work, not a variation on what already exists.

## What's actually shipped (real, in the live game)

- **Level 51** ("split-channel"): 5×7 grid, min chain 4, 24 moves, tile scale 32, no blockers, target 124,000 (70% of measured achievable score). In `src/game.js`'s `LEVELS`. Full test suite (73 tests) and the 7-check curve gate both pass. Ledger: `RESULT-0009`.
- This was the first shipped level whose target was never hand-typed, and the first with real human playtest evidence (three replay-verified human sessions on the same seed, two different winning strategies) rather than just a bot win rate.
- The trackpad-unfriendly drag-to-chain input was replaced with click-tile-then-submit (Enter or a Submit button) in both the shipped game (`src/game.js`, `src/index.html`) and the isolated tracer workspace's copy of the same files.

## What's measured, verified, and human-played — but NOT shipped

- **Candidate 52** ("stone-gate"): same shape as 51 plus one stone blocker at (2,3). Target 102,000 (still 70% demand). 300-seed holdout: 290/300 wins, 0 lockouts, 0 bombs — passes. Owner played it and won: 124,864 points, 15 moves, seed 1. Replay-verified clean. **This is ready to ship on the same terms as 51 the moment the owner says so** — no further work needed, just add it to `LEVELS` the same way 51 was added.

## What was tried and rejected (real finding, not a bug)

- **Candidate 53** ("five-chain"): same shape as 51 but `minChain: 5` instead of 4. 300-seed holdout: 291/300 wins, but **4 lockouts** (dead boards, no legal move) — fails the pipeline's zero-lockout bar. Never shown to the owner. Finding: a 5-tile minimum chain requirement is not safe on a 5×7 board at this tile scale; would need a bigger board, more moves, or some other compensating change to be viable.

## Candidate 54 — a real verified win exists; here's exactly what it does and doesn't show

- Same shape as 51, `demand: 0.85` instead of 0.70 → target 150,000. 300-seed holdout: 256/300 wins, 0 lockouts, 0 bombs.
- Owner played it on seed 1 — the same board as Level 51 — and won: 152,704 points, 16 moves, best chain 26. Replay-verified clean (`recordings/3d3ba1f05b08030337e805c61c0584e99d157caade3e7e62298769219806258a.json`).
- **Shows:** on that specific board, raising demand from 70% to 85% cost the same player 4 more moves (16 vs. Level 51's 12) to clear. That's a real, measured price of the harder target.
- **Doesn't show:** whether 85% demand feels right on a board nobody's played before — seed 1 was already fully known from Level 51, so this result can't separate "harder target" from "already knows the board." That test needs a fresh seed. Stated once, here — no need to re-litigate it every time a new result on this candidate comes in.

## Session-local state (not committed, may be stale by next session)

- An authoring server is likely still running in the background (`node solver/authoring-server.js`, isolated workspace, random port each start — check `ps aux | grep authoring-server` or just restart it). It currently serves whichever of `solver/candidate-levels.json` / `.receipt.json` was copied in last (was candidate 54 at session end). Saved copies of each candidate's store/receipt exist alongside it as `solver/candidate-levels-52.json`, `-53.json` (rejected, kept for the record), `-54.json`, so any of them can be restored by copying over the live file and **restarting the server** (it caches candidate data at startup, does not re-read it live — this caused real confusion this session, see below).
- Five real recordings exist in the isolated workspace's `recordings/` (three for Level 51's board across the input-bug-fix story, one for candidate 52, one for candidate 54). None are committed; they're evidence artifacts, not source.
- The isolated workspace is `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo` — a separate git worktree from the main repo. Its `src/game.js`/`src/index.html` were patched with the same click-to-select fix as the main repo, independently.

## A mechanical trap that caused real confusion this session

`solver/authoring-server.js` loads `candidate-levels.json` and `candidate-levels.receipt.json` **once, at server startup**, into a closure — not per-request. Editing those files on disk while the server is already running does nothing until the process is restarted. This looks like it should work (the *static* game files it also serves, `game.js`/`index.html`, genuinely are re-read fresh per request) but the candidate data is not. Always restart the server after swapping which candidate is live.

## A pattern to avoid next session

Partway through, the owner named that the assistant kept attaching a "but this doesn't actually prove X" caveat to nearly every result reported, even after being told once that this read as controlling rather than helpful. The assistant agreed to stop, then did it again on the very next result. The fix: state a methodology limit once, when it first matters (done above, for candidate 54). After that, respond to new results on their own terms — only reopen the methodology question if the owner asks it again.

## Correct next steps (owner's call, not a default)

Three genuinely open, separate forks — pick one, or none:

1. **Ship candidate 52** as Level 52. Zero remaining work; it's fully proven the same way 51 was.
2. **Reroll candidate 54 on a fresh seed** and have the owner play it blind, to actually answer whether 85% demand feels right — the one open question this session raised but never settled.
3. **Build the actual level generator** — something that proposes shapes itself (varies grid size, blockers, chain rules, demand) and filters to a shortlist worth human playtesting, instead of a human hand-picking each one. This is unstarted. Scope it before starting: at minimum, what parameters can it vary, what's the search/sampling strategy, and what does "worth showing the owner" mean mechanically (the zero-lockout/≥20%-win bar already used for 52/53/54 is a reasonable starting filter).

Do not resume generating more one-off hand-picked candidates (a "55", "56", ...) without the owner explicitly asking for that specific thing — that pattern is what caused this session's confusion.

## Useful commands

```bash
node --test solver/tests/*.test.js                      # 73 tests, all green as of this handoff
node solver/verify-loop.js                               # curve health gate; exit 0 = PASS, 51/51 levels
node solver/game-tester.js --seeds 150                    # compare tile-scaling policies
cd .orch/runs/level-authoring-tracer-2026-08-12/workspace/repo
node solver/authoring-server.js                           # serves whichever candidate-levels.json is live; restart after swapping
node solver/author-level.js --shape <file> --write        # derive + write a new candidate (overwrites the store)
node solver/author-level.js --verify candidate-levels.json candidate-levels.receipt.json
```
