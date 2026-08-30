# Contract Attack 01

## Cold read-list

- `INTENT_BRIEF.md`
- `CONTRACT.md` as drafted before this attack

The critic read no source code, other repository files, chat history, or prior attack output and edited nothing.

## Governing question

How could an artifact pass every check here and still not be what the owner wants?

## Findings and disposition

1. **Live-bot algorithm drift remained possible.** Accepted. C1–C3 now require a versioned evaluator implementation with no import path to the live bot, plus live-bot implementation fault injection.
2. **Builder-controlled tests could be vacuous.** Accepted. Builder tests now support regression only; cold source, behavior-fault, independent replay, and clean-checkout checks decide C1–C5.
3. **Author and verifier could agree on the same wrong result.** Accepted. C4 now requires an independent 450-game replay that imports neither authoring module.
4. **`calib-1` could be silently retuned.** Accepted. C1 freezes its exact version and parameter JSON; C3 checks its independently recomputed identity.
5. **The test-only `play` seam could bypass production.** Accepted. C5 requires a complete non-test call-site inspection and forbids any production override surface.
6. **Fault injection could fail for the wrong reason.** Accepted. C2 specifies the exact live-bot fault, exact module-path negative control, and required failure text.
7. **Untracked or environment-dependent inputs could evade checks.** Accepted. C7 requires all checks in a clean detached worktree of one local commit, clean before and after.
8. **Ledger verification was circular.** Accepted. C8 now separates a hash-bound pre-ledger check from the immutable final verdict.

## Result

All eight escape routes were accepted and tightened before freeze. No builder rebuttal is pending.
