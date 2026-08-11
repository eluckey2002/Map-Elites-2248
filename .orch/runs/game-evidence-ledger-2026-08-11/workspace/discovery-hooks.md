# Discovery hooks draft

Draft identity: `game-evidence-ledger-2026-08-11/discovery-hooks`

## Proposed `AGENTS.md` text

```markdown
# Project evidence instructions

Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) before substantive reasoning about game rules, solver results, score feasibility, or experiment status. Use the ledger for current project status and follow its citations to primary repository evidence for factual support.

Append source-pinned updates using the ledger's record schema. Preserve each proof class exactly: a replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question must not be promoted into another class.

Make every correction append-only. Add a correction or supersession record, update the affected record's status, and retain the prior claim and receipt.
```

## Proposed `HANDOFF.md` banner

Insert this banner above the existing title and preserve the historical body unchanged.

```markdown
> **Current authority:** This document is the historical snapshot stopped on August 8, 2026. It is preserved below without revision. Read [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) for current project status and proof boundaries. Follow the ledger's cited primary evidence for factual support.
```

## Cut log

- No general orchestration, coding, testing, or repository-management instructions were added.
