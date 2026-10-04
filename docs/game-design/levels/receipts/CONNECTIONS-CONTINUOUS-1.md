# CONNECTIONS-CONTINUOUS-1

Prepared 2026-10-01 by codex; reviewer: owner. Submitted, not accepted.

Separate Connection Run is live at http://127.0.0.1:8279. Identity:
`5bf20e44309a717cb1ebb8d3175883b67a729cca721ca6d1c4cd3767cff03cf4`.

One exact-value fixed-position objective observes normal legal play. Nonmatching
moves leave it unchanged. Success advances the rotating 24-entry board-adapted
bank on the resulting board. Uniform 2–128 spawns, live sum, preview, undo,
explicit skip/new-board, feedback and replay capture are implemented.

25 scoped tests pass using actual model, UI script, and HTTP server files:
`node --test prototypes/connections-continuous/model.test.js prototypes/connections-continuous/app.test.js prototypes/connections-continuous/serve.test.js prototypes/archetype-trio/app.test.js prototypes/archetype-trio/model.test.js prototypes/archetype-trio/serve.test.js prototypes/delivery-pair-drop/model.test.js prototypes/delivery-pair-drop/serve.test.js`.

Checks include normal-engine parity, exact-target and endpoint negative cases,
32 witnessed completions across the bank boundary, action replay, DOM-stand-in
interaction, browser-served rule parity and authoritative HTTP capture through
26 completions. Invalid input rejects rather than overwrites a valid record.
QA captures are temporary and explicitly labeled, not owner sessions.

Live HTTP assets respond on 8279. Prior server identities on 8274–8278 are
unchanged. No existing game was restarted. Browser access was not approved;
no retry was made. Visual/native-input QA remains unverified.

README, CURRENT, and PDL-014 retain the rule contract, owner feedback, bounded
bank construction, skip/new-board semantics, capture limit, and pending play
checkpoint. No shipped rules, solver policy, or experiment evidence changed.
No enjoyment, difficulty, optimality, or broad solvability claim is made.
