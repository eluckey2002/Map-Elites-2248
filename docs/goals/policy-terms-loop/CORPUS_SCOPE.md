# Historical diagnostic scope

The owner's GOAL.txt item 3 explicitly requests: "Replay every recorded
session" and defines the diagnostic subset using owner-faster boards from
"node solver/human-benchmark.js --json". That unchanged benchmark deliberately
loads recordings/, play-sessions/ and pilot recordings. The original committed
exploration plan records this all-session diagnostic before any new game; the
owner-approved recovery plan explicitly inherits that diagnostic and branch.

AGENTS.md says "play-sessions/ is not the evidence corpus" and distinguishes
ordinary level/seed captures from receipted candidate evidence. This task's
explicit all-session diagnostic does not turn ordinary captures into receipted
candidate evidence. Each included capture was resolved to its real board and
replayed before its positions were inspected. All 36 replays passed. The
diagnostic remains outside experiments/ and cannot support a generalizing
ledger claim. It only determines the proposal order on this recorded sample.

The review's alternative corpus produces a different branch. Preserve that
limitation explicitly, rather than silently excluding sessions or rewriting
the frozen diagnostic:

```
$ python - read solver/policy-lab/runs/generation.json
play-sessions/ sessions 24 diagnostic 32 ownerMoreThanPoolBest 23
recordings/ sessions 10 diagnostic 18 ownerMoreThanPoolBest 14
pilots/ sessions 2 diagnostic 0 ownerMoreThanPoolBest 0
```

With ordinary captures excluded, n=18 is below N_MIN=30. With the explicitly
requested all-session scope, n=50 and 37 owner chains beat the pool's best
immediate points, giving the registered GENERATION branch. Neither conclusion
generalizes beyond its respective sample. No corpus file, original diagnostic,
exploration plan or running control measurement source was changed in response
to this review.
