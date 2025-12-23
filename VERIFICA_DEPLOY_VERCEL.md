# 🔍 Verifica Deploy Automatico Vercel

## ✅ Stato Attuale

- **Repository**: `https://github.com/Attilam21/dota-coaching-api.git`
- **Branch**: `main` (corretto)
- **Ultimo commit**: Già pushato su GitHub

## 🔍 Perché Vercel Non Fa Deploy Automatico?

### Possibili Cause:

1. **Progetto Vercel non collegato al repository corretto**
2. **Branch monitorato non è "main"**
3. **Webhook GitHub non configurato**
4. **Progetto Vercel disabilitato o pausato**

---

## 📋 Checklist Verifica

### Step 1: Verifica Repository Collegato

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto (probabilmente `dota2-coaching-platform` o `dota-coaching-api`)
3. Vai su **Settings** → **Git**
4. Verifica che il repository sia: `Attilam21/dota-coaching-api`
5. Verifica che il branch sia: `main`

**Se il repository è diverso:**
- Click **Disconnect**
- Click **Connect Git Repository**
- Seleziona `Attilam21/dota-coaching-api`
- Click **Connect**

### Step 2: Verifica Branch Monitorato

1. Vercel → Settings → Git
2. Verifica **Production Branch**: deve essere `main`
3. Se è diverso, cambialo in `main`

### Step 3: Verifica Webhook GitHub

1. Vai su [GitHub Repository](https://github.com/Attilam21/dota-coaching-api)
2. Vai su **Settings** → **Webhooks**
3. Verifica che ci sia un webhook per Vercel
4. Se manca, Vercel lo creerà automaticamente quando colleghi il repository

### Step 4: Forza Deploy Manuale

Se tutto è configurato correttamente ma non parte automaticamente:

1. Vercel → **Deployments**
2. Click **Redeploy** sull'ultimo deployment
3. Oppure crea un nuovo deployment da `main` branch

---

## 🚀 Soluzione Rapida

### Opzione A: Verifica e Fix Impostazioni

1. **Vercel Dashboard** → Progetto → **Settings** → **Git**
2. Verifica:
   - ✅ Repository: `Attilam21/dota-coaching-api`
   - ✅ Production Branch: `main`
   - ✅ Auto-deploy: **Enabled**
3. Se qualcosa è sbagliato, correggilo e salva

### Opzione B: Reconnect Repository

1. **Vercel Dashboard** → Progetto → **Settings** → **Git**
2. Click **Disconnect**
3. Click **Connect Git Repository**
4. Seleziona `Attilam21/dota-coaching-api`
5. Click **Connect**
6. Verifica che Production Branch sia `main`
7. Click **Save**

### Opzione C: Trigger Manuale

1. Vercel → **Deployments**
2. Click **Create Deployment**
3. Seleziona branch: `main`
4. Click **Deploy**

---

## ✅ Verifica che Funziona

Dopo aver configurato:

1. Fai un piccolo cambiamento (es. commento in un file)
2. Commit e push:
   ```bash
   git add .
   git commit -m "test: trigger vercel deploy"
   git push origin main
   ```
3. Vai su Vercel → **Deployments**
4. Dovresti vedere un nuovo deployment in corso entro 30 secondi

---

## 🐞 Se Ancora Non Funziona

### Controlla Logs Vercel

1. Vercel → **Deployments** → Click ultimo deployment
2. Guarda **Build Logs** per errori
3. Se vedi errori, copiali e risolviamoli

### Verifica Permessi GitHub

1. Vai su [GitHub Settings](https://github.com/settings/installations)
2. Verifica che Vercel abbia accesso al repository
3. Se manca, autorizzalo

### Contatta Supporto Vercel

Se nulla funziona, contatta supporto Vercel con:
- Nome progetto
- Repository GitHub
- Branch monitorato
- Screenshot delle impostazioni Git

---

## 📝 Note Importanti

- **Vercel fa deploy automatico solo quando:**
  - Push su branch `main` (o branch configurato come Production)
  - Webhook GitHub è configurato correttamente
  - Progetto non è pausato

- **Deploy manuale funziona sempre:**
  - Vercel → Deployments → Create Deployment

- **Se cambi repository:**
  - Vercel creerà automaticamente un nuovo webhook
  - Potrebbe richiedere autorizzazione GitHub

