# Strategia: Analisi Singola vs Aggregate - Decisione PM

## 📊 Stato Attuale

### Analisi Aggregate (20 partite) - ✅ MOLTO COMPLETA
**Sezioni:**
- ✅ Dashboard: Overview 20 partite, trend, quick stats
- ✅ Performance & Stile: Pattern identificazione, radar chart, trend
- ✅ Profilazione FZTH: AI profiling completo, FZTH Score, trend analysis
- ✅ Advanced Analytics: Lane, Farm, Fights, Vision (4 sezioni dettagliate)
- ✅ Coaching: Task personalizzati, raccomandazioni
- ✅ Hero Analysis: Performance per eroe
- ✅ Role Analysis: Performance per ruolo
- ✅ Teammates: Analisi compagni, sinergie
- ✅ Builds & Items: Analisi build, item stats
- ✅ AI Summary: Riassunti IA

**Valore**: ALTO - Copertura completa per miglioramento continuo

### Analisi Singola Partita (`/analysis/match/[id]`) - ⚠️ INCOMPLETA
**Cosa ha:**
- ✅ Timeline Gold/XP (reale)
- ✅ Performance players (tabelle base)
- ✅ AI Analysis con suggerimenti
- ✅ Key moments (eventi reali)
- ✅ Metriche avanzate (CS/min, Support Score, ecc.)

**Cosa MANCA:**
- ❌ Visualizzazione spaziale (mappa)
- ❌ Analisi dettagliata ward placement (solo numeri, non posizioni)
- ❌ Confronto con altre partite (es. "vs tua media")
- ❌ Analisi draft/team composition
- ❌ Heatmap eventi sulla mappa
- ❌ Analisi fase per fase (early/mid/late dettagliata)
- ❌ Item timing visualization
- ❌ Teamfight analysis dettagliata

## 🎯 Analisi Strategica

### Opzione A: Implementare Mappa Vision (5-7 giorni)
**Pro:**
- ✅ Differenziazione competitiva forte
- ✅ Valore visivo alto
- ✅ Feature "wow" per marketing

**Contro:**
- ❌ Complessità alta (coordinate, rendering, performance)
- ❌ Solo per singola partita
- ❌ Dipende da disponibilità dati log
- ❌ Non risolve altri gap dell'analisi singola

**ROI**: Medio-Alto (feature premium ma limitata)

### Opzione B: Migliorare Analisi Singola (3-4 giorni)
**Features da aggiungere:**
1. **Confronto con Media** (1 giorno)
   - "GPM: 450 (vs tua media: 420, +7%)"
   - "KDA: 2.5 (vs tua media: 2.1, +19%)"
   - Valore: ALTO - contesto immediato

2. **Analisi Fase per Fase** (1 giorno)
   - Early game (0-10min): farm, kills, wards
   - Mid game (10-25min): teamfights, objectives
   - Late game (25+min): decisioni, itemization
   - Valore: ALTO - apprendimento mirato

3. **Item Timing Visualization** (1 giorno)
   - Grafico timeline item acquistati
   - Confronto con timing ottimali
   - Valore: MEDIO-ALTO - utile per itemization

4. **Teamfight Analysis** (1 giorno)
   - Partecipazione teamfight
   - Damage/healing per teamfight
   - Valore: MEDIO - utile per support/carry

**Pro:**
- ✅ Complessità media-bassa
- ✅ Valore immediato per apprendimento
- ✅ Risolve gap evidenti
- ✅ Migliora UX complessiva

**Contro:**
- ❌ Meno "wow" della mappa
- ❌ Non differenziazione visiva forte

**ROI**: ALTO (migliora feature esistente, più utilizzata)

### Opzione C: Approccio Ibrido (6-8 giorni)
**Fase 1** (3-4 giorni): Migliorare analisi singola
- Confronto con media
- Analisi fase per fase
- Item timing
- Teamfight analysis

**Fase 2** (3-4 giorni): Aggiungere mappa vision
- Dopo aver migliorato base
- Come feature premium

**Pro:**
- ✅ Copertura completa
- ✅ Valore incrementale

**Contro:**
- ❌ Tempo totale maggiore
- ❌ Delay su feature premium

## 💡 Raccomandazione: Opzione B + Roadmap

### Priorità Immediata: Migliorare Analisi Singola

**Perché:**
1. **Gap evidente**: Analisi aggregate molto complete, singola incompleta
2. **Valore immediato**: Features più semplici ma più utilizzate
3. **ROI migliore**: 3-4 giorni per 4 features vs 5-7 giorni per 1 feature
4. **Base solida**: Prima migliorare base, poi aggiungere premium

### Roadmap Proposta

**Sprint 1 (3-4 giorni): Migliorare Analisi Singola**
1. Confronto con Media (1 giorno)
2. Analisi Fase per Fase (1 giorno)
3. Item Timing Visualization (1 giorno)
4. Teamfight Analysis (1 giorno)

**Sprint 2 (5-7 giorni): Mappa Vision** (dopo Sprint 1)
- Solo se dati coordinate disponibili
- Come feature premium

### Features Specifiche da Implementare

#### 1. Confronto con Media
```typescript
// Mostrare per ogni metrica:
"GPM: 450"
"vs tua media: 420 (+7% ↗️)"
"vs meta Carry: 480 (-6% ↘️)"
```
**Valore**: Contesto immediato, apprendimento

#### 2. Analisi Fase per Fase
```typescript
// Tab: Early / Mid / Late
Early (0-10min):
- Farm: 45 CS (vs media: 50)
- Kills: 2/1/3
- Wards: 3 placed
- Key: First Blood ottenuto
```
**Valore**: Apprendimento mirato per fase

#### 3. Item Timing
```typescript
// Timeline grafico:
[0:00] Starting items
[5:30] Boots acquistati (vs ottimale: 4:00)
[12:15] First major item (vs ottimale: 11:00)
```
**Valore**: Migliorare itemization

#### 4. Teamfight Analysis
```typescript
// Per ogni teamfight:
Time: 15:30
Participation: ✅ (damage: 1200, healing: 0)
Outcome: Win (2 kills, 0 deaths)
```
**Valore**: Capire impatto teamfight

## 🎯 Conclusione

**Raccomandazione**: **Opzione B - Migliorare Analisi Singola PRIMA**

**Motivazione:**
- Gap più evidente e impattante
- ROI migliore (più features, meno tempo)
- Base solida per feature premium future
- Valore immediato per utenti

**Mappa Vision**: Dopo, come feature premium se dati disponibili

**Timeline:**
- Settimana 1: Migliorare analisi singola (4 features)
- Settimana 2: Test e feedback
- Settimana 3+: Mappa vision (se priorità confermata)

