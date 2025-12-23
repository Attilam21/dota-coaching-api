/**
 * Script per verificare trigger in Supabase
 * Usa PostgreSQL direttamente con connection string
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Credenziali Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD // Password del database PostgreSQL

// Estrai project ref dall'URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Impossibile estrarre project ref dall\'URL Supabase')
  process.exit(1)
}

if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ Variabile d\'ambiente SUPABASE_DB_PASSWORD non impostata.')
  console.error('   Per eseguire questo script, devi fornire la password del database PostgreSQL.')
  console.error('   Vedi supabase/COME_TROVARE_PASSWORD_DB.md per istruzioni.')
  process.exit(1)
}

// Connection string per Supabase
const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`

async function verificaTrigger() {
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  })

  try {
    console.log('🔍 Verifico trigger in Supabase...\n')
    
    const client = await pool.connect()
    try {
      // 1. Lista tutti i trigger
      console.log('📋 TRIGGER PRESENTI:\n')
      const triggersResult = await client.query(`
        SELECT 
          trigger_name,
          event_object_schema,
          event_object_table,
          event_manipulation,
          action_timing
        FROM information_schema.triggers
        WHERE trigger_schema IN ('public', 'auth')
        ORDER BY trigger_schema, trigger_name
      `)
      
      if (triggersResult.rows.length === 0) {
        console.log('❌ Nessun trigger trovato!\n')
      } else {
        triggersResult.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.trigger_name}`)
          console.log(`   Schema: ${row.event_object_schema}`)
          console.log(`   Tabella: ${row.event_object_table}`)
          console.log(`   Evento: ${row.event_manipulation}`)
          console.log(`   Timing: ${row.action_timing}`)
          console.log('')
        })
      }
      
      // 2. Verifica trigger specifici
      console.log('🔎 VERIFICA TRIGGER SPECIFICI:\n')
      
      const triggerChecks = [
        {
          name: 'on_auth_user_created',
          schema: 'auth',
          table: 'users',
          desc: 'Auto-crea profilo alla registrazione'
        },
        {
          name: 'prevent_dota_id_change_trigger',
          schema: 'public',
          table: 'users',
          desc: 'Blocca modifiche Player ID dopo verifica'
        },
        {
          name: 'update_last_analyzed_match_trigger',
          schema: 'public',
          table: 'match_analyses',
          desc: 'Aggiorna ultima partita analizzata'
        }
      ]
      
      for (const check of triggerChecks) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = $1 
            AND event_object_schema = $2
            AND event_object_table = $3
          ) as exists
        `, [check.name, check.schema, check.table])
        
        const status = result.rows[0].exists ? '✅ PRESENTE' : '❌ MANCANTE'
        console.log(`${status} - ${check.name}`)
        console.log(`   ${check.desc}`)
        console.log(`   Tabella: ${check.schema}.${check.table}\n`)
      }
      
      // 3. Verifica funzioni
      console.log('🔧 FUNZIONI ASSOCIATE:\n')
      
      const functions = [
        'handle_new_user',
        'prevent_dota_id_change',
        'update_last_analyzed_match',
        'cleanup_expired_cache'
      ]
      
      for (const funcName of functions) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = $1 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          ) as exists
        `, [funcName])
        
        const status = result.rows[0].exists ? '✅ PRESENTE' : '❌ MANCANTE'
        console.log(`${status} - ${funcName}()`)
      }
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error.message)
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n💡 NOTA: La password del database potrebbe non essere corretta.')
      console.log('   Verifica la variabile SUPABASE_DB_PASSWORD in .env.local')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Esegui la verifica
verificaTrigger()

