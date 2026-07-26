#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Downgrading Node.js to LTS v22 for stability..."
nvm install 22
nvm alias default 22
nvm use 22

echo "Node version is now: $(node -v)"

echo "Cloning repository..."
cd ~
if [ -d "mfi-system" ]; then
  echo "Directory mfi-system already exists. Pulling latest changes..."
  cd mfi-system
  git reset --hard
  git pull
else
  git clone https://github.com/naimprince010-ship-it/shonchoy.git mfi-system
  cd mfi-system
fi

echo "Installing backend dependencies..."
cd backend
npm install

echo "Creating .env placeholder..."
cat <<EOF > .env
# PORT
PORT=5000

# DATABASE
DATABASE_URL="YOUR_DATABASE_URL_HERE"

# JWT
JWT_SECRET="YOUR_JWT_SECRET_HERE"

# CORS
CLIENT_URL="http://174.138.34.120"
EOF

echo "Step 2 Completed successfully!"
echo "Placeholder .env created at ~/mfi-system/backend/.env"
