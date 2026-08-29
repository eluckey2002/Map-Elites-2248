# Content spec amendment 001 — Universe admission label

- **discovered:** 2026-08-28, before T-004 implementation
- **reason:** `tools/universe-map-core.js` hard-codes the rendered label “Verified artifact, not ledger-admitted” even when `latestMapElitesArtifact.ledgerRecordId` is selected. Rebinding only the contract would make the resolved model correct and the generated Markdown false.
- **scope correction:** Add `tools/universe-map-core.js` to T-004's write scope. Replace the hard-coded rendered standing with a value derived from `latest.ledgerStanding`; preserve the existing artifact hash, verification, evaluation-universe, champion, and frontier logic.
- **acceptance addition:** A test must fail before the renderer change and pass afterward by requiring the ledger-admitted label when standing is `selected`. Existing tamper, missing-record, stale-status, hash, and generated-drift negative controls remain unchanged and pass.
- **authority:** This is necessary to complete the owner's already-approved fourth item, “refresh CURRENT.md and regenerate Universe Map so milestone/generator/53-level/MAP standing/frontier agree.” It grants no additional product, experiment, or evidence change.

