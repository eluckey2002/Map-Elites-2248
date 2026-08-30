# Correction: v2 replay was not the authorized first reveal

- **status:** accepted correction
- **v2 outcome:** `INVALIDATED`
- **authoritative outcome:** original run `RETAIN_CHAMPION`
- **corrected:** 2026-08-30

The original claimed ticket remained live while v2 was prepared. It completed
the authorized Level 53 reveal first at `2026-08-30T23:26:53Z` and committed
the result in `73b1f3c0e986cc8756399c05f4324d78f70abc45`, then closed the run in
`542e4d609b1153be5b96a0d8612802e8068ff34a`.

V2 was claimed later at `2026-08-30T23:30:42Z` and incorrectly executed the
same fixed replay again without first re-reading the original ticket and branch
identity. That duplicated a protocol action constrained to one execution.
Therefore v2 cannot supply an independent or protocol-valid promotion verdict,
even though it observed the same fail-closed error.

The authoritative evidence is:

- `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/sealed-reveal.md`
- original-at-close SHA-256 `acc15f15fd87132d3343299b39083cc4d1037d65db5010ea757840b38bc980ec`
- corrected receipt SHA-256 `71f6c664baef224a8ba384f14df253e021593ab61b1bc3352274011abc43b8e9`
- outcome `RETAIN_CHAMPION`

No code, seed, threshold, gate, champion, or canonical-main state changed
between the original reveal and the duplicate. This correction does not use
the duplicate as corroboration; it excludes it from the evidence basis.
