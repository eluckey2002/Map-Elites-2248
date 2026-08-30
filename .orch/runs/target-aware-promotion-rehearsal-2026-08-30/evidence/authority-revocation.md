# Authority revocation: target-aware promotion experiment

- **status:** accepted correction
- **effective:** 2026-08-30T23:46:01Z
- **combined experiment disposition:** `INVALIDATED`
- **decision standing:** none
- **owner directive:** revoke authoritative status

This record supersedes every claim that either the original promotion rehearsal
or its v2 duplicate has authoritative `RETAIN_CHAMPION` status. Neither run is
an authoritative promotion decision, and neither may be cited as one.

## Why authority is revoked

1. The original spec claimed an exact historical challenger source identity
   `ba75b5…`, but the committed challenger source hashes to `6b375b…`; the
   historical source bytes are absent.
2. The fail-fast Level 53 harness persisted neither the failing seed nor the
   differing terminal field, so its negative result is incomplete evidence.
3. The protocol constrained the promoted Level 53 reveal to one execution, but
   a second lane duplicated it after the original run completed. That broke the
   experiment's custody condition.

## Correct standing

- The combined experiment is `INVALIDATED`, not `RETAIN_CHAMPION` and not
  `PROMOTION_ELIGIBLE`.
- It authorizes no champion decision. Canonical main remains unchanged only
  because no promotion was performed, not because this experiment proved the
  current champion should be retained.
- The observed `Level 53 changed same-speed winning outcome` errors remain
  historical diagnostic observations with no promotion-decision standing.
- Any future promotion decision requires a newly approved protocol and fresh
  evidence. This record does not authorize that work.

## Superseded decision records

- `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/sealed-reveal.md`
- `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/worklog.md`
- `.orch/tickets/target-aware-promotion-rehearsal-2026-08-30/T-001.md`
- `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/promotion-failure.md`
- `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/correction.md`
- `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/worklog.md`
- `.orch/tickets/target-aware-promotion-rehearsal-v2-2026-08-30/T-001.md`

Historical text is retained append-only. Where it says `RETAIN_CHAMPION` or
“authoritative,” this revocation is the controlling later record.
