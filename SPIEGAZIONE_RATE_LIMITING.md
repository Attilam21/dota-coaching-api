# 🔍 Spiegazione Rate Limiting - OpenDota API

**Data**: Gennaio 2025  
**Contesto**: API key OpenDota a pagamento

---

## 🎯 COSA SUCCEDE QUANDO 10 UTENTI APRONO IL DASHBOARD

### Scenario Reale: 10 Utenti, 10 PC Diversi, Player ID DIVERSI

**IMPORTANTE**: 
- Tutti gli utenti usano la **STESSA API key** (quella configurata sul server Vercel)
- **Nella realtà, ogni utente ha il SUO player ID** (non lo stesso!)

---

## 📊 SCENARIO PIÙ PROBABILE: Player ID DIVERSI

### Caso Reale: 10 Utenti aprono 10 Player ID DIVERSI

**Esempio Realistico**: 
- Utente 1 (PC 1, IP: 1.2.3.4) → Player ID `1903287666` (il suo account)
- Utente 2 (PC 2, IP: 5.6.7.8) → Player ID `123456789` (il suo account)
- Utente 3 (PC 3, IP: 9.10.11.12) → Player ID `987654321` (il suo account)
- ... (ognuno apre il dashboard per il SUO player ID)

```
Secondo 0 (tutti aprono simultaneamente):

Utente 1 → Player ID 1903287666
  ↓
  Server Vercel controlla cache per player 1903287666
  ↓
  Cache VUOTA → Chiama OpenDota API (con la tua API key)
  ↓
  OpenDota vede: Richiesta da IP server Vercel con TUA API key
  ↓
  Salva in cache per 1 ora

Utente 2 → Player ID 123456789 (DIVERSO!)
  ↓
  Server Vercel controlla cache per player 123456789
  ↓
  Cache VUOTA (player ID diverso = cache diversa) → Chiama OpenDota API
  ↓
  OpenDota vede: Altra richiesta da IP server Vercel con TUA API key
  ↓
  Salva in cache per 1 ora

Utente 3-10 → Stesso comportamento (ognuno player ID diverso)
  ↓
  ✅ 10 chiamate a OpenDota in < 1 secondo
  ↓
  ⚠️ Tutte con la STESSA API key
  ↓
  ⚠️ Tutte contano verso il limite della tua API key
```

**Risultato**:
- ⚠️ **10 chiamate** a OpenDota (una per player ID)
- ⚠️ **Tutte con la tua API key** (non per IP utente)
- ⚠️ **Tutte nello stesso secondo** (se aprono simultaneamente)
- ⚠️ **Contano verso il limite della tua API key**

---

### Caso Raro: 10 Utenti aprono lo STESSO Player ID

**Esempio**: Tutti e 10 aprono il dashboard per il player ID `1903287666` (stesso giocatore)

```
Utente 1 (PC 1) → Player ID 1903287666
  ↓
  Cache VUOTA → Chiama OpenDota API (1 chiamata)
  ↓
  Salva in cache

Utente 2-10 → Player ID 1903287666 (STESSO!)
  ↓
  Cache PRESENTE → Ritorna dalla cache
  ↓
  ❌ ZERO chiamate aggiuntive a OpenDota
```

**Risultato**: 
- ✅ **1 sola chiamata** a OpenDota (da Utente 1)
- ✅ **9 chiamate** servite dalla cache
- ✅ **Zero impatto** sul rate limiting

**Nota**: Questo caso è RARO nella realtà - ogni utente di solito apre il SUO player ID.

---

## 🔑 RATE LIMITING CON API KEY A PAGAMENTO

### Come Funziona OpenDota

**OpenDota applica rate limiting PER API KEY**, non per IP utente.

Questo significa:
- ✅ Se hai API key a pagamento con limite **10 req/sec**
- ✅ Tutte le richieste dal tuo server Vercel contano verso quel limite
- ✅ Non importa da quale PC proviene la richiesta (utente 1, 2, 3...)
- ✅ L'IP che conta è quello del **server Vercel**, non quello degli utenti

---

## 📈 ESEMPIO PRATICO - SCENARIO REALE

### Scenario: 10 Utenti Simultanei con Player ID DIVERSI

**Questo è il caso più probabile nella realtà!**

```
Secondo 0 (tutti aprono dashboard simultaneamente):
- Utente 1 → Player ID 1903287666 → Chiama OpenDota (req 1)
- Utente 2 → Player ID 123456789 → Chiama OpenDota (req 2)
- Utente 3 → Player ID 987654321 → Chiama OpenDota (req 3)
- Utente 4 → Player ID 111222333 → Chiama OpenDota (req 4)
- Utente 5 → Player ID 444555666 → Chiama OpenDota (req 5)
- ... (tutte simultanee, player ID diversi)

Risultato: 10 richieste in < 1 secondo
Tutte con la STESSA API key (la tua)
```

**Con API key a pagamento (es. 10 req/sec):**
- ✅ **OK** - Sei esattamente al limite (10 req/sec)
- ⚠️ **PROBLEMA** - Se 11 utenti aprono simultaneamente → errore 429
- ⚠️ **PROBLEMA** - Se ogni pagina fa 3-5 chiamate API → 10 utenti = 30-50 req/sec!

**Con cache server-side (1 ora):**
- ✅ Se gli stessi 10 utenti riaprono dopo 5 minuti → **0 chiamate** (tutto dalla cache)
- ✅ Solo dopo 1 ora la cache scade e si rifanno le chiamate
- ⚠️ **ATTENZIONE** - Se nuovi utenti aprono player ID mai visti → chiamate immediate

---

## 🎯 QUANDO IL RATE LIMITING DIVENTA UN PROBLEMA

### Situazioni Critiche (Player ID DIVERSI):

1. **Picco di traffico simultaneo**
   - 20+ utenti aprono dashboard per player ID diversi nello stesso secondo
   - Ogni pagina fa 3-5 chiamate API (stats, advanced-stats, benchmarks, etc.)
   - → 20 utenti × 3 chiamate = 60 req/sec
   - → Supera limite API key (es. 10-50 req/sec)
   - → Errori 429

2. **Nessuna cache (player ID nuovi)**
   - Utenti aprono player ID mai visti prima
   - → Ogni apertura = 3-5 chiamate OpenDota
   - → Se 10 utenti nuovi → 30-50 chiamate simultanee
   - → Problema se limite basso

3. **Cache scaduta + molti utenti**
   - Cache dura 1 ora
   - Se 50 utenti riaprono dopo 1 ora → tutte le chiamate si rifanno
   - → Picco di 150-250 richieste (50 utenti × 3-5 chiamate)
   - → Supera qualsiasi limite ragionevole

4. **Navigazione tra pagine**
   - Utente naviga tra dashboard, performance, heroes, etc.
   - Ogni pagina fa chiamate API diverse
   - → Anche con cache, alcune chiamate sono sempre nuove

---

## ✅ SOLUZIONI (Se Necessarie)

### 1. Aumentare Cache Duration
```typescript
// Da 1 ora a 4 ore
next: { revalidate: 14400 } // 4 ore
```

**Pro**: Riduce drasticamente chiamate  
**Contro**: Dati meno aggiornati

### 2. Rate Limiting Lato Server
```typescript
// lib/rate-limiter.ts
// Queue system per limitare a 10 req/sec
```

**Pro**: Protegge da picchi  
**Contro**: Richiede implementazione

### 3. Verificare Limiti API Key
- Controlla documentazione OpenDota per i limiti della tua API key
- Se hai limite alto (es. 100 req/sec) → probabilmente non serve nulla

---

## 📊 CONCLUSIONE

### Con API Key a Pagamento:

**✅ Vantaggi:**
- Limiti più alti rispetto a free tier (es. 10-100 req/sec invece di ~1 req/sec)
- Rate limiting per API key (non per IP utente)
- Cache server-side riduce drasticamente chiamate (per stesso player ID)

**⚠️ Attenzione (Player ID DIVERSI - Caso Reale):**
- **Ogni utente ha il SUO player ID** → cache non aiuta tra utenti diversi
- Tutte le richieste contano verso il limite della TUA API key
- Ogni pagina fa 3-5 chiamate API → 10 utenti = 30-50 req/sec
- Se molti utenti simultanei con player ID diversi → può superare limite facilmente
- Cache di 1 ora aiuta solo se stesso utente riapre (stesso player ID)

**🎯 Raccomandazione:**
- **Con pochi utenti (< 10 simultanei)**: Probabilmente OK (30-50 req/sec)
- **Con molti utenti (10-20 simultanei)**: Attenzione (60-100 req/sec)
- **Con molti utenti (> 20 simultanei)**: Considera rate limiting lato server OBBLIGATORIO
- **Verifica i limiti della tua API key** su OpenDota documentation
- **Considera**: Ogni pagina = 3-5 chiamate, non 1!

---

**Ultimo aggiornamento**: Gennaio 2025

