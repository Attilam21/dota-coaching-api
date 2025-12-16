# 🏗️ Architettura e Flusso del Progetto - Dota 2 Coaching Platform

**Data**: Gennaio 2025  
**Versione**: 1.0

---

## 📋 Indice

1. [Architettura Generale](#architettura-generale)
2. [Flusso di Autenticazione](#flusso-di-autenticazione)
3. [Gestione Stato Utente](#gestione-stato-utente)
4. [Acquisizione Dati](#acquisizione-dati)
5. [Persistenza Dati](#persistenza-dati)
6. [Hooks Personalizzati](#hooks-personalizzati)
7. [Routing e Layout](#routing-e-layout)
8. [Componenti Chiave](#componenti-chiave)

---

## 🏛️ Architettura Generale

### Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Autenticazione**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **API Esterna**: OpenDota API
- **Charts**: Recharts

### Struttura Directory Principale

```
/app
  /api          # API Routes (Next.js Server Routes)
  /auth         # Pagine autenticazione
  /dashboard    # Pagine dashboard (protette)
  /analysis     # Pagine analisi match/player
  layout.tsx    # Layout root con AuthProvider

/lib
  auth-context.tsx        # Context React per autenticazione
  supabase.ts            # Client Supabase
  usePlayerId.ts         # Hook per recupero Player ID da DB
  usePlayerIdWithManual.ts # Hook con fallback manuale

/components
  DashboardLayout.tsx    # Layout dashboard con sidebar
  ConditionalLayout.tsx  # Layout condizionale (navbar o dashboard)
  Navbar.tsx            # Navbar principale
```

---

## 🔐 Flusso di Autenticazione

### 1. Inizializzazione Supabase Client

**File**: `lib/supabase.ts`

```typescript
// Creazione client Supabase con configurazione
supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Salva sessione in localStorage
    autoRefreshToken: true,    // Refresh automatico token
  }
})
```

**Logica**:
- Verifica presenza variabili ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Se mancanti, crea client mock per evitare crash
- Se presenti, crea client configurato per persistenza sessione

---

### 2. AuthProvider e Context

**File**: `lib/auth-context.tsx`

**Flusso di inizializzazione**:

1. **Mount del Provider**:
   ```typescript
   useEffect(() => {
     // 1. Recupera sessione esistente
     supabase.auth.getSession()
       .then(({ session }) => {
         setSession(session)
         setUser(session?.user ?? null)
       })
       .finally(() => setLoading(false))
     
     // 2. Ascolta cambiamenti auth in tempo reale
     supabase.auth.onAuthStateChange((event, session) => {
       setSession(session)
       setUser(session?.user ?? null)
     })
   }, [])
   ```

2. **Stati gestiti**:
   - `user`: Oggetto User di Supabase (null se non autenticato)
   - `session`: Oggetto Session con token JWT
   - `loading`: Boolean per stato caricamento iniziale

3. **Exposed API**:
   - `useAuth()`: Hook per accedere al context
   - `signOut()`: Funzione per logout

**Punti chiave**:
- ✅ Gestione errori robusta (try-catch, .catch())
- ✅ Cleanup subscription al unmount
- ✅ Loading state sempre risolto (even on error)

---

### 3. Login Flow

**File**: `app/auth/login/page.tsx`

**Flusso passo-passo**:

1. **User inserisce credenziali** → `handleLogin(e)`
2. **Chiamata Supabase**:
   ```typescript
   const { error } = await supabase.auth.signInWithPassword({
     email,
     password,
   })
   ```
3. **Gestione risposta**:
   - Se errore → mostra messaggio errore
   - Se successo → Supabase salva sessione in localStorage automaticamente
4. **Redirect**:
   ```typescript
   router.push('/dashboard')
   router.refresh()  // Forza refresh per aggiornare AuthContext
   ```

**Post-Login**:
- `onAuthStateChange` nel `AuthProvider` rileva il cambio
- `user` e `session` vengono aggiornati nel context
- Tutti i componenti che usano `useAuth()` ricevono il nuovo stato

---

### 4. Signup Flow

**File**: `app/auth/signup/page.tsx`

**Flusso**:

1. **User inserisce email/password**
2. **Chiamata Supabase**:
   ```typescript
   const { error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: { email }  // Passa email al trigger per creare record users
     }
   })
   ```
3. **Trigger Supabase** (database):
   - Trigger automatico crea record in tabella `users`
   - Collega `id` della tabella `auth.users` con `users.id`
4. **Redirect a dashboard** (dopo 2 secondi per feedback)

---

### 5. Protected Routes

**Pattern utilizzato in tutte le pagine dashboard**:

```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/auth/login')
    return
  }
}, [user, authLoading, router])
```

**Logica**:
- Attende fine caricamento auth (`!authLoading`)
- Se non c'è user → redirect a login
- Se c'è user → renderizza contenuto

---

## 👤 Gestione Stato Utente

### 1. Recupero Player ID dal Profilo

**File**: `lib/usePlayerId.ts`

**Hook personalizzato per recuperare Dota Account ID**:

```typescript
export function usePlayerId() {
  const { user } = useAuth()  // Dipende da auth context
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPlayerId(null)
      setLoading(false)
      return
    }

    // Fetch da Supabase
    const { data } = await supabase
      .from('users')
      .select('dota_account_id')
      .eq('id', user.id)  // Solo il record dell'utente corrente
      .single()

    if (data?.dota_account_id) {
      setPlayerId(data.dota_account_id.toString())
    }
  }, [user])

  return { playerId, loading, error }
}
```

**Caratteristiche**:
- ✅ Si aggiorna automaticamente quando `user` cambia
- ✅ Gestisce caso "user non ha ancora configurato ID" (null)
- ✅ Gestisce errore PGRST116 (no rows found) come caso normale
- ✅ Loading state per evitare flash di contenuto

---

### 2. Fallback Manuale con localStorage

**File**: `lib/usePlayerIdWithManual.ts`

**Problema risolto**: User può non avere ancora salvato Player ID nel profilo, ma vuole usare l'app.

**Soluzione**: Hook che combina Player ID da DB + input manuale + persistenza localStorage.

**Architettura**:

```typescript
export function usePlayerIdWithManual() {
  // 1. Ottieni Player ID dal profilo (usePlayerId hook)
  const { playerId: profilePlayerId, loading } = usePlayerId()
  
  // 2. Stato per input manuale
  const [manualPlayerId, setManualPlayerIdState] = useState<string>('')
  const [usingManualId, setUsingManualId] = useState(false)
  
  // 3. SSR Safety: localStorage solo client-side
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  // 4. Carica manual ID da localStorage al mount
  useEffect(() => {
    if (!isMounted) return
    const saved = localStorage.getItem('manual_player_id')
    if (saved && !profilePlayerId) {
      setManualPlayerIdState(saved)
      setUsingManualId(true)
    }
  }, [isMounted, profilePlayerId])

  // 5. Player ID finale (priorità: profilo > manuale)
  const playerId = profilePlayerId || (usingManualId && manualPlayerId ? manualPlayerId : null)

  // 6. Funzione per attivare manual ID (form submit)
  const activateManualId = (id?: string) => {
    const idToUse = id?.trim() || manualPlayerId.trim()
    if (idToUse && !profilePlayerId) {
      localStorage.setItem('manual_player_id', idToUse.trim())
      setManualPlayerIdState(idToUse.trim())
      setUsingManualId(true)
    }
  }

  return {
    playerId,              // ID finale da usare
    manualPlayerId,        // Valore input manuale
    setManualPlayerId,     // Setter per input onChange
    activateManualId,      // Attiva manual ID (salva in localStorage)
    usingManualId,         // Flag se sta usando manual ID
    hasPlayerId: !!playerId // Boolean per condizionali UI
  }
}
```

**Priorità**:
1. **Player ID da profilo** (Supabase) → sempre usato se disponibile
2. **Player ID manuale** (localStorage) → usato solo se profilo non ha ID
3. **Nessuno** → mostra form input

**Persistenza**:
- Manual ID salvato in `localStorage` → condiviso tra tutte le pagine
- Se user salva ID nel profilo → manual ID viene rimosso automaticamente

---

### 3. Salvataggio Player ID nel Profilo

**File**: `app/dashboard/settings/page.tsx`

**Flusso**:

1. **Load existing settings**:
   ```typescript
   const { data } = await supabase
     .from('users')
     .select('dota_account_id')
     .eq('id', user.id)
     .single()
   ```

2. **Save settings**:
   ```typescript
   const { error } = await supabase
     .from('users')
     .update({ dota_account_id: accountIdValue })
     .eq('id', user.id)  // Solo il proprio record (RLS policy)
   ```

**Sicurezza**:
- RLS (Row Level Security) in Supabase garantisce che user possa modificare solo il proprio record
- Query usa sempre `user.id` dal context auth (non può essere falsificato)

---

## 📊 Acquisizione Dati

### 1. API Routes - Architettura

**Next.js App Router API Routes** → Server-side endpoints

**Pattern generale**:
```typescript
// app/api/[resource]/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ... logica
  return NextResponse.json(data)
}
```

---

### 2. Player Statistics API

**File**: `app/api/player/[id]/stats/route.ts`

**Flusso**:

1. **Riceve Player ID** da URL params
2. **Fetch da OpenDota**:
   ```typescript
   const matchesResponse = await fetch(
     `https://api.opendota.com/api/players/${id}/matches?limit=10`,
     { next: { revalidate: 3600 } }  // Cache 1 ora
   )
   ```
3. **Elaborazione dati**:
   - Calcola winrate ultimi 5 vs ultimi 10 match
   - Calcola KDA medio (ultimi 5, ultimi 10)
   - Calcola GPM/XPM medio
   - Determina win/loss per ogni match (basato su `player_slot` e `radiant_win`)
4. **Ritorna JSON strutturato**:
   ```typescript
   {
     matches: [...],
     stats: {
       winrate: { last5, last10, delta },
       kda: { last5, last10, delta },
       farm: { gpm: {...}, xpm: {...} },
       matches: [...]
     }
   }
   ```

**Logica Win/Loss**:
```typescript
// Player slot < 128 = Radiant team
// Player slot >= 128 = Dire team
const win = (player_slot < 128 && radiant_win) || 
            (player_slot >= 128 && !radiant_win)
```

---

### 3. Match Analysis API

**File**: `app/api/analysis/match/[id]/route.ts`

**Flusso**:

1. **Fetch match data da OpenDota**:
   ```typescript
   const response = await fetch(`https://api.opendota.com/api/matches/${id}`)
   const match = await response.json()
   ```

2. **Calcolo statistiche team**:
   - Separa players Radiant (0-4) e Dire (5-9)
   - Calcola GPM medio per team
   - Calcola KDA medio per team

3. **Generazione recommendations** (logica basica):
   - Analisi durata match
   - Analisi farm advantage
   - Analisi performance individuali

4. **Analisi player performance**:
   - Calcola KDA per ogni player
   - Determina ruolo (Carry/Support) basato su GPM
   - Rating performance (good/average/needs improvement)

5. **Ritorna analysis object**:
   ```typescript
   {
     matchId, duration, radiantWin,
     overview,           // Testo descrittivo
     keyMoments,         // Array di momenti chiave
     recommendations,    // Array di consigli
     playerPerformance,  // Array con rating per player
     teamStats           // Statistiche aggregate per team
   }
   ```

---

### 4. Client-Side Data Fetching

**Pattern utilizzato nelle pagine dashboard**:

```typescript
useEffect(() => {
  if (playerId && !playerIdLoading) {
    fetchStats()
  }
}, [playerId, playerIdLoading])

const fetchStats = async () => {
  if (!playerId) return
  
  try {
    setLoading(true)
    setError(null)
    
    const response = await fetch(`/api/player/${playerId}/stats`)
    if (!response.ok) throw new Error('Failed to fetch')
    
    const data = await response.json()
    setStats(data.stats)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

**Caratteristiche**:
- ✅ Trigger automatico quando `playerId` cambia
- ✅ Gestione errori con try-catch
- ✅ Loading states per UX
- ✅ Dipendenze useEffect corrette

---

## 💾 Persistenza Dati

### 1. Database Schema (Supabase)

**Tabelle principali**:

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  dota_account_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger automatico** (creato in Supabase):
- Quando nuovo user si registra → crea record in `users` con `id = auth.users.id`

#### `match_analyses`
```sql
CREATE TABLE match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  match_id INTEGER,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
```

**RLS Policies**:
- SELECT: User può vedere solo i propri record
- INSERT/UPDATE: User può modificare solo i propri record

---

### 2. Salvataggio Match Analysis

**File**: `app/analysis/match/[id]/page.tsx`

**Flusso salvataggio**:

```typescript
const handleSaveAnalysis = async () => {
  if (!user) {
    // Redirect to login
    return
  }

  // Upsert in Supabase
  const { error } = await supabase
    .from('match_analyses')
    .upsert({
      user_id: user.id,
      match_id: parseInt(matchId),
      analysis_data: {
        match: match,           // Dati match da OpenDota
        analysis: analysis,     // Analisi generata dall'API
        saved_at: new Date().toISOString()
      }
    }, {
      onConflict: 'user_id,match_id'  // Se esiste già, aggiorna
    })
}
```

**Caratteristiche**:
- ✅ Upsert → crea o aggiorna se esiste già
- ✅ Unicità per (user_id, match_id) → user non può salvare stesso match 2 volte
- ✅ JSONB storage → flessibile per struttura dati

---

### 3. Recupero Match Salvati

**File**: `app/dashboard/matches/page.tsx`

**Flusso**:

```typescript
const fetchSavedMatches = async () => {
  const { data } = await supabase
    .from('match_analyses')
    .select('*')
    .eq('user_id', user.id)        // Solo i propri match
    .order('created_at', { ascending: false })
  
  setSavedMatches(data || [])
}
```

**RLS garantisce**:
- User vede solo i propri match (anche se query è sbagliata)
- Query usa `user.id` dal context auth

---

## 🎣 Hooks Personalizzati

### 1. `useAuth()`

**Uso**:
```typescript
const { user, session, loading, signOut } = useAuth()
```

**Cosa fa**:
- Fornisce accesso al context di autenticazione
- `user`: Oggetto User di Supabase (null se non autenticato)
- `session`: Session con token JWT
- `loading`: Stato caricamento iniziale
- `signOut()`: Funzione logout

---

### 2. `usePlayerId()`

**Uso**:
```typescript
const { playerId, loading, error } = usePlayerId()
```

**Cosa fa**:
- Recupera `dota_account_id` dal profilo utente in Supabase
- Si aggiorna automaticamente quando `user` cambia
- Ritorna `null` se user non ha configurato ID

---

### 3. `usePlayerIdWithManual()`

**Uso**:
```typescript
const {
  playerId,              // ID finale da usare
  manualPlayerId,        // Valore input
  setManualPlayerId,     // Setter per input
  activateManualId,      // Salva manual ID
  usingManualId,         // Flag
  hasPlayerId            // Boolean
} = usePlayerIdWithManual()
```

**Cosa fa**:
- Combina Player ID da profilo + input manuale
- Persiste manual ID in localStorage
- Priorità: profilo > manuale > null

---

## 🗺️ Routing e Layout

### 1. App Router Structure

**Next.js 14 App Router**:
- `/app` → directory delle routes
- `page.tsx` → componente pagina
- `layout.tsx` → layout per quella route e children
- `route.ts` → API endpoint

---

### 2. Root Layout

**File**: `app/layout.tsx`

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Ordine di wrapping**:
1. `AuthProvider` → fornisce auth context a tutta l'app
2. `ConditionalLayout` → decide se mostrare Navbar o DashboardLayout

---

### 3. ConditionalLayout

**File**: `components/ConditionalLayout.tsx`

**Logica**:

```typescript
const pathname = usePathname()
const isDashboard = pathname?.startsWith('/dashboard') ?? false

if (isDashboard) {
  // Routes /dashboard/* → nessun layout (sarà wrappato da DashboardLayout)
  return <>{children}</>
} else {
  // Altre routes → Navbar + Footer
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer>...</footer>
    </>
  )
}
```

**SSR Safety**:
- Usa `useState` + `useEffect` per evitare hydration mismatch
- Durante SSR, sempre mostra layout standard
- Dopo mount, aggiorna in base a pathname

---

### 4. Dashboard Layout

**File**: `components/DashboardLayout.tsx`  
**Wrappa**: `app/dashboard/layout.tsx`

**Struttura**:
```typescript
<div className="flex h-screen">
  <aside>
    {/* Sidebar navigation */}
  </aside>
  <main>
    {children}  {/* Contenuto pagina dashboard */}
  </main>
</div>
```

**Sidebar contiene**:
- Navigazione dashboard
- Sezioni organizzate (ANALISI CORE, COACHING, AVANZATO, SISTEMA)
- User info e logout button

---

### 5. Protected Routes Pattern

**Ogni pagina dashboard implementa**:

```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/auth/login')
  }
}, [user, authLoading, router])
```

**Loading state**:
```typescript
if (authLoading || playerIdLoading) {
  return <LoadingSpinner />
}
```

---

## 🧩 Componenti Chiave

### 1. Navbar

**File**: `components/Navbar.tsx`

**Comportamento**:
- Se `user` esiste → mostra "Dashboard", "Logout", email
- Se `user` non esiste → mostra "Login", "Signup"
- Responsive con mobile menu

---

### 2. Dashboard Pages

**Pattern comune**:

```typescript
export default function SomePage() {
  // 1. Auth check
  const { user, loading: authLoading } = useAuth()
  
  // 2. Player ID hook
  const { playerId, hasPlayerId, ... } = usePlayerIdWithManual()
  
  // 3. Data state
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // 4. Protected route
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading])
  
  // 5. Fetch data quando playerId disponibile
  useEffect(() => {
    if (playerId) fetchData()
  }, [playerId])
  
  // 6. Manual ID input se necessario
  if (!hasPlayerId) {
    return <ManualIdInputForm />
  }
  
  // 7. Render content
  return <PageContent />
}
```

---

## 🔄 Flusso Completo: Login → Dashboard → Analisi

### Scenario: User fa login e visualizza statistiche

1. **User naviga a `/auth/login`**
   - Inserisce email/password
   - Submit → `supabase.auth.signInWithPassword()`
   - Supabase salva sessione in localStorage
   - Redirect a `/dashboard`

2. **`/dashboard` si carica**
   - `AuthProvider` rileva sessione via `onAuthStateChange`
   - `user` e `session` aggiornati nel context
   - `usePlayerIdWithManual()` viene chiamato
   - Hook fa query a Supabase: `SELECT dota_account_id FROM users WHERE id = user.id`
   - Se trovato → `playerId` settato
   - Se non trovato → `playerId = null`, mostra form input

3. **User inserisce Player ID manuale** (se non nel profilo)
   - Submit form → `activateManualId(manualPlayerId)`
   - ID salvato in localStorage
   - `usingManualId = true`
   - `playerId` aggiornato (dal localStorage)

4. **Fetch statistiche**
   - `useEffect` trigger quando `playerId` disponibile
   - `fetchStats()` chiama `/api/player/${playerId}/stats`
   - API route fa fetch a OpenDota: `/api/players/${id}/matches?limit=10`
   - API elabora dati (winrate, KDA, GPM/XPM)
   - Ritorna JSON → `setStats(data.stats)`

5. **Render dashboard**
   - Mostra cards con statistiche
   - Mostra grafici con Recharts
   - Mostra tabella match recenti

6. **User clicca "Analizza" su un match**
   - Naviga a `/analysis/match/[id]`
   - Page fetch match data da `/api/opendota/match/[id]`
   - Page fetch analysis da `/api/analysis/match/[id]`
   - Mostra dettagli match + analisi AI

7. **User clicca "Salva Analisi"**
   - `handleSaveAnalysis()` chiamato
   - `supabase.from('match_analyses').upsert({...})`
   - Match salvato in Supabase con `user_id`
   - RLS garantisce che solo user corrente può salvare/modificare

---

## 🔒 Sicurezza

### Row Level Security (RLS)

**Supabase RLS Policies** per tabella `users`:

```sql
-- SELECT: User può vedere solo il proprio record
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- UPDATE: User può modificare solo il proprio record
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- INSERT: User può inserire solo il proprio record
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

**`auth.uid()`**: Funzione Supabase che ritorna ID dell'utente autenticato corrente (dal JWT token).

**Garantisce**:
- User non può vedere/modificare altri utenti
- Query non possono bypassare RLS (anche se codice è sbagliato)

---

## 📝 Note Tecniche

### SSR e Client Components

- **Server Components** (default): Rendering server-side, no JS nel browser
- **Client Components** (`'use client'`): Rendering client-side, interattività

**Utilizzo**:
- Pagine con state/interattività → `'use client'`
- API routes → sempre server-side
- Layout → può essere server component (ma spesso client per hooks)

### localStorage e SSR

**Problema**: `localStorage` non esiste durante SSR.

**Soluzione** (in `usePlayerIdWithManual`):
```typescript
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)  // Solo dopo mount client-side
}, [])

useEffect(() => {
  if (!isMounted) return  // Skip durante SSR
  // Ora può usare localStorage
  const saved = localStorage.getItem('key')
}, [isMounted])
```

### Cache Strategy

**API Routes**:
```typescript
fetch(url, {
  next: { revalidate: 3600 }  // Cache 1 ora (ISR)
})
```

**Client-side fetch**:
- Nessuna cache automatica
- Implementare manualmente se necessario (SWR, React Query)

---

## 🎯 Punti Chiave del Progetto

1. **Centralizzazione Player ID**: Unico punto di configurazione (Profilo Utente), usato automaticamente ovunque
2. **Fallback Manuale**: User può usare app anche senza configurare profilo (localStorage)
3. **Protected Routes**: Tutte le pagine dashboard verificano autenticazione
4. **RLS Security**: Database protegge dati a livello row
5. **Error Handling**: Gestione errori robusta ovunque (try-catch, loading states)
6. **Type Safety**: TypeScript per prevenire errori a compile-time

---

## 🔧 Estensioni Future

### Possibili miglioramenti:

1. **Real-time Updates**: Abilita replication in Supabase per real-time subscription su `users` table
2. **Caching**: Implementare React Query o SWR per cache client-side
3. **Error Boundaries**: React Error Boundaries per gestire errori UI
4. **Optimistic Updates**: Aggiornare UI prima della conferma server
5. **Pagination**: Per liste lunghe (match salvati, etc.)

---

**Documento creato**: Gennaio 2025  
**Versione**: 1.0

