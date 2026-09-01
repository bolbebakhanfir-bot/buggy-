#!/usr/bin/env bash
# One-command setup + launch for the Meryal Buggy Daily Tracking System.
# Installs dependencies (first run only), builds the client, and starts the
# server on http://localhost:4000.
set -e
cd "$(dirname "$0")"

echo "==> Setting up server..."
cd server
[ -d node_modules ] || npm install
cd ..

echo "==> Setting up client..."
cd client
[ -d node_modules ] || npm install
npm run build
cd ..

echo "==> Starting app on http://localhost:4000  (Ctrl+C to stop)"
cd server
npm start
