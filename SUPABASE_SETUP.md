# Supabase Environment Setup Guide

This guide helps you set up the required Supabase environment variables for Puzzlator.

## Quick Setup Steps

### 1. Create a Supabase Account
- Go to [app.supabase.com](https://app.supabase.com)
- Sign up for a free account

### 2. Create a New Project
- Click "New project"
- Project name: `puzzlator-dev` (or your preferred name)
- Database password: Generate a strong password and save it
- Region: Choose the closest to you
- Click "Create new project"

### 3. Get Your API Keys
Once your project is created (takes 2-3 minutes):

1. Go to **Settings** → **API** in the left sidebar
2. You'll find these values:

   - **Project URL**: 
     - Looks like: `https://xyzxyzxyz.supabase.co`
     - Copy this to `VITE_SUPABASE_URL` in your `.env.local`

   - **Anon/Public Key**:
     - This is safe to use in frontend code
     - Copy this to `VITE_SUPABASE_ANON_KEY` in your `.env.local`

   - **Service Role Key** (optional):
     - Only for server-side operations
     - Keep this secret!
     - Copy to `SUPABASE_SERVICE_ROLE_KEY` if needed

### 4. Create Your `.env.local` File

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:
   ```env
   # Your actual Supabase values
   VITE_SUPABASE_URL=https://xyzxyzxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # OpenAI API key (optional for now)
   OPENAI_API_KEY=sk-...
   
   # Keep these as is for local development
   VITE_APP_NAME=Puzzlator
   VITE_APP_VERSION=0.1.0
   VITE_API_URL=http://localhost:3001
   ```

### 5. Run Database Migrations

After setting up your environment variables:

1. Start the local Supabase instance (if using Docker):
   ```bash
   npm run supabase:start
   ```

2. Or for cloud Supabase, go to the SQL Editor in your dashboard and run:
   - Copy the contents of `supabase/migrations/standalone_schema.sql`
   - Paste and execute in the SQL Editor

### 6. Verify Setup

Test your configuration:
```bash
# Start the API server
npm run api

# In a new terminal, start the dev server
npm run dev
```

Visit http://localhost:3000 and try creating an account!

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Double-check you copied the entire key
   - Make sure you're using the anon key, not the service role key

2. **"Connection refused" error**
   - Ensure your Supabase project is fully initialized
   - Check the project URL is correct

3. **CORS errors**
   - This shouldn't happen with the anon key
   - Check you're using `VITE_` prefix for frontend variables

### Environment Variable Reference

| Variable | Description | Where to Find | Required |
|----------|-------------|---------------|----------|
| `VITE_SUPABASE_URL` | Your project's API URL | Settings → API → Project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | Settings → API → anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret server key | Settings → API → service_role key | No |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com | No* |

*Required only when AI puzzle generation is enabled

## Security Notes

- Never commit `.env.local` to version control
- The anon key is safe to expose in frontend code
- The service role key should NEVER be exposed to the frontend
- Use Row Level Security (RLS) policies for data protection

## Next Steps

Once your environment is set up:
1. Run the application: `npm run dev`
2. Create a test account
3. Try playing a puzzle!

For production deployment, see `DEPLOYMENT_GUIDE.md`.