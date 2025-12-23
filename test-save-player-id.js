// Script di test per simulare salvataggio Player ID
// Simula esattamente quello che fa il frontend

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzfjtrteezvyoudpfccb.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY non trovata')
  process.exit(1)
}

// User ID dal database
const USER_ID = 'b243282c-14a1-47b7-8d5a-7a58823d1d2e'
const TEST_PLAYER_ID = 123456789 // ID di test

async function testSave() {
  console.log('🧪 TEST SALVATAGGIO PLAYER ID')
  console.log('='.repeat(50))
  console.log(`URL: ${SUPABASE_URL}`)
  console.log(`User ID: ${USER_ID}`)
  console.log(`Player ID da salvare: ${TEST_PLAYER_ID}`)
  console.log('='.repeat(50))
  console.log('')

  // Simula login per ottenere JWT
  console.log('1️⃣ Simulazione login...')
  const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'attiliomazzetti@gmail.com',
      password: 'TEST_PASSWORD', // ⚠️ Serve password reale per test completo
    }),
  })

  console.log(`   Status: ${loginResponse.status}`)
  const loginData = await loginResponse.json()
  
  if (loginResponse.status !== 200) {
    console.error('   ❌ Login fallito:', loginData)
    console.log('')
    console.log('⚠️  Per test completo, serve password reale')
    console.log('   Testando con anon key (simula utente non autenticato)...')
    console.log('')
    
    // Test con solo anon key (simula problema attuale)
    await testWithAnonKey()
    return
  }

  const accessToken = loginData.access_token
  console.log(`   ✅ Access Token ottenuto: ${accessToken.substring(0, 20)}...`)
  console.log('')

  // Test UPDATE con JWT
  console.log('2️⃣ Test UPDATE con JWT...')
  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`, // JWT utente
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      dota_account_id: TEST_PLAYER_ID,
      updated_at: new Date().toISOString(),
    }),
  })

  console.log(`   Status: ${updateResponse.status}`)
  const updateData = await updateResponse.json()
  
  if (updateResponse.status === 200 || updateResponse.status === 204) {
    console.log('   ✅ UPDATE riuscito!')
    console.log('   Data:', JSON.stringify(updateData, null, 2))
  } else {
    console.error('   ❌ UPDATE fallito:', updateData)
  }
  console.log('')

  // Test SELECT con JWT
  console.log('3️⃣ Test SELECT con JWT...')
  const selectResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=dota_account_id&id=eq.${USER_ID}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`, // JWT utente
    },
  })

  console.log(`   Status: ${selectResponse.status}`)
  const selectData = await selectResponse.json()
  
  if (selectResponse.status === 200) {
    console.log('   ✅ SELECT riuscito!')
    console.log('   Data:', JSON.stringify(selectData, null, 2))
  } else {
    console.error('   ❌ SELECT fallito:', selectData)
  }
}

async function testWithAnonKey() {
  console.log('2️⃣ Test UPDATE con SOLO anon key (simula problema attuale)...')
  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      // ⚠️ NESSUN Authorization header - simula problema
    },
    body: JSON.stringify({
      dota_account_id: TEST_PLAYER_ID,
      updated_at: new Date().toISOString(),
    }),
  })

  console.log(`   Status: ${updateResponse.status}`)
  const updateData = await updateResponse.json()
  console.log('   Response:', JSON.stringify(updateData, null, 2))
  
  if (updateResponse.status === 403) {
    console.log('   ❌ 403 Forbidden - RLS rifiuta perché auth.uid() è NULL')
    console.log('   ✅ Questo conferma il problema: sessione non passata correttamente')
  }
  console.log('')
}

// Esegui test
testSave().catch(console.error)

