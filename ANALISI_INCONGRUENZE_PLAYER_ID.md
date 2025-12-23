# 🔍 Analisi Incongruenze: Modifica Player ID Non Funziona

## 🐛 Problema Identificato

L'utente non riesce più a cambiare il Player ID nelle settings. Dalla console vedo che:
- ✅ Player ID viene caricato: `130433320`
- ✅ API vengono chiamate correttamente
- ❌ Modifica del Player ID non funziona

---

## 🔍 Incongruenze Trovate

### 1. ❌ **Problema: `storage` event non funziona nella stessa tab**

**File:** `lib/playerIdContext.tsx` (linee 109-122)

```typescript
// Ascolta cambiamenti in localStorage (per sincronizzazione tra tab)
useEffect(() => {
  if (!isMounted) return
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === PLAYER_ID_KEY) {
      console.log('[PlayerIdContext] Storage event - Player ID cambiato in localStorage')
      loadPlayerIdFromLocalStorage()
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [isMounted, loadPlayerIdFromLocalStorage])
```

**Problema:**
- L'evento `storage` funziona **SOLO tra tab diverse**, non nella stessa tab
- Quando SettingsPage salva in localStorage e chiama `setPlayerId()`, il listener `storage` **NON viene triggerato**
- Quindi il Context non si aggiorna automaticamente

**Soluzione:**
- Rimuovere il listener `storage` (non serve se usiamo `setPlayerId()` direttamente)
- Oppure aggiungere un custom event per sincronizzazione nella stessa tab

---

### 2. ❌ **Problema: Doppio aggiornamento in SettingsPage**

**File:** `app/dashboard/settings/page.tsx` (linee 141-158)

```typescript
// Sincronizza localStorage (fonte primaria)
if (typeof window !== 'undefined') {
  if (playerIdString) {
    localStorage.setItem('fzth_player_id', playerIdString)
    console.log('[SettingsPage] Player ID sincronizzato in localStorage:', playerIdString)
  } else {
    localStorage.removeItem('fzth_player_id')
  }
}

// Success - ricarica dal database per sincronizzazione completa
console.log('[Settings] Salvataggio riuscito, ricarico Player ID dal database...')
await reload()  // ← Ricarica da localStorage (già aggiornato sopra)

// Aggiorna anche state locale per immediate feedback
setPlayerId(playerIdString)  // ← Aggiorna di nuovo localStorage e state
```

**Problema:**
1. Salva in localStorage manualmente (linea 145)
2. Chiama `reload()` che ricarica da localStorage (linea 155) - **RIDONDANTE**
3. Chiama `setPlayerId()` che salva di nuovo in localStorage (linea 158) - **RIDONDANTE**

**Soluzione:**
- Rimuovere il salvataggio manuale in localStorage (linea 145)
- Rimuovere `reload()` (non necessario)
- Chiamare solo `setPlayerId()` che aggiorna tutto

---

### 3. ❌ **Problema: `hasProcessedQueryParam` blocca sincronizzazione**

**File:** `app/dashboard/settings/page.tsx` (linee 80-92)

```typescript
// Sincronizza input con playerId dal context
useEffect(() => {
  // Se abbiamo già processato un query param, non sovrascrivere
  if (hasProcessedQueryParam.current) {
    return  // ← BLOCCA la sincronizzazione
  }
  
  // Altrimenti, sincronizza con il valore dal context
  if (playerId) {
    setDotaAccountId(playerId)
  } else {
    setDotaAccountId('')
  }
}, [playerId])
```

**Problema:**
- Se `hasProcessedQueryParam.current` è `true`, l'input non si sincronizza con il context
- Questo può causare problemi se l'utente modifica il Player ID e poi il context si aggiorna
- Il form potrebbe mostrare un valore diverso dal context

**Soluzione:**
- Reset `hasProcessedQueryParam.current = false` dopo il salvataggio
- Oppure rimuovere questo check se non necessario

---

### 4. ❌ **Problema: Rimozione Player ID non sincronizza localStorage**

**File:** `app/dashboard/settings/page.tsx` (linee 297-316)

```typescript
onClick={async () => {
  if (confirm('Sei sicuro...')) {
    try {
      if (!user) return
      const { error } = await supabase
        .from('users')
        .update({ dota_account_id: null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      
      if (error) {
        setMessage({ type: 'error', text: 'Errore nella rimozione del Player ID.' })
      } else {
        setPlayerId(null)  // ← Aggiorna context e localStorage
        setDotaAccountId('')
        setMessage({ type: 'success', text: 'Player ID rimosso con successo.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore nella rimozione del Player ID.' })
    }
  }
}}
```

**Problema:**
- Usa `supabase.from('users').update()` direttamente invece di Server Action
- Non sincronizza localStorage manualmente (ma `setPlayerId(null)` lo fa)
- Potrebbe avere problemi con RLS policies

**Soluzione:**
- Usare Server Action `updatePlayerId(null, accessToken)` per coerenza
- `setPlayerId(null)` già gestisce localStorage, quindi OK

---

## ✅ Soluzioni Proposte

### Fix 1: Semplificare SettingsPage.handleSave()

```typescript
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) return

  try {
    setSaving(true)
    setMessage(null)

    const playerIdString = dotaAccountId.trim() || null
    const dotaAccountIdNum = playerIdString 
      ? parseInt(playerIdString, 10) 
      : null

    if (playerIdString && isNaN(dotaAccountIdNum!)) {
      setMessage({
        type: 'error',
        text: 'L\'ID Dota deve essere un numero valido',
      })
      setSaving(false)
      return
    }

    // Verifica sessione
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !currentSession) {
      setMessage({
        type: 'error',
        text: 'Sessione non valida. Fai logout e login di nuovo.',
      })
      setSaving(false)
      return
    }

    // Salva nel database (backup)
    const result = await updatePlayerId(playerIdString, currentSession.access_token)

    if (!result.success) {
      setMessage({
        type: 'error',
        text: result.error || 'Errore nel salvataggio del Player ID.',
      })
      setSaving(false)
      return
    }

    // ✅ FIX: Chiama solo setPlayerId() che aggiorna localStorage E state
    // setPlayerId() già salva in localStorage, non serve farlo manualmente
    setPlayerId(playerIdString)
    
    // ✅ FIX: Reset hasProcessedQueryParam per permettere sincronizzazione futura
    hasProcessedQueryParam.current = false

    setMessage({ 
      type: 'success', 
      text: result.message || 'Player ID salvato con successo! La dashboard si aggiornerà automaticamente.'
    })
    
    console.log('[Settings] Player ID salvato. Context e localStorage aggiornati.')
  } catch (err) {
    console.error('Failed to save settings:', err)
    setMessage({
      type: 'error',
      text: err instanceof Error ? err.message : 'Errore nel salvataggio delle impostazioni',
    })
  } finally {
    setSaving(false)
  }
}
```

### Fix 2: Rimuovere listener storage event (non necessario)

```typescript
// ❌ RIMUOVERE questo useEffect - storage event non funziona nella stessa tab
// useEffect(() => {
//   if (!isMounted) return
//   
//   const handleStorageChange = (e: StorageEvent) => {
//     if (e.key === PLAYER_ID_KEY) {
//       console.log('[PlayerIdContext] Storage event - Player ID cambiato in localStorage')
//       loadPlayerIdFromLocalStorage()
//     }
//   }
//   
//   window.addEventListener('storage', handleStorageChange)
//   return () => window.removeEventListener('storage', handleStorageChange)
// }, [isMounted, loadPlayerIdFromLocalStorage])
```

### Fix 3: Fix rimozione Player ID

```typescript
onClick={async () => {
  if (confirm('Sei sicuro di voler rimuovere il Player ID?')) {
    try {
      if (!user) return
      
      // Verifica sessione
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !currentSession) {
        setMessage({ type: 'error', text: 'Sessione non valida.' })
        return
      }
      
      // ✅ FIX: Usa Server Action per coerenza
      const result = await updatePlayerId(null, currentSession.access_token)
      
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Errore nella rimozione.' })
      } else {
        // ✅ FIX: setPlayerId(null) aggiorna localStorage e state
        setPlayerId(null)
        setDotaAccountId('')
        hasProcessedQueryParam.current = false
        setMessage({ type: 'success', text: 'Player ID rimosso con successo.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore nella rimozione del Player ID.' })
    }
  }
}}
```

---

## 📋 Riepilogo Incongruenze

1. ❌ **Doppio salvataggio localStorage** in SettingsPage
2. ❌ **Listener storage event inutile** (non funziona nella stessa tab)
3. ❌ **hasProcessedQueryParam blocca sincronizzazione** dopo salvataggio
4. ❌ **Rimozione Player ID usa query diretta** invece di Server Action
5. ❌ **reload() chiamato dopo setPlayerId()** (ridondante)

---

## ✅ Flusso Corretto Dovrebbe Essere

1. Utente modifica Player ID in form
2. Click "Salva"
3. Valida input
4. Salva nel database (backup) via Server Action
5. Chiama `setPlayerId(newId)` → aggiorna localStorage E state
6. Context si aggiorna automaticamente
7. Dashboard si aggiorna automaticamente (usa `playerId` dal context)

**NON serve:**
- ❌ Salvare manualmente in localStorage (setPlayerId lo fa)
- ❌ Chiamare reload() (setPlayerId aggiorna già tutto)
- ❌ Listener storage event (non funziona nella stessa tab)

