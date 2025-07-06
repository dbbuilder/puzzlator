# How to Find Your Supabase Database URL

## Step-by-Step Guide

### 1. Go to Your Supabase Dashboard
- Visit https://supabase.com/dashboard
- Select your project (should be named something like "puzzlator" or similar)

### 2. Navigate to Database Settings
- In the left sidebar, click on **Settings** (gear icon at the bottom)
- Then click on **Database** in the settings menu

### 3. Find the Connection String
Look for the section called **Connection string** or **Connection pooling**

You'll see several options:

#### Option A: Direct Connection (Recommended for GitHub Actions)
- Look for **"Connection string"** section
- You'll see a URL that looks like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres
  ```

#### Option B: Connection Pooling (Alternative)
- Look for **"Connection pooling"** section
- Mode: Transaction
- You'll see a URL that looks like:
  ```
  postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```

### 4. Important: The Password
The password shown is usually `[YOUR-PASSWORD]` as a placeholder. You need to:

1. **Find your database password:**
   - It might be shown in the same settings page
   - Or you might have set it when creating the project
   - If you can't find it, you can reset it (see below)

2. **Replace [YOUR-PASSWORD] with your actual password**

### 5. Complete URL Format
Your final URL should look like:
```
postgresql://postgres:your-actual-password-here@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres
```

## Can't Find Your Password?

### Option 1: Check Project Settings
- Go to Settings → General
- Look for "Database password" section
- You might see a "Reveal" button

### Option 2: Reset Password
- In Settings → Database
- Look for "Reset database password" button
- Click it to generate a new password
- **Important**: This will invalidate the old password

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:
```bash
supabase projects list
supabase db remote set postgresql://postgres:[YOUR-PASSWORD]@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres
```

## Testing the Connection

Once you have the URL, test it:
```bash
# Install psql if you don't have it
sudo apt-get install postgresql-client

# Test connection
psql "postgresql://postgres:your-password@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres" -c "SELECT 1;"
```

## Adding to GitHub Secrets

Once you have the complete URL:
1. Go to https://github.com/dbbuilder/puzzlator/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SUPABASE_DB_URL`
4. Value: Your complete PostgreSQL URL (including password)
5. Click "Add secret"

## Security Note

⚠️ **Never commit the database URL to your code!**
- Always use environment variables
- The URL contains your database password
- Keep it secure in GitHub Secrets or .env files