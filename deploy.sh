#!/bin/bash
set -euo pipefail

echo "🚀 Starte Deployment für WebGIS-Demo..."

cd /home/ubuntu/projects/webgis-demo

# NVM laden (falls vorhanden)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

# Sicherstellen, dass wir den richtigen Branch deployen
git fetch origin main
git reset --hard origin/main

# Reproduzierbare Installs (setzt package-lock.json voraus)
npm ci
npm run build

# Prozess neu starten / reloaden
pm2 restart webgis-demo

echo "✅ Deployment ok – live auf eco-gis.ch!"
