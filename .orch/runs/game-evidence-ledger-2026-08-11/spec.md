# Spec: 2248 Challenge evidence ledger

- **run:** `game-evidence-ledger-2026-08-11`
- **objective:** A future agent entering this checkout can locate one canonical, source-pinned ledger and recover the game's verified rules, current experimental results, explicit proof boundaries, hypotheses, decisions, and open questions without re-deriving settled work or mistaking provisional claims for facts.
- **routing:**
  - **pack:** `orch-content-pack`
- **kind count:** one — human-readable project documentation. No executable validator or product behavior is part of this delivery.

## Non-goals

- Prove whether Level 26 seed 0 can reach 13,000.
- Change game rules, solver behavior, tests, frozen receipts, or experimental verdicts.
- Replace immutable `.orch` tickets/worklogs or frozen JSON receipts as primary evidence.
- Commit, push, publish, or configure a remote.
- Build a general-purpose knowledge-graph or database system.

## Acceptance

1. `EVIDENCE_LEDGER.md` exists at the repository root and contains a read-first orientation, authority/source policy, status vocabulary, update/correction protocol, current snapshot, verified-fact registry, result registry, decision registry, hypothesis registry, open-question registry, and a reusable entry template.
   - **oracle:** deterministic section-presence and word-count checks over the assembled documents.
   - **oracle_class:** deterministic.
2. The initial ledger records the currently established game rules, Level 26 configuration, frozen seed-0 identity, accepted 12,336 lower bound, non-decisive 326,390 upper bound, exact move-one 430 result, current proof boundary, and current continuation options without upgrading any heuristic, timeout, or incomplete search into proof.
   - **oracle:** claim-by-claim trace to the frozen evidence set plus the pre-existing replay/tests named in each entry.
   - **oracle_class:** evidence.
3. Every ledger record has a unique stable ID, record type, status, scope, statement or question, evidence, verification/proof class, and update date; corrections supersede prior records append-only instead of silently rewriting accepted history.
   - **oracle:** deterministic ID/schema scan plus content-lens review against this spec.
   - **oracle_class:** judged, gate re-verified.
4. A root `AGENTS.md` instructs future agents to read the ledger before substantive game/solver reasoning and to append source-pinned entries using the ledger protocol. `HANDOFF.md` visibly identifies itself as the historical August 8 snapshot and routes readers to the ledger for current authority.
   - **oracle:** deterministic local-link/exact-text checks and existence checks.
   - **oracle_class:** deterministic.
5. The assembled documentation cleanly distinguishes verified facts, replayed lower bounds, proven upper bounds, heuristic observations, hypotheses, decisions, open questions, and stale/superseded material; its skim layer is sufficient for a new agent to resume responsibly.
   - **oracle:** `orch-critique` content lens against the voice, structure, and claim-support requirements below, followed by `orch-verify`.
   - **oracle_class:** judged.
6. Only `EVIDENCE_LEDGER.md`, `AGENTS.md`, and the current-status banner at the top of `HANDOFF.md` are changed by the delivery; pre-existing dirty-worktree artifacts remain untouched.
   - **oracle:** `git status --short` and scoped diff inspection.
   - **oracle_class:** deterministic.

## Binding constraints

- Primary evidence outranks summaries. The ledger is an index and status authority, not a replacement for source code, tests, frozen JSON receipts, tickets, or worklogs.
- Preserve proof classes exactly: replayed lower bound, exact result, proven upper bound, heuristic observation, `UNKNOWN`, and unresolved are never conflated.
- Source-pin every accepted factual or experimental record to repository evidence. Use file paths plus line/symbol or frozen identity/hash where available.
- Keep corrections append-only: add a correction/supersession record and update the affected record's status; never erase the historical claim or receipt.
- Keep verified facts, decisions, hypotheses, and open questions in separate registries.
- Mark checkout/time-sensitive facts with an `as_of` date and re-verification command.
- Do not modify anything under existing `.orch/tickets/level26-certified-score-2026-08-10/`, `.orch/runs/level26-certified-score-2026-08-10/`, or `solver/`.
- Preserve all unrelated tracked and untracked user work.

## Evidence

- `src/game.js` — canonical shipped level configuration, chain legality, scoring, merge, gravity, and spawn behavior.
- `solver/engine.js` — seedable headless transition model and parity surface.
- `solver/tests/engine.test.js`, `solver/tests/exact-score.test.js`, and the fresh focused test output recorded in `.orch/tickets/level26-move1-envelope-2026-08-11.md`.
- `.orch/runs/level26-certified-score-2026-08-10/worklog.md` — integrated proof status and lane outcomes.
- `solver/target-witness-search/frozen-run.json` and its pre-existing verifier.
- `solver/hinted-cp-sat/frozen-run.json` and its pre-existing verifier.
- `solver/upper-bound.js` and the current recorded bound.
- `.orch/tickets/level26-move1-envelope-2026-08-11.md` — exact seed-0 starting board and move-one envelope.
- `HANDOFF.md` — historical August 8 snapshot and its explicit feasibility correction.
- Current `git status --short --branch` and `git log` output as of 2026-08-11.

## Affected surfaces

- `EVIDENCE_LEDGER.md` — new canonical human-readable ledger.
- `AGENTS.md` — new project-scope discovery and update instructions.
- `HANDOFF.md` — prepend only a short current-authority banner; preserve the historical snapshot below it.

## Exemplars

- `HANDOFF.md` — imitate its concise resume orientation, explicit correction language, and direct source references; do not imitate its now-stale current-status claim.
- `.orch/runs/level26-certified-score-2026-08-10/worklog.md` — imitate its strict separation between accepted, suspended, failed, non-decisive, lower-bound, and upper-bound outcomes, plus frozen result identities.

## Pack-required fields

- **audience:** future coding/research agents and the project owner, including readers unfamiliar with prior sessions but comfortable with undergraduate-level algorithms and evidence terminology.
- **voice contract:** precise, calm, compact, and evidence-first; third-person project voice for records, direct imperative voice only for read/update instructions; candid about uncertainty; short declarative sentences in the skim layer; no promotional language.
- **length budget:** at most 3,500 words across the new ledger and `AGENTS.md`; the `HANDOFF.md` banner is at most 90 words. Prefer tables and compact record blocks over narrative repetition.
- **citation policy:** every accepted fact/result cites primary repository evidence using paths plus line/symbol, record identity, hash, or reproducible command. Summary documents may aid navigation but cannot be the sole support for a claim. Hypotheses cite the observations motivating them and are visibly labeled non-factual. Open questions cite the unresolved result boundary they inherit.

## Bound

- **effort:** one bounded content delivery with one terminal editorial/gate pass; no network, dependency installation, solver rerun exceeding 30 seconds, or source-code mutation.
- **plan_gate:** false.

## Risks

- The ledger could become a second stale handoff unless discovery and `as_of`/reverification rules are prominent.
- Compressing experiment history may accidentally promote an unaccepted artifact or heuristic diagnosis.
- Line-number citations may drift; pair them with symbols, hashes, or commands when material.
- A root `AGENTS.md` becomes an instruction source; it must remain narrowly scoped to evidence-ledger discovery and update discipline.

## Assumptions

- The user's request authorizes creation of a project-scope read-first instruction file.
- A Markdown ledger is the smallest useful cross-session system; executable validation can be added later if repeated drift demonstrates the need.
- The current frozen seed-0 scope remains the active feasibility study boundary unless the owner records a new decision.
