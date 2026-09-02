# Player-style topology entitlement retry

## Run

`2026-09-02T05-54-31Z-player-style-topology-entitlement-retry`

## Objective

At one exact committed revision, RESULT-0024 contains a preregistered repeat of
the RESULT-0023 topology question on fresh seeds whose outcome-only positive
control rejects an outcome-identical twin before confirmation, whose
confirmation runner consumes that qualified control receipt, and whose report
ends in exactly one empirical verdict plus an explicit entitlement verdict.
The modified check has a permanent negative test and a Check Card, and the
RESULT-0023 false-PASS remains preserved unchanged.

## Question

Across a fresh frozen 200-seed confirmation set, does the incremental score
effect of changing a one-center-stone 4x8 layout into a
two-adjacent-center-stone 4x8 layout differ materially among the same four
identity-pinned policies?

The empirical rule is unchanged from RESULT-0023: `SUPPORTED` requires at
least a five-percentage-point response spread and stable unique extremes in
both fixed halves; `FALSIFIED` requires a spread below two percentage points;
anything else is `INCONCLUSIVE`, conditional on the same style guard.

The separate entitlement verdict is `ENTITLED` only if every control,
identity, matrix, independent-recomputation, challenge, and consumer check
passes. Otherwise it is `NOT_ENTITLED`, regardless of the empirical number.

## Source policy

Use only primary repository artifacts at the frozen revision: RESULT-0023's
protocol, raw evidence, report, post-run control audit, exact source files, and
the existing Check Cards. Conversation supplies authorization and intent but
is not empirical evidence. No web, external source, model judgment, unpublished
figure, or RESULT-0023 confirmation outcome may alter the subjects, thresholds,
or fresh-seed result.

## Rigor bar

Every load-bearing claim must reconstruct from exact bytes. Before any control
game, a permanent test must show the corrected check PASS a valid synthetic
subject and FAIL an outcome-identical twin whose layout identities still
differ. Before confirmation, the same real control check must PASS the valid
artifact, FAIL its outcome-identical twin, and issue an identity-bound receipt.
The confirmation runner must refuse absent, malformed, stale, or non-PASS
receipts and record the consumed receipt identity in its output. Raw arithmetic
must independently recompute. A green repository experiment gate is never
treated as proof of a result-local decision seam.

## Non-goals

1. Do not edit, erase, relabel, or retroactively repair RESULT-0022 or
   RESULT-0023.
2. Do not modify the global experiment gate merely because its documented
   structural scope did not catch the result-local C2 defect.
3. Do not change policies, layouts, game rules, stone/gravity behavior,
   thresholds, MAP-Elites axes, champion, archive, pilots, ledger, or current
   navigation.
4. Do not run MAP-Elites, OpenEvolve, co-evolution, search, training, tuning,
   selection, or promotion.
5. Do not claim human personas, fun, difficulty, shipping suitability, or
   mechanic correctness.
6. Do not admit the result to the evidence ledger automatically.

## Frozen subjects and measures

Reuse the exact RESULT-0023 policies, parameters, identities, three layouts,
24-move budget, behavior counters, paired geometric response formula, style
guard, diagnostics, and verdict thresholds. Copying is verified against
`experiments/RESULT-0023/protocol.md` and the RESULT-0024 source closure; no
historical performance value is reused.

Fresh seed sets:

- Control only: `22000000..22000011` (12), executed twice, never reportable.
- Confirmation: `23000000..23000199` (200), reportable once.
- Fixed halves: `23000000..23000099` and `23000100..23000199`.

Repository search at spec time found neither seed range elsewhere in the
checkout. Four policies x three layouts x 200 seeds remains exactly 2,400
reportable cells.

## Acceptance

### A1 — Pre-change baseline

- **oracle:** live `node tools/verify-experiments.js` and
  `node --test solver/tests/experiments.test.js` before modifying the check.
- **oracle_class:** deterministic.
- **acceptance:** experiment gate exits 0 and all 19 focused tests pass. Any
  named failure stops delivery and is recorded rather than normalized away.

### A2 — Outcome-only C2 check and permanent negative test

- **oracle:** RESULT-0024 test file's named valid-subject and
  outcome-identical-twin cases.
- **oracle_class:** deterministic.
- **acceptance:** the check compares only `score`, `movesUsed`,
  `behaviorTotals`, and `behavior`; identity fields cannot satisfy it. The
  known-good fixture passes. A twin with all four outcome fields copied from
  one-stone into each two-stone pair fails with the named C2 error. The test
  confirms the twin really contains zero changed outcomes.

### A3 — Gate-check card

- **oracle:** `docs/CHECK-CARDS.md` card-shape inspection plus the test named in
  the card's Crafted-bypass line.
- **oracle_class:** evidence.
- **acceptance:** one compact card answers all nine gate-check questions,
  explicitly states that C2 proves sensitivity rather than relevance or
  sufficient magnitude, names its exact files and fields, retires the
  RESULT-0023 whole-cell comparison, and points to the permanent negative test.

### A4 — Real control challenge before confirmation

- **oracle:** RESULT-0024 `verify.js controls` over the real control artifact.
- **oracle_class:** deterministic.
- **acceptance:** 144 exact repeats pass; at least one of 48 real paired gameplay
  outcomes differs; the outcome-identical twin has zero changed outcomes and
  fails the same outcome-only check. The receipt binds the control artifact,
  verifier, sources, valid verdict, broken mutation, and broken verdict.

### A5 — Downstream consumption

- **oracle:** RESULT-0024 consumer tests plus the confirmation artifact.
- **oracle_class:** deterministic.
- **acceptance:** confirmation execution refuses no receipt, a malformed
  receipt, a receipt for another control artifact, a non-PASS valid verdict,
  or a non-FAIL twin verdict before calling the evaluator. The real
  confirmation artifact records the exact consumed receipt identity and
  control identity.

### A6 — Complete fresh confirmation and independent verdict

- **oracle:** RESULT-0024 primary verifier plus separately implemented raw-cell
  recomputation.
- **oracle_class:** deterministic.
- **acceptance:** exactly 2,400 unique expected fresh-seed cells exist, no prior
  seed appears, all values are finite and internally consistent, identities
  verify, and both computations agree within `1e-12` on load-bearing quantities,
  half-orderings, style guard, and one empirical verdict.

### A7 — Artifact and control broken twins

- **oracle:** RESULT-0024 challenge receipts.
- **oracle_class:** deterministic.
- **acceptance:** valid control and confirmation artifacts pass. The
  outcome-identical control twin fails at C2. A confirmation twin with one score
  incremented without updating identity fails the full verifier. Temporary
  twins are deleted; receipts retain exact mutations and verdicts.

### A8 — Registration, report, and authority boundary

- **oracle:** pre-existing experiment gate, focused tests, registration-history
  check, protected-path diff, and report scan.
- **oracle_class:** deterministic.
- **acceptance:** the complete RESULT-0024 protocol, runner, verifier,
  recomputation, and permanent tests are one strict ancestor of every game and
  the report commit; all named checks have truthful outcome sections; only the
  new run, RESULT-0024, and the one Check Card change; protected surfaces are
  byte-identical. The report preserves RESULT-0023 as `NOT_ENTITLED` and grants
  no authority beyond the exact bounded empirical claim when every check passes.

## Binding constraints

1. Commit this spec before delivery and the complete RESULT-0024 protocol and
   source closure before any control or confirmation game.
2. Baseline first; gate-check card and permanent negative test land with the
   corrected check.
3. Run one real control. Confirmation cannot execute until its runner consumes
   the real qualified receipt.
4. Run one confirmation on the fresh seeds. No alternate seeds, threshold
   changes, policy swaps, layout substitutions, or second confirmation.
5. RESULT-0023's opened data may be cited only as defect provenance and as a
   diagnostic historical observation, never used to tune this retry.
6. Preserve exact distinctions among empirical verdict, entitlement verdict,
   owner decisions, human evidence, and diagnostic output.
7. Stop and report `NOT_ENTITLED` on any failed acceptance criterion. Do not fix
   a post-execution defect and continue under the same protocol.
8. No network, provider, model, human play, external write, product mutation,
   evidence admission, or main-branch integration.

## Evidence

1. Base commit `4c56335954e6aa3a81c2d11de00721f0fb7494d6`.
2. RESULT-0023 protocol registration `bb89d75c569d33a646fd8a900fbfbe3224110a5d`.
3. RESULT-0023 report `experiments/RESULT-0023/report.md` at base commit.
4. C2 defect receipt
   `.orch/runs/2026-09-02T05-30-18Z-player-style-topology-cross-eval/evidence/control-gate-audit.json`,
   artifact identity
   `498811fbb7d0dd4a01ecc0b10d4984bdbe1921e3b11d2ccefdd5849e7f9796d5`.
5. Frozen broken implementation `experiments/RESULT-0023/verify.js`,
   `verifyControls`, source SHA-256
   `03927d6f91ca69cba75d3e6f78663d843492505b9bba1b53a54e6271f238d6e8`.
6. `docs/CHECK-CARDS.md` experiment-gate cards at base commit: the report card
   explicitly proves structure rather than truth, and the artifact-identity
   card explicitly does not catch an artifact wrong when written.
7. Seed freshness probe: no repository matches for `22000000`, `22_000_000`,
   `23000000`, or `23_000_000` at base commit.

## Affected surfaces

1. This run under
   `.orch/runs/2026-09-02T05-54-31Z-player-style-topology-entitlement-retry/`.
2. New `experiments/RESULT-0024/` protocol, runner, verifiers, tests, artifacts,
   and report.
3. One appended/updated card in `docs/CHECK-CARDS.md` for the corrected
   result-local C2 gate.

No existing experiment record or protected project surface may change.

## Exemplars

1. `experiments/RESULT-0023/protocol.md` at `bb89d75`: imitate its exact
   policies, layouts, formulas, threshold rule, source closure, and explicit
   authority refusal; replace only result identity, seeds, and control
   entitlement mechanics.
2. `experiments/RESULT-0023/report.md` at `4c56335`: imitate its candid separation
   of numerical observation from evidence entitlement and its preservation of
   failed checks.
3. RESULT-0023 `control-gate-audit.json`, identity `498811fb…`: use its exact
   outcome-identical mutation as the negative test; require the opposite
   verdict.
4. `/Users/eluckey/.codex/skills/gate-check/references/check-card.md`: imitate
   all card fields, especially `Does NOT catch`, Crafted-bypass, Retires,
   Enforcement, and Decay.

## Routing

- **pack:** `orch-research-pack`
- **deliverable kind count:** 1. The end state answers one bounded empirical
  question; the verifier, permanent negative test, consumer seam, Check Card,
  and report are its evidence instrument rather than independent product
  deliverables.
- **slicing:** one empirical unit because the control entitlement is the
  necessary predecessor of the single confirmation and both bind one artifact
  chain. Independent arithmetic is an acceptance oracle, not a blind research
  lane.

## Bound

- One existing isolated worktree and branch.
- One spec commit, one complete registration commit, one control execution,
  one confirmation execution, and one report/evidence commit.
- Four exact policies, three exact layouts, 12 control seeds, 200 confirmation
  seeds, at most 2,400 reportable games.
- One Check Card and the smallest permanent test surface needed for C2 and
  consumer refusal.
- No external calls or human time.
- **plan_gate:** `false`; the owner explicitly approved the fresh-seed retry and
  asked that discovered false claims, evidence defects, and bad gates be fixed
  when in scope or documented when deferred.

## Risks

1. RESULT-0023's opened result could bias the retry. Mitigation: subjects,
   layouts, formula, and thresholds remain byte-for-byte equivalent in meaning;
   only fresh seeds and control entitlement mechanics move.
2. A corrected C2 can still prove only that topology changes outcomes, not that
   the change is strategically meaningful. The Check Card must state this.
3. A receipt may exist without being consumed. A5 makes consumption a runner
   precondition and artifact field, with refusal tests.
4. Adding more general gate machinery would expand scope and recreate the cost
   problem. The check stays result-local and the global gate remains unchanged.

## Assumptions

1. The four policy and three layout identities at base remain the intended
   subjects; source hashes make drift a hard stop.
2. The selected fresh seed ranges are unused in repository evidence at spec
   time; the runner and verifier enforce exact membership and prior-seed
   exclusion.
3. A fresh 200-seed repeat is proportionate because the prior confirmation was
   opened under a false-PASS release gate and cannot acquire preregistration
   retroactively.
