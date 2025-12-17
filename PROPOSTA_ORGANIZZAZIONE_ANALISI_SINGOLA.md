# Proposta Organizzazione: Analisi Singola Partita

## 📊 Analisi Struttura Attuale

### Menu Laterale Attuale:
1. **ANALISI PLAYER** - Analisi aggregate (20 partite)
   - Panoramica, Performance, Hero Pool, Hero Analysis, Analisi Ruolo

2. **ANALISI TEAM & MATCH** - Team e lista partite
   - Team & Compagni
   - Partite (lista ultime 20)

3. **COACHING & PROFILAZIONE** - Coaching e AI
   - Coaching & Task, Profilazione FZTH, Riassunto IA

4. **ANALISI AVANZATE** - Analisi approfondite aggregate
   - Analisi avanzate (Lane/Farm/Fights/Vision), Build & Items

5. **SISTEMA** - Impostazioni
   - Profilo Utente

### Problema Identificato:
- ❌ "Partite" è solo una lista
- ❌ Analisi singola è in `/analysis/match/[id]` (fuori dal dashboard)
- ❌ Non c'è sezione dedicata all'analisi dettagliata singola partita
- ❌ Le nuove feature (confronto media, fase per fase, item timing, teamfight) non hanno spazio dedicato

## 🎯 Proposta: Nuova Sezione "ANALISI PARTITA"

### Opzione A: Sezione Dedicata (CONSIGLIATA)

**Struttura Menu:**
```
ANALISI TEAM & MATCH
├── Team & Compagni
└── Partite (lista)

ANALISI PARTITA  ← NUOVA SEZIONE
├── Seleziona Partita (hub con lista + selector)
├── Analisi Dettagliata (tabs: Overview, Fasi, Item Timing, Teamfight)
└── Vision Map (se implementata)
```

**Vantaggi:**
- ✅ Separazione chiara: lista vs analisi dettagliata
- ✅ Spazio dedicato per tutte le nuove feature
- ✅ Coerenza con struttura esistente
- ✅ Scalabile per future feature (mappa vision, replay analysis, ecc.)

**Flusso Utente:**
1. Utente va su "Partite" → vede lista ultime 20
2. Clicca su partita → va a "Analisi Partita" → "Seleziona Partita"
3. Seleziona partita → "Analisi Dettagliata" si popola automaticamente
4. Naviga tra tabs: Overview, Fasi, Item Timing, Teamfight

### Opzione B: Espandere "ANALISI TEAM & MATCH"

**Struttura Menu:**
```
ANALISI TEAM & MATCH
├── Team & Compagni
├── Partite (lista)
└── Analisi Partita (hub con tabs)
```

**Vantaggi:**
- ✅ Tutto in una sezione
- ✅ Meno menu items

**Svantaggi:**
- ❌ Sezione troppo grande
- ❌ Confusione tra lista e analisi
- ❌ Meno spazio per future feature

### Opzione C: Trasformare "Partite" in Hub

**Struttura Menu:**
```
ANALISI TEAM & MATCH
├── Team & Compagni
└── Partite (hub: lista + analisi in tabs)
```

**Svantaggi:**
- ❌ Pagina troppo complessa
- ❌ Mix di liste e analisi dettagliata
- ❌ UX confusa

## 💡 Raccomandazione: Opzione A

### Struttura Dettagliata Proposta:

#### 1. "Seleziona Partita" (`/dashboard/match-analysis`)
**Funzione:** Hub centrale per selezionare partita da analizzare
**Contenuto:**
- Lista ultime 20 partite (come "Partite" attuale)
- Search/filter per match ID
- Card partita con: Hero, Risultato, KDA, Data
- Clic su partita → carica "Analisi Dettagliata"

#### 2. "Analisi Dettagliata" (`/dashboard/match-analysis/[id]`)
**Funzione:** Analisi completa singola partita
**Tabs:**
- **Overview** (default): Timeline, Performance base, AI Analysis
- **Fasi di Gioco**: Early/Mid/Late analysis
- **Item Timing**: Timeline item, confronto ottimali
- **Teamfight**: Analisi teamfight dettagliata
- **Vision Map**: (se implementata) Mappa ward

**Features per Tab:**
- **Overview**: Già presente + Confronto con Media
- **Fasi**: Analisi fase per fase (0-10, 10-25, 25+)
- **Item Timing**: Grafico timeline item, timing ottimali
- **Teamfight**: Lista teamfight, partecipazione, outcome

### Menu Laterale Aggiornato:

```typescript
{
  title: 'ANALISI TEAM & MATCH',
  items: [
    { name: 'Team & Compagni', href: '/dashboard/teammates', icon: '👥' },
    { name: 'Partite', href: '/dashboard/matches', icon: '🎮' }, // Lista semplice
  ],
},
{
  title: 'ANALISI PARTITA', // NUOVA
  items: [
    { name: 'Seleziona Partita', href: '/dashboard/match-analysis', icon: '🔍' },
    // "Analisi Dettagliata" accessibile solo dopo selezione partita
    // o come link diretto da "Partite"
  ],
},
```

### Flusso Utente Ottimizzato:

**Scenario 1: Da "Partite"**
1. Utente vede lista in "Partite"
2. Clicca "Vedi Analisi" su una partita
3. → Redirect a `/dashboard/match-analysis/[id]` (Analisi Dettagliata)

**Scenario 2: Da "Seleziona Partita"**
1. Utente va su "Seleziona Partita"
2. Vede lista + può cercare per ID
3. Seleziona partita
4. → Carica "Analisi Dettagliata" con tabs

**Scenario 3: Link Diretto**
1. Utente ha URL `/dashboard/match-analysis/[id]`
2. → Carica direttamente "Analisi Dettagliata"

## 🎨 UX Considerations

### Coerenza:
- ✅ Stesso stile dark theme
- ✅ Stesso layout con tabs
- ✅ HelpButton su ogni tab
- ✅ InsightBadge dove utile

### Navigazione:
- ✅ Breadcrumb: "Partite" → "Analisi Partita" → "Analisi Dettagliata"
- ✅ Link "← Torna a Partite" in analisi dettagliata
- ✅ Sidebar sempre visibile

### Performance:
- ✅ Lazy loading tabs (carica solo tab attivo)
- ✅ Cache dati partita
- ✅ Loading states appropriati

## 📝 Implementazione

### File Structure:
```
app/dashboard/match-analysis/
├── page.tsx (Seleziona Partita - hub)
└── [id]/
    └── page.tsx (Analisi Dettagliata - tabs)
```

### API Routes:
- `/api/match/[id]/analysis` - Analisi completa (già esiste, migliorare)
- `/api/match/[id]/phases` - Analisi fase per fase (nuovo)
- `/api/match/[id]/item-timing` - Item timing (nuovo)
- `/api/match/[id]/teamfights` - Teamfight analysis (nuovo)
- `/api/match/[id]/comparison` - Confronto con media (nuovo)

## ✅ Conclusione

**Raccomandazione Finale: Opzione A - Sezione Dedicata**

**Motivazione:**
1. Separazione chiara responsabilità
2. Spazio per tutte le feature
3. Scalabile per futuro
4. UX più pulita e intuitiva
5. Coerenza con struttura esistente

**Next Steps:**
1. Creare sezione "ANALISI PARTITA" nel menu
2. Implementare "Seleziona Partita" (hub)
3. Implementare "Analisi Dettagliata" con tabs
4. Migrare logica da `/analysis/match/[id]` a `/dashboard/match-analysis/[id]`
5. Aggiungere nuove feature nei tabs

