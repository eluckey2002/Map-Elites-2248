> **Current authority:** This document is the snapshot stopped on 2026-09-05. Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) for current project status and proof boundaries; this file is navigation and history, not evidence. Sections are newest first — anything below the 2026-08-20 section is retained history and at least one instruction in it has since been narrowed. Read this section before acting on any older one.

# 2248 Challenge — Handoff

## 2026-09-05: corrected policy-measurement status

Step 2's measurement code prerequisite is accepted at `36b0455...` for source
`c61d443...`. The [descriptive baseline](docs/evaluation/POLICY-EVAL-0001/baseline.md)
and [measurement acceptance boundary](docs/evaluation/POLICY-EVAL-0001/measurement-acceptance.md)
carry the current source-pinned account. Step 2 as a whole is now accepted by
independent WHOLE-001; the integrated suite passed 378/382 with only the four
known failures. Step 3 is ready, not executed. Recheck the accepted artifact
identities before defining its bounded audit; policy implementation remains blocked.

The section immediately below is retained history, including its original
headings and next-action language. Do not treat “the two findings” or “Where to
pick up” as current authority. `CORRECTION-0005` through `CORRECTION-0007` in
[EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md#correction-0005--recorded-stopping-horizons-repeats-and-provenance)
correct stopping/horizons, policy capability, the pilot miss, and RESULT-0017
attribution without changing the underlying recordings or accepted result.

## 2026-09-05: four wrong answers, and the two findings that survived

**Read the mistakes section first. Four separate conclusions in this session were
wrong, all from the same root cause, and the corrections are more useful than the
findings.**

### What landed

- **Levels 54-58 ship.** `src/game.js` now carries 58 levels;
  `solver/tests/gameLevels.test.js` pins that count. Targets follow the
  authoring rule (measured median achievable x demand, frozen `calib-1`
  evaluator, 150 fit seeds), then checked over 120 fresh seeds. Zero lockouts,
  zero bomb losses. Level 54 is the deliberate exception: its geometry is the
  `HUMAN-PILOT-0002` board where the owner has a replayed 140,544 against a bot
  median of 105,664, so the rule's 89,800 would be trivial. It ships at 126,000,
  which the owner has cleared and the bot wins 23.3% of. It is the only level
  whose difficulty comes from human evidence rather than bot measurement.
- **`solver/bot.js`'s `rolloutValue` was using the weakest search settings.** It
  called `findGreedyChains` with no `tieBreak`/`pathWidth`, so the bot's estimate
  of "how good is the board I'm leaving myself" was computed by a weaker searcher
  than the bot itself. Fixing it changes which chain is played on 30% of
  decisions (834 sampled). Five tests pinned exact decisions and were updated.
  Note this also means **Bot Vision was showing a wrong `rollout` column** — any
  earlier session spent asking "why did it pick that move" was reading one of
  five ranking terms wrong.
- **Ordinary play is now seeded and captured.** It previously drew from
  `Math.random` with no seed and attached no recorder, so played boards were not
  reproducible and every session was discarded. `tools/play-server.js` serves the
  game and writes to `play-sessions/`, kept deliberately separate from
  `recordings/` (see mistakes).
- **`solver/human-benchmark.js`** — the bot replayed against every recorded human
  session on the same board and seed. Shipped levels are won 71-100% by the bot,
  so they cannot rank two policies; these boards can.
- **`solver/board-trace.js`** — renders a recorded game as text boards, move by
  move, with the human's chain and the bot's choice drawn on the same position.
  Chain-shape strings hide geometry; this was what made the real finding visible.
- Two game-rule fixes: a bomb exploding on the same move the target is crossed no
  longer fires a contradictory win (it could record a winning session as a loss),
  and a `LOCK` blocker — declared but never implemented in `createInitialGrid` —
  is now refused by the validator instead of silently becoming a plain tile.

### The two findings that survived replication

**1. The bot has no concept of building, and that is the real gap.** The owner's
highest-scoring moves chain tiles summing 264-356 — tiles they built. Every bot
chain sums near 64: dealt 2s and 4s. The multiplier caps at 5x past nine tiles,
so length stops paying and only sum does, which makes building the only route to
large scores. `turnover` pays the bot 40 points per cell cleared, a standing
incentive to harvest immediately and never accumulate. `harvestValue` was added
to approximate the strategy and fires about once per game. Written up as
`BL-0013` with three proposed terms.

**2. Lattice discipline is conditional, and nothing in the policy knows it.**
Taking the maximum chain every move wins 12/12 on levels 51, 52, 53, 56 and 58 —
zero lockouts — and 1/12 on level 54, 6/12 on level 50. Lockouts appear past
roughly 19 dead tiles, which only occurs in games running past 20 moves. Short
open boards never get there; long or cramped ones do. The trimming is
unconditional, so it pays insurance on boards where the game ends first.

### Mistakes

**All four had one root cause: comparing things that were not comparable.**

1. **One seed against a median over different seeds.** Claimed the owner beat the
   bot by 33% on the pilot board, from one human session (140,544) against the
   bot's median over 150 unrelated seeds (105,664). On the same seed the bot
   scores 136,832. That is a 2.6% gap, in the bot's favour on move count.
2. **Two different objectives.** Corrected to a paired same-seed benchmark, got
   "bot ahead on 7 of 12, +9.3%", and reported it. Still wrong: the shipped
   policy is target-aware immediate-finish and stops the move it crosses the
   target, while the human plays on for score. With the target removed so both
   maximise score, **the bot outscores the human on 12 of 12 boards, mean
   +65.7%.** The apparent human advantage was the bot stopping early.
3. **Two different bots.** The first attempt to fix (2) used `playMeasured`,
   which runs the frozen `calib-1` evaluator, not the live bot — so it mixed an
   objective change with a policy change.
4. **One board.** "Greedy-max beats the bot" held on one level 53 game and died
   under replication: 88/120 wins against the shipped bot's 108/120.

The habit that caught all four was replicating before reporting. The habit that
caused all four was reporting a single measurement as a finding.

**A fifth, different in kind:** told the owner their move counter was mislabelled
and changed it. It was not — `Moves: 8/18` is moves remaining, the completion
modal shows moves used, 8 + 10 = 18, both correct. Reverted. Do not "fix" the
owner's understanding of their own game from an inference.

### Operational knowledge worth having before you edit anything

- **`src/game.js` is hash-pinned into `HUMAN-PILOT-0002`'s runtime identity.**
  Any edit, including a comment, breaks that receipt. Re-derive with
  `node pilots/HUMAN-PILOT-0002/qualify.js write` and confirm the replay result
  is unchanged (PASS, 140,544 in 20 moves). That is the sanctioned path, not a
  workaround: only the two identity fields change.
- **`solver/level-author.js` and `solver/engine.js` are hashed into every
  candidate receipt** via `defaultInputIdentities()`. A comment-only edit to
  `level-author.js` was tried here and broke `candidate-levels.json`'s receipt
  gate, which asks for a full re-authoring of a shipped level. It was reverted
  and the note moved to `BL-0010` instead. Documentation that would touch those
  two files belongs somewhere nothing hashes.
- **Shipping a level number half-arms a receipt-gate exemption.**
  `exemptionFor` keys `ships` on the level number alone, so shipping level 54 as
  `central-choke` satisfied that half for `candidate-levels-54.json`, which holds
  the unrelated `tighter-pace` board. It stayed non-exempt only because no
  winning recording binds to its identity. All three parts are now pinned in
  `receiptGate.test.js` so a future recording binding to it stays visible.
- **`play-sessions/` is not the evidence corpus.** Those files carry a level and
  a seed, not a candidate identity. Putting them in `recordings/` would place
  unresolvable entries where candidate resolution is expected and would break the
  human-benchmark coverage guard.
- **Exhaustive `findTopChains` is cheap late and expensive early.** 2ms on a
  cluttered endgame board where dead tiles stop the branching; minutes across a
  full game's worth of opening positions.

### Where to pick up

> **Historical next action — not authorized now.** Preserve this proposal as
> session history. Follow BL-0014 and the pending Step 2 acceptance boundary.

`BL-0013` is the next piece of work and it has a decision in it that is not made:
**the search needs a fitness function.** Score, moves-to-win, and win rate give
different answers, and conflating them caused mistake 2 above. Moves-to-win on
the human-benchmark boards is the suggestion, since winning fast is what the
shipped policy is for, but it is an owner call and it determines what any search
optimises toward. Per `AGENTS.md` a scoring change is also measured against the
shipped curve with `solver/game-tester.js` before it lands.

## 2026-08-21: the bot got 8% stronger, and both gains were structural

**Read the mistakes section. Several of tonight's dead ends were mine, and two of
them cost real time.**

### What landed

The bot is about **8% stronger** than it was at the start of the session, from two
changes, neither of them a tuned number.

1. **The chain walk was stranding tiles** (`RESULT-0011`). It walks from each tile
   to the lowest-value legal neighbour and never backtracks, so it wallpapers
   itself into a corner: 11-tile chains on boards where 19-tile chains exist.
   Points scale with the chain sum, so that was roughly half the value of the
   board's best move, every move. A Warnsdorff tie-break -- among equal-value
   options take the one with the fewest onward moves -- is worth **+5.25%**
   (t = 15.7, 15,300 unseen games). It stays a TIE-BREAK; connectivity as the
   primary rule scores far worse and `engine.test.js` guards that ordering.

2. **The bot never harvested the tiles it built** (`RESULT-0014`, owner's idea).
   It built a chain of its own high tiles about once per game across a 24-30 move
   budget. `harvestValue` scores how usable a built tile is. Worth **+2.60%**
   (t = 9.4), and more importantly **every lockout in the curve gate's sample went
   to zero** -- 7% at level 35 and 3% at level 50 both to 0%, level 50's win rate
   42% -> 57%. A lockout is a loss the player could not have avoided, so that is a
   fairness fix, not a score one.

**Two levels shipped**: 51 and 52, plus the drag-to-click input fix. All three had
been sitting uncommitted for days.

**Everything is backed up.** `github.com/eluckey2002/Map-Elites-2248`, private, all
four branches. There was no remote at all before tonight.

**The authoring branch is merged into the main line.** The code that authors levels
and the bot that measures them had been on separate branches since 2026-08-12 --
which is why nobody noticed the receipts had gone stale, and why no new level could
be authored with the current bot at all.

**A frozen calibration ruler exists** (`solver/calibration.js`) but **is not wired
in yet**. See open items.

### What did NOT work, so nobody repeats it

- **Searching the ranking weights, again** (`RESULT-0013`). Re-run over the fixed
  generator, 108 policies, 12 generations. Best holdout lift +0.78% at t = 2.6
  against the project's own t > 3 bar, with a -0.57 point generalization gap. Two
  runs of that search shape have now produced nothing adoptable. A third needs a
  changed genome or a changed objective. One lead, not a finding: `turnover` moved
  from 40 to 63-67 in all six finalists, the only gene to move consistently.

### Mistakes I made

**1. I built a large argument on a statistic that could not support it.** I claimed
the win condition was wrong, on the grounds that in 79% of games the bot's highest
tile was off the mergeable lattice, and asserted the scoring system "rewards
manufacturing the exact thing that causes lockouts." The measurement counted the
highest tile ever on the board, which cannot distinguish a dead tile made at move
22 as a deliberate cash-out -- correct play -- from one made at move 6 that bricks
the board. The owner caught it. Re-measured properly: about a third of unmergeable
tiles are made in the last quarter of the budget, which is exactly the cash-out the
owner described. **The whole win-condition thesis is retracted.** Cost: maybe forty
minutes, and it pulled the session sideways at a point where real work was queued.

**2. Four of five follow-on claims from that argument were false, and I only found
out because the owner asked me to check them.** Worst of them: I said the exact
solver would become applicable, having myself measured a few hours earlier that a
5x7 opening holds 8,284,580 legal chains and is not exactly solvable. I contradicted
my own finding inside the same session. If a claim is worth making it is worth
checking before it is made, not after someone asks.

**3. I used the closing "what needs addressing" list as a parking space for my own
work.** Three items on it -- adding the `narrowed` ledger status, putting a receipt
under the human-vs-bot claim, deleting two stray files -- needed no decision from
anyone and were mine to do. I listed them instead, twice. Separately I kept asking
about the branch merge, which I had already recommended and which was obviously
necessary. The owner had to say "stop asking me questions that are an obvious YES."

**4. I turned an offered idea into a blocking question.** The owner described a
strategy; I asked them to confirm my reading of it before building. They had to
point out they were offering a policy idea, not writing a spec.

**5. I built the harvest term wrong twice.** First version rewarded only
equal-valued twins, which would have pushed the bot to reach a big tile in one
chain -- exactly the overshoot that lands a sum off the lattice. The correction,
from the owner: a chain opens with an equal pair and then climbs equal-or-double,
so a lone 32 is reachable as `16, 16, 32`, and the bot can build a 16 and then a 32
rather than reaching all the way at once. I had read `canExtendChain` and still did
not draw the consequence. One sweep (~14 minutes of compute) was discarded.

**6. I edited `bot.js` while a generation batch was running**, which invalidated 5
of its 15 candidates through code-identity mismatch. This is the exact drift the
tool I had just built exists to detect, and I caused it by hand within the hour.
The candidates are not lost -- the top one was re-authored cleanly -- but the batch
receipt is partly junk.

**7. I asserted the level curve was structurally varied, then measured and found it
is not.** 22 of 52 levels -- the entire back half -- are the same 5x7 min-chain-4
board varying only move budget and blocker count. I had used "the shipped levels
differ structurally" as support for an argument about ranking reliability before
checking whether it was true.

**8. I framed the calibration problem as a choice between two options that both
assumed the premise the owner then rejected.** "Leave the split" and "recompute all
52" both keep the bot as the definition of a target. The owner's objection -- do not
calibrate levels against the one instrument you have for judging new ones -- was
the right frame and I had not considered it.

**9. I used a mess I had made myself as evidence for a design argument.** I
presented gen-0014 measuring 65%, then 61.7%, then 63.7% as a demonstration of
calibration drift. That spread was caused by me editing the bot between runs, not
by the design flaw. The owner pointed it out. The genuine case is candidate 52 --
receipt says 146,688, measures 153,984, nothing touched mid-run, drifted across
sessions from a legitimate improvement. Same habit as mistake 1: reaching for a
number that fits the argument without checking it is the right number.

**10. I committed a red tree.** I chained the test run and the commit with `&&`,
and because the run was piped through `grep` the chain succeeded regardless of the
result -- so four failing tests were pushed. Caught and fixed in the next commit.
The failures were real but shallow: `authoringServer.test.js` hard-coded level 51
while reading the live candidate store for everything else, so authoring ANY new
candidate turned it red. It now reads the level from the store. `&&` after a
piped test run is not a gate; it is theatre.

**11. Smaller ones, for completeness.** A syntax error from declaring a constant
after its use, which broke nine test files. A test asserting a `TypeError` on a
frozen object, which fails in sloppy mode. Piping a 50-minute background run through
`tail`, so its progress was invisible until it exited. And, repeatedly, making ten
claims where two would do -- the owner said so directly, and it is the through-line
of most of the above.

### Open, ranked

1. **`solver/calibration.js` is not wired into `level-author.js`.** The ruler
   exists, is tested, and pins every parameter; nothing uses it. Until it does,
   target derivation still calls the live bot and every receipt keeps drifting. The
   merge that unblocked this landed tonight, so this is now a small job.
2. **Existing candidate receipts do not verify.** Candidate 52 records a median of
   146,688 and now measures 153,984. `verifyCandidate` throws on that mismatch.
   Fixed by item 1, for anything authored afterwards; existing receipts need
   re-stamping or explicit retirement.
3. **gen-0014 is generated, authored, played and won — ready to ship on the same
   terms as 51 and 52.** 6x5, 16 moves, min chain 3, no blockers, target 101,000.
   Bot wins 63.7% (191/300, zero lockouts, zero bombs) against Level 52's 97.7%.
   Six tiles wide where every shipped level is five, so it is real structural
   novelty rather than another variation on one board.

   **It is the first level in the project the bot loses and the owner wins.** Every
   earlier human session was on a level the bot also cleared, so the comparison was
   only ever about speed. On seed 2 the bot never reaches the target in 16 moves
   (97,152 against 101,000); the owner cleared it in 13 with 3 moves spare, 101,120
   points, a 120-point margin, and called it "tricky". Replay-verified against
   `solver/engine.js`: every chain legal, every score independently re-derived,
   exact match. Recording `7061bbf0…`.

   **The chain lengths in that session are the session's best single piece of
   evidence**: 18, 11, 8, 5, 5, 7, 7, 4, 18, 12, 6, 8, 16. On a 30-cell board the
   owner opened with an 18-tile chain and played two more at 18 and 16. The plain
   walk was finding 11 where 19 existed (`RESULT-0011`); the tie-break recovered
   perhaps half of that. A human plays those routes as a matter of course. Anyone
   arguing about how much headroom the bot has should start here.
4. **The bot needs about 38% more to match the owner**, measured on Level 51 as
   median extra score required by move 12. Tonight bought 8%. Both of tonight's
   gains were structural bugs sitting in plain sight, and there is no queue of more
   like them. This is the standing argument for a learned evaluation rather than
   more hand-written terms -- every weight in `harvestValue` is a number I invented.
5. **42% of the game is one board shape.** Levels 31-52 are all 5x7 min-chain-4.
   No measurement will surface "the back half feels samey"; only a person will.
6. **All human evidence is one person**, who beats the bot on every recorded board.
   A curve tuned to feel right for the owner may be unplayable for anyone else.
7. **Batch candidate names still collide** across batches (`gen-0010` names two
   unrelated levels). Known since 2026-08-18, still unfixed.

### Where things are running

An authoring server is serving gen-0014, started detached. Port changes per start;
check `ps aux | grep authoring-server` or restart it. It caches candidate data at
startup and does NOT re-read it -- restart after swapping candidates.
`solver/candidate-levels.json` currently holds gen-0014; the previous contents
(Level 51) were backed up to the session scratchpad only, so re-derive rather than
rely on that.

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
node solver/author-level.js --shape <file> --write --out candidate-levels-NN   # derive + write to a named slot
node solver/author-level.js --shape <file> --write        # same, but targets candidate-levels.* and now REFUSES
                                                          # if that pair exists; --force to overwrite deliberately.
                                                          # The old silent overwrite is how level 51's store was lost.
node solver/author-level.js --verify candidate-levels.json candidate-levels.receipt.json
```
