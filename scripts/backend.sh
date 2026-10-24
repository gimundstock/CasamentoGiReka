#!/usr/bin/env bash
# Apps Script backend helper (wraps clasp).
#   pull    download the live project to a temp folder and diff it against
#           apps-script/ — never overwrites the repo, so values still hardcoded
#           in the live copy can't leak into git
#   push    upload apps-script/Code.gs + appsscript.json to the project (HEAD)
#   deploy  push, then publish a new version on the existing Web App
#           deployment, so its /exec URL stays the same
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .clasp.json ]]; then
  echo "Missing .clasp.json — copy .clasp.json.example and paste your scriptId." >&2
  exit 1
fi

CLASP="npx --no-install clasp"

case "${1:-}" in
  pull)
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    script_id=$(node -p "require('./.clasp.json').scriptId")
    printf '{"scriptId":"%s","rootDir":"."}\n' "$script_id" > "$tmp/.clasp.json"
    (cd "$tmp" && $CLASP pull >/dev/null)
    echo "Live project downloaded. Differences from apps-script/ (live = +):"
    for f in Code.gs appsscript.json; do
      live="$tmp/$f"; [[ -f "$tmp/${f%.gs}.js" ]] && live="$tmp/${f%.gs}.js"
      if [[ ! -f "apps-script/$f" && "$f" == appsscript.json ]]; then
        # The manifest holds no private values (time zone, scopes, Web App
        # access), and push needs it, so keep the live one.
        cp "$live" "apps-script/$f"
        echo "Saved the live manifest to apps-script/$f — review and commit it."
      elif [[ ! -f "apps-script/$f" ]]; then
        echo "--- apps-script/$f is missing locally"
      else
        diff -u "apps-script/$f" "$live" --label "repo/$f" --label "live/$f" || true
      fi
    done
    ;;
  push)
    $CLASP push --force
    ;;
  deploy)
    if [[ -f .env.local ]]; then set -a; . ./.env.local; set +a; fi
    : "${APPSCRIPT_DEPLOYMENT_ID:?Set APPSCRIPT_DEPLOYMENT_ID in .env.local (Deploy → Manage deployments)}"
    $CLASP push --force
    $CLASP create-deployment --deploymentId "$APPSCRIPT_DEPLOYMENT_ID" \
      --description "$(git log -1 --format=%h\ %s)"
    ;;
  *)
    echo "usage: scripts/backend.sh pull|push|deploy" >&2
    exit 1
    ;;
esac
