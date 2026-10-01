# Policy backlog

This is the prioritized working backlog for policy investigation. It is
navigation, not evidence. Keep exactly one item in **Now**. Move an item only
when its stated exit condition is met.

**Last updated:** 2026-09-30 (America/Chicago)

## Now

### PB-001 — Explain the opposite bomb-defusal outcomes

**Question:** What concrete board property makes the mergeable bomb-defusal
override helpful on Level 40 seed `47000000` but harmful on seed `47000002`?

**Work:** Replay the first override on both seeds. For each, record the two
first chains, surviving tile and landing cell, cleared cells, refill, and the
later target-crossing chain.

**Done when:** We can show one shared or contrasting board property with both
replays, or honestly record that the two examples do not isolate one.

**Must not do:** Change the challenger, invent a rule, run fresh seeds, or
modify the champion.

**Starting evidence:** [active-policy state](ACTIVE-POLICY-WORK.md),
[RESULT-0078](experiments/RESULT-0078/report.md), and its frozen corpus.

## Next — only after PB-001

### PB-002 — Decide whether the observed property is testable

**Entry condition:** PB-001 identifies a concrete, observable property rather
than a story about the two seeds.

**Work:** Define the smallest replay-only check that distinguishes the helpful
and harmful examples. Plant a counterexample before proposing a policy rule.

**Exit:** Either a qualified diagnostic or an explicit rejection. Neither
outcome authorizes a champion change.

### PB-003 — Decide whether a new challenger experiment is warranted

**Entry condition:** PB-002 survives its counterexample and identifies a
bounded rule that can be separated from the champion.

**Work:** Write a frozen contract with target cells, safety rule, compute
limit, and stop rule before opening new seeds.

**Exit:** A registered experiment, or a documented decision not to run one.

## Parked

| Item | Why it is parked | Resume only when |
| --- | --- | --- |
| Ladder Challenger and replay lab | It drifted away from the active bomb-defusal evidence and is currently an uncommitted prototype. | The owner explicitly chooses to resume it as a separate experiment. |
| Route-diverse challenger | Its known Level 54 route was recovered, but qualification missed the compute bound before exact-afterstate reuse work; it is not the current policy question. | A separate owner decision makes route diversity the active question. |
| Historical `docs/backlog/BL-*.md` items | They are durable project history, not an ordered current queue. | An item is promoted here with a concrete next action and boundary. |
| RESULT-0078 archive/gate design | The global gate correctly exposes the frozen protocol defect. Do not weaken it merely to make green. | A separately reviewed design can preserve invalid-run detection while reporting archived invalid protocols clearly. |

## Operating rules

1. One active policy question at a time.
2. A result moves an item forward, back to Parked, or to Done; it never creates
   a silent side branch.
3. “Promote” is never a backlog action. It requires a separate owner decision
   after a valid experiment clears its frozen gates.
4. The champion, levels, targets, receipts, recordings, and authoring system
   remain protected unless the owner explicitly changes that boundary.
