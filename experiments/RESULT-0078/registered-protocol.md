# RESULT-0078 — mergeable bomb-defusal challenger

Registered before reportable seeds `47,000,000–47,000,019` are opened.

## Question and decision

Across the current 58 shipped levels, does a challenger that changes only a
bomb-priority choice—when a mergeable route reaches the same earliest bomb—
preserve paired target-stop safety, show non-vacuous speed benefit, and remain
within twice the champion's aggregate runtime? The outcome decides only
whether this narrow rule may enter a later promotion experiment. It cannot
modify the champion, rules, levels, targets, receipts, recordings, or authoring.

## Design and profiles

- Primary design: `ab-comparison`.
- Context: `simulation-policy`.
- Assurance: `mutation-qualification`.
- Control: current public `chooseMove` in `solver/bot.js`.
- Treatment: `chooseBombLatticeMove` in `solver/bomb-lattice-challenger.js`.

The treatment first calls the current champion. Only when the board contains a
bomb and `findTopChains` finds a route ending at the earliest-timer bomb within
the champion's `bombMax` bound whose chain sum is mergeable does it substitute
the highest-immediate-points such route. Otherwise it returns the exact
champion choice. It does not penalize general off-lattice occupancy and does
not alter the target-aware immediate-win rule.

## Subjects, pairing, and objective

Every arm uses the real engine transitions, shipped levels, the same seeded
spawn stream, lookahead stream `mulberry32(987654321 + moveIndex)`, move
budget, and target-stop terminal predicate. A cell is one `(level, seed)`
pair; both arms receive the identical cell. Execution order alternates by
`level + seed` parity. The generalization unit is the 58 currently shipped
levels under this seeded process, not human play or future levels.

The frozen panel is all Levels 1–58 × seeds `47,000,000–47,000,019`: 1,160
pairs and 2,320 games. Those reportable seeds were absent from the burned-seed
ledger and repository search at registration. Qualification may use only the
already-opened Level 58 seed `42,000,001` and synthetic fixtures.

Target cost is target-reaching move count; a loss costs move budget plus one.
The paired effect is champion cost minus challenger cost. Its estimate is the
mean of level means; its reported standard error is the larger level- and
seed-clustered standard error, with a descriptive 95% interval.

## Controls

- **C1, baseline / simulation-policy:** A/A uses `chooseMove` in both arms
  through the exact evaluator and must have equal trace identities and classify
  `INCONCLUSIVE`. Failure stops qualification.
- **C2, positive / ab-comparison:** on excluded Level 58 seed `42,000,001`,
  the challenger must differ from the champion trace. Failure stops
  qualification: the treatment has no demonstrated exposure.
- **C3, assignment integrity / ab-comparison:** missing, reordered, duplicate,
  or mismatched paired cells must be rejected. Failure before the run stops
  qualification; after it makes closure `INVALID`.
- **C4, known kill / mutation-qualification:** a present synthetic mutual-win
  cell with the challenger one move slower must classify `FALSIFIED` through
  P1. A harness error or unreachable mutation is not a kill.
- **C5, identity and restoration / mutation-qualification:** all frozen source
  hashes, the registered protocol, and the executable closeout route must
  resolve from the committed registration; a coherent source substitution or
  absent reportable corpus fails admission. Failure leaves the run
  `UNVERIFIED`.

## Predictions and outcome

- **P1 safety:** zero champion-only wins and zero mutual-win cells where the
  challenger is slower. One such cell makes P1 fail and the outcome
  `FALSIFIED`.
- **P2 signal:** positive mean target-cost reduction plus benefit on at least
  two distinct levels. Otherwise P2 fails.
- **P3 compute:** challenger/champion aggregate runtime ratio at most 2.0.
  This is bounded timing, not a compute-matched control.
- **Outcome:** `SUPPORTED` only if P1–P3 pass; `FALSIFIED` if P1 fails;
  otherwise `INCONCLUSIVE`.

The strict one-cell safety margin is deliberate and fragile: any regression
defeats support. The 20-seed panel is a fixed bounded decision panel, not a
power-derived stopping rule. Raw complete pairs are persisted before verdict;
crossing score, trace-change count, and off-lattice occupancy are diagnostic
only and cannot be promoted after the run.

## Stop rules

1. C1–C5, pre-outcome admission, and an exact disposable closeout must pass.
2. Run the frozen reportable matrix once; no retries, substitute seeds, partial
   resume, threshold change, or second reveal.
3. Missing cells, source or protocol drift, objective mismatch, or a write
   failure make closure `INVALID` or `UNVERIFIED`, without a domain outcome.
4. A closed result stops before adoption. A later promotion decision remains
   the owner's separate action.
