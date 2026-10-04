# Policy terms loop: frozen exploration plan

Registered for RESULT-0080 by codex-policy-terms-20261003 on 2026-10-03.
The owner's complete goal and corrected effort sentence are in GOAL.txt.
The first new experimental game must follow the commit introducing this file.
Every byte of this plan and every harness hash below is immutable after that
first game. No closure threshold or effort bound changes during the run.

## Start and historical diagnostics

The worktree starts at cd83127f176111a0b0fb40eb14402f301a1fab07, which equals
origin/main and contains solver/ruler/ from merged PR #61. start-output.txt
prints the state and seeds; result-id-check.json scans 34 remote refs and
finds RESULT-0080 unused (maximum ID in paths or ledgers: 78). The baseline
contains the level-52 receipt, level-54 receipt and stale Universe Map
failures, and one existing skip; baseline-output.txt preserves the full run.

Item 2 uses RESULT-0049's champion/base pairs across all 58 levels; its
per-level paired variance and RESULT-0058's 12-level cross-check are in
solver/policy-lab/runs/noise.json and noise-output.txt. The permitted 58 x 10
design has historical level SE 0.06976344305089431, seed SE
0.08197671074852235, 95% half-width 0.16067435306710381, and conditional
80%-power detectable gain 0.22953479009586256 moves. The other printed
designs are information only and cannot be used. Adding seeds does not
shrink level-axis error; these are empirical subsets, and their estimates
can fluctuate. No challenger variance is asserted from champion/base data.
After the zero-effect control, print each block's 2.8 x SE and report the
larger of the historical estimate and the largest control-block estimate.

Item 3 replays all 36 recorded sessions, with zero replay failures, and
excludes 17 bomb-priority positions. At each of the remaining 502 positions
analyzeMove uses champion defaults and makeRng(987654321 + moveIndex).
Generation rank is computed by stable descending policyScore sorting, not
by immediate score. Ordered identity and points tables are retained in
generation.json and generation-output.txt, including 104 positions on
levels 56-58. N_MIN is frozen at 30. The diagnostic subset has 50 moves;
on 37 its owner chain beats every immediate-points chain in the pool.
Thus the branch is GENERATION: candidate coverage is a bottleneck on this
evidence, restricted to that subset. This does not generalize to other
moves and never asserts that ranking is the limit.

The branch rule is immutable: n < 30 means inconclusive and restricts
nothing, with ranking and lookahead first; otherwise at least half the
diagnostic moves with pool-best below owner means generation-only proposals;
otherwise coverage is not the bottleneck on this evidence, with ranking
and lookahead first. The all-sessions figure is secondary only.

These pre-plan operations are the explicitly requested historical checks,
not fresh experimental panels. Count their historical replays conservatively:
36 recorded validations + 72 benchmark bot replays + 36 generation
validations + 36 generation position replays = 180 games, from the replay
sub-budget. Unit tests are engineering checks, outside scientific game
accounting. All fresh experimental seeds are inside 60,000,000-69,999,999.

## Panels, blocks and accounting

ONE design for every gate, search, recheck and control panel: all 58
shipped levels x 10 seeds = 580 games per policy. Each block below has a
disjoint reserved range appended to experiments/SEEDS.md before use.
G is fixed; S is joint-search only; R1-R11 each serve exactly one candidate
and are then burned, including a joint-search candidate if reached. If an
additional recheck is needed, finish on Path D. C1-C12 are disjoint controls.
F is a one-shot confirmation on all 58 levels x 150 seeds = 8,700 pairs and
17,400 games, within its 20,000-game protected reserve.

A game is one policy playing one level and seed. Paired cells cost two
games, except that each block's champion reference is played once, cached
and counted once. Trace-parity reproductions are counted replay games,
not reusable additional reference panels. Reference G costs 580 proposal
games; its later candidates share it. Its position callback compares the
inert chooser against chooseMove on at least 1,000 actual positions.
Parity selects 200 cells with level=i%58+1, seed=G.start+floor(i/58),
i=0..199. Champion, base and wRoll=1.3 variant each play those cells in the
lab and in the ruler: 1,200 counted replays. The repeated champion plays
are parity replays only, separate from G's cached reference.

Controls cost 12 x 580 x 4 = 27,840 games: reference, zero-effect, mild
handicap and strong handicap, sharing the same reference in each C block.
The sub-budgets are controls 30,000, proposals 25,000, joint search 20,000,
confirmation 20,000 (reserved and unavailable to every other phase),
parity/inert/recompute replays 5,000, buffer 20,000; total 120,000.
Charge actual games, including repeated parity and recomputation replays.
A sub-budget exhaustion or the total/effort bound closes on Path D, even
if a search is unfinished. Release joint-search allowance to the buffer
only on the specified no-ACCEPTED skip path. Never spend F on exploration.

## Decision rules and controls

Import solver/ruler/core.js unchanged: summarizePairs, stageDecision, admit,
compareFitness and twoAxis own all producer statistics and win-first ordering.
PROMISING: gate net wins >= 0 and mean mutual-win moves saved > 0.
ACCEPTED: fresh recheck net wins >= 0 and lower 95% mean-moves-saved
endpoint > 0, with the ruler's conservative max(level SE, seed SE).
Record the recheck result in the proposal log; retain gate diagnostics
separately. No default threshold is changed.

5a: at least 200 identical traceIdentity cells for each champion/base/variant.
5b: at least 1,000 inert chooser positions; identical count equals total,
including the champion's bomb handling and target-aware immediate finish.
A parity or inert mismatch is a harness failure: stop and report; do not
judge ideas or repair a frozen harness and silently rerun burned seeds.
5c: zero-effect changes only the lookahead RNG base to 997654321. Apply
ACCEPTED directly on each fresh C block, with no gate/recheck. Ceiling
1 of 12; 2+ triggers Path C. Twelve blocks only catch false-accept rates
of roughly 17% or more: this is a sanity check, not calibration.
5d: play the second candidate by policyScore every 10th/every 5th move;
bomb-priority or singleton pools retain the champion. Print mean moves
lost and 95% intervals for both doses on every C block. Detection means
upper endpoint of moves saved < 0. Strong-dose detection must reach
80% of 12 blocks (at least 10); otherwise close Path C and say the
panel did not detect effects of this measured size often enough.
Complete and print all 12 disjoint blocks before judging these aggregate
bars. If either bar fails, no idea is judged.

## Terms and the bounded proposal loop

New code stays under solver/policy-lab. The injected play loop mirrors
ruler/game.js. No file under solver/ruler or any protected chooser, engine,
level, calibration or sealed result file is edited. Use all 58 source
levels from src/game.js, never ruler/config.js's abbreviated LEVELS.

At zero weights and one lookahead sample, the lab ranks the champion's
trimmed pool with the same addition order, bomb policy and target finish.
The implemented optional ranking terms (not proposed in this generation
branch) are: urgency scales forecast health by points-needed/moves-left
relative to original level demand; board-wide build potential sums value
above the maximum dealt 8 x scale, weighted by equal/half/double company
and Chebyshev distance. Lookahead can average 3 or 4 independent new-tile
sets, sample bases offset by 1,000,003; its extra compute is reported if
that branch permits testing it. The generation branch restricts those
ranking-only proposals and the lookahead change from the proposal log.

Off-lattice occupancy counts non-stone tiles failing isMergeableSum, as
strandedCellPressure and CORRECTION-0008 specify: occupancy, not permanent
damage. A price is lambda x tileScale points per additional occupied
off-lattice cell after the candidate's transition. No reuse-cost term is
added. Offer untrimmed chains only at lambda > 0; at zero, generation is
identical to the champion. At a positive price, trimmed and untrimmed
chains are offered and deduplicated with the champion key. Preserve the
champion's separate target-aware untrimmed immediate finish at every dose.
The generation-and-ranking combination is explicitly tagged generation.

15 planned one-change rounds, ordered: occupancy-price lambda
0.001, 1, 8, 128, 1,000,000; candidate widths 28, 32, 40, 48, 64; beam
path widths 10, 12, 16, 20, 24. Offer untrimmed at every positive price;
print all five gate doses side by side, including near-zero and very
large. The old unpriced offering falsification motivates pricing, not
a replay or alteration of that sealed observation.
Before each round read and print at least 3 historical owner-faster
boards from generation.json in the proposal-planning step, record one
sentence of hypothesis, and create a one-change candidate configuration
file as code. Gate, search, recheck and confirmation paths do not read
recording files. The proposal-planning reader is outside these paths.
The proposals.csv records at least 15 rows unless a named earlier closure
path or effort/sub-budget stop applies; print counts by kind/outcome.
No seed or threshold changes after the first game. At most 20 rounds.

Joint search runs only with ACCEPTED changes. Its enlarged configuration
space uses all accepted coordinates together, retaining accepted doses
and their immediate neighboring doses; deterministically rank a maximum
of 31 complete S candidates within 20,000 games including shared S
reference and a fresh recheck. Best uses compareFitness; it must clear a
remaining unused R block. Otherwise print the required skip sentence and
release the sub-budget. Select the best accepted recheck mean moves saved
(ties: fewer changes), freeze its code, then register exactly one
RESULT-0080 confirmation protocol using tools/new-experiment.js, hashing
chooser, all measurement code, thresholds and F before its first game.

## Valid closures and completion

Path A: items 1-12; one frozen candidate, one F confirmation. Primary
verdict concerns all 58 levels, using the frozen ACCEPTED criterion.
Secondary 56-58 and remaining-level results never override primary.
Persist raw pairs via tools/persist-before-verdict.js before any verdict.
Use provisional heuristic_observation with the preregistered protocol.
Path B: no ACCEPTED candidate; items 1-9 and 12 as stated in GOAL.txt;
10-11 do not apply. Say exactly "no change tested was ACCEPTED at this
resolution", without any exhaustion or impossibility claim.
Path C: a 5c/5d bar fails; items 1-4 and failing control output; no idea
judged. Path D: first exhausted sub-budget, 20 proposal rounds or 120,000
games; print raw output for met items and identify the bound.
B/C/D ledger is provisional direct_source, only what was measured.

Exploration is diagnostic and retained OUTSIDE experiments/, under
solver/policy-lab/runs. Never cite it as generalizing experiment evidence.
Every headline is arithmetically reproduced by a separate script with no
imports from producer runner, statistics or loop code. This is independent
re-implementation by the same agent, not independent verification.
checked_by remains unset; only a distinct reviewer can accept.
A coverage script reads this plan, an applicable protocol, and actual
raw artifacts: check all 58 levels x 10 seeds for every run G/S/R/control
panel, disjoint ranges within allocation, and actual input file paths
without recording reads. Unrun blocks print "not run", not FAIL. On A
only check F covers 58 x >=150 seeds and reads no recordings. A failed
assertion makes closure INVALID, requiring FAILED-RUN-LEDGER.CSV plus
implemented prevention and a negative test; no threshold may be weakened.

Follow every standing rule in GOAL.txt. Stop for an unmet item, a protected
file violation, or three failures of the same step. No sub-agents. At most
four workers. Close-out: unchanged baseline failure names and skip, no
existing test modified; experiment gate passes; index generated and
committed with a provisional ledger record; CURRENT.md updated citing
that record; History only appended for each touched backlog. Finish at
an open PR with green experiment gate and completed Codex review, findings
answered. Do not merge or adopt a policy.

## Machine-readable frozen settings

```json
{
  "result": "RESULT-0080",
  "actor": "codex-policy-terms-20261003",
  "task": "POLICY-TERMS-LOOP-20261003",
  "levels": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58
  ],
  "panelSeeds": 10,
  "workers": 4,
  "blocks": {
    "G": {
      "start": 60000000,
      "count": 10
    },
    "S": {
      "start": 60010000,
      "count": 10
    },
    "R1": {
      "start": 60020000,
      "count": 10
    },
    "R2": {
      "start": 60021000,
      "count": 10
    },
    "R3": {
      "start": 60022000,
      "count": 10
    },
    "R4": {
      "start": 60023000,
      "count": 10
    },
    "R5": {
      "start": 60024000,
      "count": 10
    },
    "R6": {
      "start": 60025000,
      "count": 10
    },
    "R7": {
      "start": 60026000,
      "count": 10
    },
    "R8": {
      "start": 60027000,
      "count": 10
    },
    "R9": {
      "start": 60028000,
      "count": 10
    },
    "R10": {
      "start": 60029000,
      "count": 10
    },
    "R11": {
      "start": 60030000,
      "count": 10
    },
    "C1": {
      "start": 60040000,
      "count": 10
    },
    "C2": {
      "start": 60041000,
      "count": 10
    },
    "C3": {
      "start": 60042000,
      "count": 10
    },
    "C4": {
      "start": 60043000,
      "count": 10
    },
    "C5": {
      "start": 60044000,
      "count": 10
    },
    "C6": {
      "start": 60045000,
      "count": 10
    },
    "C7": {
      "start": 60046000,
      "count": 10
    },
    "C8": {
      "start": 60047000,
      "count": 10
    },
    "C9": {
      "start": 60048000,
      "count": 10
    },
    "C10": {
      "start": 60049000,
      "count": 10
    },
    "C11": {
      "start": 60050000,
      "count": 10
    },
    "C12": {
      "start": 60051000,
      "count": 10
    },
    "F": {
      "start": 60100000,
      "count": 150
    }
  },
  "budgets": {
    "controls": 30000,
    "proposals": 25000,
    "jointSearch": 20000,
    "confirmation": 20000,
    "replays": 5000,
    "buffer": 20000
  },
  "maxGames": 120000,
  "maxProposalRounds": 20,
  "plannedProposalRounds": 15,
  "branch": "GENERATION",
  "N_MIN": 30,
  "historicalMde": 0.22953479009586256,
  "historicalReplayGames": 180,
  "zeroLookaheadBase": 997654321,
  "harnessFreeze": {
    "solver/policy-lab/play.js": "9ae72e532be4034a6849060e17fa0336ced60f8ba9c987f82dd9660ad8b55985",
    "solver/policy-lab/chooser.js": "3a043470c5eeeecc7c3d8e4390cfc8513596374f76e9052c4d3d97e59a92b895",
    "solver/policy-lab/pool.js": "48a2c4019407628c5b5090e60453c1923d7aa56ee04b7ef949a2d836d993a95f",
    "solver/policy-lab/worker.js": "681a40646a04950f2a9ce8893cfa1c74250b0780308047eefa12c294f3a00904",
    "solver/policy-lab/settings.js": "7678a525fc7a867ef764374cc1f038a0fb83523b1f155c074631968bf716c084",
    "solver/policy-lab/decision.js": "1db3eeee3d9752bf39ee601a1d4bb69f4d09798de203e596f6d14ec9e3107ab1",
    "solver/policy-lab/run-controls.js": "b37827fafd876e49440aef76213e0c7c2d808708afc466ebcddbdf7a7537305c",
    "solver/ruler/core.js": "fcf02b2a2cdded6b3d8cb7b2023685aadee6b313b409b8d0f26b554e348f3836",
    "solver/ruler/game.js": "c87b519c34d735d28a705f8d94a04ef7db16eb2b031bc43a4cb034e1332b7ed4",
    "solver/bot.js": "3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65",
    "solver/engine.js": "0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873",
    "src/game.js": "3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1",
    "solver/behavior-descriptors.js": "b87820b67b8ea004d3bb170edc59bb725deb2f5cfacafb2c2efc14023113df15",
    "docs/goals/policy-terms-loop/GOAL.txt": "eb1ab4968afdc6d782dc18ae5ba2f1479eecbc1d631e4159db773ece90145241"
  }
}
```
