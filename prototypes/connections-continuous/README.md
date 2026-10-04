# Connection Run

Owner direction, 2026-10-02: retain this single mode. The owner calls it
"really strong" and says there is no need to force three archetypes (PDL-026
in the [playtest ledger](../PLAYTEST-DECISION-LEDGER.md)). No second Connections
variant or third-family prototype is required. Existing mechanics and aid
feedback remain unchanged; this is not release approval or formal task acceptance.

Later sustained-play feedback (PDL-027): non-power results can become stranded
as the board evolves. A frozen 41-move local save has three values with no
current complete-chain participation. Every third bank card favors non-power
targets, but that is a preference, not a hard guarantee; ordinary moves also
create non-power results. Refills are power-only. Compatible values can be
built separately, but there is no dedicated in-board recycling mechanism.
Skip preserves the material; New board resets it. Retain the mode, with this
lifecycle concern unresolved before sustained-play close-out. No rules changed.

The owner subsequently selected a separate earned-removal trial, ready at
http://127.0.0.1:8285. See [Connection Run + Power-up](../connections-powerup/README.md)
and PDL-028. This original mode and its existing captures remain unchanged;
the new trial does not establish sustained-board health yet.

Current playtest: **http://127.0.0.1:8281** (optional combinations aid).
See the [workbench](../../docs/game-design/levels/archetype-workbench.md) for
current status, the archive of earlier instances, and preservation instructions.

Latest combinations-aid UI: http://127.0.0.1:8281. Start with
`CONNECTION_PORT=8281 node prototypes/connections-continuous/serve.js`.
The optional **Show combinations** button displays up to six arithmetic examples
with different tile counts, using power-of-two values. Each sequence starts with
two equal values and continues equal/double to the exact target. These are not
all possible compositions, do not use the board or saved solution witness, and
do not guarantee a path between the markers. Some values may need to be built.
The panel starts closed, remains open during selection/preview/setup moves, and
closes when the objective changes. Showing examples changes no game/capture state.
Both previous continuous pages on 8279/8280 remain untouched.

Historical arithmetic-aid instance: http://127.0.0.1:8280. The original 8279
server remains untouched. These processes retain assets loaded at startup;
restarting today's source on either port would serve today's combinations UI,
not recreate the historical UI. Do not restart an active play to test this.
Use `?session=<saved-session-uuid>` to continue a captured run. It is replayed
under the same rules into a new capture, leaving its source record unchanged.

If the current server is stopped, run from the repository root:
`CONNECTION_PORT=8281 node prototypes/connections-continuous/serve.js`.
Do not launch another instance when 8281 is already occupied. No servers were
retired by the consolidation pass; earlier ports are comparison history.

## Question

The original exploration question below remains useful for future refinement,
not a condition requiring more prototypes before retaining the current mode.

Across a longer run, when do exact-value connection objectives add interesting
preparation to ordinary build-and-harvest play, and when are they obvious,
frustrating, or irrelevant? This is a throwaway playtest, not an experiment or
a production rule adoption. Owner feedback is recorded in PDL-014 through
PDL-017; general difficulty and the aid's tradeoff remain unmeasured.

## Play contract

- One active objective: start and finish a normally legal chain on two marked
  board positions, in either order, and create the exact stated tile value.
- Markers stay in those positions. The tiles beneath them may be used, merged,
  replaced, or moved by gravity. No tiles are protected.
- All normal legal moves remain legal. A nonmatching move leaves the active
  objective unchanged, even if it makes that objective harder or unreachable.
- Success records the objective, then issues the next on the resulting board.
  It does not reset the board, gravity, refill cursor, or cumulative move count.
- Initial and refill values are uniformly drawn from 2, 4, 8, 16, 32, 64, 128.
  Existing games keep their previous refill distribution.
- The chain sum is always visible. Preview does not commit or advance a goal.
- The target card shows successive whole-number halves (352 → 176 → 88 → 44
  → 22 → 11). This is arithmetic reference, not a required or legal chain.
  The live sum also shows how much remains, the amount over target, or an
  exact-sum reminder to check endpoints. These aids do not reveal a route.
- Skip explicitly records an unfinished goal and selects another on the same
  board. New board is explicit, records the unfinished goal as skipped, and
  preserves cumulative completions and moves. No automatic rescue or restart.
- Undo restores the preceding move, skip, or new-board state. Restart entire
  run starts a new capture. In the updated UI the URL carries its session ID;
  reload replays its last successfully saved actions into a new capture.
  The original 8279 UI still starts fresh on reload. Unsaved selections are
  not captured. A missing/incompatible save shows a warning and a fresh board.

Fixed positions are an announced prototype interpretation of the owner's
unrestricted-play requirement, not a separately accepted moving-marker rule.
The prior three-objective prototype remains available for comparison.

## Objective bank

The 24-entry rotating bank contains recurring preferences for direct routes
versus one-setup constructions, endpoint span, and power-of-two versus other
exact sums. Entries adapt to the current board; these are not 24 unique authored
levels. After entry 24, it wraps and generates another challenge on the new
position. There is no completion screen or move cap.

Every issued card has a checked construction witness at issuance, with endpoints
at least two king-move steps apart. Preparation candidates use existing material
and the setup survivor, not newly spawned tiles. A bounded exact-value search
excludes immediately completable preparation candidates; exhausted searches are
treated conservatively, not as proof of absence. Search bounds and fallback
preferences are in `model.js`. A bank entry may fall back to another route type
or shorter span when the preferred kind is unavailable. If no spaced candidate
exists, normal play continues without a card until another can be issued.

These witnesses do not establish optimal routes, perceived difficulty, sustained
solvability after arbitrary play, or a model of human behavior. Goals are never
silently replaced after issuance. Manual skip is deliberately available.

## Play capture

The UI records moves, skips, new boards, undo, and per-challenge ratings/notes.
After completing a challenge, the rating selector stays on that just-completed
challenge. You can select the active or a recent challenge. Ratings are optional.
The raw action history preserves feedback even if undo rolls back the state
snapshot in which it was submitted. The server replays each saved action list
authoritatively into ignored `sessions/<uuid>.json`. Download provides a manual
copy if saving fails. Capture is bounded to 2,000 actions and 512 KB per request;
the game has no move limit, but start a new run before exhausting capture limits.

## Checks and limits

32 scoped tests pass across this mode and the existing trio/Pair Drop suites.
New checks execute actual model/UI/server files and cover normal-engine parity,
wrong target and wrong endpoint negatives, 32 consecutive witnessed completions
across the bank boundary, preview, undo, skip, new boards, feedback, served-browser
rule parity, and real HTTP capture through 26 completions. Malformed moves and
mismatched identities are rejected without overwriting a valid capture.
The 32-completion model and 26-completion HTTP tests allow New board when no
objective is available; they do not assert sustained health of a single board
or absence of stranded residue. PDL-027 records this later coverage boundary.
Arithmetic checks cover 352's actual displayed halves, remaining and over-target
amounts, preview, clear, and unrestricted over-target merging. Continuation checks
cover board/objective/feedback preservation, old and new undo history, and a
visible rejection of incompatible saves. The owner's saved move-nine 352
challenge was also replayed exactly and served read-only on 8280.
The combinations feature was tested red before implementation: the real page
lacked its button and the numerical helper was absent. Passing checks now cover
the accepted six- and seven-tile 352 examples, exact sums, actual equal/double
value rules, tile budgets, reveal/hide, objective-change reset, unchanged game
actions, and delivery of the helper in the real HTTP app bundle. Latest owner
capture `7233ae51-c8ec-4877-90a5-cedde993f6cf` replays exactly on 8281 at move 21,
challenge four, target 32. Syntax and whitespace checks pass. No root package
manifest exists for a configured lint/typecheck command.

UI checks use a DOM stand-in, not a visual browser. Browser access was not
approved, so layout and native pointer/touch behavior remain unverified.
The live server and all assets respond; the five earlier server identities
are unchanged. QA captures live in temporary directories, not owner sessions.

Operational task: CONNECTIONS-CONTINUOUS-1; reviewer: owner. No shipped engine,
solver policy, or reportable experiment record changed.
Combinations task: CONNECTIONS-COMBINATIONS-1; reviewer: owner. Inline reuse,
quality, efficiency and correctness checks found no remaining scoped issues.
Code review: skipped (ce-code-review unavailable) — its report-only scope excludes
these untracked prototype files; no completed dedicated review receipt is claimed.
The prototype remains uncommitted and unpublished pending owner play.
