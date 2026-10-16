#!/usr/bin/env bash
# Create deploy/compose/.env from .env.example if missing, generating random secrets.
# Never overwrites an existing .env. Works from any cwd.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../deploy/compose" && pwd)"
ENV_FILE="$DIR/.env"
EXAMPLE="$DIR/.env.example"

if [ -f "$ENV_FILE" ]; then
  exit 0
fi

command -v openssl >/dev/null || { echo "openssl is required to generate secrets" >&2; exit 1; }
secret="$(openssl rand -hex 32)"
dbpass="$(openssl rand -hex 24)"

umask 077
# hex output is safe in sed replacement text and in a postgres URL.
sed -e "s/^PRODSIM_SECRET_KEY=change-me\$/PRODSIM_SECRET_KEY=$secret/" \
    -e "s/^POSTGRES_PASSWORD=change-me\$/POSTGRES_PASSWORD=$dbpass/" \
    "$EXAMPLE" > "$ENV_FILE"
echo "Created $ENV_FILE with generated secrets (never commit it)."
