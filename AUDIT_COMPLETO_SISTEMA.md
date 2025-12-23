# 🔍 AUDIT COMPLETO SISTEMA - Project Manager Full Stack

**Data:** Audit completo e minuzioso di tutto il sistema  
**Obiettivo:** Identificare TUTTI i problemi, non solo uno alla volta  
**Approccio:** Analisi sistematica riga per riga, flusso per flusso

---

## 📊 **1. ANALISI CONFIGURAZIONE SUPABASE**

### **1.1 Client Supabase (lib/supabase.ts)**

**Status:** 🔴 **PROBLEMA CRITICO**

**Riga 91:**
```typescript
'Authorization': `Bearer ${supabaseAnonKey}`, // Fallback per compatibilità
```

**Problema:**
- ❌ Authorization header con anon key sovrascrive JWT utente
- ❌ Causa 401/403 Forbidden perché `auth.uid()` = null
- ❌ RLS policies falliscono

**Configurazione Auth:**
- ✅ `persistSession: true` (riga 82)
- ✅ `autoRefreshToken: true` (riga 83)
- ✅ `detectSessionInUrl: true` (riga 84)
- ✅ `storage: window.localStorage` (riga 85)
- ✅ `storageKey: 'sb-auth-token'` (riga 86)

**Conclusione:** Configurazione auth OK, ma Authorization header è SBAGLIATO.

---

### **1.2 Server Supabase Client (lib/supabase-server.ts)**

**Status:** ✅ **CORRETTO**

**Analisi:**
- ✅ NON ha Authorization header con anon key (riga 25-27)
- ✅ Usa cookie header per autenticazione (riga 28)
- ✅ Configurazione corretta per server-side

**Conclusione:** Nessun problema.

---

### **1.3 Auth Callback Route (app/auth/callback/route.ts)**

**Status:** ✅ **CORRETTO**

**Analisi:**
- ✅ NON ha Authorization header con anon key (riga 29-31)
- ✅ Gestisce correttamente token_hash, token, code
- ✅ Redirect corretto dopo autenticazione

**Conclusione:** Nessun problema.

---

## 📊 **2. ANALISI FLUSSO AUTENTICAZIONE**

### **2.1 Auth Context (lib/auth-context.tsx)**

**Status:** ✅ **CORRETTO**

**Analisi:**
- ✅ `getSession()` con error handling (righe 30-50)
- ✅ `onAuthStateChange()` gestisce tutti gli eventi (righe 54-78)
- ✅ Cleanup corretto subscription (righe 90-98)
- ✅ `signOut()` pulisce stato (righe 101-105)

**Conclusione:** Nessun problema.

---

### **2.2 Player ID Context (lib/playerIdContext.tsx)**

**Status:** ⚠️ **POTENZIALE PROBLEMA**

**Analisi:**
- ✅ Carica player ID da database quando user è presente (righe 42-102)
- ✅ Gestisce errori correttamente (righe 67-73)
- ⚠️ **PROBLEMA:** Query fallisce con 401/403 perché Authorization header contiene anon key (da lib/supabase.ts)
- ✅ `setPlayerId()` aggiorna solo state locale (righe 105-119)
- ✅ `setVerified()` aggiorna solo state locale (righe 122-135)

**Conclusione:** Logica corretta, ma fallisce per Authorization header bug.

---

### **2.3 Settings Page (app/dashboard/settings/page.tsx)**

**Status:** ✅ **CORRETTO** (ma fallisce per Authorization bug)

**Analisi:**
- ✅ Usa `PlayerIdContext` per caricare player ID (riga 18)
- ✅ Sincronizza input con `playerId` dal context (righe 64-70)
- ✅ `handleSave()` salva direttamente con client Supabase (righe 95-101)
- ⚠️ **PROBLEMA:** Query fallisce con 401/403 perché Authorization header contiene anon key
- ✅ Gestione errori corretta (righe 103-124)
- ✅ "Rimuovi Player ID" salva nel database (righe 271-274)

**Conclusione:** Logica corretta, ma fallisce per Authorization header bug.

---

## 📊 **3. ANALISI SERVER ACTIONS**

### **3.1 save-player-id.ts (app/actions/save-player-id.ts)**

**Status:** ⚠️ **NON USATO MA PRESENTE**

**Analisi:**
- ⚠️ File presente ma NON usato in `app/dashboard/settings/page.tsx`
- ⚠️ Potrebbe causare confusione
- ✅ Logica corretta (usa accessToken se fornito)
- ⚠️ **PROBLEMA:** Se usato, Authorization header con accessToken è OK, ma non viene usato

**Conclusione:** File non usato, potrebbe essere rimosso o mantenuto per futuro uso.

---

## 📊 **4. ANALISI DATABASE SUPABASE**

### **4.1 RLS Policies**

**Status:** ✅ **CORRETTE**

**Policies verificate:**
```sql
✅ SELECT: "Users can view own profile" - auth.uid() = id
✅ UPDATE: "Users can update own profile" - auth.uid() = id
✅ INSERT: "Users can insert own profile" - auth.uid() = id
```

**RLS Abilitato:**
```sql
✅ users: rowsecurity = true
✅ match_analyses: rowsecurity = true
```

**Conclusione:** Policies e RLS sono CORRETTI. Il problema NON è nel database.

---

### **4.2 Schema Database**

**Status:** ✅ **CORRETTO**

**Tabella users:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `email` TEXT NOT NULL
- ✅ `dota_account_id` BIGINT NULL
- ✅ `dota_account_verified_at` TIMESTAMPTZ NULL
- ✅ `dota_verification_method` TEXT NULL
- ✅ `created_at` TIMESTAMPTZ
- ✅ `updated_at` TIMESTAMPTZ

**Conclusione:** Schema corretto.

---

## 📊 **5. ANALISI FLUSSO COMPLETO**

### **5.1 Flusso Login → Caricamento Player ID**

**Step 1: Login**
- ✅ User fa login → `AuthContext` carica sessione
- ✅ `session.access_token` salvato in `localStorage` (`sb-auth-token`)

**Step 2: Caricamento Player ID**
- ✅ `PlayerIdContext` si attiva quando `user` è presente
- ✅ Query: `supabase.from('users').select('dota_account_id').eq('id', user.id).single()`
- ❌ **PROBLEMA:** Query fallisce perché:
  - `lib/supabase.ts` riga 91: `Authorization: Bearer ${anonKey}`
  - Supabase riceve anon key invece di JWT utente
  - `auth.uid()` = null
  - RLS policy: `auth.uid() = id` → `null = "xxx"` → FALSE
  - Risultato: **403 Forbidden**

**Conclusione:** Flusso corretto, ma fallisce per Authorization header bug.

---

### **5.2 Flusso Salvataggio Player ID**

**Step 1: User inserisce ID**
- ✅ Input sincronizzato con `playerId` dal context
- ✅ Validazione numero (righe 85-92)

**Step 2: Salvataggio**
- ✅ Query: `supabase.from('users').update({ dota_account_id }).eq('id', user.id)`
- ❌ **PROBLEMA:** Query fallisce perché:
  - `lib/supabase.ts` riga 91: `Authorization: Bearer ${anonKey}`
  - Supabase riceve anon key invece di JWT utente
  - `auth.uid()` = null
  - RLS policy: `auth.uid() = id` → `null = "xxx"` → FALSE
  - Risultato: **403 Forbidden**

**Conclusione:** Flusso corretto, ma fallisce per Authorization header bug.

---

## 📊 **6. PROBLEMI IDENTIFICATI**

### **🔴 PROBLEMA CRITICO #1: Authorization Header con Anon Key**

**File:** `lib/supabase.ts` riga 91

**Codice:**
```typescript
'Authorization': `Bearer ${supabaseAnonKey}`, // Fallback per compatibilità
```

**Impatto:**
- ❌ Tutte le query a Supabase falliscono con 401/403
- ❌ `PlayerIdContext` non può caricare player ID
- ❌ `SettingsPage` non può salvare player ID
- ❌ RLS policies falliscono perché `auth.uid()` = null

**Fix Richiesto:**
```typescript
// RIMUOVERE questa riga:
'Authorization': `Bearer ${supabaseAnonKey}`,

// Lasciare solo:
'apikey': supabaseAnonKey,
```

**Priorità:** 🔴 **CRITICA**

---

### **⚠️ PROBLEMA MINORE #1: Server Action Non Usato**

**File:** `app/actions/save-player-id.ts`

**Problema:**
- File presente ma NON usato
- Potrebbe causare confusione
- Logica corretta ma non utilizzata

**Opzioni:**
1. Rimuovere file (se non serve)
2. Mantenere per futuro uso (documentare che non è usato)

**Priorità:** ⚠️ **BASSA**

---

## 📊 **7. VERIFICA COERENZA**

### **7.1 Configurazione Supabase Client**

**Client-side (`lib/supabase.ts`):**
- ❌ Authorization header con anon key (SBAGLIATO)
- ✅ Configurazione auth corretta
- ✅ Singleton pattern corretto

**Server-side (`lib/supabase-server.ts`):**
- ✅ Nessun Authorization header con anon key (CORRETTO)
- ✅ Usa cookie header (CORRETTO)

**Auth Callback (`app/auth/callback/route.ts`):**
- ✅ Nessun Authorization header con anon key (CORRETTO)

**Conclusione:** Inconsistenza tra client-side e server-side.

---

### **7.2 Flusso Dati Player ID**

**Caricamento:**
- ✅ `PlayerIdContext` carica da database
- ✅ `SettingsPage` usa `playerId` dal context
- ❌ Fallisce per Authorization header bug

**Salvataggio:**
- ✅ `SettingsPage` salva direttamente con client Supabase
- ✅ Aggiorna `PlayerIdContext` dopo salvataggio
- ❌ Fallisce per Authorization header bug

**Conclusione:** Flusso corretto, ma fallisce per Authorization header bug.

---

## 📊 **8. CHECKLIST COMPLETA**

### **Configurazione**
- [x] RLS policies corrette (✅ verificato)
- [x] Schema database corretto (✅ verificato)
- [x] Auth context corretto (✅ verificato)
- [ ] Authorization header corretto (❌ DA FIXARE)

### **Flussi**
- [x] Login funziona (✅ verificato)
- [ ] Caricamento Player ID funziona (❌ fallisce per Authorization bug)
- [ ] Salvataggio Player ID funziona (❌ fallisce per Authorization bug)

### **Codice**
- [x] `lib/supabase-server.ts` corretto (✅ verificato)
- [x] `app/auth/callback/route.ts` corretto (✅ verificato)
- [x] `lib/auth-context.tsx` corretto (✅ verificato)
- [x] `lib/playerIdContext.tsx` corretto (✅ verificato)
- [x] `app/dashboard/settings/page.tsx` corretto (✅ verificato)
- [ ] `lib/supabase.ts` corretto (❌ DA FIXARE - riga 91)

---

## 🎯 **RIEPILOGO PROBLEMI**

### **🔴 CRITICI (Bloccanti)**
1. **lib/supabase.ts riga 91:** Authorization header con anon key
   - **Impatto:** Tutte le query falliscono con 401/403
   - **Fix:** Rimuovere riga 91

### **⚠️ MINORI (Non Bloccanti)**
1. **app/actions/save-player-id.ts:** File non usato
   - **Impatto:** Nessuno (file non usato)
   - **Fix:** Rimuovere o documentare

---

## ✅ **SOLUZIONE PROPOSTA**

### **Fix 1: Rimuovere Authorization Header con Anon Key**

**File:** `lib/supabase.ts` riga 91

**Prima:**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ RIMUOVERE
  },
},
```

**Dopo:**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ✅ OK - identifica progetto
    // NOTA: Supabase gestisce automaticamente Authorization con session.access_token
  },
},
```

### **Fix 2: Rimuovere Server Action Non Usato (Opzionale)**

**File:** `app/actions/save-player-id.ts`

**Opzione A:** Rimuovere file (se non serve)
**Opzione B:** Mantenere e documentare che non è usato

---

## 📋 **VERIFICA POST-FIX**

**Dopo aver applicato Fix 1:**

1. ✅ Hard refresh browser
2. ✅ Logout e login di nuovo
3. ✅ Vai su `/dashboard/settings`
4. ✅ Prova a salvare Player ID
5. ✅ Verifica console: NESSUN errore 401/403
6. ✅ Verifica che Player ID venga salvato/recuperato correttamente

---

## 🎯 **CONCLUSIONE**

**Problema Root Identificato:**
- 🔴 **UN SOLO PROBLEMA CRITICO:** `lib/supabase.ts` riga 91 - Authorization header con anon key

**Tutto il resto è CORRETTO:**
- ✅ RLS policies
- ✅ Schema database
- ✅ Flussi di autenticazione
- ✅ Logica di caricamento/salvataggio
- ✅ Gestione errori
- ✅ Configurazione auth

**Fix Richiesto:**
- Rimuovere 1 riga da `lib/supabase.ts` (riga 91)

**Stato:** ⏳ **IN ATTESA VIA PER APPLICARE FIX**

