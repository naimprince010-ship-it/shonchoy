#!/bin/bash

echo "Configuring Nginx..."

cat <<EOF > /etc/nginx/sites-available/mfi-backend
server {
    listen 80;
    server_name 174.138.34.120;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site and restart Nginx
ln -sf /etc/nginx/sites-available/mfi-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "Configuring Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw --force enable 
# Avoid enabling ufw blindly if SSH is not already allowed or it breaks the connection, 
# but the user asked to enable UFW.
ufw --force enable

echo "Testing the backend..."
echo "Waiting a few seconds for Nginx to spin up..."
sleep 2
curl -i http://174.138.34.120/

echo "Step 4 Completed successfully!"
