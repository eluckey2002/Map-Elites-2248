# Project evidence instructions

## Required order for policy improvement

The owner requires the sequence in [the policy improvement plan](docs/plans/2026-09-05-policy-improvement-sequence.md), R1-R6, recorded by `DECISION-0006`.
Consult [BL-0014](docs/backlog/BL-0014-policy-improvement-sequence.md) for the current step and accepted predecessor evidence.
The order is: define the evaluation contract; correct measurement premises and the benchmark; investigate the bot's own trajectories; then select and validate the supported change.
Do not start a later step before its predecessor's completion evidence is accepted, or reorder the steps without an explicit owner amendment recorded with the action.
This requirement controls over older next-action suggestions, including BL-0013's instruction to implement three terms.
The known factual corrections belong to Step 2; recording this sequence does not execute them or upgrade any existing claim.

## Before you edit anything

Each line here is a fact you can check in a minute. Check it rather than trust it — if one is wrong, fix the line.

- **The Step 2 code prerequisite is accepted, but Step 2 as a whole is not.**
  The repaired source `c61d443...` passed independent
  [VERIFY-002](.orch/tickets/2026-09-05-policy-measurement-extra-repair/VERIFY-002.md)
  and was admitted at `36b0455...`. Its recorded full suite is 378/382 with
  the same four known failures: two stale candidate receipts, generated-view
  staleness, and date drift. Do not clear them by re-authoring, archiving, or
  exempting. The [baseline](docs/evaluation/POLICY-EVAL-0001/baseline.md) and
  [acceptance boundary](docs/evaluation/POLICY-EVAL-0001/measurement-acceptance.md)
  still require final document/whole checks before Step 2 can close.
- **`src/game.js` is hashed into `HUMAN-PILOT-0002`'s runtime identity.** Any edit, including a comment, breaks that receipt. Re-derive with `node pilots/HUMAN-PILOT-0002/qualify.js write` and confirm the replay still reads PASS, 140,544 points in 20 moves — only the two identity fields should change.
- **`solver/engine.js` and `solver/level-author.js` are hashed into every candidate receipt** via `defaultInputIdentities()` in `level-author.js`. A comment-only edit to either fails `candidate-levels.json`'s receipt gate, which then asks for a full re-authoring of a shipped level. Documentation that would touch them belongs somewhere nothing hashes.
- **Historical benchmark premise, corrected:** all 14 winning human recordings
  stop on first target crossing. The old +65.7% bot-score statement gave the
  bot extra moves in 11 of 12 receipt-bound comparisons. Use the original
  target game for reliability/speed and the separately labeled matched-horizon
  diagnostic for score; see `CORRECTION-0005` and the fixed baseline.
- **Historical RESULT-0017 attribution, corrected:** the cited representative
  is +3.30% on screen and -3.5723% on disjoint score holdout. The archive used
  full-budget geometric score lift. The -0.64% / t=-0.73 origin is unresolved,
  so win-rate saturation does not explain RESULT-0017; see `CORRECTION-0007`.
- **Never compare one seed against a median over other seeds.** That measures the seed. Pair on identical seeds instead.
- **`node solver/board-trace.js`** renders a recorded game as text boards with both players' chains drawn on the same position. Chain-value strings hide where the tiles are, which is the thing this game is about.
- **`play-sessions/` is not the evidence corpus.** `tools/play-server.js` captures ordinary play there, bound to a level and a seed. `recordings/` holds receipted candidate evidence bound to a candidate identity; mixing them puts unresolvable entries where candidate resolution is expected.

Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) before substantive reasoning about game rules, solver results, score feasibility, or experiment status. Use the ledger for current project status and follow its citations to primary repository evidence for factual support.

After the ledger, read [CURRENT.md](CURRENT.md) for the active milestone and its linked backlog records. Treat chat as management intake, backlog files as durable intent, and only the ledger at its recorded standing plus cited primary artifacts as evidence. Conversation and backlog status never change proof standing.

Append source-pinned updates using the ledger's record schema. Preserve each proof class exactly: a replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question must not be promoted into another class.

Make every correction append-only. Add a correction or supersession record, update the affected record's status, and retain the prior claim and receipt.

## How to work here

Push back before building. If a request looks like the wrong idea, say "wait — is that the best idea?" and make the case, then do it anyway if the answer is yes. Silent compliance on a bad plan costs more than the argument.

Not every remark is a directive. Owner messages mix thinking-out-loud with instructions. When a remark implies a rule change, treat it as a candidate, not an order: capture it as a `proposed` backlog record and confirm before changing rules or scoring.

Change game rules systematically, never ad hoc. A rule or scoring change is measured with `solver/game-tester.js` against the shipped curve before it lands, and gets a ledger record when it does.

A captured play session is work to do, not a question to ask. When a new file appears in `play-sessions/`, analyse it and report — do not ask whether the owner wants it looked at.

## Experiments

A claim that generalizes beyond what it measured needs a protocol registered
before the run. A ledger record whose `proof_class` includes
`heuristic_observation` requires `experiments/<RESULT-ID>/protocol.md`;
`direct_source`, `exact_result`, and `owner_decision` records do not. Read
[experiments/README.md](experiments/README.md) before adding a result, and
copy `experiments/TEMPLATE.md` to start one. The gate is
`tools/verify-experiments.js`, run live by `solver/tests/experiments.test.js`.

Commit the protocol before the experiment runs. A protocol committed after its
evidence is a reconstruction, not a preregistration.

## Landing changes on `main`

`main` is protected. Every change reaches it through a pull request whose
`experiment gate` check is green; a direct push to `main` is refused by GitHub.
`tools/hooks/pre-push` is a second, narrower safeguard, not a substitute: where
it has been installed (`node tools/hooks/install.js`, once per clone) it
refuses to push a red gate to `main` before the push leaves the machine, and
it lets a green push through. Two more rules no mechanism enforces:

1. **Do not merge until the Codex review has completed.** Codex reviews every
   pull request when it opens and either leaves inline findings or reacts 👍.
   Wait for one or the other. On 2026-09-03 PR #3 was merged thirty seconds
   before its review landed; the finding was correct and `main` carried a
   mislabelled record until PR #4.
2. **The agent that opened the pull request owns it to the end.** Address every
   inline finding with a fix commit or a written rebuttal on the thread,
   resolve the thread, then merge. Do not ask Codex to push fixes into a pull
   request another agent opened: two writers on one branch is the concurrent
   writer problem again.

A red gate is fixed in the ledger or the protocol, never by editing the gate,
grandfathering the record, or `--no-verify`.
