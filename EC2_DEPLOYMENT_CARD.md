# 🚀 EC2 Deployment Quick Reference Card

## 1️⃣ CREATE EC2 INSTANCE

```
AWS Console → EC2 → Launch Instance
├─ AMI: Ubuntu Server 22.04 LTS (free tier eligible)
├─ Type: t3.medium (or t2.micro for free tier)
├─ Security Group Inbound Rules:
│  ├─ SSH (22): Your IP only
│  ├─ HTTP (80): 0.0.0.0/0
│  ├─ HTTPS (443): 0.0.0.0/0
│  └─ Custom TCP (3000): 0.0.0.0/0
├─ Storage: 30GB gp3
├─ Key Pair: Download .pem file
└─ Launch
```

## 2️⃣ CONNECT VIA SSH

**Windows (PowerShell):**
```powershell
# First time only
icacls "C:\path\key.pem" /inheritance:r /grant:r "$env:USERNAME:F"

# Connect
ssh -i "C:\path\key.pem" ubuntu@<public-ip>
```

**Linux/Mac:**
```bash
chmod 400 ~/key.pem
ssh -i ~/key.pem ubuntu@<public-ip>
```

## 3️⃣ DEPLOY APPLICATION (Automated)

```bash
cd /tmp
curl -O https://raw.githubusercontent.com/Lakshyachitransh/ironclad_apis/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

⏱️ Takes ~5 minutes
✅ Does everything automatically

## 4️⃣ CONFIGURE ENVIRONMENT

```bash
nano /home/ubuntu/ironclad_apis/.env
```

Update:
```env
# AWS S3 Credentials
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"

# CORS (if needed)
CORS_ORIGIN="https://yourfrontend.com"
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

## 5️⃣ RESTART APPLICATION

```bash
pm2 restart ironclad-api
```

## 6️⃣ ACCESS YOUR API

```
Browser: http://<public-ip>/api/docs
```

You should see Swagger API documentation! 🎉

---

## 📋 DEPLOYMENT FILES

| File | Purpose | Time to Read |
|------|---------|--------------|
| `DEPLOYMENT_READY.md` | Overview & getting started | 5 min |
| `QUICK_DEPLOY_EC2.md` | Fast deployment guide | 10 min |
| `AWS_EC2_DEPLOYMENT_GUIDE.md` | Detailed step-by-step | 30 min |
| `DEPLOYMENT_CHECKLIST.md` | Verification checklist | 20 min |
| `deploy.sh` | Automated deployment script | 5 min (runs) |

---

## 🔍 VERIFY DEPLOYMENT

```bash
# Check application status
pm2 status
# Should show: online

# Check logs
pm2 logs ironclad-api --tail 20
# Should show: application started

# Test database
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
# Should return: 1

# Test API (from EC2)
curl http://localhost:3000/api/docs
# Should return: HTML (Swagger UI)

# Test API (from your machine)
curl http://<public-ip>/api/docs
# Should return: HTML (Swagger UI)
```

---

## 📊 WHAT GETS DEPLOYED

✅ Node.js 18.x
✅ PostgreSQL (Database)
✅ PM2 (Process Manager)
✅ Nginx (Reverse Proxy)
✅ NestJS Application (40+ endpoints)
✅ JWT Authentication
✅ S3 Integration
✅ Auto-restart on reboot
✅ Swagger Documentation

---

## 💻 COMMON COMMANDS

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check app status |
| `pm2 logs` | View application logs |
| `pm2 restart ironclad-api` | Restart app |
| `sudo systemctl status postgresql` | Check database |
| `sudo systemctl restart nginx` | Restart web server |
| `cd /home/ubuntu/ironclad_apis` | Go to app directory |
| `git pull origin main` | Get latest code |
| `npm run build` | Rebuild app |
| `npx prisma migrate deploy` | Run migrations |

---

## 🆘 TROUBLESHOOTING

**App won't start?**
```bash
pm2 logs ironclad-api --lines 50
```

**502 Bad Gateway?**
```bash
pm2 status                           # Check if running
curl http://localhost:3000          # Test directly
sudo systemctl restart nginx         # Restart proxy
```

**Database error?**
```bash
sudo systemctl status postgresql     # Check DB service
psql -h localhost -U ironclad_user -d ironclad -c "SELECT 1"
```

**Can't connect via SSH?**
- Check security group allows port 22
- Check key permissions: `chmod 400 key.pem`
- Check IP is correct: `aws ec2 describe-instances`

---

## 🔐 SECURITY CHECKLIST

- [ ] Restrict SSH to your IP (not 0.0.0.0/0)
- [ ] Use strong database password
- [ ] Use strong JWT_SECRET
- [ ] .env file permissions: `chmod 600 .env`
- [ ] Enable SSL/TLS (Let's Encrypt):
  ```bash
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot certonly --standalone -d yourdomain.com
  ```

---

## 📈 PERFORMANCE TUNING

**Enable PM2 cluster mode:**
```bash
pm2 delete ironclad-api
pm2 start dist/main.js --name "ironclad-api" --instances max
pm2 save
```

**Increase database performance:**
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
# Increase: shared_buffers = 512MB
# Increase: effective_cache_size = 1536MB
sudo systemctl restart postgresql
```

---

## 💾 BACKUP DATABASE

**Manual backup:**
```bash
pg_dump -U ironclad_user -d ironclad > ~/backup_$(date +%Y%m%d).sql
```

**Restore from backup:**
```bash
psql -U ironclad_user -d ironclad < ~/backup_*.sql
```

**Automated backups (daily at 2 AM):**
```bash
crontab -e
# Add: 0 2 * * * pg_dump -U ironclad_user -d ironclad > /home/ubuntu/backups/ironclad_$(date +\%Y\%m\%d).sql
```

---

## 🔄 UPDATE APPLICATION

```bash
cd /home/ubuntu/ironclad_apis

# Get latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Run migrations
npx prisma migrate deploy

# Restart
pm2 restart ironclad-api
```

---

## 💰 ESTIMATED COSTS

| Service | Free Tier | Paid (t3.medium) |
|---------|-----------|-----------------|
| EC2 | 1 x micro (1 year) | ~$30/month |
| RDS | 1 x micro (1 year) | ~$30/month |
| Storage | 20GB free | ~$5/month |
| **Total** | **Free** | **~$65/month** |

---

## 📱 API ENDPOINTS

Once deployed, available endpoints:

```
Authentication:
  POST   /auth/register
  POST   /auth/login

Courses:
  GET    /courses
  POST   /courses
  GET    /courses/:id
  PATCH  /courses/:id

Modules:
  POST   /courses/modules/create
  GET    /courses/modules/:id

Lessons:
  POST   /courses/lessons/create
  GET    /courses/lessons/:id
  POST   /courses/lessons/:id/upload-video

Live Classes:
  GET    /live-classes
  POST   /live-classes
  GET    /live-classes/:id

Users:
  POST   /users
  GET    /users
  GET    /users/:id

Swagger Docs:
  GET    /api/docs
```

---

## 🎯 NEXT STEPS

1. ✅ Create EC2 instance
2. ✅ SSH to instance
3. ✅ Run `deploy.sh`
4. ✅ Configure `.env`
5. ✅ Access `/api/docs`
6. ⭐ (Optional) Setup domain & SSL
7. ⭐ (Optional) Enable monitoring
8. ⭐ (Optional) Setup backups

---

## 📞 RESOURCES

- **GitHub**: https://github.com/Lakshyachitransh/ironclad_apis
- **AWS Console**: https://console.aws.amazon.com
- **NestJS Docs**: https://docs.nestjs.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs

---

**Your API is ready to deploy!** 🚀

Questions? Check `QUICK_DEPLOY_EC2.md` for detailed troubleshooting.
