#!/usr/bin/env bash
# Update the live app: pull the latest code, install, build, restart.
# Usage on the VPS:  cd /var/www/client-finder && ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
echo "→ Pulling latest code"
git pull --ff-only
echo "→ Installing packages"
npm ci
echo "→ Building"
npm run build
echo "→ Restarting"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
echo "✓ Client Finder is live"
