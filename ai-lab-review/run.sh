#!/usr/bin/env bash
# Three blind, independent Codex reviews of the AI Game Lab plan.
# Needs: codex CLI installed and logged in (npm i -g @openai/codex, then `codex login`).
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p output
for p in A-learning B-build C-research; do
  echo "=== Review $p ==="
  codex exec --full-auto --skip-git-repo-check -C . "$(cat prompts/common.md)

$(cat prompts/$p.md)" || echo "Review $p failed"
done
echo
ls -la output
