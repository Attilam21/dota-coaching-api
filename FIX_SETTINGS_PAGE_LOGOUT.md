# ✅ Fix: Settings Page - Logout quando si clicca sull'input

**Problema:** Quando l'utente clicca sulla casella per inserire l'ID, l'app fa logout automaticamente.

**Causa Root:**
1. `loadUserSettings()` faceva una query a Supabase ogni volta che `user` cambiava
2. La query falliva con 401/403 (per Authorization header con anon key)
3. Il codice rilevava l'errore e reindirizzava automaticamente al login dopo 2 secondi
4. `PlayerIdContext` faceva anche una query, causando doppia query e possibili conflitti

---

## ✅ **FIX APPLICATO**

### **1. Rimosso Authorization header con anon key** (`lib/supabase.ts`)
- Supabase ora gestisce automaticamente Authorization con JWT utente
- Fix del bug principale che causava 401/403

### **2. Semplificata Settings Page** (`app/dashboard/settings/page.tsx`)

**Prima:**
- `loadUserSettings()` faceva query multiple
- Redirect automatico al login su errore
- Logica complessa con fallback

**Dopo:**
- Usa solo `PlayerIdContext` per caricare player ID (una volta)
- Sincronizza input con `playerId` dal context
- Nessun redirect automatico - solo mostra messaggio errore
- Logica semplificata e più robusta

**Modifiche chiave:**
- ❌ Rimosso `loadUserSettings()` e query duplicate
- ✅ Usa solo `PlayerIdContext` (carica una volta all'avvio)
- ✅ Sincronizza input con `useEffect` quando `playerId` cambia
- ✅ Gestione errori semplificata (no redirect automatico)
- ✅ "Rimuovi Player ID" ora salva nel database

---

## 🎯 **RISULTATO**

**Ora:**
1. ✅ Cliccare sull'input non causa più logout
2. ✅ Player ID caricato una volta da `PlayerIdContext`
3. ✅ Nessuna query duplicata
4. ✅ Errori mostrati come messaggi, non redirect
5. ✅ Codice più semplice e manutenibile

---

**Stato:** ✅ **FIX APPLICATO**

