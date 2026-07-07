#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:?Usage: check-no-hardcoded-hex.sh <base-sha-or-ref>}"

# Only flag ADDED lines, only in ts/tsx/css, excluding the theme file
# (app/app.css is where legitimate token definitions live).
DIFF=$(git diff "$BASE_REF"...HEAD -- '*.tsx' '*.ts' '*.css' ':!app/app.css' 2>/dev/null || true)

MATCHES=$(echo "$DIFF" | grep -E '^\+' | grep -Ev '^\+\+\+' | grep -oE '#[0-9a-fA-F]{3,8}\b' || true)

if [ -n "$MATCHES" ]; then
  echo "❌ Hardcoded hex color(s) found in this PR's diff:"
  echo "$MATCHES" | sort -u
  echo ""
  echo "Use DaisyUI semantic classes or theme tokens in app/app.css instead."
  exit 1
fi

echo "✅ No hardcoded hex colors found in diff."