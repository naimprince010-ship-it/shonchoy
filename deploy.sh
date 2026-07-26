export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ~/mfi-system/backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
pm2 restart mfi-backend
pm2 status
