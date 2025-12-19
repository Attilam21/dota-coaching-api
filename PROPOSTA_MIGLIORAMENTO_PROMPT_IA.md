# 🎯 Proposta Miglioramento Prompt IA e Consigli Specifici

**Obiettivo**: Consigli specifici, non scontati, utili per la crescita nel gioco, con prompt più corti e mirati.

---

## 📊 PROBLEMA ATTUALE

### **Prompt Troppo Lunghi e Generici**
- Max 150-400 parole → Troppo verbose
- Dati poco contestualizzati → AI non sa cosa è importante
- Consigli generici → "Migliora il farm", "Partecipa ai fight"
- Nessun calcolo di priorità → AI non sa cosa suggerire per primo

### **Mancanza di Specificità**
- Non identifica pattern specifici del giocatore
- Non confronta con benchmark reali
- Non calcola gap concreti
- Non suggerisce azioni precise

---

## ✅ SOLUZIONE PROPOSTA

### **1. Calcoli Intelligenti nel Codice** (Prima dell'AI)

#### **A. Identificazione Pattern Specifici**
```typescript
// Calcola pattern reali dal giocatore
const patterns = {
  // Pattern 1: GPM cala dopo 20 minuti
  lateGameFarmDrop: avgGPM_0_20 > avgGPM_20_40 ? {
    drop: avgGPM_0_20 - avgGPM_20_40,
    severity: 'high' | 'medium' | 'low',
    cause: 'farm efficiency', // o 'teamfight participation', 'positioning'
  } : null,
  
  // Pattern 2: Winrate basso con eroi specifici
  heroWeaknesses: heroes.filter(h => h.winrate < 40 && h.games >= 3),
  
  // Pattern 3: Morti concentrate in fase specifica
  deathTiming: {
    early: deaths_0_10 / totalDeaths,
    mid: deaths_10_25 / totalDeaths,
    late: deaths_25_plus / totalDeaths,
  },
  
  // Pattern 4: Item timing sbagliato
  itemTimingIssues: items.filter(item => {
    const avgTiming = item.avgPurchaseTime
    const expectedTiming = getExpectedTiming(item.name, role)
    return avgTiming > expectedTiming * 1.2 // 20% più tardi
  }),
}
```

#### **B. Calcolo Priorità e Gap**
```typescript
// Calcola gap concreti vs benchmark
const gaps = {
  gpm: {
    current: avgGPM,
    benchmark: roleBenchmarks[role].gpm,
    gap: avgGPM - roleBenchmarks[role].gpm,
    gapPercent: ((avgGPM - roleBenchmarks[role].gpm) / roleBenchmarks[role].gpm) * 100,
    priority: calculatePriority('gpm', gapPercent, role),
  },
  // ... altre metriche
}

// Priorità = impatto sulla vittoria × gap × frequenza problema
function calculatePriority(metric, gapPercent, role) {
  const impact = METRIC_IMPACT[metric][role] // 0-1
  const severity = Math.abs(gapPercent) / 100 // 0-1
  return impact * severity
}
```

#### **C. Identificazione Problema Principale**
```typescript
// Trova il problema #1 che causa più perdite
const mainIssue = {
  type: 'farm' | 'positioning' | 'item_choice' | 'timing' | 'teamfight',
  description: 'GPM cala del 25% dopo 20 minuti',
  impact: 'Alto', // Quante partite perse causa
  evidence: [
    { match: 123, gpm_0_20: 550, gpm_20_40: 410, result: 'loss' },
    // ...
  ],
  solution: {
    action: 'Pratica farm pattern dopo 20 minuti',
    specific: 'Quando il teamfight inizia, non abbandonare completamente il farm. Fai 2-3 last hit tra ogni fight.',
    target: 'Mantieni GPM > 450 anche dopo 20 minuti',
  }
}
```

---

### **2. Prompt Corti e Specifici** (Per l'AI)

#### **Struttura Prompt Migliorata**
```
CONTESTO (max 50 parole):
- Ruolo: Carry
- Problema principale: GPM cala 25% dopo 20 minuti (550 → 410)
- Evidenza: 8/10 partite perse quando GPM < 450 dopo 20 min
- Pattern: Abbandona farm completamente quando iniziano teamfight

AZIONE RICHIESTA:
Scrivi 3 bullet points specifici (max 20 parole ciascuno):
1. Cosa fare DURANTE la partita (azione immediata)
2. Cosa praticare TRA le partite (skill da migliorare)
3. Come misurare il miglioramento (metrica target)

TONO: Diretto, assertivo, senza "potresti/dovresti"
```

#### **Esempio Prompt Reale**
```
CONTESTO:
Ruolo: Carry. GPM medio 480 (benchmark: 550, gap: -12.7%). 
Problema: GPM cala da 520 (0-20min) a 380 (20-40min), perdendo 27% efficienza.
Causa identificata: Abbandona farm quando iniziano teamfight (kill participation 85% ma CS/min cala 40%).
Evidenza: 7/10 partite perse quando GPM post-20min < 400.

AZIONE:
Scrivi 3 consigli specifici (max 20 parole ciascuno):
1. Cosa fare DURANTE la partita
2. Cosa praticare TRA le partite  
3. Metrica target per misurare miglioramento

FORMATO: Solo bullet points, niente introduzione.
```

---

### **3. Output Strutturato** (Bullet Points, No Emoji)

#### **Formato Output**
```
• [Azione immediata durante partita] - Target: [metrica specifica]
• [Skill da praticare] - Focus: [aspetto specifico]
• [Come misurare] - Obiettivo: [numero target]
```

#### **Esempio Output**
```
• Durante teamfight, fai 2-3 last hit su creep vicini prima di entrare nel fight. Non abbandonare completamente il farm. Target: Mantieni CS/min > 5 anche durante teamfight phase.

• Pratica pattern di farm "hit and run": attacca 1-2 creep, poi rotazione verso fight, poi torna a farm. Focus: Non fermarti mai completamente, anche durante push/defense.

• Misura: GPM post-20min deve essere > 450 (attualmente 380). Obiettivo: Ridurre gap a < 10% vs benchmark in 10 partite.
```

---

## 🎮 ESEMPIO SIMULATO: Analisi Completa

### **Scenario Giocatore**
```
Player ID: 123456789
Ruolo: Carry
Partite analizzate: 20 ultime partite
```

### **Dati Calcolati** (Nel Codice)
```typescript
const analysis = {
  // Metriche Base
  avgGPM: 480,
  avgXPM: 520,
  avgKDA: 2.1,
  winrate: 45%,
  
  // Benchmark Ruolo
  benchmarkGPM: 550,
  benchmarkXPM: 600,
  benchmarkKDA: 2.5,
  
  // Gap Calcolati
  gaps: {
    gpm: { value: -70, percent: -12.7%, priority: 0.85 },
    xpm: { value: -80, percent: -13.3%, priority: 0.75 },
    kda: { value: -0.4, percent: -16%, priority: 0.60 },
  },
  
  // Pattern Identificati
  patterns: {
    lateGameFarmDrop: {
      detected: true,
      gpm_0_20: 520,
      gpm_20_40: 380,
      drop: 140 (27%),
      severity: 'high',
      matches: [123, 456, 789], // Match ID dove succede
    },
    heroWeaknesses: [
      { hero: 'Anti-Mage', winrate: 35%, games: 5 },
      { hero: 'Spectre', winrate: 40%, games: 4 },
    ],
    deathTiming: {
      early: 15%, // Poche morti early
      mid: 45%,   // Molte morti mid (problema!)
      late: 40%,
    },
    itemTiming: [
      { item: 'Black King Bar', avgTime: 28min, expected: 22min, delay: 27% },
      { item: 'Manta Style', avgTime: 32min, expected: 26min, delay: 23% },
    ],
  },
  
  // Problema Principale (Calcolato)
  mainIssue: {
    type: 'late_game_farm',
    description: 'GPM cala 27% dopo 20 minuti (520 → 380)',
    impact: 'Alto', // 7/10 partite perse quando GPM post-20 < 400
    rootCause: 'Abandona farm completamente durante teamfight phase',
    evidence: [
      { match: 123, gpm_0_20: 530, gpm_20_40: 370, cs_0_20: 120, cs_20_40: 45, result: 'loss' },
      { match: 456, gpm_0_20: 510, gpm_20_40: 390, cs_0_20: 115, cs_20_40: 50, result: 'loss' },
      // ... altri match
    ],
  },
}
```

### **Prompt Generato** (Corto e Specifico)
```
CONTESTO (50 parole):
Ruolo Carry. GPM medio 480 (benchmark 550, gap -12.7%). Problema principale: GPM cala 27% dopo 20 minuti (520→380) perché abbandona farm durante teamfight. Evidenza: 7/10 partite perse quando GPM post-20min < 400. Kill participation alta (85%) ma CS/min cala 40% dopo 20min.

AZIONE:
Scrivi 3 bullet points specifici (max 20 parole ciascuno):
1. Cosa fare DURANTE la partita (azione immediata)
2. Cosa praticare TRA le partite (skill da migliorare)
3. Come misurare il miglioramento (metrica target)

FORMATO: Solo bullet points, niente introduzione, tono diretto.
```

### **Output AI** (Esempio)
```
• Durante teamfight, fai 2-3 last hit su creep vicini prima di entrare nel fight. Non abbandonare completamente il farm. Target: Mantieni CS/min > 5 anche durante teamfight phase.

• Pratica pattern di farm "hit and run": attacca 1-2 creep, poi rotazione verso fight, poi torna a farm. Focus: Non fermarti mai completamente, anche durante push/defense.

• Misura: GPM post-20min deve essere > 450 (attualmente 380). Obiettivo: Ridurre gap a < 10% vs benchmark in 10 partite.
```

---

## 📋 MODIFICHE DA IMPLEMENTARE

### **1. Nuovo Endpoint: `/api/player/[id]/coaching`**
```typescript
// Calcola pattern, gap, priorità
// Genera prompt corto e specifico
// Chiama AI con prompt migliorato
// Ritorna consigli strutturati (bullet points)
```

### **2. Modifiche ai Prompt Esistenti**
- **InsightBadge**: Max 60 parole (non 120-150)
- **AI Summary**: Max 200 parole (non 400)
- **Coaching**: 3 bullet points, max 20 parole ciascuno

### **3. Calcoli Aggiuntivi**
- Pattern detection (late game farm drop, death timing, etc.)
- Gap calculation vs benchmark
- Priority scoring
- Main issue identification

---

## 🎯 RISULTATO ATTESO

### **Prima** (Attuale)
```
"Il tuo GPM è 480, che è sotto il benchmark di 550 per un Carry. 
Dovresti migliorare il farm e partecipare di più ai teamfight. 
Considera di praticare il last hitting e di ottimizzare le tue rotazioni."
```
❌ Troppo generico, non actionable, non specifico

### **Dopo** (Proposto)
```
• Durante teamfight, fai 2-3 last hit su creep vicini prima di entrare nel fight. Target: Mantieni CS/min > 5 anche durante teamfight phase.

• Pratica pattern di farm "hit and run": attacca 1-2 creep, poi rotazione verso fight, poi torna a farm. Focus: Non fermarti mai completamente.

• Misura: GPM post-20min deve essere > 450 (attualmente 380). Obiettivo: Ridurre gap a < 10% in 10 partite.
```
✅ Specifico, actionable, misurabile, non scontato

---

## ✅ CONFERMA

**Ho capito:**
1. ✅ Ridurre lunghezza prompt (max 50 parole contesto)
2. ✅ Calcoli intelligenti nel codice (pattern, gap, priorità)
3. ✅ Consigli specifici e non scontati (3 bullet points, max 20 parole ciascuno)
4. ✅ Formato bullet points, no emoji
5. ✅ Focus su azioni immediate + skill da praticare + metriche target

**Prossimo passo:**
- Aspetto il tuo via per implementare
- Modificherò i prompt e aggiungerò i calcoli pattern/gap/priorità

