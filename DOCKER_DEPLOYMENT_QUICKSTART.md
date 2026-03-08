# Docker & AWS EC2 Deployment - Quick Start Guide

## 🐳 Local Docker Development (5 minutes)

### 1. Prerequisites
```bash
# Ensure you have Docker installed
docker --version
docker-compose --version
```

### 2. Setup Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration (minimal needed for local dev)
nano .env
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check services
docker-compose ps
```

### 4. Run Migrations
```bash
# Wait a few seconds for database to initialize
sleep 5

# Run database migrations
docker-compose exec api npx prisma migrate deploy

# Optional: Seed database
docker-compose exec api npx prisma db seed
```

### 5. Access Application
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Database Shell**: `docker-compose exec postgres psql -U ironclad -d ironclad_db`

### 6. Stop Services
```bash
docker-compose down
```

---

## ☁️ AWS EC2 Production Deployment (30 minutes)

### Step 1: Launch EC2 Instance
```bash
# Ubuntu 20.04 LTS, t3.medium or larger
# Security Group: Allow 80, 443, 22
# Key Pair: Download and save securely
```

### Step 2: Connect & Setup
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Run setup script (from workspace root)
chmod +x check-deployment.sh
./check-deployment.sh

# Install Docker if not present
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login for group changes
exit
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Clone & Configure
```bash
# Clone repository
git clone https://github.com/Lakshyachitransh/ironclad_apis.git
cd ironclad_apis

# Create production environment
cat > .env << 'EOF'
# Database - Use your RDS endpoint
DATABASE_URL=postgresql://ironclad:your-rds-password@your-rds-endpoint.rds.amazonaws.com:5432/ironclad_db

# JWT Secrets
JWT_SECRET=generate-strong-random-string-here
JWT_EXPIRE_IN=24h
REFRESH_TOKEN_SECRET=generate-another-random-string
REFRESH_TOKEN_EXPIRE_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=ironclad-videos-your-bucket
AWS_ACCESS_KEY_ID=your-iam-access-key
AWS_SECRET_ACCESS_KEY=your-iam-secret-key

# Application
NODE_ENV=production
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
EOF

# Secure the file
chmod 600 .env
```

### Step 4: Build & Deploy
```bash
# Build Docker image
docker build -t ironclad-api:latest .

# Start with production compose file
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
```

### Step 5: Setup Nginx
```bash
# Install Nginx
sudo apt-get install -y nginx

# Use provided config
sudo cp nginx.conf /etc/nginx/sites-available/ironclad

# Enable site
sudo ln -s /etc/nginx/sites-available/ironclad /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Step 6: SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 📊 Useful Commands

### View Logs
```bash
docker-compose logs -f api              # Follow logs
docker-compose logs --tail 100 api      # Last 100 lines
```

### Database Operations
```bash
# Access database shell
docker-compose exec postgres psql -U ironclad -d ironclad_db

# Backup database
docker-compose exec postgres pg_dump -U ironclad ironclad_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ironclad ironclad_db < backup.sql

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api npx prisma db seed
```

### Service Management
```bash
docker-compose restart api              # Restart API
docker-compose down                     # Stop all services
docker-compose up -d --build           # Rebuild and start
docker-compose exec api npm run build   # Rebuild app code
```

### Monitoring
```bash
docker stats                            # Service resource usage
docker-compose ps                       # Service status
curl http://localhost:3000/api/health   # Health check
```

### Clean Up
```bash
docker-compose down -v                  # Remove volumes
docker system prune -a                  # Clean up unused
docker logs -f --until 24h              # Rotate old logs
```

---

## 🛡️ Security Checklist

- [ ] Change all JWT secrets (strong random values)
- [ ] Use AWS RDS with encrypted connection
- [ ] S3 bucket has proper permissions
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Security groups restrict access appropriately
- [ ] .env file is NOT in git
- [ ] Database backups are automated (RDS snapshots)
- [ ] Monitoring and alerts configured

---

## 📈 Performance Tips

1. **Database Optimization**
   ```sql
   CREATE INDEX idx_lessons_course_id ON lessons(courseId);
   CREATE INDEX idx_users_tenant_id ON users(tenantId);
   ```

2. **Enable Caching**
   - Use Redis for session storage
   - Cache API responses (1h for courses, 15m for lessons)

3. **CDN Configuration**
   - Use CloudFront for S3 videos
   - Set up cache invalidation scripts

4. **Monitor Resources**
   - Set up CloudWatch alarms
   - Monitor disk usage, memory, CPU
   - Set up log aggregation

---

## 🔧 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs ironclad-api

# Check environment
docker-compose config

# Rebuild
docker-compose down -v
docker-compose up -d --build
```

### Database connection error
```bash
# Test connection string
psql "postgresql://user:pass@host:5432/db"

# Verify RDS security group allows EC2
# Check DATABASE_URL in .env
```

### SSL certificate issues
```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Update Nginx SSL paths
sudo nginx -t
```

### Out of memory
```bash
# Check memory usage
free -h
docker stats

# Increase Docker limits
# Edit: /etc/docker/daemon.json
# Restart docker: sudo systemctl restart docker
```

---

## 📝 Backup & Recovery

### Automated Backups (AWS RDS)
- Already configured in RDS settings
- Check: AWS Console → RDS → Automated backups

### Manual Database Backup
```bash
docker-compose exec postgres pg_dump -U ironclad ironclad_db > backup_$(date +%Y%m%d).sql

# Upload to S3 for permanent storage
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U ironclad ironclad_db < backup_20240309.sql
```

---

## 🚀 Next Steps

1. Monitor application performance
2. Set up additional monitoring/alerts
3. Plan for scaling
4. Document your deployment
5. Create runbooks for common tasks
6. Schedule regular backup verifications

---

## 📞 Support

- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- View logs: `docker-compose logs -f api`
