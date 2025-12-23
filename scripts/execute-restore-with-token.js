/**
 * Script per eseguire RIPRISTINO_TABELLE.sql usando la service role key
 * Prova vari metodi per eseguire SQL
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
    
    console.log('🚀 Provo a eseguire lo script SQL...')
    console.log('⚠️  Questo ricreerà le tabelle users e match_analyses')
    
    // Metodo 1: Prova con API Management di Supabase
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (projectRef) {
      console.log('\n📡 Provo con API Management...')
      
      // Prova endpoint per eseguire SQL (se disponibile)
      try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ query: sql })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Script eseguito con successo tramite API Management!')
          console.log('📊 Risultato:', JSON.stringify(result, null, 2))
          return
        } else {
          const errorText = await response.text()
          console.log('⚠️  API Management non disponibile:', response.status, errorText)
        }
      } catch (apiError) {
        console.log('⚠️  API Management non disponibile:', apiError.message)
      }
    }
    
    // Metodo 2: Usa RPC function (se esiste)
    console.log('\n📡 Provo con RPC function...')
    try {
      // Supabase non ha un RPC predefinito per SQL arbitrario
      // Ma possiamo provare a creare una funzione temporanea
      console.log('⚠️  RPC non disponibile per SQL arbitrario')
    } catch (rpcError) {
      console.log('⚠️  RPC non disponibile:', rpcError.message)
    }
    
    // Metodo 3: Fallback - mostra istruzioni
    console.log('\n💡 Supabase non espone un endpoint REST per SQL arbitrario.')
    console.log('   Devi eseguire lo script manualmente nel SQL Editor:')
    console.log('')
    console.log('   📋 ISTRUZIONI:')
    console.log('   1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new')
    console.log('   2. Copia e incolla il contenuto di supabase/RIPRISTINO_TABELLE.sql')
    console.log('   3. Clicca "Run" (o premi Ctrl+Enter)')
    console.log('')
    console.log('   ✅ Questo è il metodo più sicuro e veloce!')
    console.log('')
    console.log('📄 Contenuto dello script (primi 500 caratteri):')
    console.log('─'.repeat(60))
    console.log(sql.substring(0, 500) + '...')
    console.log('─'.repeat(60))
    console.log(`\n📝 File completo: ${sqlPath}`)
    
  } catch (error) {
    console.error('❌ Errore durante la lettura dello script:', error.message)
    process.exit(1)
  }
}

// Esegui lo script
executeRestore()

