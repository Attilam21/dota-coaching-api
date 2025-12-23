# 📋 Analisi: Autenticazione e Player ID

## 🎯 Obiettivo
Implementare un sistema per salvare il Player ID nel database, con:
- ✅ Salvataggio nel database (`public.users.dota_account_id`)
- ✅ **NESSUNA verifica tecnica** - salvataggio diretto quando l'utente inserisce l'ID
- ✅ Blocco del cambio se già salvato (richiesta email per cambio)
- ✅ Mantenimento di localStorage come fallback
- ✅ Caricamento automatico dal database quando disponibile

---

## 📊 Stato Attuale

### Database
La tabella `public.users` ha già le colonne necessarie:
```sql
- id (uuid, PK, FK → auth.users)
- email (text, NOT NULL)
- dota_account_id (bigint, nullable) ✅
- dota_account_verified_at (timestamptz, nullable) ✅
- dota_verification_method (text, nullable) ✅
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Codice Attuale
1. **`app/dashboard/settings/page.tsx`**:
   - Form per inserire Player ID
   - Salva SOLO in localStorage (non in database)
   - Validazione base (solo numero)

2. **`lib/playerIdContext.tsx`**:
   - Gestisce Player ID in localStorage
   - Supporta formato JSON con `verified`, `verifiedAt`, `verificationMethod`
   - Non sincronizza con database

3. **API OpenDota**:
   - `/api/opendota/player/[id]` - Verifica esistenza player ✅

---

## ✅ Fattibilità: COMPLETA

Tutto è fattibile perché:
- ✅ Database già configurato con colonne necessarie
- ✅ API OpenDota già disponibile per verifica
- ✅ Pagina settings già esistente
- ✅ Context già supporta verifica
- ✅ Autenticazione Supabase funzionante

---

## 🔧 Implementazione Proposta

### 1. **Server Action per Salvare Player ID**
**File:** `app/actions/save-player-id.ts`

```typescript
'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function savePlayerId(playerId: string) {
  // 1. Verifica autenticazione
  // 2. Controlla se l'utente ha già un ID salvato
  // 3. Se già salvato → errore "contatta supporto per cambiare"
  // 4. Se non salvato → salva direttamente in database
  // 5. Restituisci successo/errore
}
```

### 2. **Aggiornamento Settings Page**
**File:** `app/dashboard/settings/page.tsx`

Modifiche:
- Caricare Player ID dal database all'avvio
- Se già salvato → campo disabilitato + messaggio "contatta supporto per cambiare"
- Se non salvato → permettere inserimento e salvataggio diretto
- Salvare in database E localStorage (fallback)

### 3. **Aggiornamento PlayerIdContext**
**File:** `lib/playerIdContext.tsx`

Modifiche:
- Caricare Player ID dal database all'avvio (se autenticato)
- Sincronizzare con localStorage come fallback
- Mantenere compatibilità con localStorage esistente


---

## 🔄 Flusso Utente

### Scenario 1: Primo Inserimento Player ID
1. Utente inserisce Player ID in Settings
2. Click "Salva" → Salva direttamente in database + localStorage
3. Campo viene disabilitato dopo il salvataggio

### Scenario 2: Cambio Player ID (Già Salvato)
1. Utente ha già un Player ID salvato nel database
2. Campo input è disabilitato e mostra il valore corrente
3. Messaggio: "Il tuo Player ID è già associato. Per cambiarlo, contatta il supporto via email: support@..."
4. Pulsante "Richiedi Cambio" → Apre email client con template precompilato

---

## 🗄️ Modifiche Database

### Nessuna modifica necessaria!
Le colonne necessarie sono già presenti:
- ✅ `dota_account_id` (bigint) - per salvare l'ID
- ⚠️ `dota_account_verified_at` e `dota_verification_method` non servono (ma non fanno male)

### Policy RLS (già configurate ✅)
L'utente può già:
- ✅ Leggere il proprio record: `SELECT * FROM public.users WHERE id = auth.uid()`
- ✅ Aggiornare il proprio record: `UPDATE public.users SET ... WHERE id = auth.uid()`

---

## 📝 Checklist Implementazione

### Fase 1: Salvataggio Base
- [ ] Creare Server Action `savePlayerId`
- [ ] Aggiornare Settings page per caricare da database
- [ ] Aggiornare Settings page per salvare in database
- [ ] Controllare se ID già salvato prima di permettere inserimento

### Fase 2: Blocco Cambio (Se Già Salvato)
- [ ] Controllare se `dota_account_id` esiste in Settings
- [ ] Disabilitare input se già salvato
- [ ] Mostrare messaggio "contatta supporto per cambiare"
- [ ] Aggiungere link/button "Richiedi Cambio" → apre email client

### Fase 3: Sincronizzazione Context
- [ ] Aggiornare `PlayerIdContext` per caricare da database
- [ ] Mantenere localStorage come fallback
- [ ] Sincronizzare database ↔ localStorage

---

## 🔒 Sicurezza

1. **Verifica Autenticazione**: Solo utenti autenticati possono salvare
2. **Verifica Ownership**: Utente può modificare solo il proprio record (RLS)
3. **Blocco Dopo Salvataggio**: Una volta salvato, richiedere email per cambio
4. **RLS Policies**: Già configurate ✅ - bloccano accessi non autorizzati

---

## 🧪 Test

1. **Test Primo Inserimento**:
   - Inserire Player ID → Salvataggio OK → Campo disabilitato

2. **Test Cambio Già Salvato**:
   - Tentare cambio ID già salvato → Campo disabilitato + messaggio

3. **Test Fallback localStorage**:
   - Disconnettere → Usa localStorage
   - Riconnettere → Sincronizza con database

---

## 📌 Note

1. **Compatibilità**: Mantenere localStorage per utenti non autenticati o come fallback
2. **UX**: Campo disabilitato dopo salvataggio per evitare modifiche accidentali
3. **Email Supporto**: Link "Richiedi Cambio" apre email client con template precompilato (mailto:)
4. **Nessuna Verifica**: L'utente può inserire qualsiasi numero - nessuna validazione tecnica

---

## ✅ Conclusione

**Fattibilità: ✅ COMPLETA**

Tutto è pronto per l'implementazione:
- Database configurato
- API disponibili
- Codice esistente facilmente estendibile
- Nessuna modifica database necessaria

**Prossimi Passi:**
1. Attendere conferma utente
2. Implementare Fase 1 (verifica e salvataggio base)
3. Testare
4. Implementare Fase 2 (blocco cambio)
5. Implementare Fase 3 (sincronizzazione)

