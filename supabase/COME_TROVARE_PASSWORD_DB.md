# 🔑 Come Trovare la Password del Database PostgreSQL

## Per eseguire lo script direttamente tramite Node.js, serve la password del database.

### Opzione 1: Trovare la Password nel Dashboard Supabase (CONSIGLIATO)

1. **Vai su Supabase Dashboard**
   - Apri: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
   - Oppure: https://supabase.com/dashboard → Seleziona progetto "Dota 2"

2. **Vai su Settings → Database**
   - Nel menu laterale, clicca su **"Settings"** (icona ingranaggio)
   - Clicca su **"Database"** nella lista

3. **Trova la Connection String**
   - Scorri fino a **"Connection string"** o **"Connection pooling"**
   - Clicca su **"URI"** o **"Connection string"**
   - La password è nella connection string dopo `postgres.` e prima di `@`
   - Formato: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@...`

4. **Copia la password** (la parte tra `:` e `@`)

### Opzione 2: Reset della Password

Se non hai la password:

1. Vai su **Settings → Database**
2. Clicca su **"Reset database password"**
3. Copia la nuova password (viene mostrata una sola volta!)

### Opzione 3: Usa il SQL Editor (PIÙ SEMPLICE - CONSIGLIATO)

**Non serve la password!** Puoi eseguire lo script direttamente nel SQL Editor:

1. Vai su https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
2. Clicca su **"SQL Editor"** nel menu laterale
3. Clicca su **"+ New"** per creare una nuova query
4. Copia e incolla il contenuto di `supabase/CLEANUP_FINAL.sql`
5. Clicca su **"Run"** (o premi `Ctrl+Enter`)

✅ **Questa è l'opzione più semplice e sicura!**

---

## Se vuoi usare lo script Node.js:

Dopo aver ottenuto la password, modifica `scripts/execute-cleanup-direct.js`:

```javascript
const connectionString = `postgresql://postgres.${projectRef}:[TUA_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
```

Oppure usa una variabile d'ambiente:

```bash
export SUPABASE_DB_PASSWORD="tua_password_qui"
node scripts/execute-cleanup-direct.js
```

