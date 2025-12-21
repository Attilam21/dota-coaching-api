# 🔄 GUIDA RIPRISTINO BACKUP E SISTEMAZIONE LOGICHE

**Data**: 20 Dicembre 2025  
**Situazione**: Modifiche recenti hanno rotto alcune logiche del database

---

## 📊 SITUAZIONE ATTUALE

### Backup Disponibili in Supabase:
- ✅ **19 Dec 2025 22:00:29** - Backup completo (RECOMMENDED)
- ✅ **18 Dec 2025 22:09:26** - Backup disponibile
- ✅ **17 Dec 2025 21:43:20** - Backup disponibile
- ✅ **17 Dec 2025 00:00:27** - Backup disponibile
- ✅ **16 Dec 2025 03:01:02** - Backup disponibile
- ✅ **15 Dec 2025 01:55:15** - Backup disponibile
- ⏳ **20 Dec 2025 22:28:09** - Backup in corso

### Modifiche Recenti Identificate:
1. ✅ **Tabelle rimosse**: Gamification, coaching, learning paths (REMOVE_UNUSED_TABLES.sql)
2. ✅ **RLS Policies modificate**: Fix applicati (fix_rls_policies.sql, fix_all_policies.sql)
3. ✅ **Schema cleanup**: Colonne aggiunte/modificate (CLEANUP_AND_FIX.sql)
4. ✅ **Trigger modificati**: handle_new_user() trigger aggiornato

---

## 🎯 OPZIONI DI RIPRISTINO

### ⚠️ **IMPORTANTE**: Prima di procedere

**Backup NON include**:
- File Storage (immagini, upload)
- Solo include metadata del database

**Proteggi i dati utente**:
- Se ci sono dati importanti negli utenti, esportali prima!

---

## 📋 OPZIONE A: RIPRISTINO COMPLETO DA BACKUP (CONSIGLIATO)

Questa opzione ripristina tutto lo stato del database a una data precedente.

### Step 1: Verifica Dati Attuali
Prima di ripristinare, esporta eventuali dati importanti:

```sql
-- Esporta utenti attuali (solo se hai dati nuovi da salvare)
SELECT * FROM public.users;
SELECT * FROM public.match_analyses;
```

### Step 2: Ripristina da Backup in Supabase Dashboard

1. **Vai su Supabase Dashboard**:
   - https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
   - Menu laterale → **Database** → **Backups**

2. **Scegli il Backup**:
   - Raccomandato: **19 Dec 2025 22:00:29**
   - Questo è l'ultimo backup completo prima delle modifiche di oggi

3. **Ripristina il Backup**:
   - Clicca sul pulsante **"Restore"** accanto al backup del 19 dicembre
   - **⚠️ ATTENZIONE**: Questo sovrascriverà completamente il database attuale
   - Conferma l'operazione

4. **Attendi il completamento**:
   - Il ripristino può richiedere 5-15 minuti
   - Riceverai una notifica quando è completato

### Step 3: Verifica dopo Ripristino

Dopo il ripristino, esegui questo script di verifica:

```sql
-- Verifica struttura database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verifica RLS policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Verifica colonne users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
```

### Step 4: Ri-applica solo le modifiche necessarie

Dopo il ripristino, se vuoi mantenere alcune migliorie (es. RLS policies corrette), esegui:

```sql
-- Esegui solo fix_rls_policies.sql per avere policies corrette
-- File: supabase/fix_rls_policies.sql
```

---

## 📋 OPZIONE B: FIX MANUALE DELLE LOGICHE ROTTE

Se preferisci NON ripristinare da backup e sistemare solo le logiche rotte.

### Step 1: Diagnostica Problemi

Esegui lo script di diagnostica:

```sql
-- File: supabase/diagnostic_script.sql
-- Oppure file: supabase/quick_check.sql
```

### Step 2: Identifica Cosa Non Funziona

Controlla:
- ❌ Autenticazione non funziona?
- ❌ Errori "permission denied"?
- ❌ Tabelle mancanti?
- ❌ RLS policies rotte?
- ❌ Trigger non funzionanti?

### Step 3: Fix Specifici

#### A. Se RLS Policies sono rotte:

```sql
-- Esegui: supabase/fix_all_policies.sql
-- Questo rimuove tutte le policies e le ricrea corrette
```

#### B. Se Trigger handle_new_user() non funziona:

```sql
-- Vedi: supabase/CLEANUP_AND_FIX.sql (Step 2)
-- Oppure esegui solo la parte trigger:
```

```sql
-- Rimuovi trigger sbagliato
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- Crea/aggiorna funzione handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea trigger corretto su auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### C. Se mancano colonne nella tabella users:

```sql
-- Aggiungi colonne mancanti (se necessario)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_account_verified_at TIMESTAMPTZ;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dota_verification_method TEXT;

-- Verifica constraint UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_dota_account_id_key'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_dota_account_id_key UNIQUE (dota_account_id);
  END IF;
END $$;
```

#### D. Se le tabelle necessarie mancano:

```sql
-- Ricrea tabella users (se manca)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dota_account_id BIGINT UNIQUE,
  dota_account_verified_at TIMESTAMPTZ,
  dota_verification_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ricrea tabella match_analyses (se manca)
CREATE TABLE IF NOT EXISTS public.match_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
```

### Step 4: Verifica Fix

Dopo ogni fix, testa:

1. **Test Autenticazione**:
   - Vai su `/auth/login`
   - Prova a fare login
   - Verifica che funzioni

2. **Test Dashboard**:
   - Vai su `/dashboard`
   - Verifica che i dati si carichino

3. **Test Settings**:
   - Vai su `/dashboard/settings`
   - Prova a salvare il Dota Account ID
   - Verifica che non ci siano errori

---

## 📋 OPZIONE C: RIPRISTINO SELETTIVO (AVANZATO)

Se vuoi ripristinare solo alcune parti del database.

### Step 1: Scarica Backup

1. Vai su Supabase Dashboard → Database → Backups
2. Clicca **"Download"** sul backup del 19 dicembre
3. Salva il file SQL localmente

### Step 2: Estrai Solo Le Parti Necessarie

Apri il file SQL scaricato e estrai solo:
- Le INSERT per `public.users`
- Le INSERT per `public.match_analyses`
- Le CREATE TABLE se necessario

### Step 3: Importa Solo i Dati

Esegui solo le query di INSERT nel Supabase SQL Editor.

---

## 🔧 SCRIPT DI RIPRISTINO COMPLETO

Ho creato uno script completo che ripristina tutto lo stato corretto:

```sql
-- File: supabase/RESTORE_COMPLETE.sql (vedi sotto)
```

---

## ✅ CHECKLIST POST-RIPRISTINO

Dopo qualsiasi operazione di ripristino/fix, verifica:

- [ ] ✅ Tabella `users` esiste e ha tutte le colonne
- [ ] ✅ Tabella `match_analyses` esiste
- [ ] ✅ RLS è abilitato su entrambe le tabelle
- [ ] ✅ Ci sono esattamente 3 policies su `users` (SELECT, UPDATE, INSERT)
- [ ] ✅ Ci sono 3 policies su `match_analyses` (SELECT, UPDATE, INSERT)
- [ ] ✅ Trigger `on_auth_user_created` esiste su `auth.users`
- [ ] ✅ Funzione `handle_new_user()` esiste
- [ ] ✅ Indici esistono su `dota_account_id`, `user_id`, `match_id`
- [ ] ✅ Test login funziona
- [ ] ✅ Test dashboard funziona
- [ ] ✅ Test settings funziona

---

## 🚨 SE NULLA FUNZIONA

### Ultima risorsa: Ripristino Completo + Schema Fresco

1. **Ripristina da backup del 19 dicembre**
2. **Esegui lo schema pulito**:

```sql
-- Esegui: supabase/schema.sql
-- Questo applica lo schema completo e corretto
```

3. **Verifica che tutto funzioni**

---

## 📞 SUPPORTO

Se continui ad avere problemi:

1. Esegui `supabase/diagnostic_script.sql` e salva i risultati
2. Controlla i log in Supabase Dashboard → Logs → API Logs
3. Verifica errori in Vercel Dashboard → Deployments → Function Logs

---

## 📝 NOTE IMPORTANTI

### Prima di Ripristinare:
- ✅ Esporta dati utente se necessario
- ✅ Verifica quale backup è quello giusto
- ✅ Assicurati che il backup sia completo (non "in corso")

### Dopo il Ripristino:
- ✅ Non eseguire REMOVE_UNUSED_TABLES.sql se vuoi mantenere le tabelle
- ✅ Verifica sempre con quick_check.sql dopo modifiche
- ✅ Testa sempre login/dashboard dopo modifiche

### Best Practices:
- ✅ Fai sempre backup manuali prima di modifiche importanti
- ✅ Testa le modifiche su un branch/test environment se possibile
- ✅ Documenta le modifiche che fai allo schema

---

**Ultimo aggiornamento**: 20 Dicembre 2025

