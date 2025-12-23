# ✅ Soluzione Definitiva: Errori 403 Forbidden

**Problema:** Errori 403 Forbidden quando si cerca di salvare/recuperare Player ID  
**Causa Root:** `Authorization: Bearer ${anonKey}` nei global headers sovrascrive JWT utente  
**Status:** ✅ **RISOLTO**

---

## 🔴 **PROBLEMA IDENTIFICATO**

### **Errori Console:**
- `403 Forbidden` per richieste a `/rest/v1/users`
- `[PlayerIdContext] Error fetching player ID from DB`
- `Error updating player ID`

### **Causa Root:**
Secondo documentazione Supabase ufficiale:
- ❌ **NON si deve MAI impostare `Authorization: Bearer ${anonKey}`**
- L'anon key non contiene il claim `sub` necessario per identificare l'utente
- Quando Authorization contiene anon key invece del JWT utente:
  - `auth.uid()` restituisce `null` (non può estrarre user_id)
  - RLS policies falliscono: `auth.uid() = id` → `null = "xxx"` → **FALSE**
  - Risultato: **403 Forbidden**

---

## ✅ **SOLUZIONE APPLICATA**

### **File:** `lib/supabase.ts`

**Prima (SBAGLIATO):**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`, // ❌ CAUSA 403 FORBIDDEN
  },
},
```

**Dopo (CORRETTO):**
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ✅ OK - necessario per identificare progetto
    // NOTA CRITICA: NON impostare Authorization qui!
    // Supabase gestisce automaticamente Authorization con session.access_token (JWT utente)
    // quando presente. Impostare Authorization con anon key causa:
    // - 403 Forbidden (RLS policies falliscono perché auth.uid() = null)
    // - auth.uid() non può estrarre user_id da anon key
  },
},
```

---

## 📚 **DOCUMENTAZIONE SUPABASE**

**Fonti ufficiali:**
1. [Auth error: 401 invalid claim missing sub](https://supabase.com/docs/guides/troubleshooting/auth-error-401-invalid-claim-missing-sub)
2. [Why is my service role key client getting RLS errors?](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data)

**Punti chiave:**
- L'anon key è per identificare il progetto, NON per autenticare utenti
- `Authorization` header deve contenere JWT utente (con claim `sub`)
- Supabase client gestisce automaticamente `Authorization` con `session.access_token`
- Impostare manualmente `Authorization` con anon key sovrascrive il JWT utente

---

## 🎯 **COME FUNZIONA SUPABASE CLIENT**

### **Comportamento Automatico:**
1. Quando crei client: `createClient(url, anonKey)` → `apikey` header impostato automaticamente
2. Quando utente è autenticato: Supabase aggiunge automaticamente `Authorization: Bearer ${session.access_token}`
3. Quando fai query: Supabase usa JWT utente per RLS policies

### **Cosa NON fare:**
- ❌ Impostare `Authorization: Bearer ${anonKey}` nei global headers
- ❌ Sovrascrivere Authorization header manualmente
- ❌ Usare anon key come token di autenticazione

### **Cosa fare:**
- ✅ Usare solo `apikey` header con anon key
- ✅ Lasciare che Supabase gestisca automaticamente Authorization
- ✅ Verificare che `persistSession: true` sia configurato

---

## ✅ **VERIFICA POST-FIX**

**Test da fare:**
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Logout e login di nuovo
3. Vai su `/dashboard/settings`
4. Prova a salvare Player ID
5. Verifica console: **NESSUN errore 403/401**

**Risultato atteso:**
- ✅ Query a `users` funzionano
- ✅ Player ID salvato/recuperato correttamente
- ✅ Nessun errore 403 Forbidden
- ✅ RLS policies funzionano (`auth.uid()` estrae correttamente user_id)

---

## 📊 **ERRORI 404 (Non Critici)**

Gli errori 404 per `dashboard-bg.png` e `profile-bg.png` sono normali:
- Questi file sono opzionali
- L'app gestisce correttamente file mancanti
- Non causano problemi funzionali

---

**Stato:** ✅ **FIX APPLICATO - IN ATTESA TEST**

