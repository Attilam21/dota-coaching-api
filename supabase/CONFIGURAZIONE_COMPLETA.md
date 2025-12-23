# 🔧 Configurazione Completa Supabase

## ✅ Service Role Key Configurata

La tua service role key è stata salvata in `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1
```

---

## ⚠️ IMPORTANTE: Service Role Key vs Database Password

**Sono DUE cose diverse:**

1. **Service Role Key** (`sb_secret_...`)
   - Usata per l'API REST di Supabase
   - Bypassa RLS (Row Level Security)
   - Già configurata ✅

2. **Database Password** (per PostgreSQL)
   - Serve per connessioni dirette PostgreSQL
   - Serve per Supabase CLI `link`
   - **NON è la service role key!**

---

## 🚨 AZIONE IMMEDIATA: Ripristina le Tabelle

### Metodo 1: SQL Editor (CONSIGLIATO - PIÙ VELOCE)

1. **Apri:** https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new

2. **Copia TUTTO** il contenuto di `supabase/RIPRISTINO_TABELLE.sql`

3. **Incolla** e clicca **"Run"**

✅ **Questo è il metodo più veloce e non richiede password!**

---

### Metodo 2: Supabase CLI (se hai la password DB)

Se vuoi usare il CLI per il futuro:

```powershell
# 1. Login (se non l'hai già fatto)
npx supabase login

# 2. Linka con la password del database (NON la service role key!)
npx supabase link --project-ref yzfjtrteezvyoudpfccb --password "PASSWORD_DATABASE"

# 3. Crea migration di ripristino
npx supabase migration new ripristino_tabelle

# 4. Copia il contenuto di RIPRISTINO_TABELLE.sql nella migration
# 5. Esegui
npx supabase db push
```

**Dove trovare la password del database:**
- Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/settings/database
- Scorri fino a "Connection string"
- Clicca "URI" → la password è tra `:` e `@`
- Oppure clicca "Reset database password"

---

## 📋 Cosa viene ripristinato:

✅ `public.users` - Profilo utente
✅ `public.match_analyses` - Analisi match salvate
✅ Indici per performance
✅ RLS e policies
✅ Trigger per auto-creazione profilo

---

## 🔐 Variabili d'Ambiente Configurate

Nel file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[la tua anon key]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1
```

**⚠️ IMPORTANTE:**
- `.env.local` è già nel `.gitignore` ✅
- **NON committare mai** la service role key nel repository!
- Usa sempre `.env.local` per variabili sensibili

---

## ✅ Checklist

- [x] Service role key salvata in `.env.local`
- [ ] Tabelle ripristinate (`RIPRISTINO_TABELLE.sql` eseguito)
- [ ] Verifica tabelle create (Table Editor)
- [ ] Test registrazione nuovo utente (dovrebbe creare profilo automaticamente)

---

## 🎯 Prossimi Passi

1. **ESEGUI SUBITO** `RIPRISTINO_TABELLE.sql` nel SQL Editor
2. Verifica che le tabelle siano state create
3. Testa l'applicazione

---

**ESEGUI IL RIPRISTINO ORA!** 🚨

