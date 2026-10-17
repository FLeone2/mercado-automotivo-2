#!/usr/bin/env bash
# Builds dist/, the only folder Cloudflare Pages publishes.
# Source, scripts, tests and raw source files stay out of the public site.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/data/scenarios
cp index.html 404.html _headers dist/
cp -r assets dist/
cp data/manifest.json dist/data/
cp -r data/cubes data/origin-cubes data/geography data/history dist/data/
find data/scenarios -maxdepth 1 -type f -name '*.json' -exec cp {} dist/data/scenarios/ \;
rm -f dist/data/geography/.gitkeep
python3 scripts/split-dist.py
echo "dist/ pronto: $(find dist -type f | wc -l) arquivos, $(du -sh dist | cut -f1)"
