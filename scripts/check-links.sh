#!/usr/bin/env bash
# Check every http(s) URL referenced in docs/config.js and docs/instruments/*.js
# actually resolves. Runs both by hand (a human or AI assistant picking the
# repo back up, the same way D2's `curl -sI` checklist is applied by hand
# before bumping the Open MCT CDN pin) and on a weekly schedule via
# .github/workflows/check-links.yml (DECISIONS.md D45) — sas0's one CI job,
# deliberately narrow in scope and separate from the build/deploy process
# CLAUDE.md says sas0 doesn't have.
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

# A non-UTF-8 shell locale (e.g. LANG="", LC_CTYPE=C — seen on a stock macOS
# shell) makes grep mishandle multi-byte Japanese characters mid-URL,
# truncating them into garbled paths that spuriously FAIL even though the
# real URL is fine. GitHub Actions' runner already defaults to a UTF-8
# locale (confirmed: CI's actual FAIL list has never shown this), so this is
# purely for whoever runs the script by hand on a differently-configured
# shell — matching a false alarm hit locally while investigating D68/issue #4.
export LC_ALL=en_US.UTF-8

# Stops at ASCII/JP quote and bracket punctuation that shows up around URLs
# in this codebase's comments and JSDoc-citation strings (e.g. D6's
# "（https://...）" attribution format), not just whitespace.
urls=$(grep -rhoE "https?://[^\"'\` )）、。」\${}]+" docs/config.js docs/instruments/*.js | sort -u)

# Base-URL templates for runtime string concatenation, and one XML namespace
# identifier (not a URL template, but not a fetchable page either) — none of
# these are pages to check, and they always FAIL/expected to (D22, D68).
# Skipped rather than counted, so neither a human nor the weekly workflow has
# to keep dismissing them.
known_templates="
https://www.jma.go.jp/bosai/warning/data/r8/
https://www.jma.go.jp/bosai/weather_map/data/png/
https://cyberjapandata.gsi.go.jp/xyz/cp
https://www.jma.go.jp/bosai/amedas/data/map
https://www.jma.go.jp/bosai/jmatile/data/nowc
http://www.w3.org/2000/svg
"

fetch_status() {
  curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 \
    -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" \
    "$1" 2>/dev/null || echo "000"
}

# Which HTTP statuses are worth trying again. A 404/410 is the site telling
# us the page is genuinely gone — retrying it just makes the run slower
# without ever changing the answer. Timeouts/connection failures (000),
# rate limits (408/429), any 5xx, and 403 (this repo's municipal sites are
# frequently WAF-fronted and answer the first hit from a new IP with a block)
# are the ones that actually flip to 200 on a second look. See DECISIONS.md D72.
is_transient() {
  case "$1" in
    000 | 403 | 408 | 429 | 5??) return 0 ;;
    *) return 1 ;;
  esac
}

# Total attempts per URL, including the first. Was 2 (one retry) until D72:
# Issue #6 was a 今金町 503 that survived both attempts in CI, yet answered
# 200 on the very next request by hand — with 199 URLs checked weekly, at
# least one flaky host per run is close to guaranteed, and a tracking issue
# that cries wolf every week stops being read at all.
MAX_ATTEMPTS=3

fail=0
total=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  if grep -qxF "$url" <<<"$known_templates"; then
    printf 'SKIP %-5s %s\n' '-' "$url"
    continue
  fi
  total=$((total + 1))
  status=$(fetch_status "$url")
  attempt=1
  # Retries absorb the transient bot-protection/rate-limit flakes this repo
  # has repeatedly seen (Incapsula-fronted sites, occasionally a non-ASCII
  # path) — see DECISIONS.md D34, D45, D72. Backoff is 3s then 9s; a
  # definitively-dead status (404/410) breaks out immediately.
  while [[ ! "$status" =~ ^[23] ]] && is_transient "$status" && [ "$attempt" -lt "$MAX_ATTEMPTS" ]; do
    sleep $((3 ** attempt))
    status=$(fetch_status "$url")
    attempt=$((attempt + 1))
  done

  if [[ "$status" =~ ^[23] ]]; then
    if [ "$attempt" -gt 1 ]; then
      printf 'OK   %-5s %s (after %d attempts)\n' "$status" "$url" "$attempt"
    else
      printf 'OK   %-5s %s\n' "$status" "$url"
    fi
  else
    printf 'FAIL %-5s %s\n' "$status" "$url"
    fail=$((fail + 1))
  fi
done <<<"$urls"

echo "---"
echo "$((total - fail))/$total OK"
[ "$fail" -eq 0 ] || exit 1
