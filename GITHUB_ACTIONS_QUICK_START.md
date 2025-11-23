# 🚀 GitHub Actions CI/CD Setup - Quick Start

## ⚡ 3 Simple Steps to Enable Automated Deployment

### **Step 1: Get Your SSH Key Content**

**Windows PowerShell:**
```powershell
# Find your .pem file (if you have it)
Get-ChildItem "$env:USERPROFILE\Downloads\*.pem"
Get-ChildItem "$env:USERPROFILE\Desktop\*.pem"

# Copy the content (example path)
Get-Content "C:\Users\DELL\Downloads\ironclad-key.pem" -Raw
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

---

### **Step 2: Add GitHub Secrets**

1. Go to: https://github.com/Lakshyachitransh/ironclad_apis/settings/secrets/actions

2. Click **"New repository secret"**

3. **Add First Secret:**
   - Name: `EC2_HOST`
   - Value: `13.53.151.86`
   - Click **"Add secret"**

4. **Add Second Secret:**
   - Name: `EC2_SSH_KEY`
   - Value: [Paste your entire .pem file content from Step 1]
   - Click **"Add secret"**

---

### **Step 3: Setup EC2 Instance (One Time)**

SSH to your EC2 instance and run this command:

```bash
cat << 'SETUP_EOF' > /tmp/setup.sh && bash /tmp/setup.sh
#!/bin/bash
set -e

echo "🚀 Setting up EC2 for GitHub Actions deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE ironclad;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER ironclad_user WITH PASSWORD 'ironclad_secure_2025';" 2>/dev/null || true
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET client_encoding TO 'utf8';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ironclad TO ironclad_user;" 2>/dev/null || true

# Install PM2
sudo npm install -g pm2
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Install Git & Nginx
sudo apt-get install -y git nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/ironclad-api > /dev/null << 'NGINX_EOF'
upstream ironclad_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 500M;

    location / {
        proxy_pass http://ironclad_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/ironclad-api /etc/nginx/sites-enabled/ironclad-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Clone repository
cd /home/ubuntu
rm -rf ironclad_apis
git clone https://github.com/Lakshyachitransh/ironclad_apis.git
cd ironclad_apis

# Create .env
cat > .env << 'ENV_EOF'
DATABASE_URL="postgresql://ironclad_user:ironclad_secure_2025@localhost:5432/ironclad"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRATION="24h"
NODE_ENV="production"
PORT=3000
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-s3-bucket"
CORS_ORIGIN="*"
ENV_EOF

chmod 600 .env

# Install & build
npm install --production
npm run build

# Run migrations
npx prisma migrate deploy || echo "No migrations to run"

# Start with PM2
pm2 start dist/main.js --name "ironclad-api" --instances max
pm2 save

echo "✅ Setup complete!"
echo "Application: http://13.53.151.86/api/docs"
SETUP_EOF
```

---

## ✅ Now You're Ready!

### **Test Deployment:**

Make a small change and push:
```bash
cd C:\Users\DELL\OneDrive\Desktop\ironclad_apis\ironclad_apis

# Make a small change (e.g., edit README)
git add .
git commit -m "test: trigger GitHub Actions"
git push origin main
```

### **Monitor Deployment:**

1. Go to: https://github.com/Lakshyachitransh/ironclad_apis/actions
2. Click the latest "Deploy to EC2" workflow
3. Watch the logs in real-time

### **Verify Application:**

After deployment completes, visit:
```
http://13.53.151.86/api/docs
```

---

## 🎯 From Now On

Every time you push to `main`:
1. GitHub Actions automatically triggers
2. Pulls your code to EC2
3. Builds the application
4. Runs migrations
5. Restarts the app
6. ✅ Your changes are live!

No manual deployment needed! 🚀

---

## 🆘 Troubleshooting

### **Check Secrets are Added**
```
GitHub → Repository Settings → Secrets and variables → Actions
Should show:
  ✅ EC2_HOST
  ✅ EC2_SSH_KEY
```

### **SSH Connection Error?**
```powershell
# Test if .pem key is valid
ssh -i "C:\path\to\key.pem" ubuntu@13.53.151.86

# Should connect without errors
```

### **Deployment Failed?**
1. Check GitHub Actions logs for error
2. SSH to EC2 and check: `pm2 logs ironclad-api`
3. Verify secrets are correct

---

## 📊 Quick Reference

| Command | Purpose |
|---------|---------|
| Push to main | Automatically triggers deployment |
| Check status | GitHub → Actions tab |
| View logs | GitHub Actions workflow logs |
| View app logs | `pm2 logs ironclad-api` |
| Manual redeploy | Actions → Run workflow button |

---

**Your automated CI/CD pipeline is ready!** 🎉

Push code → GitHub Actions → Automatic deployment to EC2 ✅
