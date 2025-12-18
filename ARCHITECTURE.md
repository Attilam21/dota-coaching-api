# 🏗️ Dota 2 Coaching Platform - Architecture

## Overview

This repository contains the **frontend web application** for the Dota 2 Coaching Platform.

## Repository Structure

### Active Repositories

| Repository | Purpose | Tech Stack | Status |
|------------|---------|------------|--------|
| [dota-coaching-api](https://github.com/Attilam21/dota-coaching-api) | **Frontend Web App** | Next.js 14, Supabase, Zustand, React Query, Recharts | ✅ Active |
| [dota-coaching-backend](https://github.com/Attilam21/dota-coaching-backend) | **Backend API** | NestJS, OpenDota, Supabase, OpenAI | ✅ Active |

### Deprecated Repositories

The following repositories are marked for deletion (Dec 20, 2025):

- `fzth-coaching-api` - Duplicate frontend (less features)
- `frontend` - Dotabod fork (not relevant)
- `dota2-coaching-platform` - Generic template (not used)
- `web` - OpenDota fork (reference only, optional delete)

## Architecture Diagram

```
┌────────────────────────────────────┐
│    User Browser (Vercel)          │
│                                    │
│  dota-coaching-api (Next.js 14)  │
│  - Authentication (Supabase)     │
│  - UI Components (Radix)         │
│  - State Management (Zustand)    │
│  - Data Fetching (React Query)   │
│  - Charts (Recharts)             │
└───────────┬───────────────────────┘
           │
           │ REST API calls
           │
┌──────────┴──────────────────────────┐
│  Backend Server (Railway/Fly.io)  │
│                                    │
│  dota-coaching-backend (NestJS)  │
│  - OpenDota API proxy            │
│  - Match Analysis (AI)           │
│  - Learning Paths                │
│  (Gamification rimosso - semplificato)│
└─────┬───────────────┬───────────────┘
     │              │
     │              │
     │              └───────────────────────┐
     │                               │
┌────┴─────┐              ┌───────┴────────┐
│ Supabase  │              │  OpenDota API  │
│ (Postgres)│              │  (External)   │
└──────────┘              └─────────────────┘
```

## Data Flow

### Match Analysis Flow
1. User inputs Dota 2 Match ID in frontend
2. Frontend calls backend `/analysis/match/:matchId`
3. Backend fetches match data from OpenDota API
4. Backend runs AI analysis (farm efficiency, positioning, etc.)
5. Results stored in Supabase and returned to frontend
6. Frontend displays interactive charts and recommendations

### Data Flow Semplificato
1. User authenticates via Supabase (solo per salvare analisi)
2. Player ID gestito in localStorage (non in Supabase)
3. Tutte le analisi fetchate da OpenDota API (backend/frontend)
4. Solo analisi custom salvate in Supabase (`match_analyses`)
5. Pattern: OpenDota = source of truth, Supabase = solo dati utente-specifici

## Technology Choices

### Why Next.js 14 for Frontend?
- Server-side rendering for SEO and performance
- API routes for serverless functions
- App Router for modern React patterns
- Excellent Vercel deployment integration

### Why NestJS for Backend?
- TypeScript-first with decorators
- Modular architecture (easy to scale)
- Built-in dependency injection
- Excellent OpenAPI/Swagger support
- Perfect for microservices evolution

### Why Supabase?
- PostgreSQL with real-time subscriptions
- Built-in authentication
- Row-level security
- RESTful and GraphQL APIs
- Generous free tier

## Deployment

### Production URLs
- **Frontend**: [Vercel Dashboard](https://vercel.com/attilios-projects-a4228cc9/dota-2)
- **Backend**: TBD (Railway/Fly.io recommended)
- **Database**: [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

#### Backend (.env)
```env
PORT=3001
FRONTEND_URL=https://your-vercel-app.vercel.app
OPENDOTA_API_KEY=your_key
SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
SUPABASE_SERVICE_KEY=your_key
OPENAI_API_KEY=your_key
```

## Development Workflow

1. **Local Development**
   ```bash
   # Terminal 1: Backend
   cd dota-coaching-backend
   npm run start:dev  # Port 3001
   
   # Terminal 2: Frontend
   cd dota-coaching-api
   npm run dev  # Port 3000
   ```

2. **Making Changes**
   - Backend: Add new endpoints in `src/*/` modules
   - Frontend: Update pages in `app/` directory
   - Both: Update this ARCHITECTURE.md when structure changes

3. **Deployment**
   - Frontend: Push to main branch (auto-deploys to Vercel)
   - Backend: Manual deploy to Railway/Fly.io or set up CI/CD

## Roadmap

See [Backend Roadmap](https://github.com/Attilam21/dota-coaching-backend#%EF%B8%8F-roadmap) for detailed feature planning.

---

Last updated: December 16, 2025