#!/usr/bin/env bash
# Fails if git tracks files that must never be published.
# Forbidden: CLAUDE.md, .claude/*, docs/superpowers/*, .env, .env.* (except *.env.example).
set -euo pipefail

offenders=()
while IFS= read -r -d '' path; do
  base="${path##*/}"
  case "$path" in
    CLAUDE.md|.claude/*|docs/superpowers/*) offenders+=("$path"); continue ;;
  esac
  case "$base" in
    .env.example) ;;
    .env|.env.*) offenders+=("$path") ;;
  esac
done < <(git ls-files -z)

if [ "${#offenders[@]}" -gt 0 ]; then
  echo "Private files are tracked by git:" >&2
  printf '  %s\n' "${offenders[@]}" >&2
  exit 1
fi
