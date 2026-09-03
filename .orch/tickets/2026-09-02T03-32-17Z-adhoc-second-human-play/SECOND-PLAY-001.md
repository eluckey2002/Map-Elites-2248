---
id: SECOND-PLAY-001
run: 2026-09-02T03-32-17Z-adhoc-second-human-play
status: complete
executor: prototype
independence: checker
depends_on: []
write_scope:
  - /private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/
excluded_actions:
  - modify the qualified HUMAN-PILOT-0001 subject or launcher
  - modify production levels, game rules, scoring, solver policy, ledger, or backlog
  - claim calibration, causal isolation, selection authority, or accepted evidence
bound: 30 minutes
claimed_by: /root
claimed_at: 2026-09-02T03:32:17Z
---

## Objective

One explicitly exploratory browser-play contrast is live: it preserves HUMAN-PILOT-0001's seed and core level settings, replaces its blockers with two horizontally adjacent center stones, records to its own directory, and leaves the qualified first-pilot path unchanged.

## Fixed inputs

- Worktree: `/private/tmp/2248-human-pilot-20260901` at `6b316be3415274f11d0629f2d9f1a26172d55e46`.
- Base subject: `pilots/HUMAN-PILOT-0001/candidate.json`, candidate identity `4db4d815f7f36f59b2710b195a56a1a36b35053a5c19ad283db679b6c4f7876d`, seed `424242`.
- Existing browser and recording seam: `src/game.js` plus `solver/authoring-server.js` in the fixed worktree.
- Owner-selected contrast: retain the four-column board and exercise a two-adjacent-center-blocker chokepoint.

## Completion test

1. `pilots/HUMAN-PILOT-0002/manifest.json` labels the subject `exploratory`, identifies the inherited target as uncalibrated for this blocker layout, and forbids causal or selection claims; `candidate.json` preserves grid 4x8, minChain 3, 24 moves, target 126000, tileScale 32, and names exactly two stones at `(1,3)` and `(2,3)`. Oracle: a pre-specified Node assertion reading those two files and calling `solver/level-author.validateCandidate`; oracle_class: deterministic; provenance: pre-existing.
2. The subject binding's candidate identity equals `solver/level-author.identity(candidate)`, and the live `/api/candidates/54` response returns that same candidate and identity. Oracle: pre-specified Node identity assertion plus `curl`/`jq` equality check; oracle_class: deterministic; provenance: pre-existing.
3. `node pilots/HUMAN-PILOT-0002/serve.js` exposes one stable URL on `127.0.0.1:2249` with candidate `54`, fixed seed `424242`, and a dedicated recording directory; the HTML and candidate API both return HTTP 200. Oracle: live `curl` status checks against the listener; oracle_class: evidence; provenance: pre-existing.
4. The qualified first-pilot artifacts and launcher remain byte-identical to their pre-work identities. Oracle: `git diff --exit-code -- pilots/HUMAN-PILOT-0001 tools/human-pilot.js`; oracle_class: deterministic; provenance: pre-existing.

## Return fields

- status
- result identity
- exact URL
- verification verdicts for criteria 1-4
- explicit evidence-standing limitation
- feedback
- risks

## Result

- status: `prepared-live`
- result identity: subject `d06b1679b0984eaec4e6193b51e0216768a7f2dcb48029e2d149c6ba046cd595`
- candidate identity: `0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4`
- exact URL: `http://127.0.0.1:2249/index.html?candidate=54&seed=424242`
- live server session: `53849`
- changed artifacts:
  - `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/shape.json`
  - `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/candidate.json`
  - `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/subject-binding.json`
  - `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/manifest.json`
  - `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/serve.js`
- recording destination: `/private/tmp/2248-human-pilot-20260901/pilots/HUMAN-PILOT-0002/recordings/` (empty at launch)
- evidence-standing limitation: this is an exploratory, inherited-target contrast. It carries no calibration, causal, selection, shipping, rejection, or accepted-evidence authority. A saved recording still requires exact replay qualification.
- join disposition: `accepted`; all frozen criteria passed with pre-existing oracles, the inline executor matched `claimed_by`, and every changed artifact is inside the ticket's write scope.

## Verification

1. `PASS` — oracle: pre-specified Node assertions plus `validateCandidate`; oracle_class: `deterministic`; evidence: exact 4x8/3/24/126000/32 candidate with two stones at `(1,3)` and `(2,3)`, manifest standing `exploratory`, and all required non-claims present; covered identities: candidate `0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4`, manifest at prepared state.
2. `PASS` — oracle: `solver/level-author.identity` plus live candidate API; oracle_class: `deterministic`; evidence: local and served candidate identity both `0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4`; covered identities: candidate, subject binding, live API response.
3. `PASS` — oracle: live HTTP checks; oracle_class: `evidence`; evidence: HTML returned `200`; `/api/candidates/54` returned level `54`, 4x8, two blockers, and the exact candidate identity; covered identities: server session `53849`, exact URL, candidate and binding.
4. `PASS` — oracle: `git diff --exit-code -- pilots/HUMAN-PILOT-0001 tools/human-pilot.js`; oracle_class: `deterministic`; evidence: exit `0`, empty output; covered identities: qualified first-pilot directory and launcher at worktree HEAD `6b316be3415274f11d0629f2d9f1a26172d55e46`.

## Feedback

- The generic `prototype` executor's terminal-app branch did not fit an existing browser game; the task reused the qualified authoring server instead and logged the misrouting.
- A non-acceptance smoke diagnostic found a legal opening and a complete 24-move machine path. Its score is intentionally withheld from the owner to avoid biasing human play.

## Risks

- The target is inherited rather than recalibrated for the changed blocker layout.
- The contrast changes blocker type, count, and placement together, so any human difference cannot be attributed to placement alone.
- Listener availability is runtime state. If server session `53849` ends, criterion 3 invalidates and the one-command launcher must be rerun.
- The recording directory was empty at launch; no play outcome or replay verdict exists yet.
