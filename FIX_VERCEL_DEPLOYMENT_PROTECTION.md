# 🔧 Fix Vercel Deployment Protection - Errori 401 su API Interne

## Problema
Le route API che fanno fetch interne ad altre route API ricevono errori 401 perché Vercel Deployment Protection blocca le chiamate server-to-server.

## ✅ Soluzione 1: Disabilitare Protection per Route API (CONSIGLIATO)

### Step 1: Vai su Vercel Dashboard
1. Apri: [Vercel Dashboard](https://vercel.com/attilios-projects-a4228cc9/dota-2)
2. Vai su **Settings** → **Deployment Protection**

### Step 2: Configura Exclusion
1. Nella sezione **"Protected Paths"** o **"Excluded Paths"**
2. Aggiungi pattern per escludere le route API:
   ```
   /api/*
   ```
3. Salva le modifiche

### Step 3: Redeploy
1. Vai su **Deployments**
2. Click **Redeploy** sull'ultimo deployment
3. Testa le route API

---

## ✅ Soluzione 2: Usare Bypass Token

### Step 1: Genera Bypass Token
1. Vercel Dashboard → **Settings** → **Deployment Protection**
2. Clicca su **"Generate Bypass Token"**
3. Copia il token generato

### Step 2: Aggiungi Variabile d'Ambiente
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Aggiungi:
   - **Name**: `VERCEL_PROTECTION_BYPASS_TOKEN`
   - **Value**: [il token copiato]
   - **Environment**: Production, Preview, Development (tutti)
3. Salva

### Step 3: Redeploy
1. Vai su **Deployments**
2. Click **Redeploy**
3. Il codice userà automaticamente il token per le chiamate interne

---

## ✅ Soluzione 3: Refactoring (LUNGO TERMINE)

Invece di fare fetch HTTP interni, estrarre la logica in funzioni condivise:

```typescript
// lib/player-stats.ts
export async function getPlayerStats(playerId: string) {
  // Logica direttamente qui, senza fetch HTTP
}

// app/api/player/[id]/profile/route.ts
import { getPlayerStats } from '@/lib/player-stats'

export async function GET(request: NextRequest, { params }) {
  const stats = await getPlayerStats(playerId) // Chiamata diretta, non HTTP
  // ...
}
```

---

## 🧪 Test

Dopo aver applicato una soluzione, testa:

```bash
# Test endpoint profile (che chiama stats e advanced-stats internamente)
curl https://tuo-url.vercel.app/api/player/1903287666/profile
```

Dovresti ricevere JSON, non una pagina HTML di autenticazione.

---

## 📝 Note

- **Soluzione 1** è la più semplice e consigliata
- **Soluzione 2** funziona ma richiede gestione token
- **Soluzione 3** è la migliore architetturalmente ma richiede refactoring

Il middleware creato (`middleware.ts`) riconosce le chiamate interne tramite header `x-internal-call`, ma Vercel Protection viene applicata PRIMA del middleware, quindi non basta da sola.

---

Last updated: 2025-12-20

