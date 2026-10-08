# NEMESIS-PR68-REVIEW — PR #68 independent review and correction

Date: 2026-10-08 (America/Chicago). Starting PR revision: `9a90b8d5942f547ca58cef50cd7a47e46f712399`.

## Established findings

1. **Cold calculations block unrelated HTTP requests.** On this checkout's 26 replay-valid recorded boards, the original synchronous list took 25.9 seconds shipped / 58.0 seconds wider-search, versus 81 / 93 milliseconds with the respective caches warmed. A separate HTTP client requested `index.html` 100 milliseconds after starting a cold wider-search list: the static response waited 71.7 seconds. This exceeds the declared two-second responsiveness oracle. The HTTP cold list finished in 71.8 seconds. These are operational wall-time probes under local machine load, not a scientific policy-speed comparison or a revised RESULT-0082 claim.
2. **An incomplete board query silently selects a different seed.** Compiling the original PR's server source and requesting `/api/nemesis?level=54` returned HTTP 200 with seed zero. This is a pre-existing endpoint defect reproduced during this review, not attributed to the policy-selector change. Missing, empty, negative, and out-of-range seeds are now rejected with HTTP 400.

## Correction and execution bounds

The server now awaits one lazy simulation worker. The worker reuses the original frozen chooser and target-stop runner through unchanged `tools/nemesis.js`. Recording discovery/replay and simulations occur off the HTTP thread. There is no extra runtime dependency.

- At most four distinct calculations are pending per server, including the running calculation; identical in-flight queries share their promise.
- Each calculation has a 120-second deadline including queue time. Active timeouts terminate the worker before starting another; queued timeouts remove the queued job. Overload, timeout, and worker failure return HTTP 503 with an error, never a fabricated bot outcome.
- The worker retains at most 128 exact results in a least-recently-used cache. Keys remain policy + level + seed. Eviction only causes recomputation. A worker restart drops its cache; no historical result is edited.
- Server closure disposes of its worker. Unfinished CPU work remains bounded even if its client disconnects; there is no claim of immediate per-client cancellation.

The unchanged separate-client probe after correction returned the game page in 16 milliseconds while the cold wider-search list took 47.0 seconds. A warm list took 100 milliseconds and returned identical results. CPU cost has not disappeared: first-load waiting is still substantial. A corpus that exceeds the deadline may receive HTTP 503 repeatedly; pagination or durable incremental warm-up would be a separate change if owner play establishes that need.

## Request races and cache behavior

No policy-contamination or stale-response correctness defect was established in the existing browser guards. Controlled tests verify that a superseded list success/failure cannot overwrite the new selection; overlapping polls cannot roll back a newer attempt count; polling retains the selected opponent; Back and a subsequent Play invalidate old polls. These checks execute the actual inline client script with controlled responses; they do not constitute native browser or touch QA.

The unchanged API tests compare wider-search with the original frozen runner, preserve the shipped reference, and switch policies through one server cache. Added checks cover LRU eviction, concurrent duplicate calculations, static HTTP responsiveness during cold work, stalled active/queued deadlines, overload, cleanup, and partial board identities. Ten focused tests pass:

`node --test solver/tests/playServer.test.js solver/tests/nemesisClient.test.js solver/tests/nemesisWorker.test.js`

## Evidence and publication boundaries

The byte comparison against the starting PR leaves `src/game.js`, `solver/engine.js`, `solver/level-author.js`, `solver/bot.js`, `solver/policy-lab/play.js`, `solver/policy-lab/chooser.js`, `solver/policy-lab/resume-frozen-candidate.js`, and `experiments/RESULT-0082/` unchanged. The candidate SHA256 remains `c475648e8d9778208f8b92c1fbee16a4fc8a589efbcba239494d30d337a62d3f`. The shipped default and DECISION-0012/RESULT-0082 standing remain unchanged.

Current main was merged to retain the repository's already-landed frozen-tree/closeout policies. The CURRENT conflict retained both navigation sections; LEDGER-INDEX was regenerated from the merged ledger. No new scientific run, seed reservation, evidence acceptance, or gate exception was created by this review.

The initial original-PR full suite on this Windows checkout had 748 passes, 15 failures, and one skip. In addition to the three deliberate receipt/map failures, it showed Windows slash and long-filename failures, citation checks missing the expected `origin/evidence/` reference, and pre-existing CURRENT navigation-pin drift. The original checkout's local portability remote was retained as `portability-source`; `origin` now names the verified owner's GitHub repository and its retained evidence branches have been fetched. No failing assertion or gate was weakened.

The integrated full run at `619a30cd` completed with **790 tests: 773 passed, 16 failed, one skipped**. The run began before the expected origin/evidence reference was restored. The failures fall into five groups:

1. Three documented candidate-receipt/Universe Map failures.
2. Windows path splitting and long-filename fixture failures.
3. Five retained closeout/audit failures: three report CURRENT navigation-pin drift; two report that the live verifier inventory differs beyond an older approved addition. These also touch main's already-landed verifier changes and remain outside this runtime correction.
4. Four freshness deadline/cleanup assertions plus one deterministic-denominator assertion failed in the concurrent run. An isolated sequential rerun of `freshnessInstall.test.js` and `greedDescriptorScreen.test.js` passed **16/16**, including all five affected tests. The full run remains red; the isolated result does not rewrite its total.
5. The experiment citation gate observed the absent origin/evidence reference during the concurrent run. Restoring the actual GitHub remote/reference made the unchanged experiment gate pass. The distinct ledger-authorship gate and diff formatting check also pass.

The related `connectionCapture.test.js` passes (one test), in addition to the ten focused Nemesis checks. No live recording-count change was observed in this review's copied corpus; the original report's concurrent owner-capture explanation was not reproduced. The Git-initialization fixture is itself frozen in `resume-reviewed-closeout-pin.json`, so it was not edited to erase a portability failure.

## Fresh independent Codex review

Fresh read-only reviewer `/root/pr68_final_review` (`codex-pr68-independent`) approved the runtime correction at `619a30cd`, against base `a7bbbea5`, with no blocking source findings and no writes. Its own unchanged separate-client probe measured cold 70.2 seconds, static response **94.7 milliseconds**, warm 138 milliseconds, 26 boards, HTTP 200 and identical cold/warm results. It independently ran the ten focused tests, both repository gates and diff checks, and checked protected bytes and ledger standings.

The reviewer identified two nonblocking coverage limits: the committed responsiveness regression tests response ordering rather than the precise two-second threshold (the independent external probe supplies that threshold here), and the shutdown test does not directly close during an actively executing job (the active cleanup path was reviewed in source). It did not perform native mobile QA or rerun the full suite. Its approval applies to the runtime correction; it does not accept the owner's gameplay task or promote scientific standing.

Native mobile-width/touch verification remains unperformed. Owner review of NEMESIS-POLICY-1 remains open; this technical review cannot supply it. PR #68 remains a draft until that recorded boundary is satisfied. A fresh GitHub Codex review is requested on the final published head; that review's live result is separate from this retained local review.

## GitHub review repair — active shutdown

GitHub Codex reviewed published head `d72aa7ce` and raised P2 comment `4215937353`: a server close event fires only after active HTTP requests drain, so event-only worker disposal delayed cancellation. This is an established lifecycle defect in the initial worker correction. The first local reviewer had identified the missing active-shutdown test as a coverage gap; its initial source reasoning did not catch the server-event ordering.

The new active-request regression failed before repair (HTTP 200 instead of cancellation's HTTP 503). The server now calls the runner's close method when `server.close()` is invoked, before delegating to the original HTTP close method. Normal callback/return behavior is retained; the close-event hook remains defensive. Shutdown rejects pending Nemesis work and initiates worker termination rather than waiting for its calculation/deadline.

The repaired suite passes 12 focused tests, including the new shutdown test and the related Connections capture check. These tests retain the original API/default/frozen-runner checks. A fresh independent recheck and a final-head GitHub re-review are required after this repair; owner review and native mobile QA remain open. The full-suite counts above are retained snapshots of the earlier heads, not a green claim for the repair.

Fresh independent recheck of the repaired runtime passed: 11/11 focused Nemesis tests, an active-plus-two-queued shutdown probe returning three HTTP 503 cancellations, unchanged close callback/return semantics, both evidence gates, and a refreshed clean diff check. The reviewer confirmed exact runtime and test blobs; a stale whitespace observation was superseded by its refreshed PASS. Connections capture additionally passes in the parent 12/12 run. This closes the technical shutdown finding locally; final published-head GitHub review remains separate.

## Queued-policy deadline correction

Final-head GitHub Codex review of 01716ccf raised P1 comment 4216185731. In its 26-board probe, isolated Shipped and Wider-search lists completed in 48.4s and 83.3s, but queuing the selected policy behind the obsolete initial list returned 503 at 120.1s. This establishes the previously hypothetical corpus/deadline failure. A deterministic two-job regression also failed before correction: two 650ms calculations individually fit a 1000ms limit, but the queued second job exhausted its allowance while waiting.

The deadline now starts when a job becomes active. One worker, four total pending jobs, duplicate coalescing and the 128-entry exact-result cache remain unchanged. Each calculation retains a 120-second execution allowance and active timeout terminates the worker before starting queued work. Total wait is bounded by the finite queue and per-active-job limits, apart from worker startup/termination scheduling overhead; a selected job can still wait behind earlier work. This is not cancellation of obsolete client work or an incremental list design.

The repaired parent suite passes 13/13 focused checks, including queued policy success, active timeout/restart, overload, cache identity, request ordering, shutdown and Connections capture. Independent recheck and published-head review evidence are tracked separately.

## Owner workflow corrections

The owner clarified that PRs are not drafts and mobile QA is not part of this repository workflow. Earlier draft/mobile-QA requirements in this receipt are superseded; neither is an outstanding requirement. The owner assigned PR lifecycle responsibility to this agent. The original gameplay task's owner review remains separate from technical PR review: no owner acceptance, scientific standing promotion or shipped-default replacement is recorded by this lifecycle work.

Independent fresh Codex recheck passed for exact worker blob 68ba072a5b8eda97cfdb46f6e4966359d58b064f and test blob 0c7bdbdb93a62e43cb2261d66d7b4f99aff806af: 13/13 focused checks, queue allowance, active stall termination, overload/slot release, duplicate coalescing, shutdown, cache, diff check and both evidence gates. The fourth distinct request may wait through three prior active allowances; that finite tradeoff is explicit. No protected scientific source changed and no owner gameplay acceptance was supplied.
