#!/usr/bin/env bash
set -euo pipefail

# No arg = check staged changes (for pre-commit).
# Arg given = diff against that ref (for CI, comparing against PR base).
if [ -n "${1:-}" ]; then
  DIFF=$(git diff "$1"...HEAD -- '*.tsx' '*.ts' 2>/dev/null || true)
else
  DIFF=$(git diff --cached -- '*.tsx' '*.ts' 2>/dev/null || true)
fi

MATCHES=$(echo "$DIFF" | grep -E '^\+' | grep -Ev '^\+\+\+' | grep -F 'dangerouslySetInnerHTML' || true)

if [ -n "$MATCHES" ]; then
  echo "❌ New dangerouslySetInnerHTML usage found:"
  echo "$MATCHES"
  echo ""
  echo "This renders raw HTML and is a stored/reflected-XSS risk if any part of"
  echo "the string is derived from user or API input. The one existing use"
  echo "(app/root.tsx, a static inline script) predates this check and is not"
  echo "re-flagged since it's outside the diff — it is not a template to copy."
  echo "If this new usage is genuinely necessary and the HTML is fully"
  echo "static or already sanitized, get it reviewed rather than merging past"
  echo "this check."
  exit 1
fi

echo "✅ No new dangerouslySetInnerHTML usage found."
