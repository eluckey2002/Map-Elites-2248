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

## RESULT-0018 is the load-bearing exemption

`DECISION-0004` promoted a change into the shipped bot on the strength of
RESULT-0018, and RESULT-0018 is grandfathered. That is the one place where a
decision with consequences rests on a result the gate would otherwise have
required a protocol for. Recorded plainly; not a reason to backfill one.
