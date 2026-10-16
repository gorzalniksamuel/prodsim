#!/usr/bin/env bash
# Tests for scripts/license-gate.sh. Self-contained; uses a temp directory and fixtures.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../license-gate.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1"; fail=1; }

run_gate() { # sets OUT and RC
  set +e
  OUT="$(bash "$SCRIPT" "$@" 2>&1)"
  RC=$?
  set -e
}

cat > "$TMP/allow.txt" <<'EOT'
# reviewed LGPL packages
asyncua  # LGPL-3.0, used unmodified
EOT
: > "$TMP/empty-allow.txt"

# --- python ---
echo '[{"Name":"fastapi","Version":"1","License":"MIT"},{"Name":"psycopg","Version":"3","License":"GNU Lesser General Public License v3 (LGPLv3)"}]' > "$TMP/py-lgpl.json"
echo '[{"Name":"fastapi","Version":"1","License":"MIT"},{"Name":"badpkg","Version":"2.0","License":"GNU General Public License v3 (GPLv3)"}]' > "$TMP/py-gpl.json"
echo '[{"Name":"a","Version":"1","License":"MIT"},{"Name":"evil","Version":"1","License":"GNU Affero General Public License v3 (AGPLv3)"}]' > "$TMP/py-agpl.json"
echo '[{"Name":"asyncua","Version":"1","License":"GNU Lesser General Public License v3 (LGPLv3)"}]' > "$TMP/py-asyncua.json"
echo '[{"Name":"mystery","Version":"1","License":"UNKNOWN"}]' > "$TMP/py-unknown.json"
echo '[{"Name":"asyncua","Version":"1","License":"GPL-3.0-only"}]' > "$TMP/py-asyncua-gpl.json"
echo '[{"Name":"ok","Version":"1","License":"MIT"},{"Name":"ok2","Version":"2","License":"Apache Software License"}]' > "$TMP/py-clean.json"

run_gate --python "$TMP/py-gpl.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "badpkg" <<<"$OUT" && grep -q "GPLv3" <<<"$OUT"; then ok "python GPL fails and names package"; else bad "python GPL: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-agpl.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "evil" <<<"$OUT"; then ok "python AGPL fails"; else bad "python AGPL: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-lgpl.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "psycopg" <<<"$OUT"; then ok "non-allowlisted LGPL fails"; else bad "LGPL not allowlisted: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-asyncua.json" --allowlist "$TMP/allow.txt"
if [ "$RC" -eq 0 ]; then ok "allowlisted LGPL passes"; else bad "allowlisted LGPL: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-asyncua-gpl.json" --allowlist "$TMP/allow.txt"
if [ "$RC" -eq 1 ]; then ok "allowlist does not cover plain GPL"; else bad "allowlisted GPL must fail: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-unknown.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "mystery" <<<"$OUT"; then ok "UNKNOWN fails"; else bad "UNKNOWN: rc=$RC out=$OUT"; fi

run_gate --python "$TMP/py-clean.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 0 ]; then ok "clean python passes"; else bad "clean python: rc=$RC out=$OUT"; fi

# --- node ---
echo '{"react@19.0.0":{"licenses":"MIT"},"x@1.0.0":{"licenses":"(MIT OR Apache-2.0)"}}' > "$TMP/node-clean.json"
echo '{"react@19.0.0":{"licenses":"MIT"},"@scope/gplpkg@1.2.3":{"licenses":"GPL-3.0-only"}}' > "$TMP/node-gpl.json"
echo '{"foo@1.0.0":{"licenses":["MIT","AGPL-3.0"]}}' > "$TMP/node-array.json"
echo '{"@scope/lgplpkg@1.2.3":{"licenses":"LGPL-3.0-or-later"}}' > "$TMP/node-lgpl.json"
echo '{"weird@1.0.0":{"licenses":"UNKNOWN"}}' > "$TMP/node-unknown.json"
printf '@scope/lgplpkg  # reviewed\n' > "$TMP/allow-node.txt"

run_gate --python "$TMP/py-clean.json" --node "$TMP/node-clean.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 0 ]; then ok "clean python+node passes"; else bad "clean both: rc=$RC out=$OUT"; fi

run_gate --node "$TMP/node-gpl.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "@scope/gplpkg" <<<"$OUT"; then ok "node GPL fails"; else bad "node GPL: rc=$RC out=$OUT"; fi

run_gate --node "$TMP/node-array.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "foo" <<<"$OUT"; then ok "node license array with AGPL fails"; else bad "node array: rc=$RC out=$OUT"; fi

run_gate --node "$TMP/node-lgpl.json" --allowlist "$TMP/allow-node.txt"
if [ "$RC" -eq 0 ]; then ok "node allowlisted scoped LGPL passes"; else bad "node LGPL allowlisted: rc=$RC out=$OUT"; fi

run_gate --node "$TMP/node-unknown.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ]; then ok "node UNKNOWN fails"; else bad "node UNKNOWN: rc=$RC out=$OUT"; fi

echo '{"@img/sharp-libvips-linux-x64@1.3.4":{"licenses":"LGPL-3.0-or-later"}}' > "$TMP/node-sharp.json"
printf '@img/sharp-libvips-*  # reviewed family\n' > "$TMP/allow-wild.txt"
run_gate --node "$TMP/node-sharp.json" --allowlist "$TMP/allow-wild.txt"
if [ "$RC" -eq 0 ]; then ok "wildcard allowlist entry passes LGPL family"; else bad "wildcard: rc=$RC out=$OUT"; fi
run_gate --node "$TMP/node-lgpl.json" --allowlist "$TMP/allow-wild.txt"
if [ "$RC" -eq 1 ]; then ok "wildcard does not over-match"; else bad "wildcard over-match: rc=$RC out=$OUT"; fi

# --- empty inputs must not pass silently ---
echo '[]' > "$TMP/py-empty.json"
echo '{}' > "$TMP/node-empty.json"
run_gate --python "$TMP/py-empty.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 2 ]; then ok "empty python input is an error"; else bad "empty python input: rc=$RC out=$OUT"; fi
run_gate --node "$TMP/node-empty.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 2 ]; then ok "empty node input is an error"; else bad "empty node input: rc=$RC out=$OUT"; fi
run_gate --python "$TMP/py-clean.json" --node "$TMP/node-empty.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 2 ]; then ok "one empty input among several is an error"; else bad "mixed empty input: rc=$RC out=$OUT"; fi

# --- node keys that are not name@version must not be dropped ---
echo '{"react@19.0.0":{"licenses":"MIT"},"no-version-here":{"licenses":"MIT"}}' > "$TMP/node-badkey.json"
run_gate --node "$TMP/node-badkey.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "no-version-here" <<<"$OUT" && grep -q "UNPARSEABLE" <<<"$OUT"; then
  ok "unparseable node key fails and is named"
else
  bad "unparseable node key: rc=$RC out=$OUT"
fi

# --- Custom: licenses fail unless allowlisted ---
echo '[{"Name":"oddlib","Version":"1","License":"Custom: https://example.com/license"}]' > "$TMP/py-custom.json"
run_gate --python "$TMP/py-custom.json" --allowlist "$TMP/empty-allow.txt"
if [ "$RC" -eq 1 ] && grep -q "oddlib" <<<"$OUT"; then ok "Custom: license fails"; else bad "Custom: license: rc=$RC out=$OUT"; fi
printf 'oddlib  # reviewed custom license\n' > "$TMP/allow-custom.txt"
run_gate --python "$TMP/py-custom.json" --allowlist "$TMP/allow-custom.txt"
if [ "$RC" -eq 0 ]; then ok "allowlisted Custom: license passes"; else bad "allowlisted Custom: rc=$RC out=$OUT"; fi

# --- wildcard entries must not be glob-expanded against the working directory ---
mkdir -p "$TMP/globdir"
touch "$TMP/globdir/lgplfam-decoy"
echo '{"lgplfam-real@1.0.0":{"licenses":"LGPL-3.0-only"}}' > "$TMP/node-fam.json"
printf 'lgplfam-*  # reviewed family\n' > "$TMP/allow-fam.txt"
set +e
OUT="$(cd "$TMP/globdir" && bash "$SCRIPT" --node "$TMP/node-fam.json" --allowlist "$TMP/allow-fam.txt" 2>&1)"
RC=$?
set -e
if [ "$RC" -eq 0 ]; then ok "wildcard entry is not glob-expanded"; else bad "wildcard glob-expanded: rc=$RC out=$OUT"; fi

run_gate
if [ "$RC" -eq 2 ]; then ok "no inputs is a usage error"; else bad "no inputs: rc=$RC"; fi

run_gate --python "$TMP/missing.json"
if [ "$RC" -eq 2 ]; then ok "missing input file is a usage error"; else bad "missing file: rc=$RC"; fi

exit "$fail"
