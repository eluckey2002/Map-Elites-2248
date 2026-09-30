# LC-0015 — Prospective survivor-path panel

**Step:** Prospective landing-path review

**Objective:** Across all 14 frozen LC-0012 pairs, determine whether the faster arm's first-action survivor immediately belongs to a legal small-to-large path through more value that was already prepared on the common board.

**Finding:** No. Among the 13 pairs with a faster arm, the larger immediate survivor path agrees with the faster arm in 6, points to the slower arm in 4, and ties in 3. The remaining pair ties on target cost even though the wait arm has the larger prepared-value path. Immediate survivor-path value is therefore useful board description, but it does not distinguish the fixed panel and cannot support a timing rule by itself.

**Next step:** Before defining a metric, inspect the seven non-tied misses to identify the exact later merge, gravity move, or refill that first turns each survivor into a complete legal chain. The unresolved property is path formation over time, not merely whether a path is complete immediately after the first action.

## What was measured

For each of the 28 retained arms, the diagnostic replayed only the frozen first action and then stopped. From that post-action board it exhaustively enumerated every distinct legal board action containing the survivor. A board action is distinct by its final cell and consumed-cell set; alternate traversal orders that produce the same action collapse together.

For each arm, the artifact retains the survivor landing, full post-action board, exact search count, and witnesses for the maximum prepared common-board value, prepared root count, points, and chain length. Outcome labels were joined only after both arms' post-action structures were complete.

"Prepared value" means the value already present at the common decision state. Untouched common-board tiles contribute their value; the first-action survivor contributes the values merged into it; first-action refills contribute zero prepared value.

## Exact panel result

| Result class | Count |
|---|---:|
| Faster-arm agreement | 6 |
| Slower-arm reversal | 4 |
| No direction on a non-tied outcome | 3 |
| Target-cost tie | 1 |

The three wait-faster cases deliberately remain visible:

- `ed62dd5655e8…`: wait 7,168 prepared value versus cash 6,144 — agreement.
- `b068afb04eb9…`: wait 0 versus cash 2,944 — reversal.
- `ecc4053a8c93…`: wait 0 versus cash 0 — no direction.

The named helpful-cash counterexample `9cd33937c5c0…` is especially informative: neither post-first-action survivor belongs to a complete legal chain yet, so both values are zero. LC-0014 established that the cash survivor is later reused in the decisive chain. Together, the two results show that the useful path can be created after landing; requiring it to be complete immediately is too strict.

Five of the ten cash-faster cases are counterexamples to an immediate-path timing rule: three initially favor waiting and two tie at zero.

## Evidence and boundary

- Source: `LC-0012-early-ready-timing-panel-raw.json`, SHA-256 `707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f`, internal identity `dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff`.
- Artifact: `LC-0015-landing-path-panel.json`, SHA-256 `0abb6e924d16e2c28829c18df4714d3d0cd4b6ad56e1d6cb5f5c954d7d4d213d`, internal identity `d86bdb8123384a6d65e29c88dbd91128ff99c72a5ced27b6702b59037a4aea0d`.
- Derivation: `tools/diagnose-lc0015-landing-path-panel.js`, SHA-256 `5a0a7d3acc48234933f8b4212f515f1212db89949a1e9d96057bf519af8fb092`.
- Regression test: `solver/tests/lc0015LandingPathPanel.test.js`, SHA-256 `e5ce47374cbb55cbf69cec7d00fc07535f56c4d148b1772aeeed78c0869f334f`.
- An independent pre-existing exact enumerator reproduces the legal-path counts and prepared-value maxima for both LC-0014 example pairs.
- This is an exact result for the 14 retained pairs only. It is not a fitted metric, a population claim, or authority to change the policy or champion.
