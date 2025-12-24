# 🚀 Setup Vercel - Guida Rapida (2 minuti)

## ⚠️ IMPORTANTE

Se hai già un progetto Vercel collegato a `dota2-coaching-platform`, devi cambiare repository.

---

## 🔄 Opzione 1: Cambiare Repository (VELOCE)

### Step 1: Vai su Vercel
1. Apri: [https://vercel.com/attilios-projects-a4228cc9/dota2-coaching-platform](https://vercel.com/attilios-projects-a4228cc9/dota2-coaching-platform)
2. Click su **Settings** (in alto a destra)

### Step 2: Cambia Repository
1. Nel menu laterale, click su **Git**
2. Nella sezione "Connected Git Repository", click **Disconnect**
3. Conferma la disconnessione
4. Click su **Connect Git Repository**
5. Seleziona: **`Attilam21/dota-coaching-api`**
6. Click **Connect**

### Step 3: Deploy
1. Torna alla tab **Deployments**
2. Click **Redeploy** (o aspetta l'auto-deploy)
3. **FATTO!** 🎉

---

## ➕ Opzione 2: Nuovo Progetto (PULITO)

### Step 1: Crea Nuovo Progetto
1. Vai su [https://vercel.com/new](https://vercel.com/new)
2. Nella lista repository, trova: **`Attilam21/dota-coaching-api`**
3. Click **Import**

### Step 2: Configura
**Non serve cambiare nulla!** Vercel rileva automaticamente Next.js.

Se vuoi, puoi aggiungere Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tua chiave]
```

### Step 3: Deploy
1. Click **Deploy**
2. Aspetta 2-3 minuti
3. **DONE!** Copia l'URL e testalo

### Step 4: Elimina Vecchio Progetto
1. Vai su `dota2-coaching-platform`
2. Settings → Advanced → Delete Project

---

## ✅ Verifica che Funziona

### Test 1: Home Page
Apri l'URL Vercel, dovresti vedere:
- ✅ Titolo "Improve Your Dota 2 Skills"
- ✅ Form ricerca match
- ✅ Form ricerca player
- ✅ Sezione features con 3 card

### Test 2: Match Analysis
1. Inserisci Match ID: `8576841486`
2. Click "Analyze Match"
3. Dovresti vedere:
   - ✅ Score finale (Radiant vs Dire)
   - ✅ Tabelle giocatori per entrambi i team
   - ✅ Statistiche K/D/A, GPM, XPM

### Test 3: API Routes
Prova questi endpoint:
- `https://tuo-url.vercel.app/api/health` → deve rispondere con JSON
- `https://tuo-url.vercel.app/api/opendota/heroes` → lista eroi

---

## 🐞 Troubleshooting

### Errore: "Module not found"
**Soluzione**: 
1. Vercel → Settings → General
2. Node.js Version: **18.x** o **20.x**
3. Redeploy

### Errore: "Build failed"
**Soluzione**:
1. Vai su Deployments → Click ultimo deploy
2. Leggi i "Build Logs"
3. Cerca errori TypeScript o missing dependencies
4. Se vedi errori, copiameli e li risolviamo

### Pagina bianca
**Soluzione**:
1. Apri DevTools (F12)
2. Guarda Console e Network
3. Verifica che `/api/health` risponda

---

## 📚 Link Utili

- **Repository Frontend**: [dota-coaching-api](https://github.com/Attilam21/dota-coaching-api)
- **Repository Backend**: [dota-coaching-backend](https://github.com/Attilam21/dota-coaching-backend)
- **Documentazione**: Vedi [README.md](./README.md)
- **Architettura**: Vedi [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Stato Progetto**: Vedi [DOCUMENTAZIONE_CONSOLIDATA.md](./DOCUMENTAZIONE_CONSOLIDATA.md) (sezione "Stato Progetto")

---

## ✨ Dopo il Deploy

### Configura Custom Domain (Opzionale)
1. Vercel → Settings → Domains
2. Aggiungi il tuo dominio
3. Configura DNS come indicato

### Aggiungi Environment Variables
1. Settings → Environment Variables
2. Aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

### Monitoring
- Vercel → Analytics (per vedere visite)
- Vercel → Speed Insights (per performance)

---

## 🎉 RISULTATO FINALE

**Avrai:**
- ✅ Sito online 24/7
- ✅ Auto-deploy da GitHub
- ✅ SSL automatico (HTTPS)
- ✅ CDN globale
- ✅ Zero configurazione server

**URL finale tipo:**
`https://dota-coaching-api.vercel.app`

---

Last updated: December 16, 2025 - 08:59 CET