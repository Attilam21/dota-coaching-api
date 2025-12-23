# 🔍 ANALISI COMPLETA: Problema Caricamento Dati e API Non Rispondono

## 📋 STATO ATTUALE DEL PROGETTO

### Flusso Atteso:
1. **Login/Signup** → `AuthContext` carica `user` e `session`
2. **PlayerIdContext** → Carica `dota_account_id` dal database quando `user` e `session` sono disponibili
3. **Dashboard** → Usa `playerId` dal context per chiamare API routes
4. **API Routes** → Chiamano OpenDota API e restituiscono dati

### Endpoint API Disponibili:
- `/api/player/[id]/stats` - Statistiche base
- `/api/player/[id]/advanced-stats` - Statistiche avanzate
- `/api/player/[id]/profile` - Profilo giocatore
- `/api/player/[id]/wl` - Win/Loss
- `/api/player/[id]/benchmarks` - Benchmark
- `/api/opendota/heroes` - Lista eroi

---

## 🐛 PROBLEMI IDENTIFICATI

### Problema 1: PlayerIdContext non carica l'ID
**Possibili cause:**
1. **RLS Policies bloccano la query** (403/42501)
   - `auth.uid()` non funziona correttamente
   - Sessione non impostata correttamente nel client Supabase
   
2. **Sessione non disponibile quando viene chiamato `loadPlayerIdFromDatabase`**
   - `user` o `session` sono `null`
   - `session.access_token` mancante
   
3. **Record non esiste in `public.users`**
   - Trigger `handle_new_user()` non ha creato il record
   - Record eliminato o mai creato

**Verifica:**
```javascript
// Console browser - verifica questi log:
[PlayerIdContext] Caricamento Player ID dal database per user: [user-id]
[PlayerIdContext] Player ID trovato nel database: [id]
// OPPURE
[PlayerIdContext] 403/42501 Permission Denied - RLS policy blocking
[PlayerIdContext] Nessun Player ID trovato nel database per questo utente
```

### Problema 2: Dashboard non chiama le API
**Possibili cause:**
1. **`playerId` è `null` o `undefined`**
   - `fetchStats()` ha guard clause: `if (!playerId) return`
   - Le API non vengono mai chiamate
   
2. **`useEffect` non si attiva**
   - Dipendenze non corrette
   - `playerId` non cambia quando viene caricato

**Verifica:**
```javascript
// Console browser - verifica:
// Se playerId è null, vedrai:
if (!playerId) return // fetchStats() esce subito

// Se playerId è disponibile ma API non rispondono:
Failed to fetch player stats
```

### Problema 3: API Routes non rispondono
**Possibili cause:**
1. **OpenDota API è down o rate limited**
   - Timeout nelle chiamate
   - Rate limit raggiunto
   
2. **Errori nelle API routes**
   - `fetchWithTimeout` fallisce
   - Errori di parsing JSON
   
3. **Player ID non valido**
   - ID non esiste su OpenDota
   - ID formato errato

**Verifica:**
```javascript
// Network tab browser - verifica:
GET /api/player/[id]/stats → Status?
// Se 500: errore server
// Se 404: route non trovata
// Se timeout: OpenDota non risponde
```

---

## 🔧 DIAGNOSI STEP-BY-STEP

### Step 1: Verifica Autenticazione
```javascript
// Console browser
const { user, session } = useAuth()
console.log('User:', user?.id)
console.log('Session:', session?.access_token ? 'Presente' : 'Mancante')
```

### Step 2: Verifica PlayerIdContext
```javascript
// Console browser
const { playerId, isLoading } = usePlayerIdContext()
console.log('Player ID:', playerId)
console.log('Is Loading:', isLoading)
```

### Step 3: Verifica Database
```sql
-- Supabase SQL Editor
SELECT id, email, dota_account_id 
FROM public.users 
WHERE id = '[user-id]';
```

### Step 4: Verifica API Routes
```bash
# Test diretto API
curl http://localhost:3000/api/player/[player-id]/stats
# OPPURE
curl https://[vercel-url]/api/player/[player-id]/stats
```

### Step 5: Verifica OpenDota
```bash
# Test diretto OpenDota
curl https://api.opendota.com/api/players/[player-id]/matches?limit=20
```

---

## ✅ SOLUZIONI PROPOSTE

### Fix 1: Verifica RLS Policies
```sql
-- Supabase SQL Editor - Verifica policies
SELECT * FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Se mancanti, ricrea:
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### Fix 2: Aggiungi Logging Dettagliato
Aggiungere log in:
- `PlayerIdContext.loadPlayerIdFromDatabase()` - per vedere se viene chiamato
- `DashboardPage.fetchStats()` - per vedere se viene chiamato con playerId valido
- API routes - per vedere se ricevono le richieste

### Fix 3: Verifica Timing
Il `useEffect` in `PlayerIdContext` ha un delay di 200ms. Potrebbe non essere sufficiente se la sessione impiega più tempo.

### Fix 4: Verifica Record Database
Assicurarsi che il trigger `handle_new_user()` crei correttamente il record in `public.users` dopo signup.

---

## 🎯 CHECKLIST VERIFICA

- [ ] User è autenticato? (`user?.id` presente)
- [ ] Session è disponibile? (`session?.access_token` presente)
- [ ] Record esiste in `public.users`? (query SQL)
- [ ] `dota_account_id` è salvato? (query SQL)
- [ ] RLS policies sono attive? (query SQL)
- [ ] `playerId` viene caricato? (console log)
- [ ] `fetchStats()` viene chiamato? (console log)
- [ ] API routes rispondono? (network tab)
- [ ] OpenDota API risponde? (curl test)

---

## 📝 PROSSIMI PASSI

1. **Aggiungere logging dettagliato** in tutti i punti critici
2. **Verificare RLS policies** su Supabase
3. **Testare API routes** direttamente
4. **Verificare che il record esista** nel database
5. **Controllare console browser** per errori specifici

