# 🚀 FlightFinder - Deployment Commands Cheat Sheet

## Copy-Paste Ready Commands

### 1️⃣ Vercel Deployment (EASIEST - Recommended) ⭐

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Deploy!
vercel

# For production deployment with custom domain
vercel --prod
```

---

### 2️⃣ Netlify Deployment

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to production
netlify deploy --prod

# Or use interactive mode
netlify deploy
```

---

### 3️⃣ GitHub Pages

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts (manual step):
# "deploy": "gh-pages -d dist",
# "predeploy": "npm run build"

# Then deploy
npm run deploy
```

---

### 4️⃣ Railway Deployment

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

### 5️⃣ Local Testing (Before Deployment)

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in browser

# Build for production (test the build)
npm run build

# Preview production build
npm run preview
```

---

### 6️⃣ Using the Deployment Script

```bash
# Navigate to project
cd flightsearch-app

# Make script executable (Mac/Linux)
chmod +x deploy.sh

# Run the script
./deploy.sh

# Choose option 1 for Vercel
# Choose option 4 to test locally first
```

---

## 🔧 Troubleshooting Commands

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Node Version
```bash
node -v
npm -v
```

### Update npm
```bash
npm install -g npm@latest
```

### Check Build Locally
```bash
npm run build
# Check for errors in the output
```

### Clear npm Cache
```bash
npm cache clean --force
npm install
```

---

## 📋 Quick Verification Checklist

Before deploying, verify:

```bash
# ✅ Check Node.js is installed
node -v

# ✅ Install dependencies
npm install

# ✅ Test build works
npm run build

# ✅ Test locally
npm run dev

# ✅ Check for console errors
# Open http://localhost:3000 and check browser console
```

---

## 🎯 Fastest Deployment Path

**For absolute beginners (2 minutes):**

```bash
cd flightsearch-app
npm install
npm install -g vercel
vercel
```

Done! You'll get a live URL instantly! 🎉

---

## 🌐 Post-Deployment

### Get Your URL
After deploying, you'll receive a URL like:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- Railway: `https://your-app.railway.app`

### Custom Domain (Optional)
```bash
# Vercel
vercel domains add yourdomain.com

# Netlify (via dashboard or CLI)
netlify domains:add yourdomain.com
```

### Environment Variables (For Amadeus API later)
```bash
# Vercel
vercel env add VITE_AMADEUS_API_KEY

# Netlify
netlify env:set VITE_AMADEUS_API_KEY your_key_here
```

---

## 💡 Pro Tips

1. **Always test locally first**: Run `npm run dev` before deploying
2. **Check build logs**: If deployment fails, read the error messages
3. **Use Vercel for simplicity**: It's the easiest and has the best DX
4. **Keep dependencies updated**: Run `npm update` regularly
5. **Monitor after deploy**: Check your live site immediately after deployment

---

## 🆘 Common Issues

### "Command not found"
```bash
# Install the missing package globally
npm install -g <package-name>
```

### Build fails with "Module not found"
```bash
npm install
# Check that all imports in code are correct
```

### Port already in use
```bash
# Kill the process using port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
# Then kill the PID shown
```

---

## 🎉 Success Indicators

You've successfully deployed when you:
- ✅ Get a live URL
- ✅ Can access your app in a browser
- ✅ All features work (filters, search, etc.)
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Social login buttons appear

---

## 📞 Next Commands After Deployment

### Update Your Deployed App
```bash
# Make changes to your code
# Then redeploy:

# Vercel
vercel --prod

# Netlify
npm run build
netlify deploy --prod
```

### View Deployment Logs
```bash
# Vercel
vercel logs

# Netlify
netlify logs
```

---

## 🚀 Ready to Deploy?

Pick one command set above and run it!

**Recommended for first-timers:**
```bash
cd flightsearch-app
npm install
npm install -g vercel
vercel
```

That's it! Your FlightFinder will be live! 🎉
