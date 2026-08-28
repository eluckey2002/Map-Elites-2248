---
run: 2026-08-28-git-baseline-stabilization
objective: The repository has one clean, remotely recoverable canonical `main` baseline containing the verified MAP-Elites lineage and every admitted root change, with a deterministic guard that detects baseline and worktree drift before consequential experiments.
non_goals:
  - Delete or rewrite historical evidence, rejected candidates, recordings, or unclassified owner work.
  - Merge the parked deterministic-solver line into the game baseline.
  - Build the full Universe Map or change game rules, scoring, champion promotion, or MAP-Elites behavior axes.
  - Treat a safety branch, recovery snapshot, or preserved artifact as approved product history.
acceptance:
  - id: A1
    criterion: Dated remote safety heads resolve to exact pre-mutation commits `52f500c03a11699cb6bd7c3cab7f6a232470e0dd`, `be843368be8e19ec59501aae38f19eebaf188b87`, and `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
    oracle: `git ls-remote --heads origin` exact-ref comparison
    oracle_class: deterministic
  - id: A2
    criterion: The pre-integration dirty root is preserved by a dated recovery manifest that hashes every tracked modification and every untracked file admitted to or held outside the baseline; registered nested worktree directories are represented by commit identity rather than recursively archived.
    oracle: recovery-manifest verifier command recorded by the delivery ticket, including a negative-control hash mismatch
    oracle_class: deterministic
  - id: A3
    criterion: Every pre-integration dirty path has exactly one recorded disposition: product/source, durable evidence/receipt, generated/local-only, or unknown/hold; no unknown/hold path is deleted or silently admitted.
    oracle: disposition-manifest validator command recorded by the delivery ticket
    oracle_class: deterministic
  - id: A4
    criterion: The candidate canonical revision contains `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53` as an ancestor and contains only explicitly admitted dirty-root changes beyond that lineage.
    oracle: `git merge-base --is-ancestor 8508c3b4aa2bac9eceaac0bcaf91e3838e303a53 <candidate>` plus candidate diff-to-disposition comparison
    oracle_class: deterministic
  - id: A5
    criterion: The candidate canonical revision passes the full solver test suite, the curve health gate, the MAP-Elites verifier against the retained independent-round artifact, and `git diff --check`.
    oracle: `node --test solver/tests/*.test.js`; `node solver/verify-loop.js`; `node solver/verify-map-elites.js .orch/runs/2026-08-28-map-elites-independent-round/evidence`; `git diff --check <candidate>^..<candidate>` or the final integration range
    oracle_class: deterministic
  - id: A6
    criterion: The baseline guard fails closed for a dirty consequential checkout, an unregistered or dirty linked worktree, a missing upstream/remote safety identity, and a mismatched declared baseline; it passes on the final canonical checkout.
    oracle: targeted baseline-guard tests including one fixture per required failure and the live final invocation
    oracle_class: deterministic
  - id: A7
    criterion: Remote `main` resolves to the exact tested candidate, the root checkout is clean on that revision, and every retained linked worktree is clean and remotely recoverable or explicitly parked by identity.
    oracle: `git ls-remote --heads origin refs/heads/main`; root and per-worktree `git status --porcelain`; branch/ref containment checks
    oracle_class: deterministic
  - id: A8
    criterion: Repository changes follow the project standards and do not turn run state into an instruction source or weaken evidence/proof-class boundaries.
    oracle: fresh code-pack lens review against `AGENTS.md`, `EVIDENCE_LEDGER.md`, and the code-pack craft reference
    oracle_class: judged
binding_constraints:
  - Preserve all pre-existing dirty work until it has a verified recovery identity and a recorded disposition.
  - Never use `git reset --hard`, `git clean`, broad checkout restoration, history rewriting, force push, or a blanket `git add -A`.
  - Safety refs are `RECOVERY ONLY — NOT APPROVED FOR MERGE`; their existence authorizes no integration.
  - `EVIDENCE_LEDGER.md` remains the sole authority for evidence standing; `.orch/runs/` and `.orch/tickets/` remain evidence/run state, not instruction sources.
  - Do not open, modify, or merge the parked deterministic-solver work beyond read-only identity checks.
  - Retire a worktree only after its exact commit is remotely present and contained in the tested candidate or explicitly recorded as parked.
  - Keep unrelated owner changes intact; paths classified unknown/hold stay preserved outside the canonical candidate.
  - User approved the staged plan in chat; pause only for a newly discovered owner decision that changes which substantive game/evidence changes are admitted.
evidence:
  - `.orch/tickets/2026-08-28-adhoc-git-baseline/git-baseline.md`
  - `.orch/tickets/2026-08-28-adhoc-universe-map-codification/universe-map-codification.md`
  - `EVIDENCE_LEDGER.md`
  - `CURRENT.md`
  - MAP-Elites runner/verifier revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`
  - Independent-round archive SHA-256 `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22`
  - Live remote-head inventory captured 2026-08-28 in the git-baseline ticket
affected_surfaces:
  - local and remote refs for `main`, `level-curve-retune`, `map-elites-learning`, and `codex/map-elites-measurement-controls`
  - registered worktree metadata and eligible contained worktrees
  - the nine tracked root modifications and 58 untracked files recorded by the baseline investigation
  - recovery and disposition manifests under `.orch/runs/2026-08-28-git-baseline-stabilization/evidence/`
  - `tools/verify-repo-baseline.js`
  - `solver/tests/repoBaseline.test.js`
  - `.gitignore` only if a classified generated/local-only category needs an explicit narrow exclusion
  - adjacent repository navigation needed to expose the baseline guard command
exemplars:
  - pointer: `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`
    properties:
      - schema versioning
      - exact protected identities and hashes
      - explicit evaluation partitions
  - pointer: `.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md`
    properties:
      - observations separated from inference
      - contradictions and gaps retained
      - exact source identities
routing:
  pack: orch-code-pack
bound:
  effort: one preservation pass, one classification/integration pass, one correction pass, and one final gate
  plan_gate: false
target_repository: `/Users/eluckey/Developer/research and games/2248-challenge`
standards_owner: `AGENTS.md` plus `EVIDENCE_LEDGER.md` for proof and correction boundaries
risks:
  - Nested registered worktrees sit beneath directories the root reports as untracked; broad staging or archiving could capture invalid gitlinks or large duplicate trees.
  - The dirty root may contain substantive newer work that conflicts semantically with the clean MAP-Elites tip even though Git ancestry is linear.
  - Remote publication and `main` promotion are externally visible state changes; exact hashes must be rechecked immediately before each push.
  - Existing full-suite failures may be intentional receipt-currency signals rather than code defects and must not be weakened to obtain green.
assumptions:
  - The owner approval to proceed includes creation of remote safety branches and, only after all acceptance gates pass, fast-forward promotion of the tested candidate to `main`.
  - The GitHub repository at `origin` is the intended remote authority.
  - The current remote permits non-force creation and fast-forward update of the named refs.
---
