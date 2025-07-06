# Manual Database Setup for Puzzlator

Since GitHub Actions is having IPv6 connectivity issues with Supabase, here's how to set up the database manually:

## Option 1: Using Supabase SQL Editor (Easiest)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy the contents of `scripts/setup-supabase-tables.sql`
   - Paste it into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Tables Created**
   - In the left sidebar, click on "Table Editor"
   - You should see these tables:
     - user_profiles
     - puzzles
     - game_sessions
     - achievements
     - user_achievements
     - leaderboard

## Option 2: Using TablePlus or pgAdmin

1. **Download a PostgreSQL client**
   - TablePlus: https://tableplus.com/
   - pgAdmin: https://www.pgadmin.org/
   - DBeaver: https://dbeaver.io/

2. **Create a new connection**
   - Host: `db.pcztbpqbpkryupfxstkd.supabase.co`
   - Port: `5432`
   - User: `postgres`
   - Password: `Gv51076!`
   - Database: `postgres`

3. **Run the SQL script**
   - Open `scripts/setup-supabase-tables.sql`
   - Execute the entire script

## Option 3: Using psql locally

```bash
# Install psql
sudo apt-get install postgresql-client

# Run the setup
psql "postgresql://postgres:Gv51076!@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres" < scripts/setup-supabase-tables.sql
```

## Option 4: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref pcztbpqbpkryupfxstkd

# Run migrations
supabase db push
```

## Verification

After running the setup, verify in Supabase Dashboard:
1. Go to "Table Editor"
2. Check that all tables are created
3. Check "Authentication" → "Policies" for RLS policies
4. Test the application at https://puzzlator.com

## Troubleshooting

If you get errors:
- "relation already exists" - Tables are already created, this is fine
- "permission denied" - Check your database password
- "connection refused" - Check if Supabase project is paused

## Next Steps

Once the database is set up:
1. The application should work fully at https://puzzlator.com
2. Users can create accounts and play games
3. Scores will be saved to the leaderboard
4. Achievements will be tracked