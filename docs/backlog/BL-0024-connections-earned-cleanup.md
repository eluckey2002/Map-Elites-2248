---
id: BL-0024
title: Earn tile removal through ordinary Connection Run play
status: active
milestone: level-archetype-design
depends_on: []
updated: 2026-10-04
---

## Authority

Owner-authorized isolated playtest after the concept choices below. This is
not shipped-rule adoption, release approval or evidence of sustained effectiveness.
This record captures intent, not evidence; proof standing remains in the
[evidence ledger](../../EVIDENCE_LEDGER.md).

The later main-project integration request selects the existing finite pack
with this recovery loop (DECISION-0010, PDL-035), not adoption of the endless
trial or a general claim that accumulation is solved. Release verification
and review remain part of that separate integration.

## Desired outcome

Explore earned tile removal as a way to manage difficult-to-reuse material
without abandoning the current board or removing the unusual-value challenges.

The owner clarified that these are two possible ways to earn one “specialty”
item, or power-up, not two different items. The proposed item grants tile
removal; its earning system is a separate design decision.

The owner wants to save earned removal charges and choose when and which tile
to remove. A maximum inventory of three is an initial suggestion, not a tested
or finalized balance setting. The intended benefit is more planning and an
incentive to build up and score high tiles, not only emergency cleanup.

The owner agreed that spending one charge removes the chosen tile, applies
normal gravity and refill, and leaves the current objective unchanged. The
power-up does not replace ordinary unrestricted chain play.

The owner selected the large-tile milestone over the score meter, then selected
2048 or higher over exactly 2048. Each merge that creates a tile worth at least
2048 earns one removal charge; a large tile merely remaining on the board does
not earn additional charges. Retain the original proposals as history:

- “Create a 2k tile and that earns you 1 tile removal.”
- “You could do some kind of score meter and when that earn you a removal. Some type of mechanism like that”

Announced first-playtest defaults: start with zero charges, cap at three, discard
excess awards, award no score for removal, count it as one move (no move limit),
preserve inventory on Skip/New board, and clear it on Restart. These are prototype
settings, not proven balance choices. Score-meter earning remains unselected.
Only the isolated new mode changes; older games and shipped rules are unchanged.

## Acceptance criteria

- Preserve the owner's selected earning rule and removal behavior in the playtest brief.
- Explicitly state the inventory and accounting defaults before the bounded build is authorized.
- Any playtest and its verification are separately scoped; proposal capture is not proof of effectiveness.

## Current evidence

[PDL-027](../../prototypes/PLAYTEST-DECISION-LEDGER.md) records the owner's
sustained-play concern. The bounded
[diagnosis](../game-design/levels/receipts/CONNECTIONS-RESIDUE-1.md) identifies the
current material-lifecycle gap; it does not establish that either proposal fixes it.
PDL-029 records subsequent owner enjoyment of the growth/objective/recovery
balance and difficulty saving charges. This is encouraging conversation
feedback, not demonstrated sustained-board health or a general balance result.

## Next action

Keep [the isolated version](../../prototypes/connections-powerup/README.md)
unchanged at 8285. The separately [confirmed finite-level brief](../plans/2026-10-03-0341-feat-connection-puzzle-levels-plan.md)
uses the enjoyed loop without retuning its reward. Continued endurance feedback,
native QA and independent review remain open; do not declare the lifecycle
issue resolved or reinstate a third-family search.

## History

- 2026-10-02 — Captured the two owner ideas as proposed candidates; no selection or build authorization inferred.
- 2026-10-02 — Owner clarified: “They both are just a way to earn a "specialty" item.” Separated item behavior from alternative earning triggers; status remains proposed.
- 2026-10-02 — Owner named it a power-up and confirmed saving charges: “Yes, I would see myself saving it and hopefully saving up a certain amount, like a max of 3”. Recorded banking and a provisional cap of three, not implementation authorization.
- 2026-10-02 — Owner stated its intended strategic benefit: “It would create more planning, encourage building up and scoring high tiles”. This is design intent, not measured evidence.
- 2026-10-02 — Owner answered “yes” to removing the chosen tile, applying normal gravity and refill, and leaving the objective unchanged. Earning trigger remains open; no build authorization inferred.
- 2026-10-02 — After score meter and large-tile milestone were offered as options 1 and 2, the owner selected “2”. Large-tile milestone is the selected earning direction; score meter remains unselected. Exact qualifying event and playtest authorization remain open.
- 2026-10-02 — After “2048 or higher” and “Exactly 2048” were offered as options 1 and 2, the owner selected “1”. One charge is earned per merge producing at least 2048, including larger results; no standing-tile awards. Inventory/accounting defaults and bounded build authorization remain open.
- 2026-10-02 — Owner said “ok proceed”. Built an isolated playtest with the announced inventory/accounting defaults; original run remains unchanged. Status active pending owner play of reward timing and resource decisions; no production adoption inferred. PDL-028 and CONNECTIONS-POWERUP-1 record verification and its limits.
- 2026-10-03 — Owner calls the loop fun and well balanced, with charges difficult to save and growth/objective/earning priorities competing (PDL-029). No settings changed or endurance proof inferred. Owner separately confirmed budgeted puzzle-level scope (PDL-030); the requirements brief does not alter this endless mode.
- 2026-10-04 — Owner authorizes main-project integration of the existing finite pack carrying this earned-removal loop (DECISION-0010, PDL-035). Preserve the endless trial, settled reward settings and ongoing captures; no long-run effectiveness claim or tuning follows.
