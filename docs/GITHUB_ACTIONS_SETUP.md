# GitHub Actions Setup Guide

## Prerequisites

1. A Vercel account with the Puzzlator project deployed
2. A Supabase project (optional, for database features)
3. Admin access to the GitHub repository

## Step 1: Get Vercel Credentials

1. **Get Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click "Create"
   - Name it "GitHub Actions"
   - Copy the token (you won't see it again!)

2. **Get Vercel Org ID and Project ID:**
   - Go to your Vercel dashboard
   - Click on the Puzzlator project
   - Go to Settings → General
   - Copy the "Org ID" and "Project ID"

## Step 2: Add GitHub Secrets

1. Go to https://github.com/dbbuilder/puzzlator/settings/secrets/actions
2. Click "New repository secret" for each:

### Required Secrets:

| Secret Name | Where to Find It |
|-------------|------------------|
| `VERCEL_TOKEN` | From Step 1.1 |
| `VERCEL_ORG_ID` | From Step 1.2 |
| `VERCEL_PROJECT_ID` | From Step 1.2 |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |

### Optional (for database setup):

| Secret Name | Where to Find It |
|-------------|------------------|
| `SUPABASE_DB_URL` | Supabase Dashboard → Settings → Database → Connection string |

## Step 3: Test the Setup

1. Make a small change (update version number)
2. Push to main branch
3. Check Actions tab: https://github.com/dbbuilder/puzzlator/actions

## Troubleshooting

### Vercel Deployment Fails
- Check that all three Vercel secrets are set
- Ensure the project exists in Vercel
- Verify the token hasn't expired

### Tests Fail in CI
- The API integration tests require a backend server
- These can be safely ignored with `continue-on-error: true`
- Or disable them in CI by updating the test scripts

### Database Setup Fails
- Ensure `SUPABASE_DB_URL` includes the password
- Check that the database is accessible from GitHub Actions IPs
- Verify the SQL script has no syntax errors

## Current Workflow Status

- **Deploy to Vercel**: ❌ Needs secrets configured
- **Database Setup**: ⏸️ Optional, runs after deploy
- **Database Check**: ⏸️ Weekly health check

## Next Steps

1. Configure the required secrets
2. Push a commit to trigger the workflows
3. Monitor the Actions tab for success