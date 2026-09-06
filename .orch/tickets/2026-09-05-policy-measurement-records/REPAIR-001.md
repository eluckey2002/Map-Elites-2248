---
id: REPAIR-001
run: 2026-09-05-policy-measurement-records
status: claimed
executor: orch-repair
profile: orch-worker
depends_on: [GATE-001]
write_scope: [docs/backlog/BL-0011-shipped-levels-cannot-measure-policy-quality.md, docs/backlog/BL-0012-generator-cannot-build-climbing-chains.md, docs/backlog/BL-0013-policy-vocabulary-gaps.md]
bound: 3 minutes
claimed_by: /root/records_repair_gpt_5_6_sol_high
claimed_at: 2026-09-06T03:12:00Z
---

## Objective

Repair only accepted GATE-001 finding 1: metadata titles and H1s must identify
the superseded claims as historical, not present them as current facts.

## Fixed inputs and scope

Dedicated worktree /private/tmp/2248-policy-records-20260905.LA1VFm at
4a8e5c23cf1b5f4b4d74ad475576b1ce0c8b97d3. Frozen spec.md and GATE-001
in this canonical root run supply criteria and finding. Preserve exact old
title wording, qualified as historical in place; YAML remain valid (quote if
needed). No body, status, filename, link, source, plan, evidence, gate or other
target edits. One writer: child owns the three worktree documents; root stays
read-only except this ticket's exclusive Result sections leased to child.
Commit only the three changed docs in that worktree; never root commit.
No delegation, experiments, benchmark, policy, Atlas or external action.
Parent guard 2026-09-05-policy-measurement-extra-repair and records guard apply;
records absolute deadline03:19:49Z. Reply_to=/root.

## Completion test

1. R1: All six metadata/H1 titles explicitly qualify the retained claims as
   historical; corrected body remains untouched. Oracle: before/after exact
   six-line diff and fresh skim against GATE-001 finding1;
   oracle_class=judged; provenance=pre-existing; independence=gate.
2. R2: Exactly the three allowed files, no other target change; valid existing
   frontmatter shape, unchanged links, git diff --check clean, clean committed
   worktree. Oracle: Git/path diff and named checks; oracle_class=deterministic;
   provenance=pre-existing.

## Result

Pending. Return changed artifacts and exact commit/hashes; no self acceptance.

## Verification

Pending. R1 may defer to independent final verification.

## Feedback

[]

## Risks

One repair only; no second gate. Explicitly release document and ticket leases.
