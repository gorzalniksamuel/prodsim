#!/usr/bin/env bash
# Stack smoke test: build, start, assert health, assert non-root, check web -> api proxy.
#
# Usage: scripts/smoke.sh [--teardown]
#   --teardown (or SMOKE_TEARDOWN=1) removes the stack and its volumes on exit; intended
#   for CI. Without it the stack stays up so `make e2e` can run against it.
# Works from any cwd. Non-interactive. Creates deploy/compose/.env if missing (like `make up`).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="$ROOT/deploy/compose"
WEB_URL="${E2E_BASE_URL:-http://localhost:3000}"
TEARDOWN="${SMOKE_TEARDOWN:-0}"
[ "${1:-}" = "--teardown" ] && TEARDOWN=1

compose() { docker compose -f "$COMPOSE_DIR/compose.yaml" "$@"; }
fail() { echo "SMOKE FAIL: $*" >&2; exit 1; }

on_exit() {
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "--- compose ps ---" >&2
    compose ps -a >&2 || true
    echo "--- recent logs ---" >&2
    compose logs --tail=40 >&2 || true
  fi
  if [ "$TEARDOWN" = "1" ]; then
    compose down -v --remove-orphans >&2 || true
  fi
  exit "$status"
}
trap on_exit EXIT

"$ROOT/scripts/ensure-env.sh"

echo "==> build + start (waiting for healthy)"
compose up -d --build --wait --wait-timeout 300

echo "==> service states"
for svc in db valkey api worker web; do
  state="$(compose ps --format '{{.State}}' "$svc")"
  [ "$state" = "running" ] || fail "$svc is '$state', expected running"
done
migrate_cid="$(compose ps -a -q migrate)"
[ -n "$migrate_cid" ] || fail "migrate container not found"
migrate_exit="$(docker inspect -f '{{.State.Status}} {{.State.ExitCode}}' "$migrate_cid")"
[ "$migrate_exit" = "exited 0" ] || fail "migrate: '$migrate_exit', expected 'exited 0'"

echo "==> non-root"
for svc in api web worker; do
  uid="$(compose exec -T "$svc" id -u | tr -d '\r')"
  [ "$uid" != "0" ] || fail "$svc runs as root"
  echo "$svc uid=$uid"
done

echo "==> http checks via web ($WEB_URL)"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$WEB_URL/")"
[ "$code" = "200" ] || fail "GET / returned $code"
body="$(curl -s --max-time 20 "$WEB_URL/api/v1/health/ready")"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$WEB_URL/api/v1/health/ready")"
[ "$code" = "200" ] || fail "GET /api/v1/health/ready via web returned $code: $body"
echo "$body"

echo "SMOKE OK"
