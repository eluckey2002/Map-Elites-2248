# Gate-check planning disposition

ADVISORY — design only, no implemented check and no enforcement rung. The
negative tests below are planned and unimplemented. Nothing here qualifies
the instrument or permits audit evidence to be trusted. Re-run gate-check with
actual good/bad artifacts before the implementation commit and acceptance.

## Independent bot-session replay

1. Granularity: one whole session plus every transition; unsampled sessions remain unchecked.
2. Kind: value/transition truth under pinned engine and chooser, not independent proof of the game model.
3. Garbage test: planned trajectoryAudit.test.js self-rehashed false spawn/chain/score/outcome/source and continued-after-terminal cases; no result yet.
4. Scope: schema-2 recordSession artifact files for unchanged reference parameters, explicit shipped subject and uint32 seed; not human recordings.
5. Supply chain: reads producer session but regenerates live RNG, choice and transitions from pinned sources; must not trust claimed spawn deltas or self-hash alone.
6. Sampling memory: no sampler; each requested session returns valid or unresolved; absence of artifact cannot pass.
7. Rung: none now; local report/consumer eligibility only after independent A6 qualification, never a new repo-wide gate.
8. Decay: permanent artifact-negative tests and source identity rejection; requalification if covered sources change.
9. Retire-one: absorb the Bot Vision reconstruction pattern into a consumable audit seam; existing tests remain regression coverage. Human replay cannot be widened silently because its schema and policy-choice semantics differ.

Does NOT catch: historical runtime authenticity, population representativeness,
engine/game bugs shared by both paths, or quality of the bot's policy.

## Bounded immediate-win decision

1. Granularity: each verified preterminal position and every legal action or sound equivalence class; not multi-move optimality.
2. Kind: existence/absence under pinned transitions; limited search is UNKNOWN, not absence.
3. Garbage test: planned tiny capped search with a real unvisited win, distinct-action coarse-dedup collision, bomb-invalid crossing and timed-out control; no result yet.
4. Scope: legal chains under actual subject/minimum length/blockers/remaining budget, full transition and terminal precedence; no fresh-case sampler in this instrument.
5. Supply chain: source-pinned verified position; returned witness independently replayed; producer candidate pool cannot certify exhaustive absence.
6. Sampling memory: retain every requested position and cap outcome; report unvisited work explicitly.
7. Rung: none now; report-only after qualification, no automatic promotion or enforcement change.
8. Decay: small hand-enumerated controls plus source hashes and deterministic node/time-cap tests.
9. Retire-one: replace misuse of filtered generateTargetedChains output or coarse findTopChains output as absence proof; neither existing API can safely be widened without changing its consumers. Reuse their sound primitives, not duplicate the engine.

Does NOT catch: eventual whole-game benefit, opportunities requiring several
moves, a useful policy change's deployment cost, or misses outside the declared
panel. FOUND is existence only; a cap after a witness is not complete enumeration.
