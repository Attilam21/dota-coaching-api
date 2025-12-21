# FASE 1 — ANALISI DASHBOARD
## Analisi Completa Sezioni e Metriche

---

## 📊 SEZIONI IDENTIFICATE

### **OVERVIEW TAB** (Tab Principale)

#### 1. **ProfileHeaderCard**
- **Domanda UX**: "Chi sono io come giocatore?"
- **Metriche mostrate**:
  - Winrate (ultime 20 partite)
  - Ultima partita (timestamp)
  - Rank/MMR
  - Total matches (ultime 20)
- **Problemi**: Nessuno evidente

---

#### 2. **KPI Cards (3 card)**
- **Domanda UX**: "Quali sono le mie metriche principali?"
- **Metriche mostrate**:
  - **Card 1**: Win Rate % (ultime 20 partite)
  - **Card 2**: KDA Medio (ultime 20 partite)
  - **Card 3**: Farm Medio GPM (ultime 20 partite)
- **Problemi**:
  - ⚠️ **DUPLICATO**: Winrate già mostrato in ProfileHeaderCard
  - ⚠️ **RIDONDANZA**: KDA e GPM verranno mostrati anche in "Snapshot Stato Forma"

---

#### 3. **Hero Pool**
- **Domanda UX**: "Su quali eroi performo meglio?"
- **Metriche mostrate**:
  - Top 8 eroi (min 2 partite)
  - Winrate per eroe
  - Numero partite per eroe
  - InsightBulb con suggerimento pool
- **Problemi**: Nessuno evidente

---

#### 4. **Key Matches (Partite Chiave)**
- **Domanda UX**: "Quali partite devo analizzare?"
- **Metriche mostrate**:
  - Best Match (KDA più alto)
  - Worst Match (KDA più basso)
  - Match Outlier (deviazione dalla media)
  - KDA per ogni match
  - InsightBulb per ogni match
- **Problemi**: Nessuno evidente

---

#### 5. **Snapshot Stato Forma (4 card)**
- **Domanda UX**: "Come sta andando la mia forma recente?"
- **Metriche mostrate**:
  - **Card 1 - Winrate Trend**: last5, last10, delta
  - **Card 2 - KDA Trend**: last5, last10, delta
  - **Card 3 - Farm Trend**: GPM last5/last10, XPM last5/last10
- **Problemi**:
  - ⚠️ **DUPLICATO PARZIALE**: KDA e GPM già mostrati in KPI Cards (ma qui con trend)
  - ⚠️ **RIDONDANZA**: Winrate già mostrato in ProfileHeaderCard e KPI Cards

---

#### 6. **InsightBulb (condizionale)**
- **Domanda UX**: "Cosa devo fare ora?"
- **Metriche mostrate**: Solo se delta winrate >= 10% o <= -10%
- **Problemi**: Nessuno evidente

---

### **TRENDS TAB** (Tab Trend & Statistiche)

#### 7. **Statistiche Globali (3 card)**
- **Domanda UX**: "Come performo nel lungo termine?"
- **Metriche mostrate**:
  - Winrate Globale (storico totale)
  - Vittorie Totali
  - Confronto: Globale vs Recente (10 partite)
- **Problemi**:
  - ⚠️ **RIDONDANZA**: Winrate già mostrato in Overview (ma qui è globale vs recente)

---

#### 8. **Benchmark & Percentili (3 card)**
- **Domanda UX**: "Come sono rispetto agli altri giocatori?"
- **Metriche mostrate**:
  - GPM percentile
  - XPM percentile
  - KDA percentile
- **Problemi**:
  - ⚠️ **RIDONDANZA**: GPM, XPM, KDA già mostrati in Overview (ma qui con contesto percentile)

---

#### 9. **Quick Recommendations**
- **Domanda UX**: "Cosa devo migliorare?"
- **Metriche mostrate**: 3 raccomandazioni testuali
- **Problemi**: Nessuno evidente

---

#### 10. **Phase Analysis**
- **Domanda UX**: "In quale fase del gioco sono più forte?"
- **Metriche mostrate**:
  - Early Game score
  - Mid Game score
  - Late Game score
- **Problemi**: Nessuno evidente

---

#### 11. **Heatmap Partite**
- **Domanda UX**: "Quando giochi meglio (giorno/ora)?"
- **Metriche mostrate**:
  - Winrate per giorno/ora
  - Top 3 orari migliori
- **Problemi**: Nessuno evidente

---

#### 12. **Trend Ultime 20 Partite (Grafico)**
- **Domanda UX**: "Come evolve la mia performance nel tempo?"
- **Metriche mostrate**:
  - Grafico lineare: KDA, GPM, Winrate % per ogni match
- **Problemi**:
  - ⚠️ **RIDONDANZA**: KDA, GPM, Winrate già mostrati in Overview (ma qui come trend temporale)

---

#### 13. **Quick Stats Cards (4 card)**
- **Domanda UX**: "Quali sono le mie metriche avanzate?"
- **Metriche mostrate**:
  - Last Hits (media)
  - Hero Damage (media)
  - Kill Participation (media)
  - Net Worth (media)
- **Problemi**: Nessuno evidente

---

### **MATCHES TAB** (Tab Partite)

#### 14. **Ultime Partite (Grid 5 card)**
- **Domanda UX**: "Quali sono le mie ultime partite?"
- **Metriche mostrate**:
  - Match ID
  - Win/Loss
  - KDA
  - GPM
- **Problemi**:
  - ⚠️ **RIDONDANZA**: KDA e GPM già mostrati in Overview e Trends
  - ⚠️ **DUPLICATO**: Le partite sono già mostrate in Key Matches (ma qui lista completa)

---

#### 15. **Analisi Approfondite (4 link)**
- **Domanda UX**: "Dove posso andare per analisi dettagliate?"
- **Metriche mostrate**: Nessuna (solo link)
- **Problemi**: Nessuno evidente

---

## 🔍 PROBLEMI IDENTIFICATI

### **DUPLICATI COMPLETI**
1. **Winrate**:
   - ProfileHeaderCard (ultime 20)
   - KPI Card 1 (ultime 20)
   - Snapshot Stato Forma - Winrate Trend (last5, last10, delta)
   - Statistiche Globali (globale vs recente)
   - Trend Grafico (per match)

2. **KDA**:
   - KPI Card 2 (media ultime 20)
   - Snapshot Stato Forma - KDA Trend (last5, last10, delta)
   - Key Matches (per 3 match)
   - Ultime Partite (per 5 match)
   - Trend Grafico (per match)
   - Benchmark Percentile

3. **GPM**:
   - KPI Card 3 (media ultime 20)
   - Snapshot Stato Forma - Farm Trend (last5, last10)
   - Ultime Partite (per 5 match)
   - Trend Grafico (per match)
   - Benchmark Percentile

### **RIDONDANZE (stessa metrica, contesto diverso)**
1. **Winrate**: Mostrato 5 volte con contesti diversi (overview, trend, globale, grafico)
2. **KDA**: Mostrato 6 volte con contesti diversi
3. **GPM**: Mostrato 5 volte con contesti diversi

### **SEZIONI CHE RISPONDONO ALLA STESSA DOMANDA**
1. **"Quali sono le mie metriche principali?"**:
   - KPI Cards
   - Snapshot Stato Forma
   - Quick Stats Cards (parzialmente)

2. **"Come performo recentemente?"**:
   - KPI Cards
   - Snapshot Stato Forma
   - Trend Grafico

3. **"Quali partite devo analizzare?"**:
   - Key Matches
   - Ultime Partite

### **ELEMENTI CHE AGGIUNGONO RUMORE**
1. **KPI Cards**: Mostrano metriche già visibili altrove
2. **Snapshot Stato Forma**: Overlap con KPI Cards (stesse metriche con trend)
3. **Ultime Partite**: Overlap con Key Matches (stesse partite, formato diverso)
4. **Trend Grafico**: Mostra metriche già presenti in Overview

---

## 📋 SUMMARY

### **Totale Sezioni**: 15
### **Metriche Duplicate**: 3 (Winrate, KDA, GPM)
### **Sezioni con Overlap**: 6
### **Elementi Rumore**: 4

### **Principali Problemi**:
1. Winrate mostrato 5 volte
2. KDA mostrato 6 volte
3. GPM mostrato 5 volte
4. Overview ha troppe sezioni che mostrano le stesse metriche
5. Snapshot Stato Forma è ridondante con KPI Cards

---

## ✅ SEZIONI BEN PROGETTATE (Nessun problema)
- ProfileHeaderCard
- Hero Pool
- Key Matches
- Quick Recommendations
- Phase Analysis
- Heatmap Partite
- Analisi Approfondite (link)

---

**FINE FASE 1 — ANALISI COMPLETA**

