# 🔧 Funzionamento Attuale del Progetto - Dota 2 Coaching Platform

**Data**: Gennaio 2025  
**Status**: Stato Attuale Implementato

---

## 📊 DOVE SALVA I DATI

### Database Supabase - Tabelle Utilizzate

#### 1. Tabella `users`
**Schema attuale**:
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  dota_account_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Dove viene scritta**:
- **Signup**: Trigger automatico crea record quando user si registra (`handle_new_user()` trigger)
- **Settings Page**: `app/dashboard/settings/page.tsx` fa UPDATE:
  ```typescript
  await supabase
    .from('users')
    .update({ dota_account_id: accountIdValue })
    .eq('id', user.id)
  ```

**Dove viene letta**:
- **usePlayerId hook**: `lib/usePlayerId.ts` fa SELECT:
  ```typescript
  await supabase
    .from('users')
    .select('dota_account_id')
    .eq('id', user.id)
    .single()
  ```

**Dati salvati**:
- `id`: UUID dell'utente (da `auth.users`)
- `email`: Email utente
- `dota_account_id`: Player ID di Dota 2 (INTEGER, può essere NULL)

---

#### 2. Tabella `match_analyses`
**Schema attuale**:
```sql
CREATE TABLE public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
```

**Dove viene scritta**:
- **Match Analysis Page**: `app/analysis/match/[id]/page.tsx` fa UPSERT:
  ```typescript
  await supabase
    .from('match_analyses')
    .upsert({
      user_id: user.id,
      match_id: parseInt(matchId),
      analysis_data: {
        match: match,           // Dati raw da OpenDota API
        analysis: analysis,     // Analisi generata da /api/analysis/match/[id]
        saved_at: new Date().toISOString()
      }
    }, {
      onConflict: 'user_id,match_id'  // Se esiste già, aggiorna
    })
  ```

**Struttura `analysis_data` JSONB salvata**:
```json
{
  "match": {
    "match_id": 1234567890,
    "duration": 2915,
    "radiant_win": true,
    "radiant_score": 45,
    "dire_score": 32,
    "start_time": 1704067200,
    "players": [
      {
        "account_id": 86745912,
        "hero_id": 1,
        "kills": 14,
        "deaths": 5,
        "assists": 9,
        "last_hits": 276,
        "denies": 1,
        "gold_per_min": 590,
        "xp_per_min": 672,
        "net_worth": 24743,
        "player_slot": 0
      },
      // ... altri 9 players
    ]
  },
  "analysis": {
    "matchId": "1234567890",
    "duration": 2915,
    "radiantWin": true,
    "overview": "Partita durata 48 minuti e 35 secondi...",
    "keyMoments": [
      { "time": 0, "event": "Match Started", "description": "..." },
      { "time": 600, "event": "Early Game", "description": "..." }
    ],
    "recommendations": [
      "Partita molto lunga. Analizza le decisioni in late game...",
      "Il team vincente ha dominato la fase di farm..."
    ],
    "playerPerformance": [
      {
        "heroId": 1,
        "kills": 14,
        "deaths": 5,
        "assists": 9,
        "gpm": 590,
        "xpm": 672,
        "rating": "good"
      }
      // ... altri players
    ],
    "teamStats": {
      "radiant": { "avgGpm": 523, "avgKda": "2.45" },
      "dire": { "avgGpm": 478, "avgKda": "2.12" }
    }
  },
  "saved_at": "2025-01-15T10:30:00.000Z"
}
```

**Dove viene letta**:
- **Matches Page**: `app/dashboard/matches/page.tsx` fa SELECT:
  ```typescript
  await supabase
    .from('match_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  ```

**Constraint UNIQUE**: Un utente può salvare lo stesso match_id solo una volta (se salva di nuovo, fa UPDATE, non INSERT).

---

## 🔄 COME GESTISCE I FLUSSI

### Flusso 1: Login → Dashboard

**Step-by-step**:

1. **User naviga a `/auth/login`**
2. **Inserisce email/password e submit**
3. **Chiamata Supabase Auth**:
   ```typescript
   // app/auth/login/page.tsx
   const { error } = await supabase.auth.signInWithPassword({
     email,
     password
   })
   ```
4. **Supabase salva sessione**:
   - Token JWT salvato in `localStorage` (key: `sb-<project>-auth-token`)
   - Session object contiene `user` e `access_token`
5. **Redirect a `/dashboard`**
6. **AuthProvider rileva cambio**:
   - `supabase.auth.onAuthStateChange()` callback viene chiamato
   - `user` e `session` aggiornati nel React Context
7. **Dashboard page si carica**:
   - `useAuth()` ritorna `{ user: {...}, session: {...}, loading: false }`
   - Se `user` non esiste → redirect a `/auth/login`

---

### Flusso 2: Dashboard → Visualizzazione Statistiche

**Step-by-step**:

1. **Dashboard page mount** (`app/dashboard/page.tsx`)
2. **usePlayerIdWithManual hook viene chiamato**:
   - Hook chiama `usePlayerId()` che fa query a Supabase:
     ```typescript
     // lib/usePlayerId.ts
     const { data } = await supabase
       .from('users')
       .select('dota_account_id')
       .eq('id', user.id)
       .single()
     ```
   - Se `dota_account_id` esiste → `playerId = data.dota_account_id.toString()`
   - Se non esiste → `playerId = null`
3. **Se `playerId` è null**:
   - Mostra form per inserire Player ID manualmente
   - Se user inserisce ID → salvato in `localStorage` (key: `manual_player_id`)
   - `playerId` diventa il valore da localStorage
4. **Se `playerId` esiste**:
   - `useEffect` trigger quando `playerId` cambia:
     ```typescript
     useEffect(() => {
       if (playerId && !playerIdLoading) {
         fetchStats()
       }
     }, [playerId, playerIdLoading])
     ```
5. **Fetch statistiche**:
   ```typescript
   // app/dashboard/page.tsx
   const response = await fetch(`/api/player/${playerId}/stats`)
   const data = await response.json()
   setStats(data.stats)
   ```
6. **API route elabora** (`app/api/player/[id]/stats/route.ts`):
   - Fa fetch a OpenDota: `https://api.opendota.com/api/players/${id}/matches?limit=10`
   - Riceve array di 10 match recenti
   - Calcola statistiche:
     - Winrate ultimi 5 vs ultimi 10
     - KDA medio ultimi 5 vs ultimi 10
     - GPM/XPM medio
   - Ritorna JSON con `matches` e `stats`
7. **Dashboard renderizza**:
   - Cards con winrate, KDA, farm trends
   - Grafico line chart con Recharts
   - Tabella match recenti

---

### Flusso 3: Analisi Match → Salvataggio

**Step-by-step**:

1. **User naviga a `/analysis/match/[id]`** (es. `/analysis/match/1234567890`)
2. **Page fetch match data**:
   ```typescript
   // app/analysis/match/[id]/page.tsx
   let response = await fetch(`/api/opendota/match/${matchId}`)
   if (!response.ok) {
     // Fallback diretto a OpenDota
     response = await fetch(`https://api.opendota.com/api/matches/${matchId}`)
   }
   const match = await response.json()
   setMatch(match)
   ```
3. **Page fetch analysis** (parallelo):
   ```typescript
   const analysisResponse = await fetch(`/api/analysis/match/${matchId}`)
   const analysis = await analysisResponse.json()
   setAnalysis(analysis)
   ```
4. **API Analysis elabora** (`app/api/analysis/match/[id]/route.ts`):
   - Fa fetch a OpenDota: `https://api.opendota.com/api/matches/${id}`
   - Calcola statistiche team (GPM medio, KDA medio)
   - Genera recommendations basate su durata match e farm advantage
   - Analizza ogni player e assegna rating
   - Genera keyMoments (simulati basati su durata)
   - Ritorna object `analysis` con overview, recommendations, playerPerformance, teamStats
5. **Page renderizza**:
   - Header con match info, durata, risultato
   - Tabella players (Radiant e Dire separati)
   - Grafici GPM/XPM e KDA
   - Sezione AI Analysis con recommendations
6. **User clicca "Salva Analisi"**:
   ```typescript
   await supabase
     .from('match_analyses')
     .upsert({
       user_id: user.id,
       match_id: parseInt(matchId),
       analysis_data: {
         match: match,      // Dati completi da OpenDota
         analysis: analysis, // Analisi generata
         saved_at: new Date().toISOString()
       }
     }, {
       onConflict: 'user_id,match_id'
     })
   ```
7. **Dati salvati in Supabase**:
   - Se match già salvato da questo user → UPDATE
   - Se non esiste → INSERT
   - `analysis_data` contiene sia `match` che `analysis` in JSONB

---

## 🌐 API ROUTES - COME FUNZIONANO

### 1. `/api/player/[id]/stats` (GET)

**File**: `app/api/player/[id]/stats/route.ts`

**Cosa fa**:
1. Riceve Player ID da URL params
2. Fa fetch a OpenDota: `https://api.opendota.com/api/players/${id}/matches?limit=10`
3. Elabora array di match:
   - Separa ultimi 5 e ultimi 10 match
   - Calcola winrate (basato su `player_slot` e `radiant_win`)
   - Calcola KDA medio: `(kills + assists) / Math.max(deaths, 1)`
   - Calcola GPM/XPM medio
4. Ritorna:
   ```json
   {
     "matches": [...],  // Array di 10 match
     "stats": {
       "winrate": {
         "last5": 60.0,
         "last10": 70.0,
         "delta": -10.0
       },
       "kda": {
         "last5": 3.27,
         "last10": 5.58,
         "delta": -2.31
       },
       "farm": {
         "gpm": { "last5": 523, "last10": 498 },
         "xpm": { "last5": 612, "last10": 587 }
       },
       "matches": [
         {
           "match_id": 1234567890,
           "win": true,
           "kda": 3.50,
           "gpm": 590,
           "xpm": 672,
           "start_time": 1704067200
         }
         // ... altri 9 match
       ]
     }
   }
   ```

**Cache**: `next: { revalidate: 3600 }` → cache 1 ora

---

### 2. `/api/analysis/match/[id]` (GET)

**File**: `app/api/analysis/match/[id]/route.ts`

**Cosa fa**:
1. Riceve Match ID da URL params
2. Fa fetch a OpenDota: `https://api.opendota.com/api/matches/${id}`
3. Elabora dati match:
   - Separa players Radiant (indice 0-4) e Dire (indice 5-9)
   - Calcola GPM medio per team
   - Calcola KDA medio per team
4. Genera recommendations:
   - Se durata < 1800 sec (30 min) → recommendation su early game
   - Se durata > 3600 sec (60 min) → recommendation su late game
   - Se winning team GPM > losing team GPM * 1.2 → recommendation su farm
5. Analizza ogni player:
   - Calcola KDA
   - Determina ruolo (Carry se GPM > 500, Support se GPM < 300 e assists > kills)
   - Rating: "good" se KDA > 2 e deaths < 5, "average" se KDA > 1.5 e deaths < 7, altrimenti "needs improvement"
6. Genera keyMoments (simulati):
   - Sempre presente: Match Started (time: 0)
   - Se durata > 600 sec: Early Game (time: 600)
   - Se durata > 1800 sec: Mid Game (time: 1800)
7. Genera overview (testo descrittivo)
8. Ritorna:
   ```json
   {
     "matchId": "1234567890",
     "duration": 2915,
     "radiantWin": true,
     "overview": "Partita durata 48 minuti e 35 secondi. Vittoria Radiant...",
     "keyMoments": [
       { "time": 0, "event": "Match Started", "description": "La partita è iniziata" },
       { "time": 600, "event": "Early Game", "description": "Fine della fase di laning..." }
     ],
     "recommendations": [
       "Partita molto lunga. Analizza le decisioni in late game...",
       "Il team vincente ha dominato la fase di farm..."
     ],
     "playerPerformance": [
       {
         "heroId": 1,
         "kills": 14,
         "deaths": 5,
         "assists": 9,
         "gpm": 590,
         "xpm": 672,
         "rating": "good"
       }
       // ... altri 9 players
     ],
     "teamStats": {
       "radiant": { "avgGpm": 523, "avgKda": "2.45" },
       "dire": { "avgGpm": 478, "avgKda": "2.12" }
     }
   }
   ```

**Cache**: `Cache-Control: public, s-maxage=3600` → cache 1 ora

---

### 3. `/api/opendota/match/[id]` (GET)

**File**: `app/api/opendota/match/[id]/route.ts`

**Cosa fa**:
- Proxy diretto a OpenDota API
- Fa fetch: `https://api.opendota.com/api/matches/${id}`
- Ritorna dati RAW da OpenDota (senza elaborazione)
- Cache: 1 ora

---

### 4. `/api/opendota/player/[id]` (GET)

**File**: `app/api/opendota/player/[id]/route.ts`

**Cosa fa**:
- Proxy diretto a OpenDota API
- Fa fetch: `https://api.opendota.com/api/players/${id}`
- Ritorna dati RAW da OpenDota (profilo player)
- Cache: 1 ora

---

### 5. `/api/opendota/heroes` (GET)

**File**: `app/api/opendota/heroes/route.ts`

**Cosa fa**:
- Proxy diretto a OpenDota API
- Fa fetch: `https://api.opendota.com/api/heroes`
- Ritorna lista completa heroes (per mappare hero_id a nomi)
- Cache: 24 ore (heroes non cambiano spesso)

---

## 💾 GESTIONE STATI E PERSISTENZA

### 1. Autenticazione State

**Storage**: `localStorage` (Supabase gestisce automaticamente)

**Key**: `sb-<project-id>-auth-token`

**Contenuto**: Token JWT con session info

**Gestione**: 
- Supabase client legge automaticamente da localStorage al mount
- `AuthProvider` sincronizza con React Context
- `onAuthStateChange` listener aggiorna Context quando sessione cambia

---

### 2. Player ID State

**Due fonti possibili**:

**A) Database (Supabase)**:
- Tabella: `users.dota_account_id`
- Query: `SELECT dota_account_id FROM users WHERE id = user.id`
- Hook: `usePlayerId()`

**B) localStorage (fallback manuale)**:
- Key: `manual_player_id`
- Valore: String (Player ID inserito manualmente)
- Gestito da: `usePlayerIdWithManual()`

**Priorità**:
1. Se `users.dota_account_id` esiste → usa quello
2. Se non esiste ma `localStorage.manual_player_id` esiste → usa quello
3. Altrimenti → `null` (mostra form input)

---

### 3. Match Data State

**Storage**: Nessuna persistenza locale, sempre fetch da API

**Flusso**:
- User naviga a `/analysis/match/[id]`
- Page fa fetch a `/api/opendota/match/${id}` (o direttamente OpenDota)
- Dati salvati solo in React state (`useState`)
- Se user clicca "Salva" → salvato in Supabase `match_analyses.analysis_data`

**Cache lato server**:
- API routes hanno cache header (`Cache-Control: public, s-maxage=3600`)
- Next.js ISR (Incremental Static Regeneration) cache risposte per 1 ora

---

## 🔐 SICUREZZA E RLS

### Row Level Security (RLS) Policies Attive

**Tabella `users`**:
```sql
-- SELECT: User può vedere solo il proprio record
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- UPDATE: User può modificare solo il proprio record
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

**Tabella `match_analyses`**:
```sql
-- SELECT: User può vedere solo i propri match salvati
CREATE POLICY "Users can view own analyses"
ON match_analyses FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: User può inserire solo con il proprio user_id
CREATE POLICY "Users can insert own analyses"
ON match_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Come funziona**:
- `auth.uid()` è funzione Supabase che estrae user ID dal JWT token
- Ogni query Supabase include automaticamente il token JWT (se user è autenticato)
- RLS filtra risultati a livello database (anche se query è sbagliata, user vede solo i propri dati)

---

## 📝 CHIAMATE API REALI

### Chiamate a OpenDota API (Esterne)

**1. Player Matches**:
```
GET https://api.opendota.com/api/players/{account_id}/matches?limit=10
```
Ritorna: Array di match recenti con statistiche base

**2. Match Details**:
```
GET https://api.opendota.com/api/matches/{match_id}
```
Ritorna: Dettagli completi match (players, timeline, stats, etc.)

**3. Player Profile**:
```
GET https://api.opendota.com/api/players/{account_id}
```
Ritorna: Profilo player (MMR, rank, etc.)

**4. Heroes List**:
```
GET https://api.opendota.com/api/heroes
```
Ritorna: Lista completa heroes con nomi, ID, etc.

---

### Chiamate a Supabase (Database)

**1. Lettura Player ID**:
```typescript
await supabase
  .from('users')
  .select('dota_account_id')
  .eq('id', user.id)
  .single()
```

**2. Scrittura Player ID**:
```typescript
await supabase
  .from('users')
  .update({ dota_account_id: accountIdValue })
  .eq('id', user.id)
```

**3. Salvataggio Match Analysis**:
```typescript
await supabase
  .from('match_analyses')
  .upsert({
    user_id: user.id,
    match_id: parseInt(matchId),
    analysis_data: { match, analysis, saved_at }
  }, {
    onConflict: 'user_id,match_id'
  })
```

**4. Lettura Match Salvati**:
```typescript
await supabase
  .from('match_analyses')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 🎯 STRUTTURA DATI SALVATA

### `match_analyses.analysis_data` (JSONB)

**Struttura esatta**:
```typescript
{
  match: {
    // Dati RAW da OpenDota API
    match_id: number,
    duration: number,
    radiant_win: boolean,
    radiant_score: number,
    dire_score: number,
    start_time: number,
    players: Array<{
      account_id: number,
      hero_id: number,
      kills: number,
      deaths: number,
      assists: number,
      last_hits: number,
      denies: number,
      gold_per_min: number,
      xp_per_min: number,
      net_worth?: number,
      hero_damage?: number,
      tower_damage?: number,
      player_slot: number
    }>  // Array di 10 players
  },
  analysis: {
    // Dati elaborati da /api/analysis/match/[id]
    matchId: string,
    duration: number,
    radiantWin: boolean,
    overview: string,
    keyMoments: Array<{
      time: number,
      event: string,
      description: string
    }>,
    recommendations: string[],
    playerPerformance: Array<{
      heroId: number,
      kills: number,
      deaths: number,
      assists: number,
      gpm: number,
      xpm: number,
      rating: string
    }>,
    teamStats: {
      radiant: { avgGpm: number, avgKda: string },
      dire: { avgGpm: number, avgKda: string }
    }
  },
  saved_at: string  // ISO timestamp
}
```

**Dimensione stimata**: ~50-200 KB per match (dipende dalla complessità del match)

---

## 🔄 FLUSSO COMPLETO ESEMPIO

### Scenario: User fa login, visualizza dashboard, analizza match, salva

1. **Login**:
   - POST a Supabase Auth → sessione salvata in localStorage
   - Redirect a `/dashboard`

2. **Dashboard Load**:
   - `usePlayerIdWithManual()` query Supabase: `SELECT dota_account_id FROM users WHERE id = user.id`
   - Se trovato → `playerId = "1903287666"`
   - Se non trovato → mostra form, user inserisce ID → salvato in localStorage

3. **Fetch Stats**:
   - GET `/api/player/1903287666/stats`
   - API fa GET `https://api.opendota.com/api/players/1903287666/matches?limit=10`
   - OpenDota ritorna array di 10 match
   - API calcola winrate, KDA, GPM/XPM
   - Ritorna JSON con stats
   - Dashboard renderizza cards e grafici

4. **User clicca "Analizza" su match_id 1234567890**:
   - Naviga a `/analysis/match/1234567890`
   - Page fa due fetch paralleli:
     - GET `/api/opendota/match/1234567890` → ritorna match data RAW
     - GET `/api/analysis/match/1234567890` → ritorna analysis elaborata
   - Page renderizza tabelle, grafici, AI analysis

5. **User clicca "Salva Analisi"**:
   - POST (UPSERT) a Supabase:
     ```sql
     INSERT INTO match_analyses (user_id, match_id, analysis_data)
     VALUES (user.id, 1234567890, '{match: {...}, analysis: {...}, saved_at: "..."}')
     ON CONFLICT (user_id, match_id) DO UPDATE SET analysis_data = EXCLUDED.analysis_data
     ```
   - Dati salvati in `match_analyses` table

6. **User naviga a `/dashboard/matches`**:
   - Page fa query Supabase:
     ```sql
     SELECT * FROM match_analyses WHERE user_id = user.id ORDER BY created_at DESC
     ```
   - Mostra lista match salvati con link per vedere analisi

---

## 📌 PUNTI CHIAVE IMPLEMENTAZIONE ATTUALE

1. **Player ID**: Centralizzato in `users.dota_account_id`, con fallback localStorage per uso immediato
2. **Match Data**: Non persistito localmente, sempre fetch da OpenDota (cache 1 ora)
3. **Analysis**: Generata on-the-fly da `/api/analysis/match/[id]` (non persistita separatamente, solo quando user salva)
4. **Saved Matches**: Salvati in `match_analyses.analysis_data` come JSONB con sia `match` che `analysis`
5. **Cache Strategy**: API routes hanno cache ISR di 1 ora per dati OpenDota
6. **Security**: RLS garantisce che user vede/modifica solo i propri dati
7. **Error Handling**: Try-catch ovunque, loading states, error messages

---

**Documento aggiornato**: Gennaio 2025  
**Versione**: Stato Attuale del Codice

