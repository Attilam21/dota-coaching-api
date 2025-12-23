# 🔍 Analisi Completa Full Stack - Riga per Riga

**Data Analisi:** Analisi approfondita di tutto il sistema  
**Modalità:** Full Stack Engineer - Verifica riga per riga

---

## 🚨 **PROBLEMA CRITICO IDENTIFICATO**

### **BUG #1: Authorization Header con Anon Key in Client Principale**

**File:** `lib/supabase.ts`  
**Riga:** 91  
**Severità:** 🔴 **CRITICA**

```typescript
// ❌ BUG CRITICO - Riga 91
'Authorization': `Bearer ${supabaseAnonKey}`, // Fallback per compatibilità
```

**Problema:**
- Questo header **sovrascrive** il JWT token dell'utente quando è autenticato
- Le RLS policies verificano `auth.uid()` che viene estratto dal JWT
- Se usiamo anon key invece del token utente, `auth.uid()` restituisce `null`
- Risultato: **"permission denied for table users"** (code: 42501)

**Impatto:**
- ❌ Utenti autenticati non possono leggere/scrivere i propri dati
- ❌ Player ID non può essere salvato/caricato
- ❌ Tutte le query a `public.users` falliscono con permission denied

**Confronto con altri file:**
- ✅ `lib/supabase-server.ts` (riga 25-27): **CORRETTO** - non ha Authorization con anon key
- ✅ `app/auth/callback/route.ts` (riga 29-31): **CORRETTO** - non ha Authorization con anon key
- ❌ `lib/supabase.ts` (riga 91): **SBAGLIATO** - ha Authorization con anon key

---

## 📊 **ANALISI DETTAGLIATA FILE PER FILE**

### **1. lib/supabase.ts** - Client Principale

#### **Righe 46-63: Funzione createSupabaseClient()**
```typescript
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```
✅ **OK:** Legge variabili d'ambiente correttamente

```typescript
  if (!supabaseUrl || !supabaseAnonKey) {
    // ... error handling
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
```
✅ **OK:** Gestione errori per variabili mancanti

#### **Righe 70-73: Validazione apikey**
```typescript
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.error('❌ Supabase ANON_KEY sembra non valida!')
  }
```
✅ **OK:** Validazione base (ma 20 caratteri potrebbe essere troppo restrittivo per JWT)

#### **Righe 75-97: Creazione Client**
```typescript
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,        // ✅ OK
      autoRefreshToken: true,       // ✅ OK
      detectSessionInUrl: true,     // ✅ OK
      storage: typeof window !== 'undefined' ? window.localStorage : undefined, // ✅ OK
      storageKey: 'sb-auth-token',  // ✅ OK
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,  // ✅ OK - identifica il progetto
        'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ BUG CRITICO!
      },
    },
```
🔴 **BUG:** Authorization header con anon key sovrascrive il token utente

**Come dovrebbe essere:**
```typescript
    global: {
      headers: {
        'apikey': supabaseAnonKey, // ✅ OK
        // NOTA: NON impostare Authorization qui - Supabase lo gestisce automaticamente
        // con il token dell'utente quando presente (session.access_token)
      },
    },
```

#### **Righe 99-132: Gestione Eventi Auth**
```typescript
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      // ✅ OK
    } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
      localStorage.removeItem('sb-auth-token') // ✅ OK
    }
  })
```
✅ **OK:** Gestione eventi corretta

#### **Righe 137-141: Export Singleton**
```typescript
const supabase = createSupabaseClient()
export { supabase }
```
✅ **OK:** Singleton pattern corretto

---

### **2. lib/supabase-server.ts** - Client Server-Side

#### **Righe 9-15: Funzione createServerSupabaseClient()**
```typescript
export function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieHeader = request.headers.get('cookie') || ''
```
✅ **OK:** Legge variabili e cookies correttamente

#### **Righe 16-31: Creazione Client**
```typescript
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,      // ✅ OK per server-side
      autoRefreshToken: false,      // ✅ OK per server-side
      detectSessionInUrl: false,   // ✅ OK per server-side
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,  // ✅ OK
        // NOTA: NON impostare Authorization con anon key ✅ CORRETTO!
        ...(cookieHeader && { cookie: cookieHeader }), // ✅ OK
      },
    },
  })
```
✅ **PERFETTO:** Non ha Authorization con anon key - Supabase gestisce automaticamente

---

### **3. app/auth/callback/route.ts** - Callback Route

#### **Righe 6-7: Variabili d'Ambiente**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
```
✅ **OK:** Fallback a stringa vuota

#### **Righe 22-34: Creazione Client**
```typescript
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // ✅ OK per callback
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,  // ✅ OK
        // NOTA: NON impostare Authorization con anon key ✅ CORRETTO!
      },
    },
  })
```
✅ **PERFETTO:** Non ha Authorization con anon key

---

### **4. lib/auth-context.tsx** - Context Autenticazione

#### **Righe 30-50: getSession()**
```typescript
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      })
```
✅ **OK:** Gestione errori corretta

#### **Righe 54-78: onAuthStateChange()**
```typescript
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
        } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
          setSession(null)
          setUser(null)
          localStorage.removeItem('sb-auth-token')
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      })
```
✅ **OK:** Gestione eventi corretta

**Problema Potenziale:**
- Riga 61: `event === 'USER_UPDATED' && !session` - potrebbe essere troppo aggressivo
- Se USER_UPDATED ha session, viene gestito nel branch `else` (riga 72-74) ✅ OK

---

### **5. lib/playerIdContext.tsx** - Context Player ID

#### **Righe 43-102: Load Player ID from Database**
```typescript
    const loadPlayerIdFromDatabase = async () => {
      if (!user) {
        setPlayerIdState(null)
        setIsLoading(false)
        return
      }

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('dota_account_id, dota_account_verified_at, dota_verification_method')
        .eq('id', user.id)
        .single()
```
✅ **OK:** Query corretta, usa `user.id` per filtrare

**Problema:**
- Se `lib/supabase.ts` ha Authorization con anon key, questa query fallirà con "permission denied"
- Il client Supabase userà anon key invece del token utente
- RLS policy `auth.uid() = id` fallirà perché `auth.uid()` sarà `null`

#### **Righe 105-119: setPlayerId()**
```typescript
  const setPlayerId = useCallback((id: string | null) => {
    setPlayerIdState(id ? id.trim() : null)
    if (!id) {
      setIsVerifiedState(false)
      setVerifiedAtState(null)
      setVerificationMethodState(null)
    }
  }, [])
```
✅ **OK:** Aggiorna solo state locale (database aggiornato da SettingsPage)

---

### **6. app/dashboard/settings/page.tsx** - Settings Page

#### **Righe 168-174: Salvataggio Player ID**
```typescript
      const { error: updateError } = await supabase
        .from('users')
        .update({
          dota_account_id: dotaAccountIdNum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
```
✅ **OK:** Query corretta, usa `user.id` per filtrare

**Problema:**
- Se `lib/supabase.ts` ha Authorization con anon key, questa query fallirà con "permission denied"
- Il client Supabase userà anon key invece del token utente
- RLS policy `auth.uid() = id` fallirà perché `auth.uid()` sarà `null`

#### **Righe 186-190: Gestione Errori Permission Denied**
```typescript
        if (updateError.code === 'PGRST301' || 
            updateError.code === '42501' ||
            updateError.message?.includes('permission denied')) {
```
✅ **OK:** Gestione errori corretta, ma il problema è che l'errore viene causato dal bug in `lib/supabase.ts`

---

## 🔄 **FLUSSO COMPLETO ANALIZZATO**

### **Scenario: Utente Autenticato Salva Player ID**

#### **Step 1: Login**
```
1. Utente fa login → Supabase crea session con access_token (JWT)
2. session.access_token contiene: { user_id: "xxx", ... }
3. Client Supabase salva session in localStorage ('sb-auth-token')
```

#### **Step 2: SettingsPage Carica**
```
1. SettingsPage monta → useAuth() carica user da session
2. user.id = "xxx" (da session.access_token)
3. PlayerIdContext carica da database:
   supabase.from('users').select(...).eq('id', user.id)
```

**PROBLEMA QUI:**
- Client Supabase in `lib/supabase.ts` ha `Authorization: Bearer ${anonKey}` nei global headers
- Questo **sovrascrive** il token utente
- Richiesta HTTP include:
  - Header: `apikey: eyJhbGci...` (anon key) ✅
  - Header: `Authorization: Bearer eyJhbGci...` (anon key) ❌ BUG!
- Supabase server riceve anon key in Authorization
- `auth.uid()` estrae user_id da Authorization header → **null** (anon key non ha user_id)
- RLS policy verifica: `auth.uid() = id` → `null = "xxx"` → **FALSE**
- Risultato: **"permission denied for table users"** (code: 42501)

#### **Step 3: Salvataggio Player ID**
```
1. Utente inserisce Player ID e clicca "Salva"
2. SettingsPage chiama:
   supabase.from('users').update({ dota_account_id: ... }).eq('id', user.id)
```

**STESSO PROBLEMA:**
- Authorization header contiene anon key invece del token utente
- RLS policy fallisce → "permission denied"

---

## ✅ **SOLUZIONE**

### **Fix Richiesto: lib/supabase.ts Riga 91**

**PRIMA (BUG):**
```typescript
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ BUG!
      },
    },
```

**DOPO (CORRETTO):**
```typescript
    global: {
      headers: {
        'apikey': supabaseAnonKey, // ✅ OK - identifica il progetto
        // NOTA: NON impostare Authorization qui - Supabase lo gestisce automaticamente
        // con il token dell'utente quando presente (session.access_token)
      },
    },
```

**Perché funziona:**
1. `apikey` header identifica il progetto Supabase (sempre richiesto)
2. Supabase client gestisce **automaticamente** l'Authorization header:
   - Quando session è presente → usa `session.access_token` (JWT utente)
   - Quando session NON è presente → non include Authorization header
3. RLS policies funzionano correttamente perché `auth.uid()` può estrarre user_id dal JWT

---

## 📋 **CHECKLIST COERENZA**

### **Configurazione Client Supabase**
- [x] `lib/supabase.ts` - ❌ **BUG:** Authorization con anon key
- [x] `lib/supabase-server.ts` - ✅ **OK:** Nessun Authorization con anon key
- [x] `app/auth/callback/route.ts` - ✅ **OK:** Nessun Authorization con anon key

### **Gestione Sessione**
- [x] `lib/auth-context.tsx` - ✅ **OK:** Gestione eventi corretta
- [x] `lib/supabase.ts` - ✅ **OK:** onAuthStateChange configurato
- [x] localStorage - ✅ **OK:** Solo 'sb-auth-token', non dati partita

### **Query Database**
- [x] `lib/playerIdContext.tsx` - ✅ **OK:** Query corretta (ma fallisce per bug Authorization)
- [x] `app/dashboard/settings/page.tsx` - ✅ **OK:** Query corretta (ma fallisce per bug Authorization)

### **RLS Policies**
- [x] Policies configurate - ✅ **OK:** (da verificare in DB)
- [x] RLS abilitato - ✅ **OK:** (da verificare in DB)

---

## 🎯 **RISULTATO ANALISI**

### **Problemi Identificati:**
1. 🔴 **CRITICO:** `lib/supabase.ts` riga 91 - Authorization header con anon key
2. ⚠️ **MINORE:** Validazione apikey (20 caratteri potrebbe essere troppo restrittivo)

### **File Corretti:**
1. ✅ `lib/supabase-server.ts` - Configurazione corretta
2. ✅ `app/auth/callback/route.ts` - Configurazione corretta
3. ✅ `lib/auth-context.tsx` - Gestione eventi corretta
4. ✅ `lib/playerIdContext.tsx` - Logica corretta (ma fallisce per bug)
5. ✅ `app/dashboard/settings/page.tsx` - Logica corretta (ma fallisce per bug)

---

## 🚀 **AZIONE RICHIESTA**

**Fix Immediato:**
1. Rimuovere `'Authorization': `Bearer ${supabaseAnonKey}`` da `lib/supabase.ts` riga 91
2. Aggiungere commento esplicativo
3. Testare salvataggio Player ID
4. Verificare che non ci siano più errori "permission denied"

**Stato:** ⏳ **IN ATTESA FIX**

