# 🔍 Debug Supabase Authentication

## Problema Attuale
- Errori 403 "permission denied for table users"
- "Request rate limit reached" per refresh token
- JWT token potrebbe non essere passato correttamente nelle richieste

## Cosa Verificare

### 1. Verifica Sessione nel Browser
Apri la Console del Browser (F12) e esegui:

```javascript
// Verifica se c'è una sessione nel localStorage
const session = localStorage.getItem('sb-auth-token')
console.log('Session in localStorage:', session ? JSON.parse(session) : 'NONE')

// Verifica con Supabase client
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session from client:', session)
console.log('Access token present:', !!session?.access_token)
console.log('Access token length:', session?.access_token?.length || 0)
```

### 2. Verifica Header nelle Richieste
1. Apri Network Tab (F12 → Network)
2. Filtra per "users"
3. Clicca su una richiesta fallita (403)
4. Vai su "Headers" → "Request Headers"
5. Verifica se c'è:
   - `Authorization: Bearer <token>` (dovrebbe esserci se autenticato)
   - `apikey: <anon-key>` (dovrebbe esserci sempre)

### 3. Verifica RLS Policies
Esegui in Supabase SQL Editor:

```sql
-- Verifica policies
SELECT 
    policyname,
    cmd AS command_type,
    qual AS using_expression
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public';

-- Test diretto (dovrebbe funzionare se sei loggato)
SELECT * FROM public.users WHERE id = auth.uid();
```

### 4. Verifica Environment Variables
Controlla che siano presenti:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Soluzioni Possibili

#### A. Sessione Non Sincronizzata
Se la sessione esiste ma il JWT non viene passato, prova:
```typescript
// Imposta esplicitamente la sessione sul client
await supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token!,
})
```

#### B. Token Scaduto
Se il token è scaduto, fai logout e login di nuovo.

#### C. Rate Limit
Se vedi "Request rate limit reached", aspetta qualche minuto prima di riprovare.

## Log da Controllare

Nella console del browser, cerca:
- `[Settings] Loading profile for user: ...`
- `[Settings] Session valid: ...`
- `[Settings] Session access_token present: ...`
- `[Supabase Client] Auth state changed: ...`

Se `access_token` è `false` o `undefined`, il problema è che la sessione non è valida.

