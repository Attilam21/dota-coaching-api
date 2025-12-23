# 🔍 Analisi Completa Flusso Player ID - Riga per Riga

**Data:** Analisi completa del flusso di salvataggio/recupero Player ID  
**Problema:** Errori 401 Unauthorized e 403 Forbidden

---

## 📊 **ANALISI RLS POLICIES (Supabase)**

**Policies verificate:**
```sql
✅ SELECT: "Users can view own profile" - auth.uid() = id
✅ UPDATE: "Users can update own profile" - auth.uid() = id  
✅ INSERT: "Users can insert own profile" - auth.uid() = id
```

**Conclusione:** Le policies sono **CORRETTE**. Il problema NON è nelle policies.

---

## 🔴 **PROBLEMA IDENTIFICATO: lib/supabase.ts Riga 91**

### **Codice Attuale (SBAGLIATO):**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ✅ OK
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ PROBLEMA CRITICO
  },
},
```

### **Perché è SBAGLIATO:**
1. `Authorization: Bearer ${anonKey}` sovrascrive il JWT utente
2. Quando Supabase riceve anon key invece del JWT:
   - `auth.uid()` restituisce `null` (anon key non ha claim `sub`)
   - RLS policies falliscono: `auth.uid() = id` → `null = "xxx"` → **FALSE**
   - Risultato: **403 Forbidden** o **401 Unauthorized**

### **Fix Richiesto:**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ✅ OK - identifica progetto
    // ❌ RIMUOVERE Authorization - Supabase lo gestisce automaticamente
  },
},
```

---

## 🔄 **FLUSSO COMPLETO ANALIZZATO**

### **1. Login Utente**
**File:** `lib/auth-context.tsx`
- ✅ `supabase.auth.getSession()` → carica sessione
- ✅ `onAuthStateChange()` → ascolta cambiamenti
- ✅ `session.access_token` (JWT utente) salvato in `localStorage`

### **2. Caricamento Player ID**
**File:** `lib/playerIdContext.tsx` (righe 42-102)
- ✅ `useEffect` si attiva quando `user` è presente
- ✅ Query: `supabase.from('users').select('dota_account_id').eq('id', user.id).single()`
- ❌ **PROBLEMA:** Query fallisce con 401/403 perché Authorization header contiene anon key

**Flusso:**
```
User presente → useEffect attivato → Query a Supabase
→ Authorization header contiene anon key (riga 91 lib/supabase.ts)
→ Supabase riceve anon key invece di JWT utente
→ auth.uid() = null
→ RLS policy: auth.uid() = id → null = "xxx" → FALSE
→ 403 Forbidden
```

### **3. Salvataggio Player ID**
**File:** `app/dashboard/settings/page.tsx` (righe 72-147)
- ✅ `handleSave()` → valida input
- ✅ Query: `supabase.from('users').update({ dota_account_id }).eq('id', user.id)`
- ❌ **PROBLEMA:** Query fallisce con 401/403 perché Authorization header contiene anon key

**Flusso:**
```
User clicca "Salva" → handleSave() → Query UPDATE a Supabase
→ Authorization header contiene anon key (riga 91 lib/supabase.ts)
→ Supabase riceve anon key invece di JWT utente
→ auth.uid() = null
→ RLS policy: auth.uid() = id → null = "xxx" → FALSE
→ 403 Forbidden
```

---

## ✅ **SOLUZIONE**

### **Fix 1: Rimuovere Authorization header con anon key**
**File:** `lib/supabase.ts` riga 91

**Prima:**
```typescript
'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ RIMUOVERE
```

**Dopo:**
```typescript
// NOTA: Supabase gestisce automaticamente Authorization con session.access_token
// quando presente. NON impostare Authorization con anon key.
```

### **Fix 2: Verificare che Supabase gestisca automaticamente Authorization**

**Come funziona Supabase client:**
1. Quando crei client: `createClient(url, anonKey)` → `apikey` header impostato
2. Quando utente è autenticato: Supabase aggiunge automaticamente `Authorization: Bearer ${session.access_token}`
3. I global headers vengono **aggiunti**, ma Supabase **sovrascrive** Authorization se c'è una sessione

**PROBLEMA:** Se imposti manualmente `Authorization: Bearer ${anonKey}` nei global headers, questo **sovrascrive** il JWT utente anche quando c'è una sessione.

---

## 🎯 **VERIFICA POST-FIX**

**Dopo aver rimosso Authorization header:**

1. **Flusso Login:**
   - ✅ User fa login → `session.access_token` salvato
   - ✅ Supabase client usa automaticamente `Authorization: Bearer ${session.access_token}`

2. **Flusso Caricamento Player ID:**
   - ✅ `PlayerIdContext` fa query → Authorization contiene JWT utente
   - ✅ `auth.uid()` estrae correttamente user_id
   - ✅ RLS policy: `auth.uid() = id` → **TRUE**
   - ✅ Query funziona

3. **Flusso Salvataggio Player ID:**
   - ✅ `SettingsPage` fa UPDATE → Authorization contiene JWT utente
   - ✅ `auth.uid()` estrae correttamente user_id
   - ✅ RLS policy: `auth.uid() = id` → **TRUE**
   - ✅ UPDATE funziona

---

## 📋 **CHECKLIST VERIFICA**

- [ ] RLS policies corrette (✅ verificato - sono corrette)
- [ ] Authorization header NON contiene anon key (❌ DA FIXARE - riga 91)
- [ ] Supabase client gestisce automaticamente Authorization (✅ configurato correttamente)
- [ ] `persistSession: true` configurato (✅ verificato - riga 82)
- [ ] `autoRefreshToken: true` configurato (✅ verificato - riga 83)

---

## 🚨 **AZIONE RICHIESTA**

**Rimuovere riga 91 da `lib/supabase.ts`:**
```typescript
'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ RIMUOVERE QUESTA RIGA
```

**Stato:** 🔴 **PROBLEMA CRITICO IDENTIFICATO - FIX RICHIESTO**

