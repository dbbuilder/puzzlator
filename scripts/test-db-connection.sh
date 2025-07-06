#!/bin/bash

# Test Supabase database connection
DATABASE_URL="${1:-$DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: No database URL provided"
  echo "Usage: ./test-db-connection.sh 'postgresql://...'"
  exit 1
fi

echo "🔍 Testing database connection..."
echo "URL: ${DATABASE_URL//:*@/:****@}" # Hide password

# Try connection with timeout
export PGCONNECT_TIMEOUT=10

# Test 1: Basic connection
echo -n "Test 1 - Basic connection: "
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Success"
else
  echo "❌ Failed"
  
  # Test 2: Try with explicit port
  echo -n "Test 2 - With explicit options: "
  if psql "$DATABASE_URL" -c "SELECT 1;" -o /dev/null 2>&1; then
    echo "✅ Success"
  else
    echo "❌ Failed"
    
    # Test 3: Extract components and try manual connection
    echo "Test 3 - Manual connection:"
    # Extract components from URL
    if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
      USER="${BASH_REMATCH[1]}"
      PASS="${BASH_REMATCH[2]}"
      HOST="${BASH_REMATCH[3]}"
      PORT="${BASH_REMATCH[4]}"
      DB="${BASH_REMATCH[5]}"
      
      echo "  Host: $HOST"
      echo "  Port: $PORT"
      echo "  Database: $DB"
      echo "  User: $USER"
      
      # Try manual connection
      PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT 1;" 2>&1 | head -5
    fi
  fi
fi

echo ""
echo "💡 If connection fails from GitHub Actions:"
echo "1. Check if Supabase allows connections from GitHub IPs"
echo "2. Try using connection pooler URL instead"
echo "3. Check Supabase dashboard for connection limits"