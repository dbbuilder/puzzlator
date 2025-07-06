#!/bin/bash

# GitHub Secrets Setup Script
# This script sets up all required secrets for GitHub Actions

echo "🔐 Setting up GitHub Secrets for Puzzlator..."

# Check if gh CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Error: GitHub CLI is not authenticated"
    echo "Please run: gh auth login"
    exit 1
fi

# Repository
REPO="dbbuilder/puzzlator"

echo "📝 Setting up secrets for repository: $REPO"

# Vercel Secrets
echo "Setting Vercel secrets..."
gh secret set VERCEL_TOKEN --repo="$REPO" --body="vAosshzx1jI7xtiWu05IOyab"
gh secret set VERCEL_ORG_ID --repo="$REPO" --body="team_IOR1mnU73YRIYET6mcngNXbE"
gh secret set VERCEL_PROJECT_ID --repo="$REPO" --body="prj_fCYeI3Br1LeETc65Q0L3mM0kc8dE"

# Supabase Secrets
echo "Setting Supabase secrets..."
gh secret set VITE_SUPABASE_URL --repo="$REPO" --body="https://pcztbpqbpkryupfxstkd.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --repo="$REPO" --body="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjenRicHFicGtyeXVwZnhzdGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTMxNTYsImV4cCI6MjA2NzMyOTE1Nn0.z0royhpnCnCyWG346u5ZHg7oObd-l56ZAI-BO-LP92U"

# Note: SUPABASE_DB_URL is not provided, so skipping it
echo "⚠️  Note: SUPABASE_DB_URL was not provided. Database setup workflow will be skipped."

echo "✅ GitHub secrets have been configured!"
echo ""
echo "📊 Verifying secrets..."
gh secret list --repo="$REPO"

echo ""
echo "🚀 Next steps:"
echo "1. The Deploy to Vercel workflow should now work on your next push"
echo "2. Check the Actions tab: https://github.com/$REPO/actions"
echo "3. If you need database setup, add SUPABASE_DB_URL secret manually"