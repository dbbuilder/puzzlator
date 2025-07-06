# Vercel Environment Variables Setup

## Required Variables for Puzzlator

The app uses Vite, which requires environment variables to be prefixed with `VITE_`. 

### Add these variables to Vercel:

1. **VITE_SUPABASE_URL**
   - Copy the value from your existing `SUPABASE_URL` variable
   - This should be your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

2. **VITE_SUPABASE_ANON_KEY**
   - Copy the value from your existing `SUPABASE_ANON_KEY` variable
   - This is the public anonymous key (safe for frontend)

### Steps to add in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Click "Add Variable"
4. Add the two variables above
5. Make sure they're enabled for "Production" environment
6. Redeploy your project

### Current Variables (Keep these):
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ POSTGRES_* variables
- ✅ SUPABASE_SERVICE_ROLE_KEY (for backend/Edge Functions)
- ✅ SUPABASE_JWT_SECRET

### After adding the VITE_ variables:
Your app will be able to connect to Supabase and users will be able to:
- Sign up with email/password
- Sign in with Google/GitHub (if configured in Supabase)
- Use magic link authentication
- Access their profiles and game data

### Note on Variable Naming:
- `VITE_*` prefix: Required for Vite to expose variables to the browser
- `NEXT_PUBLIC_*` prefix: For Next.js apps (you have these but don't need them)
- No prefix: Server-side only variables