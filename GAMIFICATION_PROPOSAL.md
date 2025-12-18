# 🎮 Proposta Gamification - Dota 2 Coaching Platform

**Data**: Dicembre 2025  
**Status**: 📋 Proposta - In attesa approvazione

---

## ✅ COSA ABBIAMO GIÀ

### Database Schema (Già Pronto!)
- ✅ `user_stats` table: `total_xp`, `level`, `matches_analyzed`, `modules_completed`
- ✅ `achievements` table: definizione achievement con XP reward
- ✅ `user_achievements` table: tracking achievement sbloccati
- ✅ Function SQL `add_user_xp()`: gestione automatica XP e livelli
- ✅ Trigger automatico: crea `user_stats` alla registrazione

### Dati Disponibili da Tracciare
- Match analizzati (`match_analyses` table)
- Progresso moduli (`learning_progress` table)
- Statistiche performance (da OpenDota API)
- Utilizzo features (analisi avanzate, builds, hero analysis, etc.)

---

## 🎯 PROPOSTA GAMIFICATION

### **⚠️ APPROCCIO ALTERNATIVO: Usare Progressione OpenDota**

**DOMANDA CHIAVE:** Invece di creare un sistema XP/Level nostro, usiamo i **rankings/ratings** che OpenDota già fornisce?

**Vantaggi:**
- ✅ **Dati già disponibili** - OpenDota traccia già rankings, percentiles, progressione
- ✅ **Basato su performance reali** - Non dati "artificiali" ma miglioramenti effettivi
- ✅ **Meno complessità** - Non dobbiamo tracciare tutto noi
- ✅ **Più autentico** - Mostra miglioramenti reali nel gioco

**Endpoint OpenDota già disponibili:**
- `/players/{id}/ratings` - Percentiles per GPM, XPM, KDA
- `/players/{id}/rankings` - Ranking globale e per ruolo
- `/players/{id}` - Winrate, match history, statistiche

**Idea:** 
- Usare **rankings di OpenDota** come "progressione visibile"
- Creare achievement basati su **miglioramenti reali** (es. percentile migliorato del 10%)
- Mostrare progressione usando dati OpenDota invece di XP/Level nostri

**Vuoi procedere con questo approccio o preferisci sistema XP/Level nostro?**

---

## 🎯 PROPOSTA GAMIFICATION (APPROCCIO IBRIDO)

### **1. Sistema XP e Livelli** ⭐ PRIORITÀ ALTA

**Cosa:**
- XP guadagnati per ogni azione (analisi match, completamento moduli, etc.)
- Livelli progressivi con badge visibili
- Progress bar verso prossimo livello

**Come guadagnare XP:**
- ✅ Analizzare una match: **50 XP**
- ✅ Completare un modulo learning: **100 XP**
- ✅ Prima analisi avanzata: **25 XP**
- ✅ Analisi build personalizzata: **30 XP**
- ✅ Login giornaliero (daily streak): **10 XP** (solo primo login del giorno)
- ✅ Completare profiling page: **50 XP**

**Formula Livelli:**
- Livello N = `floor(total_xp / 1000) + 1`
- Progress bar = `(total_xp % 1000) / 1000 * 100`

**Dove mostrare:**
- Navbar (badge livello + XP progress bar)
- Dashboard page (card "Il Tuo Progresso")
- Profile page (se creiamo una pagina profilo)

**Effort:** 🟢 Basso (database già pronto, manca solo UI e API calls)

---

### **2. Achievement System** ⭐ PRIORITÀ ALTA

**Categorie Achievement:**

#### 📊 **Analysis Achievements**
- "First Analysis" - Analizza la tua prima match (50 XP)
- "Analyst" - Analizza 10 match (200 XP)
- "Deep Diver" - Analizza 50 match (500 XP)
- "Master Analyst" - Analizza 100 match (1000 XP)
- "Build Explorer" - Analizza 5 build personalizzate (150 XP)
- "Hero Specialist" - Completa analisi hero per 10 eroi diversi (300 XP)

#### 📚 **Learning Achievements**
- "Student" - Completa il primo modulo (100 XP)
- "Scholar" - Completa 5 moduli (400 XP)
- "Graduate" - Completa 10 moduli (800 XP)
- "Professor" - Completa tutti i moduli (1500 XP)

#### 🎯 **Performance Achievements** (basati su miglioramenti reali)
- "Improver" - Migliora winrate del 5% nelle ultime 20 match (300 XP)
- "Climber" - Migliora MMR di 500 punti (500 XP)
- "Consistent" - Mantieni winrate >55% per 30 match consecutive (400 XP)

#### 🔥 **Streak Achievements**
- "Dedicated" - Login 3 giorni consecutivi (50 XP)
- "Committed" - Login 7 giorni consecutivi (150 XP)
- "Unstoppable" - Login 30 giorni consecutivi (500 XP)

#### 🏆 **Special Achievements**
- "Early Adopter" - Utente registrato nelle prime 100 (200 XP)
- "Explorer" - Usa tutte le features (builds, hero analysis, advanced) (300 XP)
- "Perfectionist" - Completa profiling con score >80 (250 XP)

**Come funziona:**
1. Creiamo achievement records in `achievements` table
2. Check automatici dopo ogni azione (analisi match, completamento modulo, login)
3. API endpoint per check/unlock achievement
4. Notifica UI quando si sblocca achievement (toast/notification)

**Effort:** 🟡 Medio (database pronto, serve logica check + UI notifications)

---

### **3. Daily Streak System** ⭐ PRIORITÀ MEDIA

**Cosa:**
- Traccia giorni consecutivi di login
- Bonus XP per streak (es. +10% XP per ogni giorno di streak)
- Visualizzazione streak nel dashboard

**Implementazione:**
- Aggiungere colonna `login_streak` e `last_login_date` in `user_stats`
- Check al login: se `last_login_date` è ieri → incrementa streak, altrimenti reset a 1
- Bonus XP: `base_xp * (1 + streak * 0.1)` (max +100% = 2x XP)

**Effort:** 🟢 Basso-Medio (serve aggiungere colonne e logica login)

---

### **4. Progress Tracking & Visualizations** ⭐ PRIORITÀ ALTA

**Cosa mostrare:**

#### Dashboard Widget "Il Tuo Progresso"
- Level badge grande (es. "Level 15")
- XP progress bar (es. "850 / 1000 XP")
- Next level preview ("150 XP per Level 16")
- Recent achievements (ultimi 3 sbloccati)
- Daily streak counter

#### Achievement Gallery Page
- Grid di tutti gli achievement disponibili
- Colore/opacità per unlocked/locked
- Progress per achievement progressivi (es. "7/10 match analizzate")
- Filter per categoria

**Effort:** 🟢 Basso (solo UI, dati già disponibili)

---

### **5. Leaderboard (Opzionale)** ⭐ PRIORITÀ BASSA

**Cosa:**
- Classifica globale per:
  - Total XP / Level
  - Match analizzate
  - Achievement sbloccati
  - Streak attuale

**Privacy:**
- Solo username pubblici (no email/ID privati)
- Option per opt-out dalla leaderboard

**Effort:** 🟡 Medio-Alto (serve query aggregati, caching, privacy)

---

## 🔒 PERSISTENZA DEI DATI - RISPOSTA COMPLETA

### ❌ **NO, NIENTE SI AZZERA AL RELOGIN!**

**Perché i dati sono persistenti:**

1. **Database Persistente (Supabase)**
   - Tutti i dati sono salvati nel database PostgreSQL
   - `user_stats`, `match_analyses`, `user_achievements` sono legati a `user_id` (UUID permanente)
   - L'UUID `user_id` **NON cambia mai**, anche dopo logout/login
   - Quando fai login, recuperi sempre lo stesso `user_id` → tutti i dati associati

2. **Come funziona l'autenticazione:**
   ```
   Registrazione → Crea user_id UUID (es. "abc-123-def")
   Login → Recupera stesso user_id "abc-123-def"
   Logout → Session si cancella, MA user_id rimane nel database
   Relogin → Recupera di nuovo "abc-123-def" → TUTTI I DATI CI SONO ANCORA
   ```

3. **Trigger automatico alla registrazione:**
   ```sql
   -- Quando crei account, viene creato automaticamente:
   INSERT INTO user_stats (user_id) VALUES ('abc-123-def')
   -- Questo record rimane PER SEMPRE legato a quel user_id
   ```

### ✅ **Cosa rimane dopo logout/login:**

- ✅ **XP e Level**: Persistono (sono in `user_stats`)
- ✅ **Achievement sbloccati**: Persistono (sono in `user_achievements`)
- ✅ **Match analizzate**: Persistono (sono in `match_analyses`)
- ✅ **Progress moduli**: Persistono (sono in `learning_progress`)
- ✅ **Daily Streak**: **SPECIALE** - richiede logica specifica (vedi sotto)

### 🔥 **Daily Streak - Logica Speciale**

Il Daily Streak **NON si azzera** al logout/login, ma richiede una logica specifica:

**Implementazione proposta:**
```sql
-- Aggiungere a user_stats:
login_streak INTEGER DEFAULT 0,  -- Giorni consecutivi
last_login_date DATE              -- Ultima data login
```

**Al login (API endpoint `/api/user/login-tracking`):**
```javascript
// Pseudocodice
const today = new Date().toDateString() // "2025-12-20"
const lastLogin = user_stats.last_login_date // "2025-12-19" o NULL

if (!lastLogin) {
  // Primo login mai → streak = 1
  streak = 1
} else if (lastLogin === yesterday) {
  // Login ieri → incrementa streak
  streak = user_stats.login_streak + 1
} else if (lastLogin === today) {
  // Già loggato oggi → mantieni streak (no incremento)
  streak = user_stats.login_streak
} else {
  // Ultimo login > 1 giorno fa → RESET streak
  streak = 1
}

// Aggiorna database
UPDATE user_stats 
SET login_streak = streak, 
    last_login_date = today
WHERE user_id = ...
```

**Chiamata al login:**
- Nella pagina Dashboard o in un `useEffect` quando `user` diventa non-null
- Check se `last_login_date !== today` → aggiorna streak
- Se incrementato → mostra notifica "🔥 Streak: 5 giorni!"

### 🎯 **Riassunto Persistenza:**

| Dato | Dove è salvato | Si azzera al relogin? |
|------|----------------|----------------------|
| XP | `user_stats.total_xp` | ❌ NO |
| Level | `user_stats.level` | ❌ NO |
| Achievement | `user_achievements` | ❌ NO |
| Match salvate | `match_analyses` | ❌ NO |
| Progress moduli | `learning_progress` | ❌ NO |
| Daily Streak | `user_stats.login_streak` | ⚠️ NO (ma serve logica per incrementare/resetare) |

---

## 🎮 TRACKING NUOVE PARTITE GIOCATE - RISPOSTA COMPLETA

### **Come Rileviamo Nuove Partite?**

**Problema:** L'utente gioca partite su Dota 2, ma noi come facciamo a sapere quante ne ha fatte?

**Soluzione a 3 Livelli:**

### **1. Partite Analizzate (Già Tracciate) ✅**

**Come funziona:**
- Quando l'utente salva un'analisi match → salvata in `match_analyses`
- Contiamo: `SELECT COUNT(*) FROM match_analyses WHERE user_id = ...`
- Già abbiamo `matches_analyzed` in `user_stats`

**Limiti:** Conta solo partite analizzate sulla piattaforma, NON tutte le partite giocate.

---

### **2. Partite Giocate Totali (Da OpenDota API) ⭐ NUOVO**

**Come funziona:**

#### **Step A: Tracciamento in Database**

Aggiungere a `user_stats`:
```sql
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_matches_played INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_match_check TIMESTAMPTZ;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_seen_match_id BIGINT; -- Ultimo match_id visto
```

#### **Step B: API Endpoint per Check Nuove Partite**

**Endpoint:** `/api/user/check-new-matches`

**Logica:**
```javascript
1. Prendi dota_account_id dell'utente (da users table o localStorage)
2. Se non ha dota_account_id → skip (niente da tracciare)
3. Fetch partite recenti da OpenDota: `/api/players/{dota_account_id}/matches?limit=50`
4. Confronta con last_seen_match_id:
   - Se last_seen_match_id è NULL → tutte le partite sono "nuove"
   - Altrimenti, conta partite con match_id > last_seen_match_id
5. Aggiorna:
   - total_matches_played += nuove partite
   - last_seen_match_id = match_id più recente
   - last_match_check = NOW()
6. Assegna XP per nuove partite (es. 5 XP per partita)
7. Check achievement (es. "Analyst" dopo 10 partite)
```

#### **Step C: Quando Fare il Check?**

**Opzioni:**

**A) Al Login (Raccomandato)**
- Check automatico quando utente fa login
- Pro: Utente vede subito nuovi achievement/XP
- Contro: Aggiunge latenza al login

**B) On-Demand (Dashboard)**
- Check quando utente visita Dashboard
- Chiamata in background (non blocca UI)
- Pro: Nessun impatto sul login
- Contro: Se utente non visita dashboard, non vedrà progressi

**C) Periodico (Cron Job / Scheduled)**
- Check automatico ogni X ore (es. ogni 6 ore)
- Pro: Sempre aggiornato
- Contro: Richiede cron job o serverless function

**Raccomandazione:** **A + B combinati**
- Check leggero al login (solo ultime 10 partite)
- Check completo quando visita Dashboard (ultime 50 partite)

#### **Step D: Frontend Integration**

**In Dashboard:**
```javascript
useEffect(() => {
  if (user && playerId) {
    // Check nuove partite in background
    fetch('/api/user/check-new-matches')
      .then(res => res.json())
      .then(data => {
        if (data.newMatches > 0) {
          // Mostra notifica: "🎮 5 nuove partite rilevate! +25 XP"
          // Refresh user stats
        }
      })
  }
}, [user, playerId])
```

---

### **3. Achievement Basati su Partite Giocate**

**Nuovi Achievement:**

```sql
-- Partite Giocate (Totali, da OpenDota)
INSERT INTO achievements (name, description, category, xp_reward) VALUES
('First Steps', 'Gioca la tua prima partita su Dota 2', 'games_played', 50),
('Dedicated Player', 'Gioca 10 partite', 'games_played', 200),
('Active Player', 'Gioca 50 partite', 'games_played', 500),
('Veteran', 'Gioca 100 partite', 'games_played', 1000),

-- Partite Analizzate (Sulla Piattaforma)
('Analyst', 'Analizza 10 match', 'analysis', 300),
('Deep Diver', 'Analizza 50 match', 'analysis', 800),
('Master Analyst', 'Analizza 100 match', 'analysis', 1500),

-- Settimanali/Mensili
('Weekly Warrior', 'Gioca 10 partite in una settimana', 'temporal', 300),
('Monthly Grinder', 'Gioca 50 partite in un mese', 'temporal', 800);
```

**Check Achievement:**
- Dopo ogni check nuove partite, verificare se achievement vengono sbloccati
- Esempio: Se `total_matches_played >= 10` → sblocca "Dedicated Player"

---

### **Esempio Implementazione Completa**

#### **Database Schema Update:**
```sql
-- Aggiungere colonne a user_stats
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS total_matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_match_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_seen_match_id BIGINT;

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_user_stats_last_match_check 
ON user_stats(last_match_check);
```

#### **API Endpoint: `/api/user/check-new-matches`**
```typescript
// Pseudocodice
export async function POST(request: NextRequest) {
  const { user } = await getAuthUser(request)
  
  // 1. Get dota_account_id
  const { data: userData } = await supabase
    .from('users')
    .select('dota_account_id')
    .eq('id', user.id)
    .single()
  
  if (!userData?.dota_account_id) {
    return NextResponse.json({ 
      success: false, 
      message: 'No Dota account linked' 
    })
  }
  
  // 2. Get user stats
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('last_seen_match_id, total_matches_played')
    .eq('user_id', user.id)
    .single()
  
  // 3. Fetch recent matches from OpenDota
  const matchesResponse = await fetch(
    `https://api.opendota.com/api/players/${userData.dota_account_id}/matches?limit=50`
  )
  const matches = await matchesResponse.json()
  
  // 4. Filter new matches
  const lastSeenMatchId = userStats?.last_seen_match_id || 0
  const newMatches = matches.filter(m => m.match_id > lastSeenMatchId)
  
  if (newMatches.length === 0) {
    return NextResponse.json({ 
      success: true, 
      newMatches: 0,
      message: 'No new matches' 
    })
  }
  
  // 5. Update user_stats
  const newTotal = (userStats?.total_matches_played || 0) + newMatches.length
  const latestMatchId = matches[0].match_id // Most recent
  
  await supabase
    .from('user_stats')
    .update({
      total_matches_played: newTotal,
      last_seen_match_id: latestMatchId,
      last_match_check: new Date().toISOString()
    })
    .eq('user_id', user.id)
  
  // 6. Award XP (5 XP per partita)
  const xpToAdd = newMatches.length * 5
  await supabase.rpc('add_user_xp', {
    p_user_id: user.id,
    p_xp: xpToAdd
  })
  
  // 7. Check achievements
  await checkAndUnlockAchievements(user.id, {
    totalMatchesPlayed: newTotal
  })
  
  return NextResponse.json({
    success: true,
    newMatches: newMatches.length,
    xpGained: xpToAdd,
    newTotal: newTotal
  })
}
```

#### **Frontend: Check al Login/Dashboard**
```typescript
// In app/dashboard/page.tsx
useEffect(() => {
  if (user && playerId) {
    // Check nuove partite in background (non blocca UI)
    fetch('/api/user/check-new-matches', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.newMatches > 0) {
          // Mostra toast notification
          showToast(
            `🎮 ${data.newMatches} nuove partite rilevate! +${data.xpGained} XP`,
            'success'
          )
          // Refresh user stats per mostrare nuovo XP/Level
          refetchUserStats()
        }
      })
      .catch(err => console.error('Failed to check new matches:', err))
  }
}, [user, playerId])
```

---

### **Considerazioni Importanti**

#### **1. Rate Limiting OpenDota**
- OpenDota ha limiti: ~60 requests/min
- Usare cache (1 ora) per evitare troppe chiamate
- Check non troppo frequenti (max 1 ogni 30 minuti)

#### **2. Privacy**
- L'utente DEVE avere `dota_account_id` salvato
- Se non ha account linkato → skip tracking
- L'utente può disabilitare il tracking nelle settings

#### **3. Accuracy**
- Usiamo `match_id` (crescente) per determinare nuove partite
- `match_id` più alto = partita più recente
- Funziona perché Dota 2 usa match_id incrementali

#### **4. Edge Cases**
- Se utente non gioca per mesi → al relogin vedrà tutte le partite come "nuove"
- Possiamo limitare a max 100 partite "nuove" per check (evitare spam XP)
- Se `last_seen_match_id` è molto vecchio → reset a match_id più recente (non contare tutto)

---

### **Riepilogo**

| Cosa Tracciamo | Come | Dove |
|----------------|------|------|
| Partite Analizzate | Conta `match_analyses` | `user_stats.matches_analyzed` |
| Partite Giocate Totali | Fetch OpenDota API + confronto `match_id` | `user_stats.total_matches_played` |
| Ultimo Check | Timestamp ultimo controllo | `user_stats.last_match_check` |
| Ultimo Match Visto | `match_id` più recente visto | `user_stats.last_seen_match_id` |

**Flow completo:**
1. Utente gioca 5 partite su Dota 2
2. Utente fa login / visita Dashboard
3. Sistema check: `/api/user/check-new-matches`
4. Fetch partite da OpenDota (match_id: 100, 99, 98, 97, 96)
5. Confronta con `last_seen_match_id` (es. 95)
6. Trova 5 nuove partite (100, 99, 98, 97, 96)
7. Aggiorna: `total_matches_played += 5`, `last_seen_match_id = 100`
8. Assegna: `+25 XP` (5 partite × 5 XP)
9. Check achievement: se `total_matches_played >= 10` → sblocca "Dedicated Player"
10. Frontend mostra notifica: "🎮 5 nuove partite! +25 XP"

---

## 📋 PIANO DI IMPLEMENTAZIONE

### **FASE 1: Foundation** (1-2 giorni)
1. ✅ Creare API endpoint `/api/user/stats` per leggere `user_stats`
2. ✅ Creare API endpoint `/api/user/xp` per aggiungere XP (usa function SQL esistente)
3. ✅ Creare API endpoint `/api/achievements` per listare achievement
4. ✅ Creare API endpoint `/api/user/achievements` per achievement utente
5. ✅ Popolare `achievements` table con achievement iniziali

### **FASE 2: XP System** (1 giorno)
1. ✅ Integrare XP rewards nelle azioni esistenti:
   - Analisi match → +50 XP
   - Completamento moduli → +100 XP
   - Login daily → +10 XP (solo primo login)
2. ✅ UI Component: `UserLevelBadge` (navbar)
3. ✅ UI Component: `XPProgressBar` (dashboard)
4. ✅ Dashboard widget "Il Tuo Progresso"

### **FASE 3: Achievement System** (2-3 giorni)
1. ✅ Sistema di check achievement dopo azioni
2. ✅ API endpoint per check/unlock achievement
3. ✅ UI Component: `AchievementCard` (per gallery)
4. ✅ UI Component: `AchievementNotification` (toast quando si sblocca)
5. ✅ Achievement Gallery page (`/dashboard/achievements`)

### **FASE 4: Daily Streak** (1 giorno)
1. ✅ Aggiungere colonne `login_streak`, `last_login_date` a `user_stats`
2. ✅ Logica streak check al login
3. ✅ Bonus XP per streak
4. ✅ UI: Streak counter nel dashboard

### **FASE 5: Polish & Enhancements** (1 giorno)
1. ✅ Animazioni quando si guadagna XP
2. ✅ Sound effects (opzionale, può essere fastidioso)
3. ✅ Notifiche push per milestone importanti (es. nuovo livello)
4. ✅ Analytics tracking (quali achievement sono più popolari)

---

## 🎨 UI/UX DESIGN SUGGESTIONS

### Level Badge Design
```
┌─────────────────┐
│   LEVEL 15      │  ← Badge colorato (oro per livelli alti)
│  ⭐⭐⭐⭐⭐      │  ← Stelle basate su livello
│   850/1000 XP   │  ← Progress bar sotto
└─────────────────┘
```

### Achievement Card Design
```
┌─────────────────────────────┐
│ [🔒 ICON]  First Analysis   │  ← Locked (grigio)
│ ─────────────────────────── │
│ Analizza la tua prima match │
│ Reward: 50 XP               │
│ Progress: 0/1               │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [✅ ICON]  First Analysis   │  ← Unlocked (colorato)
│ ─────────────────────────── │
│ Analizza la tua prima match │
│ Reward: 50 XP               │
│ Unlocked: 2 giorni fa       │
└─────────────────────────────┘
```

### Dashboard Progress Widget
```
┌─────────────────────────────────┐
│        Il Tuo Progresso          │
│                                  │
│         LEVEL 15                 │
│       ⭐⭐⭐⭐⭐                  │
│                                  │
│   ████████████░░░░  850/1000 XP  │
│   150 XP per Level 16            │
│                                  │
│   🔥 Streak: 5 giorni            │
│   📊 Match analizzate: 42        │
│   🏆 Achievement: 12/25          │
│                                  │
│   Recent Achievements:           │
│   ✅ Analyst (2 giorni fa)       │
│   ✅ Student (5 giorni fa)       │
└─────────────────────────────────┘
```

---

## 🔧 CONSIDERAZIONI TECNICHE

### Performance
- Cache `user_stats` nel context/state per evitare troppe query
- Check achievement in background (non bloccare UI)
- Usa database functions SQL per atomicità (già fatto per XP)

### Scalability
- Achievement check può essere pesante → fare in modo asincrono
- Leaderboard: limitare a top 100, cache per 5 minuti

### Privacy
- Solo dati pubblici in leaderboard (username, level, achievement count)
- Option per nascondere profilo pubblico

### Compatibilità
- Non rompere funzionalità esistenti
- Retroattivo: utenti esistenti ricevono XP per match già analizzati? (decidere)
- Gradual rollout: iniziare con pochi achievement, aggiungere nel tempo

---

## 💡 SUGGERIMENTI AGGIUNTIVI

### Personalization
- Badge/Titles basati su achievement (es. "Master Analyst" come title)
- Avatar frames/decoration basati su livello
- Color themes per livello (bronze/silver/gold/platinum)

### Social Features (Future)
- Condividere achievement su social
- Confronto con amici (se aggiungiamo friend system)
- Guild/Teams con achievement collettivi

### Monetization (Future)
- Premium achievement (esclusivi per subscribers)
- XP boost per premium users
- Custom titles/avatars per premium

---

## ❓ DOMANDE DA DECIDERE

1. **XP retroattivo?** Diamo XP agli utenti per match già analizzate?
   - **Pro:** Utenti esistenti si sentono inclusi
   - **Contro:** Potrebbe essere molto XP da calcolare

2. **Leaderboard pubblica o privata?**
   - **Pubblica:** Più competitivo, più engagement
   - **Privata:** Più privacy, meno pressione

3. **Quanti achievement inizialmente?**
   - **Pochi (10-15):** Più facile da implementare, meno confusione
   - **Molti (30+):** Più content, ma più lavoro

4. **Sound effects/animazioni?**
   - **Sì:** Più engaging
   - **No:** Meno invasivo, meglio per UX professionale

---

## ✅ RACCOMANDAZIONE FINALE

**Iniziare con:**
1. ✅ **FASE 1 + FASE 2** (XP System e Progress UI) - Quick win, alto valore
2. ✅ **FASE 3** (Achievement System base con 10-15 achievement) - Engagement
3. ✅ **FASE 4** (Daily Streak) - Retention
4. ⏸️ **FASE 5** (Polish) - Quando tutto funziona bene

**Evitare inizialmente:**
- Leaderboard (complessità, privacy concerns)
- Social sharing (out of scope per ora)
- Sound effects (può essere fastidioso)

---

**Aspetto il tuo feedback per procedere!** 🚀

