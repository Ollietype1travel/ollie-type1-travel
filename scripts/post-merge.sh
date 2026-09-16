#!/usr/bin/env bash
set -euo pipefail

# This repository is a static site with no dependency installation,
# database migration, or build step required after a merge.
test -f index.html
test -f work-with-me/index.html
printf '%s\n' "Static site post-merge checks passed."