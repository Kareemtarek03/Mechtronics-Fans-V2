# Railway.com Deployment Guide

Complete guide for deploying Mecha-Eg Fullstack application on Railway.com

---

## Table of Contents
1. [Why Railway?](#why-railway)
2. [Prerequisites](#prerequisites)
3. [Local Testing](#local-testing)
4. [Git Setup](#git-setup)
5. [Railway Deployment](#railway-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Why Railway?

### Advantages over Render.com:
- ✅ **No Cold Starts** - Apps stay running 24/7
- ✅ **Faster Builds** - Optimized build pipeline
- ✅ **Better Free Tier** - $5 credit/month (no sleep)
- ✅ **Simpler Setup** - Automatic detection and configuration
- ✅ **Built-in Database** - Easy PostgreSQL/MySQL/Redis integration
- ✅ **Better DX** - Cleaner dashboard and CLI

### Free Tier Details:
- $5 free credit per month
- ~500 hours of runtime
- No forced sleep/spin-down
- Automatic HTTPS
- Custom domains
- Environment variables

---

## Prerequisites

Before you begin, ensure you have:

- [x] Node.js (v14 or higher) installed
- [x] Git installed
- [x] GitHub account
- [x] Railway.com account (free)
- [x] Your project files ready

---

## Local Testing

**Always test locally before deploying!**

### 1. Navigate to project:
```bash
cd Mecha-Eg-Fullstack
```

### 2. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

### 3. Build frontend:
```bash
npm run build
```

### 4. Start server:
```bash
npm start
```

### 5. Test in browser:
- Open: `http://localhost:5001`
- Test all features
- Check API endpoints
- Verify no console errors

### 6. Stop server:
```bash
Ctrl + C
```

**If everything works locally, proceed to deployment!**

---

## Git Setup

### Initialize Repository (if not done):

```bash
# Initialize git
git init

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Railway deployment"
```

### Create GitHub Repository:

1. Go to https://github.com/new
2. **Repository name:** `Mecha-Eg-Fullstack`
3. **Visibility:** Public or Private (your choice)
4. **Don't** check "Initialize with README"
5. Click **"Create repository"**

### Push to GitHub:

```bash
# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### Verify on GitHub:
- Visit your repository URL
- Ensure all files are visible
- Check that `railway.json`, `nixpacks.toml`, and `Procfile` are present

---

## Railway Deployment

### Step 1: Sign Up / Login

1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. Grant access to your repositories

### Step 2: Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Choose your `Mecha-Eg-Fullstack` repository
4. Click **"Deploy Now"**

### Step 3: Automatic Configuration

Railway will automatically:
- Detect it's a Node.js project
- Read `railway.json` for build settings
- Use `nixpacks.toml` for build configuration
- Install dependencies with `npm install`
- Build frontend with `npm run render-build`
- Start server with `npm start`

### Step 4: Monitor Build

1. Watch the build logs in real-time
2. Build process takes 3-5 minutes
3. Status progression:
   - **Building** → Installing dependencies
   - **Building** → Building frontend
   - **Deploying** → Starting server
   - **Active** → App is live!

### Step 5: Generate Domain

1. Click on your deployed service
2. Go to **"Settings"** tab
3. Scroll to **"Domains"** section
4. Click **"Generate Domain"**
5. Railway provides: `https://your-app-name.up.railway.app`
6. Click the URL to open your app!

---

## Post-Deployment

### Verify Deployment

1. **Test Homepage:**
   - Visit your Railway URL
   - Ensure frontend loads correctly
   - Check for any console errors (F12)

2. **Test API Endpoints:**
   - Use the app's form to submit data
   - Verify API responses
   - Check that fan data processing works

3. **Check Logs:**
   - Go to Railway dashboard
   - Click on your service
   - View **"Deployments"** → **"Logs"**
   - Ensure no errors

### Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter your domain (e.g., `mecha-eg.com`)
4. Update DNS records:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `your-app.up.railway.app`
5. Wait for DNS propagation (5-30 minutes)
6. Railway auto-provisions SSL certificate

### Set Environment Variables (If Needed)

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add variables:
   ```
   NODE_ENV=production
   PORT=5001
   ```
   (Note: Railway auto-sets PORT, but you can override)

### Monitor Usage

1. Go to **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Build times
3. Track your $5 monthly credit usage

---

## Updating Your App

### Make Changes Locally:

```bash
# Make your code changes
# Test locally first!

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature / Fix bug / etc."

# Push to GitHub
git push origin main
```

### Automatic Redeployment:

- Railway detects the Git push
- Automatically triggers new build
- Deploys updated version
- Takes 2-3 minutes
- Zero downtime deployment!

### Manual Redeployment:

If needed, you can manually redeploy:
1. Go to Railway dashboard
2. Click on your service
3. Click **"Deployments"**
4. Click **"Redeploy"** on any deployment

---

## Troubleshooting

### Build Fails

**Symptoms:**
- Build status shows "Failed"
- Red error messages in logs

**Solutions:**
1. Check build logs for specific error
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are listed
4. Check Node.js version compatibility
5. Verify all files are committed to Git

**Common Issues:**
```bash
# Missing dependencies
npm install --save missing-package

# Wrong Node version - add to package.json:
"engines": {
  "node": ">=18.0.0"
}
```

### App Crashes After Deploy

**Symptoms:**
- Build succeeds but app crashes
- "Application Error" message

**Solutions:**
1. Check runtime logs in Railway
2. Verify `output.json` and `MotorData.json` exist in `server/`
3. Check file paths are correct
4. Ensure PORT environment variable is used
5. Verify all imports are correct

**Check logs:**
```bash
# In Railway dashboard
Deployments → Click deployment → View logs
```

### API Endpoints Not Working

**Symptoms:**
- Frontend loads but API calls fail
- 404 or 500 errors

**Solutions:**
1. Verify routes in `server/index.js`
2. Check CORS configuration
3. Ensure API paths are correct
4. Review error logs
5. Test endpoints with Postman/curl

**Test API:**
```bash
curl -X POST https://your-app.up.railway.app/api/fan-data/filter \
  -H "Content-Type: application/json" \
  -d '{"units": {...}, "input": {...}}'
```

### Frontend Not Loading

**Symptoms:**
- Blank page or 404
- Static files not found

**Solutions:**
1. Verify `npm run build` completed successfully
2. Check `client/build/` folder exists
3. Ensure `server/index.js` serves static files
4. Review build logs for errors

### Out of Free Credit

**Symptoms:**
- App stops after using $5 credit
- "Insufficient credits" message

**Solutions:**
1. Add payment method for pay-as-you-go
2. Optimize app to reduce resource usage
3. Upgrade to Hobby plan ($5/month)
4. Monitor usage in Metrics tab

### Database Connection Issues

**If you add a database later:**
1. Ensure DATABASE_URL is set in Variables
2. Check database is running
3. Verify connection string format
4. Review database logs

---

## Railway CLI (Advanced)

For power users, Railway offers a CLI:

### Install:
```bash
npm install -g @railway/cli
```

### Login:
```bash
railway login
```

### Link Project:
```bash
cd Mecha-Eg-Fullstack
railway link
```

### View Logs:
```bash
railway logs
```

### Run Locally with Railway Variables:
```bash
railway run npm start
```

### Deploy from CLI:
```bash
railway up
```

### Open in Browser:
```bash
railway open
```

---

## Best Practices

### 1. Use Environment Variables
- Never hardcode secrets
- Use Railway Variables for sensitive data
- Keep `.env` in `.gitignore`

### 2. Monitor Your App
- Check logs regularly
- Set up alerts (paid plans)
- Monitor resource usage
- Track error rates

### 3. Optimize Performance
- Minimize build size
- Use production builds
- Enable compression
- Cache static assets

### 4. Version Control
- Commit frequently
- Use descriptive commit messages
- Tag releases
- Use branches for features

### 5. Test Before Deploy
- Always test locally first
- Use staging environment (if available)
- Test all features after deployment
- Monitor logs after deploy

---

## Cost Optimization

### Free Tier Tips:
- Monitor usage in Metrics
- Optimize code to reduce CPU/memory
- Use efficient algorithms
- Minimize API calls

### When to Upgrade:
- Exceeding $5/month credit
- Need more resources
- Want priority support
- Require SLA guarantees

### Pricing Tiers:
- **Free:** $5 credit/month
- **Hobby:** $5/month (more resources)
- **Pro:** $20/month (team features)
- **Enterprise:** Custom pricing

---

## Support Resources

- **Documentation:** https://docs.railway.app
- **Discord Community:** https://discord.gg/railway
- **Status Page:** https://status.railway.app
- **Blog:** https://blog.railway.app
- **Twitter:** @Railway

---

## Checklist

- [ ] Local app tested and working
- [ ] Code committed to Git
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project deployed successfully
- [ ] Domain generated
- [ ] App accessible via URL
- [ ] All features tested
- [ ] Logs reviewed
- [ ] Monitoring set up

---

## Summary

**Deployment Time:** ~10-15 minutes
**Difficulty:** Easy
**Cost:** Free ($5 credit/month)
**Maintenance:** Automatic updates via Git push

**Your app is now live on Railway! 🎉**

Share your URL: `https://your-app.up.railway.app`

---

**Need help?** Check the troubleshooting section or visit Railway's Discord community!
