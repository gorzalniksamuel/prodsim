#!/usr/bin/env bash
# License gate: fail the build when a dependency ships under a GPL/AGPL license.
#
# Usage: scripts/license-gate.sh [--python <pip-licenses.json>] [--node <license-checker.json>]
#                                [--allowlist <file>]
#   --python  output of `pip-licenses --format=json --from=mixed`
#   --node    output of `license-checker-rseidelsohn --production --json`
#   --allowlist  defaults to licenses-allowlist.txt at the repository root
#                (format: `package-name  # reason`, one per line; trailing `*` = prefix)
#
# Rules:
#   - GPL / AGPL (anything that is not LGPL): always fails; the allowlist cannot override it.
#   - LGPL: fails unless the package is in the allowlist (reviewed LGPL packages only).
#   - UNKNOWN / empty license: fails unless the package is in the allowlist.
# Exit codes: 0 pass, 1 offending packages found, 2 usage error.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY_JSON=""
NODE_JSON=""
ALLOWLIST="$ROOT/licenses-allowlist.txt"

usage() { echo "usage: license-gate.sh [--python <json>] [--node <json>] [--allowlist <file>]" >&2; exit 2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --python) [ $# -ge 2 ] || usage; PY_JSON="$2"; shift 2 ;;
    --node) [ $# -ge 2 ] || usage; NODE_JSON="$2"; shift 2 ;;
    --allowlist) [ $# -ge 2 ] || usage; ALLOWLIST="$2"; shift 2 ;;
    *) usage ;;
  esac
done

[ -n "$PY_JSON" ] || [ -n "$NODE_JSON" ] || usage
command -v jq >/dev/null 2>&1 || { echo "license-gate: jq is required" >&2; exit 2; }
for f in "$PY_JSON" "$NODE_JSON"; do
  [ -z "$f" ] || [ -f "$f" ] || { echo "license-gate: no such file: $f" >&2; exit 2; }
done
[ -f "$ALLOWLIST" ] || { echo "license-gate: no such allowlist: $ALLOWLIST" >&2; exit 2; }

# Normalise package names: lowercase, runs of [-_.] collapse to "-" (PEP 503 style).
normalize() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[-_.]+/-/g'; }

ALLOWED=" "
while IFS= read -r line; do
  line="${line%%#*}"
  line="$(printf '%s' "$line" | tr -d '[:space:]')"
  [ -n "$line" ] || continue
  ALLOWED="$ALLOWED$(normalize "$line") "
done < "$ALLOWLIST"

# Entries may end in `*` to allow a reviewed package family (e.g. `@img/sharp-libvips-*`).
is_allowed() {
  local n entry
  n="$(normalize "$1")"
  for entry in $ALLOWED; do
    case "$entry" in
      *'*') case "$n" in "${entry%\*}"*) return 0 ;; esac ;;
      *) [ "$n" = "$entry" ] && return 0 ;;
    esac
  done
  return 1
}

# Emit "name<TAB>version<TAB>license" rows.
rows() {
  if [ -n "$PY_JSON" ]; then
    jq -r '.[] | [.Name, .Version, ((.License // "UNKNOWN") | tostring)] | @tsv' "$PY_JSON" || return 1
  fi
  if [ -n "$NODE_JSON" ]; then
    # keys look like "name@1.2.3" or "@scope/name@1.2.3"; licenses is a string or an array
    jq -r 'to_entries[] | (.key | capture("^(?<n>.+)@(?<v>[^@]+)$")) as $k
           | [$k.n, $k.v, ((.value.licenses // "UNKNOWN") | if type == "array" then join(" AND ") else tostring end)]
           | @tsv' "$NODE_JSON" || return 1
  fi
}

ALL_ROWS="$(rows)" || { echo "license-gate: failed to parse input JSON" >&2; exit 2; }

bad=0
total=0
while IFS=$'\t' read -r name version license; do
  [ -n "$name" ] || continue
  total=$((total + 1))
  # Strip every LGPL spelling; if GPL wording remains, it is a (A)GPL license.
  stripped="$(printf '%s' "$license" | sed -E 's/[Ll][Gg][Pp][Ll]//g; s/[Ll]esser [Gg]eneral [Pp]ublic//g; s/[Ll]ibrary [Gg]eneral [Pp]ublic//g')"
  if printf '%s' "$stripped" | grep -qiE 'GPL|General Public|Affero'; then
    echo "FORBIDDEN (GPL/AGPL): $name $version -> $license"
    bad=1
  elif printf '%s' "$license" | grep -qiE 'LGPL|Lesser General Public|Library General Public'; then
    if is_allowed "$name"; then
      echo "allowlisted LGPL: $name $version -> $license"
    else
      echo "LGPL not in allowlist: $name $version -> $license"
      bad=1
    fi
  elif [ -z "$license" ] || printf '%s' "$license" | grep -qiE '^[[:space:]]*(UNKNOWN|UNLICENSED)?[[:space:]]*$|UNKNOWN'; then
    if is_allowed "$name"; then
      echo "allowlisted UNKNOWN: $name $version -> $license"
    else
      echo "UNKNOWN license: $name $version -> $license"
      bad=1
    fi
  fi
done <<< "$ALL_ROWS"

if [ "$bad" -ne 0 ]; then
  echo "license-gate: FAILED (see offending packages above)" >&2
  exit 1
fi
echo "license-gate: OK ($total packages checked)"
