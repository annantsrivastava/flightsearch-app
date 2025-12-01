# FlightFinder Deployment Guide

## 🚀 Quick Start - Choose Your Deployment Method

Your FlightSearch app is ready to deploy! Choose from these options:

### Option 1: Vercel (Recommended - Easiest & Free) ⭐
**Best for: Beginners, quick deployment, free hosting**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd flightsearch-app
   npm install
   vercel
   ```

3. **Follow the prompts:**
   - Login to Vercel (creates free account)
   - Confirm project settings
   - Get your live URL instantly!

**Pros:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deploys from Git
- ✅ Takes 2 minutes

### Option 2: Netlify (Great Alternative - Also Free)
**Best for: Simple deployment with drag-and-drop option**

#### Method A: Netlify CLI
```bash
npm install -g netlify-cli
cd flightsearch-app
npm install
npm run build
netlify deploy --prod
```

#### Method B: Drag & Drop
1. Build your app: `npm run build`
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder
4. Done! Get your URL

**Pros:**
- ✅ Free tier available
- ✅ Drag-and-drop deployment
- ✅ Form handling
- ✅ Serverless functions

### Option 3: GitHub Pages (Free, No Sign-up Needed)
**Best for: If you already use GitHub**

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   "homepage": "https://yourusername.github.io/flightsearch",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

**Pros:**
- ✅ Completely free
- ✅ No extra account needed
- ✅ Version control included

### Option 4: Railway (Modern & Simple)
**Best for: Full-stack apps, backend integration**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   cd flightsearch-app
   railway login
   railway init
   railway up
   ```

**Pros:**
- ✅ Free $5 credit monthly
- ✅ Easy database integration
- ✅ Environment variables
- ✅ Backend support

### Option 5: AWS Amplify (Enterprise-Grade)
**Best for: Scalable production apps**

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize & Deploy:**
   ```bash
   cd flightsearch-app
   amplify init
   amplify add hosting
   amplify publish
   ```

**Pros:**
- ✅ AWS infrastructure
- ✅ Highly scalable
- ✅ CI/CD built-in
- ✅ Free tier available

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All dependencies are installed: `npm install`
- [ ] App builds successfully: `npm run build`
- [ ] Test locally: `npm run dev` (visit http://localhost:3000)
- [ ] No console errors
- [ ] All features work as expected

---

## 🔧 Build Your App Locally First

```bash
# Navigate to project
cd flightsearch-app

# Install dependencies
npm install

# Test locally
npm run dev
# Visit: http://localhost:3000

# Build for production
npm run build
# Creates 'dist' folder with optimized files
```

---

## 🌟 Recommended Deployment Flow

**For Beginners:**
1. Start with **Vercel** - easiest setup
2. Takes literally 2 minutes
3. Free forever for personal projects

**Step-by-step Vercel deployment:**

```bash
# 1. Install packages
cd flightsearch-app
npm install

# 2. Install Vercel
npm install -g vercel

# 3. Deploy (one command!)
vercel

# Follow the prompts:
# - Login/signup (free)
# - Confirm settings
# - Get your live URL!

# 4. For custom domain (optional):
vercel --prod
# Then add your domain in Vercel dashboard
```

---

## 🔐 Environment Variables (Important!)

If you add Amadeus API integration later, you'll need:

1. **Create `.env` file:**
   ```
   VITE_AMADEUS_API_KEY=your_api_key_here
   VITE_AMADEUS_API_SECRET=your_api_secret_here
   ```

2. **Add to deployment platform:**
   - **Vercel:** Project Settings → Environment Variables
   - **Netlify:** Site Settings → Environment Variables
   - **Railway:** Variables tab
   - **Amplify:** Environment Variables section

**Never commit `.env` to Git!** Add to `.gitignore`:
```
.env
.env.local
```

---

## 🎯 Post-Deployment Steps

After deploying:

1. ✅ Test all features on live site
2. ✅ Check mobile responsiveness
3. ✅ Verify social login buttons (they'll need OAuth setup later)
4. ✅ Test filter functionality
5. ✅ Check affiliate links work
6. ✅ Add custom domain (optional)
7. ✅ Set up analytics (Google Analytics, Plausible, etc.)

---

## 🚨 Common Issues & Solutions

### Build fails?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Module not found" error?
```bash
# Make sure all dependencies are installed
npm install react react-dom lucide-react
```

### Blank page after deployment?
- Check browser console for errors
- Verify `base` path in `vite.config.js`
- Ensure all files are in correct directories

---

## 📊 Next Steps After Deployment

Once your app is live:

### Phase 1 (Immediate):
- [ ] Share your URL with friends/test users
- [ ] Get feedback
- [ ] Monitor performance
- [ ] Set up analytics

### Phase 2 (Next Week):
- [ ] Add Amadeus API integration for real flight data
- [ ] Set up affiliate links with booking platforms
- [ ] Apply for affiliate programs:
  - Skyscanner
  - Booking.com
  - Expedia
  - Kayak

### Phase 3 (Future):
- [ ] Custom domain
- [ ] SEO optimization
- [ ] Blog/content marketing
- [ ] Email capture for price alerts

---

## 💡 Pro Tips

1. **Use Vercel for speed** - Deploy in minutes
2. **Test locally first** - Always run `npm run dev` before deploying
3. **Check build logs** - If deployment fails, read the error messages
4. **Start simple** - Get it live first, optimize later
5. **Use analytics** - Track visitors from day 1

---

## 🆘 Need Help?

If you run into issues:

1. Check the platform's documentation
2. Run `npm run build` locally to catch errors
3. Check browser console for errors
4. Verify all files are committed to Git (if using Git deployment)

---

## 🎉 You're Ready!

Choose your deployment method above and get your FlightSearch app live!

**Recommended first deployment: Vercel**
```bash
cd flightsearch-app
npm install
vercel
```

That's it! Your app will be live in 2 minutes! 🚀
