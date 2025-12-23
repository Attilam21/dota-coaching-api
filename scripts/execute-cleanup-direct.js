/**
 * Script per eseguire CLEANUP_FINAL.sql su Supabase
 * Usa PostgreSQL direttamente con connection string
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Credenziali Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

// Estrai project ref dall'URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Impossibile estrarre project ref dall\'URL Supabase')
  process.exit(1)
}

if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ Password del database non trovata!')
  console.log('\n💡 Per eseguire questo script, hai 2 opzioni:')
  console.log('\n📋 OPZIONE 1 (CONSIGLIATA): Esegui nel SQL Editor')
  console.log('   1. Vai su https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb')
  console.log('   2. Clicca su "SQL Editor"')
  console.log('   3. Clicca su "+ New"')
  console.log('   4. Copia e incolla il contenuto di supabase/CLEANUP_FINAL.sql')
  console.log('   5. Clicca "Run" (o premi Ctrl+Enter)')
  console.log('\n📋 OPZIONE 2: Usa questo script con la password')
  console.log('   1. Vai su Supabase Dashboard → Settings → Database')
  console.log('   2. Trova la "Connection string" o resetta la password')
  console.log('   3. Esegui: SUPABASE_DB_PASSWORD="tua_password" node scripts/execute-cleanup-direct.js')
  process.exit(1)
}

// Connection string per Supabase
// Formato diretto: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
// Formato pooler: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`

async function executeCleanup() {
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  })

  try {
    console.log('📖 Leggo lo script SQL...')
    const sqlPath = path.join(__dirname, '..', 'supabase', 'CLEANUP_FINAL.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('🚀 Eseguo lo script SQL su Supabase...')
    console.log('⚠️  ATTENZIONE: Questo eliminerà tutte le tabelle non utilizzate!')
    
    // Esegui lo script
    const client = await pool.connect()
    try {
      await client.query(sql)
      console.log('✅ Script eseguito con successo!')
      
      // Verifica risultato
      const result = await client.query(`
        SELECT 
          'Remaining public tables' as info,
          COUNT(*) as count,
          string_agg(table_name, ', ') as tables
        FROM information_schema.tables 
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      `)
      
      console.log('📊 Risultato:', result.rows[0])
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione:', error.message)
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n💡 NOTA: La connection string potrebbe non essere corretta.')
      console.log('   Devi eseguire lo script manualmente nel SQL Editor:')
      console.log('   1. Vai su https://supabase.com/dashboard')
      console.log('   2. Seleziona il progetto')
      console.log('   3. Apri SQL Editor')
      console.log('   4. Copia e incolla il contenuto di supabase/CLEANUP_FINAL.sql')
      console.log('   5. Clicca RUN')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Esegui lo script
executeCleanup()

