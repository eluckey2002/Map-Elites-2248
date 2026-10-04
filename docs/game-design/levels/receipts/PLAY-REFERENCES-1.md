# Retained games available for owner play — 2026-10-02

Producer: codex. Reviewer: owner. Standing: submitted, not self-accepted.

Owner asked to play the selected games while design work continues. Supplied
the two retained Delivery references and current Connection Run exploration.
This does not select another archetype or accept the collection.

- Delivery Staggered: http://127.0.0.1:8282. Restarted on its free original port.
- Delivery Landing: http://127.0.0.1:8283. Existing server left running.
- Connection Run: http://127.0.0.1:8281. Restarted current optional-combinations
  version on its free original port, not a historical 8279/8280 UI.

Actual availability check: all pages and app/style/core/model assets returned
HTTP 200. Served page text matched the corresponding local index.html; served
browser model text matched the shared model plus local wrapper assembled by
each server. Live identities matched hashes of core plus those exact rules:

- Staggered: `a6596b88bcfb26258c8f0934885d43dc4c38e3d87ad7035dc20f42206df02b11`.
- Landing: `857bd65fca0f2bb2cac11d8aa9760861c5473405802738e79c0ea0ed899cc909`.
- Connection Run: `5bf20e44309a717cb1ebb8d3175883b67a729cca721ca6d1c4cd3767cff03cf4`.

Used frontend-testing-debugging's local-server scope to preserve the exact
host and use the established launchers. This was availability verification,
not new rendered interaction, console, screenshot or touch QA. No browser
fallback, dependency install, gameplay edit, capture rewrite or server stop.
Keep the owner's existing Connection Run session URL to continue saved play;
the bare link starts a new capture. Delivery reload/restart starts fresh.

Task was created before restart, but an invalid claim command was noticed
after the two servers started. Corrected claim and logged the ordering/syntax
friction. Initial identity expectation used the Node model alone and failed;
read the wrappers and reran against the exact assembled browser rules. The
corrected checks passed. No game source was changed to satisfy the check.

Separately, PDL-025 and navigation record the owner's agreement to park the
Turn archetype version. All 80 runtime JS/HTML/CSS and protected engine/game
files matched their pre-disposition hashes. All 146 local documentation links
checked; ledger has one new PDL-025 after PDL-024; whitespace check passed.
Older archives are unchanged and predate the new disposition. TURN-BOARD-1
remains formally submitted; its attached receipt carries the owner parking
decision rather than inventing accept/repair workflow approval.

Next concept-selection decision remains open. No Heat build or other new
mechanic, release, commit, push or final portfolio acceptance authorized here.
