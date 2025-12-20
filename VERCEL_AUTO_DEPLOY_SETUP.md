# 🚀 Setup Auto-Deploy Vercel - Guida Completa

## ✅ Push Completato

Il push su GitHub è stato completato con successo:
- **Repository**: `Attilam21/dota-coaching-api`
- **Branch**: `main`
- **Commit pushati**: 4 commit (inclusi fix timeout e middleware)

---

## 🔍 Verifica Configurazione Vercel

### Step 1: Verifica Collegamento Repository

1. Vai su [Vercel Dashboard](https://vercel.com/attilios-projects-a4228cc9/dota-2)
2. Oppure cerca il progetto: [Vercel Projects](https://vercel.com/attilios-projects-a4228cc9)

### Step 2: Controlla Settings → Git

1. Vai su **Settings** → **Git**
2. Verifica che il repository collegato sia:
   ```
   Attilam21/dota-coaching-api
   ```
3. Verifica che il branch di produzione sia:
   ```
   main
   ```

### Step 3: Se il Repository NON è Collegato

#### Opzione A: Collega Repository Esistente

1. Vai su **Settings** → **Git**
2. Click **Connect Git Repository**
3. Seleziona **GitHub**
4. Autorizza Vercel (se richiesto)
5. Cerca e seleziona: **`Attilam21/dota-coaching-api`**
6. Click **Import**
7. Configura:
   - **Framework Preset**: Next.js (dovrebbe essere auto-rilevato)
   - **Root Directory**: `./` (lasciare vuoto)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
8. Click **Deploy**

#### Opzione B: Crea Nuovo Progetto

1. Vai su [Vercel New Project](https://vercel.com/new)
2. Seleziona **Import Git Repository**
3. Cerca: **`Attilam21/dota-coaching-api`**
4. Click **Import**
5. Configura come sopra
6. Click **Deploy**

---

## 🔧 Configurazione Auto-Deploy

### Verifica Auto-Deploy Settings

1. Vai su **Settings** → **Git**
2. Verifica che sia abilitato:
   - ✅ **Production Branch**: `main`
   - ✅ **Auto-deploy on push**: Enabled
   - ✅ **Preview Deployments**: Enabled (opzionale)

### Verifica Webhook GitHub

1. Vai su [GitHub Repository](https://github.com/Attilam21/dota-coaching-api)
2. Vai su **Settings** → **Webhooks**
3. Verifica che ci sia un webhook di Vercel:
   - **URL**: `https://api.vercel.com/v1/integrations/deploy/...`
   - **Events**: `push`, `pull_request`
   - **Status**: ✅ Active

Se non c'è il webhook, Vercel lo creerà automaticamente quando colleghi il repository.

---

## 🚨 Troubleshooting: Vercel Non Deploya

### Problema 1: Repository Non Collegato

**Sintomi**: 
- Push su GitHub ma nessun deploy su Vercel
- Nessun progetto visibile su Vercel

**Soluzione**:
1. Segui **Step 3** sopra per collegare il repository
2. Dopo il collegamento, fai un nuovo push o triggera manualmente un deploy

### Problema 2: Webhook Non Funziona

**Sintomi**:
- Repository collegato ma deploy non parte automaticamente
- Deploy manuale funziona

**Soluzione**:
1. Vercel Dashboard → **Settings** → **Git**
2. Click **Disconnect** (temporaneamente)
3. Click **Connect Git Repository** di nuovo
4. Seleziona lo stesso repository
5. Questo ricrea il webhook

### Problema 3: Branch Sbagliato

**Sintomi**:
- Push su branch diverso da `main`
- Deploy non parte

**Soluzione**:
1. Vercel Dashboard → **Settings** → **Git**
2. Cambia **Production Branch** in `main`
3. Oppure fai push su `main`:
   ```bash
   git checkout main
   git merge [altro-branch]
   git push origin main
   ```

### Problema 4: Build Fails

**Sintomi**:
- Deploy parte ma fallisce
- Errori nei build logs

**Soluzione**:
1. Vai su **Deployments** → Click ultimo deploy fallito
2. Leggi **Build Logs**
3. Cerca errori TypeScript, dipendenze, o environment variables
4. Risolvi gli errori e fai nuovo push

---

## ✅ Verifica Deploy Riuscito

### Dopo il Push, Verifica:

1. **Vercel Dashboard** → **Deployments**
2. Dovresti vedere un nuovo deployment:
   - Status: ✅ **Ready** (verde)
   - Commit: `c7d3ed0` o più recente
   - Branch: `main`

3. **Click sul deployment** per vedere:
   - Build Logs (dovrebbero essere verdi)
   - URL di produzione
   - Tempo di build

### Test URL Produzione

1. Copia l'URL del deployment (es: `https://dota-2-xxx.vercel.app`)
2. Apri in browser
3. Verifica che:
   - ✅ Home page carica
   - ✅ `/api/health` risponde
   - ✅ Nessun errore in console

---

## 🔄 Trigger Manuale Deploy

Se l'auto-deploy non funziona, puoi triggerare manualmente:

### Opzione 1: Redeploy Ultimo Commit

1. Vercel Dashboard → **Deployments**
2. Click sui **3 puntini** sull'ultimo deployment
3. Click **Redeploy**
4. Conferma

### Opzione 2: Push Vuoto

```bash
git commit --allow-empty -m "trigger deploy"
git push origin main
```

### Opzione 3: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📋 Checklist Post-Push

Dopo aver fatto push, verifica:

- [ ] Push completato su GitHub (verifica su github.com)
- [ ] Vercel Dashboard mostra nuovo deployment
- [ ] Build completato con successo (status verde)
- [ ] URL produzione funziona
- [ ] `/api/health` risponde correttamente
- [ ] Home page carica senza errori

---

## 🎯 Prossimi Passi

1. **Attendi 1-2 minuti** dopo il push
2. **Controlla Vercel Dashboard** per vedere il nuovo deployment
3. Se non appare, segui **Troubleshooting** sopra
4. Se appare ma fallisce, leggi i **Build Logs**

---

## 📞 Link Utili

- **Vercel Dashboard**: [https://vercel.com/attilios-projects-a4228cc9/dota-2](https://vercel.com/attilios-projects-a4228cc9/dota-2)
- **GitHub Repository**: [https://github.com/Attilam21/dota-coaching-api](https://github.com/Attilam21/dota-coaching-api)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)

---

**Ultimo push**: 2025-12-20  
**Commit**: `c7d3ed0` - chore: aggiornato playerIdContext

