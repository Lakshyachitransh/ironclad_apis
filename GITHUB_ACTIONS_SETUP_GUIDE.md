# GitHub Actions CI/CD Setup Guide

This guide explains how to configure GitHub Actions for automatic deployment to your EC2 instance whenever you push code to the main branch.

## 🎯 What is GitHub Actions?

GitHub Actions is a CI/CD (Continuous Integration/Continuous Deployment) platform that:
- ✅ Automatically deploys code when you push to GitHub
- ✅ Runs tests before deployment
- ✅ Keeps your EC2 instance up to date
- ✅ No manual SSH needed for updates

## 📋 Prerequisites

Before setting up GitHub Actions, ensure:
- ✅ EC2 instance is running
- ✅ Application successfully deployed using `deploy.sh`
- ✅ You have the EC2 `.pem` key file
- ✅ You know your EC2 instance's public IP address

## 🔧 Setup Instructions

### Step 1: Locate Your EC2 Information

You'll need these two pieces of information:

1. **EC2 Public IP Address**
   - Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
   - Click on your instance
   - Copy the **Public IPv4 address** (e.g., `54.123.45.67`)

2. **EC2 SSH Private Key**
   - This is your `.pem` file (e.g., `ironclad-ec2-key.pem`)
   - **Important**: Never commit this file to GitHub!

### Step 2: Add GitHub Secrets

GitHub Secrets allow you to securely store sensitive information that GitHub Actions can access.

#### 2.1 Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/Lakshyachitransh/ironclad_apis`
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"** button

#### 2.2 Add EC2_HOST Secret

1. Click **"New repository secret"**
2. Enter:
   ```
   Name: EC2_HOST
   Secret: YOUR_EC2_PUBLIC_IP
   ```
   Example: `54.123.45.67`
3. Click **"Add secret"**

#### 2.3 Add EC2_SSH_KEY Secret

1. Click **"New repository secret"** again
2. Enter:
   ```
   Name: EC2_SSH_KEY
   Secret: [Your entire .pem file content]
   ```

**How to get your .pem file content:**

**On Windows (PowerShell):**
```powershell
# Navigate to folder with .pem file
cd C:\path\to\your\keys

# View content
Get-Content ironclad-ec2-key.pem | clip  # Copies to clipboard
```

**On Windows (Notepad):**
- Right-click `ironclad-ec2-key.pem`
- Open with Notepad
- Select All (Ctrl+A), Copy (Ctrl+C)

**On Mac/Linux:**
```bash
# View and copy
cat ~/path/to/ironclad-ec2-key.pem
```

The content should look like:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
[many lines of encrypted text]
...
-----END RSA PRIVATE KEY-----
```

3. Paste the **entire content** (including BEGIN and END lines)
4. Click **"Add secret"**

### Step 3: Verify Secrets are Added

You should now see:
- ✅ `EC2_HOST`
- ✅ `EC2_SSH_KEY`

**Note**: GitHub won't show the actual values for security. You'll only see the names.

---

## ✅ Test GitHub Actions Deployment

### Method 1: Make a Test Change

1. **Make a small change** to any file (e.g., update README.md):
   ```bash
   git clone https://github.com/Lakshyachitransh/ironclad_apis.git
   cd ironclad_apis
   echo "Test deployment" >> README.md
   git add README.md
   git commit -m "test: Trigger deployment"
   git push origin main
   ```

2. **Watch the deployment:**
   - Go to your repository on GitHub
   - Click **Actions** tab (top menu)
   - You should see a workflow running: "Deploy to EC2"
   - Click on it to view real-time logs

3. **Verify deployment succeeded:**
   - Workflow should show green checkmark ✅
   - Visit your API: `http://<YOUR_EC2_IP>/api/docs`
   - Changes should be reflected

### Method 2: Manual Trigger

1. Go to **Actions** tab in GitHub
2. Click **"Deploy to EC2"** workflow (left sidebar)
3. Click **"Run workflow"** button (right side)
4. Select `main` branch
5. Click **"Run workflow"**

---

## 🔄 How It Works

The GitHub Actions workflow (`.github/workflows/deploy-to-ec2.yml`) automatically:

```yaml
When: You push code to main branch
Then:
  1. Connects to EC2 via SSH
  2. Pulls latest code from GitHub
  3. Installs dependencies
  4. Generates Prisma Client
  5. Builds the application
  6. Runs database migrations
  7. Restarts PM2 process
  8. Verifies deployment
```

**Timeline**: ~2-3 minutes per deployment

---

## 📊 Workflow Stages

### Stage 1: Checkout Code
GitHub Actions downloads your repository code.

### Stage 2: Setup SSH
Creates SSH connection to your EC2 instance using the secrets you provided.

### Stage 3: Test Connection
Verifies SSH connection works before deployment.

### Stage 4: Deploy Application
Runs deployment commands on your EC2 instance:
- Pulls latest code
- Installs dependencies
- Generates Prisma client
- Builds project
- Runs migrations
- Restarts application

### Stage 5: Verify Deployment
Tests if the API is responding correctly.

---

## 🐛 Troubleshooting

### Error: "Permission denied (publickey)"

**Cause**: EC2_SSH_KEY secret is incorrect or incomplete.

**Fix**:
1. Delete existing `EC2_SSH_KEY` secret
2. Re-add it with complete `.pem` file content
3. Ensure you copied the entire file including:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----
   ```

### Error: "ssh: connect to host X.X.X.X port 22: Connection timed out"

**Cause**: EC2_HOST is wrong or EC2 security group doesn't allow GitHub's IP.

**Fix**:
1. Verify `EC2_HOST` secret has correct IP address
2. Check EC2 security group allows port 22 from `0.0.0.0/0` (or GitHub IP ranges)
3. Verify EC2 instance is running

### Error: "git pull" fails

**Cause**: GitHub repository was removed or renamed, or git config issue on EC2.

**Fix**:
1. SSH to EC2:
   ```bash
   ssh -i "key.pem" ubuntu@<EC2_IP>
   ```
2. Check git remote:
   ```bash
   cd /home/ubuntu/ironclad_apis
   git remote -v
   ```
3. If remote is wrong, update it:
   ```bash
   git remote set-url origin https://github.com/Lakshyachitransh/ironclad_apis.git
   ```

### Error: "pm2 restart failed"

**Cause**: Application not yet deployed or PM2 process name is wrong.

**Fix**:
1. SSH to EC2
2. Check PM2 processes:
   ```bash
   pm2 list
   ```
3. If no processes exist, run initial deployment:
   ```bash
   cd /home/ubuntu/ironclad_apis
   pm2 start dist/main.js --name "ironclad-api"
   pm2 save
   ```

### Error: "npm run build" fails

**Cause**: Missing dependencies or Prisma client not generated.

**Fix**: The workflow now includes `npx prisma generate` before build. If still failing:
1. SSH to EC2
2. Check logs:
   ```bash
   cd /home/ubuntu/ironclad_apis
   npm run build
   ```
3. Fix any errors shown
4. Commit fixes and push to GitHub

### Workflow Runs But Changes Not Deployed

**Cause**: Application is cached or build artifacts not updated.

**Fix**:
1. SSH to EC2
2. Clear build cache and rebuild:
   ```bash
   cd /home/ubuntu/ironclad_apis
   rm -rf dist node_modules
   npm install
   npx prisma generate
   npm run build
   pm2 restart ironclad-api
   ```

---

## 🔐 Security Best Practices

### 1. Protect Your Secrets

- ✅ Never commit `.pem` files to GitHub
- ✅ Never share GitHub secrets with unauthorized users
- ✅ Rotate SSH keys periodically
- ✅ Use GitHub's environment protection rules for production

### 2. Limit SSH Access

Update EC2 security group to restrict SSH:
- Change SSH source from `0.0.0.0/0` to:
  - Your office IP address
  - GitHub Actions IP ranges
  - VPN IP addresses

### 3. Use Environment Secrets

For sensitive environment variables (AWS keys, DB passwords):
1. Go to GitHub Settings → Secrets → Actions
2. Add secrets for each variable:
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   DATABASE_URL
   JWT_SECRET
   ```
3. Update workflow to inject these during deployment

### 4. Monitor Deployments

- ✅ Enable GitHub Actions email notifications
- ✅ Review failed deployment logs immediately
- ✅ Set up AWS CloudWatch alarms
- ✅ Monitor PM2 logs after each deployment

---

## 📧 Setup Email Notifications

### Enable for Your Account

1. Go to GitHub.com → Your Profile → **Settings**
2. Click **Notifications** (left sidebar)
3. Under "Actions", check:
   - ✅ "Send notifications for failed workflows only"
   - ✅ Or "Send notifications for all workflow runs"

### Enable for Repository Watchers

1. Go to your repository
2. Click **Watch** (top right)
3. Select **"All Activity"**
4. All watchers will get notifications

---

## 🚀 Advanced: Multiple Environments

Want separate staging and production environments?

### Create Additional Secrets

Add environment-specific secrets:
```
EC2_HOST_STAGING
EC2_SSH_KEY_STAGING
EC2_HOST_PRODUCTION
EC2_SSH_KEY_PRODUCTION
```

### Create Multiple Workflows

Create separate workflow files:
- `.github/workflows/deploy-staging.yml` - Triggers on `develop` branch
- `.github/workflows/deploy-production.yml` - Triggers on `main` branch

### Use GitHub Environments

1. Go to repository **Settings** → **Environments**
2. Create environments: `staging`, `production`
3. Add environment-specific secrets
4. Configure protection rules (e.g., require approval for production)

---

## 📊 Monitoring Deployments

### View Deployment History

1. Go to **Actions** tab
2. View all past deployments
3. Click any deployment to see:
   - Git commit that triggered it
   - Full deployment logs
   - Errors (if any)
   - Duration

### Deployment Dashboard

Create a deployment dashboard:
1. Go to **Insights** → **Pulse**
2. View merge and deployment frequency
3. Track deployment success rate

---

## 🔄 Rollback Strategy

If a deployment breaks something:

### Option 1: Revert Commit

```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main
```

GitHub Actions will automatically deploy the reverted version.

### Option 2: Manual Rollback

1. SSH to EC2:
   ```bash
   ssh -i "key.pem" ubuntu@<EC2_IP>
   ```
2. Rollback to previous commit:
   ```bash
   cd /home/ubuntu/ironclad_apis
   git log --oneline -n 5  # Find previous commit
   git checkout <previous-commit-hash>
   npm install
   npx prisma generate
   npm run build
   npx prisma migrate deploy
   pm2 restart ironclad-api
   ```

### Option 3: Re-run Previous Workflow

1. Go to **Actions** tab
2. Find successful deployment
3. Click **"Re-run all jobs"**

---

## 📋 Deployment Checklist

After setting up GitHub Actions:

- [ ] EC2_HOST secret added
- [ ] EC2_SSH_KEY secret added
- [ ] Test deployment triggered successfully
- [ ] Application accessible after deployment
- [ ] No errors in workflow logs
- [ ] Email notifications configured
- [ ] Documented for team members
- [ ] Rollback procedure tested

---

## 🎯 Summary

You've successfully set up CI/CD! Now:

✅ **Every push to `main` branch** automatically deploys to EC2
✅ **No manual SSH needed** for updates
✅ **Deployment takes 2-3 minutes**
✅ **Automatic verification** after deployment
✅ **Email notifications** on failure

**Next Steps:**
- Make a code change and push to test
- Set up monitoring with AWS CloudWatch
- Configure production environment protection
- Document deployment process for team

---

## 📚 Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **EC2 Deployment Guide**: See `EC2_INITIAL_SETUP.md`
- **Troubleshooting**: See `AWS_EC2_DEPLOYMENT_GUIDE.md`

---

**Your CI/CD pipeline is ready!** 🚀

Every push to GitHub now automatically deploys to your EC2 instance!
