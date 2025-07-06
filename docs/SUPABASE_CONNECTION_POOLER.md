# Using Supabase Connection Pooler

GitHub Actions may have trouble connecting directly to Supabase. Try using the **Connection Pooler** instead:

## How to Get Pooler URL

1. Go to Supabase Dashboard
2. Settings → Database
3. Look for **"Connection pooling"** section
4. Make sure it's **enabled** (toggle switch)
5. Select **Mode: Transaction**
6. Copy the connection string

## Pooler URL Format

The pooler URL looks different:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

For your project:
```
postgresql://postgres.pcztbpqbpkryupfxstkd:Gv51076!@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## Update GitHub Secret

1. Go to https://github.com/dbbuilder/puzzlator/settings/secrets/actions
2. Click on `SUPABASE_DB_URL`
3. Click "Update secret"
4. Paste the pooler URL
5. Save

## Why Use Pooler?

- Better for serverless/ephemeral connections
- Handles connection limits better
- Works better with GitHub Actions
- Prevents "too many connections" errors

## Testing

After updating the secret, run the database setup workflow again.