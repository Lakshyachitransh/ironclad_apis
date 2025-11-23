# AWS EC2 Deployment Guide for Ironclad APIs

This guide covers deploying the Ironclad APIs NestJS application to an AWS EC2 instance.

## Prerequisites

- AWS Account with EC2 access
- SSH client (PuTTY, Git Bash, or Windows Terminal)
- GitHub repository access
- EC2 Key Pair (.pem file)

## Step 1: Create EC2 Instance

### Launch Instance
1. Go to AWS Console → EC2 → Instances → Launch Instance
2. **Choose AMI**: Select **Ubuntu Server 22.04 LTS** (t3.medium or larger recommended)
3. **Instance Type**: `t3.medium` or `t3.large`
4. **Network Settings**:
   - VPC: Default or your VPC
   - Auto-assign Public IP: Enable
5. **Security Group**: Create new or use existing
   - Inbound Rules:
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - SSH (22): Your IP (or 0.0.0.0/0 for dev)
     - Custom TCP (3000): 0.0.0.0/0 (for NestJS API)
     - PostgreSQL (5432): 0.0.0.0/0 (if using external access)
6. **Storage**: 30GB gp3 (General Purpose SSD)
7. **Key Pair**: Create or select your .pem key
8. **Launch** the instance

### Note Instance Details
- Public IP Address (will be used for SSH)
- Instance ID
- Key Pair name

## Step 2: Connect to EC2 Instance

### Using Windows PowerShell/Git Bash
```bash
# Change permissions on your key (Windows)
icacls "C:\path\to\your-key.pem" /inheritance:r /grant:r "%username%:F"

# Connect via SSH
ssh -i "C:\path\to\your-key.pem" ubuntu@<your-ec2-public-ip>
```

### Once Connected - Update System
```bash
sudo apt update
sudo apt upgrade -y
```

## Step 3: Install Node.js and NPM

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 4: Install PostgreSQL

### Option A: Local PostgreSQL (Recommended for Dev)
```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE ironclad;"
sudo -u postgres psql -c "CREATE USER ironclad_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET default_transaction_deferrable TO on;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ironclad TO ironclad_user;"

# Verify connection
psql -h localhost -U ironclad_user -d ironclad -c "\dt"
```

### Option B: AWS RDS PostgreSQL (Production Recommended)
1. Go to AWS RDS Console
2. Create Database → PostgreSQL 14+
3. DB Instance Identifier: `ironclad-db`
4. Master Username: `ironclad_user`
5. Password: Save securely
6. DB Name: `ironclad`
7. Publicly Accessible: Yes (for now, restrict in production)
8. Security Group: Allow EC2 instance access
9. Note the **Endpoint** (host)

## Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Enable PM2 to start on boot
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
```

## Step 6: Install Git and Clone Repository

```bash
# Install Git
sudo apt-get install -y git

# Clone your repository
cd /home/ubuntu
git clone https://github.com/Lakshyachitransh/ironclad_apis.git
cd ironclad_apis

# Or if private repo, use personal access token
git clone https://ghp_YOUR_TOKEN@github.com/Lakshyachitransh/ironclad_apis.git
```

## Step 7: Configure Environment Variables

```bash
# Create .env file in project root
cd /home/ubuntu/ironclad_apis
nano .env
```

Add the following (adjust values for your setup):

```env
# Database Configuration
DATABASE_URL="postgresql://ironclad_user:your_secure_password@localhost:5432/ironclad"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRATION="24h"

# Node Environment
NODE_ENV="production"

# Server Port
PORT=3000

# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"

# Optional: CORS Configuration
CORS_ORIGIN="https://yourdomain.com"
```

**Save file**: Press `Ctrl + O`, then `Enter`, then `Ctrl + X`

## Step 8: Install Dependencies and Build

```bash
cd /home/ubuntu/ironclad_apis

# Install dependencies
npm install

# Build the project
npm run build

# Verify build was successful
ls -la dist/
```

## Step 9: Run Database Migrations

```bash
cd /home/ubuntu/ironclad_apis

# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Seed database if seed.ts exists
npx prisma db seed
```

## Step 10: Start Application with PM2

```bash
cd /home/ubuntu/ironclad_apis

# Start the application
pm2 start dist/main.js --name "ironclad-api" --instances max

# Save PM2 configuration
pm2 save

# View logs
pm2 logs ironclad-api

# Check status
pm2 status
```

## Step 11: Install and Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/ironclad-api
```

Add this configuration:

```nginx
upstream ironclad_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;  # Replace with your domain

    # Redirect HTTP to HTTPS (optional)
    # return 301 https://$server_name$request_uri;

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

    # Swagger documentation
    location /api/docs {
        proxy_pass http://ironclad_backend;
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ironclad-api /etc/nginx/sites-enabled/ironclad-api
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 12: Setup SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update Nginx config to use SSL (add to server block)
# listen 443 ssl http2;
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Auto-renew SSL certificate
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Step 13: Verify Deployment

```bash
# Check application status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test API endpoint
curl http://localhost:3000/api/docs

# Or from your machine
curl http://<your-ec2-public-ip>/api/docs
```

## Troubleshooting

### Check PM2 logs
```bash
pm2 logs ironclad-api --tail 50
```

### Check Nginx errors
```bash
sudo tail -f /var/log/nginx/error.log
```

### Test database connection
```bash
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

### Restart application
```bash
pm2 restart ironclad-api
```

### Stop application
```bash
pm2 stop ironclad-api
```

## Monitoring and Maintenance

### View real-time monitoring
```bash
pm2 monit
```

### View all process logs
```bash
pm2 logs

# View specific process logs
pm2 logs ironclad-api

# View last 100 lines
pm2 logs ironclad-api --tail 100

# Clear logs
pm2 flush
```

### Update application
```bash
cd /home/ubuntu/ironclad_apis
git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart ironclad-api
```

## Security Best Practices

1. **Restrict SSH Access**: Update security group to allow SSH only from your IP
2. **Use Strong Passwords**: Generate strong database and JWT secrets
3. **Enable SSL/TLS**: Use Let's Encrypt for free certificates
4. **Set File Permissions**: Restrict .env file access
   ```bash
   chmod 600 /home/ubuntu/ironclad_apis/.env
   ```
5. **Regular Updates**: Keep system and packages updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
6. **Backup Database**: Set up automated PostgreSQL backups
7. **Monitor Logs**: Regularly check application and system logs

## Database Backup

### Manual Backup
```bash
# Backup database
pg_dump -U ironclad_user -d ironclad > ~/ironclad_backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U ironclad_user -d ironclad < ~/ironclad_backup_*.sql
```

### Automated Backups (Cron)
```bash
# Open crontab editor
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U ironclad_user -d ironclad > /home/ubuntu/backups/ironclad_$(date +\%Y\%m\%d).sql
```

## Performance Tuning

### Enable PM2 Cluster Mode
```bash
pm2 start dist/main.js --name "ironclad-api" --instances max
pm2 save
```

### Nginx Caching (for static content)
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### PostgreSQL Optimization
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# Increase shared_buffers (for 2GB RAM server)
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 16MB
```

## Common API Endpoints

Once deployed, you can access:

- **API Base**: `http://<your-ec2-ip>/api`
- **Swagger Docs**: `http://<your-ec2-ip>/api/docs`
- **Health Check**: `http://<your-ec2-ip>/health` (if implemented)

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs ironclad-api`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql.log`
4. Review application error logs in PM2

---

**Deployment completed!** Your Ironclad APIs should now be running on AWS EC2.
