# 🔧 Troubleshooting "Permission Denied" Errors

## Se vedi ancora "permission denied for table users" dopo aver configurato le policies

### 1. Verifica che l'utente sia autenticato ✅

**Sintomo:** L'errore appare anche dopo aver configurato correttamente le policies.

**Cause possibili:**
- La sessione Supabase non è valida
- L'utente non è loggato correttamente
- Le environment variables su Vercel non sono configurate

**Soluzione:**

1. **Fai logout e login:**
   - Clicca sul tuo profilo in basso a sinistra
   - Clicca "Logout"
   - Vai su `/auth/login`
   - Fai login di nuovo
   - Torna a `/dashboard/settings`

2. **Verifica le Environment Variables su Vercel:**
   - Vai su [Vercel Dashboard](https://vercel.com/dashboard)
   - Seleziona il progetto `dota2-coaching-platform`
   - Vai su **Settings** → **Environment Variables**
   - Verifica che ci siano:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (la tua anon key da Supabase)
   - Se mancano o sono sbagliate, aggiungile/modificale
   - **Redeploy** il progetto dopo aver cambiato le variabili

3. **Verifica la sessione nel browser:**
   - Apri la Console del Browser (F12)
   - Vai su **Application** → **Cookies**
   - Cerca cookies che iniziano con `sb-` o `supabase`
   - Se non ci sono, l'utente non è autenticato

### 2. Verifica che le policies siano attive ✅

Esegui di nuovo `supabase/quick_check.sql` e verifica:
- ✅ RLS è ABILITATO
- ✅ Policies RLS configurate (3 policies)

### 3. Test diretto della query

Prova a eseguire questa query direttamente in Supabase SQL Editor (mentre sei loggato):

```sql
-- Test: Verifica se puoi vedere i tuoi dati
SELECT id, email, dota_account_id 
FROM public.users 
WHERE id = auth.uid();
```

Se questa query funziona, il problema è nel client dell'applicazione.
Se non funziona, c'è ancora un problema con le policies.

### 4. Verifica che il client Supabase usi la sessione corretta

Il client Supabase deve essere inizializzato con `persistSession: true` (già configurato in `lib/supabase.ts`).

### 5. Hard refresh del browser

- Windows: `Ctrl + Shift + R` o `Ctrl + F5`
- Mac: `Cmd + Shift + R`

Questo forza il browser a ricaricare tutto senza usare la cache.

### 6. Verifica i log di Vercel

- Vai su Vercel Dashboard → Progetto → **Deployments**
- Clicca sull'ultimo deployment
- Controlla i **Function Logs** per errori durante le richieste

### 7. Verifica che RLS sia veramente abilitato

Esegui in Supabase SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';
```

Dovrebbe mostrare `rowsecurity = true`.

---

## Checklist completa

- [ ] Policies RLS configurate (3 policies: SELECT, UPDATE, INSERT)
- [ ] RLS abilitato sulla tabella users
- [ ] Utente autenticato (cookies presenti nel browser)
- [ ] Environment variables configurate su Vercel
- [ ] Progetto Vercel redeployato dopo aver cambiato env vars
- [ ] Hard refresh del browser fatto
- [ ] Logout/Login fatto per rinnovare la sessione

---

## Se NIENTE funziona

1. Verifica che il progetto Supabase sia attivo
2. Verifica che non ci siano rate limits
3. Controlla i log di Supabase Dashboard → **Logs** → **API Logs**
4. Verifica che l'anonymous key sia corretta (non la service role key!)

