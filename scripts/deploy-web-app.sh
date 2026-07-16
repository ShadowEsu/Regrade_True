#!/usr/bin/env bash
# Deploy the Regrade browser app (ChatGPT-style SPA) to Firebase Hosting.
# Marketing site stays on GitHub Pages (regradeapp.tech).
# Point custom domain app.regradeapp.tech at this Firebase hosting site.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_BASE="${REGRADE_API_BASE_URL:-${VITE_API_BASE_URL:-https://api.regradeapp.tech}}"
echo "Building web app with API: $API_BASE"
VITE_API_BASE_URL="$API_BASE" npm run build

echo "Deploying to Firebase Hosting (regrade-75d1a)..."
npx firebase deploy --only hosting:regrade-75d1a

echo ""
echo "Web app deployed."
echo "  Firebase URL: https://regrade-75d1a.web.app"
echo "  Custom domain (set in Firebase Console → Hosting): https://app.regradeapp.tech"
echo "  Marketing site stays at: https://regradeapp.tech"
echo ""
echo "DNS: add whatever Firebase shows for app.regradeapp.tech (usually A/AAAA or CNAME)."
