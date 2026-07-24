#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/chat}"
WORKSPACE="${GITHUB_WORKSPACE:-$(pwd -P)}"
RELEASES="$APP_ROOT/releases"
SHARED="$APP_ROOT/shared"
CURRENT="$APP_ROOT/current"
STAMP="$(date +%Y%m%d%H%M%S)"
STAGING="$RELEASES/.staging-$STAMP-$$"
RELEASE="$RELEASES/$STAMP"
PREVIOUS="$(readlink -f "$CURRENT" 2>/dev/null || true)"
PM2_HOME="${PM2_HOME:-/var/www/.pm2}"

mkdir -p "$RELEASES" "$SHARED"
test -s "$APP_ROOT/.env.production"

cleanup() { rm -rf "$STAGING"; }
trap cleanup EXIT

rsync -a --delete \
  --exclude='.git' --exclude='.next' --exclude='node_modules' \
  "$WORKSPACE/" "$STAGING/"
cp "$APP_ROOT/.env.production" "$STAGING/.env.production"

cd "$STAGING"
npm ci --ignore-scripts
npm run build

mv "$STAGING" "$RELEASE"
ln -sfn "$RELEASE" "$CURRENT"

export PM2_HOME PM2_CWD="$CURRENT"
pm2 startOrReload "$CURRENT/ecosystem.config.cjs" --only chat-nextjs --update-env

healthy=false
for _ in {1..10}; do
  if curl -fsS --max-time 2 http://127.0.0.1:3013/chat >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [ "$healthy" != true ]; then
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    ln -sfn "$PREVIOUS" "$CURRENT"
    export PM2_CWD="$CURRENT"
    pm2 startOrReload "$CURRENT/ecosystem.config.cjs" --only chat-nextjs --update-env
  fi
  exit 1
fi

find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name '20*' -printf '%T@ %p\n' \
  | sort -nr | tail -n +2 | cut -d' ' -f2- | xargs -r rm -rf

pm2 save
