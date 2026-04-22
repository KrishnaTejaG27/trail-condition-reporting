#!/bin/bash
# Update script for TrailWatch on EC2
# Run this after making code changes

echo "🔄 Updating TrailWatch..."

cd ~/trail-condition-reporting-1

# Pull latest changes
echo "⬇️ Pulling latest code..."
git pull

# Update backend
echo "🔧 Updating backend..."
cd server
npm install
npm run build
pm2 restart trailwatch-api

# Update frontend
echo "🔧 Updating frontend..."
cd ../client
npm install
npm run build
sudo cp -r dist/* /usr/share/nginx/html/

echo "✅ Update complete!"
echo "App is running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
