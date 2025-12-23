# 🔍 Analisi Completa Codice Supabase

**Data:** Analisi completa dopo verifica policies e best practices  
**Stato:** ⚠️ **PROBLEMI IDENTIFICATI - SOLUZIONI PROPOSTE**

---

## 📋 **PROBLEMI IDENTIFICATI**

### **1. ❌ Gestione Errori Refresh Token Mancante**

**File:** `lib/supabase.ts`, `lib/auth-context.tsx`

**Problema:**
- Non c'è gestione esplicita per errori "Invalid Refresh Token"
- Quando il refresh token scade, l'app continua a tentare di usarlo
- Causa loop infiniti e errori 403 Forbidden

**Codice Attuale:**
```typescript
// lib/supabase.ts - Nessuna gestione errori refresh token
client.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase Client] Auth state changed:', event, {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    userId: session?.user?.id,
  })
})
```

**Soluzione Necessaria:**
- Catturare eventi `TOKEN_REFRESHED` e `SIGNED_OUT`
- Pulire localStorage quando refresh token è invalido
- Reindirizzare al login automaticamente

---

### **2. ❌ localStorage ancora usato per Player ID**

**File:** `app/dashboard/settings/page.tsx` (righe 210-223)

**Problema:**
- Il codice salva ancora in localStorage come "fallback"
- Questo crea conflitti con il database (come analizzato prima)
- Non è allineato con la decisione di usare solo database

**Codice Attuale:**
```typescript
// Also save to localStorage as fallback
if (playerIdString) {
  try {
    localStorage.setItem('fzth_player_id', playerIdString)
  } catch (err) {
    console.error('Failed to save to localStorage:', err)
  }
}
```

**Soluzione Necessaria:**
- Rimuovere completamente localStorage per Player ID
- Usare solo database come fonte di verità

---

### **3. ❌ PlayerIdContext usa ancora localStorage**

**File:** `lib/playerIdContext.tsx`

**Problema:**
- `PlayerIdContext` carica da localStorage come fonte primaria
- Non carica da database quando l'utente è autenticato
- Crea conflitti con il database

**Soluzione Necessaria:**
- Modificare `PlayerIdContext` per caricare da database
- Rimuovere localStorage per Player ID
- Mantenere localStorage solo per preferenze UI

---

### **4. ⚠️ Gestione Errori 403 Non Ottimale**

**File:** `app/dashboard/settings/page.tsx` (righe 195-202)

**Problema:**
- Gli errori 403 vengono mostrati ma non gestiti correttamente
- Non c'è reindirizzamento automatico al login
- L'utente non sa cosa fare

**Codice Attuale:**
```typescript
if (updateError) {
  console.error('Error updating player ID:', updateError)
  setMessage({
    type: 'error',
    text: updateError.message || 'Errore nel salvataggio del Player ID.',
  })
  setSaving(false)
  return
}
```

**Soluzione Necessaria:**
- Verificare se l'errore è di autenticazione (403, JWT expired)
- Reindirizzare automaticamente al login
- Mostrare messaggio chiaro all'utente

---

### **5. ⚠️ AuthContext non gestisce refresh token errors**

**File:** `lib/auth-context.tsx` (righe 54-59)

**Problema:**
- `onAuthStateChange` non gestisce esplicitamente errori di refresh token
- Non pulisce localStorage quando la sessione scade
- Non reindirizza al login quando necessario

**Codice Attuale:**
```typescript
supabase.auth.onAuthStateChange(
  (_event: AuthChangeEvent, session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)
    setLoading(false)
  }
)
```

**Soluzione Necessaria:**
- Gestire esplicitamente eventi `TOKEN_REFRESHED`, `SIGNED_OUT`
- Pulire localStorage quando sessione scade
- Reindirizzare al login quando necessario

---

## ✅ **BEST PRACTICES DA OPENDOTA E SUPABASE**

### **1. OpenDota Approach:**
- ✅ Usa ID Steam per identificare giocatori (non localStorage)
- ✅ Non salva ID critici in localStorage
- ✅ Usa database/server per dati persistenti

### **2. Supabase Best Practices:**
- ✅ Usa token JWT per autenticazione (non localStorage per ID)
- ✅ Implementa RLS policies (✅ già fatto)
- ✅ Gestisce correttamente refresh token
- ✅ Usa sessioni gestite da Supabase (non localStorage)

---

## 🔧 **SOLUZIONI PROPOSTE**

### **Fix 1: Gestione Errori Refresh Token** (PRIORITÀ ALTA)

**File:** `lib/supabase.ts`

```typescript
// Aggiungere gestione errori refresh token
if (typeof window !== 'undefined') {
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase] Token refreshed successfully')
    } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
      console.log('[Supabase] Session expired or user signed out')
      // Pulire localStorage quando sessione scade
      try {
        localStorage.removeItem('sb-auth-token')
        // NON rimuovere fzth_player_id (non più usato)
      } catch (err) {
        console.error('Failed to clear auth token:', err)
      }
    } else if (event === 'SIGNED_IN') {
      console.log('[Supabase] User signed in')
    }
  })
}
```

---

### **Fix 2: Rimuovere localStorage per Player ID** (PRIORITÀ ALTA)

**File:** `app/dashboard/settings/page.tsx`

**Rimuovere:**
```typescript
// Also save to localStorage as fallback
if (playerIdString) {
  try {
    localStorage.setItem('fzth_player_id', playerIdString)
  } catch (err) {
    console.error('Failed to save to localStorage:', err)
  }
} else {
  try {
    localStorage.removeItem('fzth_player_id')
  } catch (err) {
    console.error('Failed to remove from localStorage:', err)
  }
}
```

**Rimuovere anche:**
```typescript
// Fallback to localStorage if DB fetch fails
const saved = localStorage.getItem('fzth_player_id')
if (saved) {
  setDotaAccountId(saved)
  setPlayerId(saved)
}
```

---

### **Fix 3: Modificare PlayerIdContext per usare Database** (PRIORITÀ ALTA)

**File:** `lib/playerIdContext.tsx`

**Cambiare:**
- Caricare da database quando user è autenticato
- Rimuovere localStorage per Player ID
- Mantenere localStorage solo per preferenze UI

---

### **Fix 4: Migliorare Gestione Errori 403** (PRIORITÀ MEDIA)

**File:** `app/dashboard/settings/page.tsx`

```typescript
if (updateError) {
  console.error('Error updating player ID:', updateError)
  
  // Se è un errore di autenticazione, reindirizza al login
  if (updateError.code === 'PGRST301' || 
      updateError.message?.includes('JWT') ||
      updateError.message?.includes('permission denied')) {
    setMessage({
      type: 'error',
      text: 'Sessione scaduta. Effettua il login di nuovo.',
    })
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
    return
  }
  
  setMessage({
    type: 'error',
    text: updateError.message || 'Errore nel salvataggio del Player ID.',
  })
  setSaving(false)
  return
}
```

---

### **Fix 5: Migliorare AuthContext** (PRIORITÀ MEDIA)

**File:** `lib/auth-context.tsx`

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Token refresh riuscito
    setSession(session)
    setUser(session?.user ?? null)
  } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
    // Sessione scaduta o logout
    setSession(null)
    setUser(null)
    // Pulire localStorage
    try {
      localStorage.removeItem('sb-auth-token')
    } catch (err) {
      console.error('Failed to clear auth token:', err)
    }
  } else {
    setSession(session)
    setUser(session?.user ?? null)
  }
  setLoading(false)
})
```

---

## 📊 **RIEPILOGO PROBLEMI**

| Problema | File | Priorità | Stato |
|----------|------|----------|-------|
| Gestione errori refresh token | `lib/supabase.ts` | 🔴 ALTA | ❌ Da fixare |
| localStorage per Player ID | `app/dashboard/settings/page.tsx` | 🔴 ALTA | ❌ Da rimuovere |
| PlayerIdContext usa localStorage | `lib/playerIdContext.tsx` | 🔴 ALTA | ❌ Da modificare |
| Gestione errori 403 | `app/dashboard/settings/page.tsx` | 🟡 MEDIA | ⚠️ Da migliorare |
| AuthContext refresh token | `lib/auth-context.tsx` | 🟡 MEDIA | ⚠️ Da migliorare |

---

## ✅ **CHECKLIST IMPLEMENTAZIONE**

- [ ] Fix 1: Gestione errori refresh token in `lib/supabase.ts`
- [ ] Fix 2: Rimuovere localStorage da `app/dashboard/settings/page.tsx`
- [ ] Fix 3: Modificare `PlayerIdContext` per usare database
- [ ] Fix 4: Migliorare gestione errori 403
- [ ] Fix 5: Migliorare `AuthContext` per refresh token
- [ ] Test: Verificare che refresh token funzioni
- [ ] Test: Verificare che Player ID venga caricato da database
- [ ] Test: Verificare che errori 403 reindirizzino al login

---

## 🎯 **ORDINE DI IMPLEMENTAZIONE**

1. **Prima:** Fix 2 e 3 (rimuovere localStorage, usare solo database)
2. **Poi:** Fix 1 e 5 (gestione refresh token)
3. **Infine:** Fix 4 (migliorare UX errori)

---

**Stato:** ⏸️ **IN ATTESA APPROVAZIONE UTENTE**

**Prossimi passi dopo approvazione:**
1. Implementare fix in ordine di priorità
2. Testare ogni fix
3. Verificare che tutti i problemi siano risolti

