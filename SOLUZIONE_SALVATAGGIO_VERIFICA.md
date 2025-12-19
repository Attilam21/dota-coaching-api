# 💾 SOLUZIONE SALVATAGGIO VERIFICA - Analisi Opzioni

**Problema**: Abbiamo già avuto problemi RLS 403 quando salvavamo `dota_account_id` in Supabase. Attualmente salviamo solo in localStorage.

**Obiettivo**: Salvare Player ID verificato senza problemi RLS.

---

## 🔍 OPZIONI DISPONIBILI

### Opzione 1: Solo localStorage ⚠️
**Come funziona**:
- Salva tutto in localStorage (Player ID + timestamp verifica)
- Nessuna query a Supabase

**Pro**:
- ✅ Nessun problema RLS
- ✅ Funziona subito
- ✅ Nessuna configurazione extra

**Contro**:
- ❌ Non persistente (si perde se cancella cache)
- ❌ Non sincronizzato tra dispositivi
- ❌ La verifica non ha senso se non è persistente

**Verdetto**: ❌ Non adatto per verifica

---

### Opzione 2: API Route Server-Side con Service Role Key ✅ **RACCOMANDATO**
**Come funziona**:
- Client chiama API route `/api/user/verify-dota-account`
- API route usa **service role key** (bypass RLS)
- Salva in Supabase senza problemi RLS
- Client continua a usare localStorage per uso immediato

**Pro**:
- ✅ Nessun problema RLS (bypass con service role)
- ✅ Persistente in Supabase
- ✅ Sincronizzato tra dispositivi
- ✅ Sicuro (service role solo server-side)

**Contro**:
- ⚠️ Richiede service role key in env vars
- ⚠️ Più complesso (API route extra)

**Implementazione**:
```typescript
// app/api/user/verify-dota-account/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  // Client con service role (bypass RLS)
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
  
  // Get user ID from JWT in request
  const { user } = await getUserFromRequest(request)
  
  // Salva in Supabase (bypass RLS)
  await supabaseAdmin
    .from('users')
    .update({
      dota_account_id: playerId,
      dota_account_verified_at: new Date().toISOString(),
      dota_verification_method: 'questions'
    })
    .eq('id', user.id)
}
```

**Verdetto**: ✅ **MIGLIORE** - Bypass RLS, persistente, sicuro

---

### Opzione 3: Provare UPDATE con RLS (Client-Side) ❌
**Come funziona**:
- Client fa UPDATE diretto a Supabase
- RLS policies dovrebbero permetterlo

**Pro**:
- ✅ Semplice (no API route)
- ✅ Nessuna service role key

**Contro**:
- ❌ **Già fallito** (errori 403)
- ❌ RLS policies potrebbero ancora bloccare
- ❌ Non affidabile

**Verdetto**: ❌ **NON RACCOMANDATO** - Già provato e fallito

---

### Opzione 4: Edge Function Supabase ⚠️
**Come funziona**:
- Edge Function Supabase che salva (bypass RLS)
- Client chiama Edge Function

**Pro**:
- ✅ Bypass RLS
- ✅ Persistente
- ✅ Sincronizzato

**Contro**:
- ❌ Più complesso (Edge Function)
- ❌ Overhead per MVP
- ❌ Non necessario (API route è più semplice)

**Verdetto**: ⚠️ **TROPPO COMPLESSO** per MVP

---

## 🎯 SOLUZIONE RACCOMANDATA

### Approccio Ibrido: localStorage + Supabase (via API Route)

**Flusso**:
1. **Uso immediato**: localStorage (come ora)
   - Player ID salvato in localStorage
   - Disponibile subito per dashboard

2. **Verifica**: API Route server-side
   - Client chiama `/api/user/verify-dota-account`
   - API route usa service role key (bypass RLS)
   - Salva in Supabase: `dota_account_id`, `dota_account_verified_at`, `dota_verification_method`

3. **Sincronizzazione**:
   - Se verificato → Mostra badge "Verificato"
   - Se non verificato → Mostra button "Verifica Account"
   - localStorage per uso immediato, Supabase per persistenza

---

## 📋 IMPLEMENTAZIONE

### Step 1: Aggiungere Service Role Key
```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANTE**: Service role key è **PRIVATA**, mai esporla nel client!

### Step 2: Creare API Route
```typescript
// app/api/user/verify-dota-account/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Verifica autenticazione (JWT dal cookie)
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Crea client con service role (bypass RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  // 3. Valida risposte (logica verifica)
  const { playerId, answers } = await request.json()
  const isValid = await validateAnswers(playerId, answers)
  
  if (!isValid) {
    return NextResponse.json({ verified: false }, { status: 400 })
  }
  
  // 4. Salva in Supabase (bypass RLS)
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      dota_account_id: parseInt(playerId),
      dota_account_verified_at: new Date().toISOString(),
      dota_verification_method: 'questions',
      updated_at: new Date().toISOString()
    })
    .eq('id', session.user.id)
  
  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  
  // 5. Ritorna successo
  return NextResponse.json({ verified: true })
}
```

### Step 3: Client continua a usare localStorage
```typescript
// app/dashboard/settings/page.tsx
// Continua a salvare in localStorage per uso immediato
localStorage.setItem('fzth_player_id', playerId)

// Dopo verifica, mostra badge "Verificato"
// (verifica letta da Supabase via API route)
```

---

## ✅ VANTAGGI

1. **Nessun problema RLS**: Service role bypassa RLS
2. **Persistente**: Salvato in Supabase
3. **Sincronizzato**: Tra dispositivi
4. **Sicuro**: Service role solo server-side
5. **UX immediata**: localStorage per uso subito

---

## ⚠️ CONSIDERAZIONI

### Service Role Key
- **Sicurezza**: Mai esporre nel client
- **Accesso**: Solo in API routes server-side
- **Permessi**: Bypassa RLS (usare con cautela)

### Verifica Accesso
- API route deve verificare JWT dal request
- Solo utente autenticato può verificare il proprio account
- Validare che `user.id` corrisponda

---

## 🎯 RACCOMANDAZIONE FINALE

**Usare Opzione 2: API Route Server-Side con Service Role Key**

- ✅ Risolve problema RLS
- ✅ Persistente e sincronizzato
- ✅ Sicuro (service role solo server-side)
- ✅ Mantiene localStorage per UX immediata

---

**Vuoi che proceda con questa soluzione?** 🎯

