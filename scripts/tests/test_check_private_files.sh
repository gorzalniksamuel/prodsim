#!/usr/bin/env bash
# Tests for scripts/check-private-files.sh. Self-contained; uses a temp git repo.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../check-private-files.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1"; fail=1; }

new_repo() {
  rm -rf "$TMP/repo"
  mkdir "$TMP/repo"
  git -C "$TMP/repo" init -q
}

track() { # track <path>...
  for p in "$@"; do
    mkdir -p "$TMP/repo/$(dirname "$p")"
    echo x > "$TMP/repo/$p"
    git -C "$TMP/repo" add -f -- "$p"
  done
}

run_check() { # sets OUT and RC
  set +e
  OUT="$(cd "$TMP/repo" && bash "$SCRIPT" 2>&1)"
  RC=$?
  set -e
}

new_repo; track README.md; run_check
if [ "$RC" -eq 0 ]; then ok "clean repo exits 0"; else bad "clean repo exits 0 (rc=$RC: $OUT)"; fi

for f in CLAUDE.md .claude/settings.json docs/superpowers/specs/x.md .env apps/web/.env.local; do
  new_repo; track README.md "$f"; run_check
  if [ "$RC" -eq 1 ] && printf '%s' "$OUT" | grep -qF -- "$f"; then
    ok "flags $f"
  else
    bad "flags $f (rc=$RC: $OUT)"
  fi
done

new_repo; track README.md deploy/compose/.env.example; run_check
if [ "$RC" -eq 0 ]; then ok "allows .env.example"; else bad "allows .env.example (rc=$RC: $OUT)"; fi

exit "$fail"
