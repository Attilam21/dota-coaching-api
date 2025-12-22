# 📚 Documentazione Master - PRO DOTA ANALISI AttilaLAB

**Ultimo aggiornamento**: Gennaio 2025  
**Versione**: 1.0.0

---

## 📖 INDICE DOCUMENTAZIONE

### Documenti Principali
1. **[README.md](./README.md)** - Quick start e overview
2. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Stato attuale del progetto
3. **[TODO_NOW.md](./TODO_NOW.md)** - Cosa fare adesso (in sviluppo)
4. **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist per deploy
5. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architettura sistema

### Setup & Configurazione
6. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Setup database Supabase
7. **[SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md)** - Risoluzione problemi Supabase
8. **[ADSENSE_SETUP.md](./ADSENSE_SETUP.md)** - Setup Google AdSense
9. **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Setup deploy Vercel

### Documentazione API
10. **[_kb/opendota/](./_kb/opendota/)** - Documentazione OpenDota API
    - `README.md` - Overview
    - `endpoints.md` - Endpoint disponibili
    - `errors-and-limits.md` - Errori e limiti
    - `calculations.md` - Calcoli e formule
    - `quick-reference.md` - Riferimento rapido

---

## 🎯 QUICK START

### Per Sviluppatori
1. Leggi [README.md](./README.md) per setup iniziale
2. Leggi [TODO_NOW.md](./TODO_NOW.md) per sapere cosa fare
3. Leggi [ARCHITECTURE.md](./ARCHITECTURE.md) per capire l'architettura

### Per Deploy
1. Leggi [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
2. Verifica [PROJECT_STATUS.md](./PROJECT_STATUS.md)
3. Configura [VERCEL_SETUP.md](./VERCEL_SETUP.md)

### Per Troubleshooting
1. [SUPABASE_TROUBLESHOOTING.md](./SUPABASE_TROUBLESHOOTING.md) - Problemi Supabase
2. [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Sezione troubleshooting

---

## 📊 STATO PROGETTO

### ✅ Completato
- Autenticazione Supabase
- Dashboard completo (15+ pagine)
- Analisi partite e giocatori
- UI/UX responsive
- Cookie Consent GDPR
- Refresh automatico dati

### ⚠️ In Sviluppo
- Logger centralizzato
- Error tracking
- Rate limiting
- Validazione input

### ❌ Da Fare
- Testing
- Analytics
- Export dati
- Performance optimization

**Dettagli**: Vedi [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## 🔧 CONFIGURAZIONE

### Environment Variables

#### Obbligatorie
```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tua anon key]
```

#### Opzionali
```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Dettagli**: Vedi [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

---

## 🏗️ ARCHITETTURA

### Stack Tecnologico
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: OpenDota API
- **Deploy**: Vercel

**Dettagli**: Vedi [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📁 STRUTTURA PROGETTO

```
dota-coaching-api/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages (15+)
│   ├── api/               # API routes (40+)
│   ├── auth/              # Autenticazione
│   └── analysis/          # Analisi match/player
├── components/            # React components (30+)
├── lib/                   # Utilities e hooks
├── _kb/                   # Knowledge base (OpenDota docs)
└── supabase/             # SQL migrations
```

---

## 🐛 PROBLEMI NOTI

### Nessun Problema Critico
- ✅ Build funziona
- ✅ TypeScript strict mode
- ✅ Linting 0 errori

### Warning Non Critici
- ⚠️ Route di test generano warning (normale)
- ⚠️ Console.log in produzione (da sistemare)

**Dettagli**: Vedi [TODO_NOW.md](./TODO_NOW.md)

---

## 🚀 DEPLOY

### Vercel Auto-Deploy
- ✅ Configurato
- ✅ Ogni push su `main` → deploy automatico
- ✅ Preview per PR

**Dettagli**: Vedi [VERCEL_SETUP.md](./VERCEL_SETUP.md) e [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

---

## 📞 SUPPORTO

### Link Utili
- **Repository**: [GitHub](https://github.com/Attilam21/dota-coaching-api)
- **Vercel Dashboard**: [Deploy](https://vercel.com/attilios-projects-a4228cc9/dota-2)
- **Supabase Dashboard**: [Database](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
- **OpenDota API**: [Documentazione](https://docs.opendota.com/)

---

## 📝 CHANGELOG

### Gennaio 2025
- ✅ Refresh automatico dati implementato
- ✅ Bottone refresh rosso centrale
- ✅ Guida utente aggiornata
- ⚠️ Analisi problemi pre-lancio

### Dicembre 2024
- ✅ Dashboard completo
- ✅ Autenticazione Supabase
- ✅ Cookie Consent GDPR

---

**Ultimo aggiornamento**: Gennaio 2025

