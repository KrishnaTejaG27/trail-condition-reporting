#!/bin/bash
# AWS EC2 Deployment Script for TrailWatch
# Run this on your EC2 instance after SSH login

echo "🚀 Starting TrailWatch Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 20
echo "⬇️ Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify Node.js
node --version
npm --version

# Install PM2
echo "⬇️ Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "⬇️ Installing Nginx..."
sudo yum install -y nginx

# Install Git
echo "⬇️ Installing Git..."
sudo yum install -y git

# Install build tools for native modules
echo "⬇️ Installing build tools..."
sudo yum install -y gcc-c++ make

# Start Nginx
echo "▶️ Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Base dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone https://github.com/YOUR_USERNAME/trail-condition-reporting-1.git"
echo "2. cd trail-condition-reporting-1/server"
echo "3. Create .env file with your AWS credentials"
echo "4. npm install && npm run build"
echo "5. pm2 start dist/index.js --name 'trailwatch-api'"
echo "6. cd ../client && npm install && npm run build"
echo "7. sudo cp -r dist/* /usr/share/nginx/html/"
echo ""
echo "See AWS-DEPLOYMENT.md for full instructions!"
