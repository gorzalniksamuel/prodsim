#!/usr/bin/env bash
# Tests for scripts/check-repo-files.sh. Self-contained; uses a temp directory.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../check-repo-files.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1"; fail=1; }

FILES="LICENSE COMMERCIAL-LICENSE.md CLA.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md README.md"

new_tree() {
  local f
  rm -rf "$TMP/repo"
  mkdir "$TMP/repo"
  for f in $FILES; do echo x > "$TMP/repo/$f"; done
  printf 'PolyForm Noncommercial License 1.0.0\n\nRequired Notice: Copyright Samuel Gorzalnik (https://github.com/gorzalniksamuel)\n' > "$TMP/repo/LICENSE"
  echo "ProdSim is source-available." > "$TMP/repo/README.md"
}

run_check() { # sets OUT and RC
  set +e
  OUT="$(cd "$TMP/repo" && bash "$SCRIPT" 2>&1)"
  RC=$?
  set -e
}

new_tree; run_check
if [ "$RC" -eq 0 ]; then ok "full set exits 0"; else bad "full set exits 0 (rc=$RC: $OUT)"; fi

for f in $FILES; do
  new_tree; rm "$TMP/repo/$f"; run_check
  if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF -- "$f"; then
    ok "missing $f flagged"
  else
    bad "missing $f flagged (rc=$RC: $OUT)"
  fi
done

new_tree; echo "some other license" > "$TMP/repo/LICENSE"; run_check
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "PolyForm Noncommercial License 1.0.0"; then
  ok "LICENSE without title flagged"
else bad "LICENSE without title flagged (rc=$RC: $OUT)"; fi

new_tree; echo "PolyForm Noncommercial License 1.0.0" > "$TMP/repo/LICENSE"; run_check
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "Required Notice"; then
  ok "LICENSE without required notice flagged"
else bad "LICENSE without required notice flagged (rc=$RC: $OUT)"; fi

new_tree; echo "open source" > "$TMP/repo/README.md"; run_check
if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF "source-available"; then
  ok "README without source-available flagged"
else bad "README without source-available flagged (rc=$RC: $OUT)"; fi

exit "$fail"
