# GitHub Secrets Setup for CI/CD

## Required Secrets

Add these secrets to your GitHub repository:

### 1. Vercel Secrets
Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

- `VERCEL_TOKEN`: Get from [Vercel Account Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID`: Found in Vercel project settings
- `VERCEL_PROJECT_ID`: Found in Vercel project settings

### 2. Supabase Secrets

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_DB_URL`: Direct database connection string

To get `SUPABASE_DB_URL`:
1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection string" 
3. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add each secret with its name and value

## Available Workflows

After setting up secrets, you can:

### 1. **Automatic Deployment** (on push to main)
- Builds and deploys to Vercel automatically
- Runs tests before deployment

### 2. **Manual Database Setup**
- Go to **Actions** tab
- Select **"Supabase Database Setup"**
- Click **"Run workflow"**
- Choose environment and run

### 3. **Database Status Check**
- Runs weekly automatically
- Or trigger manually from Actions tab
- Creates a status badge

## Testing the Setup

1. Make a small change (like updating version)
2. Push to main branch
3. Check the **Actions** tab
4. You should see workflows running

## Troubleshooting

If workflows fail:
- Check that all secrets are set correctly
- Look at the workflow logs for specific errors
- Ensure Supabase project is active
- Verify Vercel project exists