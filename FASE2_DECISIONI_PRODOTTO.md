# FASE 2 — DECISIONI DI PRODOTTO
## Cosa TOGLIERE, TENERE, SPOSTARE

---

## 🎯 PRINCIPI APPLICATI

1. **Ogni sezione = una sola domanda**
2. **Overview ≠ Analisi di dettaglio**
3. **Se una metrica è già mostrata, non va ripetuta**
4. **Meno elementi = più valore**
5. **Se indeciso → togliere**

---

## ❌ TOGLIERE (Rimozione Completa)

### 1. **KPI Cards (3 card)**
**Motivazione UX**:
- Winrate già mostrato in ProfileHeaderCard
- KDA e GPM già mostrati in Snapshot Stato Forma con più contesto (trend)
- Aggiungono solo rumore senza valore aggiuntivo
- Overview deve essere più snella

**Impatto**: Rimozione di 3 card, semplificazione Overview

---

### 2. **Snapshot Stato Forma - Winrate Trend Card**
**Motivazione UX**:
- Winrate già mostrato in ProfileHeaderCard (ultime 20)
- Winrate già mostrato in Statistiche Globali (globale vs recente)
- Duplicato non necessario in Overview
- Le altre 2 card (KDA Trend, Farm Trend) sono sufficienti

**Impatto**: Riduzione da 4 a 3 card in Snapshot Stato Forma

---

### 3. **Ultime Partite (Grid 5 card) - Tab Matches**
**Motivazione UX**:
- Le partite sono già mostrate in Key Matches (Overview)
- KDA e GPM già mostrati altrove
- C'è già un link "Vedi tutte →" che porta a `/dashboard/matches`
- La lista completa appartiene a una pagina dedicata, non Overview

**Impatto**: Rimozione grid, mantenere solo link "Vedi tutte →"

---

## ✅ TENERE (Mantenere in Overview)

### 1. **ProfileHeaderCard**
**Motivazione UX**:
- Risponde a "Chi sono io?"
- Winrate qui è contestualizzato (identità giocatore)
- Essenziale per orientamento

---

### 2. **Hero Pool**
**Motivazione UX**:
- Risponde a "Su quali eroi performo meglio?"
- Domanda unica, nessun overlap
- InsightBulb aggiunge valore decisionale

---

### 3. **Key Matches**
**Motivazione UX**:
- Risponde a "Quali partite devo analizzare?"
- Domanda unica, actionable
- CTA "Vai all'analisi" guida all'azione

---

### 4. **Snapshot Stato Forma - KDA Trend + Farm Trend (2 card)**
**Motivazione UX**:
- Mostrano trend (last5 vs last10) che non è duplicato
- Rispondono a "Come sta andando la mia forma recente?"
- Trend è diverso da media semplice
- **RIMUOVERE Winrate Trend** (già mostrato in ProfileHeaderCard)

---

### 5. **InsightBulb (condizionale)**
**Motivazione UX**:
- Risponde a "Cosa devo fare ora?"
- Solo quando c'è trend significativo
- Aggiunge valore decisionale

---

## 🔄 SPOSTARE (Da Overview a Tab Trends)

### 1. **Trend Grafico (Ultime 20 Partite)**
**Motivazione UX**:
- Mostra evoluzione temporale (analisi di dettaglio)
- Non è "overview" ma "trend analysis"
- Appartiene a Trends & Statistiche
- **SPOSTARE da Overview Tab a Trends Tab**

**Posizione**: Dopo "Statistiche Globali" in Trends Tab

---

## 📊 OVERVIEW TAB - STRUTTURA FINALE

### **Layout Proposto**:

```
1. ProfileHeaderCard
   └─ Winrate (ultime 20), Rank, Ultima partita

2. Hero Pool (sinistra) + Key Matches (destra)
   └─ Hero Pool: Top 8 eroi + InsightBulb
   └─ Key Matches: Best/Worst/Outlier + CTA

3. Snapshot Stato Forma (2 card)
   └─ KDA Trend (last5, last10, delta)
   └─ Farm Trend (GPM/XPM last5, last10)

4. InsightBulb (condizionale)
   └─ Solo se trend significativo
```

**Totale Sezioni Overview**: 4 (da 6)
**Riduzione**: -33% elementi

---

## 📊 TRENDS TAB - STRUTTURA FINALE

### **Layout Proposto**:

```
1. Statistiche Globali (3 card)
   └─ Winrate Globale, Vittorie, Confronto

2. Trend Grafico (SPOSTATO da Overview)
   └─ KDA, GPM, Winrate per match

3. Snapshot Stato Forma - Winrate Trend (SPOSTATO da Overview)
   └─ Winrate Trend (last5, last10, delta)

4. Benchmark & Percentili (3 card)
   └─ GPM, XPM, KDA percentile

5. Quick Recommendations
6. Phase Analysis
7. Heatmap Partite
8. Quick Stats Cards
```

**Aggiunte**: +2 sezioni (Trend Grafico, Winrate Trend)
**Motivazione**: Analisi di dettaglio, non overview

---

## 📊 MATCHES TAB - STRUTTURA FINALE

### **Layout Proposto**:

```
1. Link "Vedi tutte →" (mantenere)
   └─ Porta a /dashboard/matches

2. Analisi Approfondite (4 link)
   └─ Performance, Profiling, Analisi Avanzate, Coaching
```

**Rimozioni**: Grid "Ultime Partite"
**Motivazione**: Lista completa appartiene a pagina dedicata

---

## 🎯 DECISIONI CHIAVE

### **Principio Applicato**: "Overview ≠ Analisi di dettaglio"

**Overview deve rispondere a**:
1. "Chi sono io?" → ProfileHeaderCard
2. "Su quali eroi performo meglio?" → Hero Pool
3. "Quali partite devo analizzare?" → Key Matches
4. "Come sta andando la mia forma recente?" → Snapshot Stato Forma (KDA + Farm Trend)

**Trends deve rispondere a**:
1. "Come performo nel lungo termine?" → Statistiche Globali
2. "Come evolve la mia performance nel tempo?" → Trend Grafico
3. "Come sono rispetto agli altri?" → Benchmark
4. "Cosa devo migliorare?" → Recommendations

---

## 📈 METRICHE FINALI - OVERVIEW

### **Winrate**: 1 volta (ProfileHeaderCard)
### **KDA**: 1 volta (Snapshot Stato Forma - KDA Trend)
### **GPM**: 1 volta (Snapshot Stato Forma - Farm Trend)

**Prima**: Winrate 5x, KDA 6x, GPM 5x
**Dopo**: Winrate 1x, KDA 1x, GPM 1x
**Riduzione**: -80% duplicati

---

## ✅ CRITERIO DI SUCCESSO

### **Prima**:
- 15 sezioni totali
- 3 metriche duplicate (Winrate 5x, KDA 6x, GPM 5x)
- 6 sezioni con overlap
- Overview: 6 sezioni

### **Dopo**:
- 13 sezioni totali (-2)
- 0 metriche duplicate in Overview
- 0 sezioni con overlap in Overview
- Overview: 4 sezioni (-33%)

### **Risultato**:
- ✅ Dashboard più semplice
- ✅ Utente capisce cosa fare dopo (Key Matches con CTA)
- ✅ Meno dati, più decisioni (InsightBulb, Hero Pool, Key Matches)

---

**FINE FASE 2 — DECISIONI PRODOTTO**

