#!/usr/bin/env bash
# Create deploy/compose/.env from .env.example if missing, generating random secrets.
# Never overwrites an existing .env. Works from any cwd.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../deploy/compose" && pwd)"
ENV_FILE="$DIR/.env"
EXAMPLE="$DIR/.env.example"

if [ -f "$ENV_FILE" ]; then
  # An existing .env is never overwritten, but refuse to run with placeholder values.
  placeholders="$(sed -nE 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=change-me.*$/\1/p' "$ENV_FILE")"
  if [ -n "$placeholders" ]; then
    {
      echo "ensure-env: $ENV_FILE still contains placeholder values (=change-me) for:"
      while IFS= read -r name; do echo "  $name"; done <<<"$placeholders"
      echo "Set real values in that file (e.g. \`openssl rand -hex 32\`), or delete it and run"
      echo "\`make up\` again to generate one. Note: POSTGRES_PASSWORD only applies to a fresh"
      echo "database volume (\`make clean-data\` deletes the existing one)."
    } >&2
    exit 1
  fi
  exit 0
fi

command -v openssl >/dev/null || { echo "openssl is required to generate secrets" >&2; exit 1; }
secret="$(openssl rand -hex 32)"
dbpass="$(openssl rand -hex 24)"

umask 077
# Write to a temp file first so an interrupted run never leaves a partial .env.
tmp="$(mktemp "$DIR/.env.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
# hex output is safe in sed replacement text and in a postgres URL.
sed -e "s/^PRODSIM_SECRET_KEY=change-me\$/PRODSIM_SECRET_KEY=$secret/" \
    -e "s/^POSTGRES_PASSWORD=change-me\$/POSTGRES_PASSWORD=$dbpass/" \
    "$EXAMPLE" > "$tmp"
if grep -q '^[A-Z_]*=change-me' "$tmp"; then
  echo "ensure-env: placeholder still present after substitution (CRLF in .env.example?)" >&2
  exit 1
fi
mv "$tmp" "$ENV_FILE"
trap - EXIT
echo "Created $ENV_FILE with generated secrets (never commit it)."
