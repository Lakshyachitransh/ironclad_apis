# Quick Start: Deploy to AWS EC2 in 5 Minutes

## TL;DR - Fast Deployment

### 1. Launch EC2 Instance
Go to AWS Console → EC2 → Launch Instance
- **AMI**: Ubuntu Server 22.04 LTS
- **Type**: t3.medium
- **Key Pair**: Download .pem file
- **Security Group**: Add ports 22, 80, 443, 3000

### 2. Connect & Deploy
```bash
# From your machine (Windows PowerShell / Linux / Mac)
ssh -i "path/to/key.pem" ubuntu@<your-ec2-ip>

# On EC2 instance, run:
cd /tmp
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 3. Update Configuration
```bash
# Edit .env file with AWS credentials
nano /home/ubuntu/ironclad_apis/.env

# Restart application
cd /home/ubuntu/ironclad_apis
pm2 restart ironclad-api
```

### 4. Access Your API
```
Swagger Docs: http://<your-ec2-ip>/api/docs
API Base: http://<your-ec2-ip>/api
```

---

## Step-by-Step (With Details)

### Prerequisites
- AWS Account
- SSH client (PuTTY, WSL, or native SSH)
- .pem key file

### Step 1: Create EC2 Instance

**Via AWS Console:**
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose **Ubuntu Server 22.04 LTS** (free tier eligible)
4. Instance Type: **t3.medium** (for production, use t3.large or larger)
5. Configure Security Group with these Inbound Rules:
   - SSH (22): Your IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (3000): 0.0.0.0/0 (NestJS port)
6. Storage: 30GB gp3
7. Create new key pair, download .pem file
8. Launch instance
9. Copy the **Public IPv4 address**

### Step 2: Connect via SSH

**Windows PowerShell:**
```powershell
# Set key permissions (one time)
icacls "C:\path\to\key.pem" /inheritance:r /grant:r "$env:USERNAME:F"

# Connect
ssh -i "C:\path\to\key.pem" ubuntu@<your-ec2-ip>
```

**Linux/Mac:**
```bash
chmod 400 ~/path/to/key.pem
ssh -i ~/path/to/key.pem ubuntu@<your-ec2-ip>
```

### Step 3: Run Automated Deployment

Once connected to your EC2 instance:

```bash
# Download deployment script
cd /tmp
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run deployment (takes ~3-5 minutes)
./deploy.sh
```

The script will:
✓ Update system packages
✓ Install Node.js 18.x
✓ Install PostgreSQL
✓ Install PM2 (process manager)
✓ Clone your GitHub repository
✓ Install dependencies
✓ Build the project
✓ Run database migrations
✓ Start the application
✓ Configure Nginx reverse proxy

### Step 4: Configure Environment

```bash
# Edit .env file with your AWS S3 credentials
nano /home/ubuntu/ironclad_apis/.env
```

Update these fields:
```env
# AWS S3 (get from AWS IAM)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key-here"
AWS_SECRET_ACCESS_KEY="your-secret-here"
AWS_S3_BUCKET="your-bucket-name"

# CORS (if needed)
CORS_ORIGIN="https://yourfrontend.com"
```

Save: `Ctrl + O` → `Enter` → `Ctrl + X`

### Step 5: Restart Application

```bash
# Restart to apply .env changes
pm2 restart ironclad-api

# Watch logs
pm2 logs ironclad-api
```

### Step 6: Test Your Deployment

```bash
# From your EC2 instance
curl http://localhost:3000/api/docs

# Or from your local machine
# Browser: http://<your-ec2-ip>/api/docs
```

You should see Swagger documentation!

---

## Verify Everything is Working

### Check Application Status
```bash
pm2 status
```

Should show: **online**

### Check Logs
```bash
pm2 logs ironclad-api --tail 20
```

Should show application started without errors.

### Test Database
```bash
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

Should return: **1**

### Test API Endpoint
```bash
# This should work without auth for health check
curl http://localhost:3000/health

# For other endpoints, you need a JWT token
```

---

## Common Issues & Fixes

### Issue: Connection timeout
**Fix**: Check security group allows your IP for port 22

### Issue: "Permission denied (publickey)"
**Fix**: Verify .pem file permissions: `chmod 400 key.pem`

### Issue: Application fails to start
**Fix**: Check logs: `pm2 logs ironclad-api --lines 50`

### Issue: Port 3000 already in use
**Fix**: 
```bash
pm2 kill
pm2 start dist/main.js --name "ironclad-api"
```

### Issue: Database connection refused
**Fix**: Ensure PostgreSQL is running:
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Issue: Nginx returns 502 Bad Gateway
**Fix**: 
```bash
# Check if app is running
pm2 status

# Restart if needed
pm2 restart ironclad-api
```

---

## Next Steps

### 1. Setup Domain & SSL
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get free SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx config
sudo nano /etc/nginx/sites-available/ironclad-api
# Add SSL directives to server block
```

### 2. Setup Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Setup email alerts (with PM2 Plus, optional)
pm2 link <secret_key> <private_key>
```

### 3. Setup Database Backups
```bash
# Manual backup
pg_dump -U ironclad_user -d ironclad > ~/backup.sql

# Restore from backup
psql -U ironclad_user -d ironclad < ~/backup.sql

# Auto backups (add to crontab)
crontab -e
# Add: 0 2 * * * pg_dump -U ironclad_user -d ironclad > /home/ubuntu/backups/ironclad_$(date +\%Y\%m\%d).sql
```

### 4. Deploy Updates
```bash
cd /home/ubuntu/ironclad_apis

# Pull latest code
git pull origin main

# Rebuild
npm install
npm run build

# Run migrations if needed
npx prisma migrate deploy

# Restart
pm2 restart ironclad-api
```

---

## Useful Commands

```bash
# Process Management
pm2 status              # Check app status
pm2 logs                # View logs
pm2 restart ironclad-api # Restart app
pm2 stop ironclad-api    # Stop app
pm2 start ironclad-api   # Start app
pm2 delete ironclad-api  # Remove from PM2

# System
sudo systemctl status postgresql  # Check database
sudo systemctl status nginx        # Check web server
sudo systemctl restart nginx       # Restart web server

# Logs
pm2 logs ironclad-api --lines 100 --err  # Show last 100 error lines
tail -f /var/log/nginx/error.log          # Monitor Nginx errors
tail -f /var/log/nginx/access.log         # Monitor Nginx access

# Database
psql -h localhost -U ironclad_user -d ironclad  # Connect to DB
\dt                                             # List tables
\q                                              # Quit psql

# Updates
cd /home/ubuntu/ironclad_apis
git pull origin main  # Get latest code
npm install          # Update dependencies
npm run build        # Rebuild
pm2 restart all      # Restart all apps
```

---

## Costs (AWS Free Tier)

**Included (12 months free):**
- EC2: 1 x t3.micro or t2.micro (not t3.medium)
- RDS: 1 x db.t2.micro PostgreSQL

**If using t3.medium:**
- ~$0.04/hour = ~$30/month

**Cost optimization:**
- Use smaller instance for dev (t3.micro)
- Use RDS for production (more reliable)
- Use CloudFront for static files

---

## Support & Troubleshooting

**Full documentation**: See `AWS_EC2_DEPLOYMENT_GUIDE.md`

**Issues?** Check:
1. `pm2 logs ironclad-api`
2. `sudo tail -f /var/log/nginx/error.log`
3. `psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"`

---

**Your API is now live!** 🚀

Access it at: `http://<your-ec2-ip>/api/docs`
