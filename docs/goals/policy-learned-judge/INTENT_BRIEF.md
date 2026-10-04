# Policy-learned judge — intent brief

**Owner selection:** SELECTED by the owner on 2026-10-04. Goal 3, revision 5.
**Assigned result:** RESULT-0083, replacing RESULT-0081 everywhere after the remote branch check.

## Goal

Test whether a learned judge of the board can beat the champion's hand-written guesses at reaching the target in fewer moves. The judge predicts moves remaining until the target; the policy keeps the champion's candidate generator and blends in the judge's average prediction over 3 sampled spawn sets. Loop: play with exploration, fit, play with the new judgment, test, repeat; then confirm at most one frozen candidate once.

## Why

Earlier weight searches found no improvement; consult RESULT-0058 for its narrow measured scope and RESULT-0014 for the harvest term's evidence. A learned judge changes the representation rather than the weights, and per-move labels provide more information than one number per game.

## Non-goals

Do not edit solver/bot.js, anything under solver/ruler/, or experiments/RESULT-0058/. The champion's candidate generator stays unchanged. Do not train on, gate with, or confirm with recorded human sessions. No neural networks: use ridge regression as frozen in the exploration plan. Do not promote or adopt anything.

## Stakes

Tier 1. Local and reversible. Only the owner may change the goal, non-goals, stakes tier, or effort bound.

## Effort bound

Stop after 6 rounds plus one confirmation, or 90,000 games, whichever comes first. One level/seed/policy play is one game; a paired cell costs two unless the block's reference is shared and counted once. Budgets: training 10,000; per-round gate, recheck and simple judge 30,000; controls 15,000; confirmation 20,000 reserved for confirmation only; overhead 5,000; buffer 10,000. At most four worker threads. Measure real wall time in round 1 and restate the estimate because sampled-spawn lookahead costs roughly K times a normal game.

## Publication boundary

One worktree based on current origin/main. Finish at an open pull request, green experiment gate, completed Codex review, and every finding answered. Do not merge. Keep the ledger provisional, written_by identified, checked_by absent. No sub-agents. Protected files, closure paths A to E, thresholds, seed range 70,000,000–79,999,999, and the owner-selected revision 5 remain binding.
