# Deployment Guide for Render.com

## Step-by-Step Deployment Instructions

### Step 1: Complete File Setup

Run one of these scripts from your Desktop to copy all necessary files:

**Option A - PowerShell (Recommended):**
```powershell
powershell -ExecutionPolicy Bypass -File copy-files.ps1
```

**Option B - Batch File:**
```cmd
copy-files.bat
```

This will copy:
- All frontend files to `Mecha-Eg-Fullstack/client/`
- Backend data files (`output.json`, `MotorData.json`) to `Mecha-Eg-Fullstack/server/`

### Step 2: Test Locally

```bash
cd Mecha-Eg-Fullstack

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Build the frontend
npm run build

# Start the server
npm start
```

Visit `http://localhost:5001` to test the application.

### Step 3: Initialize Git Repository

```bash
cd Mecha-Eg-Fullstack

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Mecha-Eg Fullstack"
```

### Step 4: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `Mecha-Eg-Fullstack` (or your preferred name)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Mecha-Eg-Fullstack.git
   git branch -M main
   git push -u origin main
   ```

### Step 5: Deploy on Render.com

#### Method 1: Using Render Dashboard (Easiest)

1. **Sign up/Login to Render:**
   - Go to https://render.com
   - Sign up or log in with your GitHub account

2. **Create New Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Click "Connect" next to your GitHub repository
   - If you don't see it, click "Configure account" to grant Render access

3. **Configure the Service:**
   - **Name:** `mecha-eg-fullstack` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Environment:** `Node`
   - **Build Command:** `npm run render-build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or choose paid for better performance)

4. **Advanced Settings (Optional):**
   - **Auto-Deploy:** Yes (recommended)
   - **Environment Variables:** None needed by default

5. **Create Web Service:**
   - Click "Create Web Service"
   - Render will start building and deploying your app
   - This may take 5-10 minutes for the first deployment

6. **Access Your App:**
   - Once deployed, you'll get a URL like: `https://mecha-eg-fullstack.onrender.com`
   - Click the URL to access your application

#### Method 2: Using render.yaml (Infrastructure as Code)

1. **Go to Render Dashboard:**
   - Click "New +" → "Blueprint"

2. **Connect Repository:**
   - Select your `Mecha-Eg-Fullstack` repository
   - Render will automatically detect the `render.yaml` file

3. **Review Configuration:**
   - Verify the settings from `render.yaml`
   - Click "Apply"

4. **Deploy:**
   - Render will build and deploy automatically

### Step 6: Monitor Deployment

- **Build Logs:** Check the "Logs" tab to see build progress
- **Events:** View deployment history in "Events" tab
- **Metrics:** Monitor performance in "Metrics" tab

### Common Issues and Solutions

#### Issue 1: Build Fails
**Solution:** Check build logs for errors. Common causes:
- Missing dependencies in `package.json`
- Node version mismatch (Render uses Node 14+ by default)

#### Issue 2: App Crashes After Deploy
**Solution:** 
- Check if `output.json` and `MotorData.json` are in the `server/` folder
- Verify all file paths in code use relative paths

#### Issue 3: Frontend Not Loading
**Solution:**
- Ensure `npm run build` completed successfully
- Check that `server/index.js` serves static files from `client/build`

#### Issue 4: API Endpoints Not Working
**Solution:**
- Verify the API routes are registered in `server/index.js`
- Check CORS settings if accessing from different domain

### Environment Variables (If Needed)

To add environment variables on Render:
1. Go to your service dashboard
2. Click "Environment" in the left sidebar
3. Add variables:
   - `NODE_ENV=production` (usually auto-set)
   - `PORT` (auto-set by Render)
   - Add any custom variables your app needs

### Updating Your Deployment

After making changes:

```bash
# Commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

Render will automatically detect the push and redeploy (if auto-deploy is enabled).

### Free Tier Limitations

Render's free tier includes:
- ✅ 750 hours/month of runtime
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git
- ⚠️ Apps spin down after 15 minutes of inactivity
- ⚠️ Cold starts may take 30-60 seconds

For production use, consider upgrading to a paid plan.

### Custom Domain (Optional)

To use your own domain:
1. Go to service "Settings"
2. Scroll to "Custom Domain"
3. Add your domain
4. Update DNS records as instructed
5. Render will automatically provision SSL certificate

## Support

For issues specific to Render.com, check:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Render Status](https://status.render.com/)

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Verify frontend functionality
3. ✅ Set up monitoring/alerts (if using paid plan)
4. ✅ Configure custom domain (optional)
5. ✅ Set up database if needed (future enhancement)

---

**Congratulations! Your Mecha-Eg application is now deployed! 🚀**
