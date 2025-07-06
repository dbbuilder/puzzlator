# Supabase Database URL - Quick Reference

## Where to Look in Supabase Dashboard

### Path 1: Settings → Database
1. Click **Settings** (gear icon) in left sidebar
2. Click **Database** in the submenu
3. Look for these sections:
   - **Connection string** (Direct connection)
   - **Connection pooling** (Pooled connection)
   - **Connection info** (Shows host, port, database name)

### Path 2: Project Settings → Database
Some Supabase versions show it here:
1. Click on your project name at the top
2. Go to **Project Settings**
3. Click **Database** tab

## What You're Looking For

### Direct Connection Format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Your Specific Project:
Based on your Supabase URL `https://pcztbpqbpkryupfxstkd.supabase.co`, your database URL should be:
```
postgresql://postgres:[YOUR-PASSWORD]@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres
```

You just need to replace `[YOUR-PASSWORD]` with your actual database password.

## Finding Your Database Password

### Option 1: Initial Setup Email
- Check the email you received when creating the Supabase project
- Subject usually: "Your Supabase project is ready"

### Option 2: Dashboard
- Settings → Database
- Look for "Database Password" section
- Click "Reveal" if available

### Option 3: Reset It
- Settings → Database
- Click "Reset database password"
- Copy the new password immediately

## Quick Test

Once you construct your URL, test it in the terminal:
```bash
# Replace YOUR_PASSWORD with your actual password
export DB_URL="postgresql://postgres:YOUR_PASSWORD@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres"

# Test with psql
psql "$DB_URL" -c "SELECT current_database();"

# Or test with curl
curl -X POST https://pcztbpqbpkryupfxstkd.supabase.co/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjenRicHFicGtyeXVwZnhzdGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTMxNTYsImV4cCI6MjA2NzMyOTE1Nn0.z0royhpnCnCyWG346u5ZHg7oObd-l56ZAI-BO-LP92U" \
  -H "Content-Type: application/json"
```

## Still Can't Find It?

Try the Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# List your projects
supabase projects list

# Get connection info
supabase db remote show
```