# 🔗 Usa la Connection String per Eseguire lo Script

Hai fornito questa connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.yzfjtrteezvyoudpfccb.supabase.co:5432/postgres
```

## 🔑 STEP 1: Ottieni la Password

La connection string contiene `[YOUR-PASSWORD]` che devi sostituire con la password reale.

### Opzione A: Trovare la password esistente

1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/settings/database
2. Scorri fino a **"Connection string"**
3. Clicca su **"URI"** o **"Connection pooling"**
4. La password è nella connection string (tra `:` e `@`)

### Opzione B: Reset password (CONSIGLIATO)

1. Vai su: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/settings/database
2. Clicca su **"Reset database password"**
3. **COPIA LA NUOVA PASSWORD** (viene mostrata una sola volta!)
4. Usala nella connection string

---

## 🚀 STEP 2: Esegui lo Script

### Metodo 1: Con Supabase CLI (CONSIGLIATO)

```powershell
# Linka il progetto con la password
npx supabase link --project-ref yzfjtrteezvyoudpfccb --password "TUA_PASSWORD_QUI"

# Esegui la migration
npx supabase db push
```

### Metodo 2: Con psql (se installato)

```powershell
# Sostituisci [YOUR-PASSWORD] con la password reale
$connectionString = "postgresql://postgres:TUA_PASSWORD_QUI@db.yzfjtrteezvyoudpfccb.supabase.co:5432/postgres"
psql $connectionString -f supabase/CLEANUP_FINAL.sql
```

### Metodo 3: Con Node.js Script

```powershell
# Imposta la password come variabile d'ambiente
$env:SUPABASE_DB_PASSWORD = "TUA_PASSWORD_QUI"
node scripts/execute-cleanup-direct.js
```

### Metodo 4: SQL Editor (PIÙ SEMPLICE - NON SERVE PASSWORD)

1. Apri: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new
2. Copia il contenuto di `supabase/CLEANUP_FINAL.sql`
3. Incolla e clicca "Run"

---

## ⚠️ SICUREZZA

**NON committare mai la password nel repository!**

Se devi salvare la connection string:
- Usa `.env.local` (già nel `.gitignore`)
- Oppure variabili d'ambiente del sistema
- Mai nel codice sorgente!

---

## 📋 Connection String Completa

Dopo aver ottenuto la password, la connection string completa sarà:

```
postgresql://postgres:TUA_PASSWORD_REALE@db.yzfjtrteezvyoudpfccb.supabase.co:5432/postgres
```

**Formato:**
- `postgresql://` - Protocollo
- `postgres` - Username
- `TUA_PASSWORD_REALE` - Password (da sostituire)
- `@db.yzfjtrteezvyoudpfccb.supabase.co` - Host
- `:5432` - Porta
- `/postgres` - Database

---

## ✅ Checklist

- [ ] Password ottenuta (da dashboard o reset)
- [ ] Connection string completa creata
- [ ] Script eseguito con successo
- [ ] Verificato risultato (0 tabelle in public schema)

