# 🚀 Guida Setup Supabase CLI - Passo Passo

## ⚠️ IMPORTANTE: Esegui questi comandi nel TUO terminale (non tramite AI)

---

## 📋 STEP 1: Login a Supabase

Apri il terminale PowerShell nella cartella del progetto e esegui:

```powershell
cd "C:\Users\attil\Desktop\dota-2-giusto\dota-coaching-api\dota-coaching-api"
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

**Verifica che il login sia andato a buon fine:**
```powershell
npx supabase projects list
```

Dovresti vedere la lista dei tuoi progetti Supabase, incluso "Dota 2".

---

## 🔗 STEP 2: Linka il Progetto

Ora linka il progetto al database:

```powershell
npx supabase link --project-ref yzfjtrteezvyoudpfccb
```

**Ti verrà chiesta la password del database.**

### 🔑 Come trovare la password:

1. **Vai su:** https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/settings/database

2. **Scorri fino a "Connection string"**

3. **Clicca su "URI"** o **"Connection pooling"**

4. **La password è nella connection string:**
   ```
   postgresql://postgres.yzfjtrteezvyoudpfccb:[QUESTO_È_LA_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

5. **Oppure resetta la password:**
   - Clicca su **"Reset database password"**
   - Copia la nuova password (viene mostrata una sola volta!)
   - Usala nel comando `link`

**Dopo il link, verifica:**
```powershell
npx supabase status
```

Dovresti vedere le informazioni del progetto linkato.

---

## 🛠️ STEP 3: Risolvi Problema .env.local (se necessario)

Se vedi l'errore `failed to parse environment file: .env.local`:

### Soluzione: Rinomina temporaneamente

```powershell
# Rinomina il file
Rename-Item .env.local .env.local.backup

# Esegui il link
npx supabase link --project-ref yzfjtrteezvyoudpfccb

# Ripristina il file
Rename-Item .env.local.backup .env.local
```

---

## 📁 STEP 4: Verifica Struttura

Dopo il link, verifica che sia stata creata la cartella migrations:

```powershell
ls supabase\migrations
```

Dovresti vedere la migration `*_cleanup_tables.sql` che abbiamo creato.

---

## 🗄️ STEP 5: Esegui lo Script di Cleanup

Ora puoi eseguire lo script di pulizia:

```powershell
npx supabase db push
```

**Cosa fa:**
- Applica tutte le migration nella cartella `supabase/migrations/`
- Inclusa la migration di cleanup che rimuove le tabelle non utilizzate

**⚠️ ATTENZIONE:** Questo comando ELIMINA dati! Assicurati di aver verificato lo script prima.

---

## 🔍 STEP 6: Verifica Risultato

Dopo l'esecuzione, verifica che le tabelle siano state rimosse:

```powershell
# Vedi lo schema attuale
npx supabase db pull

# Oppure vai su Supabase Dashboard → Table Editor
# Dovresti vedere 0 tabelle in "public" schema
```

**Risultato atteso:**
- ✅ 0 tabelle in `public` schema
- ✅ Solo `auth.users` rimane (gestito da Supabase, non visibile in Table Editor)

---

## 📚 COMANDI UTILI per il Futuro

### Gestione Database

```powershell
# Scarica schema dal database remoto
npx supabase db pull

# Applica migration al database remoto
npx supabase db push

# Crea nuova migration
npx supabase migration new nome_migration

# Vedi differenze tra locale e remoto
npx supabase db diff

# Reset database locale (se configurato)
npx supabase db reset
```

### Gestione Progetto

```powershell
# Lista progetti
npx supabase projects list

# Info progetto linkato
npx supabase status

# Vedi configurazione (JSON)
npx supabase status --output json
```

### Generazione Types TypeScript

```powershell
# Genera types TypeScript dal database
npx supabase gen types typescript --linked > types/database.ts
```

Questo è molto utile per avere autocompletamento TypeScript!

---

## 🐛 Troubleshooting

### Errore: "project not found"

**Soluzione:**
```powershell
# Verifica progetti disponibili
npx supabase projects list

# Usa il project ref corretto
npx supabase link --project-ref [CORRETTO_PROJECT_REF]
```

### Errore: "password authentication failed"

**Soluzione:**
1. Vai su Supabase Dashboard → Settings → Database
2. Clicca "Reset database password"
3. Copia la nuova password
4. Esegui di nuovo: `npx supabase link --project-ref yzfjtrteezvyoudpfccb`

### Errore: "connection refused"

**Soluzione:**
- Verifica che il progetto Supabase sia attivo
- Controlla le impostazioni di rete/firewall
- Prova a resettare la password

### Errore: "failed to parse environment file"

**Soluzione:**
```powershell
# Rinomina temporaneamente
Rename-Item .env.local .env.local.backup
# Esegui comando
# Poi ripristina
Rename-Item .env.local.backup .env.local
```

---

## ✅ Checklist Completa

Esegui questi comandi in ordine:

- [ ] `npx supabase login` → Login completato
- [ ] `npx supabase projects list` → Vedi i tuoi progetti
- [ ] `npx supabase link --project-ref yzfjtrteezvyoudpfccb` → Progetto linkato
- [ ] `npx supabase status` → Verifica link
- [ ] `npx supabase db push` → Esegui cleanup
- [ ] Verifica risultato su Supabase Dashboard

---

## 🎯 Dopo il Setup

Una volta configurato, potrai:

1. ✅ **Gestire migration** in modo versionato
2. ✅ **Sincronizzare** schema locale e remoto
3. ✅ **Generare types TypeScript** automaticamente
4. ✅ **Eseguire script SQL** in modo sicuro
5. ✅ **Fare backup** del database facilmente

---

## 📖 Documentazione

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

**Esegui questi comandi nel TUO terminale e dimmi se hai problemi!**

