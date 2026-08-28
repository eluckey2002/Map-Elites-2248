# C3 respecification — chain-offer-v1

Companion to `preregistration.md` in this directory, which stays frozen and is
not edited by this record. This file replaces only the C3 check for any run
conducted under that pre-registration from this point forward.

**Registered:** 2026-08-23, before any measurement (pilot or confirmation) is
run under this pre-registration.

---

## Why C3 needed replacing

`stop-record.md` in this directory already diagnosed the defect: C3 as
originally written — "196 tests, 195 pass, and the same single known receipt
failure" — cannot be satisfied by *any* change to `solver/bot.js`, because
`solver/level-author.js`'s `defaultInputIdentities()` hashes that file's full
content, and every shipped candidate receipt binds to that hash
(`docs/CHECK-CARDS.md`, `receipt-verifies-against-current-code`). A
content-only, behavior-preserving edit to `bot.js` — which is exactly what
adding a default-off `offerFull` flag is — still invalidates every receipt.
The original C3 could never pass once that edit landed, regardless of whether
the underlying change is good, bad, or neutral.

## Baseline, measured today with the flag off (current committed state)

`node --test solver/tests/*.test.js`: **198 tests, 195 pass, 3 fail.**

All three failures are at `solver/tests/receiptGate.test.js:161`, one per
candidate store, each asserting `code/input identity mismatch`:

| store | cause | pre-dates this experiment? |
|---|---|---|
| `candidate-levels-52.json` | permanent, by owner decision (`docs/CHECK-CARDS.md`, T-003): target held at 102,000 rather than re-derived against a stronger bot | **yes** — red before and independent of this experiment |
| `candidate-levels-54.json` | `bot.js`'s content hash moved when the `offerFull` param was added | **no** — caused by this experiment's own committed edit |
| `candidate-levels.json` | same — `bot.js`'s content hash moved | **no** — caused by this experiment's own committed edit |

`candidate-levels.json` and `candidate-levels-52.json` both print the same
"THIS FAILURE IS KNOWN AND DECIDED" wording, because the check's exemption
logic keys on "ships + has a recorded human win," which both satisfy — not on
*why* each is currently red. Read literally, that message would misclassify
`candidate-levels.json`'s failure as the same pre-existing, decided case as
`-52`'s. It is not: before the `offerFull` edit landed, `candidate-levels.json`
verified cleanly. This is the specific camouflage `docs/CHECK-CARDS.md`'s
`receipt-verifies-against-current-code` card names as blind spot 1 — "one
habitual red can camouflage a second" — observed here concretely rather than
hypothetically.

## C3′ — replaces C3, implementation contract (PASS / FAIL)

After any run conducted under `preregistration.md` (pilot or confirmation),
run `node --test solver/tests/*.test.js` and check:

1. **Every currently-passing non-receipt test still passes.** 195 tests pass
   today; the count of passing tests must not drop, and no new failure may
   appear outside `receiptGate.test.js`.
2. **`receiptGate.test.js` fails on exactly these three stores** —
   `candidate-levels-52.json`, `candidate-levels-54.json`,
   `candidate-levels.json` — **each still asserting `code/input identity
   mismatch`**, no other assertion, and no store beyond these three.
3. **No fourth store fails**, and none of the three failures changes shape
   (e.g. a different assertion, a crash instead of an assertion, or a pass
   flipping to something other than this exact failure).

**PASS** if all three hold. **FAIL** — a stop, per `preregistration.md`'s own
rule "any different failure is a stop" — if any do not.

C3′ does not require, and must not be satisfied by, re-stamping, archiving, or
exempting any receipt. That matches `stop-record.md`'s resolution: no receipt
was touched to close this out, and none should be.

## Scope

This replaces C3 only. C1 (flag-off identical play), C2 (positive control),
and every empirical check (P1, P2, P3) in `preregistration.md` are unchanged
and still govern the run. The question and the denominator are unchanged, so
per `preregistration.md`'s own rule this is a correction to an existing
record's checks, not a new scope requiring a new record.
