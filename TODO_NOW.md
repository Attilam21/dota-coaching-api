# 🚨 COSA FARE ADESSO - In Programmazione

**Data**: Gennaio 2025  
**Status**: ⚠️ IN SVILUPPO - Non ancora pronto per produzione

---

## 🔴 PROBLEMI CRITICI DA RISOLVERE PRIMA DEL LANCIO

### 1. ⚠️ Rate Limiting OpenDota API
**Priorità**: MEDIA (meno critico grazie a cache + API key a pagamento)  
**Rischio**: Errori 429 se si supera limite API key (solo con molti utenti simultanei)

**Situazione Attuale**:
- ✅ **API key a pagamento**: Limiti più alti rispetto a free tier
- ✅ **Cache server-side**: `revalidate: 3600` (1 ora) su tutte le route API
- ✅ **Cache HTTP**: `Cache-Control: public, s-maxage=3600` (1 ora)
- ✅ **localStorage**: Usato per `last_match_id` (non per cache dati)
- ⚠️ **Polling**: Ogni 20 minuti (non troppo frequente)

**Come Funziona**:
- **Rate limiting PER API KEY** (non per IP utente)
- Tutte le richieste dal server Vercel usano la STESSA API key
- Se 10 utenti aprono lo stesso player ID → **1 sola chiamata** (cache)
- Se 10 utenti aprono player ID diversi → **10 chiamate** (tutte con la tua API key)

**Quando Diventa Critico**:
- Con 50+ utenti simultanei che aprono dashboard per player ID diversi
- Durante picchi di traffico (tutti aprono nello stesso secondo)
- Se limite API key è basso (es. 10 req/sec) e traffico alto

**Soluzione** (Opzionale, implementare solo se necessario):
- Verificare limiti della tua API key OpenDota (documentazione)
- Rate limiting lato server (queue system) se limite basso
- Cache più aggressiva (aumentare a 2-4 ore) se dati non devono essere super freschi

**Tempo**: 1-2 giorni (solo se necessario)  
**File**: `lib/rate-limiter.ts`, middleware

**Nota**: 
- ⚠️ **IMPORTANTE**: Ogni utente ha il SUO player ID → cache non aiuta tra utenti diversi
- ⚠️ **IMPORTANTE**: Ogni pagina fa 3-5 chiamate API → 10 utenti = 30-50 req/sec
- Con API key a pagamento e cache di 1 ora, probabilmente OK per < 10 utenti simultanei
- Con 10-20 utenti simultanei → attenzione (60-100 req/sec)
- Con > 20 utenti simultanei → rate limiting lato server OBBLIGATORIO
- Vedi sezione "Rate Limiting OpenDota API" in questo documento per dettagli completi

---

### 2. ⚠️ Error Tracking & Monitoring
**Priorità**: CRITICA  
**Rischio**: Errori in produzione invisibili

**Problema**:
- Nessun sistema di error tracking
- Errori non tracciati
- Difficile debug in produzione

**Soluzione**:
- Integrare Sentry o Vercel Analytics
- Logging strutturato
- Alert su errori critici

**Tempo**: 1 giorno  
**File**: `lib/logger.ts`, `lib/error-tracking.ts`

---

### 3. ⚠️ Console.log in Produzione
**Priorità**: ALTA  
**Rischio**: Performance, sicurezza, informazioni esposte

**Problema**:
- **219 `console.log/error/warn`** nel codice (200 in `app/`, 19 in `lib/`)
- Eseguiti anche in produzione
- Espongono informazioni sensibili
- Impatto performance (soprattutto su mobile)

**Soluzione**:
- Creare logger centralizzato (`lib/logger.ts`)
- Sostituire tutti i `console.*` con logger condizionale
- Log solo in sviluppo (`NODE_ENV === 'development'`)
- Errori critici sempre loggati (anche in produzione)

**Tempo**: 1-2 giorni  
**File**: 
- `lib/logger.ts` (creare)
- Sostituire in tutti i file `app/` e `lib/`

---

### 4. ⚠️ Validazione Input API
**Priorità**: ALTA  
**Rischio**: Errori, crash, potenziali vulnerabilità

**Problema**:
- Validazione input limitata
- Nessuna validazione con Zod
- Input non sanitizzati

**Soluzione**:
- Validazione Zod su tutte le API
- Sanitizzazione input
- Error handling migliorato

**Tempo**: 2-3 giorni  
**File**: Tutte le route API in `app/api/`

---

## 🟡 PROBLEMI IMPORTANTI (Non Bloccanti)

### 5. Testing
**Priorità**: MEDIA  
**Status**: ❌ Non implementato

**Cosa fare**:
- Test critici (auth, API principali)
- Test end-to-end base
- CI/CD con test automatici

**Tempo**: 2-3 giorni

---

### 6. Rate Limiting Utenti
**Priorità**: MEDIA  
**Status**: ❌ Non implementato

**Cosa fare**:
- Rate limiting per IP/utente
- Protezione da abuso
- DoS protection

**Tempo**: 1 giorno

---

### 7. Analytics Utenti
**Priorità**: MEDIA  
**Status**: ❌ Non implementato

**Cosa fare**:
- Google Analytics 4
- Event tracking
- Conversion tracking

**Tempo**: 1 giorno

---

### 8. Timeout Standardizzati
**Priorità**: MEDIA  
**Status**: ⚠️ Parzialmente implementato

**Cosa fare**:
- Standardizzare timeout su tutte le chiamate
- Gestione errori timeout
- Retry logic

**Tempo**: 1 giorno

---

## 📋 CHECKLIST SVILUPPO

### Durante lo Sviluppo (ORA)
- [x] Build funziona (con warning non critici su route test)
- [x] TypeScript strict mode
- [x] Linting 0 errori
- [ ] Logger centralizzato (219 console.* da sostituire)
- [ ] Error tracking
- [ ] Rate limiting
- [ ] Validazione input

### Prima del Deploy
- [ ] Test critici
- [ ] Performance check
- [ ] Security audit
- [ ] Documentazione aggiornata

---

## 🛠️ COMANDI UTILI

```bash
# Sviluppo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Verifica errori TypeScript
npx tsc --noEmit
```

---

## 📝 NOTE IMPORTANTI

### Durante lo Sviluppo
- ✅ **Mantieni i console.log** per debug (219 totali)
- ✅ **Testa localmente** prima di push
- ✅ **Verifica build** dopo ogni modifica importante
- ⚠️ **Warning build**: Route test generano warning "Dynamic server usage" (non critici, sono route di test)

### Prima del Deploy
- ⚠️ **Rimuovi/sostituisci 219 console.log** con logger centralizzato
- ⚠️ **Aggiungi error tracking** (Sentry o Vercel Analytics)
- ⚠️ **Implementa rate limiting** (OpenDota API)
- ⚠️ **Valida tutti gli input** (Zod su tutte le API)

---

## 🎯 PRIORITÀ IMMEDIATE

1. **Logger centralizzato** (oggi) - 219 console.* da sostituire
2. **Error tracking** (domani) - Sentry o Vercel Analytics
3. **Validazione input** (dopo) - Zod su tutte le API
4. **Rate limiting** (opzionale) - Solo se molti utenti simultanei (>10)

---

**Ultimo aggiornamento**: Gennaio 2025

