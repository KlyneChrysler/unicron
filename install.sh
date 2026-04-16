#!/usr/bin/env bash
set -euo pipefail
echo "Installing Unicron..."
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required. Install from https://nodejs.org"
  exit 1
fi
UNICRON_DIR="${HOME}/.unicron-install"
if [ -d "$UNICRON_DIR" ]; then
  cd "$UNICRON_DIR" && git pull
else
  git clone https://github.com/your-org/unicron "$UNICRON_DIR"
fi
cd "$UNICRON_DIR" && node core/installer.js
echo "Unicron installed. Run /unicron to get started."
