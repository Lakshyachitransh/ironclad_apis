# GitHub Actions CI/CD Deployment to EC2

Automated deployment from GitHub to your AWS EC2 instance using GitHub Actions.

## 📋 Setup Steps

### Step 1: Add GitHub Secrets

Go to your GitHub repository settings:

1. Navigate to: `https://github.com/Lakshyachitransh/ironclad_apis/settings/secrets/actions`
2. Click **"New repository secret"**
3. Add these secrets:

#### **Secret 1: EC2_HOST**

- **Name**: `EC2_HOST`
- **Value**: `13.53.151.86` (your EC2 public IP)
- Click **Add secret**

#### **Secret 2: EC2_SSH_KEY**

- **Name**: `EC2_SSH_KEY`
- **Value**: Your `.pem` file contents (paste entire key)

  To get your key content:

  ```powershell
  # Windows PowerShell
  Get-Content "C:\Users\DELL\Downloads\ironclad-key.pem" -Raw | Set-Clipboard
  # Key is now in clipboard, paste it into GitHub
  ```

  Or:

  ```bash
  # Linux/Mac
  cat /path/to/ironclad-key.pem | pbcopy
  ```

- Click **Add secret**

---

### Step 2: Verify Secrets Added

Your GitHub repository secrets should now have:

```
✅ EC2_HOST = 13.53.151.86
✅ EC2_SSH_KEY = -----BEGIN RSA PRIVATE KEY-----
                 MIIE...
                 -----END RSA PRIVATE KEY-----
```

---

### Step 3: First Manual Setup on EC2

Before using GitHub Actions, we need to setup your EC2 instance once:

#### Connect via SSH:

```powershell
# Windows PowerShell
ssh -i "C:\Users\DELL\Downloads\ironclad-key.pem" ubuntu@13.53.151.86
```

#### Run initial setup:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE ironclad;"
sudo -u postgres psql -c "CREATE USER ironclad_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ironclad TO ironclad_user;"

# Install PM2
sudo npm install -g pm2
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Install Git
sudo apt-get install -y git

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

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

# Clone repository
cd /home/ubuntu
git clone https://github.com/Lakshyachitransh/ironclad_apis.git
cd ironclad_apis

# Create .env file
cat > .env << 'ENV_EOF'
DATABASE_URL="postgresql://ironclad_user:secure_password@localhost:5432/ironclad"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRATION="24h"
NODE_ENV="production"
PORT=3000
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"
CORS_ORIGIN="*"
ENV_EOF

chmod 600 .env

# Install dependencies
npm install

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/main.js --name "ironclad-api" --instances max
pm2 save

echo "✅ Initial setup complete!"
```

---

## 🚀 How to Deploy with GitHub Actions

### **Automatic Deployment (On Every Push)**

Now, every time you push to `main` branch, GitHub Actions will automatically:

1. ✅ Pull latest code
2. ✅ Install dependencies
3. ✅ Build application
4. ✅ Run migrations
5. ✅ Restart application on EC2

**Just push your code:**

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### **Manual Deployment (Anytime)**

Go to your GitHub repository:

1. Click **"Actions"** tab
2. Click **"Deploy to EC2"** workflow
3. Click **"Run workflow"** button
4. Select branch (main)
5. Click **"Run workflow"**

Deployment will start automatically!

---

## 📊 Monitor Deployment

### **Via GitHub Actions**

1. Go to **Actions** tab in your repository
2. Click the latest workflow run
3. Click **"deploy"** job
4. Watch real-time logs

### **Via EC2 Instance**

SSH to your instance and check:

```bash
# Check application status
pm2 status

# View live logs
pm2 logs ironclad-api --tail 50

# Monitor in real-time
pm2 monit
```

---

## 🔄 Deployment Workflow

```
You push code to GitHub
         ↓
GitHub Actions triggered
         ↓
SSH to EC2 instance
         ↓
Git pull latest code
         ↓
npm install (dependencies)
         ↓
npm run build (compile)
         ↓
npx prisma migrate deploy (database)
         ↓
pm2 restart (restart app)
         ↓
Verify application responding
         ↓
✅ Deployment complete!
```

---

## 🆘 Troubleshooting

### **SSH Connection Failed**

Check your secrets:

```powershell
# Verify EC2_HOST
echo ${{ secrets.EC2_HOST }}  # Should be: 13.53.151.86

# Verify EC2_SSH_KEY is correct
# It should start with: -----BEGIN RSA PRIVATE KEY-----
# And end with: -----END RSA PRIVATE KEY-----
```

### **Application Still on Old Version**

Check if PM2 is running old version:

```bash
pm2 list

# If multiple versions, delete old:
pm2 kill

# Then re-run workflow
```

### **Database Migration Failed**

SSH to instance and check:

```bash
psql -h localhost -U ironclad_user -d ironclad -c "\dt"

# Check Prisma status
npx prisma migrate status
```

### **Nginx 502 Error**

Check if application is running:

```bash
pm2 status    # Should show "online"
pm2 logs      # Check for errors

# If not running, restart:
pm2 restart ironclad-api
```

---

## 🔐 Security Best Practices

1. ✅ Never commit `.pem` file to repository
2. ✅ Keep SSH key in GitHub Secrets only
3. ✅ Limit EC2 security group access
4. ✅ Use strong passwords for database
5. ✅ Regularly update packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📝 Environment Variables

If you need to change environment variables:

### **Option 1: Via GitHub Actions** (Recommended)

1. Update `.env` locally
2. Push to repository
3. GitHub Actions will deploy with new env vars

### **Option 2: Directly on EC2**

```bash
ssh -i "key.pem" ubuntu@13.53.151.86
nano /home/ubuntu/ironclad_apis/.env
# Edit your variables
pm2 restart ironclad-api
```

---

## 🎯 Next Steps

1. ✅ Add both GitHub secrets (EC2_HOST and EC2_SSH_KEY)
2. ✅ SSH to EC2 and run initial setup commands
3. ✅ Push a small change to test workflow
4. ✅ Monitor deployment in GitHub Actions
5. ✅ Verify application is running

---

## 📊 Deployment Status

To check deployment status:

**GitHub Actions Dashboard:**

```
Repository → Actions → Deploy to EC2 → Latest Run
```

**Application Status:**

```
http://13.53.151.86/api/docs
```

**Real-time Logs:**

```bash
ssh -i "key.pem" ubuntu@13.53.151.86
pm2 logs ironclad-api
```

---

## 🎉 You're Ready!

Your CI/CD pipeline is now set up. Every push to `main` will automatically deploy to your EC2 instance! 🚀

Questions? Check GitHub Actions logs for detailed error messages.
