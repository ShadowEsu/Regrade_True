#!/usr/bin/env bash
# Run before the first git push. Refuses to exit 0 if any file that looks
# like a secret would be staged.
#
# Usage:
#   bash scripts/check-secrets.sh
#
# Exits non-zero on any finding. Safe to wire into a pre-commit hook.

set -u

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }

found=0

note_finding() {
  red "  [BLOCK] $1"
  found=$((found + 1))
}

# 1. Are we inside a git repo?
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  yellow "Not inside a git repository. Run 'git init' first, then re-run this script."
  exit 0
fi

tracked="$(git ls-files --cached --others --exclude-standard)"
echo "==> Scanning $(printf '%s\n' "$tracked" | sed '/^$/d' | wc -l | tr -d ' ') files Git would publish..."

echo "==> Scanning for files that must NEVER be tracked..."

# 2. Files by name pattern.
patterns=(
  '\.env$'
  '\.env\.[^.]+$'        # but allow .env.example and .env.production.example below
  'firebase-applet-config\.json$'
  'firebase-adminsdk.*\.json$'
  'serviceAccount.*\.json$'
  'service-account.*\.json$'
  'google-services\.json$'
  'GoogleService-Info\.plist$'
  '\.jks$'
  '\.keystore$'
  '\.p8$'
  '\.p12$'
  '\.pfx$'
  '\.mobileprovision$'
  'credentials.*\.json$'
  'secrets\.json$'
  '\.(sqlite|sqlite3|db)$'
  '(^|/)uploads?/'
)

allowlist_regex='(^|/)(\.env\.example|\.env\.production\.example)$'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if [[ "$f" =~ $allowlist_regex ]]; then
    continue
  fi
  for pat in "${patterns[@]}"; do
    if [[ "$f" =~ $pat ]]; then
      note_finding "$f matches forbidden pattern /$pat/"
    fi
  done
done <<< "$tracked"

echo ""
echo "==> Scanning tracked file contents for key material..."

# 3. Content scan: hardcoded API keys / private keys.
# Run on cached + untracked-but-not-ignored files only (what git would commit).
candidates=$(echo "$tracked" | tr '\n' '\0' | xargs -0 -I {} sh -c 'test -f "{}" && echo "{}"' 2>/dev/null)

if [ -n "$candidates" ]; then
  # Google API keys. Firebase *web* config keys are public by design (they ship
  # in every browser bundle; security comes from Firestore rules + key
  # restrictions), so firebaseWebConfig.ts is allowlisted.
  hits=$(echo "$candidates" | xargs grep -EnH 'AIza[0-9A-Za-z_-]{30,}' 2>/dev/null | grep -Ev '\.env\.example|src/lib/firebaseWebConfig\.ts' || true)
  if [ -n "$hits" ]; then
    note_finding "Google API key pattern found in tracked content:"
    echo "$hits" | sed 's/^/      /'
  fi

  # OpenAI / Stripe / Slack / GitHub tokens.
  hits=$(echo "$candidates" | xargs grep -EnH '(sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{20,}|xoxb-[0-9]{10,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})' 2>/dev/null || true)
  if [ -n "$hits" ]; then
    note_finding "Third-party API token pattern found in tracked content:"
    echo "$hits" | sed 's/^/      /'
  fi

  # PEM private keys.
  hits=$(echo "$candidates" | xargs grep -lH 'BEGIN [A-Z ]*PRIVATE KEY' 2>/dev/null || true)
  if [ -n "$hits" ]; then
    note_finding "PEM private key block found in tracked content:"
    echo "$hits" | sed 's/^/      /'
  fi

  # Firebase service account JSON dead-giveaway.
  hits=$(echo "$candidates" | xargs grep -lH '"type"[[:space:]]*:[[:space:]]*"service_account"' 2>/dev/null || true)
  if [ -n "$hits" ]; then
    note_finding "Service account JSON found in tracked content:"
    echo "$hits" | sed 's/^/      /'
  fi

  hits=$(echo "$candidates" | xargs grep -lEH '(/Users/[^/]+/|C:\\Users\\[^\\]+\\)' 2>/dev/null | grep -v '^scripts/check-secrets\.sh$' || true)
  if [ -n "$hits" ]; then
    note_finding "Personal filesystem path found in publishable content:"
    echo "$hits" | sed 's/^/      /'
  fi
fi

echo ""
if [ "$found" -eq 0 ]; then
  green "OK — no obvious secrets staged for commit."
  exit 0
fi

red "FAIL — $found problem(s) above. Fix or .gitignore them before pushing."
exit 1
