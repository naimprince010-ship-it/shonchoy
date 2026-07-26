#!/bin/bash
cd ~/mfi-system
git pull origin master

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd backend
npx prisma db push --accept-data-loss
npx prisma generate
node prisma/seed.js
pm2 restart mfi-backend
