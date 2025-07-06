# Quick Setup Guide for Puzzlator Database

## Step 1: Copy the SQL Script

1. Open the file: `scripts/setup-supabase-tables.sql`
2. Copy ALL the contents

## Step 2: Run in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Paste the entire SQL script
6. Click **Run**

## Step 3: Verify

You should see:
- ✅ "All tables created successfully!" message
- The following tables in your database:
  - `user_profiles`
  - `puzzles`
  - `game_sessions`
  - `achievements`
  - `user_achievements`
  - `leaderboard`

## Step 4: Test

1. Go back to [puzzlator.com](https://puzzlator.com)
2. Try signing up with a real email
3. Or continue using Guest mode (which works without database)

## Troubleshooting

If you get errors:
- **"type already exists"**: That's OK, the script handles this
- **"permission denied"**: Make sure you're using the SQL Editor in Supabase Dashboard
- **Other errors**: Check that you copied the ENTIRE script

## Email Confirmation (Optional)

To disable email confirmation for easier testing:
1. Go to **Authentication** → **Settings**
2. Under **Email Auth**
3. Toggle OFF **"Confirm email"**

This allows instant login without email verification.