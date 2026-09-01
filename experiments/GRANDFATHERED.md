# Grandfathered results

Results accepted before the experiment protocol gate existed (cutoff
**2026-08-31**). They are exempt from `tools/verify-experiments.js` because
backfilling a preregistration after the outcome is known produces fiction, not
evidence — the one property a preregistration has is that it predates the data.

These records keep the standing their own `proof_class` gives them. Being
grandfathered is not a promotion and not a demotion; it means the protocol
requirement is waived, not that a protocol was met.

Nothing may be added to this list. Every result numbered above RESULT-0018
needs a protocol.

- RESULT-0005 — the whole back half is unbeaten
- RESULT-0006 — spawning 16s does not lift the ceiling
- RESULT-0007 — more moves rescue the mid levels and saturate on the late ones
- RESULT-0008 — every level is winnable after the demand-based retune
- RESULT-0009 — Level 51 shipped through the authoring tracer
- RESULT-0010 — the bot's candidate cap was discarding real options
- RESULT-0011 — the chain walk stranded tiles a tie-break recovers
- RESULT-0012 — Level 52 shipped at its admitted target
- RESULT-0013 — re-searching ranking weights still establishes nothing
- RESULT-0014 — keeping built tiles usable is worth 2.6%
- RESULT-0015 — eight low-value chain routes raise score 13.8%
- RESULT-0016 — old route plus bounded alternatives raise score 23.0%
- RESULT-0017 — a bounded MAP-Elites run finds 20 behavior cells
- RESULT-0018 — a target-aware finish rule generalizes across shipped levels

## Two preregistrations exist that no result claims

`.orch/runs/chain-offer-2026-08-21/preregistration.md` and
`.orch/runs/chain-offer-2026-08-23/preregistration.md` are complete,
rigorous protocols — question, controls classified before outcomes, seeds,
version freeze, stopping rules. Neither maps to a ledger result: they register
pilot seeds 5,000,000+ and confirmation seeds 6,000,000+, while RESULT-0015
and RESULT-0016 report on 9,000,000+ and 10,000,000+ via
`solver/multipath-ablation.js`.

So either that experiment never completed, or it completed under a different
framing and the registered record was never closed out. This is left recorded
rather than resolved — it is the clearest evidence for why the gate exists.

## RESULT-0018 was the load-bearing exemption — no longer

`DECISION-0004` promoted a change into the shipped bot on the strength of
RESULT-0018, and RESULT-0018 is grandfathered. That was the one place where a
decision with consequences rested on a result the gate would otherwise have
required a protocol for.

**Closed 2026-09-01.** `RESULT-0020` registered a protocol, re-ran the same
52 x 300 holdout, and reproduced every one of RESULT-0018’s counts exactly.
`DECISION-0004` now has evidence a clean checkout can regenerate, produced
under a protocol committed before the data existed.

RESULT-0018 stays on the list above. It was not backfilled, not edited, and
not removed: the exemption genuinely happened, and this file is the record
that it did. What changed is that no shipped decision depends on it any more.

The re-run also surfaced something the original could not. While both arms
were the same promoted policy the instrument returned 520 of 520 identical
cells and exited 0 — a null result indistinguishable from a real one. That is
the failure mode this gate exists to make visible, and it was found by running
the experiment again rather than by reading the record. See `RESULT-0020`’s
C2 and P3.
