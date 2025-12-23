# 🔍 Analisi Errori Console - Diagnostica Completa

**Data Analisi:** Dopo push fix "No API key found in request"  
**Stato:** ⚠️ **ERRORI IDENTIFICATI - SOLUZIONI PROPOSTE**

---

## 📋 **ERRORI IDENTIFICATI**

### 1. ❌ **AuthApiError: Invalid Refresh Token: Refresh Token Not Found**

**Severità:** 🔴 **ALTA** - Blocca l'autenticazione

**Descrizione:**
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

**Causa Probabile:**
- Il refresh token salvato in `localStorage` è scaduto o non valido
- La sessione Supabase è scaduta e il client sta tentando di fare refresh automatico
- Il `localStorage` è stato pulito o corrotto
- Il token è stato revocato lato server

**Impatto:**
- L'utente non può autenticarsi correttamente
- Le richieste al database falliscono con 403 Forbidden
- Il salvataggio/caricamento del Player ID fallisce

**Soluzione Proposta:**
1. **Gestire errori di refresh token** - Catturare l'errore e fare logout automatico
2. **Pulire localStorage** quando il refresh token è invalido
3. **Reindirizzare al login** quando la sessione è scaduta
4. **Migliorare gestione errori** in `lib/supabase.ts` e `lib/auth-context.tsx`

---

### 2. ❌ **403 Forbidden (Multiple)**

**Severità:** 🔴 **ALTA** - Blocca accesso al database

**Descrizione:**
```
Failed to load resource: the server responded with a status of 403
```

**Causa Probabile:**
- **RLS Policies non configurate correttamente** sulla tabella `users`
- **Sessione non valida** (conseguenza dell'errore #1)
- **Token JWT scaduto** o non presente nelle richieste
- **auth.uid()** non corrisponde all'ID utente nella query

**Impatto:**
- Impossibile leggere/scrivere nella tabella `users`
- Errori "Error fetching player ID from DB"
- Errori "Error updating player ID"

**Soluzione Proposta:**
1. **Verificare RLS Policies** - Eseguire script di verifica
2. **Verificare che RLS sia abilitato** sulla tabella `users`
3. **Verificare che le policies siano corrette** (SELECT, UPDATE, INSERT)
4. **Gestire errori 403** - Reindirizzare al login se la sessione è scaduta

---

### 3. ❌ **Error fetching player ID from DB**

**Severità:** 🟡 **MEDIA** - Funzionalità degradata

**Descrizione:**
```
Error fetching player ID from DB: ► Object
```

**Causa Probabile:**
- Conseguenza diretta degli errori #1 e #2
- La query `supabase.from('users').select()` fallisce per 403 Forbidden
- La sessione non è valida quando viene eseguita la query

**Impatto:**
- Il Player ID non viene caricato dal database
- L'app usa solo `localStorage` come fallback
- L'utente non vede il Player ID salvato nel database

**Soluzione Proposta:**
- Risolvere errori #1 e #2 (causa root)
- Migliorare gestione errori in `loadUserSettings()`
- Mostrare messaggio all'utente se il caricamento fallisce

---

### 4. ❌ **Error updating player ID**

**Severità:** 🟡 **MEDIA** - Funzionalità degradata

**Descrizione:**
```
Error updating player ID: ► Object
```

**Causa Probabile:**
- Conseguenza diretta degli errori #1 e #2
- La query `supabase.from('users').update()` fallisce per 403 Forbidden
- La sessione non è valida quando viene eseguito l'update

**Impatto:**
- Il Player ID non viene salvato nel database
- L'app salva solo in `localStorage`
- I dati non sono sincronizzati tra dispositivi

**Soluzione Proposta:**
- Risolvere errori #1 e #2 (causa root)
- Migliorare gestione errori in `handleSave()`
- Mostrare messaggio di errore chiaro all'utente

---

### 5. ⚠️ **NotFoundError: Failed to execute 'removeChild' on 'Node'**

**Severità:** 🟢 **BASSA** - Non critico, errore React/DOM

**Descrizione:**
```
NotFoundError: Failed to execute 'removeChild' on 'Node': 
The node to be removed is not a child of this node.
```

**Causa Probabile:**
- Errore di rendering React quando un componente viene rimosso dal DOM
- Race condition durante il cleanup di componenti
- Problema con `useEffect` cleanup che tenta di rimuovere un nodo già rimosso

**Impatto:**
- Nessun impatto funzionale (solo warning in console)
- Potrebbe causare memory leak minori

**Soluzione Proposta:**
- Verificare cleanup functions in `useEffect`
- Aggiungere controlli prima di rimuovere nodi DOM
- **Non prioritario** - può essere risolto dopo gli errori critici

---

### 6. ℹ️ **404 Not Found (dashboard-bg.png, profile-bg.png)**

**Severità:** 🟢 **NON ERRORE** - Comportamento atteso

**Descrizione:**
```
Failed to load resource: the server responded with a status of 404
/dashboard-bg.png:1
/profile-bg.png:1
```

**Causa:**
- I file non esistono nella cartella `public/`
- Il codice in `SettingsPage` verifica l'esistenza dei file con `fetch(HEAD)`
- Un 404 è **normale** se i file non sono presenti

**Impatto:**
- Nessuno - il codice gestisce correttamente i 404
- Le opzioni di sfondo non disponibili non vengono mostrate

**Soluzione:**
- **Nessuna azione necessaria** - comportamento corretto
- I file sono opzionali e il codice gestisce la loro assenza

---

## 🔧 **SOLUZIONI PROPOSTE**

### **Soluzione 1: Gestione Errori Refresh Token**

**File da modificare:** `lib/supabase.ts`

**Problema:** Il client Supabase non gestisce correttamente gli errori di refresh token scaduto.

**Fix:**
```typescript
// Aggiungere gestione errori per refresh token invalido
client.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
    // Gestisci refresh token scaduto
    if (event === 'SIGNED_OUT' && !session) {
      // Pulire localStorage se la sessione è scaduta
      try {
        localStorage.removeItem('sb-auth-token')
        localStorage.removeItem('fzth_player_id')
      } catch (err) {
        console.error('Failed to clear localStorage:', err)
      }
    }
  }
})
```

---

### **Soluzione 2: Migliorare Gestione Errori in AuthContext**

**File da modificare:** `lib/auth-context.tsx`

**Problema:** Gli errori di refresh token non vengono gestiti, causando loop infiniti.

**Fix:**
```typescript
// Catturare errori di refresh token e fare logout automatico
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Token refresh riuscito
    setSession(session)
    setUser(session?.user ?? null)
  } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
    // Sessione scaduta o logout
    setSession(null)
    setUser(null)
    // Pulire localStorage
    try {
      localStorage.removeItem('sb-auth-token')
    } catch (err) {
      console.error('Failed to clear auth token:', err)
    }
  } else {
    setSession(session)
    setUser(session?.user ?? null)
  }
  setLoading(false)
})
```

---

### **Soluzione 3: Verificare e Fixare RLS Policies**

**File da creare/eseguire:** Script SQL in Supabase Dashboard

**Problema:** Le RLS policies potrebbero non essere configurate correttamente o RLS non è abilitato.

**Fix:**
Eseguire questo script in Supabase SQL Editor:
```sql
-- 1. Verifica che RLS sia abilitato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Rimuovi policies duplicate o errate
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 3. Ricrea policies corrette
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Verifica
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
```

---

### **Soluzione 4: Migliorare Gestione Errori in SettingsPage**

**File da modificare:** `app/dashboard/settings/page.tsx`

**Problema:** Gli errori 403 non vengono gestiti correttamente, l'utente non sa cosa fare.

**Fix:**
```typescript
// In loadUserSettings()
if (fetchError) {
  console.error('Error fetching player ID from DB:', fetchError)
  
  // Se è un errore di autenticazione, reindirizza al login
  if (fetchError.code === 'PGRST301' || fetchError.message?.includes('JWT')) {
    setMessage({
      type: 'error',
      text: 'Sessione scaduta. Effettua il login di nuovo.',
    })
    // Reindirizza al login dopo 2 secondi
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
    return
  }
  
  // Fallback a localStorage per altri errori
  const saved = localStorage.getItem('fzth_player_id')
  // ...
}

// In handleSave()
if (updateError) {
  console.error('Error updating player ID:', updateError)
  
  // Se è un errore di autenticazione, reindirizza al login
  if (updateError.code === 'PGRST301' || updateError.message?.includes('JWT')) {
    setMessage({
      type: 'error',
      text: 'Sessione scaduta. Effettua il login di nuovo.',
    })
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
    return
  }
  
  setMessage({
    type: 'error',
    text: updateError.message || 'Errore nel salvataggio del Player ID.',
  })
  // ...
}
```

---

### **Soluzione 5: Aggiungere Retry Logic per Refresh Token**

**File da modificare:** `lib/supabase.ts`

**Problema:** Se il refresh token fallisce, non c'è retry o fallback.

**Fix:**
```typescript
// Aggiungere configurazione per gestire refresh token
const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    // Aggiungere gestione errori refresh
    flowType: 'pkce', // Usa PKCE per sicurezza migliore
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
})

// Gestire errori di refresh token
if (typeof window !== 'undefined') {
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase] Token refreshed successfully')
    } else if (event === 'SIGNED_OUT') {
      console.log('[Supabase] User signed out')
      // Pulire localStorage se logout
      try {
        localStorage.removeItem('sb-auth-token')
      } catch (err) {
        console.error('Failed to clear auth token:', err)
      }
    }
  })
}
```

---

## ✅ **CHECKLIST VERIFICA**

### **Database (Supabase):**
- [ ] RLS abilitato sulla tabella `users`
- [ ] 3 policies RLS configurate (SELECT, UPDATE, INSERT)
- [ ] Policies usano `auth.uid() = id` correttamente
- [ ] Trigger `on_auth_user_created` attivo (se necessario)

### **Client (Next.js):**
- [ ] `lib/supabase.ts` include header `apikey`
- [ ] `lib/supabase.ts` gestisce errori refresh token
- [ ] `lib/auth-context.tsx` gestisce sessioni scadute
- [ ] `app/dashboard/settings/page.tsx` gestisce errori 403
- [ ] `localStorage` viene pulito quando la sessione scade

### **Autenticazione:**
- [ ] Sessione Supabase valida quando si accede a Settings
- [ ] Token JWT presente nelle richieste
- [ ] Refresh token funziona correttamente
- [ ] Logout pulisce correttamente localStorage

---

## 🎯 **PRIORITÀ INTERVENTI**

1. **🔴 PRIORITÀ ALTA:**
   - Fix gestione refresh token (#1)
   - Verificare/fixare RLS policies (#2)
   - Migliorare gestione errori 403 (#4)

2. **🟡 PRIORITÀ MEDIA:**
   - Migliorare messaggi errore all'utente (#3, #4)
   - Aggiungere retry logic (#5)

3. **🟢 PRIORITÀ BASSA:**
   - Fix errore DOM React (#5) - Non critico

---

## 📝 **NOTE FINALI**

- Gli errori **404 per immagini** sono **normali** e non richiedono intervento
- L'errore **DOM React** è non critico e può essere risolto dopo
- Gli errori principali sono legati a **autenticazione e RLS policies**
- La soluzione richiede interventi sia lato **client** che lato **database**

---

**Stato:** ⏸️ **IN ATTESA APPROVAZIONE UTENTE**

**Prossimi Passi:**
1. Attendere approvazione utente
2. Implementare soluzioni in ordine di priorità
3. Testare ogni fix
4. Verificare che gli errori siano risolti

