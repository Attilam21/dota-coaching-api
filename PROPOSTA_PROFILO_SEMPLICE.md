# 🎯 Proposta: Profilo Utente Personalizzabile (Approccio Semplice)

**Data**: Dicembre 2025  
**Obiettivo**: Implementare profilo personalizzabile con minimo sforzo

---

## 🎯 Requisiti

1. ✅ Nome visualizzato nel dashboard (invece di email)
2. ✅ Avatar personalizzabile
3. ✅ Dota Account ID (già presente)
4. ✅ Salvataggio in Supabase (non localStorage)

---

## 💡 Soluzione Più Semplice

### 1. Database Schema - Aggiunte Minime

**Aggiungere solo 2 colonne a `public.users`**:

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

**Perché semplice**:
- ✅ Solo 2 colonne nuove
- ✅ Entrambe nullable (opzionali)
- ✅ Nessun constraint complesso
- ✅ Nessun trigger necessario

---

### 2. Avatar - Approccio Semplice

**Opzione 1: URL Esterni (CONSIGLIATO)** ⭐

**Come funziona**:
- Utente inserisce URL avatar (Steam, Imgur, etc.)
- Salviamo solo l'URL in `avatar_url`
- Nessun upload, nessun storage

**Vantaggi**:
- ✅ Zero complessità backend
- ✅ Zero costi storage
- ✅ Utente può usare qualsiasi servizio (Steam, Imgur, Gravatar, etc.)
- ✅ Nessuna gestione file upload

**Esempio URL**:
- Steam: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...`
- Imgur: `https://i.imgur.com/xxx.jpg`
- Gravatar: `https://www.gravatar.com/avatar/...`

**Opzione 2: Avatar Predefiniti** (ancora più semplice)

**Come funziona**:
- Set di 10-20 avatar Dota 2 themed
- Utente seleziona uno
- Salviamo solo il nome file: `avatar_url = "dota_hero_1.jpg"`

**Vantaggi**:
- ✅ Zero storage esterno
- ✅ Controllo completo design
- ✅ Caricamento veloce (CDN)

**Svantaggi**:
- ❌ Meno personalizzazione

---

### 3. Settings Page - Design Semplice

**Layout**:

```
┌─────────────────────────────────────┐
│  Impostazioni Account              │
├─────────────────────────────────────┤
│                                     │
│  ┌─ Profilo Personale ──────────┐ │
│  │                               │ │
│  │  Display Name: [___________] │ │
│  │  (Nome visualizzato)          │ │
│  │                               │ │
│  │  Avatar URL: [___________]    │ │
│  │  [Preview Avatar]             │ │
│  │  [Usa Steam Avatar] (se ID)   │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌─ Dota 2 Account ─────────────┐ │
│  │                               │ │
│  │  Dota Account ID: [_______]   │ │
│  │  (Salvato in Supabase)        │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Salva Impostazioni]               │
└─────────────────────────────────────┘
```

**Features**:
- ✅ Campo display_name (testo)
- ✅ Campo avatar_url (testo)
- ✅ Preview avatar (se URL valido)
- ✅ Bottone "Usa Steam Avatar" (se dota_account_id presente)
- ✅ Salvataggio tutto in Supabase

---

### 4. Integrazione Steam Avatar (Opzionale)

**Se `dota_account_id` è presente**:

**Metodo 1: Steam Web API** (richiede API key)
```typescript
// Richiede Steam API key
const steamId = dotaAccountId // Convert to Steam ID64
const response = await fetch(
  `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
)
const data = await response.json()
const avatarUrl = data.response.players[0].avatarfull
```

**Metodo 2: OpenDota Profile** (più semplice, se disponibile)
```typescript
// Se OpenDota ha avatar nel profilo player
const response = await fetch(`https://api.opendota.com/api/players/${dotaAccountId}`)
const data = await response.json()
// Verificare se c'è campo avatar
```

**Metodo 3: URL Pattern Steam** (più semplice, ma richiede hash)
- Steam avatar URL ha pattern: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/{hash}/{hash}_full.jpg`
- Ma serve l'hash, che non abbiamo senza API

**Raccomandazione**: 
- Per ora: **solo input URL manuale**
- In futuro: aggiungere Steam API integration se serve

---

### 5. Navbar Update

**Prima**:
```tsx
{user.email}
```

**Dopo**:
```tsx
<div className="flex items-center gap-2">
  {user.avatar_url && (
    <img 
      src={user.avatar_url} 
      alt="Avatar" 
      className="w-6 h-6 rounded-full"
    />
  )}
  <span>{user.display_name || user.email}</span>
</div>
```

---

## 📋 Implementazione Step-by-Step

### Step 1: Database Migration (5 min)
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### Step 2: Update TypeScript Types (2 min)
```typescript
// lib/supabase.ts
Update: {
  // ... existing
  display_name?: string | null
  avatar_url?: string | null
}
```

### Step 3: Update Settings Page (30 min)
- Aggiungere campi display_name e avatar_url
- Aggiungere preview avatar
- Salvare in Supabase (non localStorage)

### Step 4: Update Navbar (10 min)
- Mostrare display_name + avatar

### Step 5: Rimuovere Salvataggio Match (10 min)
- Rimuovere `handleSaveAnalysis()`
- Rimuovere bottone "Salva Analisi"

**Tempo Totale**: ~1 ora

---

## 🎯 Suggerimenti PM Full Stack

### ✅ Vantaggi Approccio Semplice

1. **Velocità**
   - Implementazione in 1 ora
   - Zero complessità aggiunta

2. **Scalabilità**
   - URL esterni = zero storage cost
   - Nessun limite dimensioni
   - Utente gestisce i propri file

3. **Flessibilità**
   - Utente può usare qualsiasi servizio
   - Facile aggiungere Steam API in futuro
   - Facile aggiungere upload in futuro

4. **Manutenzione**
   - Meno codice = meno bug
   - Nessuna gestione file upload
   - Nessuna validazione file complessa

### ⚠️ Trade-offs

**Pro**:
- ✅ Semplice e veloce
- ✅ Zero costi
- ✅ Flessibile

**Contro**:
- ❌ Utente deve gestire URL esterni
- ❌ Nessun controllo qualità avatar
- ❌ Possibili URL rotte

**Mitigazione**:
- Validazione URL base (formato)
- Preview prima di salvare
- Fallback a placeholder se URL non valido

---

## 🚀 Roadmap Futura (Opzionale)

### Fase 2: Upload Custom (se serve)
- Aggiungere Supabase Storage
- Upload file
- Validazione dimensioni/tipo

### Fase 3: Steam Integration (se serve)
- Steam API key
- Auto-fetch avatar
- Auto-update quando cambia

### Fase 4: Avatar Predefiniti (se serve)
- Set di avatar Dota 2
- Selezione visuale
- Nessun URL esterno

---

## 💡 Raccomandazione Finale

**Implementare**: ✅ **Approccio Semplice (URL Esterni)**

**Motivi**:
1. ✅ Velocità: 1 ora vs 1 giorno
2. ✅ Costi: €0 vs storage cost
3. ✅ Flessibilità: utente sceglie servizio
4. ✅ Scalabilità: nessun limite
5. ✅ Manutenzione: minimo codice

**Quando aggiungere upload**:
- Solo se utenti lo richiedono
- Solo se hai bisogno di controllo qualità
- Solo se vuoi branding consistente

---

**Pronto per implementazione?** ✅

