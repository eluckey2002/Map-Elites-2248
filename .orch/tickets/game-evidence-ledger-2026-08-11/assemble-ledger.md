---
id: assemble-ledger
run: game-evidence-ledger-2026-08-11
status: complete
executor: orch-edit
pack: orch-content-pack
independence: gate
depends_on:
  - ledger-protocol
  - seeded-records
  - discovery-hooks
write_scope:
  - EVIDENCE_LEDGER.md
  - AGENTS.md
  - HANDOFF.md
excluded_actions:
  - modify HANDOFF.md below the inserted authority banner
  - modify product or solver artifacts
  - commit or publish
bound: 30 minutes
claimed_by: assemble_ledger_gpt_5_6_sol_high
claimed_at: 2026-08-11T06:32:15Z
---

## Objective

The three complete drafts are assembled into a coherent root evidence ledger, narrow project discovery instructions, and a historical-handoff banner within the spec's voice, evidence, and length constraints.

## Fixed inputs

- Spec: `.orch/runs/game-evidence-ledger-2026-08-11/spec.md`
- Completed draft identities from `ledger-protocol`, `seeded-records`, and `discovery-hooks`.
- Voice contract, audience, citation policy, exemplars, and 3,500-word total budget from the spec.
- Craft reference: `/Users/eluckey/.orchflows/lib/packs/orch-content-pack/references/craft.md`.

## Completion test

1. All six spec acceptance criteria are represented in the assembled artifacts.
   - Oracle: spec-to-artifact coverage trace; oracle_class: evidence; provenance: authored-here.
2. Ledger arc, skim layer, voice, audience fit, and claim support pass the content lens.
   - Oracle: content lens against the frozen spec; oracle_class: judged; provenance: authored-here.
3. Total new-document word count is at most 3,500 and the handoff banner at most 90 words.
   - Oracle: deterministic word counts; oracle_class: deterministic; provenance: pre-existing.
4. Only the three allowed target surfaces change and all local links/source paths resolve.
   - Oracle: `git diff --check`, scoped diff/status, and deterministic local-path resolution; oracle_class: deterministic; provenance: pre-existing.

## Return fields

- Assembled artifact identities
- Cut log
- Verification entries
- Gaps
- Risks

## Result

- **Assembled artifact identities:**
  - `EVIDENCE_LEDGER.md` — SHA-256 `c9790d45f628f189becd072e7a17fa9615d3e8156987b152f304004b8b277e28`; 2,664 words.
  - `AGENTS.md` — SHA-256 `e1d9fb8c9861cf24a52b8ed027275ec579718592e6bc70cb469b419e063fc2f5`; 94 words.
  - `HANDOFF.md` — SHA-256 `a870fe7df7e0c987c1fe9fff0a7f251f2ff11ef36c8895762329510010e36898`; 38-word authority banner prepended. The preserved historical body SHA-256 is `7c3e808b804a5ee6c4950e5d1670965f465279a131044c73cdd6b2478d866d00`.
- **Cut log:** Removed draft labels and repeated draft identities. Omitted heuristic win-rate samples, terminal-board anecdotes, and the unaccepted near-target artifact as the seeded draft required. Kept the full protocol and all 15 seeded records; no acceptance coverage was cut for length. Replaced two handoff line-range citations with stable heading references because prepending the banner shifts line numbers.
- **Gaps:** None in the assembly scope. The exact 32-move maximum, 13,000 reachability, and globally best first move remain explicitly open project questions rather than assembly gaps.

## Verification

1. **PASS — spec-to-artifact coverage trace.** `EVIDENCE_LEDGER.md` contains the read-first orientation, authority/source policy, status and proof vocabularies, freshness and append-only correction protocol, current snapshot, five required registries, correction type, and reusable entry template. Its seeded records cover shipped rules, Level 26 configuration, frozen seed-0 identity, the accepted 12,336 replayed lower bound, the non-decisive 326,390 proven upper bound, the exact move-one 430 result, current `UNKNOWN` boundary, continuation decision, and open questions. `AGENTS.md` supplies narrow read/update instructions; the `HANDOFF.md` banner marks the August 8 snapshot and routes to current authority.
2. **PASS — content lens against the frozen spec.** The arc runs read-first orientation → current proof snapshot → authority and vocabulary → correction/template protocol → separate fact/result/decision/hypothesis/question registries → cut log. The opening, snapshot, registry headings, and first sentences form a sufficient skim layer. The prose remains precise, calm, compact, and evidence-first; direct imperative voice is confined to instructions. Accepted facts/results retain primary repository citations, while hypotheses and questions remain visibly non-factual or unresolved.
3. **PASS — deterministic budgets and schema.** `wc -w EVIDENCE_LEDGER.md AGENTS.md` reports 2,664 + 94 = 2,758 words, below 3,500. The banner is 38 words, below 90. A deterministic scan found 15 unique stable record IDs and exactly 15 instances of every required record field, with 15 total `statement`/`question` fields.
4. **PASS — scope, preservation, formatting, and local resolution.** `git diff --check -- EVIDENCE_LEDGER.md AGENTS.md HANDOFF.md` passed. Scoped status shows only the three allowed targets (`?? EVIDENCE_LEDGER.md`, `?? AGENTS.md`, `M HANDOFF.md`). Every cited local source path extracted from the assembled surfaces exists. `git show HEAD:HANDOFF.md | shasum -a 256` and `tail -n +3 HANDOFF.md | shasum -a 256` both return `7c3e808b804a5ee6c4950e5d1670965f465279a131044c73cdd6b2478d866d00`, proving the historical body is byte-for-byte unchanged below the banner.

## Feedback

[]

## Risks

- Line-number citations can drift. Material records pair them with symbols, frozen identities, hashes, immutable ticket/run identities, or reproducible commands; handoff references use headings after the banner insertion.
- The move-one exact result continues to rely on the accepted immutable investigation ticket's complete-enumeration and independent-replay oracle rather than a one-command full enumeration rerun.
