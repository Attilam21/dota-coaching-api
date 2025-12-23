# 🔧 Fix: Problema "Sessione Scaduta" durante Salvataggio

**Problema:** Quando l'utente prova a salvare, riceve "Sessione scaduta. Effettua il login di nuovo" anche se è loggato.

---

## 🔍 **CAUSA IDENTIFICATA**

### **Problema: Controllo `getSession()` Troppo Restrittivo**

**File:** `app/dashboard/settings/page.tsx` (righe 164-175)

**Codice Problematico:**
```typescript
// Verifica che la sessione sia presente
const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

if (sessionError || !currentSession) {
  // ❌ Questo fallisce anche se l'utente è loggato!
  setMessage({
    type: 'error',
    text: 'Sessione non valida. Effettua il login di nuovo.',
  })
  return
}
```

**Perché fallisce:**
1. `getSession()` può restituire `null` anche se l'utente è loggato
2. Problemi di timing durante il refresh del token
3. Il client Supabase ha la sessione in memoria, ma `getSession()` non la restituisce correttamente
4. Se `user` da `useAuth()` è presente, l'utente È autenticato

---

## ✅ **SOLUZIONE IMPLEMENTATA**

### **Fix: Rimuovere Controllo Ridondante**

**File:** `app/dashboard/settings/page.tsx`

**Codice Corretto:**
```typescript
// SALVA DIRETTAMENTE CON CLIENT SUPABASE
// Il client Supabase gestisce automaticamente la sessione
// Se user è presente (da useAuth()), l'utente è autenticato
// Proviamo direttamente il salvataggio - se fallisce per auth, gestiamo l'errore

const { error: updateError } = await supabase
  .from('users')
  .update({
    dota_account_id: dotaAccountIdNum,
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id)

if (updateError) {
  // Gestione errori migliorata
  if (updateError.code === '42501' || updateError.message?.includes('permission denied')) {
    // Verifica se l'utente è ancora loggato prima di reindirizzare
    const { data: { session: checkSession } } = await supabase.auth.getSession()
    if (!checkSession) {
      // Sessione davvero scaduta
      setMessage({ type: 'error', text: 'Sessione scaduta. Effettua il login di nuovo.' })
      setTimeout(() => router.push('/auth/login'), 2000)
    } else {
      // Sessione presente ma errore permission - potrebbe essere problema RLS
      setMessage({ type: 'error', text: 'Errore di permessi. Se il problema persiste, prova a fare logout e login di nuovo.' })
    }
  }
}
```

---

## 🎯 **LOGICA CORRETTA**

### **Prima (Sbagliato):**
```
handleSave()
  ↓
getSession() ← Controllo ridondante
  ↓
Se null → Errore "Sessione scaduta" ❌
  ↓
NON prova nemmeno il salvataggio
```

### **Dopo (Corretto):**
```
handleSave()
  ↓
user presente? (da useAuth()) ✅
  ↓
Prova direttamente salvataggio
  ↓
Se errore 403/permission denied:
  - Verifica getSession() per confermare
  - Se sessione scaduta → Reindirizza login
  - Se sessione presente → Messaggio permessi
```

---

## 📊 **BENEFICI**

1. ✅ **Non blocca inutilmente:** Prova sempre il salvataggio se `user` è presente
2. ✅ **Gestione errori intelligente:** Distingue tra sessione scaduta e errori permessi
3. ✅ **Meno falsi positivi:** Non mostra "sessione scaduta" quando l'utente è loggato
4. ✅ **Logging migliorato:** Aggiunto log dettagliato errori per debug

---

## ⚠️ **NOTA IMPORTANTE**

Il client Supabase gestisce automaticamente:
- ✅ Refresh token
- ✅ Sessione in memoria
- ✅ Headers JWT nelle richieste

Se `user` da `useAuth()` è presente, possiamo fidarci che l'utente è autenticato e provare direttamente il salvataggio.

---

**Stato:** ✅ **FIX IMPLEMENTATO**

**Prossimi passi:**
1. Testare il salvataggio
2. Verificare che non mostri più "sessione scaduta" quando l'utente è loggato
3. Se ci sono ancora errori 403, verificare RLS policies

