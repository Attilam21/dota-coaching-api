# 🚨 RIPRISTINO TABELLE - ISTRUZIONI URGENTI

## ⚠️ PROBLEMA
Le tabelle `public.users` e `public.match_analyses` sono state cancellate ma servono al progetto!

## ✅ SOLUZIONE IMMEDIATA

### Metodo 1: SQL Editor (PIÙ VELOCE - CONSIGLIATO)

1. **Apri:** https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new

2. **Copia TUTTO il contenuto** del file `supabase/RIPRISTINO_TABELLE.sql`

3. **Incolla** nell'editor SQL

4. **Clicca "Run"** (o premi `Ctrl+Enter`)

5. **Verifica** che le tabelle siano state create:
   - Vai su **Table Editor**
   - Dovresti vedere `users` e `match_analyses` in `public` schema

---

### Metodo 2: Supabase CLI

Se hai già configurato il CLI:

```powershell
# Crea una nuova migration
npx supabase migration new ripristino_tabelle

# Copia il contenuto di RIPRISTINO_TABELLE.sql nella migration appena creata
# Poi esegui:
npx supabase db push
```

---

## 📋 Cosa viene ricreato:

✅ **`public.users`** - Profilo utente con:
   - `id` (UUID, riferimento a auth.users)
   - `email`
   - `dota_account_id` (BIGINT, UNIQUE)
   - `dota_account_verified_at`
   - `dota_verification_method`
   - `created_at`, `updated_at`

✅ **`public.match_analyses`** - Analisi match salvate:
   - `id` (UUID)
   - `user_id` (UUID, riferimento a users)
   - `match_id` (BIGINT)
   - `analysis_data` (JSONB)
   - `ai_insights` (JSONB)
   - `created_at`

✅ **Indici** per performance

✅ **RLS (Row Level Security)** abilitato

✅ **Policies RLS** configurate:
   - Users: SELECT, UPDATE, INSERT (solo i propri dati)
   - Match_analyses: SELECT, INSERT, UPDATE, DELETE (solo i propri dati)

✅ **Trigger** `on_auth_user_created` per creare automaticamente il profilo alla registrazione

---

## 🔍 Verifica dopo il ripristino

Esegui questa query per verificare:

```sql
-- Verifica tabelle
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'match_analyses');

-- Verifica RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'match_analyses');

-- Verifica policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'match_analyses');
```

**Risultato atteso:**
- ✅ 2 tabelle (`users`, `match_analyses`)
- ✅ RLS abilitato su entrambe
- ✅ 7 policies totali (3 per users, 4 per match_analyses)

---

## ⚠️ IMPORTANTE

Dopo il ripristino:
- Gli utenti esistenti in `auth.users` NON avranno automaticamente un record in `public.users`
- Se hai utenti già registrati, devi creare manualmente i loro profili OPPURE
- Il trigger creerà automaticamente i profili per i nuovi utenti che si registrano

---

## 🎯 Prossimi Passi

1. ✅ Esegui `RIPRISTINO_TABELLE.sql`
2. ✅ Verifica che le tabelle siano state create
3. ✅ Testa la registrazione di un nuovo utente (dovrebbe creare automaticamente il profilo)
4. ✅ Se hai utenti esistenti, crea i loro profili manualmente se necessario

---

**ESEGUI SUBITO IL RIPRISTINO!** 🚨

