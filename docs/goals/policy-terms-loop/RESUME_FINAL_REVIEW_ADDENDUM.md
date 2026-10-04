# RESULT-0082 final review addendum

Codex finding 4177626668 on published commit 9784ec8966 demonstrated that the
retained custody audit's simplified path history could miss a restored edit on
a merged branch. Its source and original closeout pin remain unchanged.

The current completion entry point is `resume-reviewed-closeout.js`. It requires
a separate anchored pin, executes `resume-reviewed-proof.js` first, and then
executes all original checks. The stronger proof checks full ordinary history
and the actual bytes at every selected merge result. It rejects hidden side
branch edits, merge-only edit/restore, and deleted trust inputs, while allowing
an unchanged registered input inherited from the second parent of a CI merge.
The LIVE regression invokes this entry point during the full suite, making this
additional proof required in CI as well as the actual terminal audit.

Run `node docs/goals/policy-terms-loop/resume-reviewed-closeout.js --terminal`
for the fresh full suite and all original gates/audits. Run the same command
with `--verify` for the executed retained-result verification. The older
receipts and commands retain their historical scope; they are supplemented
by these current reviewed entry points and their separate receipts.

This is a read-only acceptance repair, not a scientific rerun or changed
preregistration. The candidate, raw pairs, verdict, report, closure, ledger,
accounting, frozen measurement sources, validator/baseline bytes, and every
earlier pin remain unchanged. The actual full-history custody check passes.
The result remains provisional, with no checked_by, policy adoption or PR merge.
