# Handoff: from 2248 level generation to MAP-Elites on a deterministic puzzle

**Written:** 2026-08-18, at the end of the session that built the 2248 level generator.
**For:** whoever picks up the next project. You do not need to have seen the 2248 work.
**Decision taken:** stop generating 2248 levels; build a real MAP-Elites archive on a
**deterministic** puzzle game instead. Both parts of that sentence are load-bearing and the
reasoning is below.

---

## 1. What happened, in one paragraph

We built a working level generator for 2248 (a merge/chain puzzle): it samples level shapes,
screens them cheaply, runs survivors through a measurement pipeline, and shortlists the best.
It produced three batches and several levels a human played and enjoyed. Then we discovered
that essentially every ranking it produced was noise. Not a coding bug — a statistics bug, of a
kind with a name and a known fix, which we found only at the very end of the session. The
game's own randomness is the root cause, so the next project changes games rather than
patching the pipeline.

---

## 2. The pathology, with the numbers

**Name:** the winner's curse — selection bias when you rank on a noisy estimate and take the
top. Standard in evolutionary computation under noisy fitness; standard in A/B testing; we hit
the textbook version without recognising it.

**Mechanism.** Each level's "quality" was estimated by simulating games. Simulation is noisy.
Rank 400 levels by a noisy estimate and take the top 6, and you have selected mostly for *luck*
— the top of a noisy sample is a systematic overestimate. A fairly-measured level then loses to
an inflated one.

**The test that proved it** (credit: the owner proposed it; it is the right test and takes
minutes): re-evaluate every ranked item from scratch on inputs it has never seen, then compare
to the stored value that ranked it. Scattered around the diagonal means the fitness is clean.
Systematically below means you have the curse.

**What it returned on our archive of 400 boards:**

| set | stored | re-evaluated on unseen players |
|---|---|---|
| all 400 | 1.237 | 1.232 |
| top 6 | 1.475 | 1.323 (**−10.3%**) |
| top 20 | 1.422 | 1.304 |
| bottom 50 | 1.136 | **1.186** (regresses *up*) |

Unbiased in the middle, inflated at the top, deflated at the bottom — both tails, which is the
signature. Rank collapse was worse than the means: the board ranked #3 fell to **#220 of 400**.
Only 1 of the top 6 held its place.

**The single most useful number:** two independent estimates of the *same* board correlated at
**r = 0.49**. Half the variance in our headline metric was noise. We ranked 400 items and
handed a human one of them to play, on a measure barely better than a coin flip.

**A guard that looked like protection and was not.** The pipeline had a verifier that re-ran
every measurement and compared hashes. It catches tampering and proves reproducibility. It
re-runs the *same* inputs, so it can never detect overfitting. If your validation step does not
touch fresh data, it is not validation.

---

## 3. What we established after the diagnosis

**The effect was real; the instrument was blunt.** Bot win rate across boards had an observed
standard deviation of 9.4 points, against a binomial noise floor of 5.7 points at 60 games.
True between-board variation is therefore about **7.5 points** — genuine signal sitting barely
above the noise. Reliability r = 0.61, consistent with that decomposition.

**We were off by roughly 8× on sample size and never computed what it should be.** Pinning a
board's win rate to ±2 points needs about 500 games, not 60.

### The three fixes — IDENTIFIED, NOT APPLIED

**Status: none of these were run.** The diagnosis arrived near the end of the session and it
closed before any of them could be applied. Nothing was re-ranked, no sample size was resized,
and every ranking still sitting in `board-search-01.json` is the uncorrected one. The only
board with any fresh-data support at all is seed 186, which held rank 1 of 400 on unseen
players; the rest of that top 6 did not survive and should be treated as discarded.

Carry these into any project — they are domain-independent:

1. **Size samples from the noise floor, not from taste.** Compute the noise floor first
   (binomial for win rates; repeat-measurement correlation for continuous scores). Then choose
   n to resolve the effect you care about. Doing this after the fact is how we found the 8× gap.
2. **Never select on the data you ranked with.** Two stages: rank on estimate A, then re-score
   the finalists on fresh inputs and report *that* number. We had this discipline for the
   pass/fail gates and never applied it to the ranking.
3. **Re-evaluation is the diagnostic.** Whenever selection is involved, periodically re-score
   the archive on fresh inputs and plot stored against fresh. Cheap, and it turns a silent
   pathology into a visible one.

---

## 4. Why change games

The noise is not an artifact of our code. **2248 spawns new tiles at random, so every
playthrough of the same board is a different game.** That is the source of every variance
problem above, and it is intrinsic.

It is also why the published work in this space is heavy: the match-3 difficulty-prediction
result from King (Candy Crush) needed a neural network trained on human playtraces to get
within 5% of human performance, and beat Monte Carlo tree search at it. That is the scale of
machinery a stochastic merge puzzle demands. It is a research problem, not a weekend project.

**In a deterministic puzzle, the entire problem class disappears.** A level has one true
difficulty. A solver returns an exact answer. Fitness is a number, not an estimate, so there is
no winner's curse, no sample-size question, and no re-evaluation needed. MAP-Elites' "keep the
best in each cell" rule — which is *actively harmful* under noisy fitness, because best-so-far
over many draws is a maximum — becomes correct and safe.

### Recommended games, in order

1. **Rush Hour / sliding-block escape (recommended).** Tiny state space; breadth-first search
   gives the exact minimum solution length in milliseconds. Generation is trivial (place blocks,
   solve, keep solvable ones). Natural descriptors that are cheap and meaningful: number of
   pieces, board occupancy, longest piece run. Natural fitness: minimum moves to solve, or
   search-tree branching as a proxy for how much thinking is required. Exact, fast, and small
   enough to be fun to look at.
2. **Sokoban.** The canonical procedural-generation testbed with the largest literature, so
   there is plenty to read and compare against. Costs more: solving is PSPACE-hard, so you need
   solver time limits and the "unsolved" case becomes ambiguous.
3. **Nonogram / Picross.** Deterministic and uniqueness-checkable, and difficulty maps nicely
   onto *which inference rules* a solver needed. Slightly more work to define difficulty well.

Pick 1 unless there is a reason not to. The point of this project is the generator, and Rush
Hour gives exact ground truth for nearly free.

---

## 5. The direction: a real MAP-Elites archive

We never ran MAP-Elites in 2248 — the pipeline was sample, measure, rank, take top-K, with no
archive and no iteration. Build the real thing.

**What it is.** Keep a grid ("archive") indexed by *descriptors* — human-meaningful properties
of a level. Each cell keeps the best level found for that combination of descriptors. Mutate
elites, evaluate offspring, place them in their cell, keep the better one. The output is not a
single best level; it is **the whole filled map** — a catalogue of the different kinds of level
your generator can make and the best example of each.

**Why it fits this project.** The map *is* expressive range analysis, which is the standard
diagnostic we skipped all session. You get "what can my generator actually produce" as a
picture, for free, as the algorithm's normal output.

### Three traps, flagged in advance

1. **Noisy fitness breaks the elite rule.** "Keep best-so-far" over noisy evaluations enshrines
   flukes; cells lock up, coverage plateaus, and it looks exactly like a search that has
   finished. This is the pathology from §2 in its MAP-Elites form. **Choosing a deterministic
   game removes it** — that is the main reason for the game change. If any stochastic element
   creeps back in (a randomised solver, a sampled agent), re-apply §3.
2. **Descriptors correlated with fitness quietly collapse the archive into single-objective
   search.** The map looks diverse by coordinates while every cell holds essentially the same
   level. Check the correlation between each descriptor and fitness early and keep it low.
3. **Descriptors that carry no information are the mirror failure, and we hit it.** In 2248 our
   structural descriptors correlated with outcome at r = −0.05 and r = +0.01 — they passed the
   "uncorrelated with fitness" rule for the worst possible reason: they measured nothing. A good
   descriptor is uncorrelated with fitness *and* genuinely varies something a person would
   notice. Test both directions.

### Build order (do not repeat our sequence)

1. Game engine plus an **exact solver**. Verify the solver on hand-made puzzles before trusting
   any number it produces.
2. A random generator plus **expressive range analysis** — generate a few hundred, plot two
   descriptors, look at the cloud. Do this *before* building any ranking. It is cheap and it
   tells you whether there is anything to search.
3. Only then MAP-Elites: archive, mutation operator, elite rule.
4. Human play last, and as **calibration of the evaluator**, not as a per-level verdict. One
   playthrough cannot grade a level; a set of playthroughs can calibrate a solver-based
   difficulty measure.

---

## 6. Assets worth carrying over

In `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo/solver/` (uncommitted):

- `generate-levels.js` — sample / cheap-screen / full-pipeline / shortlist. The **structure** is
  reusable; the metrics are not.
- `fixed-board.js` — authoring against one fixed board, varying the *player* rather than the
  board to build a distribution. Good pattern, and the receipt/identity discipline is worth
  keeping in any domain.
- `search-boards.js` — search over boards for a fixed shape.
- `profile-shapes.js` — score-curve metrics. **Kept only as a record of a negative result**;
  nothing should rank on it.
- Tests: 123 passing, including the game-engine seeded-board tests.

### Negative results — do not re-litigate without new evidence

- **Score-curve shape (how back-loaded or spiky a game's scoring is) does not separate levels**
  when measured from bot play. The bot cashes in every move, so its curve is flat on every board
  by construction. It measured the player, not the level.
- **Minimum chain length is a lockout lever, not a difficulty lever.** Raising it killed boards
  (23 of 25 screen rejections) while the survivors stayed easy (90–95% bot win rate).
- **Blockers barely matter in 2248.** A batch with zero blockers produced harder levels than a
  batch full of them. Bombs specifically are near-free: a chain deletes every tile except its
  last, so a bomb anywhere in a chain is removed outright — three bombs were cleared by move 2
  without being aimed at.
- **The pass/fail gates are vacuous at board level.** 400 of 400 boards passed every gate. They
  only ever discriminated between level *shapes*, never between boards.
- **Structural board properties predict nothing.** Opening-move count varied 14× (156 to 2196)
  and correlated with outcome at r ≈ 0.

### One human-facing fact worth keeping

The owner beat 41 of 43 and 48 of 48 winning bot players on moves-to-target. **The bot has no
headroom above the human**, so every target it calibrates is set for a much weaker player. Any
agent-based difficulty measure needs an agent that can beat its human sometimes, or it is
measuring in a range the human does not occupy.

> **Receipt added 2026-08-20.** The two figures above were carried here as prose with nothing
> behind them, which for the most decision-relevant number in the project is not good enough.
> `solver/human-vs-bot.js` now measures it from the replay-verified recordings: on all five
> winning human sessions the owner reached the target in fewer moves than the bot on the
> identical level and seed, by 1 to 7 moves. That is measured against the *current* bot, which
> `RESULT-0011` made about 5% stronger than the one in play when those sessions were recorded,
> so it understates the margin. The conclusion above holds. The specific counts 41/43 and 48/48
> remain unreproduced and should not be quoted.

---

## 7. Reading

- Search-Based Procedural Content Generation: A Taxonomy and Survey (Togelius et al.) — the
  frame for generate-and-test with a fitness function.
- Smith & Whitehead, *Analyzing the expressive range of a level generator* (2010) — the
  diagnostic to run first; the archive in MAP-Elites is this by another name.
- *The Right Variety: Improving Expressive Range Analysis with Metric Selection* (2023) — how to
  choose descriptors, which is trap 2 and 3 above.
- Gudmundsson et al., *Human-Like Playtesting with Deep Learning* (CIG 2018) — why stochastic
  match-3 difficulty prediction is hard, and what it costs to do properly.
- Holmgård et al., procedural personas — agents with different objectives rather than one agent
  with random tie-breaking. Relevant if agent-based evaluation returns.

---

## 8. Where this actually stopped

**The solution came too late to use.** The owner supplied the diagnosis and the re-evaluation
test at the end of the session. We ran the test, confirmed the pathology, and quantified it —
and then the session closed. So this handoff carries a confirmed diagnosis and an unapplied
remedy. Do not read §3 as "we fixed it"; read it as "we know exactly what to do and nobody has
done it yet."

Two consequences for whoever picks this up:

- **Nothing in the 2248 results is corrected.** If you were ever tempted to mine
  `board-search-01.json` for good levels, don't — its ranking is the uncorrected one. Only seed
  186 has fresh-data support.
- **The fixes are untested in practice, only in principle.** The sample-size arithmetic in §3
  (about 500 games for ±2 points) is derived, not verified by a run.

On sequencing, for what it is worth: the generator, three batches, two abandoned metrics, a
fixed-board pipeline and a board search were each a reaction to the previous thing failing, and
the order was never planned. The cheap diagnostic that would have caught the whole problem —
generate a few hundred, plot the space, look at it — is step one of the standard method and was
skipped. **Read §5's build order before writing code, and run the re-evaluation test from §2
the first time anything gets ranked.** In a deterministic game that test should come back
perfectly clean; if it does not, something is stochastic that you did not know about, and that
is worth finding out on day one rather than at the end.
