# 🚀 Setup Completo Supabase CLI - Guida Completa

## 📋 Prerequisiti

- ✅ Node.js installato
- ✅ Supabase CLI installato (già fatto: `npm install --save-dev supabase`)
- ✅ Account Supabase attivo

---

## 🔐 STEP 1: Login a Supabase

Esegui questo comando per fare login:

```bash
npx supabase login
```

**Cosa succede:**
1. Si aprirà il browser automaticamente
2. Fai login con il tuo account Supabase
3. Autorizza l'accesso al CLI
4. Il token verrà salvato automaticamente

**Se il browser non si apre:**
- Copia l'URL che appare nel terminale
- Incollalo nel browser manualmente
- Autorizza l'accesso

**Verifica login:**
```bash
npx supabase projects list
```

Dovresti vedere la lista dei tuoi progetti Supabase.

---

## 🔗 STEP 2: Linka il Progetto

### Opzione A: Link automatico (CONSIGLIATO)

```bash
npx supabase link --project-ref yzfjtrteezvyoudpfccb
```

**Cosa serve:**
- Project Ref: `yzfjtrteezvyoudpfccb` (già noto)
- Password del database: ti verrà chiesta durante il link

**Dove trovare la password:**
1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/settings/database
2. Scorri fino a **"Connection string"**
3. Clicca su **"URI"** o **"Connection pooling"**
4. La password è nella connection string (tra `:` e `@`)
5. Oppure clicca **"Reset database password"** per crearne una nuova

### Opzione B: Link con password esplicita

```bash
npx supabase link --project-ref yzfjtrteezvyoudpfccb --password "tua_password_qui"
```

**Verifica link:**
Dopo il link, verifica che funzioni:

```bash
npx supabase db pull
```

Questo comando scarica lo schema attuale del database.

---

## 🛠️ STEP 3: Risolvi Problema .env.local

Se vedi l'errore `failed to parse environment file: .env.local`:

### Soluzione 1: Rinomina temporaneamente

```bash
# Windows PowerShell
Rename-Item .env.local .env.local.backup
npx supabase link --project-ref yzfjtrteezvyoudpfccb
Rename-Item .env.local.backup .env.local
```

### Soluzione 2: Crea file .env corretto

Crea/modifica `.env.local` con questo formato:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_anon_key
SUPABASE_SERVICE_ROLE_KEY=la_tua_service_role_key
```

**⚠️ IMPORTANTE:** 
- Non usare caratteri speciali strani
- Una variabile per riga
- Nessuno spazio intorno a `=`

---

## 📁 STEP 4: Struttura Progetto Supabase

Dopo il link, verrà creata questa struttura:

```
supabase/
├── config.toml          # Configurazione progetto
├── migrations/          # Migrazioni database
│   └── [timestamp]_cleanup_tables.sql
└── seed.sql            # Dati di seed (opzionale)
```

**File importanti:**
- `config.toml`: Configurazione locale del progetto
- `migrations/`: Tutte le modifiche al database (versionate)

---

## 🗄️ STEP 5: Esegui lo Script di Cleanup

### Metodo 1: Usa la migration già creata

```bash
npx supabase db push
```

Questo applicherà tutte le migration nella cartella `supabase/migrations/`.

### Metodo 2: Crea nuova migration manualmente

```bash
# Crea una nuova migration vuota
npx supabase migration new cleanup_tables

# Copia il contenuto di CLEANUP_FINAL.sql nella migration appena creata
# Poi esegui:
npx supabase db push
```

### Metodo 3: Esegui SQL direttamente (se linkato)

```bash
# Usa psql se disponibile
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@..." -f supabase/CLEANUP_FINAL.sql
```

---

## 🔍 STEP 6: Verifica Risultato

Dopo aver eseguito lo script, verifica:

```bash
# Vedi lo schema attuale
npx supabase db pull

# Oppure esegui una query di verifica
npx supabase db execute "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

**Risultato atteso:**
- 0 tabelle in `public` schema
- Solo `auth.users` rimane (gestito da Supabase)

---

## 📚 COMANDI UTILI per il Futuro

### Gestione Database

```bash
# Scarica schema dal database remoto
npx supabase db pull

# Applica migration al database remoto
npx supabase db push

# Crea nuova migration
npx supabase migration new nome_migration

# Vedi differenze tra locale e remoto
npx supabase db diff

# Reset database locale
npx supabase db reset
```

### Gestione Progetto

```bash
# Lista progetti
npx supabase projects list

# Info progetto linkato
npx supabase status

# Vedi configurazione
npx supabase status --output json
```

### SQL e Query

```bash
# Esegui query SQL (se psql installato)
npx supabase db execute "SELECT * FROM auth.users LIMIT 5;"

# Dump database
npx supabase db dump -f backup.sql
```

### Generazione Types

```bash
# Genera types TypeScript dal database
npx supabase gen types typescript --linked > types/database.ts
```

---

## 🐛 Troubleshooting

### Errore: "failed to parse environment file"

**Causa:** File `.env.local` corrotto o con caratteri speciali

**Soluzione:**
```bash
# Rinomina temporaneamente
Rename-Item .env.local .env.local.backup
# Esegui comando
# Poi ripristina
Rename-Item .env.local.backup .env.local
```

### Errore: "project not found"

**Causa:** Project ref errato o non autorizzato

**Soluzione:**
```bash
# Verifica progetti disponibili
npx supabase projects list

# Usa il project ref corretto
npx supabase link --project-ref [CORRETTO_PROJECT_REF]
```

### Errore: "password authentication failed"

**Causa:** Password database errata

**Soluzione:**
1. Vai su Supabase Dashboard → Settings → Database
2. Reset password del database
3. Usa la nuova password nel link

### Errore: "connection refused"

**Causa:** Database non raggiungibile o firewall

**Soluzione:**
- Verifica che il progetto Supabase sia attivo
- Controlla le impostazioni di rete/firewall
- Prova a resettare la password

---

## ✅ Checklist Setup Completo

- [ ] Login eseguito (`npx supabase login`)
- [ ] Progetto linkato (`npx supabase link`)
- [ ] Password database configurata
- [ ] Problema `.env.local` risolto
- [ ] Migration creata/verificata
- [ ] Script cleanup eseguito (`npx supabase db push`)
- [ ] Risultato verificato

---

## 🎯 Prossimi Passi

Dopo aver configurato il CLI, potrai:

1. **Gestire migration** in modo versionato
2. **Sincronizzare** schema locale e remoto
3. **Generare types TypeScript** automaticamente
4. **Eseguire script SQL** in modo sicuro
5. **Fare backup** del database facilmente

---

## 📖 Documentazione Ufficiale

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Type Generation](https://supabase.com/docs/guides/cli/generating-types)

---

**Ultimo aggiornamento:** 23 Dicembre 2025

