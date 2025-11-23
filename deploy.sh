#!/bin/bash

# Ironclad APIs - AWS EC2 Automated Deployment Script
# Run this script after SSHing into your EC2 instance

set -e

echo "=========================================="
echo "Ironclad APIs - AWS EC2 Deployment"
echo "=========================================="

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update System
echo -e "${BLUE}[1/12] Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}\n"

# Step 2: Install Node.js
echo -e "${BLUE}[2/12] Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js installed${NC}\n"

# Step 3: Install PostgreSQL
echo -e "${BLUE}[3/12] Installing PostgreSQL...${NC}"
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
echo -e "${YELLOW}Enter PostgreSQL password for ironclad_user (or press Enter for default):${NC}"
read -sp "Password: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-"ironclad_secure_password"}

sudo -u postgres psql -c "CREATE DATABASE ironclad;" || true
sudo -u postgres psql -c "CREATE USER ironclad_user WITH PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET client_encoding TO 'utf8';" || true
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET default_transaction_isolation TO 'read committed';" || true
sudo -u postgres psql -c "ALTER ROLE ironclad_user SET default_transaction_deferrable TO on;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ironclad TO ironclad_user;" || true

echo -e "${GREEN}✓ PostgreSQL installed and configured${NC}\n"

# Step 4: Install PM2
echo -e "${BLUE}[4/12] Installing PM2...${NC}"
sudo npm install -g pm2
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
echo -e "${GREEN}✓ PM2 installed${NC}\n"

# Step 5: Install Git
echo -e "${BLUE}[5/12] Installing Git...${NC}"
sudo apt-get install -y git
echo -e "${GREEN}✓ Git installed${NC}\n"

# Step 6: Clone Repository
echo -e "${BLUE}[6/12] Cloning repository...${NC}"
cd /home/ubuntu
if [ ! -d "ironclad_apis" ]; then
    git clone https://github.com/Lakshyachitransh/ironclad_apis.git
else
    cd ironclad_apis && git pull origin main && cd /home/ubuntu
fi
cd ironclad_apis
echo -e "${GREEN}✓ Repository cloned${NC}\n"

# Step 7: Create .env file
echo -e "${BLUE}[7/12] Creating .env file...${NC}"
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://ironclad_user:${DB_PASSWORD}@localhost:5432/ironclad"

# JWT Configuration
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRATION="24h"

# Node Environment
NODE_ENV="production"

# Server Port
PORT=3000

# AWS S3 Configuration (Update with your credentials)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"

# CORS Configuration
CORS_ORIGIN="*"
EOF

chmod 600 .env
echo -e "${GREEN}✓ .env file created${NC}\n"

# Step 8: Install Dependencies
echo -e "${BLUE}[8/12] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 9: Build Project
echo -e "${BLUE}[9/12] Building project...${NC}"
npm run build
echo -e "${GREEN}✓ Project built${NC}\n"

# Step 10: Run Migrations
echo -e "${BLUE}[10/12] Running Prisma migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations completed${NC}\n"

# Step 11: Start with PM2
echo -e "${BLUE}[11/12] Starting application with PM2...${NC}"
pm2 start dist/main.js --name "ironclad-api" --instances max
pm2 save
echo -e "${GREEN}✓ Application started${NC}\n"

# Step 12: Install and Configure Nginx
echo -e "${BLUE}[12/12] Installing and configuring Nginx...${NC}"
sudo apt-get install -y nginx

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

    location /api/docs {
        proxy_pass http://ironclad_backend;
        proxy_set_header Host $host;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/ironclad-api /etc/nginx/sites-enabled/ironclad-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}\n"

# Summary
echo -e "${GREEN}=========================================="
echo "✓ Deployment Completed Successfully!"
echo "==========================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update your .env file with AWS credentials:"
echo "   nano /home/ubuntu/ironclad_apis/.env"
echo ""
echo "2. Access your API:"
echo "   - Base URL: http://$(hostname -I | awk '{print $1}'):3000"
echo "   - Swagger Docs: http://$(hostname -I | awk '{print $1}'):3000/api/docs"
echo "   - Through Nginx: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "3. Monitor your application:"
echo "   pm2 logs ironclad-api"
echo "   pm2 status"
echo ""
echo "4. (Optional) Setup SSL certificate:"
echo "   sudo apt-get install -y certbot python3-certbot-nginx"
echo "   sudo certbot certonly --standalone -d yourdomain.com"
echo ""
echo -e "${BLUE}Database Credentials:${NC}"
echo "   User: ironclad_user"
echo "   Password: ${DB_PASSWORD}"
echo "   Database: ironclad"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials in a secure location!${NC}\n"

echo -e "${GREEN}Deployment Info:${NC}"
pm2 status
echo ""
echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager | head -5
