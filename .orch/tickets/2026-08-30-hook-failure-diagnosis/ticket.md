# Hook failure diagnosis

- **question:** What hook associated with the evaluator-foundation work is failing, and what evidence establishes why?
- **source policy:** Recent evaluator session record; repository Git configuration and hook directory; frozen verifier evidence; current global Claude hook configuration and hook source only if the repository evidence excludes a Git hook.
- **bound:** Read-only diagnosis. No hook, repository source, global setting, or user data may be changed. Do not generalize beyond the identified failure.
- **acceptance criteria:**
  1. Distinguish a repository Git hook from evaluator verification and global assistant hooks.
  2. Name the observed failure and its proven cause, or state that the cause is unverified.
  3. Cite the primary paths or command evidence used.
- **oracles:** `git config --show-origin --get core.hooksPath`; executable hook inventory under the resolved Git directory; preserved `PRE_LEDGER_CHECK.md`; targeted syntax checks for any implicated global hook.
- **status:** complete

## Result

- **verification:** VERIFIED against the named repository-hook, preserved-verifier, and targeted hook-test oracles.
- **finding 1 — high confidence:** No repository Git hook failed. `core.hooksPath` is unset and `.git/hooks` contains only `.sample` files, so the evaluator commits did not invoke a repository hook.
- **finding 2 — high confidence:** The failed evaluator event was cold verification C3/C4, not a hook. `PRE_LEDGER_CHECK.md:45-46,140-160` records clean-checkout identity and byte mismatches. Repair commit `3a2f5bb` shows the cause at `solver/level-author.js`: raw source-byte hashing and fixed-LF output interacted with Windows CRLF checkout materialization. Canonical line-ending hashing and platform-newline serialization fixed it; Run 2 passed at `PRE_LEDGER_CHECK.md:259-280`.
- **finding 3 — high confidence:** The current global Claude prompt-audit hooks are not failing. Both files pass `node --check`; their end-to-end suite passes 33/33 and rotation passes 9/9.
- **contradiction:** Historical memory recorded a prompt-audit regression at 20 pass / 13 fail. Current source and executable tests contradict that as a present-tense claim; it is repaired or otherwise stale.
- **dead end:** The recent evaluator session record contains no hook-failure event, and the visible Git commit outputs contain no hook error.
- **gap:** If the user is referring to a UI-only hook notification not captured in the session record, its exact text and hook identity remain unavailable.
