# 🐛 Fix Critico: Authorization Header con Anon Key

**Bug Identificato:** `Authorization: Bearer ${supabaseAnonKey}` nei global headers

---

## 🔴 **PROBLEMA CRITICO**

### **Cosa Stava Succedendo:**

```typescript
// ❌ SBAGLIATO - Causa "permission denied"
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`, // ← BUG!
  },
}
```

**Perché è un bug:**
1. Quando un utente è autenticato, Supabase deve usare il **JWT token dell'utente** (`session.access_token`) nell'header `Authorization`
2. Impostando `Authorization: Bearer ${supabaseAnonKey}` nei global headers, **sovrascriviamo** il token dell'utente
3. Le RLS policies verificano `auth.uid()` che viene estratto dal JWT token dell'utente
4. Se usiamo l'anon key invece del token dell'utente, `auth.uid()` restituisce `null`
5. Le policies falliscono → **"permission denied for table users"** (code: 42501)

---

## ✅ **SOLUZIONE**

### **Fix Implementato:**

```typescript
// ✅ CORRETTO
global: {
  headers: {
    'apikey': supabaseAnonKey, // ← OK: identifica il progetto
    // NOTA: NON impostare Authorization qui
    // Supabase lo gestisce automaticamente con il token dell'utente
  },
}
```

**Come funziona:**
1. `apikey` header identifica il progetto Supabase (sempre richiesto)
2. `Authorization` header viene gestito **automaticamente** da Supabase:
   - Quando l'utente è autenticato → usa `session.access_token` (JWT dell'utente)
   - Quando l'utente NON è autenticato → non include Authorization header
3. Le RLS policies funzionano correttamente perché `auth.uid()` può estrarre l'ID utente dal JWT

---

## 📊 **FLUSSO CORRETTO**

### **Scenario 1: Utente Autenticato**

```
1. Utente fa login → Supabase crea session con access_token
2. Client Supabase include automaticamente:
   - Header: apikey: eyJhbGci... (anon key)
   - Header: Authorization: Bearer eyJhbGci... (JWT utente)
3. RLS Policy verifica: auth.uid() = id
4. auth.uid() estrae ID utente dal JWT → ✅ Funziona!
```

### **Scenario 2: Utente NON Autenticato**

```
1. Nessuna sessione → nessun access_token
2. Client Supabase include solo:
   - Header: apikey: eyJhbGci... (anon key)
   - Header: Authorization: (non presente)
3. RLS Policy verifica: auth.uid() = id
4. auth.uid() restituisce null → ❌ Policy blocca (corretto!)
```

### **Scenario 3: Bug Precedente (Anon Key in Authorization)**

```
1. Utente fa login → Supabase crea session con access_token
2. Client Supabase include:
   - Header: apikey: eyJhbGci... (anon key) ✅
   - Header: Authorization: Bearer eyJhbGci... (anon key) ❌ BUG!
3. RLS Policy verifica: auth.uid() = id
4. auth.uid() cerca di estrarre ID dal JWT anon key → null ❌
5. Policy blocca → "permission denied" ❌
```

---

## 🔧 **FILE CORRETTI**

### **1. lib/supabase.ts** ✅
- ✅ Rimosso `Authorization: Bearer ${supabaseAnonKey}`
- ✅ Lasciato solo `apikey: supabaseAnonKey`
- ✅ Aggiunto commento esplicativo

### **2. lib/supabase-server.ts** ✅
- ✅ Rimosso `Authorization: Bearer ${supabaseAnonKey}`
- ✅ Lasciato solo `apikey: supabaseAnonKey`
- ✅ Mantenuto `cookie: cookieHeader` per passare i cookies della sessione

---

## 🎯 **RISULTATO ATTESO**

Dopo il fix:
- ✅ Utenti autenticati possono leggere/scrivere i propri dati
- ✅ RLS policies funzionano correttamente
- ✅ Nessun errore "permission denied for table users" (code: 42501)
- ✅ Player ID può essere salvato/caricato correttamente

---

## 📝 **NOTA IMPORTANTE**

**Supabase gestisce automaticamente:**
- ✅ `apikey` header (identifica il progetto)
- ✅ `Authorization` header (JWT token dell'utente quando presente)

**Non dobbiamo impostare manualmente:**
- ❌ `Authorization` header con anon key (sovrascrive il token utente)
- ❌ `Authorization` header con token utente (Supabase lo fa automaticamente)

**Dobbiamo solo:**
- ✅ Assicurarci che `apikey` sia presente (già fatto passando anon key come secondo parametro)
- ✅ Lasciare che Supabase gestisca `Authorization` automaticamente

---

**Stato:** ✅ **FIX IMPLEMENTATO**

**Prossimi passi:**
1. Test salvataggio Player ID
2. Verifica che non ci siano più errori "permission denied"
3. Verifica che le RLS policies funzionino correttamente

