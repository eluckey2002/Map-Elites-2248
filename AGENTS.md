# Project evidence instructions

## Before you edit anything

Each line here is a fact you can check in a minute. Check it rather than trust it — if one is wrong, fix the line.

- **`node --test solver/tests/*.test.js` reports 422 tests: 418 pass, three fail deliberately, and one is skipped.** The three failures are the stale candidate receipts for levels 52 and 54, and the Universe Map's generated-view check. One carries its own "THIS FAILURE IS KNOWN AND DECIDED, it is not yours to fix" message. Do not clear them by re-authoring, archiving, or exempting.
- **The Universe Map is a 2026-08-28 snapshot, and its staleness failure is true.** It still names champion `52f500c` and selects only `RESULT-0017`; `DECISION-0004` promoted `b82a9b6` and explicitly did not rewrite the map. Do not clear the failure by bumping `universe/contract.json`'s `asOf` and rebuilding: that restamps the old champion and frontier as current. Refreshing it means re-curating the contract's selected records against the ledger first.
- **`src/game.js` is hashed into `HUMAN-PILOT-0002`'s runtime identity.** Any edit, including a comment, breaks that receipt. Re-derive with `node pilots/HUMAN-PILOT-0002/qualify.js write` and confirm the replay still matches `RESULT-0028` in the ledger — only the two identity fields should change.
- **`solver/engine.js` and `solver/level-author.js` are hashed into every candidate receipt** via `defaultInputIdentities()` in `level-author.js`. A comment-only edit to either fails `candidate-levels.json`'s receipt gate, which then asks for a full re-authoring of a shipped level. Documentation that would touch them belongs somewhere nothing hashes.
- **Shipped-level win rate cannot rank two policies.** The bot wins nearly every shipped level (`RESULT-0051`), so both arms sit at the ceiling. Use `node solver/human-benchmark.js`, which pairs the bot against recorded human sessions on identical boards and seeds.
- **Recorded human play and the shipped bot already share the target-stop objective.** Both games end on the move that crosses the target. Compare reliability first and moves-to-target among mutual wins. Crossing score is only final-move overshoot. The benchmark's uncapped bot continues alone to the move budget and has no recorded human comparator; never present that arm as a human comparison.
- **Never compare one seed against a median over other seeds.** That measures the seed. Pair on identical seeds instead.
- **`node solver/board-trace.js`** renders a recorded game as text boards with both players' chains drawn on the same position. Chain-value strings hide where the tiles are, which is the thing this game is about.
- **`play-sessions/` is not the evidence corpus.** `tools/play-server.js` captures ordinary play there, bound to a level and a seed. `recordings/` holds receipted candidate evidence bound to a candidate identity; mixing them puts unresolvable entries where candidate resolution is expected.

Read [LEDGER-INDEX.md](LEDGER-INDEX.md) before substantive reasoning about game rules, solver results, score feasibility, or experiment status. It is generated from [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md), which remains the authority: before relying on or citing a record, open it in the ledger for its scope, evidence, and limits, and follow its citations to primary repository evidence. Edit only the ledger, then run `node tools/build-ledger-index.js`.

After the ledger, read [CURRENT.md](CURRENT.md) for the active milestone and its linked backlog records. Treat chat as management intake, backlog files as durable intent, and only the ledger at its recorded standing plus cited primary artifacts as evidence. Conversation and backlog status never change proof standing.

Every run under `.orch/runs/` started from 2026-09-27 ends with a line `ledger: <RECORD-ID>` or `ledger: not reportable — <reason>` in its `worklog.md` or `stop-record.md`; the experiment gate enforces it, so a finished result cannot go unrecorded.

Outside the ledger, cite a record ID instead of restating its numbers; a restated number drifts when the record is corrected.

Append source-pinned updates using the ledger's record schema. Preserve each proof class exactly: a replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question must not be promoted into another class.

Make every correction append-only. Add a correction or supersession record, update the affected record's status, and retain the prior claim and receipt.

## How to work here

Push back before building. If a request looks like the wrong idea, say "wait — is that the best idea?" and make the case, then do it anyway if the answer is yes. Silent compliance on a bad plan costs more than the argument.

Before building a gameplay prototype, read `prototypes/PLAYTEST-DECISION-LEDGER.md`. Name the owner's captured baseline strategy and the exact board state where the proposed design should make that strategy suboptimal. A bot or solver proxy such as bounded-longest play cannot substitute unless a human capture establishes it as the owner's behavior. If the intended move is already the owner's baseline move, stop: control over seeds, spawns, or tile placement is an authoring capability, not by itself a new strategic decision.

Not every remark is a directive. Owner messages mix thinking-out-loud with instructions. When a remark implies a rule change, treat it as a candidate, not an order: capture it as a `proposed` backlog record and confirm before changing rules or scoring.

Change game rules systematically, never ad hoc. A rule or scoring change is measured with `solver/game-tester.js` against the shipped curve before it lands, and gets a ledger record when it does.

A captured play session is work to do, not a question to ask. When a new file appears in `play-sessions/`, run `node solver/human-benchmark.js --recording <file>` and report the same-seed comparison; use `node solver/board-trace.js --recording <file>` when positions need inspection. Do not ask whether the owner wants it looked at.

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

## Closing a session

Before a session's work lands, in this order:

1. Every run you started ends with its `ledger:` line (see above), and any new result or correction is in `EVIDENCE_LEDGER.md`.
2. Run `node tools/build-ledger-index.js`.
3. Update [CURRENT.md](CURRENT.md) so the next session sees what changed and what is open, citing record IDs rather than restating numbers. The gate fails a change that adds a ledger record without touching `CURRENT.md`.
4. Append a dated line to the History of each backlog record you worked on.
5. Run `node tools/verify-experiments.js`; it must pass before you open the pull request.

Do not append to `HANDOFF.md`. It is a historical session journal; what it used to carry now goes in the ledger, `CURRENT.md`, and backlog history.

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
