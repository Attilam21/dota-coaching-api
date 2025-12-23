# 🔧 FIX 403 FORBIDDEN - PlayerIdContext

## 🐛 **PROBLEMA**

Gli errori 403 Forbidden si verificano quando `PlayerIdContext` prova a caricare il Player ID dal database **prima che la sessione Supabase sia completamente inizializzata**.

### Cause Identificate:

1. **Timing Issue**: La query viene eseguita prima che il JWT sia disponibile nella sessione
2. **RLS Policies**: Le Row Level Security policies richiedono `auth.uid()` che non è disponibile se la sessione non è pronta
3. **Session State**: La sessione potrebbe essere `null` o non avere `access_token` quando viene eseguita la query

---

## ✅ **SOLUZIONE APPLICATA**

### 1. **Verifica Access Token Prima della Query**

```typescript
// Verifica che la sessione abbia un access_token valido
if (!session.access_token) {
  console.warn('[PlayerIdContext] Session without access_token, waiting...')
  return
}
```

### 2. **Verifica Sessione Valida Prima di Fare la Query**

```typescript
// Verifica che la sessione sia ancora valida prima di fare la query
const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

if (sessionError || !currentSession || !currentSession.access_token) {
  console.error('[PlayerIdContext] Session invalid or expired:', sessionError)
  return
}
```

### 3. **Delay per Inizializzazione Sessione**

```typescript
// Aggiungi un piccolo delay per assicurarsi che la sessione sia completamente inizializzata
const timeoutId = setTimeout(() => {
  loadPlayerIdFromDatabase()
}, 100)
```

### 4. **Gestione Errori 403 Migliorata**

```typescript
if (fetchError.code === 'PGRST301' || fetchError.message?.includes('403') || fetchError.message?.includes('Forbidden')) {
  console.warn('[PlayerIdContext] 403 Forbidden - RLS policy might be blocking. Session:', {
    hasSession: !!currentSession,
    hasAccessToken: !!currentSession?.access_token,
    userId: user.id
  })
}
```

---

## 📊 **FLUSSO CORRETTO**

1. ✅ Attende che `user` e `session` siano disponibili
2. ✅ Verifica che `session.access_token` esista
3. ✅ Verifica che la sessione sia ancora valida con `getSession()`
4. ✅ Attende 100ms per assicurarsi che la sessione sia completamente inizializzata
5. ✅ Esegue la query al database
6. ✅ Gestisce gli errori 403 con logging dettagliato

---

## 🎯 **RISULTATO ATTESO**

- ✅ Nessun errore 403 Forbidden nella console
- ✅ Player ID caricato correttamente dal database
- ✅ Sessione verificata prima di ogni query
- ✅ Logging migliorato per debugging

