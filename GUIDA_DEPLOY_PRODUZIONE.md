# 🚀 Guida Deploy Produzione - PRO DOTA ANALISI

**Data**: Gennaio 2025  
**Status**: ✅ Pronto per produzione

---

## ✅ VERIFICA PRE-DEPLOY

### Build Locale
```bash
npm run build
```
**Risultato**: ✅ Build completato con successo (38 pagine generate)

**Note**: Gli errori mostrati sono solo warning per route di test (`/api/test/*`) - non bloccano il deploy.

---

## 🎯 STEP 1: VERCEL DASHBOARD

### 1.1 Accedi a Vercel
1. Vai su: [Vercel Dashboard](https://vercel.com/attilios-projects-a4228cc9/dota-2)
2. Oppure: [https://vercel.com/dashboard](https://vercel.com/dashboard)

### 1.2 Verifica Progetto
- Se il progetto esiste già:
  - Verifica che sia collegato a `Attilam21/dota-coaching-api`
  - Se non lo è, vai a Settings → Git → Connect Repository

- Se il progetto NON esiste:
  - Vai su [New Project](https://vercel.com/new)
  - Seleziona `Attilam21/dota-coaching-api`
  - Click "Import"

---

## 🔑 STEP 2: ENVIRONMENT VARIABLES (CRITICO!)

### 2.1 Vai su Settings → Environment Variables

### 2.2 Aggiungi Variabili Obbligatorie

#### Supabase (OBBLIGATORIO)
```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[la tua anon key]
```

**Come ottenere Supabase Anon Key:**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Settings → API
3. Copia "anon public" key (inizia con `eyJ...`)
4. Incolla in Vercel

#### Backend (OPZIONALE - se hai backend)
```env
NEXT_PUBLIC_API_URL=https://dota-coaching-backend.fly.dev
```

**Nota**: Se non configurato, l'app usa direttamente OpenDota API (funziona comunque!)

### 2.3 Salva e Redeploy
- Dopo aver aggiunto le variabili, vai su Deployments
- Click "Redeploy" sull'ultimo deployment
- Oppure fai un nuovo push su `main`

---

## 🚀 STEP 3: DEPLOY

### Opzione A: Auto-Deploy (CONSIGLIATO)
- Ogni push su `main` → Deploy automatico
- **Già configurato!** Basta fare push

### Opzione B: Deploy Manuale
1. Vai su Deployments
2. Click "Redeploy" sull'ultimo deployment
3. Oppure: Settings → Git → Redeploy

---

## ✅ STEP 4: VERIFICA DEPLOY

### 4.1 Attendi Completamento (2-3 minuti)
- Vai su Deployments
- Verifica che lo status sia "Ready" (verde)

### 4.2 Test Home Page
Apri l'URL Vercel (es: `https://dota-coaching-api.vercel.app`):
- [ ] Pagina si carica
- [ ] Navbar visibile
- [ ] Form ricerca funzionanti
- [ ] Nessun errore in console (F12)

### 4.3 Test Autenticazione
1. Vai su `/auth/signup`
2. Crea un account di test
3. Verifica che:
   - [ ] Signup funziona
   - [ ] Redirect a dashboard
   - [ ] Login funziona

### 4.4 Test Dashboard
1. Vai su `/dashboard`
2. Inserisci un Player ID (es: `123456789`)
3. Verifica che:
   - [ ] Statistiche si caricano
   - [ ] Grafici si visualizzano
   - [ ] Nessun errore

### 4.5 Test API
Apri nel browser:
- `https://tuo-url.vercel.app/api/health`
- Dovrebbe rispondere: `{"status":"healthy",...}`

---

## 🔧 STEP 5: CONFIGURAZIONE SUPABASE

### 5.1 Verifica Database Schema
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. SQL Editor
3. Esegui:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
4. Verifica che esista almeno `users`

### 5.2 Verifica RLS Policies
1. Authentication → Policies
2. Verifica che RLS sia abilitato per `public.users`
3. Se mancano, crea:
```sql
-- SELECT policy
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- UPDATE policy  
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- INSERT policy
CREATE POLICY "Users can insert own data"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);
```

---

## 📊 STEP 6: MONITORAGGIO

### 6.1 Vercel Analytics
- Vai su Analytics (se abilitato)
- Monitora visite e performance

### 6.2 Vercel Logs
- Vai su Deployments → Ultimo deploy → Logs
- Controlla errori runtime

### 6.3 Browser Console
- Apri DevTools (F12)
- Controlla Console per errori JavaScript
- Controlla Network per richieste fallite

---

## 🐛 TROUBLESHOOTING

### Problema: "Failed to fetch" o errori Supabase
**Causa**: Environment variables non configurate  
**Soluzione**:
1. Vai su Vercel → Settings → Environment Variables
2. Verifica che `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` siano presenti
3. Redeploy

### Problema: "Permission denied"
**Causa**: RLS policies non configurate  
**Soluzione**: Vedi Step 5.2

### Problema: Pagina bianca
**Causa**: Errore JavaScript  
**Soluzione**:
1. Apri DevTools (F12)
2. Controlla Console
3. Cerca errori e risolvili

### Problema: Build fallisce
**Causa**: Errori nel codice  
**Soluzione**:
1. Vai su Deployments → Ultimo deploy
2. Leggi Build Logs
3. Risolvi errori indicati

---

## ✅ CHECKLIST FINALE

Prima di considerare il deploy completato:

- [ ] Build locale funziona (`npm run build`)
- [ ] Environment variables configurate su Vercel
- [ ] Deploy completato con successo
- [ ] Home page si carica
- [ ] Autenticazione funziona (signup/login)
- [ ] Dashboard carica dati
- [ ] Nessun errore in console
- [ ] Supabase RLS policies configurate

---

## 🎉 DOPO IL DEPLOY

### Cosa Funziona Subito
- ✅ Home page
- ✅ Autenticazione (login/signup)
- ✅ Dashboard completo
- ✅ Analisi match
- ✅ Tutte le feature core

### Cosa Configurare Dopo
- ⏳ Google AdSense (quando approvato)
- ⏳ Google Analytics (opzionale)
- ⏳ Custom domain (opzionale)

---

## 📝 NOTE IMPORTANTI

### Auto-Deploy
- ✅ Ogni push su `main` → Deploy automatico
- ✅ Zero configurazione server
- ✅ SSL/HTTPS automatico

### Performance
- ✅ CDN globale incluso
- ✅ Edge functions disponibili
- ✅ Ottimizzazioni automatiche

### Costi
- ✅ Free tier generoso
- ✅ Nessun costo iniziale
- ✅ Pay-as-you-grow

---

**URL Finale**: `https://dota-coaching-api.vercel.app` (o il tuo custom domain)

**Ultimo aggiornamento**: Gennaio 2025

