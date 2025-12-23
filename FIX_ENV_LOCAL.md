# 🔧 Fix `.env.local` - Variabili Mancanti

## ❌ **PROBLEMA**

Il file `.env.local` contiene:
- ✅ `GEMINI_API_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **MANCA** `NEXT_PUBLIC_SUPABASE_URL`
- ❌ **MANCA** `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Questo causa l'errore: **"Nessuna chiave API trovata nella richiesta"**

---

## ✅ **SOLUZIONE**

Aggiungi queste righe al file `.env.local`:

```bash
# Supabase Configuration (CLIENT-SIDE)
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Zmp0cnRlZXp2eW91ZHBmY2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDQwMDYsImV4cCI6MjA3OTEyMDAwNn0.sMWiigc2nb3KjSnco6mU5k0556ukRTcKS-3LDREtKIw
```

---

## 📋 **FILE `.env.local` COMPLETO**

Il file dovrebbe contenere:

```bash
# Gemini API
GEMINI_API_KEY=AIzaSyBCgMb8RAMsNXbm6nbd1CXLHsP7ogw1uCU

# Supabase Service Role Key (SERVER-SIDE ONLY - NON usare nel browser!)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1

# Supabase Client Configuration (CLIENT-SIDE - per browser)
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Zmp0cnRlZXp2eW91ZHBmY2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDQwMDYsImV4cCI6MjA3OTEyMDAwNn0.sMWiigc2nb3KjSnco6mU5k0556ukRTcKS-3LDREtKIw
```

---

## ⚠️ **IMPORTANTE: Differenza tra SERVICE_ROLE_KEY e ANON_KEY**

### `SUPABASE_SERVICE_ROLE_KEY` (Server-Side Only)
- ❌ **NON** usare nel browser
- ✅ Usa solo per operazioni server-side con privilegi elevati
- ✅ Bypassa RLS policies
- ⚠️ **MAI** esporre nel client

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Client-Side)
- ✅ Usa nel browser (client-side)
- ✅ Rispetta RLS policies
- ✅ Sicura da esporre (pubblica)
- ✅ **DEVE** iniziare con `NEXT_PUBLIC_` per essere disponibile nel browser

---

## 🔄 **DOPO AVER AGGIUNTO LE VARIABILI**

1. **Salva il file `.env.local`**
2. **Riavvia il server di sviluppo**:
   ```bash
   # Ferma (Ctrl + C) e riavvia
   npm run dev
   ```
3. **Hard refresh browser**: `Ctrl + Shift + R`
4. **Testa**: Vai su `/dashboard/settings` e prova a salvare Player ID

---

## ✅ **VERIFICA**

Apri console browser (F12) e esegui:

```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

**Se vedi `undefined`**:
- Le variabili non sono caricate
- Riavvia il server di sviluppo
- Verifica che `.env.local` sia nella root del progetto

---

**Status**: ⚠️ Variabili mancanti - Aggiungere a `.env.local`

