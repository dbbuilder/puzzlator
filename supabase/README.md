# Supabase Database Setup

This directory contains all database-related files for the AI Puzzle Game.

## Quick Start

The easiest way to set up the database is to run:

```bash
npm run setup:supabase
```

Or if you want to do everything in one command:

```bash
bash scripts/init-database.sh
```

## Prerequisites

1. **Docker Desktop** must be installed and running
2. **Node.js 18+** and npm
3. **Git Bash** (on Windows) or any Unix shell

## Manual Setup Steps

If you prefer to set up manually:

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase

```bash
supabase init
```

### 3. Start Supabase

```bash
supabase start
```

This will start:
- PostgreSQL database on port 14322
- Supabase Studio on http://localhost:14323
- API Gateway on http://localhost:14321

### 4. Run Migrations

```bash
supabase db reset
```

### 5. Generate TypeScript Types

```bash
npm run db:types
```

### 6. Seed Database

```bash
npm run db:seed
```

## Database Schema

### Tables

- **user_profiles**: Extended user information
- **puzzles**: Puzzle definitions and metadata
- **game_sessions**: Individual play sessions
- **achievements**: Achievement definitions
- **user_achievements**: User's earned achievements
- **leaderboards**: Score tracking

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic user profile creation on signup
- Triggers for updating statistics
- Indexes for performance optimization

## Development Commands

```bash
# Start/stop Supabase
npm run db:start
npm run db:stop

# Database operations
npm run db:reset     # Reset and re-run all migrations
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed with sample data

# Generate types
npm run db:types     # Generate TypeScript types from schema
```

## Testing

Default test user:
- Email: `test@example.com`
- Password: `testpassword123`

## Production Deployment

1. Create a project at [supabase.com](https://supabase.com)
2. Link your local project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push schema to production:
   ```bash
   supabase db push
   ```

## Troubleshooting

### Docker not running
- Make sure Docker Desktop is installed and running
- On Windows, ensure WSL 2 is properly configured

### Port conflicts
- PostgreSQL: 14322 (default 5432)
- Studio: 14323
- API: 14321

### Reset everything
```bash
supabase stop --backup false
supabase db reset
```

## Environment Variables

Required in `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:14321
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

These are automatically set by the setup script.