#!/bin/bash

# Automated Database Initialization Script
# This script sets up the entire database from scratch

set -e

echo "🚀 Initializing database for Puzzle Game..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from example...${NC}"
    cp .env.local.example .env.local
fi

# Function to wait for service
wait_for_service() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$service_url" | grep -q "200\|404"; then
            echo -e "${GREEN}✓ $service_name is ready${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# 1. Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI locally...${NC}"
    npm install --save-dev supabase
    
    # Create alias for this session
    alias supabase='npx supabase'
fi

# 2. Initialize Supabase if needed
if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Initializing Supabase...${NC}"
    npx supabase init
fi

# 3. Check Docker
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop${NC}"
    exit 1
fi

# 4. Stop any existing Supabase instance
echo -e "${YELLOW}Stopping any existing Supabase instance...${NC}"
npx supabase stop --backup false 2>/dev/null || true

# 5. Start Supabase
echo -e "${YELLOW}Starting Supabase local instance...${NC}"
npx supabase start

# 6. Wait for services to be ready
wait_for_service "http://localhost:14321/rest/v1/" "Supabase API"
wait_for_service "http://localhost:14323" "Supabase Studio"

# 7. Get credentials and update .env.local
echo -e "${YELLOW}Updating .env.local with local credentials...${NC}"

# Parse supabase status output
SUPABASE_STATUS=$(supabase status)
API_URL=$(echo "$SUPABASE_STATUS" | grep "API URL" | awk '{print $3}')
ANON_KEY=$(echo "$SUPABASE_STATUS" | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(echo "$SUPABASE_STATUS" | grep "service_role key" | awk '{print $4}')

# Update .env.local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$API_URL|" .env.local
    sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    
    # Add service key if not exists
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.local
    else
        sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    fi
else
    # Linux/WSL
    sed -i "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$API_URL|" .env.local
    sed -i "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    
    # Add service key if not exists
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.local
    else
        sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    fi
fi

# 8. Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx supabase db reset

# 9. Generate TypeScript types
echo -e "${YELLOW}Generating TypeScript types...${NC}"
npm run db:types

# 10. Seed database
echo -e "${YELLOW}Seeding database with sample data...${NC}"
node scripts/seed-database.js

# 11. Display success message
echo ""
echo -e "${GREEN}✅ Database initialization complete!${NC}"
echo ""
echo "📊 Supabase Studio: http://localhost:14323"
echo "🔌 API URL: $API_URL"
echo ""
echo "Test credentials:"
echo "  Email: test@example.com"
echo "  Password: testpassword123"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the application"
echo "  2. Visit http://localhost:3000"
echo "  3. Login with test credentials or create a new account"
echo ""
echo "Useful commands:"
echo "  npm run db:start    - Start Supabase"
echo "  npm run db:stop     - Stop Supabase"
echo "  npm run db:reset    - Reset database"
echo "  npm run db:types    - Regenerate TypeScript types"
echo "  npm run db:migrate  - Run pending migrations"