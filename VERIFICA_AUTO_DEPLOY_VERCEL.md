# ✅ Verifica Auto-Deploy Vercel su Push Git

## 📊 Stato Attuale (dalla schermata)

✅ **Vercel sta già facendo deploy automatico!**
- Repository: `Attilam21/dota-coaching-api` ✅
- Branch monitorato: `main` ✅
- Auto-deploy: **Attivo** ✅
- Ultimi 5 deployment: Tutti "Ready" e creati automaticamente ✅

---

## 🔍 Verifica Impostazioni per Garantire Deploy Sempre Attivo

### Step 1: Verifica Settings Git su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto
3. **Settings** → **Git**
4. Verifica che:
   - ✅ **Production Branch**: `main`
   - ✅ **Auto-deploy**: **Enabled** (deve essere attivo)
   - ✅ **Repository**: `Attilam21/dota-coaching-api`

### Step 2: Verifica Webhook GitHub

1. Vai su [GitHub Repository](https://github.com/Attilam21/dota-coaching-api)
2. **Settings** → **Webhooks**
3. Verifica che ci sia un webhook per Vercel:
   - URL: `https://api.vercel.com/v1/integrations/deploy/...`
   - Events: `push` deve essere selezionato
   - Status: **Active** (verde)

**Se il webhook manca o è disattivato:**
- Vai su Vercel → Settings → Git
- Click **Disconnect** e poi **Connect** di nuovo
- Vercel creerà automaticamente il webhook

### Step 3: Verifica Permessi GitHub App

1. Vai su [GitHub Settings](https://github.com/settings/installations)
2. Cerca **Vercel** nelle GitHub Apps installate
3. Verifica che abbia accesso a `Attilam21/dota-coaching-api`
4. Se manca, autorizzalo:
   - Vercel → Settings → Git
   - Click **Connect** se necessario

---

## ⚙️ Configurazione Raccomandata

### Impostazioni Vercel (Settings → Git)

```
✅ Production Branch: main
✅ Auto-deploy: Enabled
✅ Ignore Build Step: (vuoto o disabilitato)
✅ Deploy Hooks: (opzionale, per deploy manuali)
```

### Impostazioni GitHub (Repository Settings → Webhooks)

```
✅ Payload URL: https://api.vercel.com/v1/integrations/deploy/...
✅ Content type: application/json
✅ Events: 
   ✅ push (deve essere selezionato)
   ✅ pull_request (opzionale, per preview)
✅ Active: ✅
```

---

## 🧪 Test Auto-Deploy

Per verificare che funzioni sempre:

1. **Fai un piccolo cambiamento:**
   ```bash
   # Aggiungi un commento in un file
   echo "// Test auto-deploy" >> lib/playerIdContext.tsx
   git add lib/playerIdContext.tsx
   git commit -m "test: verify auto-deploy"
   git push origin main
   ```

2. **Controlla Vercel:**
   - Entro 30-60 secondi dovresti vedere un nuovo deployment
   - Status: "Building" → "Ready"
   - Se non parte, c'è un problema di configurazione

---

## 🐞 Troubleshooting

### Problema: Deploy non parte automaticamente

**Soluzione 1: Verifica Auto-Deploy**
1. Vercel → Settings → Git
2. Assicurati che **Auto-deploy** sia **Enabled**
3. Salva

**Soluzione 2: Reconnect Repository**
1. Vercel → Settings → Git → **Disconnect**
2. **Connect Git Repository** → Seleziona `Attilam21/dota-coaching-api`
3. Verifica che Production Branch sia `main`
4. Salva

**Soluzione 3: Verifica Webhook**
1. GitHub → Settings → Webhooks
2. Se webhook Vercel manca o è disattivato:
   - Vercel → Settings → Git → Disconnect → Connect
   - Vercel ricreerà il webhook

**Soluzione 4: Verifica Permessi**
1. GitHub → Settings → Applications → Authorized OAuth Apps
2. Verifica che Vercel abbia accesso al repository
3. Se manca, autorizzalo da Vercel

### Problema: Deploy parte ma fallisce

1. Vercel → **Deployments** → Click ultimo deployment
2. Guarda **Build Logs** per errori
3. Risolvi gli errori e push di nuovo

---

## ✅ Checklist Finale

- [ ] Vercel → Settings → Git → Auto-deploy: **Enabled**
- [ ] Vercel → Settings → Git → Production Branch: **main**
- [ ] GitHub → Settings → Webhooks → Webhook Vercel: **Active**
- [ ] GitHub → Settings → Webhooks → Event "push": **Selezionato**
- [ ] Test push: Deploy parte entro 60 secondi

---

## 📝 Note Importanti

1. **Auto-deploy funziona solo per:**
   - Push su branch `main` (o branch configurato come Production)
   - Webhook GitHub attivo e configurato
   - Auto-deploy abilitato nelle impostazioni Vercel

2. **Deploy manuale funziona sempre:**
   - Vercel → Deployments → Create Deployment
   - Utile per test o deploy da altri branch

3. **Se cambi repository:**
   - Vercel creerà automaticamente nuovo webhook
   - Potrebbe richiedere autorizzazione GitHub

4. **Se il progetto è pausato:**
   - Vercel → Settings → General
   - Verifica che il progetto non sia in pausa

---

## 🎯 Risultato Atteso

Dopo la configurazione:
- ✅ Ogni push su `main` → Deploy automatico su Vercel
- ✅ Deploy parte entro 30-60 secondi dal push
- ✅ Status visibile su Vercel Dashboard
- ✅ Notifiche (se configurate) su email/Slack

