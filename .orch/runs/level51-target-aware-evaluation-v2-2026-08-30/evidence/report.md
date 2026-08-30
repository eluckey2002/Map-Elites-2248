# Level 51 human-strategy learning result

## Verdict: SUPPORTED

The two human Level 51 replays exposed a useful rule that generalized: when an alternate legal route can reach the target immediately, take it instead of preserving a tidier tile for a future move that the game will never need.

This is a narrow endgame lesson, not a replacement playing style. The experimental challenger behaves exactly like the existing champion until an untrimmed route can win now. It also refuses this override while a bomb is present. The champion itself was not changed.

## What the human play taught

On the training-only Level 51 seed 1, the champion needed 17 moves. The human recordings won in 12 and 14 moves. Exact replay analysis showed that the human frequently used longer routes that the champion's normal candidate generator trimmed away to leave a merge-friendly survivor.

That trimming is sensible while the game continues. On the winning move, however, preserving the survivor has no value. The extracted rule therefore relaxes the trimming only when the resulting move reaches the level target immediately. It does not enable the previously falsified “always offer the full route” behavior.

On that same training example, the fixed challenger reached the target in 13 moves instead of 17. That example motivated and diagnosed the rule; it was not counted as proof that the rule generalizes.

## Unseen-case result

The one sealed holdout compared champion and challenger on all 52 shipped levels and 300 fresh seeds per level: 15,600 paired games.

| Outcome | Paired games |
| --- | ---: |
| Both won; challenger reached target sooner | 9,354 |
| Both won in the same number of moves | 6,186 |
| Both won; challenger was slower | 0 |
| Champion won; challenger lost | 0 |
| Champion lost; challenger won | 9 |
| Both lost | 51 |

The challenger saved an average of 1.271 moves per paired game, with a median saving of 1 move. The conservative level/seed-clustered test was strongly positive (`t = 15.68`, required `t > 3`). Faster results appeared on all 52 levels, far beyond the required 10. The champion won 15,540 cases; the challenger won 15,549.

Level 51 was not carrying the result by itself. On its 300 unseen seeds, the challenger was faster in 179 games, tied in 121, and never slower, averaging 1.36 moves saved. Every other shipped level also had at least one faster case.

The preceding 520-case screen told the same story: 304 existing wins became faster, one champion loss became a challenger win, and there were no slower games or lost wins. Screen and holdout seeds were disjoint.

## What “better” means here

This challenger is better for the tested objective: reach the existing target in fewer moves without losing wins. It is not better at maximizing score after the target has already been met, because the game ends at the target. Its terminal score averaged 970 points lower than the champion's across the holdout precisely because it often stopped earlier with less overshoot. If “highest possible score” were the objective, this experiment would not support the challenger.

The extra route search cost about 1.45 times the champion's compute in the holdout. That is a real tradeoff even though gameplay results improved.

Zero observed regressions is not a proof that no unseen board can regress. The rule has a structural safety boundary—override only for an immediate win and never while a bomb is present—and the fixed sample found zero lost wins and zero slower wins. Promotion should still be a separate owner decision with an implementation review.

## Evidence and boundary

- Fixed challenger code identity: `c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7`.
- Screen artifact identity: `b4416954a024f790ac8aa1ad5a94c95f075d46bcf9a564c83b02ffce87f469bf`.
- Holdout artifact identity: `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0`.
- Independent verification SHA-256: `5bdf5baa5b55672337d52379d5b43920671f5ae2e9ef4a8fd0d51063010e41e9`.
- All frozen gates passed. Protected champion, engine, levels, targets, receipts, recordings, calibration, and authoring surfaces remained unchanged during evaluation.
- Focused tests passed 12/12; the full solver suite remained 205/208 with exactly the same three documented receipt-identity failures, which were not changed or suppressed. The MAP-Elites artifact and all three representative replays still verify exactly.

The supported next decision is whether to prepare this narrow rule for promotion. This result does not promote it automatically.
