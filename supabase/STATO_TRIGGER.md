# 📋 Stato Trigger in Supabase

## ✅ TRIGGER DEFINITI NEI FILE SQL

### 1. **`on_auth_user_created`** (PRIORITÀ ALTA)
**File:** 
- `supabase/SCHEMA_ENTERPRISE.sql` (linee 369-372)
- `supabase/RIPRISTINO_TABELLE.sql` (linee 128-132)
- `supabase/schema.sql` (linee 132-136)

**Tabella:** `auth.users`
**Tipo:** `AFTER INSERT`
**Funzione:** `public.handle_new_user()`

**Scopo:** Crea automaticamente profilo in `public.users` quando un nuovo utente si registra

---

### 2. **`prevent_dota_id_change_trigger`** (PRIORITÀ ALTA)
**File:** `supabase/SCHEMA_ENTERPRISE.sql` (linee 345-348)

**Tabella:** `public.users`
**Tipo:** `BEFORE UPDATE`
**Funzione:** `public.prevent_dota_id_change()`

**Scopo:** Blocca modifiche a `dota_account_id` dopo verifica

---

### 3. **`update_last_analyzed_match_trigger`** (PRIORITÀ MEDIA)
**File:** `supabase/SCHEMA_ENTERPRISE.sql` (linee 392-395)

**Tabella:** `public.match_analyses`
**Tipo:** `AFTER INSERT`
**Funzione:** `public.update_last_analyzed_match()`

**Scopo:** Aggiorna `users.last_analyzed_match_id` quando si crea una nuova analisi

---

## 🔍 COME VERIFICARE SE SONO PRESENTI

### Metodo 1: SQL Editor Supabase (CONSIGLIATO)

1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new
2. Copia e incolla il contenuto di `supabase/VERIFICA_TRIGGER_SEMPLICE.sql`
3. Clicca **Run** (o premi `Ctrl+Enter`)

### Metodo 2: Script Node.js

Esegui:
```bash
node scripts/verifica-trigger.js
```

**Nota:** Serve `SUPABASE_DB_PASSWORD` in `.env.local`

---

## 📊 RISULTATO ATTESO

Se i trigger sono presenti, vedrai:

```
✅ PRESENTE - on_auth_user_created
✅ PRESENTE - prevent_dota_id_change_trigger
✅ PRESENTE - update_last_analyzed_match_trigger
```

Se mancano, vedrai:

```
❌ MANCANTE - on_auth_user_created
❌ MANCANTE - prevent_dota_id_change_trigger
❌ MANCANTE - update_last_analyzed_match_trigger
```

---

## 🚀 COME CREARLI

Se mancano, esegui:

1. **Per tutti i trigger:** `supabase/SCHEMA_ENTERPRISE.sql`
2. **Solo per on_auth_user_created:** `supabase/RIPRISTINO_TABELLE.sql`

Nel SQL Editor Supabase: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new

---

**File di verifica:** `supabase/VERIFICA_TRIGGER_SEMPLICE.sql`

