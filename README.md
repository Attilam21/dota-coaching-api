# 🎮 Dota 2 Coaching Platform - Frontend

**Next.js 14** web application for AI-powered Dota 2 coaching with match analysis, learning paths, and performance tracking.

## 🚀 Quick Start (5 minuti per farlo funzionare!)

### Passo 1: Clona e installa

```bash
# Clona il repository
git clone https://github.com/Attilam21/dota-coaching-api.git
cd dota-coaching-api

# Installa le dipendenze
npm install
```

### Passo 2: Configura l'ambiente

```bash
# Copia il file di esempio
cp .env.example .env.local

# Modifica .env.local con i tuoi valori
# Per ora puoi lasciare tutto così com'è, funzionerà ugualmente!
```

### Passo 3: Avvia il frontend

```bash
npm run dev
```

🎉 **Apri il browser su [http://localhost:3000](http://localhost:3000)**

### Passo 4: (Opzionale) Avvia il backend

Se vuoi il backend locale:

```bash
# In un altro terminale
git clone https://github.com/Attilam21/dota-coaching-backend.git
cd dota-coaching-backend

npm install
cp .env.example .env
# Aggiungi la tua OPENDOTA_API_KEY nel file .env

npm run start:dev  # Parte su porta 3001
```

**Se il backend non è attivo, l'app usa direttamente l'API di OpenDota! ✅**

## 🏗️ Architettura

```
Frontend (Next.js 14)       Backend (NestJS)
┌──────────────────────┐    ┌──────────────────────┐
│ localhost:3000      │ →  │ localhost:3001      │
│                     │    │                     │
│ - Home Page         │    │ - OpenDota proxy    │
│ - Match Analysis    │    │ - AI Analysis       │
│ - Player Stats      │    │ - Learning Paths    │
│ - Dashboard         │    │                     │
└──────────────────────┘    └──────────────────────┘
         │                         │
         └───── Fallback ─────────┬┘
                                  │
                      ┌──────────┴──────────┐
                      │  OpenDota API       │
                      │  (External)         │
                      └────────────────────┘
```

## ✨ Funzionalità Implementate

### ✅ Già Funzionanti
- **Autenticazione Supabase** (Login/Signup)
- **Home Page** con form per analisi match e player
- **Match Analysis** con dettagli completi e statistiche giocatori
- **Dashboard Player** completo con statistiche, profiling, performance
- **Salvataggio Analisi** in Supabase (solo dati custom)
- **Fallback automatico** a OpenDota se backend offline
- **UI responsive** con Tailwind CSS
- **Loading states** e error handling

### 🚧 In Sviluppo
- Analisi AI avanzata con OpenAI
- Learning paths con moduli interattivi
- Export dati (CSV/PDF)

## 📡 API Endpoints Frontend

### Pages
- `/` - Home page con ricerca
- `/auth/login` - Login utente
- `/auth/signup` - Registrazione utente
- `/dashboard` - Dashboard principale con statistiche
- `/dashboard/profiling` - Profilazione completa player
- `/dashboard/performance` - Performance e stile di gioco
- `/dashboard/coaching` - Coaching e task
- `/analysis/match/[id]` - Dettagli match con analisi
- `/learning` - Percorsi di apprendimento (coming soon)

### Backend Integration
Il frontend chiama il backend su:
- `GET /opendota/match/:matchId`
- `GET /opendota/player/:accountId`
- `GET /analysis/match/:matchId` (AI analysis - coming soon)

Se il backend non risponde, usa direttamente OpenDota.

## 👨‍💻 Comandi di Sviluppo

```bash
# Sviluppo con hot reload
npm run dev

# Build per produzione
npm run build

# Avvia build di produzione
npm run start

# Linting
npm run lint
```

## 🚀 Deploy su Vercel (GIÀ CONFIGURATO!)

### Automatic Deploy
Ogni push su `main` viene automaticamente deployato su Vercel.

🔗 **Dashboard Vercel**: [https://vercel.com/attilios-projects-a4228cc9/dota-2](https://vercel.com/attilios-projects-a4228cc9/dota-2)

### Environment Variables su Vercel
Aggiungi queste variabili nel dashboard Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Nota: Player ID gestito in localStorage, non in Supabase
```

## 📁 Struttura Progetto

```
dota-coaching-api/
├── app/
│   ├── layout.tsx              # Layout globale con navbar
│   ├── page.tsx                # Home page
│   ├── globals.css             # Stili Tailwind
│   └── analysis/
│       └── match/[id]/
│           └── page.tsx        # Pagina analisi match
├── public/                     # File statici
├── .env.example                # Template configurazione
├── next.config.ts              # Config Next.js
├── tailwind.config.ts          # Config Tailwind
├── tsconfig.json               # Config TypeScript
└── package.json                # Dipendenze
```

## 🐛 Risoluzione Problemi

### Il frontend non si avvia
```bash
# Pulisci e reinstalla
rm -rf node_modules .next
npm install
npm run dev
```

### Errore "Cannot find module"
```bash
# Reinstalla le dipendenze
npm install --force
```

### Match non si carica
- Verifica che il Match ID sia corretto
- Controlla la console del browser (F12)
- L'API OpenDota potrebbe essere lenta, aspetta qualche secondo

### Backend non raggiungibile
Non preoccuparti! L'app ha fallback automatico a OpenDota.

Per attivare il backend:
1. Vai su [dota-coaching-backend](https://github.com/Attilam21/dota-coaching-backend)
2. Segui le istruzioni README
3. Avvialo su porta 3001

## 🔗 Link Utili

- **Backend Repository**: [dota-coaching-backend](https://github.com/Attilam21/dota-coaching-backend)
- **Vercel Dashboard**: [Deployment](https://vercel.com/attilios-projects-a4228cc9/dota-2)
- **Supabase Dashboard**: [Database](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
- **OpenDota API**: [Documentazione](https://docs.opendota.com/)
- **Architettura Completa**: Vedi [ARCHITECTURE.md](./ARCHITECTURE.md)

## 👏 Prossimi Passi Suggeriti

1. **Testa l'app**:
   ```bash
   npm run dev
   # Vai su http://localhost:3000
   # Prova con Match ID: 8576841486
   ```

2. **Deploy automatico**:
   - Ogni push su `main` va in produzione su Vercel
   - Verifica su [vercel.com](https://vercel.com/attilios-projects-a4228cc9/dota-2)

3. **Aggiungi feature**:
   - Player dashboard in `app/analysis/player/[id]/page.tsx`
   - Learning paths in `app/learning/page.tsx`
   - Autenticazione con Supabase

4. **Deploy backend**:
   - Usa Railway o Fly.io (free tier)
   - Aggiorna `NEXT_PUBLIC_API_URL` su Vercel

## 📝 Note per lo Sviluppo

### Aggiungere una nuova pagina

```bash
# Crea file in app/
touch app/nuova-pagina/page.tsx
```

### Chiamare API backend

```typescript
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const response = await fetch(`${backendUrl}/endpoint`)
```

### Usare Tailwind CSS

Tutte le utility Tailwind sono disponibili:
```tsx
<div className="bg-red-600 text-white p-4 rounded-lg">
  Contenuto
</div>
```

---

## 🎉 L'APP È PRONTA!

**Cosa hai ora:**
- ✅ Frontend Next.js funzionante
- ✅ Backend NestJS strutturato
- ✅ Auto-deploy su Vercel configurato
- ✅ Fallback a OpenDota API
- ✅ UI responsive e professionale

**Esegui ora:**
```bash
npm run dev
```

**Poi apri:** [http://localhost:3000](http://localhost:3000)

**Testa con Match ID:** `8576841486`

🚀 **Buon coaching!**

---

## 📊 Stato Attuale (Gennaio 2025)

- ✅ **Autenticazione**: Funzionante (Supabase)
- ✅ **Dashboard**: Completo con tutte le analisi
- ✅ **Salvataggio Analisi**: Funzionante (Supabase)
- ✅ **Player ID**: Gestito in localStorage
- ✅ **Analisi**: Tutte fetchate da OpenDota (backend/frontend)
- ⚠️ **In Sviluppo**: Logger, Error Tracking, Rate Limiting

**Pattern**: OpenDota = source of truth per dati match/player, Supabase = solo autenticazione e analisi salvate

---

## 📚 Documentazione

### Documenti Principali
- **[TODO_NOW.md](./TODO_NOW.md)** - ⚠️ **LEGGI QUESTO** - Cosa fare adesso (in sviluppo)
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Stato completo del progetto
- **[DOCUMENTAZIONE_MASTER.md](./DOCUMENTAZIONE_MASTER.md)** - Indice di tutta la documentazione
- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist per deploy produzione

### Setup & Configurazione
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Setup database
- **[ADSENSE_SETUP.md](./ADSENSE_SETUP.md)** - Setup Google AdSense
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Setup deploy Vercel
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architettura sistema

---

Last updated: Gennaio 2025

<!-- Vercel deployment trigger -->
