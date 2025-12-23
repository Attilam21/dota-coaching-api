/**
 * Script per eseguire RIPRISTINO_TABELLE.sql su Supabase
 * Usa la service role key per eseguire SQL tramite API
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Credenziali Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1'

// Crea client Supabase con service role key (bypassa RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeRestore() {
  try {
    console.log('📖 Leggo lo script SQL di ripristino...')
    const sqlPath = path.join(__dirname, '..', 'supabase', 'RIPRISTINO_TABELLE.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('🚀 Eseguo lo script SQL su Supabase...')
    console.log('⚠️  Questo ricreerà le tabelle users e match_analyses')
    
    // Supabase non espone un endpoint REST diretto per SQL arbitrario
    // Devo usare l'API Management o PostgreSQL diretto
    // Per ora, mostro le istruzioni
    
    console.log('\n💡 NOTA: Supabase non espone un endpoint REST per SQL arbitrario.')
    console.log('   Devi eseguire lo script manualmente nel SQL Editor:')
    console.log('')
    console.log('   1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new')
    console.log('   2. Copia e incolla il contenuto di supabase/RIPRISTINO_TABELLE.sql')
    console.log('   3. Clicca "Run" (o premi Ctrl+Enter)')
    console.log('')
    console.log('📄 Contenuto dello script:')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    
    // Alternativa: prova con PostgreSQL diretto se abbiamo la password
    console.log('\n💡 ALTERNATIVA: Se hai la password del database PostgreSQL,')
    console.log('   puoi usare lo script execute-cleanup-direct.js modificato')
    console.log('   per eseguire direttamente via PostgreSQL.')
    
  } catch (error) {
    console.error('❌ Errore durante la lettura dello script:', error.message)
    process.exit(1)
  }
}

// Esegui lo script
executeRestore()

