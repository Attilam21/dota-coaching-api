# 🔧 Configurazione Redirect URLs in Supabase - ISTRUZIONI STEP-BY-STEP

## ⚠️ IMPORTANTE

Queste impostazioni **NON possono essere modificate tramite MCP**. Devono essere configurate **manualmente** nel dashboard di Supabase.

---

## 📋 STEP-BY-STEP

### 1. Apri Supabase Dashboard

Vai su: [https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)

### 2. Vai su Authentication → URL Configuration

1. Nel menu laterale sinistro, clicca su **"Authentication"**
2. Clicca su **"URL Configuration"** (sotto "Configuration")

### 3. Configura Site URL

Nel campo **"Site URL"**, inserisci:
```
https://dota2-coaching-platform.vercel.app
```

**Clicca "Save"** dopo aver inserito l'URL.

### 4. Aggiungi Redirect URLs

Nella sezione **"Redirect URLs"**, clicca su **"Add URL"** e aggiungi questi URL (uno alla volta):

1. **Primo URL**:
   ```
   https://dota2-coaching-platform.vercel.app/auth/callback
   ```

2. **Secondo URL** (per permettere tutti i path):
   ```
   https://dota2-coaching-platform.vercel.app/**
   ```

3. **Terzo URL** (per sviluppo locale):
   ```
   http://localhost:3000/auth/callback
   ```

4. **Quarto URL** (per sviluppo locale - tutti i path):
   ```
   http://localhost:3000/**
   ```

**Clicca "Save"** dopo aver aggiunto tutti gli URL.

---

## ✅ VERIFICA

Dopo aver salvato, dovresti vedere:

**Site URL:**
- `https://dota2-coaching-platform.vercel.app`

**Redirect URLs:**
- `https://dota2-coaching-platform.vercel.app/auth/callback`
- `https://dota2-coaching-platform.vercel.app/**`
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/**`

---

## 🧪 TEST

Dopo aver configurato:

1. **Crea un nuovo account** su `/auth/signup`
2. **Controlla la mail** (anche spam)
3. **Clicca sul link** nella mail di conferma
4. Dovresti essere reindirizzato a `https://dota2-coaching-platform.vercel.app/auth/callback`
5. Poi automaticamente alla home page `/`

---

## 🔍 SE NON FUNZIONA

### Verifica il link nella mail
Il link dovrebbe essere simile a:
```
https://yzfjtrteezvyoudpfccb.supabase.co/auth/v1/verify?token_hash=xxx&type=signup&redirect_to=https://dota2-coaching-platform.vercel.app/auth/callback
```

### Controlla i log
- **Supabase Dashboard** → **Logs** → **Auth Logs**
- Cerca errori come "Invalid redirect URL" o "Redirect URL not allowed"

### Verifica che il callback route sia deployato
- **Vercel Dashboard** → **Deployments**
- Verifica che l'ultimo deploy sia completato

---

## 📸 SCREENSHOT REFERENCE

Se hai bisogno di aiuto visivo:
1. **Site URL**: Campo in alto nella pagina "URL Configuration"
2. **Redirect URLs**: Lista sotto "Site URL", con pulsante "Add URL"

---

## ⚠️ NOTA

Se **non vuoi richiedere conferma email** (per test rapidi):

1. Vai su **Authentication** → **Providers** → **Email**
2. **Disabilita** "Enable email confirmations"
3. Gli utenti potranno accedere immediatamente dopo la registrazione

**⚠️ ATTENZIONE**: In produzione, è meglio mantenere la conferma email attiva per sicurezza!

