#!/usr/bin/env bash
# Deploy dist/ to ShadowEsu/Regrade-website (GitHub Pages → regradeapp.tech)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_REPO="${PAGES_REPO:-https://github.com/ShadowEsu/Regrade-website.git}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$ROOT"
npm run build

echo "regradeapp.tech" > dist/CNAME
touch dist/.nojekyll
mkdir -p dist/app
cp dist/app.html dist/app/index.html

git clone --depth 1 "$PAGES_REPO" "$WORK/site"
cd "$WORK/site"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
rsync -a "$ROOT/dist/" ./

git add -A
if git diff --staged --quiet; then
  echo "No changes to deploy."
  exit 0
fi
git commit -m "Deploy marketing site and app from Regrade_True ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
git push origin main
echo "Deployed to regradeapp.tech (GitHub Pages). Allow 1–3 minutes for CDN cache."
