# ✅ Fix Authorization Header - CONFERMATO DAI LOG

**Data:** Fix applicato dopo analisi log Supabase  
**Status:** ✅ **FIX APPLICATO**

---

## 🔴 **PROBLEMA CONFERMATO DAI LOG**

### **Log Supabase Mostrano:**
- **403 Forbidden** per tutte le richieste a `/rest/v1/users` (decine di errori)
- **401 Unauthorized** per alcune richieste
- Login funziona (`POST /auth/v1/token` → 200)
- Ma subito dopo, le query a `users` falliscono con 403/401

### **Causa Root:**
- `Authorization: Bearer ${supabaseAnonKey}` nei global headers sovrascrive il JWT utente
- Supabase server riceve anon key invece del token utente
- `auth.uid()` restituisce `null` (non può estrarre user_id da anon key)
- RLS policies bloccano: `auth.uid() = id` → `null = "xxx"` → **FALSE**

---

## ✅ **FIX APPLICATO**

**File:** `lib/supabase.ts` riga 91

**Prima:**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ PROBLEMA
  },
},
```

**Dopo:**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    // NOTA: NON impostare Authorization qui - Supabase lo gestisce automaticamente
    // con il token dell'utente quando presente (session.access_token)
  },
},
```

---

## 🎯 **RISULTATO ATTESO**

**Dopo il fix:**
1. ✅ Supabase userà automaticamente `session.access_token` (JWT utente)
2. ✅ `auth.uid()` estrae correttamente user_id dal JWT
3. ✅ RLS policies permettono accesso: `auth.uid() = id` → **TRUE**
4. ✅ Nessun errore 403/401
5. ✅ Salvataggio Player ID funziona

---

## 📊 **VERIFICA POST-FIX**

**Test da fare:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Logout e login di nuovo
3. Prova a salvare Player ID
4. Verifica che non ci siano più errori 403/401 nei log Supabase

---

**Stato:** ✅ **FIX APPLICATO - IN ATTESA TEST**

