# AWS Deployment Guide for TrailWatch

## 📋 Prerequisites

### 1. AWS Account Setup (Free Tier)
- Sign up at https://aws.amazon.com/free/
- Verify your account with a credit card (won't be charged if under limits)

### 2. Required AWS Services
- **EC2** - For hosting the application (t2.micro is free for 12 months)
- **S3** - For photo storage (5GB free)
- **IAM** - For creating API credentials

---

## 🚀 Step 1: Create S3 Bucket

1. Go to AWS Console → S3
2. Click "Create bucket"
3. **Bucket name**: `trailwatch-photos-group8` (already set up!)
4. **Region**: US East (N. Virginia) us-east-1
5. **Uncheck** "Block all public access"
6. Check "I acknowledge..."
7. Enable ACLs (under Object Ownership)
8. Click "Create bucket"

---

## 🔐 Step 2: Create IAM User

1. Go to AWS Console → IAM → Users → Create user
2. **User name**: `trailwatch-app`
3. Click "Next"
4. Select "Attach policies directly"
5. Search and select: `AmazonS3FullAccess`
6. Click "Next" → "Create user"
7. Click on the user → "Security credentials" tab
8. Click "Create access key"
9. Select "Application running outside AWS"
10. Click "Next" → "Create access key"
11. **SAVE THESE SECURELY**:
    - Access Key ID
    - Secret Access Key

---

## 🖥️ Step 3: Launch EC2 Instance

1. Go to AWS Console → EC2 → Instances → Launch instances
2. **Name**: `trailwatch-server`
3. **AMI**: Amazon Linux 2023 (free tier eligible)
4. **Instance type**: t2.micro (free tier)
5. **Key pair**: Create new or use existing (save .pem file!)
6. **Network settings**:
   - Create security group
   - Allow SSH (port 22) from My IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow Custom TCP (port 3001) from anywhere (for backend API)
7. **Storage**: 30GB (free tier max)
8. Click "Launch instance"

---

## 📦 Step 4: Prepare Your Local Environment

### Create `.env` file in `/server`:

```env
# AWS S3 Configuration (from Step 2)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
S3_BUCKET_NAME=trailwatch-photos-group8

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL (will be your EC2 IP)
FRONTEND_URL=http://YOUR_EC2_IP

# Database (optional - can use mock mode)
# DATABASE_URL=postgresql://...

# Mapbox (get from https://account.mapbox.com/)
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

**DO NOT commit this file to git!**

---

## 🔧 Step 5: Connect to EC2 & Deploy

### 1. Connect via SSH:
```bash
# On Windows (PowerShell)
ssh -i "path/to/your-key.pem" ec2-user@YOUR_EC2_IP

# On Mac/Linux
chmod 400 path/to/your-key.pem
ssh -i "path/to/your-key.pem" ec2-user@YOUR_EC2_IP
```

### 2. Install dependencies on EC2:
```bash
# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo yum install -y git

# Install Nginx (reverse proxy)
sudo yum install -y nginx
```

### 3. Clone your repository:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/trail-condition-reporting-1.git
cd trail-condition-reporting-1
```

### 4. Deploy the backend:
```bash
cd server
npm install

# Create .env file (paste your values)
nano .env

# Build and start
npm run build
pm2 start dist/index.js --name "trailwatch-api"
pm2 save
pm2 startup
```

### 5. Deploy the frontend:
```bash
cd ../client
npm install

# Update Vite config for production
# Change API URLs from localhost to your EC2 IP

npm run build
sudo cp -r dist/* /usr/share/nginx/html/
```

### 6. Configure Nginx:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add this server block:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🌐 Step 6: Access Your App

1. Get your EC2 Public IP from the AWS Console
2. Open browser: `http://YOUR_EC2_IP`
3. The app should be live!

---

## 🔄 Step 7: Update App (After Code Changes)

```bash
ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP
cd ~/trail-condition-reporting-1
git pull

# Update backend
cd server
npm install
npm run build
pm2 restart trailwatch-api

# Update frontend
cd ../client
npm install
npm run build
sudo cp -r dist/* /usr/share/nginx/html/
```

---

## 📊 Monitoring

```bash
# View logs
pm2 logs trailwatch-api

# Monitor processes
pm2 monit

# View status
pm2 status
```

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] AWS credentials in `.env` only (not in code)
- [ ] EC2 security group restricts SSH to your IP
- [ ] S3 bucket has proper permissions
- [ ] Database credentials are secure (if using RDS)

---

## 🆘 Troubleshooting

### Port already in use:
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Permission denied:
```bash
sudo chmod 600 ~/.env
```

### Nginx errors:
```bash
sudo nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx
```

### PM2 not starting:
```bash
pm2 delete all
pm2 start dist/index.js --name "trailwatch-api"
pm2 save
```

---

## 💰 Free Tier Limits (12 months)

- **EC2**: 750 hours/month of t2.micro (enough for 24/7 running)
- **S3**: 5GB storage + 20,000 GET requests
- **Data Transfer**: 15GB out per month

**Estimated monthly cost**: $0 (if within free tier)

---

## 📞 Need Help?

- AWS Free Tier: https://aws.amazon.com/free/
- EC2 Documentation: https://docs.aws.amazon.com/ec2/
- PM2 Documentation: https://pm2.keymetrics.io/
