# 🎯 PIANO IMPLEMENTAZIONE: Sistema Verifica Domande

**Data**: 19 Dicembre 2025  
**Basato su**: `VERIFICATION_QUESTIONS_PM_ANALYSIS.md` e `VERIFICATION_QUESTIONS_PROPOSAL.md`

---

## 📋 OVERVIEW

Implementare sistema di verifica Player ID tramite 3 domande personalizzate basate sui dati del giocatore.

---

## 🎯 FUNZIONALITÀ MVP

### ✅ Must Have
1. **3 Domande**:
   - Eroe più giocato (multiple choice 5 opzioni)
   - Ultima partita (eroe o risultato)
   - Statistica range ampio (winrate/KDA)

2. **Disclaimer e Consenso**
3. **3 Tentativi** con feedback
4. **Rate Limiting** base (3 tentativi/giorno per Player ID)
5. **Salvataggio in Supabase** (`dota_account_verified_at`, `dota_verification_method`)

---

## 🏗️ ARCHITETTURA

### 1. API Routes

#### `/api/user/generate-verification-questions`
**Metodo**: `GET`  
**Query Params**: `playerId`  
**Response**:
```typescript
{
  questions: [
    {
      id: "q1",
      type: "hero_most_played",
      question: "Qual è il tuo eroe più giocato?",
      options: ["Anti-Mage", "Invoker", "Pudge", "Phantom Assassin", "Crystal Maiden"],
      // NON includere correctAnswer nel response (sicurezza)
    },
    {
      id: "q2",
      type: "last_match_hero",
      question: "Quale eroe hai giocato nella tua ULTIMA partita?",
      options: ["Anti-Mage", "Invoker", "Pudge", "Phantom Assassin", "Crystal Maiden"],
    },
    {
      id: "q3",
      type: "winrate_range",
      question: "Qual è APPROSSIMATIVAMENTE il tuo winrate nelle ultime 10 partite?",
      options: ["<40%", "40-50%", "50-60%", "60-70%", "70%+"],
    }
  ],
  sessionId: "uuid" // Per tracking tentativi
}
```

**Logica**:
1. Fetch `/api/player/${playerId}/hero-analysis` → Trova eroe più giocato
2. Fetch `/api/player/${playerId}/stats` → Ultima partita + winrate
3. Genera 4 eroi random (escludendo quello corretto)
4. Genera range winrate basato su winrate reale ±10%

---

#### `/api/user/verify-dota-account`
**Metodo**: `POST`  
**Body**:
```typescript
{
  playerId: string,
  sessionId: string,
  answers: {
    q1: string,  // "anti-mage"
    q2: string,  // "pudge"
    q3: string   // "50-60%"
  }
}
```

**Response**:
```typescript
{
  verified: boolean,
  correctAnswers: number,
  totalQuestions: number,
  needsBonusQuestion?: boolean,
  attemptsRemaining: number
}
```

**Logica**:
1. Recupera domande originali (da cache/session)
2. Valida risposte lato server
3. Se 3/3 corrette → Verifica confermata
4. Se 2/3 corrette → Richiedi domanda bonus (opzionale per MVP)
5. Se <2 corrette → Fallito
6. Aggiorna tentativi rimanenti
7. Se verificato → Salva in Supabase:
   - `dota_account_id` = playerId
   - `dota_account_verified_at` = NOW()
   - `dota_verification_method` = 'questions'

---

### 2. Componente UI

#### `components/VerificationFlow.tsx`

**Stati**:
1. `disclaimer` → Checkbox + Button "Inizia"
2. `loading` → "Preparando le domande..."
3. `questions` → Mostra domande una alla volta
4. `submitting` → "Verificando risposte..."
5. `success` → "Verifica completata!"
6. `failure` → "Riprova" o "Contatta Supporto"

**Props**:
```typescript
interface VerificationFlowProps {
  playerId: string
  onVerified: () => void
  onCancel: () => void
}
```

**Design**:
- Progress bar (1/3, 2/3, 3/3)
- Card con domanda prominente
- Radio buttons per opzioni
- Button "Avanti" / "Verifica" (solo quando tutte risposte)
- Messaggi di errore utili

---

### 3. Integrazione Settings Page

**Modifiche a `app/dashboard/settings/page.tsx`**:
1. Aggiungere button "Verifica Account" se Player ID non verificato
2. Mostrare badge "Verificato" se `dota_account_verified_at` non null
3. Aprire modal `VerificationFlow` quando clicca "Verifica"

---

## 📊 DATI NECESSARI

### API Endpoints Esistenti
- ✅ `/api/player/[id]/hero-analysis` → Eroe più giocato
- ✅ `/api/player/[id]/stats` → Ultima partita + winrate
- ✅ `/api/opendota/heroes` → Lista eroi per opzioni random

### Dati da Estrarre
1. **Eroe più giocato**:
   ```typescript
   const heroAnalysis = await fetch(`/api/player/${playerId}/hero-analysis`)
   const topHero = heroAnalysis.heroStats.sort((a, b) => b.games - a.games)[0]
   ```

2. **Ultima partita**:
   ```typescript
   const stats = await fetch(`/api/player/${playerId}/stats`)
   const lastMatch = stats.matches[0] // Prima partita = più recente
   const lastHeroId = lastMatch.hero_id
   ```

3. **Winrate range**:
   ```typescript
   const winrate = stats.stats.winrate.last10
   // Genera range: <40%, 40-50%, 50-60%, 60-70%, 70%+
   ```

---

## 🔒 SICUREZZA

### Rate Limiting
- **3 tentativi/giorno** per Player ID
- **Cooldown 24h** dopo 3 fallimenti
- Tracking in memoria/cache (Redis opzionale per MVP)

### Protezione
- ✅ Validazione **sempre lato server**
- ✅ Risposte corrette **mai esposte nel client**
- ✅ Session ID per tracking tentativi
- ✅ Hash delle risposte (opzionale per MVP)

---

## 📝 IMPLEMENTAZIONE STEP-BY-STEP

### Step 1: API Generate Questions
1. Creare `app/api/user/generate-verification-questions/route.ts`
2. Fetch dati player (hero-analysis, stats)
3. Genera 3 domande con opzioni
4. Salva domande in cache/session (con risposte corrette)
5. Ritorna domande (senza risposte corrette)

### Step 2: API Verify Answers
1. Creare `app/api/user/verify-dota-account/route.ts`
2. Recupera domande originali (da cache/session)
3. Valida risposte
4. Controlla tentativi rimanenti
5. Se verificato → Salva in Supabase

### Step 3: Componente UI
1. Creare `components/VerificationFlow.tsx`
2. Implementare stati (disclaimer, loading, questions, success, failure)
3. Integrare con API routes
4. Aggiungere progress bar e animazioni

### Step 4: Integrazione Settings
1. Modificare `app/dashboard/settings/page.tsx`
2. Aggiungere button "Verifica Account"
3. Aggiungere modal con `VerificationFlow`
4. Mostrare badge "Verificato" se verificato

### Step 5: Testing
1. Test con vari profili giocatori
2. Test rate limiting
3. Test edge cases (poche partite, nessuna partita)
4. Test UX flow completo

---

## 🎨 UI/UX DESIGN

### Disclaimer Screen
```
┌─────────────────────────────────────────┐
│  ⚠️ Verifica Account                     │
├─────────────────────────────────────────┤
│                                         │
│  Per verificare che questo Player ID   │
│  ti appartiene, risponderemo a 3       │
│  domande basate sulle tue statistiche. │
│                                         │
│  ⚠️ IMPORTANTE:                         │
│  • Assicurati di rispondere con        │
│    accuratezza                          │
│  • Hai 3 tentativi per completare      │
│    la verifica                          │
│  • Se non riesci, contatta il supporto │
│                                         │
│  [✓] Ho letto e accetto                │
│                                         │
│  [Inizia Verifica]                     │
└─────────────────────────────────────────┘
```

### Question Screen
```
┌─────────────────────────────────────────┐
│  Domanda 1 di 3                          │
├─────────────────────────────────────────┤
│                                         │
│  Qual è il tuo eroe più giocato?       │
│                                         │
│  ○ Anti-Mage                            │
│  ○ Invoker                              │
│  ● Pudge                                │
│  ○ Phantom Assassin                     │
│  ○ Crystal Maiden                       │
│                                         │
│  [Avanti]                               │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST IMPLEMENTAZIONE

### Backend
- [ ] API `/api/user/generate-verification-questions`
- [ ] API `/api/user/verify-dota-account`
- [ ] Rate limiting (3 tentativi/giorno)
- [ ] Salvataggio in Supabase (`dota_account_verified_at`, `dota_verification_method`)
- [ ] Gestione errori e edge cases

### Frontend
- [ ] Componente `VerificationFlow.tsx`
- [ ] Integrazione in Settings page
- [ ] Badge "Verificato"
- [ ] Progress bar e animazioni
- [ ] Messaggi di errore utili

### Testing
- [ ] Test con vari profili
- [ ] Test rate limiting
- [ ] Test edge cases
- [ ] Test UX flow completo

---

## 🚀 PROSSIMI PASSI

1. **Implementare API routes** (Step 1-2)
2. **Creare componente UI** (Step 3)
3. **Integrare in Settings** (Step 4)
4. **Test e ottimizzazione** (Step 5)

---

**Pronto per iniziare l'implementazione!** 🎯

