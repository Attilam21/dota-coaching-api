# 🔐 Sistema Verifica Tramite Domande Chiave - Proposta

**Data**: 19 Dicembre 2025  
**Alternativa a**: Verifica Match ID  
**Obiettivo**: Validare che il Player ID appartenga all'utente tramite domande personalizzate

---

## 💡 CONCETTO

Invece di chiedere un Match ID, facciamo **3-5 domande** basate sui dati del giocatore che solo il vero proprietario conosce.

### Vantaggi vs Match ID

✅ **Più User-Friendly**
- Non serve cercare un Match ID
- Domande intuitive
- Risposte rapide

✅ **Più Sicuro**
- Richiede conoscenza approfondita delle proprie statistiche
- Difficile da indovinare per estranei
- Combinazione di più domande aumenta sicurezza

✅ **Più Flessibile**
- Può adattarsi a giocatori con poche partite
- Domande diverse per profili diversi
- Fallback se una domanda non è disponibile

---

## 📊 TIPI DI DOMANDE POSSIBILI

### 1. **Domande su Eroi** (Più Sicure)

**Esempi:**
- "Qual è il tuo eroe più giocato?" (Multiple choice con 4 opzioni)
- "Qual è il tuo winrate con [Eroe]?" (Range: 40-50%, 50-60%, 60-70%, 70%+)
- "Quante partite hai giocato con [Eroe]?" (Range: 0-10, 10-20, 20-50, 50+)
- "Qual è il tuo KDA medio con [Eroe]?" (Range: <1.5, 1.5-2.5, 2.5-3.5, 3.5+)

**Dati Disponibili:**
- ✅ `/api/player/[id]/heroes` → Lista eroi con winrate, games, KDA
- ✅ `/api/player/[id]/hero-analysis` → Statistiche dettagliate per eroe

**Sicurezza**: ⭐⭐⭐⭐⭐ (Alta - difficile indovinare)

---

### 2. **Domande su Statistiche Generali**

**Esempi:**
- "Qual è il tuo winrate nelle ultime 10 partite?" (Range: <40%, 40-50%, 50-60%, 60%+)
- "Qual è il tuo KDA medio?" (Range: <1.5, 1.5-2.5, 2.5-3.5, 3.5+)
- "Qual è il tuo GPM medio?" (Range: <400, 400-500, 500-600, 600+)
- "Quante partite hai giocato negli ultimi 30 giorni?" (Range: 0-10, 10-20, 20-50, 50+)

**Dati Disponibili:**
- ✅ `/api/player/[id]/stats` → Winrate, KDA, GPM, XPM
- ✅ `/api/player/[id]/profile` → Statistiche aggregate

**Sicurezza**: ⭐⭐⭐ (Media - statistiche potrebbero essere pubbliche)

---

### 3. **Domande su Ruolo/Stile di Gioco**

**Esempi:**
- "Quale ruolo giochi più spesso?" (Core/Support/Mid/Carry/Offlane)
- "Qual è il tuo stile di gioco principale?" (Aggressivo/Farm Focus/Support/Team Player)
- "Qual è la tua posizione preferita?" (Safelane/Midlane/Offlane/Support)

**Dati Disponibili:**
- ✅ `/api/player/[id]/profile` → Role, playstyle determinati automaticamente
- ✅ `/api/player/[id]/role-analysis` → Analisi ruolo dettagliata

**Sicurezza**: ⭐⭐⭐⭐ (Alta - richiede conoscenza del proprio stile)

---

### 4. **Domande su Match Recenti** (Ibrido)

**Esempi:**
- "Quale eroe hai giocato nella tua ultima partita?" (Multiple choice)
- "Hai vinto o perso la tua ultima partita?" (Vinto/Perso)
- "Quanti kill hai fatto nella tua ultima partita?" (Range: 0-5, 5-10, 10-15, 15+)

**Dati Disponibili:**
- ✅ `/api/player/[id]/stats` → Matches recenti con dettagli

**Sicurezza**: ⭐⭐⭐⭐ (Alta - richiede conoscenza match recente)

---

### 5. **Domande su Pattern/Comportamento**

**Esempi:**
- "Qual è la tua fase di gioco più forte?" (Early/Mid/Late)
- "Quante volte in media muori per partita?" (Range: <5, 5-7, 7-10, 10+)
- "Qual è la tua partecipazione ai teamfight?" (Range: <50%, 50-70%, 70%+)

**Dati Disponibili:**
- ✅ `/api/player/[id]/profile` → Phase analysis, patterns
- ✅ `/api/player/[id]/advanced-stats` → Statistiche avanzate

**Sicurezza**: ⭐⭐⭐ (Media - pattern potrebbero essere deducibili)

---

## 🎯 IMPLEMENTAZIONE PROPOSTA

### Sistema a 3 Domande (Minimo)

**Algoritmo di Selezione:**
1. **Priorità 1**: Domanda su eroe più giocato (sempre disponibile se ha partite)
2. **Priorità 2**: Domanda su winrate/KDA con eroe specifico
3. **Priorità 3**: Domanda su statistiche generali o match recente

**Logica:**
```typescript
// 1. Trova eroe più giocato
const topHero = playerHeroes.sort((a, b) => b.games - a.games)[0]

// 2. Genera domanda 1: "Qual è il tuo eroe più giocato?"
// Opzioni: [topHero, randomHero1, randomHero2, randomHero3]

// 3. Genera domanda 2: "Qual è il tuo winrate con [topHero]?"
// Opzioni: Range basato su winrate reale ±10%

// 4. Genera domanda 3: "Qual è il tuo KDA medio nelle ultime 10 partite?"
// Opzioni: Range basato su KDA reale ±0.5
```

### Validazione

**Regole:**
- ✅ Tutte e 3 le risposte corrette → Verifica confermata
- ⚠️ 2/3 corrette → Richiedi 1 domanda bonus
- ❌ <2 corrette → Verifica fallita (max 3 tentativi al giorno)

**Sicurezza:**
- Probabilità di indovinare a caso: ~1.5% (1/4 * 1/4 * 1/4)
- Con 2/3 corrette: ~6% (richiede domanda bonus)
- Con rate limiting: Sicurezza molto alta

---

## 📋 ESEMPIO FLUSSO UTENTE

### Step 1: Inserimento Player ID
```
Utente inserisce: 8607682237
Sistema: "Verifica il tuo account rispondendo a 3 domande"
```

### Step 2: Domanda 1
```
"Qual è il tuo eroe più giocato?"
○ Invoker
○ Pudge
● Anti-Mage  ← Corretto
○ Phantom Assassin
```

### Step 3: Domanda 2
```
"Qual è il tuo winrate con Anti-Mage?"
○ 40-50%
● 50-60%  ← Corretto (winrate reale: 55%)
○ 60-70%
○ 70%+
```

### Step 4: Domanda 3
```
"Qual è il tuo KDA medio nelle ultime 10 partite?"
○ <1.5
○ 1.5-2.5
● 2.5-3.5  ← Corretto (KDA reale: 2.8)
○ 3.5+
```

### Step 5: Risultato
```
✅ Verifica completata con successo!
Il tuo Player ID è stato verificato e salvato.
```

---

## 🔧 IMPLEMENTAZIONE TECNICA

### API Route: `/api/user/verify-dota-account`

```typescript
POST /api/user/verify-dota-account
Body: {
  playerId: string,
  answers: {
    question1: string,  // "anti-mage" (eroe più giocato)
    question2: string,  // "50-60%" (winrate range)
    question3: string   // "2.5-3.5" (KDA range)
  }
}

Response: {
  verified: boolean,
  correctAnswers: number,
  totalQuestions: number,
  needsBonusQuestion?: boolean
}
```

### Generazione Domande

```typescript
// app/api/user/generate-verification-questions/route.ts
GET /api/user/generate-verification-questions?playerId=8607682237

Response: {
  questions: [
    {
      id: "q1",
      type: "hero_most_played",
      question: "Qual è il tuo eroe più giocato?",
      options: ["Anti-Mage", "Invoker", "Pudge", "Phantom Assassin"],
      correctAnswer: "Anti-Mage"
    },
    {
      id: "q2",
      type: "hero_winrate",
      question: "Qual è il tuo winrate con Anti-Mage?",
      hero: "Anti-Mage",
      options: ["40-50%", "50-60%", "60-70%", "70%+"],
      correctAnswer: "50-60%",
      actualWinrate: 55.2
    },
    {
      id: "q3",
      type: "kda_average",
      question: "Qual è il tuo KDA medio nelle ultime 10 partite?",
      options: ["<1.5", "1.5-2.5", "2.5-3.5", "3.5+"],
      correctAnswer: "2.5-3.5",
      actualKDA: 2.8
    }
  ]
}
```

### Validazione Risposte

```typescript
// Logica di validazione
function validateAnswers(questions, answers) {
  let correct = 0
  
  questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) {
      correct++
    }
  })
  
  // Tutte corrette
  if (correct === questions.length) {
    return { verified: true, needsBonus: false }
  }
  
  // 2/3 corrette → richiedi bonus
  if (correct >= 2 && questions.length === 3) {
    return { verified: false, needsBonus: true }
  }
  
  // <2 corrette → fallito
  return { verified: false, needsBonus: false }
}
```

---

## 🎨 UI/UX PROPOSTA

### Componente: `VerificationQuestions.tsx`

```tsx
// Flow:
// 1. Loading: "Preparando le domande di verifica..."
// 2. Domanda 1 → Mostra opzioni multiple choice
// 3. Domanda 2 → Mostra opzioni multiple choice
// 4. Domanda 3 → Mostra opzioni multiple choice
// 5. Submit → Validazione
// 6. Success → "Verifica completata!"
// 7. Failure → "Risposte non corrette. Riprova domani."
```

**Design:**
- Card con domanda prominente
- 4 opzioni multiple choice (radio buttons)
- Progress bar (1/3, 2/3, 3/3)
- Button "Verifica" solo quando tutte le domande sono risposte
- Animazioni smooth tra domande

---

## 🔒 SICUREZZA

### Rate Limiting
- Max 3 tentativi al giorno per Player ID
- Max 5 tentativi al giorno per utente autenticato
- Cooldown 24h dopo 3 fallimenti

### Logging
- Tracciare tutti i tentativi (successo/fallimento)
- Log timestamp, IP, user_id, player_id
- Alert se pattern sospetto (tentativi multipli su diversi Player ID)

### Protezione Lato Server
- **SEMPRE** validare lato server
- Non esporre risposte corrette nel client
- Hash delle risposte per prevenire reverse engineering

---

## ✅ VANTAGGI vs MATCH ID

| Aspetto | Domande Chiave | Match ID |
|---------|----------------|----------|
| **User Experience** | ⭐⭐⭐⭐⭐ Facile | ⭐⭐⭐ Richiede cercare ID |
| **Sicurezza** | ⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |
| **Implementazione** | ⭐⭐⭐⭐ Media | ⭐⭐⭐⭐⭐ Facile |
| **Flessibilità** | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Bassa |
| **Scalabilità** | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |

---

## 🚀 PROSSIMI PASSI

1. **Implementare API generazione domande**
   - Endpoint `/api/user/generate-verification-questions`
   - Logica selezione domande basata su dati disponibili

2. **Implementare API validazione**
   - Endpoint `/api/user/verify-dota-account`
   - Logica validazione risposte
   - Salvataggio nel DB se verificato

3. **Creare componente UI**
   - `VerificationQuestions.tsx`
   - Integrazione in Settings page

4. **Modificare schema DB**
   - Aggiungere colonne verifica
   - Tracciare tentativi

5. **Test e ottimizzazione**
   - Test con vari profili giocatori
   - Aggiustare difficoltà domande
   - Ottimizzare UX

---

## ❓ DOMANDE DA DECIDERE

1. **Quante domande?**
   - 3 (minimo, più veloce)
   - 5 (più sicuro, più lungo)

2. **Tipo di domande preferite?**
   - Solo eroi (più sicuro)
   - Mix eroi + statistiche (più flessibile)
   - Match recenti (più facile per utente)

3. **Tolleranza errori?**
   - 3/3 corrette obbligatorie (più sicuro)
   - 2/3 corrette + bonus (più user-friendly)

4. **Rate limiting?**
   - 3 tentativi/giorno (più sicuro)
   - 5 tentativi/giorno (più user-friendly)

---

**Aspetto il tuo feedback per procedere!** 🎯

