#!/usr/bin/env bash
# Check every http(s) URL referenced in docs/config.js and docs/instruments/*.js
# actually resolves. A manual maintenance tool, NOT part of the build or deploy —
# sas0 deliberately has no CI (see CLAUDE.md); this is meant to be run by a
# human or AI assistant picking the repo back up, the same way D2's
# `curl -sI` checklist is applied by hand before bumping the Open MCT CDN pin.
#
# Usage: scripts/check-links.sh
#
# A FAIL doesn't always mean the link is actually dead — some sites (see
# DECISIONS.md D20's river.go.jp note) block plain `curl` via bot-detection
# and only work with a browser-like User-Agent, or work fine in a real
# browser but not headless curl at all. Treat FAIL as "go check this one by
# hand" (curl -sIL, then a real browser if still unclear), not as proof.

set -uo pipefail
cd "$(dirname "$0")/.."

# Stops at ASCII/JP quote and bracket punctuation that shows up around URLs
# in this codebase's comments and JSDoc-citation strings (e.g. D6's
# "（https://...）" attribution format), not just whitespace.
urls=$(grep -rhoE "https?://[^\"'\` )）、。」\${}]+" docs/config.js docs/instruments/*.js | sort -u)

fail=0
total=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  total=$((total + 1))
  status=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 \
    -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" \
    "$url" 2>/dev/null || echo "000")
  if [[ "$status" =~ ^[23] ]]; then
    printf 'OK   %-5s %s\n' "$status" "$url"
  else
    printf 'FAIL %-5s %s\n' "$status" "$url"
    fail=$((fail + 1))
  fi
done <<<"$urls"

echo "---"
echo "$((total - fail))/$total OK"
[ "$fail" -eq 0 ] || exit 1
