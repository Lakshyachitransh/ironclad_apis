# 🚀 Ironclad APIs - AWS EC2 Deployment Summary

Your Ironclad APIs are now ready to deploy to AWS EC2!

## 📋 What's Included

### 1. **Deployment Files**

- ✅ `deploy.sh` - Automated deployment script
- ✅ `AWS_EC2_DEPLOYMENT_GUIDE.md` - Comprehensive guide with all steps
- ✅ `QUICK_DEPLOY_EC2.md` - 5-minute quick start
- ✅ `DEPLOYMENT_CHECKLIST.md` - Detailed verification checklist

### 2. **What Gets Deployed**

- NestJS API application
- PostgreSQL database (local or RDS)
- PM2 process manager
- Nginx reverse proxy
- SSL/TLS support (Let's Encrypt)
- Database migrations
- S3 integration

## 🚀 Quick Start (5 Minutes)

### Step 1: Create EC2 Instance

1. Go to AWS Console → EC2
2. Launch Instance → Ubuntu 22.04 LTS → t3.medium
3. Create security group with ports: 22, 80, 443, 3000
4. Download .pem key file

### Step 2: SSH to Instance

```bash
ssh -i "path/to/key.pem" ubuntu@<your-ec2-ip>
```

### Step 3: Run Deployment

```bash
cd /tmp
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure & Access

```bash
# Update .env with AWS credentials
nano /home/ubuntu/ironclad_apis/.env

# Restart application
pm2 restart ironclad-api

# Access your API
# Browser: http://<your-ec2-ip>/api/docs
```

## 📚 Documentation

### For Quick Deployment

👉 **Read**: `QUICK_DEPLOY_EC2.md`

- 5-minute deployment
- Common issues & fixes
- Basic commands

### For Detailed Step-by-Step

👉 **Read**: `AWS_EC2_DEPLOYMENT_GUIDE.md`

- Comprehensive instructions
- SSL/TLS setup
- Performance tuning
- Monitoring & backups
- Security best practices

### For Verification

👉 **Read**: `DEPLOYMENT_CHECKLIST.md`

- Pre-deployment checklist
- Verification steps
- Testing procedures
- Troubleshooting guide

## 🔧 Deployment Script Features

The `deploy.sh` script automatically:

1. **System Setup**
   - Updates system packages
   - Installs Node.js 18.x
   - Installs Git

2. **Database**
   - Installs PostgreSQL
   - Creates database and user
   - Sets appropriate permissions

3. **Application**
   - Clones GitHub repository
   - Installs dependencies
   - Builds the project
   - Runs database migrations

4. **Process Management**
   - Installs PM2
   - Starts application with PM2
   - Enables auto-start on reboot

5. **Web Server**
   - Installs Nginx
   - Configures reverse proxy
   - Sets up load balancing

## 📋 Deployment Checklist

**Pre-Deployment:**

- [ ] Code pushed to GitHub (main branch)
- [ ] Local build successful
- [ ] All tests passing

**AWS Setup:**

- [ ] EC2 instance created
- [ ] Security group configured
- [ ] Key pair downloaded

**Deployment:**

- [ ] SSH connection verified
- [ ] Deployment script executed
- [ ] Environment variables configured
- [ ] Application running
- [ ] API accessible

**Post-Deployment:**

- [ ] SSL certificate installed (optional)
- [ ] Database backups configured
- [ ] Monitoring enabled
- [ ] Team notified

## 🌐 Accessing Your API

Once deployed:

### Via Public IP (during development)

```
Swagger Docs: http://<your-ec2-public-ip>/api/docs
API Base: http://<your-ec2-public-ip>/api
```

### Via Domain (production)

```
Swagger Docs: https://yourdomain.com/api/docs
API Base: https://yourdomain.com/api
```

## 🔐 Security Considerations

1. **SSH Access**: Restrict to your IP
2. **Database**: Use strong passwords
3. **JWT Secret**: Use strong, unique secret
4. **SSL/TLS**: Enable HTTPS
5. **Backups**: Enable automated backups
6. **Updates**: Keep system updated

## 💻 Useful Commands

```bash
# Application Management
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all

# System Management
sudo systemctl status postgresql   # Check database
sudo systemctl status nginx        # Check web server

# Database Operations
psql -h localhost -U ironclad_user -d ironclad
SELECT * FROM "User";              # View users

# Git Operations
cd /home/ubuntu/ironclad_apis
git pull origin main               # Update code
npm run build                      # Rebuild
pm2 restart ironclad-api           # Restart app
```

## 📊 Instance Requirements

### Minimum (Development)

- **Instance**: t3.micro or t2.micro
- **Storage**: 20GB
- **Memory**: 1GB
- **CPU**: 1 vCPU
- **Cost**: Free tier or ~$10/month

### Recommended (Production)

- **Instance**: t3.large or larger
- **Storage**: 50GB+ gp3
- **Memory**: 8GB
- **CPU**: 2+ vCPU
- **Database**: AWS RDS PostgreSQL
- **Cost**: ~$50-100/month

## 🔄 Deployment Workflow

```
1. Create EC2 Instance
   ↓
2. Connect via SSH
   ↓
3. Download deploy.sh
   ↓
4. Run ./deploy.sh (automated setup)
   ↓
5. Configure .env file
   ↓
6. Restart application
   ↓
7. Access API via browser
   ↓
8. (Optional) Setup SSL/domain
   ↓
9. Production ready ✓
```

## 🆘 Troubleshooting

### Application won't start

```bash
pm2 logs ironclad-api --lines 100
```

### Database connection error

```bash
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

### Nginx 502 error

```bash
pm2 status
curl http://localhost:3000
```

### Port conflicts

```bash
sudo lsof -i :3000
pm2 kill && npm run start
```

## 📞 Support Resources

1. **NestJS Documentation**: https://docs.nestjs.com
2. **AWS EC2 Documentation**: https://docs.aws.amazon.com/ec2/
3. **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
4. **Nginx Documentation**: https://nginx.org/en/docs/
5. **Prisma Documentation**: https://www.prisma.io/docs/

## 🎯 Next Steps

1. **Read QUICK_DEPLOY_EC2.md** for fast deployment
2. **Create EC2 instance** on AWS
3. **Run deployment script**
4. **Configure environment variables**
5. **Access Swagger docs** to verify
6. **Setup SSL certificate** for production
7. **Enable monitoring** and backups

## ✅ Deployment Complete

Your application is now ready to be deployed to AWS EC2!

**All files are in your GitHub repository:**
👉 https://github.com/Lakshyachitransh/ironclad_apis

---

**Questions?** Refer to the comprehensive guides in your repository.

**Ready to deploy?** Start with `QUICK_DEPLOY_EC2.md` 🚀
