---
id: POLICY-EVAL-0001-MEASUREMENT-ACCEPTANCE
status: accepted
created: 2026-09-05
---

# Step 2 measurement acceptance boundary

Step 2 is accepted after independent content and whole-composition verification.
Step 3 is ready, not executed; Step 4 remains blocked on its disposition.

## Accepted code prerequisite

The accepted measurement source is
`c61d4430c08fd4e47c9b25bb9885b6b585becd95`, admitted by the independent
[`VERIFY-002`](../../../.orch/tickets/2026-09-05-policy-measurement-extra-repair/VERIFY-002.md)
review at commit `36b045540c4a4ae80031cd57ec4cd9ab37fd4149`.
The [baseline](baseline.md) is bound to:

- baseline JSON SHA-256 `a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e`;
- measurement-source identity `9b9ecd4db90d60d71b9e83c59348d790ffcf802eedb3f518ca79cc74aa3cefee`;
- contract SHA-256 `3d4cf0f65e88cb597855233738355d49bf7b4176160345a8e2346bb8e3a3935f`;
- inputs SHA-256 `1030d17804010f218b2776c0e4b3f0eeec7e2fe6d65affd1c60d5c6ad0821fbb`.

Focused tests passed 38/38. The recorded full suite passed 378/382. Its four
unchanged failures are the stale receipts for
`candidate-levels-52.json` and `candidate-levels-54.json`, generated-view
staleness, and the date-drift/rebound-evidence check. The experiment gate passed.
The exact observations are in
[`checks-c61d443.json`](../../../.orch/runs/2026-09-05-policy-measurement-extra-repair/checks-c61d443.json)
and do not form an all-green repository claim.

## What the instrument establishes

The five local [measurement check cards](measurement-checks.md) cover identity,
arithmetic, subject resolution, replay/runtime semantics, and panel output. The
[check-card index](../../CHECK-CARDS.md#policy-eval-measurement-navigation)
links them. They are not Challenge Receipts or generalized-policy evidence.

METHOD-003 carried the frozen identities. METHOD-029 used real and controlled
bad collect/render paths, which failed before repair. This follows the
[`Atlas support shortlist`](../../plans/2026-09-05-policy-improvement-atlas-support.md),
not an Atlas edit or effectiveness claim. METHOD-025 remains for Step 3.

## Whole Step 2 acceptance

Independent [WHOLE-001](../../../.orch/tickets/2026-09-06-policy-measurement-finish/WHOLE-001.md)
passed all three criteria at `49214e5`: deterministic identity/check coverage,
source-backed arithmetic/corrections, and judged whole-result coherence.
The overall verdict's weakest class is `judged`, not a universal proof.
The [reviewed envelope](../../../.orch/runs/2026-09-06-policy-measurement-finish/envelope.json)
pins all eleven document blobs and protected source/raw inputs. The
[closure envelope](../../../.orch/runs/2026-09-06-policy-measurement-finish/envelope-accepted.json)
pins the final documents after acceptance metadata only.

A fresh [integrated full suite](../../../.orch/runs/2026-09-06-policy-measurement-finish/suite-clean-6a4d4f0.txt)
at `6a4d4f0` passed 378/382 with exactly the same four known failures; both
live custody tests passed. The prior bookkeeping/remote-timeout failure
run is retained separately and is not clean acceptance evidence. No receipt,
generated view, gate, bot, game rule, recording or frozen contract was changed.

The accepted baseline and three append-only ledger corrections close Step 2.
Before Step 3 runs, recheck these predecessor identities and define its bounded
bot-own-trajectory audit. METHOD-025 is next-stage guidance, not an audit result.
