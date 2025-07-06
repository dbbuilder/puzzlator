#!/bin/bash

echo "🔧 Local Database Setup for Puzzlator"
echo "===================================="
echo ""
echo "This script will set up your Supabase database locally."
echo "You'll need to have PostgreSQL client installed."
echo ""

# Check for psql
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found!"
    echo "Install it with: sudo apt-get install postgresql-client"
    exit 1
fi

# Database URLs - get from environment or prompt
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Please provide your Supabase database URL:"
    echo "(You can find this in Supabase Dashboard → Settings → Database)"
    read -p "Database URL: " DATABASE_URL
else
    DATABASE_URL="$SUPABASE_DB_URL"
fi

echo "Testing connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed"
    echo ""
    echo "Please check:"
    echo "1. Your database URL is correct"
    echo "2. The database is not paused in Supabase"
    echo "3. Your IP is allowed (check Supabase network restrictions)"
    exit 1
fi

echo ""
echo "📦 Running database setup..."
if psql "$DATABASE_URL" < scripts/setup-supabase-tables.sql; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Tables created:"
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
else
    echo "❌ Database setup failed"
    exit 1
fi