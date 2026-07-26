#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ~/mfi-system/backend

echo "Ensuring PM2 is installed for the current Node version..."
npm install -g pm2

echo "Generating Prisma Client..."
npx prisma generate

echo "Deploying Prisma Migrations..."
npx prisma migrate deploy

echo "Starting backend with PM2..."
pm2 start src/index.js --name mfi-backend || pm2 restart mfi-backend
pm2 save

echo "Generating PM2 startup script..."
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
chmod +x /tmp/pm2_startup.sh
/tmp/pm2_startup.sh

echo "Step 3 Completed successfully!"
pm2 status mfi-backend
