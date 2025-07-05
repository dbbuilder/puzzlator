# Puzzlator Deployment Guide

This guide walks you through deploying Puzzlator to production at puzzlator.com using Vercel for the frontend and Supabase for the backend.

## Prerequisites

Before starting, ensure you have:
- A domain name (puzzlator.com)
- GitHub account
- Vercel account
- Supabase account
- OpenAI API key
- Domain registrar access (for DNS configuration)

## Step 1: GitHub Repository Setup

1. **Create a new GitHub repository**
   ```bash
   # On GitHub.com:
   # 1. Click "New repository"
   # 2. Name it "puzzlator"
   # 3. Make it private or public as desired
   # 4. Don't initialize with README (we already have one)
   ```

2. **Push your local code to GitHub**
   ```bash
   # In your local project directory
   git remote remove origin  # Remove any existing remote
   git remote add origin https://github.com/YOUR_USERNAME/puzzlator.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Supabase Setup

1. **Create a new Supabase project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New project"
   - Name: "puzzlator-prod"
   - Database Password: Generate a strong password and save it
   - Region: Choose closest to your users
   - Pricing plan: Start with Free, upgrade as needed

2. **Wait for project to initialize** (takes 2-3 minutes)

3. **Run database migrations**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents from `supabase/migrations/standalone_schema.sql`
   - Paste and run in SQL editor
   - This creates all tables, functions, and RLS policies

4. **Configure authentication**
   - Go to Authentication → Providers
   - Enable Email provider (already enabled by default)
   - Configure Email templates:
     - Go to Authentication → Email Templates
     - Update sender name to "Puzzlator"
     - Customize confirmation email

5. **Get your API credentials**
   - Go to Settings → API
   - Copy and save:
     - Project URL (looks like: https://xxxxx.supabase.co)
     - Anon/Public key
     - Service role key (keep this secret!)

6. **Set up Edge Functions** (for AI generation)
   ```bash
   # Install Supabase CLI locally
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy edge functions
   supabase functions deploy generate-puzzle
   ```

7. **Configure Edge Function secrets**
   ```bash
   # Set OpenAI API key
   supabase secrets set OPENAI_API_KEY=your-openai-api-key
   ```

## Step 3: Vercel Setup

1. **Create Vercel account** at [vercel.com](https://vercel.com)

2. **Import GitHub repository**
   - Click "Add New Project"
   - Import from GitHub
   - Select "puzzlator" repository
   - Framework Preset: Vite
   - Root Directory: ./

3. **Configure environment variables**
   Add these in Vercel project settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

## Step 4: Domain Configuration

1. **Add custom domain in Vercel**
   - Go to your project settings → Domains
   - Add "puzzlator.com" and "www.puzzlator.com"

2. **Configure DNS at your domain registrar**
   
   For **puzzlator.com** (apex domain):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   For **www.puzzlator.com**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Wait for DNS propagation** (5 minutes to 48 hours)

4. **SSL certificates** are automatically provisioned by Vercel

## Step 5: Production Environment Variables

1. **Create `.env.production` file** (don't commit this!)
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://puzzlator.com
   ```

2. **Update Vercel environment variables**
   - Add `VITE_APP_URL=https://puzzlator.com`

## Step 6: API Server Deployment

Since we have a custom Express API server, we need to deploy it separately:

### Option A: Vercel Serverless Functions (Recommended)

1. **Convert API to serverless**
   Create `api/index.js`:
   ```javascript
   const app = require('../api-server.cjs');
   module.exports = app;
   ```

2. **Update `vercel.json`**
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api" },
       { "source": "/(.*)", "destination": "/" }
     ]
   }
   ```

### Option B: Separate API Deployment (Railway/Render)

1. **Deploy to Railway.app**
   - Create account at [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository
   - Add environment variables
   - Deploy

2. **Update frontend API URL**
   ```env
   VITE_API_URL=https://your-api.railway.app
   ```

## Step 7: Post-Deployment Configuration

1. **Update CORS settings** in `api-server.cjs`:
   ```javascript
   const corsOptions = {
     origin: ['https://puzzlator.com', 'https://www.puzzlator.com'],
     credentials: true
   };
   ```

2. **Configure Supabase Row Level Security**
   - Review and test RLS policies
   - Ensure proper access controls

3. **Set up monitoring**
   - Vercel Analytics (built-in)
   - Supabase Dashboard for database metrics
   - Consider adding Sentry for error tracking

## Step 8: Testing Production

1. **Functional testing**
   - Create a new account
   - Play a puzzle
   - Check leaderboard
   - Test all features

2. **Performance testing**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Test on mobile devices

3. **Security checklist**
   - ✓ HTTPS enabled
   - ✓ Environment variables secure
   - ✓ API rate limiting configured
   - ✓ CORS properly configured
   - ✓ Database RLS enabled

## Step 9: Backup and Maintenance

1. **Database backups**
   - Supabase provides daily backups on Pro plan
   - Set up additional backup strategy if needed

2. **Monitoring setup**
   ```bash
   # Add to package.json scripts
   "monitor": "npm audit && npm outdated"
   ```

3. **Update strategy**
   - Test updates in staging first
   - Use Vercel preview deployments
   - Monitor error rates after deployment

## Step 10: Launch Checklist

- [ ] Domain DNS configured and propagated
- [ ] SSL certificates active
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Edge functions deployed
- [ ] API server running
- [ ] CORS configured correctly
- [ ] RLS policies tested
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Error tracking configured
- [ ] Performance acceptable
- [ ] Mobile experience tested
- [ ] Social media cards working
- [ ] Analytics configured

## Troubleshooting

### Common Issues

1. **CORS errors**
   - Check API server CORS configuration
   - Verify allowed origins include your domain

2. **Database connection issues**
   - Verify Supabase URL and keys
   - Check RLS policies

3. **Build failures**
   - Check Node version compatibility
   - Review build logs in Vercel

4. **Slow performance**
   - Enable Vercel Edge caching
   - Optimize bundle size
   - Use Supabase connection pooling

## Maintenance Commands

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Database migrations
supabase db push

# Monitor logs
vercel logs

# Force redeploy
vercel --prod
```

## Cost Estimates

### Free Tier Limits
- **Vercel Free**: 100GB bandwidth/month
- **Supabase Free**: 500MB database, 2GB bandwidth
- **Sufficient for**: ~10,000 monthly active users

### When to Upgrade
- **Vercel Pro ($20/month)**: More bandwidth, team features
- **Supabase Pro ($25/month)**: 8GB database, daily backups
- **Total**: ~$45/month for production app

## Support and Updates

- GitHub Issues: [github.com/YOUR_USERNAME/puzzlator/issues](https://github.com/YOUR_USERNAME/puzzlator/issues)
- Email: support@puzzlator.com
- Documentation: This guide + README.md

---

Congratulations! Puzzlator is now live at puzzlator.com! 🎉