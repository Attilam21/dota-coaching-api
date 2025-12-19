# 🚀 Come Applicare lo Schema Pulito in Supabase

## ⚠️ IMPORTANTE

Questo schema è **pulito e ottimizzato** - include solo quello che serve:
- ✅ Tabella `users` con colonne per verifica Dota Account ID
- ✅ Tabella `match_analyses` per salvare analisi
- ✅ RLS Policies corrette
- ✅ Trigger per creazione automatica profilo
- ❌ Rimosso tutto quello che non serve (username, avatar_url, gamification, etc.)

---

## 📋 PROCEDURA

### Step 1: Apri Supabase Dashboard

Vai su: [https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)

### Step 2: Apri SQL Editor

1. Nel menu laterale, clicca su **"SQL Editor"**
2. Clicca su **"New Query"** (pulsante in alto a destra)

### Step 3: Copia lo Schema

1. Apri il file `supabase/schema.sql` nel tuo editor
2. **Seleziona TUTTO** (Ctrl+A)
3. **Copia** (Ctrl+C)

### Step 4: Incolla ed Esegui

1. **Incolla** lo schema nel SQL Editor di Supabase
2. Clicca su **"Run"** (o premi Ctrl+Enter)
3. Attendi che finisca l'esecuzione

### Step 5: Verifica

Segui la checklist in `supabase/SCHEMA_CHECKLIST.md` per verificare che tutto sia corretto.

---

## 🔍 COSA FA LO SCHEMA

### Crea/Modifica:

1. **Tabella `users`**:
   - Aggiunge colonne: `dota_account_id`, `dota_account_verified_at`, `dota_verification_method`
   - Rimuove colonne inutili (se presenti): `username`, `avatar_url`

2. **Tabella `match_analyses`**:
   - Già corretta, non modifica nulla

3. **RLS Policies**:
   - Rimuove policies duplicate (se presenti)
   - Crea policies corrette per `users` e `match_analyses`

4. **Trigger**:
   - Rimuove trigger duplicati (se presenti)
   - Crea trigger `on_auth_user_created` per creazione automatica profilo

5. **Indici**:
   - Crea indici per performance

---

## ⚠️ SICUREZZA

Lo schema usa `IF NOT EXISTS` e `DROP ... IF EXISTS`, quindi:
- ✅ **Sicuro da eseguire più volte**
- ✅ **Non elimina dati esistenti** (solo aggiunge/modifica)
- ✅ **Idempotente** (puoi eseguirlo più volte senza problemi)

---

## 🧹 PULIZIA (Opzionale)

Se vuoi rimuovere tabelle/colonne inutili che esistono già, esegui questo **DOPO** aver applicato lo schema principale:

```sql
-- Rimuovi colonne inutili (se esistono)
ALTER TABLE public.users DROP COLUMN IF EXISTS username;
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url;

-- Rimuovi tabelle inutili (se esistono)
DROP TABLE IF EXISTS public.learning_modules CASCADE;
DROP TABLE IF EXISTS public.learning_progress CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
```

**⚠️ ATTENZIONE**: Queste query **eliminano dati**! Esegui solo se sei sicuro che non servono.

---

## ✅ VERIFICA FINALE

Dopo aver eseguito lo schema, verifica:

1. **Table Editor** → Dovresti vedere solo `users` e `match_analyses`
2. **Authentication → Policies** → Dovresti vedere 6 policies totali (3 per tabella)
3. **Database → Triggers** → Dovresti vedere `on_auth_user_created`
4. **Database → Functions** → Dovresti vedere `handle_new_user()`

---

## 🎯 RISULTATO

Dopo aver applicato lo schema, avrai:

- ✅ **Schema pulito** - Solo quello che serve
- ✅ **Verifica Player ID** - Colonne per `dota_account_id` e verifica
- ✅ **Sicurezza** - RLS policies corrette
- ✅ **Performance** - Indici ottimizzati
- ✅ **Automazione** - Trigger per creazione profilo

**Niente di più, niente di meno!** 🎉

