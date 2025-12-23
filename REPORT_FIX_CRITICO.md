# 🚨 REPORT FIX CRITICO - Authorization Header Bug

**Data:** Analisi completa full stack  
**Severità:** 🔴 **CRITICA**  
**Stato:** ⏳ **FIX RICHIESTO**

---

## 🔴 **BUG CRITICO IDENTIFICATO**

### **File:** `lib/supabase.ts`  
### **Riga:** 91  
### **Codice Problematico:**

```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ✅ OK
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ BUG CRITICO!
  },
}
```

---

## 🔍 **ANALISI DETTAGLIATA**

### **1. Come Funziona Supabase Authorization**

**Header Richiesti:**
- `apikey`: Identifica il progetto Supabase (sempre richiesto)
- `Authorization`: JWT token dell'utente (quando autenticato)

**Flusso Corretto:**
```
1. Utente fa login → Supabase crea session con access_token (JWT)
2. JWT contiene: { user_id: "xxx", email: "...", ... }
3. Client Supabase include automaticamente:
   - Header: apikey: eyJhbGci... (anon key) ✅
   - Header: Authorization: Bearer eyJhbGci... (JWT utente) ✅
4. Supabase server estrae user_id da JWT → "xxx"
5. RLS policy verifica: auth.uid() = id → "xxx" = "xxx" → ✅ TRUE
6. Query permessa ✅
```

**Flusso con Bug:**
```
1. Utente fa login → Supabase crea session con access_token (JWT)
2. JWT contiene: { user_id: "xxx", ... }
3. Client Supabase include:
   - Header: apikey: eyJhbGci... (anon key) ✅
   - Header: Authorization: Bearer eyJhbGci... (anon key) ❌ BUG!
4. Supabase server estrae user_id da Authorization → null (anon key non ha user_id)
5. RLS policy verifica: auth.uid() = id → null = "xxx" → ❌ FALSE
6. Query bloccata → "permission denied for table users" (code: 42501) ❌
```

---

## 📊 **VERIFICA RLS POLICIES**

**Policies Verificate nel Database:**
- ✅ `Users can view own profile` (SELECT) - `auth.uid() = id`
- ✅ `Users can update own profile` (UPDATE) - `auth.uid() = id`
- ✅ `Users can insert own profile` (INSERT) - `auth.uid() = id`

**Stato:** ✅ **Policies corrette** - Il problema è nel client, non nelle policies!

---

## 🔄 **CONFRONTO FILE**

### **lib/supabase.ts** (Client Principale) ❌
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ BUG!
  },
}
```
**Usato da:**
- `lib/auth-context.tsx`
- `lib/playerIdContext.tsx`
- `app/dashboard/settings/page.tsx`
- Tutti i componenti client-side

**Impatto:** 🔴 **CRITICO** - Tutte le query falliscono con permission denied

---

### **lib/supabase-server.ts** (Server-Side) ✅
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    // NOTA: NON impostare Authorization con anon key ✅ CORRETTO!
    ...(cookieHeader && { cookie: cookieHeader }),
  },
}
```
**Usato da:** API routes server-side  
**Stato:** ✅ **CORRETTO**

---

### **app/auth/callback/route.ts** (Callback) ✅
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    // NOTA: NON impostare Authorization con anon key ✅ CORRETTO!
  },
}
```
**Usato da:** Callback route per OAuth/email verification  
**Stato:** ✅ **CORRETTO**

---

### **app/actions/save-player-id.ts** (Server Action) ⚠️
```typescript
// Riga 40-47: Crea client con accessToken se fornito
if (accessToken) {
  clientOptions.global = {
    headers: {
      'Authorization': `Bearer ${accessToken}`, // ✅ OK - usa token utente
    },
  }
}
```
**Nota:** Questo file non è più usato (SettingsPage usa client diretto), ma la logica è corretta.

---

## 🎯 **SOLUZIONE**

### **Fix Richiesto: lib/supabase.ts Riga 88-93**

**PRIMA (BUG):**
```typescript
    global: {
      headers: {
        'apikey': supabaseAnonKey, // ✅ OK
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

---

## ✅ **VERIFICA POST-FIX**

Dopo il fix, verifica:

1. **Network Tab:**
   - Apri Console (F12) → Network Tab
   - Filtra per `supabase.co`
   - Clicca su una richiesta → Headers
   - Verifica:
     - ✅ `apikey: eyJhbGci...` (anon key)
     - ✅ `Authorization: Bearer eyJhbGci...` (JWT utente, NON anon key)

2. **Console:**
   - Nessun errore "permission denied for table users"
   - Player ID può essere salvato/caricato

3. **Database:**
   - Query a `public.users` funzionano correttamente
   - RLS policies permettono accesso ai propri dati

---

## 📋 **CHECKLIST FINALE**

- [ ] Fix applicato in `lib/supabase.ts` riga 91
- [ ] Commento esplicativo aggiunto
- [ ] Test salvataggio Player ID
- [ ] Verifica Network Tab per Authorization header
- [ ] Verifica che non ci siano più errori "permission denied"
- [ ] Push su GitHub

---

**Stato:** ⏳ **IN ATTESA FIX**

