# 🚀 Ironclad APIs - Complete Deployment Guide

This document provides a complete overview of deploying the Ironclad APIs application to AWS EC2.

## 📖 Documentation Structure

The deployment documentation is organized to help you get started quickly while also providing in-depth information for advanced setups.

### 🎯 Quick Start (5 minutes)

**If you just want to deploy quickly**, follow this path:

1. **[EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)** - Complete step-by-step initial deployment
   - Create EC2 instance
   - Run automated deployment script
   - Configure environment variables
   - Verify deployment

### 📚 Complete Documentation Set

| Document | Purpose | Time | When to Use |
|----------|---------|------|-------------|
| **[EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)** | First-time deployment guide | 30 min | Setting up for the first time |
| **[QUICK_DEPLOY_EC2.md](./QUICK_DEPLOY_EC2.md)** | Quick reference deployment | 10 min | Quick refresher |
| **[AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)** | Comprehensive manual guide | 60 min | Deep understanding needed |
| **[EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md)** | One-page cheat sheet | 5 min | Quick command reference |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Verification checklist | 15 min | Verify everything works |
| **[GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md)** | CI/CD automation setup | 15 min | Setup auto-deployment |
| **[AWS_DEPLOYMENT_SUMMARY.md](./AWS_DEPLOYMENT_SUMMARY.md)** | Overview of deployment options | 5 min | Understanding options |

---

## 🎯 Recommended Path by Experience Level

### 🆕 First Time Deploying

**Follow this sequence:**
1. Read: [EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md) (30 min)
2. Deploy: Run the automated deployment script (5 min)
3. Verify: Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) (15 min)
4. Setup CI/CD: [GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md) (15 min)

**Total Time: ~1 hour**

### ⚡ Need to Deploy Fast

**Follow this sequence:**
1. Skim: [QUICK_DEPLOY_EC2.md](./QUICK_DEPLOY_EC2.md) (5 min)
2. Reference: [EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md) (keep open)
3. Deploy: Run the automated script (5 min)

**Total Time: ~15 minutes**

### 🔧 Want Full Control

**Follow this sequence:**
1. Read: [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md) (60 min)
2. Deploy: Step-by-step manual deployment
3. Verify: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) (15 min)

**Total Time: ~2 hours**

---

## 🚀 Three Ways to Deploy

### Option 1: Automated Script (Recommended)

**Best for**: First-time users, quick deployments

```bash
# SSH to EC2 instance
ssh -i "your-key.pem" ubuntu@<EC2_IP>

# Run deployment script
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**What it does:**
- ✅ Installs all dependencies (Node.js, PostgreSQL, PM2, Nginx)
- ✅ Clones repository from GitHub
- ✅ Configures database
- ✅ Builds and starts application
- ✅ Sets up reverse proxy

**Time**: 5-7 minutes

**Guide**: [EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)

### Option 2: Manual Step-by-Step

**Best for**: Learning, custom configurations, troubleshooting

Follow the comprehensive guide with full explanations of each step.

**Time**: 30-60 minutes

**Guide**: [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)

### Option 3: CI/CD with GitHub Actions

**Best for**: Ongoing updates, team collaboration

Setup once, then every push to GitHub automatically deploys to EC2.

**Time**: 15 minutes setup, 2 minutes per deployment

**Guide**: [GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md)

---

## 📋 Prerequisites

Before deploying, ensure you have:

### Required
- ✅ AWS account with EC2 access
- ✅ SSH client (PowerShell, Terminal, or PuTTY)
- ✅ Basic command line knowledge

### Optional
- ✅ AWS S3 bucket (for video uploads)
- ✅ Domain name (for SSL/HTTPS)
- ✅ GitHub account (for CI/CD)

---

## 🏗️ What Gets Deployed

```
📦 Complete NestJS Application Stack
│
├─ 🔐 Authentication & Authorization
│  ├─ JWT Bearer Token Authentication
│  ├─ Role-Based Access Control (RBAC)
│  ├─ org_admin, training_manager, learner roles
│  └─ Multi-tenant architecture
│
├─ 📚 Course Management System
│  ├─ Course creation and management
│  ├─ Module organization
│  ├─ Lesson management
│  ├─ Video upload to AWS S3
│  ├─ Progress tracking
│  └─ Course assignment
│
├─ 🎓 Live Class System
│  ├─ Live class scheduling
│  ├─ Class management
│  ├─ Student enrollment
│  └─ Attendance tracking
│
├─ 👥 User Management
│  ├─ User registration & authentication
│  ├─ CSV bulk upload
│  ├─ Tenant management
│  └─ Role assignment
│
└─ 📊 Admin Features
   ├─ Database configuration
   ├─ Migration management
   ├─ Tenant statistics
   └─ System monitoring
```

**Total API Endpoints**: 40+

---

## 🔧 Infrastructure Stack

```
AWS EC2 Instance (Ubuntu 22.04 LTS)
│
├─ Node.js 18.x LTS ─────────────┐
│                                 │
├─ PostgreSQL 14+ ───────────────┤ Core Services
│                                 │
├─ PM2 Process Manager ──────────┤
│                                 │
└─ Nginx Reverse Proxy ──────────┘

External Services (Optional):
├─ AWS S3 (video storage)
├─ AWS RDS (managed database)
└─ AWS CloudFront (CDN)
```

---

## 💰 Cost Estimation

### 💵 Free Tier (First 12 months)
```
EC2 t2.micro        : $0/month
30 GB Storage       : $0/month
─────────────────────────────────
Total               : $0/month ✅
```

### 💵 Small Production
```
EC2 t3.medium       : $30/month
50 GB Storage       : $5/month
─────────────────────────────────
Total               : $35/month
```

### 💵 Medium Production
```
EC2 t3.large        : $60/month
RDS db.t3.small     : $60/month
100 GB Storage      : $10/month
CloudFront CDN      : $10/month
─────────────────────────────────
Total               : $140/month
```

---

## 🎯 Quick Deployment Steps

### Step 1: Create EC2 Instance (10 min)
- Launch Ubuntu 22.04 LTS
- Instance type: t3.medium (recommended)
- Security group: Ports 22, 80, 443, 3000
- Download `.pem` key file

**Detailed Instructions**: [EC2_INITIAL_SETUP.md - Step 1](./EC2_INITIAL_SETUP.md#step-1-create-ec2-instance-10-minutes)

### Step 2: Connect via SSH (2 min)
```bash
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_IP>
```

**Detailed Instructions**: [EC2_INITIAL_SETUP.md - Step 2](./EC2_INITIAL_SETUP.md#step-2-connect-to-ec2-instance-5-minutes)

### Step 3: Run Deployment Script (7 min)
```bash
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**Detailed Instructions**: [EC2_INITIAL_SETUP.md - Step 3](./EC2_INITIAL_SETUP.md#step-3-run-automated-deployment-5-7-minutes)

### Step 4: Configure Environment (3 min)
```bash
cd /home/ubuntu/ironclad_apis
nano .env
# Update AWS credentials and other settings
pm2 restart ironclad-api
```

**Detailed Instructions**: [EC2_INITIAL_SETUP.md - Step 4](./EC2_INITIAL_SETUP.md#step-4-configure-environment-variables-3-minutes)

### Step 5: Access Your API ✅
```
http://<YOUR_EC2_IP>/api/docs
```

**Verification**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🧪 Testing Your Deployment

### Basic Health Check

```bash
# From EC2 instance
curl http://localhost:3000/api/docs

# From your computer (browser)
http://<YOUR_EC2_IP>/api/docs
```

### Test API Endpoints

```bash
# Register a user
curl -X POST http://<YOUR_EC2_IP>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://<YOUR_EC2_IP>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword"
  }'
```

**Full Testing Guide**: [DEPLOYMENT_CHECKLIST.md - Testing Section](./DEPLOYMENT_CHECKLIST.md#testing)

---

## 🔄 Deployment Updates

### Manual Update Process

```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@<EC2_IP>

# Update application
cd /home/ubuntu/ironclad_apis
git pull origin main
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
pm2 restart ironclad-api
```

### Automated Updates (GitHub Actions)

Setup once: [GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md)

Then:
```bash
# Just push your code
git push origin main
```

GitHub Actions automatically:
- ✅ Deploys to EC2
- ✅ Runs migrations
- ✅ Restarts application
- ✅ Verifies deployment

---

## 🐛 Common Issues & Solutions

### Issue: Application won't start

**Quick Fix:**
```bash
pm2 logs ironclad-api --lines 50 --err
```

**Full Guide**: [EC2_INITIAL_SETUP.md - Troubleshooting](./EC2_INITIAL_SETUP.md#-troubleshooting)

### Issue: Can't connect to database

**Quick Fix:**
```bash
sudo systemctl status postgresql
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

### Issue: 502 Bad Gateway

**Quick Fix:**
```bash
pm2 status
sudo systemctl status nginx
pm2 restart ironclad-api
sudo systemctl restart nginx
```

**Comprehensive Troubleshooting**: [AWS_EC2_DEPLOYMENT_GUIDE.md - Troubleshooting](./AWS_EC2_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 📊 Useful Commands

### Application Management
```bash
pm2 status                    # Check status
pm2 logs ironclad-api         # View logs
pm2 restart ironclad-api      # Restart app
pm2 monit                     # Real-time monitoring
```

### Database Management
```bash
psql -h localhost -U ironclad_user -d ironclad  # Connect
pg_dump -U ironclad_user -d ironclad > backup.sql  # Backup
psql -U ironclad_user -d ironclad < backup.sql     # Restore
```

### System Management
```bash
sudo systemctl status nginx      # Check Nginx
sudo systemctl restart nginx     # Restart Nginx
sudo tail -f /var/log/nginx/error.log  # View errors
```

**Full Command Reference**: [EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md)

---

## 🔒 Security Checklist

After deployment, secure your instance:

- [ ] Change default database password
- [ ] Restrict SSH to your IP only
- [ ] Setup SSL certificate (HTTPS)
- [ ] Remove port 3000 from security group
- [ ] Enable fail2ban for SSH protection
- [ ] Setup database backups
- [ ] Configure firewall (UFW)
- [ ] Enable CloudWatch monitoring

**Full Security Guide**: [AWS_EC2_DEPLOYMENT_GUIDE.md - Security](./AWS_EC2_DEPLOYMENT_GUIDE.md#security-best-practices)

---

## 🎓 Learning Path

### Beginner
1. Use automated deployment script
2. Learn basic PM2 commands
3. Setup GitHub Actions for updates

### Intermediate
1. Understand each deployment step
2. Configure custom domains
3. Setup SSL certificates
4. Implement monitoring

### Advanced
1. Setup blue-green deployments
2. Configure auto-scaling
3. Implement CloudFront CDN
4. Setup disaster recovery

---

## 📞 Support & Resources

### Documentation
- **Quick Start**: [EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)
- **Comprehensive Guide**: [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)
- **Troubleshooting**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **CI/CD Setup**: [GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md)

### External Resources
- [NestJS Documentation](https://docs.nestjs.com)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Troubleshooting Steps
1. Check application logs: `pm2 logs ironclad-api`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL: `sudo systemctl status postgresql`
4. Review deployment guides
5. Check security group settings

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible at `/api/docs`
- [ ] Can create user accounts
- [ ] Can login and receive JWT token
- [ ] Protected endpoints require authentication
- [ ] Database migrations completed
- [ ] No errors in PM2 logs
- [ ] Nginx serving requests
- [ ] SSL certificate installed (if applicable)
- [ ] GitHub Actions configured (if applicable)
- [ ] Backups scheduled
- [ ] Monitoring enabled
- [ ] Team notified

**Full Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🎉 Next Steps

After successful deployment:

1. **Test all endpoints** using Swagger docs
2. **Setup SSL certificate** for HTTPS (if using domain)
3. **Configure GitHub Actions** for auto-deployment
4. **Setup monitoring** with AWS CloudWatch
5. **Configure backups** for database
6. **Document** any customizations
7. **Train team** on update process

---

## 📈 Monitoring & Maintenance

### Daily
- [ ] Check application status: `pm2 status`
- [ ] Review error logs: `pm2 logs ironclad-api --err`

### Weekly
- [ ] Review all logs
- [ ] Check disk space: `df -h`
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Verify backups

### Monthly
- [ ] Review AWS billing
- [ ] Check security updates
- [ ] Review performance metrics
- [ ] Test disaster recovery

**Full Maintenance Guide**: [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)

---

## 🚀 Ready to Deploy?

**Start here**: [EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)

Or use the quick reference: [EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md)

---

**Your complete deployment solution!** 🎯

Everything you need to deploy, maintain, and scale the Ironclad APIs on AWS EC2.
