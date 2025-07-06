# Debugging Supabase Connection Issues

## Current Error
"FATAL: Tenant or user not found" - This typically means:
1. The connection string format is incorrect
2. The pooler might need a different username format

## Supabase Connection String Formats

### Direct Connection (IPv6/IPv4 issues in GitHub Actions)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Pooler Connection (Recommended for GitHub Actions)
The pooler might need the username in this format:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
```

## Finding Your Correct Pooler URL

1. Go to Supabase Dashboard
2. Settings → Database
3. Find "Connection pooling" section
4. **IMPORTANT**: Copy the EXACT connection string shown there
5. Don't modify the username format

## Common Issues

1. **Username Format**: Pooler often requires `postgres.[project-ref]` not just `postgres`
2. **Region**: Make sure the region matches your project (e.g., `aws-0-us-west-1`)
3. **Port**: Both direct and pooler use 5432
4. **SSL**: Some connections require `?sslmode=require`

## Alternative: Use Supabase CLI

If GitHub Actions continues to fail, you can run the setup locally:

```bash
# Install psql locally
sudo apt-get install postgresql-client

# Run the setup
psql "YOUR_DATABASE_URL" < scripts/setup-supabase-tables.sql
```

Then commit the confirmation that tables are created.