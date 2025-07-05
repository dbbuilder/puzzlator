# Vercel Environment Variables Setup

If you prefer to skip the Supabase integration and set up manually:

## Manual Environment Variables

Add these in your Vercel project settings → Environment Variables:

```bash
# Required for all environments
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - only if using server-side features
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For production only
VITE_APP_URL=https://puzzlator.com
```

## Why the Integration Asks to Create a Database

The Vercel-Supabase integration workflow assumes you're starting fresh and offers to:
1. Create a new Supabase project
2. Set up database branching for preview deployments
3. Automatically sync environment variables

But if you already have a Supabase project:
- Choose "Use existing project" option
- Or skip integration and add variables manually

## Benefits of Using the Integration

1. **Automatic env sync** - Updates when you change Supabase settings
2. **Preview branches** - Each PR gets its own database branch
3. **One-click setup** - No manual copying of keys

## When to Skip the Integration

- If you want more control over environment variables
- If you're using multiple Supabase projects
- If you don't need database branching for previews

The integration is optional - manual setup works perfectly fine!