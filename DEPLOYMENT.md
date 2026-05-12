# Deployment Guide - Cube Group Payroll Platform

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account with the repository: https://github.com/kevin21quirk/cubegroup
- Vercel account (free tier available)
- Neon.tech database (already configured)

### Step 1: Sign Up/Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project

1. Click "Add New..." → "Project"
2. Find and select `kevin21quirk/cubegroup` from your repositories
3. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Next.js (should be auto-detected)

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build` (auto-configured)

**Output Directory:** `.next` (auto-configured)

### Step 4: Add Environment Variables

Click "Environment Variables" and add the following:

#### Required Variables:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_o4MX3WjYpfsd@ep-withered-mode-abnj4esk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# App URL (will be provided by Vercel after first deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional (for full functionality):

```bash
# Clerk Authentication (when ready)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxx

# Vercel Blob Storage (for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx

# Gmail API (for email integration)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Once deployed, you'll get a URL like: `https://cubegroup-xxx.vercel.app`

### Step 6: Update Environment Variables

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
4. Redeploy the application

### Step 7: Verify Deployment

1. Visit your Vercel URL
2. You should see the Cube Group dashboard
3. Test creating a company to verify database connection
4. Check that all pages load correctly

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Push to `main` branch** → Automatic production deployment
- **Push to other branches** → Preview deployments

---

## 📊 Database Management

Your Neon database is already configured and running:

- **Connection String:** Already set in environment variables
- **Schema:** Already pushed with all tables
- **Access:** Use Prisma Studio locally: `npm run db:studio`

---

## 🔧 Post-Deployment Configuration

### Enable Authentication (Optional)

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy API keys to Vercel environment variables
4. Uncomment auth code in:
   - `src/middleware.ts`
   - `src/app/layout.tsx`
   - `src/app/(dashboard)/layout.tsx`
   - `src/components/dashboard/header.tsx`
5. Push changes to GitHub (auto-deploys)

### Enable AI Features (Optional)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY` to Vercel environment variables
3. Redeploy

### Enable File Storage (Optional)

1. In Vercel dashboard, go to Storage
2. Create a new Blob store
3. Copy the token to `BLOB_READ_WRITE_TOKEN`
4. Redeploy

---

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., `cubegroup.com`)
4. Follow Vercel's DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain

---

## 📈 Monitoring & Analytics

Vercel provides built-in:
- **Analytics:** Page views, performance metrics
- **Logs:** Real-time function logs
- **Speed Insights:** Core Web Vitals
- **Error Tracking:** Runtime errors

Access these in your Vercel dashboard under your project.

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** (already in .gitignore)
2. **Use environment variables** for all secrets
3. **Enable Clerk authentication** for production
4. **Set up proper CORS** if using external APIs
5. **Monitor logs** for suspicious activity

---

## 🐛 Troubleshooting

### Build Fails

- Check build logs in Vercel
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

### Database Connection Issues

- Verify Neon database is running
- Check connection string format
- Ensure SSL mode is enabled

### Pages Not Loading

- Check function logs in Vercel
- Verify all dependencies are installed
- Check for TypeScript errors

---

## 📞 Support

For deployment issues:
- Vercel Documentation: https://vercel.com/docs
- Neon Documentation: https://neon.tech/docs
- GitHub Issues: https://github.com/kevin21quirk/cubegroup/issues

---

**Your application is now live and ready for production use! 🎉**

Next steps:
1. Add companies and workers
2. Upload payroll data
3. Configure optional integrations
4. Monitor usage and performance
