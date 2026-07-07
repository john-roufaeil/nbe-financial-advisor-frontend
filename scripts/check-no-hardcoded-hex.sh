#!/usr/bin/env bash
set -euo pipefail

# No arg = check staged changes (for pre-commit).
# Arg given = diff against that ref (for CI, comparing against PR base).
if [ -n "${1:-}" ]; then
  DIFF=$(git diff "$1"...HEAD -- '*.tsx' '*.ts' '*.css' ':!app/app.css' 2>/dev/null || true)
else
  DIFF=$(git diff --cached -- '*.tsx' '*.ts' '*.css' ':!app/app.css' 2>/dev/null || true)
fi

MATCHES=$(echo "$DIFF" | grep -E '^\+' | grep -Ev '^\+\+\+' | grep -oE '#[0-9a-fA-F]{3,8}\b' || true)

if [ -n "$MATCHES" ]; then
  echo "❌ Hardcoded hex color(s) found:"
  echo "$MATCHES" | sort -u
  echo ""
  echo "Use DaisyUI semantic classes or theme tokens in app/app.css instead."
  exit 1
fi

echo "✅ No hardcoded hex colors found."