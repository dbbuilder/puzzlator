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

# Database URLs to try
DIRECT_URL="postgresql://postgres:Gv51076!@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres"
POOLER_URL="postgresql://postgres.pcztbpqbpkryupfxstkd:Gv51076!@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo "Trying direct connection first..."
if psql "$DIRECT_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Direct connection successful!"
    DATABASE_URL="$DIRECT_URL"
else
    echo "❌ Direct connection failed"
    echo "Trying pooler connection..."
    if psql "$POOLER_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Pooler connection successful!"
        DATABASE_URL="$POOLER_URL"
    else
        echo "❌ Both connections failed"
        echo ""
        echo "Please check your Supabase dashboard for the correct connection string:"
        echo "1. Go to Settings → Database"
        echo "2. Copy the exact connection string"
        echo "3. Run: psql 'YOUR_CONNECTION_STRING' < scripts/setup-supabase-tables.sql"
        exit 1
    fi
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