# CONNECTIONS-POWERUP-1 — isolated earned-removal playtest

Producer: codex. Declared reviewer: owner. Prepared 2026-10-02.
Standing: local implementation/verification receipt, not scientific evidence,
independent review, formal task acceptance or production adoption.

## Authority and intent

The owner selected large-tile milestone over score meter, then 2048-or-higher
over exactly 2048, agreed to normal gravity/refill with unchanged objective,
and said “ok proceed”. They want saved charges, suggested a cap of three,
and expect more planning and an incentive to build/score high tiles.
BL-0024 and PDL-028 retain the decision history.

Bounded scope: isolated new mode and verification. No old gameplay, shipped
engine, objective generator, spawn pool, bot study, commit or publication.
Owner's baseline is build-and-harvest (PDL-008); this mechanism adds a spend-vs-
save choice, not a new claim about their ordinary merging policy. PDL-027's
stranded-material capture motivates recovery, but is not retroactively given
charges. New default play starts on the identical ordinary board with an empty bank.

## Delivered behavior

- One charge for each merge creating at least 2048, capped at three.
- Chosen-tile removal, normal settle/refill, no score or objective satisfaction.
- Preview cannot grant/spend actual inventory; cancel is free.
- Saved charges work on a no-chain board; undo and resumed undo restore them.
- Announced defaults: start at zero, discard awards at cap, count removal as a
  move, preserve bank on Skip/New board, clear on Restart. No move limit.
- Original ordinary move paths and optional arithmetic aids remain available.
- Separate authoritative capture/replay includes `remove` actions and rejects
  unearned spends or stale rules; source captures are not overwritten on resume.

## Evidence actually run

Proof-first: seven model tests failed against a baseline-only extension
(missing empty-bank/award/removal behavior); four actual-page/script tests
failed against the copied baseline UI (missing real control); the HTTP test
failed against the baseline server's actual page before the new server was added.
These were expected red controls, not failed experiments.

Final focused command:
`node --test prototypes/connections-powerup/*.test.js prototypes/connections-continuous/*.test.js prototypes/archetype-trio/*.test.js solver/tests/engine.test.js`
Result: 88 pass, zero fail, including 15 new-mode checks. Ephemeral HTTP tests
used temporary QA directories, never owner captures. Served UMD rules agree
with Node replay, including earned charge, removal, undo and feedback. Invalid
saves and older revisions cannot overwrite the valid actual disk capture.
Client-supplied bank/final state is ignored in favor of authoritative replay.

Six changed JavaScript files pass `node --check`. SHA-256 comparison against
the pre-work inventory confirms all 91 existing runtime/protected files are
unchanged. Seven current Markdown files resolve all 162 local links; their
whitespace scan and `git diff --check` pass. The new mode's actual ignore rule
is exercised with `git check-ignore` for its local `sessions/` captures.

Actual live HTTP at 8285 returns 200 and the power-up title/control. Its served
rules create 30 tiles and zero charges. Identity:
`3bda1a81e84cc023107de1d8b3909357707d44922b481a86e7aecbd7fbfa142a`.
Original 8281 identity remains
`5bf20e44309a717cb1ebb8d3175883b67a729cca721ca6d1c4cd3767cff03cf4`.
New server exec session: 66357. Original servers were not stopped/restarted.

Full solver command: `node --test --test-reporter=spec solver/tests/*.test.js`.
Observed: 590 tests, 585 pass, four fail, one skip, exit 1. Three failures are
the documented level-52/54 receipt and Universe Map checks. The fourth is the
prototype capture inventory, independently reproduced as described below.
Do not call the full suite green or alter its assertions/receipts to clear it.

## Additional existing collector gap — diagnosis, not repair

`node --test --test-name-pattern='the collector inspects every prototype session currently on disk' solver/tests/prototypeLearning.test.js`
fails at line 94: seven collected versus 103 on disk. The collector in
`prototypes/analyze-sessions.js` only discovers `level.js`/`variants.js`
candidate families and silently skips newer `model.js` action-based families.
Its test counts every JSON below `sessions/`, including those skipped families.

Read-only exclusion of the new power-up directory still yields seven versus
103. A minimal scratch copy of one actual existing Connection Run capture plus
its actual model yields zero collected, one on disk, no unresolved entry.
Scratch: `/var/folders/bb/jgtk589s6f51m62dw2gc32300000gn/T/collector-residue-uIHMm1`.
This establishes a pre-existing protocol-discovery mismatch, not a new-mode
regression. Parsing failure and an inventory race do not explain this gap.
No collector, candidate, bot or test was changed; a repair across capture
protocols is outside this bounded power-up build. The earlier board progress
claim of only three failures was corrected append-only once the fourth was seen.

## Review and remaining boundaries

Three simplification lenses ran inline under the user's Subagent/Parallel tool
mapping. Reuse and efficiency: no change; quality: replaced a new deeply nested
status ternary with explicit branches. Isolation copies and the established
refill stream were retained deliberately. Source/spec/standards scan inspected
the actual new files and the app delta against the actual baseline.

Code review: skipped (ce-code-review unavailable) — its required independent
reviewer/finish-leaf execution is incompatible with the active user instruction
to run Subagent/Parallel work sequentially in main. The top-level attempt
terminated with `status: failed`; no completed receipt or independent approval
is claimed. No harness-native review tool is available. This manual scan is
not a substitute for that missing independent review, and shipping is not claimed.

Native rendered QA remains unavailable: no fresh browser attempt, fallback,
external Chrome or dependency installation bypassed the prior access boundary.
Desktop/mobile screenshot, console, blank-page/overlay and native input proof
remain unverified. DOM stand-ins are only script-interaction proof.

Owner play must decide whether reward arrival, reserve size and spend-vs-save
choices work over time. Route existence and one constructed no-chain rescue do
not establish sustained board health or optimal difficulty. No new archetype,
alternative earning meter, automatic cleanup or threshold tuning was added.

## Preservation

The new source plus its runtime dependencies, current navigation/decision
documents and this receipt are copied into workspace
`preservation/connections-powerup-20261002/`. Fresh extraction, manifest checking,
restored-mode tests and original-runtime hash comparison are recorded in that
checkpoint's external README after execution. Later captures are not automatic
backup. No commit, push, PR, merge, publication or acceptance was performed.
