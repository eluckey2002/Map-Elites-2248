# DELIVERY-CROSSROADS-1

Prepared 2026-10-01 by codex. Reviewer: owner. Local prototype handoff only.

## Result

Crossroads at http://127.0.0.1:8276, implemented entirely as a new isolated
prototype using unchanged shared mechanics, UI and capture infrastructure.
See `prototypes/delivery-crossroads/README.md` and `witnesses.json`.

Two equal-score, equal-sum openings leave the built 64 in different places.
The same immediate left-hand harvest is legal after only one. Both branches
have legal four-move deliveries without consuming refill tiles. This is an
exact feasibility check, not a claim about optimality or perceived difficulty.

## Executed verification

- Both authored routes replayed to won; selected-tile origin tracking passed.
- Opening score/value equality and legal/illegal continuation contrast passed.
- Actual page/shared app exercised through a DOM stand-in: both routes,
  live sum, preview, win, undo and restart passed.
- Served browser scripts replayed identically to local rules.
- Temporary, QA-labeled real HTTP capture matched replay; wrong identity rejected.
- Existing scoped suite: 19 tests passed. Node syntax and whitespace checks passed.
- Original ports 8274 and 8275 still return their previous rules identities.

Rendered browser/console/screenshot and native-touch checks remain unverified.
No isolated browser was available; the active owner browser was not touched.
No shipped files, rules, move budget, solver or experiment results changed.
No commits, pushes or PR actions taken. Frictions logged as encountered.

Owner play and enjoyment judgment remain open. Submitted is not accepted.
