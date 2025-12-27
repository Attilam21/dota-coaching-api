# SIMULAZIONE COSTI PER CLIENTE

## 📊 ANALISI CHIAMATE API

### Chiamate OpenDota per Endpoint Backend

#### 1. `/api/player/${id}/stats`
- **Chiamate OpenDota**: 1 (matches list) + fino a 20 (full match details)
- **Totale**: **1-21 chiamate OpenDota** (dipende da cache)
- **Cache**: 60 secondi per match list, 6 ore per full match
- **Frequenza**: Ogni volta che si apre dashboard/performance/matches

#### 2. `/api/player/${id}/advanced-stats`
- **Chiamate OpenDota**: Simile a stats (matches + full matches)
- **Totale**: **1-21 chiamate OpenDota**
- **Cache**: 60 secondi per match list, 6 ore per full match
- **Frequenza**: Quando si apre performance/advanced pages

#### 3. `/api/player/${id}/role-analysis`
- **Chiamate OpenDota**: 
  - 1 chiamata diretta (`/players/${id}/heroes`)
  - Chiama internamente stats + advanced-stats (che fanno altre chiamate)
- **Totale**: **~23-43 chiamate OpenDota** (1 heroes + 1-21 stats + 1-21 advanced)
- **Cache**: Heroes 24h, matches 60s/6h
- **Frequenza**: Quando si apre role-analysis page

#### 4. `/api/player/${id}/hero-analysis`
- **Chiamate OpenDota**: 
  - 2 chiamate heroes (`/heroes` + `/players/${id}/heroes`)
  - 1 chiamata matches list (`/players/${id}/matches?limit=100`)
  - Fino a 50 full matches (`/matches/${id}`)
- **Totale**: **~3-52 chiamate OpenDota** (2 heroes + 1 matches list + fino a 50 full matches)
- **Cache**: Heroes 24h, matches 60s/6h
- **Frequenza**: Quando si apre hero-analysis page

#### 5. `/api/opendota/heroes`
- **Chiamate OpenDota**: 1
- **Cache**: 24 ore (molto stabile)
- **Frequenza**: Una volta al giorno per utente (poi cachato)

#### 6. `/api/opendota/match/${id}`
- **Chiamate OpenDota**: 1
- **Cache**: 6 ore (match details statici)
- **Frequenza**: Quando si apre una match analysis

#### 7. `/api/player/${id}/peers` (teammates)
- **Chiamate OpenDota**: 1 (`/players/${id}/peers`)
- **Cache**: Probabilmente 60 secondi
- **Frequenza**: Quando si apre teammates page

#### 8. `/api/player/${id}/profile`
- **Chiamate OpenDota**: 1 (`/players/${id}`)
- **Cache**: 60 secondi
- **Frequenza**: Dashboard principale

---

## 👤 SCENARIO UTENTE TIPO

### Sessione Media
- **Permanenza**: 12 minuti
- **Pagine visitate**: 4 pagine
- **Analisi approfondite**: 1-2

### Pattern di Navigazione Tipico

**Scenario 1: Utente Curioso (Light User)**
1. Dashboard principale → 5 chiamate (stats, advanced-stats, profile, wl, benchmarks)
2. Matches page → 1 chiamata (stats - già cachato)
3. Performance page → 2 chiamate (stats, advanced-stats - già cachati)
4. Heroes list → 1 chiamata (heroes - cachato 24h, probabilmente già caricato)
**Totale**: ~5-8 chiamate OpenDota

**Scenario 2: Utente Attivo (Medium User)**
1. Dashboard principale → 5 chiamate
2. Role Analysis → 23-43 chiamate (la più costosa!)
3. Hero Analysis → 3-52 chiamate (dipende da cache matches)
4. Match Analysis (1 match) → 1 chiamata (match details, già cachato se visto prima)
**Totale**: ~32-101 chiamate OpenDota

**Scenario 3: Utente Power User (Heavy User)**
1. Dashboard principale → 5 chiamate
2. Role Analysis → 23-43 chiamate
3. Hero Analysis → 3-52 chiamate (dipende da cache)
4. Performance → 2 chiamate (già cachati)
5. Match Analysis (3 matches) → 0-3 chiamate (dipende da cache, 6h)
6. Teammates → 1 chiamata
7. Coaching Insights → 3-4 chiamate
**Totale**: ~37-110 chiamate OpenDota

---

## 💰 CALCOLO COSTI

### OpenDota API Key Premium (Dati Reali)

**Rate Limits Premium Tier:**
- **Free tier**: 60 chiamate/minuto, 3,000 chiamate/giorno
- **Premium tier**: **3,000 chiamate/minuto**, chiamate illimitate

**Costi Premium Tier:**
- **$0.01 per 100 chiamate** = **$0.0001 per chiamata**
- **€0.00009 per chiamata** (circa, con cambio USD/EUR)
- **Nessun costo fisso mensile** - paghi solo per quello che usi
- **Chiamate 404, 429, 500 non vengono addebitate**

**Vantaggi Premium:**
- Rate limit 50x superiore (3,000/min vs 60/min)
- Chiamate illimitate (no limite giornaliero)
- Supporto prioritario

### Costi per Cliente (per Sessione)

#### Utente Light (5-8 chiamate)
- **Chiamate OpenDota**: 5-8
- **Costo**: €0.00045 - €0.00072 (€0.00009 × 5-8)
- **Impatto rate limit**: Minimo (3,000/min disponibili)

#### Utente Medium (32-101 chiamate)
- **Chiamate OpenDota**: 32-101
- **Costo**: €0.00288 - €0.00909 (€0.00009 × 32-101)
- **Impatto rate limit**: Minimo (3,000/min disponibili)

#### Utente Power (37-110 chiamate)
- **Chiamate OpenDota**: 37-110
- **Costo**: €0.00333 - €0.00990 (€0.00009 × 37-110)
- **Impatto rate limit**: Minimo (3,000/min disponibili)

---

## 📈 COSTI MENSILI PER CLIENTE

### Scenario Conservativo (Utente Light)
- **Sessioni/mese**: 8 sessioni (2 a settimana)
- **Chiamate/sessione**: 6 chiamate (media)
- **Totale chiamate/mese**: 48 chiamate
- **Costo**: **€0.00432/mese** (€0.00009 × 48)
- **Impatto rate limit**: Trascurabile (3,000/min disponibili)

### Scenario Realistico (Utente Medium)
- **Sessioni/mese**: 12 sessioni (3 a settimana)
- **Chiamate/sessione**: 65 chiamate (media tra 32-101)
- **Totale chiamate/mese**: 780 chiamate
- **Costo**: **€0.07020/mese** (€0.00009 × 780)
- **Impatto rate limit**: Minimo (3,000/min disponibili)

### Scenario Power User (Utente Heavy)
- **Sessioni/mese**: 20 sessioni (5 a settimana)
- **Chiamate/sessione**: 75 chiamate (media tra 37-110)
- **Totale chiamate/mese**: 1,500 chiamate
- **Costo**: **€0.13500/mese** (€0.00009 × 1,500)
- **Impatto rate limit**: Minimo (3,000/min disponibili)

---

## 🎯 CAPACITÀ E COSTI PER SCALA

### Scenario: 100 Clienti

### Distribuzione Utenti (Stima Realistica)
- **Light Users**: 60% (60 utenti)
- **Medium Users**: 30% (30 utenti)
- **Power Users**: 10% (10 utenti)

### Calcolo Mensile

**Light Users (60 utenti):**
- 60 utenti × 48 chiamate/mese = **2,880 chiamate/mese**

**Medium Users (30 utenti):**
- 30 utenti × 780 chiamate/mese = **23,400 chiamate/mese**

**Power Users (10 utenti):**
- 10 utenti × 1,500 chiamate/mese = **15,000 chiamate/mese**

**TOTALE**: **41,280 chiamate/mese**
- **Costo totale**: **€3.71520/mese** (€0.00009 × 41,280)

### Rate Limit Analysis

**Con API key Premium (3,000 chiamate/minuto):**
- Chiamate/minuto necessarie: 41,280 / (30 giorni × 24 ore × 60 minuti) = **0.96 chiamate/minuto**
- **Utilizzo rate limit**: **0.032%** (estremamente sotto il limite di 3,000/min)
- **Margine disponibile**: 2,999 chiamate/minuto disponibili

**Con API key free (60 chiamate/minuto):**
- Chiamate/minuto necessarie: 0.96
- **Utilizzo rate limit**: **1.6%** (sotto il limite)
- **Limite giornaliero**: 3,000/giorno → 41,280/mese = 1,376/giorno → **OK** (sotto 3,000)

**Picco simultaneo (utenti contemporanei):**
- **Rate limit Premium**: 3,000/min = **50 chiamate/secondo**
- **Scenario peggiore**: Utenti che fanno role-analysis insieme (40 chiamate ciascuno)
  - 1 utente: 40 chiamate in 3 sec = 13.3/sec → **OK** (13.3 < 50)
  - 3 utenti: 120 chiamate in 3 sec = 40/sec → **OK** (40 < 50)
  - 4 utenti: 160 chiamate in 3 sec = 53.3/sec → **PROBLEMA** (53.3 > 50)
- **Conclusione picco**: Puoi gestire **fino a 3 utenti simultanei** che fanno role-analysis

**Ma considerando:**
- Non tutti gli utenti fanno role-analysis insieme
- Il traffico è distribuito nel tempo (non tutti accedono contemporaneamente)
- La maggior parte delle chiamate sono più leggere (stats, matches, ecc.)
- Con cache, molte chiamate vengono evitate

**Capacità reale stimata:**
- **Traffico distribuito**: 500-1,000 clienti gestibili facilmente
- **Picchi simultanei**: Limitato a 3-4 utenti che fanno role-analysis insieme
- **Soluzione per più clienti**: Implementare queue/rate limiting lato server per distribuire le chiamate

---

## 💡 OTTIMIZZAZIONI PER RIDURRE COSTI

### 1. Cache Migliorata
- **Heroes**: Già cachato 24h ✅
- **Matches**: Cache 60s → aumentare a 5 minuti = **-80% chiamate**
- **Full matches**: Cache 6h → OK ✅

### 2. Fetch Heroes Condiviso
- **Problema attuale**: 7+ fetch separati per heroes
- **Fix**: Hook condiviso = **-85% chiamate heroes**
- **Risparmio**: ~1 chiamata/utente/sessione

### 3. Eliminare Chiamate Duplicate
- **role-analysis**: Riutilizzare dati già fetchati = **-50% chiamate**
- **hero-analysis**: Riutilizzare dati = **-50% chiamate**
- **Risparmio**: ~40-50 chiamate/utente/sessione (per power users)

### 4. Lazy Loading Match Details
- **Problema**: Carica sempre 20 full matches anche se non servono tutti
- **Fix**: Caricare solo quando necessario = **-50% chiamate match details**
- **Risparmio**: ~10-20 chiamate/utente/sessione

---

## 📊 SIMULAZIONE COSTI DOPO OTTIMIZZAZIONI

### Utente Medium (Dopo Ottimizzazioni)
- **Prima**: 70 chiamate/sessione
- **Dopo**: 35 chiamate/sessione (50% riduzione)
- **Risparmio**: 50%

### 100 Clienti (Dopo Ottimizzazioni)
- **Prima**: 41,280 chiamate/mese = **€3.72/mese**
- **Dopo**: ~20,600 chiamate/mese (50% riduzione) = **€1.85/mese**
- **Risparmio**: 20,680 chiamate/mese = **€1.86/mese**

### Picco Simultaneo (Dopo Ottimizzazioni)
- **Prima**: 400 chiamate in 3 secondi (133/sec)
- **Dopo**: 200 chiamate in 3 secondi (67/sec)
- **Rate limit free**: Ancora problema (67/sec > 1/sec)
- **Rate limit Premium**: OK (67/sec < 50/sec = 3,000/min)

---

## 🎯 RACCOMANDAZIONI

### Per Ridurre Costi/Chiamate:
1. ✅ **Aumentare cache matches** da 60s a 5 minuti → -80% chiamate stats
2. ✅ **Hook useHeroes() condiviso** → -85% chiamate heroes
3. ✅ **Eliminare chiamate duplicate** → -50% chiamate role/hero analysis
4. ✅ **Lazy loading match details** → -50% chiamate match details

### Per Gestire Rate Limits:
1. ⚠️ **Implementare queue per chiamate** se molti utenti simultanei
2. ⚠️ **Rate limiting lato server** per distribuire chiamate nel tempo
3. ⚠️ **Priorità chiamate** (heroes > matches > analysis)

### Costi Totali:
- **Costo API OpenDota Premium**: **€0.00009 per chiamata** (pay-per-use)
- **Nessun costo fisso mensile** - paghi solo per quello che usi
- **100 clienti**: ~€3.72/mese (prima ottimizzazioni) → ~€1.85/mese (dopo ottimizzazioni)
- **Costi hosting**: Separati (Vercel/Supabase)

---

## 📝 CONCLUSIONE

### 💰 COSTI PER CLIENTE

**Costi per cliente:**
- **Light user**: ~48 chiamate/mese = **€0.00432/mese** (€0.00009 × 48)
- **Medium user**: ~780 chiamate/mese = **€0.07020/mese** (€0.00009 × 780)
- **Power user**: ~1,500 chiamate/mese = **€0.13500/mese** (€0.00009 × 1,500)

**Costo totale 100 clienti:**
- **41,280 chiamate/mese** = **€3.72/mese** (€0.00009 × 41,280)
- **Costo medio per cliente**: **€0.037/mese** (€3.72 / 100)
- **Dopo ottimizzazioni**: **€1.85/mese** totali = **€0.0185/mese** per cliente

### 🚀 CAPACITÀ REALE - RISPOSTA DIRETTA

**✅ SÌ, PUOI GESTIRE MOLTO PIÙ DI 100 CLIENTI!**

**Con API key Premium (3,000 chiamate/minuto):**

**Calcolo Semplice:**
- Rate limit: **3,000 chiamate/minuto** = **50 chiamate/secondo**
- Media chiamate/utente/sessione: **50 chiamate**
- **Capacità teorica**: 3,000/min ÷ 50 = **60 utenti/minuto**
- **Capacità oraria**: 60 × 60 = **3,600 utenti/ora**

**Capacità Pratica (con margine di sicurezza):**
- ✅ **500-1,000 clienti totali**: Facilmente gestibili con traffico distribuito
- ✅ **100-200 utenti simultanei**: OK (se non tutti fanno role-analysis)
- ⚠️ **Limitazione**: Max 3-4 utenti simultanei che fanno role-analysis insieme

**Esempi Concreti:**

**Scenario 1: 500 Clienti**
- Traffico distribuito: 50 utenti attivi contemporanei (10%)
- Solo 5 fanno role-analysis insieme (10% degli attivi)
- **Risultato**: ✅ **GESTIBILE** (con queue system per role-analysis)

**Scenario 2: 1,000 Clienti**
- Traffico distribuito: 100 utenti attivi contemporanei (10%)
- 10 fanno role-analysis insieme (10% degli attivi)
- **Risultato**: ⚠️ **PROBLEMA** (10 × 40 = 400 chiamate in 3 sec = 133/sec > 50/sec)
- **Soluzione**: Queue system + ottimizzazioni = ✅ **GESTIBILE**

**Scenario 3: 2,000 Clienti (Con Ottimizzazioni)**
- Cache matches aumentata = **-80% chiamate**
- Hook heroes condiviso = **-85% chiamate heroes**
- Eliminare duplicate = **-50% chiamate analysis**
- **Risultato**: ✅ **GESTIBILE** (chiamate ridotte del 50% = più margine)

**Capacità Reale:**
- ✅ **100 clienti**: Facilmente gestibili, nessun problema
- ✅ **500 clienti**: Gestibili con traffico distribuito
- ✅ **1,000 clienti**: Gestibili con ottimizzazioni
- ✅ **2,000-3,000 clienti**: Gestibili con ottimizzazioni + queue system
- ⚠️ **Limitazione**: Picchi simultanei (max 3-4 utenti che fanno role-analysis insieme)

**Rischi:**
- ⚠️ **Picchi simultanei**: Se più di 3-4 utenti fanno role-analysis insieme → rate limiting
- ✅ **Soluzione**: Implementare queue/rate limiting lato server per distribuire chiamate

**Costi per Scala:**
- **100 clienti**: €3.72/mese → €1.85/mese (dopo ottimizzazioni)
- **500 clienti**: €18.60/mese → €9.25/mese (dopo ottimizzazioni)
- **1,000 clienti**: €37.20/mese → €18.50/mese (dopo ottimizzazioni)

**Soluzione per Scalare Oltre 1,000 Clienti:**
- ✅ Implementare ottimizzazioni (cache, hook condiviso, eliminare duplicate) = **risparmio 50% costi**
- ✅ Implementare queue system per distribuire chiamate nel tempo
- ✅ Aumentare cache time per matches (60s → 5 minuti) = **-80% chiamate**
- ✅ Con queste ottimizzazioni = supporta **2,000-3,000 clienti** facilmente

