# 🧪 SIMULAZIONE SALVATAGGIO PLAYER ID

## 📊 **ANALISI LOG SUPABASE**

**Pattern Errori**:
- `PATCH /rest/v1/users` → **403 Forbidden** (persistente)
- `GET /rest/v1/users` → **403 Forbidden** (persistente)
- User ID: `b243282c-14a1-47b7-8d5a-7a58823d1d2e`
- `dota_account_id` nel DB: **NULL** (non salvato)

---

## 🔍 **PROBLEMA IDENTIFICATO**

### Causa Radice

**`auth.uid()` restituisce `NULL` durante le query**, quindi:
1. RLS policy `auth.uid() = id` → **FALSE** (NULL ≠ UUID)
2. Supabase rifiuta la query → **403 Forbidden**
3. Player ID non viene salvato

### Perché `auth.uid()` è NULL?

**Possibili cause**:
1. ❌ JWT non passato nell'header `Authorization`
2. ❌ JWT non valido o scaduto
3. ❌ Sessione non caricata correttamente nel client Supabase
4. ❌ Timing issue: query eseguita prima che sessione sia pronta

---

## 🧪 **TEST CREATO**

File: `test-save-player-id.js`

**Cosa fa**:
1. Simula login per ottenere JWT
2. Testa UPDATE con JWT nell'header Authorization
3. Testa SELECT con JWT nell'header Authorization
4. Testa anche con solo anon key (simula problema attuale)

**Per eseguire**:
```bash
node test-save-player-id.js
```

---

## 🔧 **VERIFICA MANUALE**

### Test 1: Verifica JWT nell'header

Aprire **Chrome DevTools → Network**:
1. Cliccare "Salva Impostazioni"
2. Cercare richiesta `PATCH /rest/v1/users`
3. Verificare **Request Headers**:
   - ✅ `apikey`: deve essere presente
   - ✅ `Authorization`: deve contenere `Bearer <JWT>` (NON anon key!)

### Test 2: Verifica sessione nel client

Aprire **Chrome DevTools → Console**:
```javascript
// Verifica sessione
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Access Token:', session?.access_token?.substring(0, 20))
console.log('User ID:', session?.user?.id)
```

---

## 🎯 **SOLUZIONE PROPOSTA**

### Fix 1: Verificare che JWT sia passato

Modificare `app/dashboard/settings/page.tsx`:

```typescript
// PRIMA di fare UPDATE, verificare JWT
const { data: { session } } = await supabase.auth.getSession()

if (!session?.access_token) {
  // Sessione non valida
  return
}

// Forzare JWT nell'header (se necessario)
const { error } = await supabase
  .from('users')
  .update({ dota_account_id: dotaAccountIdNum })
  .eq('id', user.id)
  // Supabase dovrebbe aggiungere automaticamente Authorization
  // Ma possiamo verificare che sia presente
```

### Fix 2: Usare Server Action invece di client diretto

Creare Server Action che usa `createServerSupabaseClient` con session corretta.

---

## 📋 **PROSSIMI PASSI**

1. ✅ Eseguire `test-save-player-id.js` per vedere risposta esatta
2. ✅ Verificare header Authorization nelle richieste browser
3. ✅ Implementare fix basato sui risultati

---

**Status**: 🔴 **PROBLEMA IDENTIFICATO - TEST IN CORSO**

