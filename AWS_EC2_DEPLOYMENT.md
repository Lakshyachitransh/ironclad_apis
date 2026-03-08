# AWS EC2 Deployment Guide - Ironclad LMS API

## Prerequisites

### 1. AWS Account & EC2 Setup
- [ ] AWS account with appropriate permissions
- [ ] EC2 instance (Ubuntu 20.04 LTS or newer)
- [ ] RDS PostgreSQL database (or self-hosted)
- [ ] S3 bucket for video storage
- [ ] Security groups configured properly

### 2. Local Machine
- [ ] Docker installed and running
- [ ] AWS CLI configured with credentials
- [ ] SSH key to access EC2 instance

---

## Step 1: Prepare AWS Infrastructure

### 1.1 Create RDS PostgreSQL Database
```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier ironclad-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username ironclad \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20 \
  --publicly-accessible true \
  --region us-east-1
```

### 1.2 Create S3 Bucket for Videos
```bash
aws s3api create-bucket \
  --bucket ironclad-videos-$(date +%s) \
  --region us-east-1

# Enable versioning (optional)
aws s3api put-bucket-versioning \
  --bucket ironclad-videos-xxxx \
  --versioning-configuration Status=Enabled
```

### 1.3 Create IAM User for Application
```bash
# Create user
aws iam create-user --user-name ironclad-app

# Create access key
aws iam create-access-key --user-name ironclad-app

# Attach S3 policy
aws iam attach-user-policy \
  --user-name ironclad-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 1.4 Security Group Configuration
```bash
# Allow HTTP, HTTPS, SSH
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 22 --cidr YOUR_IP/32
```

---

## Step 2: Setup EC2 Instance

### 2.1 Connect to EC2
```bash
ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
```

### 2.2 Install Required Tools
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get install -y git

# Install AWS CLI (optional, for S3 operations)
sudo apt-get install -y awscli

# Logout and login again for docker group to take effect
exit
ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
```

### 2.3 Verify Installation
```bash
docker --version
docker-compose --version
git --version
```

---

## Step 3: Deploy Application

### 3.1 Clone Repository
```bash
git clone https://github.com/Lakshyachitransh/ironclad_apis.git
cd ironclad_apis
```

### 3.2 Create Environment File
```bash
# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://ironclad:YourSecurePassword123@rds-endpoint:5432/ironclad_db

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE_IN=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRE_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=ironclad-videos-xxxx
AWS_ACCESS_KEY_ID=your-iam-access-key
AWS_SECRET_ACCESS_KEY=your-iam-secret-key

# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-your-openai-key

# AWS Transcribe (if using video transcription)
AWS_TRANSCRIBE_ROLE_ARN=arn:aws:iam::your-account-id:role/transcribe-role
EOF

cat .env
```

### 3.3 Build and Start Services
```bash
# For development with database in container
docker-compose up -d

# Check logs
docker-compose logs -f api

# Run database migrations
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma db seed
```

### 3.4 Production Deployment (Without Docker Compose)
```bash
# Pull latest code
git pull origin main

# Build Docker image
docker build -t ironclad-api:latest .

# Tag for ECR (if using AWS ECR)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag ironclad-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ironclad-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ironclad-api:latest

# Run container
docker run -d \
  --name ironclad-api \
  -p 3000:3000 \
  --env-file .env \
  --restart always \
  ironclad-api:latest
```

---

## Step 4: Setup Reverse Proxy (Nginx)

### 4.1 Install Nginx
```bash
sudo apt-get install -y nginx

# Enable and start
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.2 Configure Nginx
```bash
sudo cat > /etc/nginx/sites-available/ironclad << 'EOF'
upstream ironclad_api {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    client_max_body_size 500M;

    location / {
        proxy_pass http://ironclad_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://ironclad_api;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ironclad /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4.3 Setup SSL Certificate (Let's Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx

sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Step 5: Setup Monitoring & Logging

### 5.1 Check Container Status
```bash
# View running containers
docker ps

# View logs
docker logs ironclad-api -f

# View container stats
docker stats ironclad-api
```

### 5.2 Database Backups
```bash
# Backup RDS database (AWS automated backups recommended)
# Or manual backup using pg_dump:

docker exec ironclad-postgres pg_dump -U ironclad ironclad_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U ironclad -d ironclad_db < backup_20240309.sql
```

### 5.3 Setup CloudWatch Logs
```bash
# Install CloudWatch agent (optional)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

---

## Step 6: Maintenance & Updates

### 6.1 Deploy Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

### 6.2 Scale Application
```bash
# Run multiple instances with load balancer (using docker-compose)
# Update docker-compose.yml to run multiple api instances
# Or use ECS/Kubernetes for managed scaling
```

### 6.3 Monitor Disk Space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# View Docker volumes
docker volume ls
docker volume inspect ironclad_postgres_data
```

---

## Troubleshooting

### Issue: Container fails to start
```bash
docker logs ironclad-api
docker inspect ironclad-api
```

### Issue: Database connection error
```bash
# Test connection
docker exec ironclad-postgres psql -U ironclad -d ironclad_db -c "SELECT 1"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue: S3 upload fails
```bash
# Verify AWS credentials
aws s3 ls

# Check S3 bucket permissions
aws s3api get-bucket-tagging --bucket ironclad-videos-xxxx
```

### Issue: Out of memory
```bash
# Check memory usage
docker stats

# Increase container memory limit
docker update --memory 2g ironclad-api
```

---

## Security Best Practices

### 1. Secrets Management
- [ ] Use AWS Secrets Manager for sensitive data
- [ ] Rotate credentials regularly
- [ ] Never commit `.env` to git

### 2. Database Security
- [ ] Enable RDS encryption
- [ ] Use VPC for database
- [ ] Enable automated backups
- [ ] Use IAM database authentication

### 3. Application Security
- [ ] Use HTTPS only
- [ ] Enable CORS properly
- [ ] Rate limiting
- [ ] Input validation

### 4. Container Security
- [ ] Use specific image tags (not latest)
- [ ] Scan images for vulnerabilities
- [ ] Run as non-root user (already done)
- [ ] Keep base images updated

---

## Performance Optimization

### 1. Enable Caching
```nginx
# Add to Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location ~ ^/api/(courses|lessons)/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1h;
}
```

### 2. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_lessons_course_id ON lessons(courseId);
CREATE INDEX idx_course_assignments_user_id ON course_assignments(userId);
```

### 3. CDN for Static Assets
- [ ] Use CloudFront for video CDN
- [ ] Enable S3 transfer acceleration
- [ ] Use CloudFront for asset caching

---

## Useful Commands

```bash
# Docker commands
docker-compose ps                      # Check running services
docker-compose logs -f api            # Follow logs
docker-compose restart api            # Restart service
docker-compose down                   # Stop all services
docker-compose up -d --build          # Rebuild and start

# Database commands
docker-compose exec api npx prisma studio  # Open Prisma Studio
docker-compose exec api npx prisma migrate dev --name migration_name
docker-compose exec api npm run prisma:seed

# SSH commands
scp -i key.pem file.txt ubuntu@ec2-ip:/home/ubuntu/
ssh -i key.pem ubuntu@ec2-ip
```

---

## Next Steps

1. **Monitor**: Set up CloudWatch monitoring
2. **Backup**: Configure automated RDS backups
3. **Scale**: Use load balancer for multiple instances
4. **SSL**: Renew certificates before expiry
5. **Update**: Keep dependencies and Docker images updated

---

## Support & Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Prisma PostgreSQL](https://www.prisma.io/docs/reference/database-reference/connection-urls)
