# Policy trajectory instrument check cards

Gate-check disposition: **PROCEED at report-only rung**, subject to independent
A6 qualification. These cards describe the implemented checks; they do not
validate an audit population or authorize a policy change.

## Independent bot-session replay · report-only

- **Protects:** Only a schema-2 bot session reproduced from its subject, seed,
  production chooser, live refill RNG, and pinned sources enters audit output.
- **Where:** `solver/trajectory-audit.js#verifySessionArtifact` and
  `solver/tests/trajectoryAudit.test.js`.
- **Granularity:** One whole session and every transition; unsupplied sessions
  and historical runtime events are not inspected.
- **Kind:** Value and transition truth under the pinned engine and chooser;
  independent game-model correctness remains owned by engine/game parity checks.
- **Garbage tests:** A real nonempty file written from `recordSession` returns `VERIFIED`.
  Self-rehashed false spawn, chain, score, outcome, source, params, seed, subject,
  truncated trace, and post-terminal continuation return `UNRESOLVED`. A real
  producer-created 1x1 no-legal session with zero moves is also `UNRESOLVED`.
- **Scope:** JSON files containing one nonempty schema-2 `recordSession` object, one
  explicit subject object, uint32 seed, `DEFAULT_PARAMS`, and the four recorder
  code identities. Human recordings, wrapper collections, and other schemas are
  excluded.
- **Supply chain:** Reads producer output but regenerates initialization,
  production choice, analysis, refills, transitions, score, terminal outcome,
  and live source hashes. It does not trust claimed spawn deltas, candidates, or
  the self-hash as replay evidence.
- **Sampling memory:** No sampler. Silence means no artifact was requested, not
  audited clean.
- **Enforcement:** Local report eligibility only; independent A6 review is
  required before use. It is not a repository-wide blocking gate.
- **Decay:** Permanent positive/negative tests rerun with the focused suite;
  source hash changes make old artifacts unresolved.
- **Retires:** NO — it turns the Bot Vision reconstruction pattern into a public
  consumer seam without removing that regression coverage.
- **Does NOT catch:** Historical runtime authenticity, population
  representativeness, shared engine/game bugs, malicious local source replacement,
  or policy quality.

## Bounded immediate-win decision · report-only

- **Protects:** Exhausted search may say `NONE`; node/time/fault limits say
  `UNKNOWN`; a replayed legal bomb-safe target crossing may say `FOUND`.
- **Where:** `solver/trajectory-audit.js#searchImmediateWin` and
  `#auditSessionArtifact`, with permanent cases in
  `solver/tests/trajectoryAudit.test.js`.
- **Granularity:** Every transition-distinct legal action at each verified
  preterminal position, until a witness or declared cap; not multi-move plans.
- **Kind:** Existence or bounded absence under pinned transition semantics;
  population inference and policy-change judgment belong to a later protocol.
- **Garbage tests:** Hand controls retain two actions sharing coarse
  endpoint/length/score identity, reject a target crossing when a bomb explodes,
  return `NONE` only after exhaustion, and return `UNKNOWN` at zero/tiny node or
  injected-time caps. Initial/final clock faults return `UNKNOWN`. The public
  consumer rejects a corrupted artifact, retains capped/faulted positions and
  denominators, and does not call a different witness a miss when production
  already wins.
- **Scope:** Legal king-adjacent equal-or-double chains on the verified position,
  exact action identity, cloned merge/gravity/refill/tick, bomb-before-target
  terminal order, caller node/time limits. No audit corpus is sampled here.
- **Supply chain:** Positions and RNG draw state come only from verified replay;
  witness transitions are cloned and replayed. Production candidate lists are
  used only for attribution, never for absence.
- **Sampling memory:** Every requested verified position gets `FOUND`, `NONE`,
  or `UNKNOWN`; output counts all three. It does not remember positions never
  requested.
- **Enforcement:** Report-only after A6 qualification; no automatic promotion,
  benchmark verdict, or policy mutation.
- **Decay:** Focused constructed controls rerun on implementation changes;
  changed protected sources require artifact replay and requalification.
- **Retires:** NO — it prevents misuse of `findTopChains` coarse deduplication or
  objective-filtered targeted candidates; existing APIs retain their callers.
- **Does NOT catch:** Multi-move opportunities, whole-game benefit, misses
  outside the requested panel, acceptable deployment cost, population effects,
  or independent correctness of shared engine transitions. `FOUND` proves only
  existence and stops before enumeration is complete.
