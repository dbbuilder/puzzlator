#!/bin/bash

# GitHub Secrets Setup Script (Template)
# This script helps set up GitHub Actions secrets securely

echo "🔐 GitHub Secrets Setup for Puzzlator"
echo "===================================="
echo ""
echo "This script will help you set up the required GitHub secrets."
echo "You'll need to provide the values for each secret."
echo ""

# Check if gh CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Error: GitHub CLI is not authenticated"
    echo "Please run: gh auth login"
    exit 1
fi

# Repository
REPO="${GITHUB_REPOSITORY:-dbbuilder/puzzlator}"
echo "📝 Setting up secrets for repository: $REPO"
echo ""

# Function to safely read secret values
read_secret() {
    local secret_name="$1"
    local description="$2"
    local value=""
    
    echo "Enter value for $secret_name"
    echo "Description: $description"
    read -s -p "Value: " value
    echo ""
    echo ""
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $secret_name (no value provided)"
        return 1
    fi
    
    gh secret set "$secret_name" --repo="$REPO" --body="$value"
    echo "✅ $secret_name configured"
    return 0
}

echo "🔧 Vercel Configuration"
echo "----------------------"
echo "Get these from: https://vercel.com/account/tokens"
echo "and your Vercel project settings"
echo ""

read_secret "VERCEL_TOKEN" "Your Vercel API token"
read_secret "VERCEL_ORG_ID" "Your Vercel organization/team ID"
read_secret "VERCEL_PROJECT_ID" "Your Vercel project ID"

echo ""
echo "🗄️ Supabase Configuration"
echo "------------------------"
echo "Get these from your Supabase project settings"
echo ""

read_secret "VITE_SUPABASE_URL" "Your Supabase project URL (https://...supabase.co)"
read_secret "VITE_SUPABASE_ANON_KEY" "Your Supabase anonymous/public key"
read_secret "SUPABASE_DB_URL" "Your database connection string (postgresql://...)"

echo ""
echo "📊 Current secrets:"
gh secret list --repo="$REPO"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Push a commit to trigger the deployment workflow"
echo "2. Check https://github.com/$REPO/actions"
echo "3. If database setup is needed, run the 'Supabase Database Setup' workflow"