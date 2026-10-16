#!/usr/bin/env bash
# Verify required legal and community files exist with the expected content.
# Run from the repository root. Exit 1 on any problem.
set -uo pipefail

rc=0
err() { echo "ERROR: $1" >&2; rc=1; }

for f in LICENSE COMMERCIAL-LICENSE.md CLA.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md README.md; do
  [ -f "$f" ] || err "missing file: $f"
done

if [ -f LICENSE ]; then
  grep -qF "PolyForm Noncommercial License 1.0.0" LICENSE \
    || err "LICENSE must contain 'PolyForm Noncommercial License 1.0.0'"
  grep -qF "Required Notice: Copyright Samuel Gorzalnik" LICENSE \
    || err "LICENSE must contain 'Required Notice: Copyright Samuel Gorzalnik'"
fi

if [ -f README.md ]; then
  grep -qF "source-available" README.md \
    || err "README.md must contain 'source-available'"
fi

exit "$rc"
