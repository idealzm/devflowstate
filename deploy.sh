#!/bin/bash

# DevFlowState Deployment Script
# Run this script to deploy the application on a fresh VPS

set -e

echo "🚀 DevFlowState Deployment Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required"
    exit 1
fi

echo ""
echo "📦 Installing system dependencies..."
apt update
apt install -y ffmpeg nodejs npm nginx certbot python3-certbot-nginx curl

echo ""
echo "📥 Installing Node.js dependencies..."
npm install

echo ""
echo "🔧 Installing PM2..."
npm install -g pm2

echo ""
echo "📝 Configuring environment..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

echo ""
echo "🔐 Setting up SSL with Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo ""
echo "🌐 Configuring Nginx..."
# Update domain in nginx config
sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf

# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/devflowstate
ln -sf /etc/nginx/sites-available/devflowstate /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx

echo ""
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your application is running at:"
echo "  https://$DOMAIN"
echo ""
echo "PM2 commands:"
echo "  pm2 status     - Check app status"
echo "  pm2 logs       - View logs"
echo "  pm2 restart    - Restart app"
echo "  pm2 stop       - Stop app"
echo ""
