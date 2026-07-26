#!/bin/bash

# Update Nginx config
echo "Updating Nginx configuration..."
sed -i 's/server_name 174.138.34.120;/server_name api.loopwren.com;/' /etc/nginx/sites-available/mfi-backend
nginx -t
systemctl reload nginx

# Install certbot
echo "Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obtain SSL Certificate
echo "Obtaining SSL certificate via Certbot..."
certbot --nginx -d api.loopwren.com --non-interactive --agree-tos --register-unsafely-without-email

# Pull latest code and restart PM2
echo "Updating backend code and restarting PM2..."
cd ~/mfi-system
git pull origin master

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd backend
pm2 restart mfi-backend
pm2 save

echo "SSL Setup Completed successfully!"
