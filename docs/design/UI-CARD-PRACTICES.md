# Card design for Keeper and the research views

This guide adapts [Ana & Vlad's eight UI card practices](https://uxdesign.cc/8-best-practices-for-ui-card-design-898f45bb60cc) to this project. It is design guidance, not a claim that the current screens already meet every rule. The playable board stays the visual focus; cards help players choose a level, understand a result, and help researchers scan the [Universe Map](../../UNIVERSE.md). For game rules and research standing, use the [evidence ledger](../../EVIDENCE_LEDGER.md), not a card's appearance.

## 1. Give each card a clear edge and purpose

On Keeper's dark background, use a visible surface or outline to separate a level option or result panel from its surroundings. Reserve stronger color for the current level, the primary next action, and urgent state. Do not give every tile, stat, and card the same elevation: the board should remain dominant. In the Universe Map, preserve the existing bordered sections and make status text legible independently of its accent color.

**Check:** In a grayscale screenshot, can someone still locate the playable board, the selected level, and the primary action?

## 2. Make the important number readable first

For play, prioritize level, score, target, and turns; keep explanatory labels smaller but readable. For a result panel, show the outcome before supporting stats. For a research card, lead with its subject and standing, then the evidence link and caveat. The current game header uses 24–28 px for level and score but 12 px labels in places ([current markup](../../src/index.html)); treat those small labels as a mobile legibility review point, not as a type scale to copy everywhere.

**Check:** At phone width and normal zoom, can a player read score, remaining turns, and target without leaning in or guessing from color?

## 3. Use one spacing rhythm

Build card padding and gaps from a small 4 px based scale, such as 8, 12, 16, and 24 px. Keep related label/value pairs close and separate unrelated sections more clearly. Use the same rhythm in the level picker, completion dialog, and research cards, while allowing the game canvas enough breathing room. The existing level picker already uses an 8 px grid gap ([current markup](../../src/index.html)); that is a useful anchor.

**Check:** Do gaps explain grouping even when borders and colors are temporarily removed?

## 4. Show loading only where loading exists

The playable level should appear as soon as its local state is ready. If a research view or future level browser loads asynchronously, use placeholders shaped like the actual card: heading, status line, and body or action area. Preserve the card's footprint during loading so the layout does not jump. Show a plain error or empty state if content cannot load; never leave a permanent skeleton that could be mistaken for evidence.

**Check:** Can a user tell whether a card is loading, empty, or failed, and does its eventual content appear in the same place?

## 5. Match height within a comparison row, not everywhere

Level options should have consistent hit areas so the grid scans cleanly; the current picker uses square buttons ([current markup](../../src/index.html)). Research cards may use a shared minimum height in a row, as the [generated map](../../universe/map.html) does, but must grow for citations and caveats. Do not truncate a status, limitation, or evidence link simply to force equal heights. A completion dialog should fit its real content and viewport rather than inherit a catalog-card height.

**Check:** With the longest known title and caveat, is every decision-relevant word reachable?

## 6. Let the grid adapt to available space

Keep level options in a regular grid, but reduce column count when controls become cramped; five columns are the current desktop/default arrangement ([current markup](../../src/index.html)). Research cards can use two columns on wide screens and one on narrow screens, following the [Universe Map layout](../../universe/map.html). Width should follow readable content and touch targets, not a fixed number of cards per row. Keep the canvas and its controls together as the viewport changes.

**Check:** At narrow phone width, tablet width, and desktop width, are labels readable, controls reachable, and horizontal scrolling absent?

## 7. Design with real content extremes

Prototype with a short level number and a late level, a small score and a six-digit score, a locked and current level, a short success message and a long failure reason. For research cards, include `UNKNOWN`, `INCONCLUSIVE`, a superseded record, and multiple source links. Prefer wrapping or a detail view to silent clipping. A card must never turn a provisional result into an apparent success through shortened text or a success color.

**Check:** Does the layout survive the longest labels and weakest evidence standing without hiding their meaning?

## 8. Specify every interaction state

Level options need default, hover where a pointer exists, visible keyboard focus, pressed, current, and locked states. Locked must also be programmatically disabled or clearly explained. Result buttons need focus and disabled feedback; a noninteractive stats panel should not look clickable. Research cards should distinguish links from surrounding text, with keyboard focus and a clear destination. Selection must remain visible without relying only on color. The current level picker already styles hover, current, and locked states ([current markup](../../src/index.html)); focus and pressed behavior deserve explicit review.

**Check:** Can someone complete level selection and result actions with a keyboard, and understand the state without hover?

## Use this guide in review

For each new card, record its audience, one decision it supports, required content, longest plausible content, interactive states, and narrow-screen behavior. Review a real rendered example at phone and desktop sizes. For research views, verify that the displayed status and linked source agree with the ledger before presenting the card as current evidence.
