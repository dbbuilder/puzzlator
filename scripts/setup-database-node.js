#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

// Get from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Please set:')
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL')
  console.error('  - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('🚀 Setting up Puzzlator database...\n')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Read the SQL file
const sqlPath = path.join(process.cwd(), 'scripts', 'setup-supabase-tables.sql')
const sqlContent = await fs.readFile(sqlPath, 'utf-8')

// Parse SQL statements (split by semicolon, but be careful with functions)
const statements = sqlContent
  .split(/;(?=\s*(?:--|$|CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|GRANT))/i)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📦 Found ${statements.length} SQL statements to execute\n`)

let successCount = 0
let errorCount = 0

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i]
  const preview = statement.substring(0, 50).replace(/\n/g, ' ')
  
  process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `)
  
  try {
    // For table creation, we need to use raw SQL through RPC
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: statement + ';' 
    })
    
    if (error) {
      // Try direct execution as fallback
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql_query: statement + ';' })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    }
    
    console.log('✅')
    successCount++
  } catch (error) {
    console.log(`❌ ${error.message}`)
    errorCount++
    
    // For critical tables, show the error
    if (statement.includes('CREATE TABLE') && !statement.includes('IF NOT EXISTS')) {
      console.log(`   Error details: ${error.message}`)
    }
  }
}

console.log(`\n📊 Summary:`)
console.log(`   ✅ Successful: ${successCount}`)
console.log(`   ❌ Failed: ${errorCount}`)

// Check what tables exist
console.log(`\n🔍 Checking tables...`)
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'BASE TABLE')

if (tables && !tablesError) {
  console.log(`\n📋 Tables in database:`)
  tables.forEach(t => console.log(`   - ${t.table_name}`))
} else {
  console.log('Could not fetch table list')
}

console.log('\n✨ Done!')