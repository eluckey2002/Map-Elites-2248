# Before you measure anything in here

Scripts in this directory produce the evidence the evidence ledger rests on.

**If the claim generalizes beyond the sample you ran, it needs a protocol
registered before the run.** That is a ledger record whose `proof_class`
includes `heuristic_observation`. Observations (`direct_source`), proofs
(`exact_result`), and owner rulings (`owner_decision`) need nothing.

```
node tools/new-experiment.js RESULT-NNNN     # registers and commits it
node solver/<script>.js --confirm --protocol RESULT-NNNN
```

`--exploratory` runs without a protocol and stamps the output; the ledger gate
will not let an exploratory artifact back a generalizing claim.

**Do not write the protocol after the run.** The gate rejects a protocol
committed with or after its own report, and `tools/new-experiment.js` refuses
an id that was ever registered before. If you already have results and no
protocol, the honest moves are to record a `direct_source` observation of that
one run, or to register properly and re-run. Seeds are cheap; the ledger is not.

Full rule and rationale: [../experiments/README.md](../experiments/README.md).
Worked example: `.orch/runs/chain-offer-2026-08-23/preregistration.md`.
