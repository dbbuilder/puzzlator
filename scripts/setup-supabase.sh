#!/bin/bash

# Supabase Setup Script
# This script automates the Supabase setup process for the puzzle game

set -e  # Exit on error

echo "🚀 Starting Supabase setup for Puzzle Game..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running on Windows/WSL
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "$WSL_DISTRO_NAME" ]]; then
    print_info "Detected Windows/WSL environment"
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# 1. Install Supabase CLI
install_supabase_cli() {
    print_info "Installing Supabase CLI..."
    
    if command -v supabase &> /dev/null; then
        print_success "Supabase CLI already installed"
        return
    fi
    
    # Install using npm (cross-platform)
    if command -v npm &> /dev/null; then
        npm install -g supabase
        print_success "Supabase CLI installed via npm"
    else
        print_error "npm not found. Please install Node.js first"
        exit 1
    fi
}

# 2. Initialize Supabase project
init_supabase() {
    print_info "Initializing Supabase project..."
    
    if [ -d "supabase" ] && [ -f "supabase/config.toml" ]; then
        print_success "Supabase already initialized"
        return
    fi
    
    supabase init
    print_success "Supabase project initialized"
}

# 3. Start local Supabase instance
start_local_supabase() {
    print_info "Starting local Supabase instance..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop"
        exit 1
    fi
    
    # Start Supabase
    supabase start
    
    # Save local credentials
    print_info "Saving local Supabase credentials..."
    
    # Get local API URL and keys
    SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
    SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $4}')
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        cp .env.local.example .env.local
    fi
    
    # Update .env.local with local Supabase values
    sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    
    # Add service key for migrations
    echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.local
    
    print_success "Local Supabase instance started"
    print_info "Local Supabase Studio: http://localhost:54323"
}

# 4. Create database migrations
create_migrations() {
    print_info "Creating database migrations..."
    
    # Create initial schema migration
    supabase migration new initial_schema
    
    # Get the migration file name
    MIGRATION_FILE=$(ls supabase/migrations/*.sql | sort | tail -n 1)
    
    print_success "Created migration file: $MIGRATION_FILE"
    print_info "Please add your schema to this file"
}

# 5. Generate TypeScript types
generate_types() {
    print_info "Generating TypeScript types from database..."
    
    supabase gen types typescript --local > src/types/database.generated.ts
    
    print_success "TypeScript types generated"
}

# Main execution
main() {
    echo ""
    echo "This script will set up Supabase for local development"
    echo "Prerequisites:"
    echo "  - Node.js and npm installed"
    echo "  - Docker Desktop installed and running"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi
    
    # Run setup steps
    install_supabase_cli
    init_supabase
    start_local_supabase
    create_migrations
    
    echo ""
    print_success "Supabase setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Add your database schema to the migration file"
    echo "2. Run 'npm run db:migrate' to apply migrations"
    echo "3. Run 'npm run db:types' to generate TypeScript types"
    echo "4. Access Supabase Studio at http://localhost:54323"
    echo ""
    echo "For production deployment:"
    echo "1. Create a project at https://supabase.com"
    echo "2. Link your local project: supabase link --project-ref your-project-ref"
    echo "3. Push your schema: supabase db push"
}

# Run main function
main