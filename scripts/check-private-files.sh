#!/usr/bin/env bash
# Fails if git tracks files that must never be published.
# Forbidden (at any depth): CLAUDE.md, .claude/, .superpowers/, plus docs/superpowers/
# and .env, .env.* (except .env.example).
# Exit codes: 0 clean, 1 private files tracked, 2 git could not list files.
set -euo pipefail

if ! root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "check-private-files: not inside a git repository (git rev-parse failed)" >&2
  exit 2
fi
cd "$root"

# Capture the listing first so a git failure is not hidden by process substitution.
listing="$(mktemp)"
trap 'rm -f "$listing"' EXIT
if ! git ls-files -z >"$listing"; then
  echo "check-private-files: 'git ls-files' failed" >&2
  exit 2
fi

offenders=()
while IFS= read -r -d '' path; do
  base="${path##*/}"
  case "$path" in
    CLAUDE.md|*/CLAUDE.md|.claude/*|*/.claude/*|.superpowers/*|*/.superpowers/*|docs/superpowers/*)
      offenders+=("$path"); continue ;;
  esac
  case "$base" in
    .env.example) ;;
    .env|.env.*) offenders+=("$path") ;;
  esac
done <"$listing"

if [ "${#offenders[@]}" -gt 0 ]; then
  echo "Private files are tracked by git:" >&2
  printf '  %s\n' "${offenders[@]}" >&2
  exit 1
fi
