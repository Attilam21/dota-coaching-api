# 🔧 Fix: Link Conferma Email Non Funziona

## ❌ PROBLEMA

Quando clicchi sul link nella mail di conferma, ottieni:
> "Non si può aprire la pagina perché la connessione al server non è riuscita"

## 🔍 CAUSA

Il problema è nelle **impostazioni di Redirect URL** in Supabase. Il link nella mail deve puntare a un URL valido configurato in Supabase.

---

## ✅ SOLUZIONE

### Passo 1: Verifica Site URL in Supabase

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Vai su **Authentication** → **URL Configuration**
3. Verifica **Site URL**:
   - Dovrebbe essere: `https://dota2-coaching-platform.vercel.app`
   - O il tuo dominio di produzione

### Passo 2: Aggiungi Redirect URLs

Nella stessa sezione, aggiungi questi **Redirect URLs**:

```
https://dota2-coaching-platform.vercel.app/auth/callback
https://dota2-coaching-platform.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

**Nota**: Il `/**` alla fine permette tutti i path sotto quel dominio.

### Passo 3: Verifica Email Templates

1. Vai su **Authentication** → **Email Templates**
2. Clicca su **Confirm signup**
3. Verifica che il template usi:
   ```
   {{ .ConfirmationURL }}
   ```
   Non `{{ .SiteURL }}` o altri placeholder!

### Passo 4: Verifica Email Settings

1. Vai su **Authentication** → **Providers** → **Email**
2. Verifica che:
   - ✅ **Enable email confirmations** sia attivo (se vuoi richiedere conferma)
   - ✅ **Secure email change** sia attivo
   - ✅ **Double confirm email changes** sia attivo (opzionale)

---

## 🧪 TEST

Dopo aver configurato:

1. **Crea un nuovo account** con una email valida
2. **Controlla la mail** (anche spam)
3. **Clicca sul link** nella mail
4. Dovresti essere **reindirizzato** a `https://dota2-coaching-platform.vercel.app/auth/callback`
5. Poi **automaticamente** a `/` (home page)

---

## 🔍 DEBUG

Se ancora non funziona:

### Verifica il link nella mail
Il link dovrebbe essere simile a:
```
https://yzfjtrteezvyoudpfccb.supabase.co/auth/v1/verify?token=xxx&type=signup&redirect_to=https://dota2-coaching-platform.vercel.app/auth/callback
```

### Verifica il callback route
Il file `app/auth/callback/route.ts` dovrebbe:
1. Ricevere il `code` dalla query string
2. Scambiare il `code` per una sessione
3. Reindirizzare a `/`

### Controlla i log
- **Supabase Dashboard** → **Logs** → **Auth Logs**
- **Vercel Dashboard** → **Deployments** → **Function Logs**

---

## 📋 CHECKLIST

- [ ] Site URL configurato correttamente in Supabase
- [ ] Redirect URLs aggiunti (produzione + localhost)
- [ ] Email template usa `{{ .ConfirmationURL }}`
- [ ] Email confirmations abilitate
- [ ] Testato con nuovo account
- [ ] Link nella mail funziona

---

## ⚠️ NOTA IMPORTANTE

Se **non vuoi richiedere conferma email** (per sviluppo/test):

1. Vai su **Authentication** → **Providers** → **Email**
2. **Disabilita** "Enable email confirmations"
3. Gli utenti potranno accedere immediatamente dopo la registrazione

**⚠️ ATTENZIONE**: In produzione, è meglio mantenere la conferma email attiva per sicurezza!

