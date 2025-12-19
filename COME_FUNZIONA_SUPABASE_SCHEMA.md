# 📊 Come Funziona la Creazione Tabelle in Supabase

## 🔍 SPIEGAZIONE

**Non creo le tabelle direttamente io!** 

Il processo funziona così:

1. **Io scrivo lo schema SQL** nel file `supabase/schema.sql`
2. **Tu esegui lo schema** manualmente nel dashboard Supabase
3. **Le tabelle vengono create** nel database

---

## 📁 DOVE SI TROVA LO SCHEMA

Lo schema SQL è nel file:
```
supabase/schema.sql
```

Questo file contiene:
- ✅ Definizione delle tabelle (`CREATE TABLE`)
- ✅ Indici per performance
- ✅ Row Level Security (RLS) policies
- ✅ Funzioni e trigger (es. creazione automatica profilo utente)

---

## 🚀 COME APPLICARE LO SCHEMA

### Passo 1: Apri Supabase Dashboard
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Oppure: https://supabase.com/dashboard → Seleziona progetto

### Passo 2: Apri SQL Editor
1. Nel menu laterale sinistro, clicca su **"SQL Editor"**
2. Clicca su **"New Query"** (pulsante in alto a destra)

### Passo 3: Copia lo Schema
1. Apri il file `supabase/schema.sql` nel tuo editor
2. **Copia TUTTO il contenuto** (Ctrl+A, Ctrl+C)

### Passo 4: Incolla ed Esegui
1. **Incolla** lo schema nel SQL Editor di Supabase
2. Clicca su **"Run"** (o premi Ctrl+Enter)
3. Attendi che finisca l'esecuzione

### Passo 5: Verifica
1. Vai su **"Table Editor"** nel menu laterale
2. Dovresti vedere le tabelle:
   - ✅ `users`
   - ✅ `match_analyses`

---

## 🔄 PROCESSO COMPLETO

```
┌─────────────────────────────────────────┐
│  1. Io scrivo/modifico schema.sql      │
│     (nel repository GitHub)             │
└──────────────┬──────────────────────────┘
               │
               │ Push su GitHub
               ▼
┌─────────────────────────────────────────┐
│  2. Tu cloni/pull il repository         │
│     (o vedi il file su GitHub)          │
└──────────────┬──────────────────────────┘
               │
               │ Copi lo schema
               ▼
┌─────────────────────────────────────────┐
│  3. Apri Supabase Dashboard             │
│     → SQL Editor                        │
└──────────────┬──────────────────────────┘
               │
               │ Incolli ed esegui
               ▼
┌─────────────────────────────────────────┐
│  4. Le tabelle vengono create           │
│     nel database Supabase                │
└─────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE

### Le tabelle NON vengono create automaticamente!

- ❌ Non si creano quando fai push su GitHub
- ❌ Non si creano quando Vercel fa deploy
- ✅ **Devi eseguire lo schema manualmente** nel dashboard Supabase

### Quando eseguire lo schema?

1. **Prima volta** (setup iniziale)
2. **Dopo modifiche allo schema** (aggiunta colonne, nuove tabelle)
3. **Se le tabelle non esistono** (errore "table does not exist")

---

## 📝 ESEMPIO PRATICO

### Scenario: Aggiungere colonna `dota_account_id`

**1. Io modifico `supabase/schema.sql`:**
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_id BIGINT;
```

**2. Tu esegui nel Supabase SQL Editor:**
```sql
-- Copi questa query
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_id BIGINT;

-- Esegui (Run)
```

**3. Risultato:**
- ✅ Colonna aggiunta alla tabella `users`
- ✅ Disponibile immediatamente

---

## 🔧 AGGIORNAMENTI SCHEMA

### Se modifico lo schema, cosa devi fare?

**Opzione 1: Eseguire solo le modifiche**
- Copi solo la parte modificata
- Esegui nel SQL Editor

**Opzione 2: Eseguire tutto lo schema**
- Copi tutto `schema.sql`
- Esegui (le query usano `IF NOT EXISTS` quindi sono sicure)

---

## 🎯 SCHEMA ATTUALE

Lo schema attuale (`supabase/schema.sql`) crea:

### Tabelle:
1. **`users`** - Profili utente
   - `id` (UUID, PK)
   - `email`
   - `username`
   - `avatar_url`
   - `created_at`, `updated_at`

2. **`match_analyses`** - Analisi match salvate
   - `id` (UUID, PK)
   - `user_id` (FK → users)
   - `match_id` (BIGINT)
   - `analysis_data` (JSONB)
   - `ai_insights` (JSONB)
   - `created_at`

### Funzionalità:
- ✅ **Trigger automatico**: Crea profilo utente quando si registra
- ✅ **RLS Policies**: Sicurezza (ogni utente vede solo i suoi dati)
- ✅ **Indici**: Performance per query veloci

---

## ❓ DOMANDE FREQUENTI

### Q: Perché non si creano automaticamente?
**A:** Supabase non ha accesso diretto al tuo repository. Devi eseguire lo schema manualmente per sicurezza.

### Q: Posso eseguire lo schema più volte?
**A:** Sì! Le query usano `IF NOT EXISTS` quindi sono idempotenti (sicure da eseguire più volte).

### Q: Cosa succede se eseguo lo schema due volte?
**A:** Niente! Le query controllano se esistono già prima di creare (es. `CREATE TABLE IF NOT EXISTS`).

### Q: Come faccio a sapere se lo schema è aggiornato?
**A:** Controlla il file `supabase/schema.sql` nel repository. Se è stato modificato di recente, potrebbe servire un aggiornamento.

---

## 📋 CHECKLIST

Prima di eseguire lo schema, verifica:

- [ ] Hai accesso al dashboard Supabase
- [ ] Hai aperto SQL Editor
- [ ] Hai copiato lo schema completo
- [ ] Hai verificato che non ci siano errori di sintassi
- [ ] Sei pronto a eseguire (Run)

---

**In sintesi: Io scrivo lo schema SQL, tu lo esegui nel dashboard Supabase!** 🎯

