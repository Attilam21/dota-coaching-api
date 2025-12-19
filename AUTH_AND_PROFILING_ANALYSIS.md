# 🔐 Analisi Autenticazione e Profilazione - Dota 2 Coaching Platform

**Data Analisi**: 19 Dicembre 2025  
**Obiettivo**: Analizzare sistema login e validazione Player ID

---

## 📊 SITUAZIONE ATTUALE

### ✅ Cosa Funziona

1. **Autenticazione Base**
   - Login/Signup con email/password (Supabase Auth)
   - Session management funzionante
   - Protected routes implementate
   - Logout funzionante

2. **Player ID Storage**
   - Salvato in **localStorage** (client-side)
   - Accessibile tramite `PlayerIdContext`
   - Sincronizzato tra tab/window
   - **NON salvato nel database Supabase**

3. **Dashboard**
   - Funziona con qualsiasi Player ID inserito
   - Nessuna validazione di proprietà

### ❌ PROBLEMA CRITICO

**Chiunque può inserire qualsiasi Player ID, anche se non gli appartiene.**

**Implicazioni:**
- Utente A può vedere statistiche di Utente B
- Nessuna garanzia che i dati visualizzati siano dell'utente autenticato
- Possibile violazione privacy
- Dati potenzialmente fuorvianti per l'utente

---

## 🔍 ANALISI TECNICA

### Flusso Attuale

```
1. Utente si registra → Supabase crea account (email/password)
2. Utente accede → Session Supabase attiva
3. Utente inserisce Player ID → Salvato in localStorage
4. Dashboard carica dati → Usa Player ID da localStorage
5. ❌ NESSUNA VERIFICA che il Player ID appartenga all'utente
```

### Schema Database Attuale

```sql
-- Tabella users (Supabase)
- id (UUID, PK)
- email
- username
- avatar_url
- ❌ dota_account_id NON presente (o non usato)
```

### Codice Rilevante

**`app/dashboard/settings/page.tsx`** (linee 88-109):
```typescript
// Salva SOLO in localStorage (via PlayerIdContext)
// Non usiamo più Supabase per evitare errori RLS
const playerIdString = dotaAccountId.trim() || null
localStorage.setItem('fzth_player_id', playerIdString)
```

**Problema**: Nessuna validazione, nessun salvataggio nel DB.

---

## 💡 SOLUZIONI POSSIBILI

### 🥇 Opzione 1: Steam OAuth (RACCOMANDATO - Più Sicuro)

**Come Funziona:**
1. Utente clicca "Connetti Steam"
2. Redirect a Steam OpenID
3. Steam autentica e ritorna Steam ID
4. Salviamo Steam ID → Dota Account ID nel database
5. **Validazione automatica**: Se hai accesso all'account Steam, è tuo

**Vantaggi:**
- ✅ Validazione automatica e sicura
- ✅ Standard industry (OpenID)
- ✅ UX fluida (un click)
- ✅ Impossibile falsificare

**Svantaggi:**
- ⚠️ Richiede setup Steam API
- ⚠️ Modifiche al sistema auth (Supabase + Steam)
- ⚠️ Dipendenza da Steam

**Implementazione:**
- Steam OpenID Provider
- Supabase Auth con provider multipli
- Salvataggio Steam ID → Dota Account ID mapping

**Tempo stimato**: 2-3 giorni

---

### 🥈 Opzione 2: Verifica Tramite Codice Profilo Steam

**Come Funziona:**
1. Utente inserisce Player ID
2. Sistema genera codice univoco (es: "FZTH-ABC123")
3. Utente deve aggiungere codice nel profilo Steam/Dota
4. Sistema verifica periodicamente se il codice è presente
5. Se trovato → Validazione confermata

**Vantaggi:**
- ✅ Validazione sicura
- ✅ Non richiede OAuth complesso
- ✅ Funziona con account esistenti

**Svantaggi:**
- ⚠️ Richiede scraping profilo Steam (fragile)
- ⚠️ Processo manuale per utente
- ⚠️ Verifica non istantanea

**Implementazione:**
- Generazione codice univoco
- Scraping profilo Steam (o API se disponibile)
- Job periodico per verifica

**Tempo stimato**: 3-4 giorni

---

### 🥉 Opzione 3: Verifica Tramite Match Recente

**Come Funziona:**
1. Utente inserisce Player ID
2. Sistema chiede: "Inserisci il Match ID di una tua partita recente"
3. Sistema verifica che il Player ID sia presente in quel match
4. Se confermato → Validazione

**Vantaggi:**
- ✅ Semplicissimo da implementare
- ✅ Validazione immediata
- ✅ Usa API OpenDota (già integrata)

**Svantaggi:**
- ⚠️ Meno sicuro (chiunque può vedere match pubblici)
- ⚠️ Richiede input manuale match ID
- ⚠️ UX meno fluida

**Implementazione:**
- Form per inserire Match ID
- API call a OpenDota per verificare presenza Player ID
- Salvataggio validazione nel DB

**Tempo stimato**: 1 giorno

---

### 🏅 Opzione 4: Verifica Tramite Email + Link

**Come Funziona:**
1. Utente inserisce Player ID
2. Sistema invia email con link di verifica
3. Utente clicca link → Validazione

**Vantaggi:**
- ✅ Validazione sicura (solo chi ha accesso email)
- ✅ Standard industry

**Svantaggi:**
- ⚠️ Non verifica che il Player ID sia effettivamente suo
- ⚠️ Solo verifica che abbia accesso all'email
- ⚠️ Processo a due step

**Implementazione:**
- Generazione token verifica
- Email con link (Supabase Auth email)
- Endpoint verifica token

**Tempo stimato**: 1-2 giorni

---

## 🎯 RACCOMANDAZIONE

### Approccio Ibrido (Migliore UX + Sicurezza)

**Fase 1: Implementazione Rapida (Opzione 3)**
- Verifica tramite Match ID recente
- **Tempo**: 1 giorno
- **Sicurezza**: Media
- **UX**: Buona

**Fase 2: Miglioramento (Opzione 1)**
- Steam OAuth per validazione automatica
- **Tempo**: 2-3 giorni
- **Sicurezza**: Alta
- **UX**: Eccellente

**Risultato:**
- Validazione immediata disponibile
- Upgrade futuro a Steam OAuth
- Fallback se Steam OAuth non disponibile

---

## 📋 IMPLEMENTAZIONE CONSIGLIATA

### Step 1: Modificare Schema Database

```sql
-- Aggiungere colonna dota_account_id a users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_id BIGINT UNIQUE;

-- Aggiungere colonna verified_at per tracciare validazione
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_verified_at TIMESTAMPTZ;

-- Aggiungere colonna verification_method
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_verification_method TEXT; -- 'match_id', 'steam_oauth', 'manual'
```

### Step 2: API Route per Verifica Match

```typescript
// app/api/user/verify-dota-account/route.ts
POST /api/user/verify-dota-account
Body: { playerId: string, matchId: string }

// Verifica:
// 1. Match esiste su OpenDota
// 2. Player ID è presente nel match
// 3. Match è recente (ultimi 30 giorni)
// 4. Salva nel DB se verificato
```

### Step 3: Modificare Settings Page

```typescript
// Aggiungere:
// - Campo "Match ID per verifica"
// - Stato verifica (verificato/non verificato)
// - Badge "Verificato" se dota_account_verified_at non null
// - Bloccare modifica Player ID se già verificato (o richiedere re-verifica)
```

### Step 4: Modificare Dashboard

```typescript
// Mostrare warning se Player ID non verificato:
// "⚠️ Questo Player ID non è stato verificato. 
//  Verifica il tuo account nelle impostazioni per accedere a tutte le funzionalità."
```

---

## 🔒 SICUREZZA AGGIUNTIVA

### Rate Limiting
- Limitare tentativi di verifica (max 5 al giorno)
- Prevenire abuse

### Logging
- Tracciare tutti i tentativi di verifica
- Log modifiche Player ID

### Validazione Lato Server
- **SEMPRE** verificare lato server che l'utente possa modificare solo il proprio Player ID
- RLS policies su Supabase per proteggere dati

---

## ❓ DOMANDE DA DECIDERE

1. **Vuoi Steam OAuth subito o approccio graduale?**
   - Subito: 2-3 giorni, più sicuro
   - Graduale: 1 giorno (Match ID) + upgrade futuro

2. **Cosa fare se Player ID già verificato da altro utente?**
   - Bloccare (UNIQUE constraint)
   - Permettere ma mostrare warning
   - Richiedere disassociazione precedente

3. **Validazione obbligatoria o opzionale?**
   - Obbligatoria: Bloccare dashboard se non verificato
   - Opzionale: Mostrare warning ma permettere uso

4. **Cosa fare con Player ID esistenti in localStorage?**
   - Richiedere verifica al prossimo login
   - Grandfather clause (mantenere ma non permettere modifica)

---

## 🚀 PROSSIMI PASSI

**Aspetto il tuo via per:**
1. Scegliere approccio (Steam OAuth vs Match ID vs Ibrido)
2. Definire policy (obbligatorio vs opzionale)
3. Implementare soluzione scelta

**Raccomandazione**: Iniziare con **Opzione 3 (Match ID)** per validazione rapida, poi upgrade a **Steam OAuth** quando possibile.

