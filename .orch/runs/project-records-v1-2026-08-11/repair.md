# Repair receipt: localized BL-0001 voice and audience defect

- **run:** `project-records-v1-2026-08-11`
- **repair skill:** `orch-repair`
- **repair date:** 2026-08-11
- **accepted defect set:** `.orch/runs/project-records-v1-2026-08-11/review.md` at SHA-256 `27d3683888712df14498f861eae4b862f30e5eabf8717dddf4d03bf0b8ca7f11`, finding 1 only
- **correction bound:** one localized wording defect, one correction pass
- **disposition:** **PASS — repaired and rerun**

## `changed_artifacts`

- `docs/backlog/BL-0001-test-compact-state-signature.md` — replaced the undefined term in the sole ready next action with a plain description of the required comparison rule.
- `.orch/runs/project-records-v1-2026-08-11/repair.md` — created as this repair receipt.

No status, evidence statement, hypothesis standing, proof method, solver surface, sibling backlog record, protected file, or other content changed in this repair pass.

## Per-defect disposition

### Finding 1 — undefined `comparison oracle`

- **before:** `Specify the frozen small-horizon fixtures, candidate signature, comparison oracle, and failure example format before running the evaluation.`
- **after:** `Specify the frozen small-horizon fixtures, candidate signature, rule for comparing exact continuations and achievable outcomes, and failure example format before running the evaluation.`
- **target SHA-256 before:** `8c78989cd3d5e770899fc9533effb0288f12c3608e728b4efe44221cf6b88b69`
- **target SHA-256 after:** `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b`
- **disposition:** repaired. The replacement consumes the finding's single localized cause: the action now names the comparison deliverable in plain language already grounded by the acceptance criteria, without selecting an implementation or strengthening the provisional hypothesis.

## Rerun evidence

### Failed judged checks

- **Voice: PASS.** Rereading the amended `## Next action` against the frozen voice contract and content lens found a concise, operational direct instruction with no undefined workflow term. `rule for comparing exact continuations and achievable outcomes` uses the same concrete concepts as the record's acceptance criteria and leaves the evidence-aware stance unchanged.
- **Audience: PASS.** The project owner, a future agent, and a scanning collaborator can now identify what must be specified before evaluation: the rule that compares exact continuations and achievable outcomes. No unstated meaning of `oracle` is required.

### Deterministic checks invalidated by the target identity change

- **Accepted inputs: PASS.** Before repair, SHA-256 checks matched the supplied review identity `27d3683888712df14498f861eae4b862f30e5eabf8717dddf4d03bf0b8ca7f11` and target identity `8c78989cd3d5e770899fc9533effb0288f12c3608e728b4efe44221cf6b88b69`.
- **Local links: PASS.** A deterministic target scan found and resolved both repository-relative Markdown links, including the `EVIDENCE_LEDGER.md#hypothesis-registry` fragment.
- **Length: PASS.** `wc -w -l` reports BL-0001 at 267 words and 38 lines, within its 500-word cap. The five target documents total 1,307 words and 168 lines, within the 2,500-word aggregate cap; the other surface counts remain `CURRENT.md` 209, backlog README 420, BL-0002 271, and `AGENTS.md` 140 words.
- **Whitespace: PASS.** `git diff --check -- docs/backlog/BL-0001-test-compact-state-signature.md` exited 0. Because the target is untracked at the repository baseline, an explicit line scan also ran and reported `PASS no trailing whitespace`.
- **Protected hashes: PASS.** `EVIDENCE_LEDGER.md` remains `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`; `HANDOFF.md` remains `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`.
- **Scope: PASS.** The `git status --short` path/status set was identical immediately before and after the target edit. Fixed sibling identities also remained unchanged from the accepted review: `CURRENT.md` `77eae456d486c89fc5cdee6a648305be76b7035f1b6a0f81405fd3b685995004`; backlog README `ba65b8a0a0e013b624c4563eb462313dbb94363508aca0579e6334e2eea423ea`; BL-0002 `f18ade4830bc53d55fa6721815595bf250f7852a57f94ab3774e0b2b8069310a`; `AGENTS.md` `fa310f15eb960922ebc5d006c8457bf0847bd3c64e4c45709eca4ba1174993ec`. The review receipt also remained at its accepted hash. The only repair writes were the target and this receipt.

## Queued

`[]`

No additional defect, refactor, method choice, solver work, status change, or publication action was admitted by this repair.
