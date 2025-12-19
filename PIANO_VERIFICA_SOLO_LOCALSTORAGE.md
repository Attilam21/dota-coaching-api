# 🎯 PIANO VERIFICA - Solo localStorage

**Decisione**: Salvare tutto in localStorage, senza Supabase.

---

## 💾 STRUTTURA DATI localStorage

### Chiavi da usare:
1. `fzth_player_id` → Player ID (già esistente)
2. `fzth_player_verified` → `true`/`false` (se verificato)
3. `fzth_player_verified_at` → Timestamp verifica (ISO string)
4. `fzth_player_verification_method` → `'questions'` (metodo verifica)

**Oppure un unico oggetto JSON**:
```typescript
localStorage.setItem('fzth_player_data', JSON.stringify({
  playerId: '8607682237',
  verified: true,
  verifiedAt: '2025-12-19T10:30:00Z',
  verificationMethod: 'questions'
}))
```

**Scelta**: Usare oggetto JSON unico (più pulito)

---

## 📋 IMPLEMENTAZIONE

### 1. API Routes (Senza Supabase)

#### `/api/user/generate-verification-questions`
**Metodo**: `GET`  
**Query Params**: `playerId`  
**Response**: Domande (come prima)

**Nessuna modifica** - Non salva nulla, solo genera domande.

---

#### `/api/user/verify-dota-account`
**Metodo**: `POST`  
**Body**: `{ playerId, answers }`  
**Response**: `{ verified: boolean, correctAnswers: number }`

**Nessuna modifica** - Solo valida risposte, non salva in Supabase.

---

### 2. Componente UI

#### `components/VerificationFlow.tsx`

**Dopo verifica riuscita**:
```typescript
// Salva in localStorage
const playerData = {
  playerId: playerId,
  verified: true,
  verifiedAt: new Date().toISOString(),
  verificationMethod: 'questions'
}
localStorage.setItem('fzth_player_data', JSON.stringify(playerData))

// Aggiorna anche chiave esistente per compatibilità
localStorage.setItem('fzth_player_id', playerId)
```

---

### 3. PlayerIdContext

#### `lib/playerIdContext.tsx`

**Modifiche**:
```typescript
// Carica da localStorage
const loadPlayerData = () => {
  try {
    const data = localStorage.getItem('fzth_player_data')
    if (data) {
      const parsed = JSON.parse(data)
      return {
        playerId: parsed.playerId,
        verified: parsed.verified || false,
        verifiedAt: parsed.verifiedAt || null,
        verificationMethod: parsed.verificationMethod || null
      }
    }
    // Fallback a chiave vecchia per compatibilità
    const oldPlayerId = localStorage.getItem('fzth_player_id')
    if (oldPlayerId) {
      return {
        playerId: oldPlayerId,
        verified: false,
        verifiedAt: null,
        verificationMethod: null
      }
    }
    return null
  } catch {
    return null
  }
}
```

---

### 4. Settings Page

#### `app/dashboard/settings/page.tsx`

**Mostra badge "Verificato"**:
```typescript
const [isVerified, setIsVerified] = useState(false)

useEffect(() => {
  const data = localStorage.getItem('fzth_player_data')
  if (data) {
    const parsed = JSON.parse(data)
    setIsVerified(parsed.verified === true)
  }
}, [])

// Nel render
{isVerified && (
  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
    ✓ Verificato
  </div>
)}
```

---

## ✅ VANTAGGI

1. ✅ **Nessun problema RLS** - Non usiamo Supabase
2. ✅ **Semplice** - Solo localStorage
3. ✅ **Veloce** - Nessuna chiamata API per salvare
4. ✅ **Funziona offline** - Tutto locale

---

## ⚠️ LIMITI

1. ⚠️ **Non persistente** - Si perde se cancella dati browser
2. ⚠️ **Non sincronizzato** - Solo su quel browser/dispositivo
3. ⚠️ **Nessun backup** - Se perde dati, perde verifica

---

## 🎯 IMPLEMENTAZIONE STEP-BY-STEP

### Step 1: Aggiornare PlayerIdContext
- Aggiungere supporto per `fzth_player_data` (JSON)
- Mantenere compatibilità con `fzth_player_id` (chiave vecchia)

### Step 2: Creare VerificationFlow
- Dopo verifica riuscita → Salva in localStorage
- Salva oggetto JSON completo

### Step 3: Aggiornare Settings Page
- Mostrare badge "Verificato" se `verified === true`
- Button "Verifica Account" se non verificato

### Step 4: Test
- Test verifica completa
- Test caricamento da localStorage
- Test compatibilità con chiave vecchia

---

**Pronto per implementare solo localStorage!** 🎯

