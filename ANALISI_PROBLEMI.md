# 🔍 ANALISI PROBLEMI - Player ID Non Salvato

**Data**: Gennaio 2025  
**Problema**: Dopo le modifiche, l'ID non si salva correttamente in "profilazione" (Settings)

---

## 🚨 PROBLEMA PRINCIPALE IDENTIFICATO

### **Disconnessione tra Settings e PlayerIdContext**

**Situazione attuale**:
1. **Settings Page** (`app/dashboard/settings/page.tsx`):
   - Salva in **Supabase** (`users.dota_account_id`)
   - **NON** aggiorna `PlayerIdContext`
   - **NON** salva in localStorage

2. **PlayerIdContext** (`lib/playerIdContext.tsx`):
   - Legge/salva solo in **localStorage** (`fzth_player_id`)
   - **NON** legge da Supabase
   - **NON** si sincronizza con DB

3. **Dashboard Pages**:
   - Usano `usePlayerIdContext()` che legge solo da localStorage
   - Se localStorage è vuoto → mostrano form input
   - Anche se DB ha il valore salvato

---

## 📊 FLUSSO ATTUALE (ROTTO)

### Scenario 1: Utente salva in Settings

1. Utente va in Settings
2. Inserisci Player ID (es. `86745912`)
3. Clicca "Salva Impostazioni"
4. **Settings fa UPDATE a Supabase**:
   ```typescript
   await supabase
     .from('users')
     .update({ dota_account_id: accountIdValue })
     .eq('id', user.id)
   ```
   ✅ Salvataggio in DB: **OK**

5. **PlayerIdContext NON viene aggiornato** ❌
   - localStorage rimane vuoto
   - `playerId` in context rimane `null`

6. Utente torna a Dashboard
   - Dashboard legge `playerId` da context → `null`
   - Mostra form input anche se DB ha il valore ❌

7. Utente fa refresh pagina
   - PlayerIdContext carica da localStorage → vuoto
   - Dashboard mostra form input ❌
   - DB ha il valore ma nessuno lo legge ❌

---

### Scenario 2: Utente inserisce in Dashboard

1. Utente va in Dashboard (localStorage vuoto)
2. Vede form input, inserisce Player ID
3. `PlayerIdInput` chiama `setPlayerId()` da context
4. **PlayerIdContext salva in localStorage**:
   ```typescript
   localStorage.setItem('fzth_player_id', trimmedId)
   ```
   ✅ Salvataggio in localStorage: **OK**

5. **NON viene salvato in Supabase** ❌
   - DB rimane vuoto o con valore vecchio
   - Se utente va in Settings → vede valore vecchio o vuoto

6. Utente fa refresh pagina
   - PlayerIdContext carica da localStorage → valore presente ✅
   - Dashboard funziona ✅
   - Ma DB non è sincronizzato ❌

---

## 🔍 ANALISI FILE PER FILE

### 1. `app/dashboard/settings/page.tsx`

**Problemi identificati**:

1. **NON usa PlayerIdContext**:
   - Ha il suo stato locale `dotaAccountId`
   - Non sincronizza con `PlayerIdContext` dopo save

2. **UPDATE potrebbe fallire silenziosamente**:
   - Se record non esiste in `users` table → UPDATE non fa nulla
   - Dovrebbe fare UPSERT invece di UPDATE
   - O verificare che record esista (da trigger signup)

3. **Nessun log dopo save**:
   - Non verifica che il save sia andato a buon fine
   - Non ricarica i dati per conferma

**Cosa manca**:
```typescript
// DOPO save in Supabase, dovrebbe:
import { usePlayerIdContext } from '@/lib/playerIdContext'

const { setPlayerId } = usePlayerIdContext()

// Nel handleSave, dopo UPDATE:
if (!error) {
  setPlayerId(accountIdValue?.toString() || null)  // Sincronizza context
}
```

---

### 2. `lib/playerIdContext.tsx`

**Problemi identificati**:

1. **NON legge da Supabase**:
   - Carica solo da localStorage al mount
   - Se localStorage è vuoto ma DB ha valore → non lo legge

2. **NON si sincronizza con DB**:
   - Quando `setPlayerId()` viene chiamato, salva solo in localStorage
   - Non salva anche in Supabase

**Cosa manca**:
- Leggere da Supabase al mount (se localStorage vuoto)
- Salvare in Supabase quando `setPlayerId()` viene chiamato
- O almeno sincronizzare con `usePlayerId()` hook

---

### 3. `components/PlayerIdInput.tsx`

**Situazione**:
- Chiama `setPlayerId()` da context
- Salva solo in localStorage
- Non salva in Supabase

**Problema**: Se utente inserisce ID qui, non viene salvato in DB.

---

## 🧪 TEST MANUALE - Flusso Cliente

### Test: Salvataggio in Settings

**Step 1**: Login
- Utente fa login ✅

**Step 2**: Vai a Settings
- Clicca "Profilo Utente" nel sidebar
- Vedi form con campo "Dota 2 Account ID" ✅

**Step 3**: Inserisci Player ID
- Inserisci `86745912`
- Clicca "Salva Impostazioni"
- Vedi messaggio "Impostazioni salvate con successo!" ✅

**Step 4**: Verifica DB (Supabase Dashboard)
- Vai a Table Editor → `users`
- Trova il tuo record
- ✅ `dota_account_id` dovrebbe essere `86745912`

**Step 5**: Torna a Dashboard
- Clicca "Panoramica" nel sidebar
- ❌ **PROBLEMA**: Vedi ancora form input "Inserisci Player ID"
- ❌ localStorage è vuoto (F12 → Application → Local Storage)

**Step 6**: Refresh pagina
- F5
- ❌ **PROBLEMA**: Dashboard mostra ancora form input
- DB ha il valore ma non viene letto

---

## 🔧 COSA NON FUNZIONA - Dettaglio Tecnico

### 1. Settings non aggiorna PlayerIdContext

**File**: `app/dashboard/settings/page.tsx`

**Riga 84-94**:
```typescript
const { error } = await supabase
  .from('users')
  .update({ dota_account_id: accountIdValue })
  .eq('id', user.id)

if (error) {
  throw error
}

setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' })
```

**Manca**:
```typescript
import { usePlayerIdContext } from '@/lib/playerIdContext'

const { setPlayerId } = usePlayerIdContext()

// Dopo UPDATE:
if (!error) {
  setPlayerId(accountIdValue?.toString() || null)  // Sincronizza
}
```

---

### 2. PlayerIdContext non legge da Supabase

**File**: `lib/playerIdContext.tsx`

**Riga 27-38**:
```typescript
useEffect(() => {
  if (!isMounted) return

  try {
    const saved = localStorage.getItem(PLAYER_ID_KEY)
    if (saved) {
      setPlayerIdState(saved)
    }
  } catch (err) {
    console.error('Failed to load player ID from localStorage:', err)
  }
}, [isMounted])
```

**Problema**: Legge solo da localStorage, non da Supabase.

**Manca**:
- Se localStorage vuoto, fare query a Supabase
- Usare `usePlayerId()` hook o fare query diretta

---

### 3. PlayerIdInput non salva in Supabase

**File**: `components/PlayerIdInput.tsx`

**Riga 17-21**:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (inputValue.trim()) {
    setPlayerId(inputValue.trim())  // Salva solo in localStorage
  }
}
```

**Problema**: Salva solo in localStorage, non in Supabase.

---

## 🎯 CAUSE ROOT

1. **Architettura disallineata**:
   - Settings gestisce Supabase
   - PlayerIdContext gestisce localStorage
   - Non comunicano tra loro

2. **Due sorgenti di verità**:
   - Supabase (`users.dota_account_id`) = verità "permanente"
   - localStorage (`fzth_player_id`) = verità "temporanea"
   - Non sincronizzate

3. **Mancanza di sincronizzazione**:
   - Quando salvi in Settings → dovrebbe aggiornare context
   - Quando salvi in context → dovrebbe salvare in DB
   - Quando carichi context → dovrebbe leggere da DB se localStorage vuoto

---

## ✅ SOLUZIONI POSSIBILI

### Soluzione 1: PlayerIdContext legge da Supabase come fallback

**Modifica `lib/playerIdContext.tsx`**:
- Al mount, se localStorage vuoto → query Supabase
- Usa `usePlayerId()` hook internamente

### Soluzione 2: Settings aggiorna PlayerIdContext dopo save

**Modifica `app/dashboard/settings/page.tsx`**:
- Dopo UPDATE Supabase → chiama `setPlayerId()` da context

### Soluzione 3: PlayerIdContext salva anche in Supabase

**Modifica `lib/playerIdContext.tsx`**:
- Quando `setPlayerId()` viene chiamato → salva sia localStorage che Supabase

---

## 🚨 PROBLEMI POTENZIALI AGGIUNTIVI

### 1. Record non esiste in `users` table

**Se l'utente non ha record in `users`** (trigger signup non ha funzionato):
- UPDATE non fa nulla (0 rows affected)
- Non dà errore, ma non salva

**Verifica**: Controlla che trigger `on_auth_user_created` esista e funzioni.

### 2. RLS Policy blocca UPDATE

**Se RLS sta bloccando**:
- Errore `permission denied` in console
- Ma il codice potrebbe nascondere l'errore

**Verifica**: Controlla console per errori Supabase dopo save.

### 3. UPDATE vs UPSERT

**Attuale**: Usa UPDATE
```typescript
.update({ dota_account_id: accountIdValue })
.eq('id', user.id)
```

**Se record non esiste**: UPDATE non fa nulla.

**Alternativa**: UPSERT
```typescript
.upsert({ id: user.id, dota_account_id: accountIdValue })
```

Ma questo richiede che `id` sia nella lista di colonne inseribili.

---

## 📝 PROSSIMI PASSI

1. **Aggiungere log dettagliati**:
   - In Settings: log prima/dopo UPDATE
   - In PlayerIdContext: log quando carica da localStorage/Supabase

2. **Verificare Supabase**:
   - Record esiste in `users` table?
   - RLS policies corrette?
   - UPDATE funziona?

3. **Implementare sincronizzazione**:
   - Settings → PlayerIdContext dopo save
   - PlayerIdContext → Supabase quando setPlayerId
   - PlayerIdContext → Supabase quando carica (fallback)

