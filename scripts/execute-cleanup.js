/**
 * Script per eseguire CLEANUP_FINAL.sql su Supabase
 * Usa l'API Management di Supabase (se disponibile) o PostgreSQL diretto
 */

const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Carica variabili d'ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1'

async function executeCleanup() {
  try {
    console.log('📖 Leggo lo script SQL...')
    const sqlPath = path.join(__dirname, '..', 'supabase', 'CLEANUP_FINAL.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('🚀 Eseguo lo script SQL su Supabase...')
    console.log('⚠️  ATTENZIONE: Questo eliminerà tutte le tabelle non utilizzate!')
    
    // Metodo 1: Prova con API Management di Supabase (se disponibile)
    try {
      const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
      if (projectRef) {
        const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
        
        console.log('📡 Provo con API Management...')
        const response = await fetch(managementUrl, {
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
        }
      }
    } catch (apiError) {
      console.log('⚠️  API Management non disponibile, provo metodo alternativo...')
    }
    
    // Metodo 2: Usa PostgreSQL diretto (richiede connection string)
    // Per Supabase, la connection string è nella forma:
    // postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    // Ma non abbiamo la password del database, quindi questo metodo non funziona
    
    // Metodo 3: Crea una funzione stored procedure e la chiama
    console.log('💡 Supabase non espone un endpoint REST per SQL arbitrario.')
    console.log('   Devi eseguire lo script manualmente nel SQL Editor:')
    console.log('   1. Vai su https://supabase.com/dashboard')
    console.log('   2. Seleziona il progetto')
    console.log('   3. Apri SQL Editor')
    console.log('   4. Copia e incolla il contenuto di supabase/CLEANUP_FINAL.sql')
    console.log('   5. Clicca RUN')
    console.log('')
    console.log('📄 Contenuto dello script:')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione:', error.message)
    process.exit(1)
  }
}

// Esegui lo script
executeCleanup()
