---
result: RESULT-0044
status: registered
registered: 2026-09-22T15:16:01.863Z
supersedes: null
reportable: confirmation
version_freeze:
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  solver/policy-eval.js: 2250754e430a2f1a
  src/game.js: 3d405595707621ce
---

# Pre-registration — two fresh owner-versus-oracle boards (corrected identity, blocked)

**Registered:** 2026-09-22, this identity only. See "Provenance and why this
record cannot be completed autonomously" below — the underlying comparison
this ID was reserved for already happened, on 2026-09-16, before either board
was rendered, played, searched, or scored, but under the wrong result ID.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

## Provenance and why this record cannot be completed autonomously

This ID was reserved on this branch (`experiment/harvest-policy-corpus`) to
carry forward a two-board owner-versus-oracle comparison originally registered
2026-09-16 as `RESULT-0040`, which collided with an unrelated `RESULT-0040` on
`main`. Unlike `RESULT-0047` (the corrected identity for this branch's other
colliding record, `RESULT-0041`, a pure computational search with no human
step), this experiment's design requires the repository owner to actually play
two boards before the oracle runs: "The owner plays first, once per board; the
oracle is withheld until both terminal captures exist."

An agent cannot supply that step without fabricating human-play evidence,
which this project's own experiment discipline exists specifically to prevent
(`experiments/README.md`: "a protocol committed after its evidence is not a
preregistration; it is a reconstruction"). The original 2026-09-16 run's real
data still exists (preserved before this record was written; owner won Board 1
in 10 moves, oracle in 11; owner and oracle tied Board 2 at 14 moves — see the
original `report.md`'s C1–C4 for the full accounting, including that its own
executable closure was independently defective and left the registered
`FALSIFIED` reduction `UNVERIFIED`). That data cannot honestly be presented as
having been produced under a registration dated today, and this record's
`registered:` timestamp above cannot be backdated to 2026-09-16 without
misrepresenting when this specific file was actually committed.

## Two ways to close this, owner's choice — not decided here

1. **Fresh run under this identity.** The owner plays two new boards (new
   level/seed pair, since the original seeds are already known and reserved
   in `experiments/SEEDS.md`), the oracle runs withheld until both captures
   exist, and this record closes on that fresh comparison — same design as
   the original, honestly dated today.
2. **Record the original event as an observation, not a confirmation.** Per
   `experiments/README.md`, "you can record anything you notice, cheaply,
   forever" as a `direct_source` observation, which carries no preregistration
   timing requirement. The original 2026-09-16 event, hashes, and partial
   `FALSIFIED` reduction could be entered into `EVIDENCE_LEDGER.md` under its
   true original date and commit references, explicitly as an observation of
   what already happened rather than a registered confirmation — closing this
   `RESULT-0044` record as `dropped` (superseded by that observational entry)
   rather than completed.

This record is left `status: registered`, incomplete, pending that choice.

## Design as originally specified (unchanged, for reference)

Board 1: shipped Level 56, seed 41,000,000. Board 2: shipped Level 58, seed
41,000,001. On both, does the 30-second oracle win and use no more moves than
the owner's first completed attempt when that attempt wins?

- `SUPPORTED`: oracle wins both, never slower than a human win.
- `FALSIFIED`: oracle is slower than any human win, loses where the human
  wins, or fails to win a board the human loses.
- `INCONCLUSIVE`: missing, contaminated, invalid, or unreplayable evidence.

No aggregate uncertainty interval is meaningful for two fixed cases; no
population inference is made.
