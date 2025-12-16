# 🔍 Test e Verifica Flusso - Player ID Persistence

**Data**: Gennaio 2025  
**Obiettivo**: Verificare che il flusso Login → Dashboard → Settings Update → Dashboard Refresh funzioni correttamente

---

## 📍 DOVE VIENE LETTA LA TABELLA `public.users` E `dota_account_id`

### 1. **`lib/usePlayerId.ts`** (Hook per leggere Player ID da Supabase)

**Riga 22-25**:
```typescript
const { data, error: fetchError } = await supabase
  .from('users')
  .select('dota_account_id')
  .eq('id', user.id)
  .single()
```

**Query SQL generata**:
```sql
SELECT dota_account_id 
FROM public.users 
WHERE id = $1  -- user.id (UUID da auth.users)
LIMIT 1
```

**Quando viene chiamato**:
- Hook `usePlayerId()` viene usato da componenti (MA ora le pagine dashboard usano `usePlayerIdContext` invece)
- Si attiva quando `user` cambia (da `useAuth()`)

---

### 2. **`app/dashboard/settings/page.tsx`** (Settings Page - Lettura e Scrittura)

**LETTURA (riga 33-37)**:
```typescript
const { data, error } = await supabase
  .from('users')
  .select('dota_account_id')
  .eq('id', user.id)
  .single()
```

**SCRITTURA (riga 84-87)**:
```typescript
const { error } = await supabase
  .from('users')
  .update({ dota_account_id: accountIdValue })
  .eq('id', user.id)
```

**Query SQL UPDATE generata**:
```sql
UPDATE public.users 
SET dota_account_id = $1  -- accountIdValue (BIGINT o NULL)
WHERE id = $2  -- user.id (UUID da auth.users)
```

---

## 🔍 VERIFICA SCHEMA E MATCHING

### Schema Tabella `public.users` (da `supabase/schema.sql`):

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dota_account_id BIGINT UNIQUE,
  ...
);
```

### Verifica Matching:

✅ **Colonna `id`**: 
- Schema: `id UUID` (FK a `auth.users(id)`)
- Query: `.eq('id', user.id)` dove `user.id` è UUID da `auth.users`
- **MATCHING CORRETTO** ✅

✅ **Colonna `dota_account_id`**: 
- Schema: `dota_account_id BIGINT UNIQUE`
- Query: `.select('dota_account_id')` e `.update({ dota_account_id: ... })`
- **MATCHING CORRETTO** ✅

✅ **Tabella**: 
- Schema: `public.users`
- Query: `.from('users')` (default schema è `public`)
- **MATCHING CORRETTO** ✅

---

## 📊 COME LOGGARE IN CONSOLE

### Frontend (Client Components)

#### 1. **Log in `lib/usePlayerId.ts`**

**Aggiungi dopo riga 25**:
```typescript
const { data, error: fetchError } = await supabase
  .from('users')
  .select('dota_account_id')
  .eq('id', user.id)
  .single()

// LOG AGGIUNTO:
console.log('[usePlayerId] Auth user.id:', user.id)
console.log('[usePlayerId] Query result:', { data, error: fetchError })
console.log('[usePlayerId] Extracted dota_account_id:', data?.dota_account_id)
```

#### 2. **Log in `app/dashboard/settings/page.tsx`**

**Dopo riga 36 (SELECT)**:
```typescript
const { data, error } = await supabase
  .from('users')
  .select('dota_account_id')
  .eq('id', user.id)
  .single()

// LOG AGGIUNTO:
console.log('[Settings] Auth user.id:', user.id)
console.log('[Settings] SELECT query result:', { data, error })
console.log('[Settings] dota_account_id from DB:', data?.dota_account_id)
```

**Dopo riga 87 (UPDATE)**:
```typescript
const { error } = await supabase
  .from('users')
  .update({ dota_account_id: accountIdValue })
  .eq('id', user.id)

// LOG AGGIUNTO:
console.log('[Settings] UPDATE query:', {
  user_id: user.id,
  dota_account_id: accountIdValue,
  error
})
```

#### 3. **Log in `lib/auth-context.tsx` (per verificare Auth user)**

**Nella funzione `AuthProvider`, dopo `setUser(session?.user ?? null)`**:
```typescript
setUser(session?.user ?? null)
console.log('[AuthContext] User updated:', {
  id: session?.user?.id,
  email: session?.user?.email,
  hasSession: !!session
})
```

#### 4. **Log in `lib/playerIdContext.tsx` (per verificare localStorage)**

**Dopo riga 31 (load da localStorage)**:
```typescript
const saved = localStorage.getItem(PLAYER_ID_KEY)
if (saved) {
  setPlayerIdState(saved)
}
console.log('[PlayerIdContext] Loaded from localStorage:', saved)
```

**Dopo riga 45 (save in localStorage)**:
```typescript
localStorage.setItem(PLAYER_ID_KEY, trimmedId)
console.log('[PlayerIdContext] Saved to localStorage:', trimmedId)
```

---

### Server Routes (API Routes)

**Nessuna API route legge direttamente `users.dota_account_id`** al momento. Le API routes usano solo OpenDota API.

Se in futuro aggiungi route che leggono `users`, logga così:

```typescript
// In una API route (es. app/api/user/profile/route.ts)
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Estrai user ID da header o token
  const authHeader = request.headers.get('authorization')
  // ... verifica auth ...
  
  const { data, error } = await supabase
    .from('users')
    .select('dota_account_id')
    .eq('id', userId)
    .single()

  // LOG SERVER:
  console.log('[API Route] Query users:', {
    userId,
    data,
    error: error?.message
  })

  return NextResponse.json({ data, error })
}
```

---

## 🧪 3 TEST MANUALI STEP-BY-STEP

### TEST 1: Login → Dashboard (Prima volta, nessun Player ID salvato)

**Obiettivo**: Verificare che dopo il login, se non c'è `dota_account_id` in DB, l'utente vede il form di input.

**Step-by-step**:

1. **Logout (se già loggato)**
   - Vai a `/dashboard` → dovrebbe redirectare a `/auth/login`
   - Oppure clicca logout nel sidebar

2. **Login**
   - Vai a `/auth/login`
   - Inserisci email e password valide
   - Clicca "Sign in"
   - ✅ Dovresti essere redirectato a `/dashboard`

3. **Verifica Console Logs (F12 → Console)**
   - Cerca: `[AuthContext] User updated:` → dovrebbe mostrare `id` e `email`
   - Cerca: `[PlayerIdContext] Loaded from localStorage:` → probabilmente `null` (prima volta)
   - ✅ Verifica che `user.id` sia un UUID valido

4. **Verifica Dashboard**
   - ✅ Dovresti vedere il form "Inserisci Player ID" (blu, centrato)
   - ✅ NON dovresti vedere statistiche ancora

5. **Verifica Network Tab (F12 → Network)**
   - Filtra per "Fetch/XHR"
   - ✅ NON dovresti vedere chiamate a `/api/player/[id]/stats` (perché non c'è player ID)

**Risultato Atteso**: ✅ Dashboard mostra form input, nessun dato caricato.

---

### TEST 2: Inserimento Player ID → Navigazione tra Sezioni

**Obiettivo**: Verificare che dopo aver inserito Player ID, persiste durante la navigazione.

**Step-by-step**:

1. **Inserisci Player ID**
   - In Dashboard, inserisci un Player ID valido (es. `1903287666`)
   - Clicca "Carica"
   - ✅ Dovresti vedere statistiche caricate

2. **Verifica Console Logs**
   - Cerca: `[PlayerIdContext] Saved to localStorage:` → dovrebbe mostrare il Player ID inserito
   - ✅ Verifica che localStorage contenga `fzth_player_id`

3. **Verifica Network Tab**
   - ✅ Dovresti vedere chiamata a `/api/player/1903287666/stats`
   - ✅ Response dovrebbe contenere `matches` e `stats`

4. **Naviga tra sezioni (SENZA refresh pagina)**
   - Clicca su "Performance & Stile di Gioco" nel sidebar
   - ✅ NON dovrebbe chiedere Player ID di nuovo
   - ✅ Dovrebbe caricare dati immediatamente
   
   - Clicca su "Hero Pool"
   - ✅ NON dovrebbe chiedere Player ID di nuovo
   - ✅ Dovrebbe caricare dati immediatamente

   - Clicca su "Team & Compagni"
   - ✅ NON dovrebbe chiedere Player ID di nuovo
   - ✅ Dovrebbe caricare dati immediatamente

   - Torna a "Panoramica" (Dashboard)
   - ✅ Dovrebbe mostrare dati senza richiedere Player ID

5. **Verifica localStorage (F12 → Application → Local Storage)**
   - Cerca chiave `fzth_player_id`
   - ✅ Dovrebbe contenere il Player ID inserito

**Risultato Atteso**: ✅ Player ID persiste durante navigazione, nessun input duplicato.

---

### TEST 3: Settings Update → Dashboard Refresh

**Obiettivo**: Verificare che quando salvi Player ID in Settings, dopo refresh della pagina il valore viene caricato correttamente.

**Step-by-step**:

1. **Pulisci localStorage (opzionale, per test pulito)**
   - F12 → Application → Local Storage
   - Elimina chiave `fzth_player_id`
   - Refresh pagina

2. **Vai a Settings**
   - Clicca su "Profilo Utente" nel sidebar
   - ✅ Dovresti vedere la pagina Settings

3. **Verifica Console Logs (Settings load)**
   - Cerca: `[Settings] Auth user.id:` → UUID dell'utente
   - Cerca: `[Settings] SELECT query result:` → dovrebbe mostrare `data` e `error`
   - ✅ Se non c'è `dota_account_id` in DB, `data` sarà `null` o `undefined`

4. **Inserisci Player ID in Settings**
   - Inserisci un Player ID valido (es. `86745912`)
   - Clicca "Salva Impostazioni"
   - ✅ Dovresti vedere messaggio "Impostazioni salvate con successo!"

5. **Verifica Console Logs (Settings save)**
   - Cerca: `[Settings] UPDATE query:` → dovrebbe mostrare:
     - `user_id`: UUID corretto
     - `dota_account_id`: il numero inserito
     - `error`: `null` (nessun errore)

6. **Verifica Database (opzionale - Supabase Dashboard)**
   - Vai a Supabase Dashboard → Table Editor → `users`
   - Trova il tuo record (cerca per email o id)
   - ✅ `dota_account_id` dovrebbe essere il valore inserito

7. **Refresh pagina completa (F5 o Ctrl+R)**
   - ✅ Dovresti essere ancora loggato (cookie di sessione)

8. **Verifica Dashboard dopo refresh**
   - Dovrebbe redirectare a `/dashboard`
   - ✅ Dovrebbe caricare statistiche automaticamente (senza form input)
   - ✅ NON dovrebbe chiedere Player ID di nuovo

9. **Verifica Console Logs (dopo refresh)**
   - Cerca: `[PlayerIdContext] Loaded from localStorage:` → potrebbe essere `null` se non era salvato in localStorage
   - Cerca: `[usePlayerId] Query result:` → se `usePlayerId` è ancora usato da qualche componente
   - ✅ Se il nuovo `PlayerIdContext` legge da localStorage, potrebbe essere diverso dal DB

10. **POTENZIALE PROBLEMA DA VERIFICARE**:
    - Se `PlayerIdContext` legge solo da localStorage (`fzth_player_id`)
    - Ma Settings salva in Supabase (`users.dota_account_id`)
    - Dopo refresh, localStorage potrebbe essere vuoto mentre DB ha il valore
    - ✅ **VERIFICA**: Dashboard dovrebbe mostrare form input o dati?

**Risultato Atteso**: ⚠️ **DA VERIFICARE** - Potrebbe esserci disallineamento tra localStorage e DB.

---

## ⚠️ POTENZIALI PROBLEMI E MISMATCH

### Problema 1: Disallineamento localStorage ↔ Supabase

**Situazione attuale**:
- `PlayerIdContext` legge/salva solo in **localStorage** (`fzth_player_id`)
- `Settings` legge/salva solo in **Supabase** (`users.dota_account_id`)
- **Non sono sincronizzati!**

**Impatto**:
- Se inserisci Player ID in Dashboard → salvato solo in localStorage
- Se salvi Player ID in Settings → salvato solo in Supabase
- Dopo refresh, localStorage potrebbe essere vuoto, DB potrebbe avere valore
- Dashboard potrebbe chiedere Player ID anche se è salvato in DB

**Verifica**:
- Esegui TEST 3 completo
- Dopo salvare in Settings e refresh, Dashboard dovrebbe ancora mostrare form input (perché localStorage è vuoto)

---

### Problema 2: Conflitto chiavi localStorage

**Situazione attuale**:
- `PlayerIdContext` usa: `fzth_player_id` (NUOVO)
- `usePlayerIdWithManual` (se ancora usato) usa: `manual_player_id` (VECCHIO)

**Verifica**:
```bash
# Cerca se usePlayerIdWithManual è ancora importato/usato
grep -r "usePlayerIdWithManual" app/
```

**Se trovato**: Potrebbe creare conflitto se entrambi sono attivi.

---

### Problema 3: RLS Policy potrebbe bloccare UPDATE

**Situazione**:
- RLS è abilitato su `public.users`
- Policy: `"Users can update own profile"` → `USING (auth.uid() = id)`

**Verifica**:
- Se in Settings vedi errore `permission denied` o `403`, RLS sta bloccando
- Controlla che `auth.uid()` corrisponda a `user.id` nella query

**Come verificare**:
```typescript
// Aggiungi log PRIMA dell'UPDATE:
console.log('[Settings] RLS check:', {
  auth_uid: 'Will be checked by Supabase',
  user_id: user.id,
  match: 'Should match for RLS to pass'
})
```

---

## 🔧 COME VERIFICARE I LOG

### Browser Console (Frontend)

1. Apri DevTools (F12)
2. Tab "Console"
3. Filtra per:
   - `[AuthContext]` → per verificare Auth user
   - `[PlayerIdContext]` → per verificare localStorage
   - `[Settings]` → per verificare query Supabase
   - `[usePlayerId]` → se ancora usato

### Network Tab (Verificare chiamate API)

1. Tab "Network"
2. Filtra per "Fetch/XHR"
3. Cerca chiamate a:
   - `/api/player/[id]/stats` → per verificare Player ID usato
   - Supabase requests → per verificare query a `users` table

### Application Tab (Verificare localStorage)

1. Tab "Application" (o "Storage")
2. Local Storage → `http://localhost:3000` (o dominio)
3. Cerca chiave: `fzth_player_id`
4. Verifica valore salvato

### Supabase Dashboard (Verificare Database)

1. Vai a https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
2. Table Editor → `users`
3. Trova il tuo record (filtra per email o id)
4. Verifica colonna `dota_account_id`

---

## ✅ CHECKLIST VERIFICA

Prima di procedere con fix, verifica:

- [ ] `user.id` (da auth) corrisponde a `users.id` (da DB) → UUID identico?
- [ ] Query `.eq('id', user.id)` trova il record corretto?
- [ ] RLS Policy permette SELECT/UPDATE per l'utente corrente?
- [ ] `dota_account_id` viene salvato correttamente in DB (BIGINT)?
- [ ] `PlayerIdContext` e Settings sono sincronizzati o separati?
- [ ] localStorage `fzth_player_id` contiene il valore corretto?
- [ ] Dopo refresh, quale sorgente viene usata (localStorage o DB)?

---

## 📝 NOTE IMPORTANTI

**NON modificare codice ora**. Solo:
1. Aggiungi i log suggeriti
2. Esegui i 3 test
3. Documenta i risultati
4. Identifica mismatch o problemi
5. Poi procedi con fix mirato

**Priorità verifiche**:
1. Test 1 → Verifica flusso base login/dashboard
2. Test 2 → Verifica persistenza durante navigazione
3. Test 3 → Verifica sincronizzazione Settings ↔ Dashboard dopo refresh

