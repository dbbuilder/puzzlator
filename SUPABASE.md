# Supabase Migration Guide for Puzzlator

This document compares the traditional API server approach with the Supabase direct connection approach, and provides a complete migration guide.

## Architecture Comparison

### Traditional Architecture (Current)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vue App   │────▶│ Express API  │────▶│ PostgreSQL  │
│  (Frontend) │     │   Server     │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
     Port 14000         Port 14001          Port 14322
```

### Supabase Architecture (New)
```
┌─────────────┐     ┌────────────────────────────┐
│   Vue App   │────▶│      Supabase Cloud        │
│  (Frontend) │     │  ├─ PostgreSQL Database   │
└─────────────┘     │  ├─ Auto-generated APIs   │
                    │  ├─ Authentication        │
                    │  ├─ Real-time Subscriptions│
                    │  └─ Edge Functions        │
                    └────────────────────────────┘
```

## Key Differences

### 1. Authentication

#### Traditional Approach
```javascript
// api-server.cjs
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  
  // Check if user exists
  const userResult = await pool.query(
    'SELECT * FROM user_profiles WHERE username = $1',
    [username]
  );
  
  if (userResult.rows.length === 0) {
    // Create new user
    const newUser = await pool.query(
      'INSERT INTO user_profiles (username) VALUES ($1) RETURNING *',
      [username]
    );
    res.json(newUser.rows[0]);
  } else {
    res.json(userResult.rows[0]);
  }
});
```

#### Supabase Approach
```typescript
// No server code needed! Direct from Vue:
const { data, error } = await supabase.auth.signUp({
  email: `${username}@puzzlator.com`,
  password: generateSecurePassword(),
  options: {
    data: { username } // Custom metadata
  }
});
```

### 2. Database Queries

#### Traditional Approach
```javascript
// API endpoint
app.get('/api/users/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM user_profiles WHERE id = $1',
    [req.params.id]
  );
  res.json(result.rows[0]);
});

// Frontend
const response = await fetch(`${API_URL}/api/users/${userId}`);
const user = await response.json();
```

#### Supabase Approach
```typescript
// Direct from frontend
const { data: user, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### 3. Real-time Features

#### Traditional Approach
```javascript
// Requires WebSocket server setup
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  ws.on('message', message => {
    // Broadcast to all clients
    wss.clients.forEach(client => {
      client.send(message);
    });
  });
});
```

#### Supabase Approach
```typescript
// Built-in real-time
const channel = supabase
  .channel('leaderboard-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leaderboards' },
    payload => {
      console.log('Leaderboard updated:', payload);
    }
  )
  .subscribe();
```

### 4. File Structure

#### Traditional Approach
```
puzzlator/
├── api-server.cjs         # Express server
├── src/
│   ├── services/
│   │   ├── api.ts        # API client
│   │   └── database.ts   # DB connection
│   └── stores/
│       └── user.ts       # Complex state management
└── docker-compose.yml     # Local PostgreSQL
```

#### Supabase Approach
```
puzzlator/
├── src/
│   ├── lib/
│   │   └── supabase.ts   # Supabase client
│   └── stores/
│       └── user.ts       # Simplified state
└── supabase/
    ├── migrations/       # Database schema
    └── functions/        # Edge functions (if needed)
```

## Migration Benefits

### 1. Reduced Code Complexity
- **Before**: ~500 lines of API server code
- **After**: ~50 lines of Supabase client configuration

### 2. Built-in Features
- ✅ Authentication (email, OAuth, magic links)
- ✅ Row Level Security (database-level permissions)
- ✅ Real-time subscriptions
- ✅ File storage
- ✅ Auto-generated TypeScript types
- ✅ Database backups
- ✅ Global CDN

### 3. Development Speed
- No backend server to maintain
- Instant API from database schema
- Built-in admin panel (Supabase Studio)
- Automatic SSL certificates

### 4. Cost Comparison

#### Traditional Hosting
- VPS/Cloud Server: $10-50/month
- Database hosting: $10-25/month
- SSL certificate: $0-10/month
- Monitoring: $10-20/month
- **Total**: $30-105/month

#### Supabase
- Free tier: 0-50,000 monthly active users
- Pro tier: $25/month (unlimited API calls)
- Pay-as-you-go for storage/bandwidth
- **Total**: $0-25/month for most apps

## Migration Steps

### Step 1: Database Schema Migration
```sql
-- Supabase automatically creates auth.users table
-- Update user_profiles to reference it
ALTER TABLE user_profiles 
  ADD COLUMN auth_id UUID REFERENCES auth.users(id);

-- Add Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = auth_id);
```

### Step 2: Update Environment Variables
```env
# Old
VITE_API_URL=http://localhost:14001

# New
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Replace API Service
```typescript
// Old: src/services/api.ts
export class ApiService {
  async request(url, options) {
    return fetch(`${API_URL}${url}`, options);
  }
}

// New: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Step 4: Update Stores
```typescript
// Old: Complex API calls
async function login(username: string) {
  const response = await api.request('/login', {
    method: 'POST',
    body: JSON.stringify({ username })
  });
}

// New: Direct Supabase
async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
}
```

## Common Patterns

### 1. CRUD Operations

#### Create
```typescript
// Old
await api.request('/puzzles', {
  method: 'POST',
  body: JSON.stringify(puzzleData)
});

// New
const { data, error } = await supabase
  .from('puzzles')
  .insert(puzzleData)
  .select()
  .single();
```

#### Read
```typescript
// Old
const puzzles = await api.request('/puzzles?difficulty=easy');

// New
const { data: puzzles } = await supabase
  .from('puzzles')
  .select('*')
  .eq('difficulty', 'easy');
```

#### Update
```typescript
// Old
await api.request(`/puzzles/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updates)
});

// New
const { error } = await supabase
  .from('puzzles')
  .update(updates)
  .eq('id', id);
```

#### Delete
```typescript
// Old
await api.request(`/puzzles/${id}`, {
  method: 'DELETE'
});

// New
const { error } = await supabase
  .from('puzzles')
  .delete()
  .eq('id', id);
```

### 2. Complex Queries

```typescript
// Get user with their achievements and recent games
const { data: profile } = await supabase
  .from('user_profiles')
  .select(`
    *,
    achievements:user_achievements(
      achievement:achievements(*)
    ),
    recent_games:game_sessions(
      *,
      puzzle:puzzles(*)
    )
  `)
  .eq('id', userId)
  .order('recent_games.created_at', { ascending: false })
  .limit(10, { foreignTable: 'recent_games' })
  .single();
```

### 3. Real-time Subscriptions

```typescript
// Subscribe to leaderboard updates
const subscription = supabase
  .channel('public:leaderboards')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leaderboards',
    filter: `puzzle_type=eq.sudoku4x4`
  }, payload => {
    // Update UI with new high score
    addToLeaderboard(payload.new);
  })
  .subscribe();

// Cleanup
onUnmounted(() => {
  subscription.unsubscribe();
});
```

### 4. File Storage

```typescript
// Upload avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

// Get public URL
const { data: url } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

## Security Best Practices

### 1. Row Level Security (RLS)
```sql
-- Users can only see their own sessions
CREATE POLICY "Users view own sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view leaderboards
CREATE POLICY "Public leaderboards" ON leaderboards
  FOR SELECT USING (true);

-- Only authenticated users can create sessions
CREATE POLICY "Authenticated users create sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. API Key Security
- Never expose `service_role` key in frontend
- Use `anon` key in frontend (it's safe)
- Enable RLS on all tables
- Use Edge Functions for sensitive operations

### 3. Data Validation
```typescript
// Validate in Edge Function
export async function createPuzzle(puzzle: unknown) {
  // Validate puzzle data
  const validated = puzzleSchema.parse(puzzle);
  
  // Additional business logic
  if (validated.difficulty === 'expert' && !userIsPro) {
    throw new Error('Expert puzzles require Pro subscription');
  }
  
  return supabase.from('puzzles').insert(validated);
}
```

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check you're using the correct `anon` key
   - Verify the key in Supabase dashboard

2. **"Permission denied"**
   - Check RLS policies
   - Ensure user is authenticated
   - Verify the auth token is valid

3. **"CORS error"**
   - Supabase handles CORS automatically
   - Check you're using the correct project URL

4. **Real-time not working**
   - Enable real-time for the table in Supabase dashboard
   - Check your subscription filter syntax

## Performance Optimization

### 1. Query Optimization
```typescript
// Bad: Multiple queries
const user = await supabase.from('users').select().eq('id', userId);
const games = await supabase.from('games').select().eq('user_id', userId);

// Good: Single query with joins
const { data } = await supabase
  .from('users')
  .select('*, games(*)')
  .eq('id', userId)
  .single();
```

### 2. Pagination
```typescript
const PAGE_SIZE = 20;
const { data, count } = await supabase
  .from('puzzles')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

### 3. Caching
```typescript
// Use React Query or similar for caching
const { data: puzzles } = useQuery({
  queryKey: ['puzzles', difficulty],
  queryFn: async () => {
    const { data } = await supabase
      .from('puzzles')
      .select('*')
      .eq('difficulty', difficulty);
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Conclusion

Migrating to Supabase eliminates the need for:
- ❌ Express.js API server
- ❌ Manual authentication implementation  
- ❌ WebSocket server for real-time
- ❌ Database connection management
- ❌ CORS configuration
- ❌ API route definitions
- ❌ Session management
- ❌ Manual TypeScript types

While gaining:
- ✅ Instant REST & GraphQL APIs
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Row Level Security
- ✅ Auto-generated types
- ✅ File storage
- ✅ Edge Functions
- ✅ Global CDN
- ✅ Automatic backups
- ✅ Database branching

The migration reduces code complexity by ~70% while adding features that would take months to implement manually.