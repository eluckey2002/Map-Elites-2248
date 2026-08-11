# Independent content-lens review

- **Run:** `game-evidence-ledger-2026-08-11`
- **Reviewer:** `orch-critique`, content lens
- **Status:** complete
- **Gate conclusion:** findings present; the fixed revision is not content-green
- **Target scope:** read-only review of the fixed assembled revision
- **Fixed identities verified:**
  - `EVIDENCE_LEDGER.md` — SHA-256 `c9790d45f628f189becd072e7a17fa9615d3e8156987b152f304004b8b277e28`
  - `AGENTS.md` — SHA-256 `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`
  - `HANDOFF.md` — SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`

## Criteria restated fresh from the frozen spec

1. A future coding/research agent must find one root, read-first ledger and recover the current accepted rules, results, decisions, hypotheses, questions, and proof boundary without prior-session knowledge.
2. The ledger must contain the full required orientation, authority, vocabulary, correction, snapshot, registry, and reusable-template structure.
3. Each seeded factual or experimental claim must resolve to the frozen primary repository evidence and retain its exact proof class: direct fact, exact result, replayed lower bound, proven upper bound, heuristic observation, `UNKNOWN`, or unresolved question.
4. Every record must have a unique stable ID and the required type, status, scope, statement/question, evidence, proof class, and update date. Corrections must preserve history append-only.
5. Verified facts, results, owner decisions, hypotheses, questions, and stale/superseded material must remain distinct. In particular, an incomplete search or timeout cannot become a bound, and a technical recommendation cannot be presented as an explicit owner choice without evidence of that choice.
6. The voice must be precise, calm, compact, evidence-first, and candid about uncertainty: third-person project voice for records, direct imperative only for read/update instructions, and no promotional language.
7. The document must follow one resume-oriented throughline. Headings and first sentences must carry that throughline for a skimming new agent, and the ending must pay the opening promise.
8. The assembled new documents must stay within 3,500 words, with a `HANDOFF.md` banner of at most 90 words, without cutting required coverage.
9. `AGENTS.md` must narrowly route future agents to the ledger and its append-only, source-pinned update protocol. `HANDOFF.md` must visibly remain the historical August 8 snapshot, with its prior body preserved.
10. Only the three authorized documentation surfaces may change; unrelated dirty-worktree state and the frozen solver/ticket/run evidence must remain untouched.

## Ranked findings

### 1. Major — `DECISION-0002` promotes an agent-derived continuation recommendation to an accepted `owner_decision`

- **Artifact evidence:** `EVIDENCE_LEDGER.md:258-265` classifies the entire statement as an accepted decision with `proof_class: owner_decision`. The statement combines two different claims: the supported rule not to infer impossibility from non-decisive evidence, and a prescriptive choice to continue through a streaming/partitioned frontier or another exact formulation.
- **Cited-source evidence:** `HANDOFF.md:40-70` presents a historical correction and a recommended next study, but contains no explicit owner adoption of the later streaming/partitioned-frontier choice. `.orch/runs/level26-certified-score-2026-08-10/worklog.md:93-109` records the executor's branch-and-bound resume boundary and the issuance of a witness lane; lines 137-152 record a later bounded threshold lane. None of those cited passages identifies the continuation formulation as an owner choice.
- **Violated criterion/invariant:** Criterion 3 requires evidence to support the stated proof class; criterion 5 requires owner decisions to remain distinct from technical recommendations. The ledger itself defines `owner_decision` as an explicit project choice (`EVIDENCE_LEDGER.md:71`).
- **Consequence:** A future agent can mistake one technically plausible resume route for owner-authorized direction and may treat alternatives as out of scope.

### 2. Moderate — `RESULT-0003` cannot be re-verified from the command and oracle information the record provides

- **Artifact evidence:** `EVIDENCE_LEDGER.md:214-223` makes an exact, checkout-specific claim: 1,868,975 physical first moves, an exact maximum of 430, and three maximizing actions. Its `reverify` field says only to "follow" the oracle in `.orch/tickets/level26-move1-envelope-2026-08-11.md:29-36`.
- **Cited-source evidence:** The cited ticket passage asserts that a complete enumerator and concrete replay passed, but it gives no command or machine-readable receipt. The complete ticket contains no invocation for reproducing the Level 26 enumeration. `solver/tests/exact-score.test.js:31-68`, the other citation, tests small enumerator invariants; it does not compute the Level 26 action count, maximum, or three maximizers. `solver/exact-score.js:25-105` exposes the enumerator but no recorded Level 26 command or expected-output oracle.
- **Violated criterion/invariant:** Criterion 3 requires claim-by-claim support at the stated exact proof class. Criterion 1 requires a future agent to recover settled work without re-deriving it. The spec's binding freshness rule requires checkout-sensitive facts to carry an `as_of` date and a re-verification command; the ledger's own template requires a command plus expected observation (`EVIDENCE_LEDGER.md:95-109`).
- **Consequence:** The ticket is durable evidence that the investigation reported 430, but the canonical record does not let a new agent independently reproduce that exact result without reconstructing the missing invocation.

### 3. Moderate — Decision records break the binding third-person record voice

- **Artifact evidence:** `DECISION-0001` says "Preserve" and "Do not substitute" (`EVIDENCE_LEDGER.md:244-250`). `DECISION-0002` says "Do not call" and "Continue" (`EVIDENCE_LEDGER.md:258-264`). These are direct imperatives inside registry records, not read/update instructions.
- **Violated criterion/invariant:** Criterion 6 restates the spec's exact voice contract: records use third-person project voice; direct imperative is reserved for read/update instructions. The content lens requires every section, including signposts and records, to hold that contract.
- **Consequence:** The records read as commands to the next agent instead of evidence-first descriptions of choices and their scope. In `DECISION-0002`, that voice also amplifies the unsupported authority identified in Finding 1.

### 4. Minor — The strict skim layer and landing do not carry the full resume throughline

- **Artifact evidence:** The first sentence under `Current snapshot` frames the proof question but omits the accepted 12,336 lower bound, the non-decisive 326,390 upper bound, and the unresolved verdict; those arrive only in later sentences (`EVIDENCE_LEDGER.md:9-15`). The document then ends with `Assembly cut log`, whose final lines discuss omitted draft labels and "15 seeded records" rather than the reader's current proof boundary or next evidence action (`EVIDENCE_LEDGER.md:332-337`).
- **Violated criterion/invariant:** Criterion 7 and the craft reference require headings plus first sentences to carry the whole argument and the landing to pay the opening hook. The opening promises current standing, evidence navigation, and responsible updates (`EVIDENCE_LEDGER.md:3-7`).
- **Consequence:** A headings/first-sentences skim does not itself reveal the central numerical status, and the final impression is assembly metadata rather than a resumable evidence boundary. The full prose remains understandable, so this is not a factual defect.

## Uncertainties

- An explicit owner statement outside the fixed record's cited evidence may support the continuation half of `DECISION-0002`. None appears in the frozen citations inspected, so it cannot currently support the accepted record.
- A transient command or session transcript may reproduce the Level 26 move-one envelope. It is not named by `RESULT-0003` or preserved in its cited ticket, so its existence was not assumed.
- The protocol defines a `correction` type but no dedicated correction-registry section. A future editor could add such a section or place a correction beside the affected registry; the fixed text does not decide which. The four-step correction protocol is otherwise clear, so this remains an uncertainty rather than a finding.

## Criteria with no finding

- The three fixed hashes matched at intake and again at completion.
- All required ledger sections are present. Fifteen record IDs are unique, and manual schema inspection found the required type, status, scope, statement/question, evidence, proof-class, and update-date fields on each record.
- `EVIDENCE_LEDGER.md` plus `AGENTS.md` total 2,758 words, below the 3,500-word budget. The handoff banner is below 90 words.
- The accepted 12,336 witness replayed `PASS` at 32 moves and cursor 520. The hinted receipt verified `PASS`; 12,400, 12,600, 12,800, and 13,000 remain `UNKNOWN`. The mass/cursor calculation completed at 326,390 and reports itself non-decisive. No numerical proof-class promotion was found in those records.
- Fifty focused engine, exact-search, and upper-bound tests passed. Source inspection supports the recorded shipped chain, scoring, merge, gravity, refill, and Level 26 configuration facts.
- `AGENTS.md` is narrow, resolves its root ledger link, and states source-pinned, proof-class-preserving, append-only update instructions.
- The scoped `HANDOFF.md` diff contains only the new authority banner; the historical body is preserved. The banner clearly marks August 8 as historical and routes to the ledger.
- The target documents remained read-only throughout this review.

## Evidence inspected

- Frozen spec: `.orch/runs/game-evidence-ledger-2026-08-11/spec.md`
- Content references: `references/lens.md`, `references/oracles.md`, and `references/craft.md` under the installed `orch-content-pack`
- Fixed target documents, with numbered-line inspection and SHA-256 verification
- `src/game.js`; `solver/engine.js`; `solver/tests/engine.test.js`; `solver/tests/exact-score.test.js`
- `.orch/runs/level26-certified-score-2026-08-10/worklog.md`
- `.orch/tickets/level26-move1-envelope-2026-08-11.md`
- `solver/upper-bound.js` and `solver/tests/upper-bound.test.js`
- `solver/exact-score.js`, including the position-aware enumerator and frozen replay surfaces
- Both frozen result receipts and their pre-existing verifiers
- Fresh read-only verifier output: 12,336 witness `PASS`; hinted-threshold receipt `PASS` with 12,400/12,600/12,800/13,000 all `UNKNOWN`; mass/cursor result complete at 326,390 and non-decisive
- Fresh focused test output: 50 passed, 0 failed
- Current `git status`, `git log`, word counts, section/ID scans, scoped `HANDOFF.md` diff, and `git diff --check`
