# 🔍 Analisi Flusso Completo - Player Profile Salvataggio

## 📋 Riepilogo Problema
Il salvataggio in `player_profiles` non funziona sempre. A volte funziona, a volte no (intermittente).

---

## 🔄 FLUSSO COMPLETO

### 1. CREAZIONE ACCOUNT (`app/auth/signup/page.tsx`)

**Flusso:**
1. Utente inserisce email, password, opzionalmente `dota_account_id`
2. `supabase.auth.signUp()` crea utente in `auth.users`
3. **TRIGGER DB**: `on_auth_user_created` → `handle_new_user()` crea record in `public.users`
4. Se `dota_account_id` fornito:
   - Chiama `updatePlayerId()` con `access_token` e `refresh_token`
   - Salva in `public.users.dota_account_id`
   - **NON salva ancora in `player_profiles`** (viene salvato quando viene chiamata `/api/player/[id]/profile`)

**Storage:**
- ✅ Cookie Supabase: creati automaticamente da `signUp()`
- ✅ localStorage: `sb-auth-token` (sessione Supabase)
- ❌ localStorage `fzth_player_id`: NON salvato qui (solo dopo login/settings)

---

### 2. LOGIN (`app/auth/login/page.tsx`)

**Flusso:**
1. `supabase.auth.signInWithPassword()` autentica utente
2. Supabase crea sessione e salva cookie automaticamente
3. Redirect a `/dashboard`
4. `AuthProvider` (`lib/auth-context.tsx`) carica sessione:
   - `supabase.auth.getSession()` legge cookie
   - `onAuthStateChange` ascolta cambiamenti
   - Salva `user` e `session` in state React

**Storage:**
- ✅ Cookie Supabase: `sb-*` cookies (gestiti da Supabase)
- ✅ localStorage: `sb-auth-token` (sessione)
- ❌ localStorage `fzth_player_id`: NON caricato qui

**Problema Potenziale:**
- Se i cookie non vengono passati correttamente alle API routes, `userId` sarà `null` in `/api/player/[id]/profile`

---

### 3. CARICAMENTO PLAYER ID (`lib/playerIdContext.tsx`)

**Flusso:**
1. Al mount, `PlayerIdProvider` carica Player ID:
   - **PRIORITÀ 1**: localStorage `fzth_player_id` (se presente)
   - **PRIORITÀ 2**: Supabase `public.users.dota_account_id` (se localStorage vuoto e utente autenticato)
2. Se localStorage vuoto e utente autenticato:
   - Chiama `getPlayerId()` (Server Action)
   - Carica da `public.users.dota_account_id`
   - Sincronizza localStorage con valore DB
3. `setPlayerId()` aggiorna:
   - State React
   - localStorage `fzth_player_id`
   - **NON salva in Supabase** (solo lettura)

**Storage:**
- ✅ localStorage: `fzth_player_id` (sincronizzato con DB)
- ✅ DB: `public.users.dota_account_id` (fonte primaria)

**Problema Potenziale:**
- Se localStorage ha valore diverso da DB, usa localStorage (override)
- Se utente non autenticato, non carica da DB

---

### 4. CHIAMATE API - DASHBOARD (`app/dashboard/page.tsx`)

**Flusso:**
1. Dashboard carica dati quando `playerId` è disponibile
2. Chiamate API:
   - `/api/player/${playerId}/stats`
   - `/api/player/${playerId}/advanced-stats`
   - `/api/player/${playerId}/profile` ← **QUI DOVREBBE SALVARE IN `player_profiles`**
   - `/api/player/${playerId}/role-analysis`

**Problema:**
- Le chiamate API sono fetch client-side
- I cookie Supabase potrebbero non essere passati automaticamente
- Se `userId` è `null` in `/api/player/[id]/profile`, il salvataggio viene saltato

---

### 5. ANALISI PROFILE (`app/api/player/[id]/profile/route.ts`)

**Flusso:**
1. Route Handler riceve richiesta GET
2. **AUTENTICAZIONE:**
   - Usa `createRouteHandlerSupabaseClient(request)` per leggere cookie
   - `supabase.auth.getUser()` verifica utente
   - Se utente autenticato, verifica `dota_account_id`:
     - Se `dota_account_id === null`: permette cache per qualsiasi Player ID (utente sta esplorando)
     - Se `dota_account_id === playerIdNum`: permette cache solo se corrisponde
     - Altrimenti: `userId = null` → **SALTA SALVATAGGIO**
3. **CALCOLO PROFILAZIONE:**
   - Fetch `/api/player/${id}/stats`
   - Fetch `/api/player/${id}/advanced-stats`
   - Fetch OpenDota `/players/${id}`
   - Calcola metriche, role, playstyle, ecc.
4. **SALVATAGGIO CACHE:**
   - Solo se `userId !== null`
   - Verifica autenticazione prima di salvare
   - Upsert in `player_profiles` con `onConflict: 'user_id,dota_account_id'`
   - Log dettagliato per debug

**Problemi Identificati:**
1. **Cookie non passati**: Se i cookie Supabase non sono nella richiesta, `userId` sarà `null`
2. **dota_account_id mismatch**: Se utente ha `dota_account_id` diverso da `playerId` richiesto, salta salvataggio
3. **RLS Policy**: Se policy INSERT/UPDATE fallisce, upsert fallisce silenziosamente

---

### 6. CAMBIO PLAYER ID (`app/dashboard/settings/page.tsx` + `app/actions/update-player-id.ts`)

**Flusso:**
1. Utente modifica Player ID in settings
2. `handleSave()` chiama `updatePlayerId()` con:
   - `playerIdString`
   - `session.access_token` (da localStorage)
   - `session.refresh_token` (da localStorage)
3. `updatePlayerId()` (Server Action):
   - Crea client Supabase con `access_token` esplicito
   - `setSession()` per abilitare RLS
   - Verifica lock e limite cambi
   - Update `public.users.dota_account_id`
   - **INVALIDA cache vecchia**: DELETE da `player_profiles` per vecchio ID
   - Trigger PostgreSQL gestisce limite 3 cambi
4. Dopo salvataggio:
   - Aggiorna localStorage `fzth_player_id`
   - Aggiorna Context React
   - Dashboard si aggiorna automaticamente

**Storage:**
- ✅ DB: `public.users.dota_account_id` (aggiornato)
- ✅ localStorage: `fzth_player_id` (sincronizzato)
- ✅ DB: `player_profiles` (vecchio record cancellato)

**Problema Potenziale:**
- Se DELETE fallisce (policy mancante), vecchio record rimane
- Se nuovo profilo viene calcolato subito dopo, potrebbe non salvarsi se cookie non passati

---

### 7. CACHE E STORAGE

**localStorage:**
- `fzth_player_id`: Player ID corrente (sincronizzato con DB)
- `sb-auth-token`: Sessione Supabase (gestita da Supabase client)
- `last_match_id_${playerId}`: Cache ultimo match (per refresh)
- `player_data_${playerId}`: Cache dati player (per performance)
- `theme`: Preferenza tema
- `background-preference`: Preferenza sfondo
- `cookie-consent`: Consenso cookie

**Cookie (Supabase):**
- `sb-*`: Cookie di sessione Supabase (gestiti automaticamente)
- Passati automaticamente in fetch client-side
- **NON sempre passati in Route Handlers** (problema!)

**Database Cache:**
- `player_profiles`: Cache profilazione (TTL 7 giorni)
- `match_analyses`: Analisi match personalizzate

---

## 🔴 PROBLEMI IDENTIFICATI

### Problema 1: Cookie non passati alle API Routes
**Causa:**
- Fetch client-side (`fetch('/api/player/...')`) **NON passa automaticamente i cookie** in Next.js Route Handlers
- `createRouteHandlerSupabaseClient(request)` legge cookie da `request.headers.get('cookie')`
- Se cookie non presenti, `userId` sarà `null` → salvataggio saltato

**Soluzione:**
- Aggiungere `credentials: 'include'` ai fetch client-side
- Verificare che i cookie siano presenti nella richiesta

### Problema 2: dota_account_id mismatch
**Causa:**
- Se utente ha `dota_account_id` salvato diverso da `playerId` richiesto, `userId` viene impostato a `null`
- Questo previene salvataggio cache per altri Player ID (sicurezza)

**Comportamento Atteso:**
- Utente con ID salvato può esplorare altri ID, ma cache non viene salvata (corretto per sicurezza)
- Utente senza ID salvato può esplorare e cache viene salvata (corretto)

### Problema 3: RLS Policy mancante
**Causa:**
- Policy DELETE mancante (già risolto con migration)
- Se policy INSERT/UPDATE fallisce, upsert fallisce silenziosamente

**Soluzione:**
- Migration applicata: policy DELETE aggiunta
- Logging migliorato per identificare errori RLS

### Problema 4: Intermittenza
**Causa:**
- A volte cookie sono presenti, a volte no
- A volte `dota_account_id` corrisponde, a volte no
- A volte timeout VPN blocca chiamate

**Soluzione:**
- Migliorata gestione errori con `Promise.allSettled`
- Logging dettagliato per identificare pattern

---

## 🔧 SOLUZIONI PROPOSTE

### Soluzione 1: Aggiungere `credentials: 'include'` ai fetch
```typescript
fetch(`/api/player/${playerId}/profile`, {
  credentials: 'include' // Passa cookie automaticamente
})
```

### Soluzione 2: Verificare cookie nella richiesta
- Aggiungere logging per verificare presenza cookie
- Se cookie mancanti, loggare warning

### Soluzione 3: Rimuovere cookie se necessario
- Se cookie causano problemi, rimuoverli e usare solo localStorage + access_token esplicito
- Passare `access_token` come header nelle API routes

---

## 📊 CHECKLIST VERIFICA

- [ ] Cookie Supabase presenti in richiesta API?
- [ ] `userId` non è `null` quando dovrebbe essere presente?
- [ ] `dota_account_id` corrisponde a `playerId` richiesto?
- [ ] RLS policies corrette per INSERT/UPDATE/DELETE?
- [ ] Upsert usa formato corretto `onConflict: 'user_id,dota_account_id'`?
- [ ] Logging mostra errori specifici?

---

## 🎯 PROSSIMI PASSI

1. Verificare se fetch client-side passano cookie
2. Aggiungere `credentials: 'include'` se necessario
3. Verificare logging per identificare pattern errori
4. Se necessario, rimuovere cookie e usare access_token esplicito
5. Testare flusso completo end-to-end

