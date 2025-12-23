# 🧪 Test Configurazione Supabase

## ✅ **VERIFICA CHIAVI**

### Chiavi Verificate (via MCP):
- ✅ **URL**: `https://yzfjtrteezvyoudpfccb.supabase.co`
- ✅ **Anon Key (Legacy)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (presente)
- ✅ **Publishable Key**: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSUc8` (presente)

### Verifica Environment Variables Locali:

Apri `.env.local` e verifica:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE**: Usa la **anon key (legacy)**, NON la publishable key!

---

## 🔍 **TEST SESSIONE**

### 1. Test Console Browser

Apri console browser (F12) e esegui:

```javascript
// Test 1: Verifica client Supabase
import { supabase, verifySession } from '@/lib/supabase'

// Test sessione
const result = await verifySession()
console.log('Session test:', result)

// Test query
const { data, error } = await supabase
  .from('users')
  .select('id, email, dota_account_id')
  .eq('id', (await supabase.auth.getUser()).data.user?.id)
  .single()

console.log('Query test:', { data, error })
```

### 2. Test Manuale

1. **Apri `/dashboard/settings`**
2. **Apri Console (F12)**
3. **Cerca questi log**:
   - `[Supabase] Auth state changed: SIGNED_IN`
   - `[verifySession] Session valid: { userId: "...", email: "..." }`
   - `[Settings] Saving with session: { userId: "...", hasAccessToken: true }`

4. **Se NON vedi questi log**:
   - La sessione NON è valida
   - Fai logout e login di nuovo
   - Verifica cookies nel browser (Application → Cookies → cerca `sb-`)

---

## 🐛 **DEBUG PROBLEMI**

### Problema: "Errore di permessi. Verifica di essere loggato correttamente."

**Causa**: Sessione non valida o Authorization header sovrascrive JWT

**Soluzione**:
1. Verifica che `lib/supabase.ts` NON abbia `Authorization: Bearer ${supabaseAnonKey}`
2. Hard refresh: `Ctrl + Shift + R`
3. Logout e login di nuovo
4. Verifica console per log `[verifySession]`

### Problema: "Sessione non valida"

**Causa**: Token scaduto o non presente

**Soluzione**:
1. Fai logout completo
2. Pulisci cookies: Application → Cookies → elimina tutti i `sb-*`
3. Login di nuovo
4. Verifica che `localStorage.getItem('sb-auth-token')` non sia null

### Problema: "403 Forbidden"

**Causa**: Authorization header con anon key sovrascrive JWT

**Verifica**:
1. Apri Network tab (F12)
2. Trova richiesta a Supabase (es: `rest/v1/users`)
3. Controlla Headers:
   - ✅ `apikey: eyJhbGci...` (deve essere presente)
   - ✅ `Authorization: Bearer eyJhbGci...` (deve essere JWT utente, NON anon key)
   - ❌ Se `Authorization` contiene anon key → PROBLEMA!

---

## ✅ **CHECKLIST COMPLETA**

- [ ] Environment variables configurate correttamente
- [ ] `lib/supabase.ts` NON ha `Authorization: Bearer ${supabaseAnonKey}`
- [ ] Hard refresh fatto (`Ctrl + Shift + R`)
- [ ] Logout e login fatto
- [ ] Console mostra log `[verifySession] Session valid`
- [ ] Network tab mostra `Authorization` con JWT utente (non anon key)
- [ ] Query a `users` table funziona
- [ ] Salvataggio Player ID funziona

---

## 🔧 **SE NIENTE FUNZIONA**

1. **Verifica RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
   Dovrebbero esserci 3 policies (SELECT, UPDATE, INSERT)

2. **Test diretto in Supabase SQL Editor**:
   ```sql
   SELECT id, email, dota_account_id 
   FROM public.users 
   WHERE id = auth.uid();
   ```
   Se funziona qui ma non nell'app → problema client

3. **Verifica log Supabase**:
   - Vai su Supabase Dashboard → Logs → API Logs
   - Cerca errori 403 o 401
   - Verifica che `auth.uid()` non sia NULL

4. **Reset completo**:
   - Logout
   - Pulisci localStorage: `localStorage.clear()`
   - Pulisci cookies
   - Login di nuovo
   - Hard refresh

---

**Status**: ✅ Fix applicato - Pronto per test

