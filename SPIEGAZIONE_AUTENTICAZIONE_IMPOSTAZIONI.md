# 🔐 SPIEGAZIONE AUTENTICAZIONE - PAGINA IMPOSTAZIONI

## ✅ **SÌ, È COLLEGATA AL LOGIN**

La pagina `/dashboard/settings` è **completamente collegata** al sistema di autenticazione Supabase.

---

## 🔍 **COME FUNZIONA**

### 1. **Hook `useAuth()` - Controllo Autenticazione**

```typescript
const { user, loading: authLoading } = useAuth()
```

**Cosa fa**:
- ✅ Legge lo stato di autenticazione da `AuthContext`
- ✅ `user` = oggetto utente se loggato, `null` se non loggato
- ✅ `loading` = `true` durante il caricamento iniziale della sessione

**Fonte**: `lib/auth-context.tsx`
- Controlla la sessione Supabase all'avvio dell'app
- Ascolta i cambiamenti di autenticazione (login, logout, refresh token)
- Aggiorna automaticamente lo stato quando l'utente fa login/logout

---

### 2. **Redirect Automatico se Non Autenticato**

```typescript
// Redirect se non autenticato
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/auth/login')
  }
}, [user, authLoading, router])
```

**Cosa fa**:
- ✅ Attende che il caricamento della sessione finisca (`!authLoading`)
- ✅ Se non c'è utente (`!user`), reindirizza a `/auth/login`
- ✅ Funziona automaticamente quando:
  - L'utente non è loggato
  - La sessione è scaduta
  - L'utente fa logout

---

### 3. **Protezione Lato Server (Server Action)**

```typescript
const result = await updatePlayerId(playerIdString, currentSession.access_token)
```

**Cosa fa**:
- ✅ La Server Action `updatePlayerId` verifica anche la sessione
- ✅ Controlla che `auth.uid()` sia disponibile per le RLS policies
- ✅ Se la sessione non è valida, restituisce errore

**File**: `app/actions/update-player-id.ts`
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  return {
    success: false,
    error: 'Non autenticato. Effettua il login per salvare il Player ID.',
  }
}
```

---

### 4. **Verifica Sessione Prima di Salvare**

```typescript
// Verifica sessione prima di salvare
const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

if (sessionError || !currentSession) {
  setMessage({
    type: 'error',
    text: 'Sessione non valida. Fai logout e login di nuovo.',
  })
  return
}
```

**Cosa fa**:
- ✅ Verifica che la sessione sia ancora valida prima di salvare
- ✅ Se la sessione è scaduta, mostra errore invece di salvare

---

## 📊 **FLUSSO COMPLETO**

### Scenario 1: Utente Loggato ✅
1. Utente accede a `/dashboard/settings`
2. `useAuth()` carica la sessione → `user` è presente
3. `authLoading` diventa `false`
4. Il redirect non viene eseguito (perché `user` esiste)
5. La pagina viene mostrata
6. L'utente può salvare il Player ID

### Scenario 2: Utente NON Loggato ❌
1. Utente accede a `/dashboard/settings`
2. `useAuth()` carica la sessione → `user` è `null`
3. `authLoading` diventa `false`
4. Il `useEffect` rileva `!user` → esegue `router.push('/auth/login')`
5. L'utente viene reindirizzato alla pagina di login
6. La pagina Impostazioni non viene mai mostrata

### Scenario 3: Sessione Scaduta ⚠️
1. Utente è sulla pagina Impostazioni
2. La sessione scade (token JWT scaduto)
3. `AuthContext` rileva `SIGNED_OUT` o `TOKEN_REFRESHED` fallito
4. `user` diventa `null`
5. Il `useEffect` rileva `!user` → esegue `router.push('/auth/login')`
6. L'utente viene reindirizzato alla pagina di login

---

## 🔒 **PROTEZIONI MULTIPLE**

La pagina ha **3 livelli di protezione**:

1. **Lato Client - Redirect Automatico**
   - Se `user` è `null`, redirect a `/auth/login`
   - Funziona immediatamente quando la pagina si carica

2. **Lato Client - Verifica Sessione Prima di Salvare**
   - Controlla che la sessione sia valida prima di chiamare la Server Action
   - Mostra errore se la sessione è scaduta

3. **Lato Server - Server Action**
   - Verifica che l'utente sia autenticato
   - Verifica che `auth.uid()` sia disponibile per le RLS policies
   - Restituisce errore se non autenticato

---

## 🎯 **CONCLUSIONE**

**SÌ, la pagina Impostazioni è completamente collegata al login:**

- ✅ Usa `useAuth()` per controllare lo stato di autenticazione
- ✅ Reindirizza automaticamente a `/auth/login` se non autenticato
- ✅ Verifica la sessione prima di salvare
- ✅ La Server Action verifica anche l'autenticazione lato server
- ✅ Protezione a 3 livelli (client redirect, client check, server check)

**Non è possibile accedere alla pagina Impostazioni senza essere loggati.**

