# 📊 Documentazione Sistema IA - Consigli, Riassunti e Insights

## 🎯 Panoramica Generale

Il sistema IA della piattaforma PRO DOTA ANALISI fornisce **consigli personalizzati** basati sui dati reali del giocatore attraverso **3 meccanismi principali**:

1. **InsightBadge (Lampadine)** - Consigli contestuali on-demand
2. **AI Summary (Riassunti)** - Riassunti completi di profilo e partite
3. **Suggerimenti Anti-Tilt** - Consigli basati su pattern negativi

---

## 💡 1. InsightBadge (Lampadine) - Sistema di Consigli Contestuali

### Come Funziona

**Componente:** `components/InsightBadge.tsx`  
**Endpoint API:** `POST /api/insights/profile`

### Flusso Completo

```
1. Utente clicca sulla lampadina (icona Lightbulb) su una card/sezione
   ↓
2. InsightBadge invia POST a /api/insights/profile con:
   - playerId: ID del giocatore
   - elementType: Tipo di elemento (es. "trend-winrate", "fzth-score")
   - elementId: ID univoco dell'elemento
   - contextData: Dati contestuali (valori, trend, metriche)
   ↓
3. L'endpoint costruisce un prompt specifico in base a elementType
   ↓
4. Chiama Gemini API (o OpenAI come fallback) per generare il consiglio
   ↓
5. Ritorna il testo generato
   ↓
6. InsightBadge mostra un modal con il consiglio
```

### Tipi di Consigli Disponibili (elementType)

| Tipo | Descrizione | Dati Contesto |
|------|-------------|---------------|
| `attilalab-score` | Score complessivo AttilaLAB | `{ score, role }` |
| `role` | Analisi del ruolo | `{ role, confidence }` |
| `playstyle` | Stile di gioco | `{ playstyle }` |
| `trend-winrate` | Trend del winrate | `{ direction, value, label, last5, last10 }` |
| `trend-kda` | Trend del KDA | `{ direction, value, label, last5, last10 }` |
| `trend-gpm` | Trend del GPM | `{ direction, value, label }` |
| `trend-xpm` | Trend dello XPM | `{ direction, value, label }` |
| `trend-chart` | Analisi grafico trend | `{ trends, data }` |
| `metric-card` | Valutazione metrica specifica | `{ metricName, value, benchmark }` |
| `phase-analysis` | Analisi fase di gioco | `{ phase, score, strength }` |
| `comparative-analysis` | Analisi comparativa | `{ role, metrics }` |
| `pattern` | Pattern identificati | `{ patterns }` |
| `builds` | Analisi build e item | Varia in base a `elementId` |

### Prompt Engineering

**Tono:** Coach professionale, diretto, assertivo  
**Regole:**
- ❌ NON usare: "potresti", "dovresti", "considera", "guarda", "analizza"
- ✅ Usare: Comandi diretti, azioni concrete, tono autoritario
- **Lunghezza:** 120-150 parole (max)

**Esempio Prompt:**
```
Sei un coach professionale di Dota 2. Il winrate mostra un trend in calo 
(Stabile, valore: -2.5%). Scrivi un feedback diretto (max 120 parole) 
spiegando cosa significa questo trend e cosa fare. Usa un tono professionale 
e autoritario. NON usare "potresti", "dovresti", "considera", "guarda", 
"analizza". Scrivi come un coach che interpreta i dati con precisione.
```

### Provider AI

1. **Primario:** Gemini 1.5 Flash (`GEMINI_API_KEY`)
2. **Fallback:** OpenAI GPT-3.5 Turbo (`OPENAI_API_KEY`)

### Visualizzazione

- **Badge:** Icona lampadina blu in alto a destra/sinistra della card
- **Modal:** Overlay con backdrop blur, mostra il consiglio generato
- **Stati:** Loading, Error, Success
- **Caching:** Il consiglio viene cachato in memoria (non viene rigenerato se già presente)

### Dove Viene Usato

- ✅ Dashboard principale (trend cards)
- ✅ Pagina Profiling (AttilaLAB Score, ruolo, stile)
- ✅ Pagina Performance (metriche, trend)
- ✅ Pagina Hero Analysis (analisi eroi)
- ✅ Pagina Role Analysis (analisi ruolo)
- ✅ Pagina Builds (analisi item e build)
- ✅ Pagina Teammates (analisi compagni)

---

## 📝 2. AI Summary (Riassunti) - Riassunti Completi

### Come Funziona

**Endpoint API:**
- `GET /api/ai-summary/profile/[id]` - Riassunto profilo completo
- `GET /api/ai-summary/match/[id]?playerId=XXX` - Riassunto partita

### Flusso Completo - Profilo

```
1. Utente accede a /dashboard/ai-summary
   ↓
2. La pagina chiama GET /api/ai-summary/profile/[playerId]
   ↓
3. L'endpoint:
   a. Fetcha /api/player/[id]/profile (dati profilo)
   b. Fetcha /api/player/[id]/stats (trend opzionali)
   c. Costruisce un prompt dettagliato con:
      - Ruolo principale e confidenza
      - Stile di gioco
      - AttilaLAB Score
      - Metriche chiave (winrate, GPM, XPM, KDA, ecc.)
      - Punti di forza e debolezze
      - Raccomandazioni
      - Trend (GPM, KDA, Winrate)
      - Analisi fasi (early, mid, late)
      - Pattern identificati
   ↓
4. Chiama Gemini/OpenAI con prompt strutturato
   ↓
5. Genera riassunto completo (max 400 parole)
   ↓
6. Ritorna il riassunto
   ↓
7. La pagina mostra il riassunto formattato
```

### Flusso Completo - Partita

```
1. Utente accede a /analysis/match/[id] e clicca "Riassunto IA"
   ↓
2. Chiama GET /api/ai-summary/match/[id]?playerId=XXX
   ↓
3. L'endpoint:
   a. Fetcha match data da OpenDota
   b. Trova il player nella partita
   c. Fetcha /api/analysis/match/[id] per raccomandazioni
   d. Costruisce prompt con:
      - Dati partita (durata, risultato, eroe, ruolo)
      - Performance (KDA, GPM, XPM, last hits, damage, ecc.)
      - Raccomandazioni dal sistema di analisi
   ↓
4. Chiama Gemini/OpenAI
   ↓
5. Genera riassunto (max 300 parole)
   ↓
6. Mostra nella pagina
```

### Prompt Structure - Profilo

```
Sei un coach professionista di Dota 2. Genera un riassunto completo e 
professionale in italiano del profilo di questo giocatore.

PROFILO GIOCATORE:
- Ruolo principale: [role] ([confidence])
- Stile di gioco: [playstyle]
- AttilaLAB Score: [score]/100

METRICHE CHIAVE:
- Winrate: [winrate]
- GPM medio: [avgGPM]
- XPM medio: [avgXPM]
- KDA medio: [avgKDA]
- Morti medie: [avgDeaths]
- Kill Participation: [killParticipation]

PUNTI DI FORZA: [strengths]
DEBOLEZZE: [weaknesses]
RACCOMANDAZIONI: [recommendations]

TREND: [trends]
ANALISI FASI: [phaseAnalysis]
PATTERN IDENTIFICATI: [patterns]

Genera un riassunto professionale in italiano (max 400 parole) che includa:
1. Analisi del profilo generale del giocatore
2. Ruolo e stile di gioco identificati
3. Punti di forza principali
4. Aree di miglioramento critiche
5. Trend delle performance recenti
6. Raccomandazione strategica principale per il miglioramento

Il tono deve essere professionale, motivazionale e orientato al miglioramento continuo.
```

### Provider AI

- **Primario:** Gemini 1.5 Flash
- **Fallback:** OpenAI GPT-3.5 Turbo
- **Max Tokens:** 1000 (OpenAI), illimitato (Gemini)
- **Temperature:** 0.7

---

## 🛡️ 3. Suggerimenti Anti-Tilt

### Come Funziona

**Endpoint API:** `GET /api/player/[id]/anti-tilt`  
**Pagina:** `/dashboard/anti-tilt`

### Flusso Completo

```
1. Utente accede a /dashboard/anti-tilt
   ↓
2. La pagina chiama GET /api/player/[id]/anti-tilt
   ↓
3. L'endpoint:
   a. Fetcha ultime 50 partite da OpenDota
   b. Calcola:
      - Loss/Win streak
      - Winrate ultime 3/5 partite e oggi
      - Statistiche di recupero
      - Pattern negativi (orari, giorni, eroi peggiori)
   c. Determina livello di tilt (low/medium/high/critical)
   d. Genera suggerimenti basati su regole predefinite
   ↓
4. Ritorna dati strutturati (NON usa AI esterna)
   ↓
5. La pagina mostra:
   - Alert card se tilted
   - Statistiche di recupero
   - Pattern negativi
   - Suggerimenti personalizzati
```

### Suggerimenti Generati (Regole-Based)

**NON usa AI esterna** - Usa regole predefinite:

| Condizione | Suggerimento |
|------------|--------------|
| Loss streak ≥ 5 OR Winrate oggi < 20% | 🚨 CRITICO: Fermati SUBITO, pausa 1+ ora |
| Loss streak ≥ 3 OR Winrate ultime 5 < 30% | ⚠️ ALTO: Pausa 30-60 minuti |
| Loss streak ≥ 2 OR Winrate ultime 3 < 40% | ⚡ MEDIO: Pausa 15-30 minuti |
| Orario peggiore identificato | ⏰ Evita di giocare tra [ora]:00 e [ora+1]:00 |
| Giorno peggiore identificato | 📅 Evita di giocare il [giorno] |
| Eroe con winrate negativo | 🎮 Evita [eroe] (winrate [X]%) |
| Recovery winrate basso | 📉 Winrate dopo sconfitta è [X]%, fai sempre pausa |

### Timer di Pausa

- **Durata:** 30 minuti (configurabile)
- **Persistenza:** localStorage (`anti_tilt_pause_timer`)
- **Funzionalità:** Countdown visibile, reset manuale

---

## 🔧 Configurazione API Keys

### Variabili d'Ambiente Richieste

```env
# Opzione 1: Gemini (consigliato - più economico)
GEMINI_API_KEY=your_gemini_api_key

# Opzione 2: OpenAI (fallback)
OPENAI_API_KEY=your_openai_api_key
# OPPURE
OPEN_AI_API_KEY=your_openai_api_key
# OPPURE
OPEN_AI_KEY=your_openai_api_key
```

### Priorità Provider

1. **Gemini** (se `GEMINI_API_KEY` presente)
2. **OpenAI** (se Gemini fallisce o non configurato)

### Gestione Errori

- **503 Service Unavailable:** Chiavi API non configurate
- **500 Internal Error:** Errore nella generazione
- **Messaggi user-friendly:** Spiegazione chiara all'utente

---

## 📊 Dati Utilizzati per i Consigli

### Per InsightBadge

- **Trend:** Delta winrate, KDA, GPM, XPM
- **Metriche:** Valori assoluti e benchmark
- **Ruolo:** Classificazione ruolo e confidenza
- **Stile:** Playstyle identificato
- **Score:** AttilaLAB Score complessivo
- **Pattern:** Pattern di gioco identificati
- **Build:** Item e build utilizzate

### Per AI Summary - Profilo

- **Profilo completo** da `/api/player/[id]/profile`
- **Statistiche** da `/api/player/[id]/stats`
- **Trend** calcolati
- **Fasi di gioco** (early/mid/late)
- **Pattern** identificati

### Per AI Summary - Partita

- **Match data** da OpenDota
- **Player performance** nella partita
- **Raccomandazioni** da `/api/analysis/match/[id]`

### Per Anti-Tilt

- **Ultime 50 partite** da OpenDota
- **Win/Loss streak** calcolato
- **Winrate** ultime 3/5 partite e oggi
- **Orari/giorni** con winrate peggiore
- **Eroi** con winrate negativo
- **Recovery stats** (tempo medio, winrate dopo sconfitta)

---

## 🎨 Visualizzazione

### InsightBadge

- **Posizione:** Angolo card (top-right, top-left, bottom-right, bottom-left)
- **Icona:** Lampadina blu (`Lightbulb`)
- **Modal:** Overlay scuro con backdrop blur
- **Stati visivi:**
  - 🔵 Default: Lampadina blu
  - ⚪ Loading: Spinner bianco
  - ❌ Error: Messaggio errore nel modal

### AI Summary

- **Pagina dedicata:** `/dashboard/ai-summary`
- **Formattazione:** Testo formattato, paragrafi, evidenziazioni
- **Loading:** Spinner durante generazione
- **Error:** Messaggio chiaro se fallisce

### Anti-Tilt

- **Alert Card:** Rosso/Arancione se tilted
- **Statistiche:** Cards con icone e colori
- **Pattern:** Liste organizzate per categoria
- **Timer:** Countdown visibile

---

## 🔄 Caching e Performance

### InsightBadge

- **Cache in memoria:** Il consiglio viene cachato nello stato React
- **Non rigenera:** Se già presente, mostra direttamente
- **Reset:** Quando si chiude il modal o si apre un altro

### AI Summary

- **Nessun cache:** Ogni chiamata genera nuovo riassunto
- **Motivo:** Dati possono cambiare, riassunto deve essere aggiornato

### Anti-Tilt

- **Cache API:** 30 minuti (`revalidate: 1800`)
- **Timer locale:** Persistente in localStorage

---

## 📈 Statistiche e Monitoraggio

### Logging

- **Console logs:** Provider usato (Gemini/OpenAI)
- **Error logs:** Dettagli errori API
- **Warning logs:** Fallback tra provider

### Metriche da Monitorare

- **Tasso di successo:** % chiamate AI riuscite
- **Tempo di risposta:** Latency media
- **Costo:** Token utilizzati (OpenAI) / Richieste (Gemini)
- **Error rate:** % errori per tipo

---

## 🚀 Miglioramenti Futuri

### Possibili Estensioni

1. **Caching intelligente:** Cache consigli per elementType+contextData
2. **Personalizzazione tono:** Utente può scegliere stile (assertivo/motivazionale/tecnico)
3. **Multi-lingua:** Supporto inglese/altre lingue
4. **Storico consigli:** Salvare consigli generati per riferimento
5. **A/B Testing:** Testare diversi prompt per ottimizzare qualità
6. **Feedback utente:** Sistema di rating consigli per migliorare prompt

---

## 📝 Note Tecniche

### Limitazioni

- **Max tokens OpenAI:** 1000 (configurabile)
- **Max parole prompt:** ~400 (profilo), ~300 (partita)
- **Rate limiting:** Gestito da provider (Gemini/OpenAI)
- **Costo:** Dipende da provider e utilizzo

### Best Practices

1. **Prompt chiari:** Specificare sempre contesto e formato richiesto
2. **Fallback robusto:** Gestire sempre errori e fallback provider
3. **User feedback:** Mostrare sempre stato (loading/error/success)
4. **Caching intelligente:** Cache quando possibile per ridurre costi
5. **Error handling:** Messaggi user-friendly, non tecnici

---

## ✅ Checklist Implementazione

- [x] Endpoint `/api/insights/profile` con supporto multi-tipo
- [x] Componente `InsightBadge` riutilizzabile
- [x] Endpoint `/api/ai-summary/profile/[id]`
- [x] Endpoint `/api/ai-summary/match/[id]`
- [x] Pagina `/dashboard/ai-summary`
- [x] Integrazione InsightBadge in tutte le pagine rilevanti
- [x] Fallback Gemini → OpenAI
- [x] Gestione errori user-friendly
- [x] Sistema Anti-Tilt con suggerimenti rule-based
- [ ] Caching intelligente consigli
- [ ] Storico consigli
- [ ] A/B testing prompt

---

**Ultimo aggiornamento:** 2025-01-XX  
**Versione:** 1.0

