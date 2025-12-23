/**
 * Script per verificare trigger usando Supabase Management API
 * Usa service role key per accedere al database
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1'

// Prova a usare l'API REST di Supabase per eseguire query SQL
// Nota: Supabase non espone un endpoint REST per SQL arbitrario
// Quindi dobbiamo usare un metodo alternativo

async function verificaTrigger() {
  console.log('🔍 Verifico trigger in Supabase...\n')
  
  // Metodo 1: Prova con Supabase REST API (non supporta SQL arbitrario)
  console.log('⚠️  Supabase non espone un endpoint REST per eseguire SQL arbitrario.')
  console.log('   La service role key serve per chiamate API, non per query SQL dirette.\n')
  
  console.log('📋 TRIGGER DEFINITI NEI FILE SQL:\n')
  console.log('1. ✅ on_auth_user_created')
  console.log('   - File: SCHEMA_ENTERPRISE.sql, RIPRISTINO_TABELLE.sql')
  console.log('   - Tabella: auth.users')
  console.log('   - Scopo: Auto-crea profilo alla registrazione\n')
  
  console.log('2. ✅ prevent_dota_id_change_trigger')
  console.log('   - File: SCHEMA_ENTERPRISE.sql')
  console.log('   - Tabella: public.users')
  console.log('   - Scopo: Blocca modifiche Player ID dopo verifica\n')
  
  console.log('3. ✅ update_last_analyzed_match_trigger')
  console.log('   - File: SCHEMA_ENTERPRISE.sql')
  console.log('   - Tabella: public.match_analyses')
  console.log('   - Scopo: Aggiorna ultima partita analizzata\n')
  
  console.log('🔍 PER VERIFICARE SE SONO PRESENTI SU SUPABASE:\n')
  console.log('📋 OPZIONE 1 (CONSIGLIATA): SQL Editor')
  console.log('   1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new')
  console.log('   2. Copia e incolla: supabase/VERIFICA_TRIGGER_SEMPLICE.sql')
  console.log('   3. Clicca "Run"\n')
  
  console.log('📋 OPZIONE 2: Usa password database')
  console.log('   Esegui: node scripts/verifica-trigger.js')
  console.log('   (Serve SUPABASE_DB_PASSWORD in .env.local)\n')
  
  console.log('💡 NOTA:')
  console.log('   - Service Role Key: per chiamate API REST')
  console.log('   - Database Password: per query SQL dirette')
  console.log('   - Sono due cose diverse!\n')
}

verificaTrigger()

