#!/bin/bash

echo "Skipping apt-get to avoid dpkg openssh-server error (packages already installed)..."

echo "Installing NVM and Node.js LTS..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --lts
nvm use --lts

echo "Installing PM2..."
npm install -g pm2

echo "Step 1 Completed successfully!"
node -v
pm2 -v
nginx -v
git --version
