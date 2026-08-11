# Independent content-lens gate review

- **run:** `project-records-v1-2026-08-11`
- **review role:** single independent `orch-critique` content lens
- **review date:** 2026-08-11
- **artifact under review:** the fixed five-file project-record system named below
- **gate conclusion:** **NOT GREEN — one localized minor finding requires repair**

The five-file system meets the frozen spec's substantive structure, claim-boundary, skim, and length requirements. One term in the sole ready item's next action breaks the voice contract and makes that action needlessly ambiguous for two stated audiences. Under the content oracle policy, a judged row must pass for the assembled document to be green, so the voice/audience defect remains gate-relevant even though it is small and local.

## `changed_artifacts`

- `.orch/runs/project-records-v1-2026-08-11/review.md` — created by this review.
- No target, protected evidence file, spec, ticket, worklog, source file, solver file, or other document was edited by this lane.

## Fixed identities checked

All caller-supplied SHA-256 identities matched at review time.

| Artifact | Observed SHA-256 | Result |
| --- | --- | --- |
| `CURRENT.md` | `77eae456d486c89fc5cdee6a648305be76b7035f1b6a0f81405fd3b685995004` | match |
| `docs/backlog/README.md` | `ba65b8a0a0e013b624c4563eb462313dbb94363508aca0579e6334e2eea423ea` | match |
| `docs/backlog/BL-0001-test-compact-state-signature.md` | `8c78989cd3d5e770899fc9533effb0288f12c3608e728b4efe44221cf6b88b69` | match |
| `docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md` | `f18ade4830bc53d55fa6721815595bf250f7852a57f94ab3774e0b2b8069310a` | match |
| `AGENTS.md` | `fa310f15eb960922ebc5d006c8457bf0847bd3c64e4c45709eca4ba1174993ec` | match |
| `EVIDENCE_LEDGER.md` | `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2` | match protected intake identity |
| `HANDOFF.md` | `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898` | match protected intake identity |

The frozen spec read from `.orch/runs/project-records-v1-2026-08-11/spec.md` had observed SHA-256 `77d7a06eec96b15f4e7e44ac9880753b976c3aa4bfd1e06caa368feba0a20c17`. The supplied content lens, craft, and oracle-policy references were read directly. No executor-authored verification section was used or quoted.

## Criteria restated fresh from the spec and lens

- **Voice:** Every section must be concise and operational, understandable without workflow jargon, in third-person project-record voice except for direct instructions and templates. It must remain candid about unresolved evidence, leave recommendations proposed until accepted, and use short paragraphs, compact lists, and scannable first sentences. Signposts are part of this judgment.
- **Structure:** The system must move in the spec's order along one throughline: accepted evidence standing leads to the active milestone, exactly one ready next item, dependent later work, durable record rules, and future-agent routing. Each section must perform its own job; endings must deliver what openings promise.
- **Skim layer:** Headings and first sentences alone must let a reader recover the authority boundary, active question, immediate action, later dependency, completion boundary, and navigation path.
- **Length:** `CURRENT.md` must stay at or below 500 words and 100 lines; the backlog README at or below 1,000 words; each backlog item at or below 500 words; `AGENTS.md` at or below 220 words; all five targets together at or below 2,500 words. Budget compliance must not hide lost acceptance coverage, and any applicable cut log must be checked.
- **Claims:** Current game-state claims must trace to the fixed ledger at their exact proof class. Unsupported matter must stay marked as proposed, provisional, `UNKNOWN`, or unresolved. `CURRENT.md` may sequence work but may not strengthen evidence; backlog status may not become empirical support; no hypothesis or proof method may be silently accepted.
- **Audience:** The owner working through chat, a future agent without prior conversation, and a scanning collaborator must each be able to tell what is next, why, what completes it, and where evidence authority lives without relying on unstated workflow knowledge.

## Ranked findings

### 1. Minor — The sole ready action uses undefined workflow jargon

- **Evidence inspected:** `docs/backlog/BL-0001-test-compact-state-signature.md:32-34` makes the next action: "Specify the frozen small-horizon fixtures, candidate signature, comparison oracle, and failure example format before running the evaluation." Neither that record nor `docs/backlog/README.md` defines **comparison oracle**. The acceptance criteria at `BL-0001:20-26` describe comparisons and outcomes but do not disambiguate whether the phrase means an independently implemented checker, a source of expected outcomes, or the rule used to judge equivalence.
- **Criterion violated:** The spec's voice contract requires prose "understandable without workflow jargon" (`spec.md:69-74`), and the audience criterion requires the owner and a scanning collaborator to act without knowledge the spec does not grant (`spec.md:63-67`; content lens, Audience).
- **Why this is a defect:** This is the first executable action for the only `ready` record. A future agent can infer that some comparison mechanism is needed, but the owner or collaborator cannot tell what deliverable the term names. That makes the action less operational precisely at the handoff point.
- **Smallest sufficient repair:** Replace the term with a plain description of the required comparison rule or independently checked expected result, or define the term in the sentence. The review lane made no edit.

No higher-severity or additional evidence-backed content defect was found in the fixed assembly.

## Criterion coverage

| Criterion | Result | Evidence |
| --- | --- | --- |
| Voice | **fail, localized** | All records otherwise hold the concise, evidence-aware stance and allowed person; finding 1 is the sole observed break. |
| Structure | pass | `CURRENT.md:1-30` moves from authority to milestone, exit conditions, one `NEXT`, later work, then decisions; `README.md:1-52` moves from authority to record unit, statuses, schema, promotion, and landing link; both backlog records use the required record arc; `AGENTS.md:1-9` preserves ledger-first routing. |
| Skim layer | pass | The title/opening and section-first sentences expose authority, current question, ready work, dependent work, and next actions. The acceptance lists add proof detail without reversing that skim-level story. |
| Length | pass on measured budgets; cut-log uncertainty below | `CURRENT.md`: 209 words/30 lines; backlog README: 420/52; BL-0001: 261/38; BL-0002: 271/39; `AGENTS.md`: 140/9; total: 1,301 words/168 lines. All caps pass with substantial headroom, and direct acceptance coverage is present. |
| Claims | pass | `CURRENT.md:7-15` traces the 12,336 lower bound, 326,390 non-decisive upper bound, unresolved questions, and non-decisive outcomes to ledger sections (`EVIDENCE_LEDGER.md:9-13,184-240,288-341`). `BL-0001:18-30` retains `HYPOTHESIS-0001` as provisional (`ledger:258-272`). `BL-0002:19-35` leaves the formulation unselected and traces its boundary and provisional possibilities (`ledger:274-286`). |
| Audience | **fail, localized** | Authority and navigation are otherwise actionable for all three audiences; finding 1 leaves the only ready next action partially dependent on unexplained terminology. |

## Acceptance and invariant coverage

1. **`CURRENT.md`: pass.** It names the active 32-move reachability milestone, the three admissible exit classes, the accepted numerical interval, one `NEXT` link, proposed dependent later work, the missing decisive certificate/owner decision, and the 2026-08-11 review date (`CURRENT.md:5-30`).
2. **Backlog README: pass.** It defines non-evidence authority, file-per-record and stable-path rules, exactly six statuses, the minimal metadata and body schema, artifact-directory boundary, and owner-mediated chat promotion (`README.md:1-50`).
3. **Initial records: pass within the fixed assembly.** The two supplied `BL-NNNN` records have unique IDs, `ready`/`proposed` status, an explicit dependency from BL-0002 to BL-0001, all required metadata and sections, and append-only initial history.
4. **Authority and protected hashes: pass.** Each planning record calls itself navigation or intent rather than evidence and links the ledger. Ledger and handoff hashes match the binding identities.
5. **Future-agent routing: pass.** `AGENTS.md:3-7` requires ledger-first reading, then `CURRENT.md`, and separates chat intake, durable backlog intent, ledger standing, primary artifacts, and proof classes.
6. **Document checks: pass where fixed-input review can decide.** All 16 local Markdown links in the five targets resolved, including supplied fragments; no trailing whitespace was found; the measured word/line budgets pass. Repository-wide mutation scope remains an uncertainty below.

Stable-path, evidence-class, and method-choice invariants also hold in the reviewed prose: status changes remain metadata changes; `CURRENT.md` sequences without strengthening the ledger; both hypotheses remain explicitly provisional; BL-0002 makes any recommendation contingent on owner acceptance; no target reports solver work or a changed proof standing.

## Uncertainties

- The fixed-input bound did not permit a scoped repository diff or inspection of unnamed paths. This lane therefore cannot independently prove that all pre-existing dirty work was preserved, that no excluded `src/`, `solver/`, ticket, run, or unrelated documentation file changed, or that the directory contains no additional `BL-NNNN` file. Those are final-verifier checks, not findings against the supplied five-file content.
- No target-specific cut log was among the fixed review inputs. Direct inspection found every acceptance topic represented and the assembly uses only 1,301 of 2,500 allowed words, but the lens's historical cut-log check is unavailable rather than proven. The protected ledger's own assembly cut log was not treated as this delivery's cut log.
- Link resolution proves that the local destinations and named fragments exist; it does not independently re-prove the primary receipts cited by the protected evidence ledger. Claim review was correctly bounded to the ledger's recorded standing and the fixed content assembly.

## Evidence inspected

- Frozen spec: `.orch/runs/project-records-v1-2026-08-11/spec.md` in full.
- Fixed target assembly: `CURRENT.md`, `docs/backlog/README.md`, both named `BL-NNNN` records, and `AGENTS.md`, each in full at the matched identities above.
- Protected evidence: `EVIDENCE_LEDGER.md` and `HANDOFF.md`, each in full at the matched identities above.
- Review law: the canonical `orch-critique` skill plus the supplied content lens, craft vocabulary, and content oracle policy, each in full.
- Read-only deterministic observations over the fixed targets: SHA-256 identities, word/line counts, section/metadata/link extraction, local target-and-fragment resolution, and trailing-whitespace scan.

