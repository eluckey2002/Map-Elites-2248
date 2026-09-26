#!/bin/sh
# One-time refresh for a clone checked out before `* text=auto eol=lf` landed.
#
# Git rewrites only files whose content changed, so on a Windows clone made with
# core.autocrlf=true, files checked out earlier keep CRLF after pulling the new
# .gitattributes. That breaks raw-byte identities (receipts, drift checks).
# This re-checks-out every tracked file under the current attributes.
#
# It overwrites the working tree, so it refuses to run with uncommitted or
# untracked changes. Commit or move them first.
set -e
cd "$(git rev-parse --show-toplevel)"
if [ -n "$(git status --porcelain)" ]; then
  echo "refresh-line-endings: REFUSED — working tree has changes. Commit or move them first:" >&2
  git status --short >&2
  exit 1
fi
git rm -r --cached -q .
git reset --hard -q
echo "refresh-line-endings: done. Files stored with LF are now checked out with LF."
git ls-files --eol | awk '{print $2}' | sort | uniq -c
