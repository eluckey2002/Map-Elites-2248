# Live chain-sum repair

Producer: codex. Reviewer: owner. Scope: local archetype prototype UI.
Pre-fix HEAD: fced429. Existing dirty work: CURRENT.md, concept/approach docs,
and the entire untracked archetype-trio prototype, all from this session's work.
Process cwd inventory found only our prototype server and inspection commands
in this worktree; HEAD/reflog remained unchanged. No open PRs were returned.

## Debug Summary

Problem: the owner could not see a tile sum while drawing a chain.
Root cause: app.js `projected()` requires a complete legal chain. The selection
renderer previously showed only count/instructions for one or two tiles; for
longer chains it buried the merged value in result text below the board.
There was no dedicated sum element in index.html. A scoring error was a lower
probability alternative: the core sum already produces the correct merged tile.
This is a missing display, not a rule/scoring defect.

Fix: index.html adds a labeled live region immediately above the board;
app.js computes the sum from original selected tiles on every render, including
incomplete chains and preview; style.css keeps the readout visible while
scrolling the play area. Rules and scoring are unchanged.

Prevention: app.test.js executes the actual app.js and reads actual index.html
with a minimal DOM stand-in. All three cases failed before the change because
the page had no chain-sum output, then passed. They exercise first/second/third
tile, short-chain merge rejection, backtracking, preview, clear, merge, undo,
restart and level navigation. Existing model/capture tests did not cover UI.
This checks rendering/event wiring, not actual browser layout or native dragging.

Verification: `node --test prototypes/archetype-trio/app.test.js prototypes/archetype-trio/model.test.js prototypes/archetype-trio/serve.test.js`
passed 14/14. Syntax and whitespace checks pass. Server restarted on 8274;
HTTP serves the added markup and updated renderer. Browser visual verification
was interrupted by an external Chrome change; no user game was reset.
Confidence: high in sum/state wiring; final visual appearance awaits owner check.

## Post-Fix Quality

Scope: app.js, index.html, style.css, app.test.js; local handoff metadata only.
Simplify: skipped; the production fix is five additive lines and touches no
sensitive code. No helper or abstraction introduced.
Review: targeted manual due to existing uncommitted prototype work. Checked
that preview sums original tiles, shortening uses the current selection,
empty selections sum to zero, and the readout does not enable illegal merges.
Residuals: actual post-change browser layout/native touch not verified.
Re-verification: 14 passing checks. No game-rule, model, capture, or release
changes. Left uncommitted with the local prototype at this playtest checkpoint.
