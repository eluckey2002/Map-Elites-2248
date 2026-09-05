# Project evidence instructions

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
