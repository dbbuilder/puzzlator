#!/usr/bin/env node

console.log(`
🔗 Supabase Database URL Constructor
====================================

Based on your Supabase project URL:
https://pcztbpqbpkryupfxstkd.supabase.co

Your database URL format is:
postgresql://postgres:[YOUR-PASSWORD]@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres

To complete the URL, you need your database password.

Where to find your password:
1. Supabase Dashboard → Settings → Database
2. Look for "Database Password" section
3. Or check the email from when you created the project

Once you have your password, your complete URL will be:
postgresql://postgres:YOUR_ACTUAL_PASSWORD_HERE@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres

Example (with fake password):
postgresql://postgres:mySecurePass123!@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres

To add this to GitHub Secrets:
1. Copy your complete URL (with password)
2. Go to: https://github.com/dbbuilder/puzzlator/settings/secrets/actions
3. Click "New repository secret"
4. Name: SUPABASE_DB_URL
5. Value: [paste your complete URL]
6. Click "Add secret"

⚠️  Security: Never share or commit your database URL with the password!
`);

// Interactive mode if password is provided as argument
if (process.argv[2]) {
  const password = process.argv[2];
  console.log('\n✅ Your complete database URL:');
  console.log(`postgresql://postgres:${password}@db.pcztbpqbpkryupfxstkd.supabase.co:5432/postgres`);
  console.log('\n📋 Copy the above URL and add it to GitHub Secrets as SUPABASE_DB_URL');
} else {
  console.log('\n💡 Tip: Run with your password to see the complete URL:');
  console.log('   node scripts/construct-db-url.js YOUR_PASSWORD_HERE');
}