# 🎉 EC2 Deployment - Ready to Deploy!

Your Ironclad APIs application is **fully prepared for AWS EC2 deployment**.

## ⚡ Quick Start (5 minutes)

### 1. Create EC2 Instance
- Go to [AWS Console](https://console.aws.amazon.com) → EC2 → Launch Instance
- Choose: Ubuntu Server 22.04 LTS
- Instance Type: t3.medium (or t2.micro for free tier)
- Security Group: Open ports 22, 80, 443, 3000
- Download your `.pem` key file

### 2. SSH to Your Instance
```bash
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_IP>
```

### 3. Run Automated Deployment
```bash
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 4. Configure Environment
```bash
cd /home/ubuntu/ironclad_apis
nano .env
# Update AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
pm2 restart ironclad-api
```

### 5. Access Your API
```
http://<YOUR_EC2_IP>/api/docs
```

**Done!** Your API is live! 🚀

---

## 📚 Complete Documentation

Choose your path:

### 🆕 First Time? Start Here
→ **[EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)** - Complete step-by-step guide (30 min)

### ⚡ Need Quick Reference?
→ **[EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md)** - One-page cheat sheet (5 min)

### 📖 Want All Details?
→ **[AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)** - Comprehensive manual (60 min)

### 🤖 Setup Auto-Deployment?
→ **[GITHUB_ACTIONS_SETUP_GUIDE.md](./GITHUB_ACTIONS_SETUP_GUIDE.md)** - CI/CD setup (15 min)

### 📋 Need to Verify?
→ **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete verification (15 min)

### 🎯 Master Guide
→ **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Overview of all options (10 min)

---

## 🔑 What You Need

Before deploying:
- ✅ AWS account
- ✅ SSH client (PowerShell, Terminal, or PuTTY)
- ✅ 30 minutes of time

Optional:
- AWS S3 bucket (for video uploads)
- Domain name (for HTTPS)

---

## 💰 Cost Estimate

| Tier | Components | Monthly Cost |
|------|-----------|--------------|
| **Free** | t2.micro EC2 + 30GB storage | $0 (first 12 months) |
| **Small** | t3.medium EC2 + 50GB storage | ~$35 |
| **Production** | t3.large EC2 + RDS + 100GB | ~$130 |

---

## 🚀 What Gets Deployed

```
✅ Complete NestJS API Application
  ├─ JWT Authentication
  ├─ Role-Based Access Control
  ├─ Course Management System
  ├─ Live Classes
  ├─ User Management
  └─ 40+ REST API Endpoints

✅ Infrastructure Stack
  ├─ Node.js 18.x
  ├─ PostgreSQL Database
  ├─ PM2 Process Manager
  └─ Nginx Reverse Proxy

✅ Deployment Automation
  ├─ Automated Setup Script
  ├─ GitHub Actions CI/CD
  └─ Zero-Downtime Updates
```

---

## 🔐 Security Features

- ✅ Private SSH key removed from repository
- ✅ Environment variables managed securely
- ✅ JWT token authentication
- ✅ SSL/TLS support
- ✅ Security group configuration
- ✅ Database access control

---

## 📊 Deployment Options

### Option 1: Automated (Recommended)
Run `deploy.sh` script - Everything configured automatically
**Time**: 5-7 minutes

### Option 2: Manual Step-by-Step
Follow detailed guide for full control
**Time**: 30-60 minutes

### Option 3: CI/CD with GitHub Actions
Push code → Auto-deploy to EC2
**Time**: 15 min setup, 2 min per deploy

---

## 🧪 Testing Your Deployment

After deployment:

```bash
# Check application status
pm2 status

# View logs
pm2 logs ironclad-api

# Test API endpoint
curl http://localhost:3000/api/docs

# Test database
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

---

## 🐛 Quick Troubleshooting

### Application won't start?
```bash
pm2 logs ironclad-api --lines 50 --err
```

### Database connection issues?
```bash
sudo systemctl status postgresql
```

### 502 Bad Gateway?
```bash
pm2 restart ironclad-api
sudo systemctl restart nginx
```

**Full troubleshooting**: See [EC2_INITIAL_SETUP.md - Troubleshooting](./EC2_INITIAL_SETUP.md#-troubleshooting)

---

## 📞 Support

1. **Quick issues**: Check [EC2_DEPLOYMENT_CARD.md](./EC2_DEPLOYMENT_CARD.md)
2. **Common problems**: Check [QUICK_DEPLOY_EC2.md](./QUICK_DEPLOY_EC2.md)
3. **Detailed help**: Check [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)
4. **Verification**: Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## ✅ Deployment Checklist

- [ ] AWS EC2 instance created
- [ ] Security group configured (ports 22, 80, 443, 3000)
- [ ] SSH access working
- [ ] Deployment script executed successfully
- [ ] `.env` file configured with AWS credentials
- [ ] Application showing "online" in PM2
- [ ] API accessible at `/api/docs`
- [ ] No errors in logs
- [ ] (Optional) GitHub Actions secrets configured
- [ ] (Optional) SSL certificate installed

---

## 🎓 Next Steps After Deployment

1. **Test all API endpoints** at `/api/docs`
2. **Setup HTTPS** with SSL certificate (if using domain)
3. **Configure GitHub Actions** for auto-deployment
4. **Setup monitoring** with AWS CloudWatch
5. **Configure database backups**
6. **Document your setup** for team members

---

## 📈 Maintenance

### Daily
```bash
pm2 status                    # Check status
pm2 logs ironclad-api         # View logs
```

### Weekly
```bash
sudo apt update && sudo apt upgrade -y    # Update system
```

### Updates
```bash
cd /home/ubuntu/ironclad_apis
git pull origin main
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
pm2 restart ironclad-api
```

---

## 🔗 Quick Links

- **GitHub Repository**: https://github.com/Lakshyachitransh/ironclad_apis
- **AWS Console**: https://console.aws.amazon.com/ec2/
- **NestJS Docs**: https://docs.nestjs.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

---

## 🎯 Summary

Your deployment package includes:
- ✅ **1 Automated Deployment Script** (`deploy.sh`)
- ✅ **6 Comprehensive Guides** (40+ pages of documentation)
- ✅ **GitHub Actions Workflow** (automatic deployments)
- ✅ **Environment Configuration** (`.env.example`)
- ✅ **Security Best Practices** (key removed, secure defaults)
- ✅ **Error Handling** (automated checks and validation)

**Everything is ready. Just follow the Quick Start above!** 🚀

---

**Need help?** Start with [EC2_INITIAL_SETUP.md](./EC2_INITIAL_SETUP.md)

**Ready to deploy?** Run the Quick Start commands above!

**Your API will be live in 5 minutes!** ⚡
