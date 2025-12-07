# AWS EC2 Deployment Checklist

## Pre-Deployment (Local Machine)

- [ ] Code pushed to GitHub (`main` branch)
- [ ] All tests passing (`npm run test`)
- [ ] Build successful locally (`npm run build`)
- [ ] `.env.example` file created with placeholder values
- [ ] Database migrations ready (`prisma/migrations/`)

## AWS Setup

### EC2 Instance

- [ ] EC2 instance created (Ubuntu 22.04 LTS, t3.medium+)
- [ ] Public IP assigned and noted
- [ ] Key pair (.pem file) downloaded and secured
- [ ] Security Group created with proper inbound rules:
  - [ ] SSH (22) from your IP
  - [ ] HTTP (80) from 0.0.0.0/0
  - [ ] HTTPS (443) from 0.0.0.0/0
  - [ ] Custom TCP 3000 from 0.0.0.0/0
  - [ ] PostgreSQL 5432 (if external access needed)

### Database (Choose One)

- [ ] **Option A - Local PostgreSQL**: Will be installed via script
- [ ] **Option B - AWS RDS**:
  - [ ] RDS instance created
  - [ ] Database name: `ironclad`
  - [ ] Master username: `ironclad_user`
  - [ ] Password saved securely
  - [ ] Endpoint noted
  - [ ] Security group allows EC2 access

## Deployment Steps

### 1. SSH Connection

- [ ] SSH key permissions set correctly (chmod 400)
- [ ] Successfully connected to EC2 instance via SSH

```bash
ssh -i "path/to/key.pem" ubuntu@<public-ip>
```

### 2. Run Deployment Script

- [ ] Script downloaded/created on EC2
- [ ] Script made executable: `chmod +x deploy.sh`
- [ ] Script executed successfully: `./deploy.sh`

```bash
# Download and run
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 3. Configuration

- [ ] `.env` file updated with correct database credentials
- [ ] AWS S3 credentials added to `.env`:
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] AWS_S3_BUCKET
- [ ] JWT_SECRET is strong and unique
- [ ] NODE_ENV set to "production"

### 4. Verification

- [ ] Node.js installed: `node --version`
- [ ] NPM installed: `npm --version`
- [ ] PostgreSQL running: `sudo systemctl status postgresql`
- [ ] PM2 running application: `pm2 status`
- [ ] Nginx running: `sudo systemctl status nginx`

### 5. Database

- [ ] Database created: `ironclad`
- [ ] User created: `ironclad_user`
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Seed data loaded (if applicable): `npx prisma db seed`

### 6. Application

- [ ] Application starts without errors: `pm2 logs ironclad-api`
- [ ] Health check endpoint responds: `curl http://localhost:3000/health`
- [ ] Swagger docs accessible: `http://<ec2-ip>:3000/api/docs`
- [ ] API endpoints responding correctly

### 7. Reverse Proxy (Nginx)

- [ ] Nginx configuration created and tested
- [ ] Nginx restarted successfully
- [ ] API accessible through Nginx: `http://<ec2-ip>`
- [ ] No proxy errors in Nginx logs

### 8. Process Management (PM2)

- [ ] PM2 ecosystem config created (optional)
- [ ] PM2 startup hook enabled: `pm2 startup`
- [ ] PM2 processes saved: `pm2 save`
- [ ] Application auto-restarts on system reboot (verify after restart)

## Post-Deployment

### Security Hardening

- [ ] SSH access restricted to specific IPs
- [ ] Security group rules minimized
- [ ] File permissions set correctly (chmod 600 for .env)
- [ ] SSH password authentication disabled
- [ ] Firewall configured (UFW)

### SSL/TLS Certificate

- [ ] Certbot installed: `sudo apt-get install -y certbot python3-certbot-nginx`
- [ ] SSL certificate obtained: `sudo certbot certonly --standalone -d yourdomain.com`
- [ ] Nginx configured for HTTPS
- [ ] Auto-renewal enabled
- [ ] HTTPS endpoint tested: `https://<domain>`

### Monitoring & Logs

- [ ] PM2 monitoring setup: `pm2 monit`
- [ ] Log rotation configured
- [ ] CloudWatch monitoring enabled (optional)
- [ ] Alerts configured for:
  - [ ] Application crashes
  - [ ] High CPU/Memory usage
  - [ ] Failed deployments

### Backups

- [ ] Automated PostgreSQL backups configured
- [ ] First backup completed
- [ ] Backup restoration tested
- [ ] Backup storage location documented

### Maintenance

- [ ] Automated system updates enabled
- [ ] Cron job for weekly OS updates
- [ ] Database maintenance scheduled
- [ ] Log cleanup scheduled

## Testing

### API Testing

- [ ] POST /auth/register works
- [ ] POST /auth/login returns valid JWT
- [ ] Protected endpoints require valid token
- [ ] Course creation works
- [ ] Video upload to S3 works
- [ ] Live class endpoints functional
- [ ] Course assignment endpoints work
- [ ] Progress tracking endpoints work

### Load Testing (Optional)

- [ ] Application handles 100+ concurrent requests
- [ ] Database connection pooling working
- [ ] Memory usage stable under load
- [ ] Response times acceptable

### Disaster Recovery

- [ ] Database backup and restore procedure tested
- [ ] Application redeploy procedure documented
- [ ] Runbook created for common issues
- [ ] Emergency contact information recorded

## Infrastructure Documentation

- [ ] EC2 instance ID documented
- [ ] Database credentials stored securely (AWS Secrets Manager or similar)
- [ ] SSH key location and backup documented
- [ ] Domain/DNS records configured
- [ ] CDN setup (if using CloudFront)
- [ ] Cost monitoring enabled in AWS

## Troubleshooting Checklist

### Application won't start

- [ ] Check PM2 logs: `pm2 logs ironclad-api --lines 100`
- [ ] Check .env file exists and is valid
- [ ] Check database connection: `psql -h localhost -U ironclad_user -d ironclad -c "\dt"`
- [ ] Check Node.js version compatibility

### Database connection errors

- [ ] PostgreSQL service running: `sudo systemctl status postgresql`
- [ ] Credentials correct in .env
- [ ] Database exists: `psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"`

### Nginx 502 Bad Gateway

- [ ] Application running: `pm2 status`
- [ ] Port 3000 accessible: `curl http://localhost:3000`
- [ ] Nginx config valid: `sudo nginx -t`
- [ ] Firewall not blocking: `sudo ufw status`

### High CPU/Memory usage

- [ ] Check PM2 processes: `pm2 monit`
- [ ] Check for memory leaks in logs
- [ ] Restart application: `pm2 restart ironclad-api`
- [ ] Check database query performance

## Deployment Rollback

- [ ] Previous version tag in Git: `git tag -l`
- [ ] Rollback procedure: `git checkout <previous-tag> && npm install && npm run build && pm2 restart`
- [ ] Database rollback (if migrations): `npx prisma migrate resolve`

## Sign-Off

- [ ] Deployment verified by QA
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Deployment recorded in deployment log

---

**Deployment Date**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Status**: ✓ Complete / ⚠ Pending / ✗ Failed

**Notes/Issues**:

---

---
