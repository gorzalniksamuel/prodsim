#!/usr/bin/env bash
# Tests for scripts/ensure-env.sh. Self-contained; runs a copy of the script in a temp tree.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../ensure-env.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1"; fail=1; }

new_tree() {
  rm -rf "$TMP/tree"
  mkdir -p "$TMP/tree/scripts" "$TMP/tree/deploy/compose"
  cp "$SCRIPT" "$TMP/tree/scripts/ensure-env.sh"
  cat > "$TMP/tree/deploy/compose/.env.example" <<'EOT'
PRODSIM_ENVIRONMENT=prod
PRODSIM_SECRET_KEY=change-me
POSTGRES_USER=prodsim
POSTGRES_PASSWORD=change-me
EOT
}

run_env() { # sets OUT and RC
  set +e
  OUT="$(cd "$TMP" && bash "$TMP/tree/scripts/ensure-env.sh" 2>&1)"
  RC=$?
  set -e
}

ENV="$TMP/tree/deploy/compose/.env"

# Missing .env: created with generated secrets.
new_tree; run_env
if [ "$RC" -eq 0 ] && [ -f "$ENV" ] && ! grep -q '=change-me' "$ENV" \
   && grep -qE '^PRODSIM_SECRET_KEY=[0-9a-f]{64}$' "$ENV"; then
  ok "creates .env with generated secrets"
else
  bad "creates .env (rc=$RC: $OUT)"
fi

# Existing, configured .env: left alone, exit 0.
new_tree
printf 'PRODSIM_SECRET_KEY=%s\nPOSTGRES_PASSWORD=abc123\n' "$(printf 'a%.0s' {1..64})" > "$ENV"
before="$(cat "$ENV")"
run_env
if [ "$RC" -eq 0 ] && [ "$(cat "$ENV")" = "$before" ]; then
  ok "keeps an existing configured .env"
else
  bad "keeps an existing configured .env (rc=$RC: $OUT)"
fi

# Existing .env still holding placeholders: refuse, name each variable, explain the fix.
new_tree
printf 'PRODSIM_SECRET_KEY=change-me\nPOSTGRES_USER=prodsim\nPOSTGRES_PASSWORD=change-me\n' > "$ENV"
before="$(cat "$ENV")"
run_env
if [ "$RC" -ne 0 ] && grep -q 'PRODSIM_SECRET_KEY' <<<"$OUT" && grep -q 'POSTGRES_PASSWORD' <<<"$OUT" \
   && ! grep -q 'POSTGRES_USER' <<<"$OUT" && grep -qi 'delete' <<<"$OUT" \
   && [ "$(cat "$ENV")" = "$before" ]; then
  ok "refuses an existing .env with placeholders and names the variables"
else
  bad "refuses placeholder .env (rc=$RC: $OUT)"
fi

# Placeholder with CRLF line ending is still detected.
new_tree
printf 'PRODSIM_SECRET_KEY=change-me\r\n' > "$ENV"
run_env
if [ "$RC" -ne 0 ] && grep -q 'PRODSIM_SECRET_KEY' <<<"$OUT"; then
  ok "detects placeholder with CRLF line ending"
else
  bad "detects placeholder with CRLF (rc=$RC: $OUT)"
fi

exit "$fail"
