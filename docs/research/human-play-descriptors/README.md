# Human-play descriptor observation

This directory preserves the exact 15-row descriptor table that previously
existed only in a session scratch directory. The copied bytes are
`descriptors.json`, SHA-256
`e7d128dd173487b6a7f6da6e0a6d98fd226c178ffb8b075e40cff5312f68d4ca`.

## `strandedCellPressure` observation

Across the 15 captured human games, `strandedCellPressureMean` ranges from
`0.0071` (`640f5c64`) to `0.2810` (`8ac6c9d4`), an observed range of `0.2739`.
That is more than ten times the `0.02385060610977495` range in the project's
48-game synthetic [SPR-001 probe](../../../.orch/tickets/2026-09-02-stranded-pressure-range-probe/SPR-001.md).

This difference is a research lead, not a contradiction or result. The human
games use different boards, seeds, durations, and behavior than SPR-001's
fixed synthetic panel. The one human loss is also the maximum-pressure row, so
outcome interpretation would rest on one example.

## Evidence boundary

The JSON is a byte-for-byte preservation of the scratch output, and its range
is directly recomputable from those 15 rows. The script that derived the table
was not committed with it, so the derivation from raw recordings is
`UNVERIFIED` in the repository. This note does not supersede SPR-001, establish
policy separation, predict outcome or fun, or admit `strandedCellPressure` as
an archive axis.

Recompute the preserved range with:

```bash
node -e 'const d=require("./docs/research/human-play-descriptors/descriptors.json"); const v=d.map(x=>x.strandedCellPressureMean); console.log({n:v.length,min:Math.min(...v),max:Math.max(...v),range:Math.max(...v)-Math.min(...v)})'
```
