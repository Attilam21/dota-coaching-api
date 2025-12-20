# 🎮 Proposta Mini-Giochi - PRO DOTA ANALISI

**Obiettivo**: Aumentare tempo di permanenza e engagement degli utenti  
**Approccio**: Mini-giochi integrati nel contesto Dota 2, educativi e coinvolgenti

---

## 🎯 STRATEGIA ENGAGEMENT

### Perché Mini-Giochi?
1. **Aumenta tempo di permanenza**: Utenti restano più a lungo sulla piattaforma
2. **Aumenta ritorno**: Utenti tornano per completare sfide
3. **Educativo**: Insegna meccaniche di gioco mentre diverte
4. **Social**: Leaderboard e condivisione risultati
5. **Monetizzazione**: Possibilità di premium features per mini-giochi avanzati

---

## 🎲 OPZIONI MINI-GIOCHI (Ranked per Fattibilità)

### 🥇 OPZIONE 1: **DOTA QUIZ CHALLENGE** (CONSIGLIATO)

**Idea**: Quiz interattivo su meccaniche Dota 2, eroi, item, strategie

**Perché è la migliore**:
- ✅ **Fattibilità**: Facile da implementare (solo frontend + database quiz)
- ✅ **Educativo**: Insegna mentre diverte
- ✅ **Riusabile**: Database quiz può crescere nel tempo
- ✅ **Engagement**: Leaderboard, streak, achievement
- ✅ **Non invasivo**: Si integra perfettamente nel dashboard

**Implementazione**:
- Database quiz (Supabase): domande, risposte, difficoltà, categoria
- Componente React: Quiz interattivo con timer, feedback immediato
- Sistema punteggi: Punti per risposta corretta, bonus per velocità
- Leaderboard: Classifica settimanale/mensile
- Achievement: Badge per completamenti, streak, categorie

**Tempo sviluppo**: 3-5 giorni  
**Complessità**: Bassa-Media

---

### 🥈 OPZIONE 2: **PREDICTION GAME**

**Idea**: Predici il risultato delle tue prossime partite (win/loss, KDA, GPM)

**Perché è interessante**:
- ✅ **Coinvolgente**: Utente si impegna a predire le proprie performance
- ✅ **Educativo**: Impara a valutare le proprie capacità
- ✅ **Social**: Confronta predizioni con altri utenti
- ✅ **Riusabile**: Ogni partita è una nuova sfida

**Implementazione**:
- Form predizione: Win/Loss, KDA range, GPM range
- Verifica post-partita: Confronta predizione vs realtà
- Sistema punteggi: Punti per accuratezza predizioni
- Leaderboard: Migliori predittori

**Tempo sviluppo**: 4-6 giorni  
**Complessità**: Media (richiede integrazione con match history)

---

### 🥉 OPZIONE 3: **HERO MASTERY CHALLENGE**

**Idea**: Sfide giornaliere/settimanali per migliorare con eroi specifici

**Perché è utile**:
- ✅ **Pratico**: Spinge utente a giocare e migliorare
- ✅ **Gamificato**: Achievement, progress bar, rewards
- ✅ **Personalizzato**: Basato sulle performance reali dell'utente
- ✅ **Riusabile**: Nuove sfide ogni settimana

**Implementazione**:
- Sfide settimanali: "Gioca 5 partite con Support", "Raggiungi 60% winrate con Carry"
- Tracking progress: Monitora progresso verso obiettivo
- Rewards: Badge, XP, unlock features
- Leaderboard: Classifica per categoria eroe

**Tempo sviluppo**: 5-7 giorni  
**Complessità**: Media-Alta (richiede tracking match real-time)

---

### 🎯 OPZIONE 4: **ITEM BUILD PUZZLE**

**Idea**: Puzzle game dove devi costruire build ottimali per situazioni

**Perché è educativo**:
- ✅ **Educativo**: Insegna item builds e timing
- ✅ **Interattivo**: Drag & drop, feedback immediato
- ✅ **Varietà**: Infinite combinazioni
- ✅ **Competitivo**: Leaderboard per build migliori

**Implementazione**:
- Scenario generator: Situazioni di gioco (es. "Enemy team ha 3 carry")
- Item selector: Drag & drop items per creare build
- Validator: Sistema che valuta build (AI o rule-based)
- Punteggio: Basato su efficacia build

**Tempo sviluppo**: 6-8 giorni  
**Complessità**: Alta (richiede logica complessa)

---

### 🎲 OPZIONE 5: **DOTA TRIVIA DAILY**

**Idea**: Trivia giornaliera con domande casuali, streak bonus

**Perché è semplice**:
- ✅ **Semplice**: Versione semplificata del Quiz
- ✅ **Giornaliero**: Ritorno quotidiano garantito
- ✅ **Streak**: Bonus per giorni consecutivi
- ✅ **Social**: Condividi risultati

**Implementazione**:
- 1 domanda al giorno (random dal database)
- Streak counter: Giorni consecutivi
- Bonus: Punti extra per streak
- Achievement: Badge per streak (7, 30, 100 giorni)

**Tempo sviluppo**: 2-3 giorni  
**Complessità**: Bassa

---

## 💡 RACCOMANDAZIONE FINALE

### 🏆 **DOTA QUIZ CHALLENGE** (Opzione 1)

**Perché**:
1. **Bilanciamento perfetto**: Fattibilità vs Engagement
2. **Scalabile**: Database quiz può crescere nel tempo
3. **Educativo**: Allinea con obiettivo piattaforma (coaching)
4. **Non invasivo**: Si integra naturalmente
5. **Monetizzabile**: Premium features (quiz avanzati, hint, skip)

**Features Minime (MVP)**:
- ✅ Quiz con 10 domande random
- ✅ 4 opzioni multiple choice
- ✅ Timer (30 secondi per domanda)
- ✅ Punteggio finale
- ✅ Leaderboard base
- ✅ Achievement base (completato quiz, streak)

**Features Avanzate (Futuro)**:
- ⭐ Categorie quiz (Heroi, Items, Meccaniche, Strategie)
- ⭐ Difficoltà (Facile, Medio, Difficile)
- ⭐ Modalità multiplayer (sfida amici)
- ⭐ Quiz personalizzati (basati su performance utente)
- ⭐ Hint system (premium)
- ⭐ Quiz giornalieri tematici

---

## 🛠️ IMPLEMENTAZIONE TECNICA

### Database Schema (Supabase)

```sql
-- Tabella Quiz
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT NOT NULL, -- 'heroes', 'items', 'mechanics', 'strategy'
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  correct_answer TEXT NOT NULL,
  wrong_answers TEXT[] NOT NULL, -- Array di 3 risposte sbagliate
  explanation TEXT, -- Spiegazione risposta corretta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Quiz Sessions (risultati utente)
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- secondi
  category TEXT,
  difficulty TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Leaderboard
CREATE TABLE quiz_leaderboard (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  PRIMARY KEY (user_id)
);

-- Tabella Achievements
CREATE TABLE quiz_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'first_quiz', 'perfect_score', 'streak_7', etc.
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);
```

### Componenti React

```
components/
  quiz/
    QuizGame.tsx          # Componente principale quiz
    QuizQuestion.tsx      # Singola domanda
    QuizResults.tsx       # Risultati e leaderboard
    QuizLeaderboard.tsx  # Classifica globale
    QuizAchievements.tsx # Badge e achievement
```

### API Routes

```
app/api/
  quiz/
    questions/route.ts        # GET: Fetch domande random
    submit/route.ts          # POST: Submit risultato quiz
    leaderboard/route.ts    # GET: Leaderboard
    achievements/route.ts   # GET: Achievement utente
```

### Integrazione Dashboard

- **Nuova sezione**: `/dashboard/quiz` o `/dashboard/games`
- **Widget sidebar**: Badge con punteggio attuale, link rapido
- **Notification**: "Nuovo quiz disponibile!" quando streak è attivo

---

## 📊 METRICHE SUCCESSO

### KPIs da tracciare:
1. **Tempo di permanenza**: +X% dopo introduzione quiz
2. **Ritorno utenti**: % utenti che tornano per completare quiz
3. **Engagement**: Numero quiz completati per utente
4. **Social sharing**: Condivisioni risultati/achievement
5. **Conversion premium**: % utenti che upgrade per features premium

---

## 🚀 ROADMAP IMPLEMENTAZIONE

### Fase 1: MVP (3-5 giorni)
- [ ] Database schema quiz
- [ ] 50 domande iniziali (manuali o AI-generated)
- [ ] Componente Quiz base
- [ ] Sistema punteggi
- [ ] Leaderboard base
- [ ] Integrazione dashboard

### Fase 2: Engagement (2-3 giorni)
- [ ] Achievement system
- [ ] Streak counter
- [ ] Notifiche
- [ ] Widget sidebar

### Fase 3: Premium (2-3 giorni)
- [ ] Categorie quiz
- [ ] Difficoltà
- [ ] Hint system
- [ ] Quiz personalizzati

---

## 💰 MONETIZZAZIONE

### Free Tier:
- 1 quiz al giorno
- Leaderboard base
- Achievement base

### Premium Tier (€9.99/mese):
- Quiz illimitati
- Quiz avanzati (difficoltà alta)
- Hint system
- Quiz personalizzati
- Statistiche dettagliate
- Badge esclusivi

---

## ✅ CONCLUSIONE

**Raccomandazione**: Implementare **DOTA QUIZ CHALLENGE** come primo mini-gioco.

**Vantaggi**:
- ✅ Bilanciamento perfetto fattibilità/engagement
- ✅ Educativo e allineato con obiettivo piattaforma
- ✅ Scalabile e monetizzabile
- ✅ Non invasivo, si integra naturalmente

**Prossimo step**: Conferma approvazione e procedo con implementazione MVP.

