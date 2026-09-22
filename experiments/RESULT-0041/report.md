# RESULT-0041 — qualification passes; confirmation is invalidated by watchdog

**Closure:** `INVALID`  
**Domain outcome:** none  
**Subject:** `4afc2ef4e5ea125d066dfcc494fc9c56c63df0faede3562e3a23593b8f4c984c`

The frozen harness qualified before confirmation. Its production verifier
killed stale identity, coherent seed substitution, incorrect work-limit count,
and coherent source substitution for their intended reasons. The exact-modal
stability fixture also failed at 0.50, proving the middle greed bin could not
pass automatically.

The one permitted confirmation attempt then hit the registered 30-second
emergency watchdog at percentile 1.00, Level 10, seed 33,800,004. The runner
stopped with exit code 1 after reporting 96/128 completed games. Because it
writes the corpus atomically only after the full matrix, no outcome rows were
retained. The protocol declares any watchdog timeout invalid, forbids retries,
and does not permit a domain interpretation from partial progress.

## C1 — PASS

Descriptor arithmetic passed the manifest-derived production-seam tests.

## C2 — PASS

The deterministic exact/reference controls and objective-equivalence fixture
passed before confirmation.

## C3 — PASS

The positive percentile ladder and uniformly scaled negative control passed.

## C4 — PASS

All four declared mutants were killed for their registered reasons. The
unstable middle-bin fixture produced an exact-modal share of 0.50.

## C5 — PASS

The independent reducer byte-matched the registered analysis on the valid,
work-limited, zero-exact-policy, null-cell, and non-default-policy fixtures.

## C6 — PASS

Changing only half-score timing left the greed predictions and policy summaries
unchanged.

## C7 — PASS

The retained baseline contains 420 tests: 415 pass, four documented deliberate
failures, and one skip. The 27 focused qualification tests passed.

## P1 — UNVERIFIED

The watchdog stopped the matrix before a reportable artifact existed. Coverage
cannot be assigned from progress counts.

## P2 — UNVERIFIED

No complete immutable corpus exists from which to compare policy means.

## P3 — UNVERIFIED

No complete immutable corpus exists from which to compute policy win tracking.

## P4 — UNVERIFIED

No complete immutable corpus exists from which to compute score redundancy.

## P5 — UNVERIFIED

The replacement statistic qualified, but confirmation stability was not
measured on a complete retained corpus.

## P6 — UNVERIFIED

The invalid run has no primary descriptor outcome. Greed ratio remains an
unadopted candidate, and this experiment supplies no adoption evidence.

## Deviations and partial evidence

The watchdog event is an invalidating condition anticipated by the protocol,
not an allowed deviation. The only retained partial evidence is execution
progress through 96 games and the exact terminal failure identity. Neither is
used for a descriptor claim, and the confirmation run will not be retried.
