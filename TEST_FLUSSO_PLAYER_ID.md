# 🧪 Test Flusso Player ID - ID: 412910858

**Data Test:** Verifica flusso completo  
**Player ID Test:** 412910858

---

## ✅ **VERIFICHE DATABASE**

### **1. Struttura Tabella `users`** ✅

**Colonne Verificate:**
- ✅ `id` (uuid, NOT NULL)
- ✅ `email` (text, NOT NULL)
- ✅ `dota_account_id` (bigint, NULLABLE) ← **Colonna corretta**
- ✅ `dota_account_verified_at` (timestamp with time zone, NULLABLE)
- ✅ `dota_account_verification_method` (text, NULLABLE)
- ✅ `created_at` (timestamp with time zone)
- ✅ `updated_at` (timestamp with time zone)

**Stato:** ✅ **Struttura corretta**

---

### **2. RLS Policies** ✅

**UPDATE Policy Verificata:**
- ✅ Policy: `Users can update own profile`
- ✅ Operazione: `UPDATE`
- ✅ Using: `(auth.uid() = id)` ← **Corretto**
- ✅ With Check: `(auth.uid() = id)` ← **Corretto**

**Stato:** ✅ **Policies corrette - permettono UPDATE**

---

## 🔄 **FLUSSO COMPLETO SIMULATO**

### **Scenario: Utente loggato salva Player ID 412910858**

#### **Step 1: Utente apre Settings Page**
```
1. Utente autenticato (user presente da useAuth())
2. SettingsPage.loadUserSettings() viene chiamato
3. Query: supabase.from('users').select('dota_account_id').eq('id', user.id).single()
4. Risultato: dota_account_id = null (prima volta)
5. Campo rimane vuoto
```

#### **Step 2: Utente inserisce Player ID**
```
1. Utente inserisce "412910858" nel campo
2. setDotaAccountId("412910858")
3. Stato locale aggiornato
```

#### **Step 3: Utente clicca "Salva Impostazioni"**
```
1. handleSave() viene chiamato
2. Validazione: parseInt("412910858") = 412910858 ✅
3. Query: supabase.from('users').update({ dota_account_id: 412910858 }).eq('id', user.id)
4. RLS Policy verifica: auth.uid() = id ✅
5. UPDATE eseguito con successo
6. setPlayerId("412910858") aggiorna Context
7. Messaggio successo mostrato
```

#### **Step 4: Ricarica Pagina**
```
1. SettingsPage.loadUserSettings() viene chiamato di nuovo
2. Query: supabase.from('users').select('dota_account_id').eq('id', user.id).single()
3. Risultato: dota_account_id = 412910858 ✅
4. Campo viene popolato con "412910858"
5. setPlayerId("412910858") aggiorna Context
```

#### **Step 5: Dashboard Carica Dati**
```
1. DashboardPage usa usePlayerIdContext()
2. playerId = "412910858" (da Context)
3. Fetch: /api/player/412910858/stats
4. OpenDota API: https://api.opendota.com/api/players/412910858/matches
5. Dati caricati e mostrati
```

---

## ✅ **VERIFICHE API OPENDOTA**

### **Player ID: 412910858** ✅

**Endpoint Test:**
- ✅ `/api/opendota/player/412910858` → **VERIFICATO - ID valido**
- ⏳ `/api/player/412910858/stats` → Da testare in runtime

**Dati Giocatore (OpenDota):**
```json
{
  "profile": {
    "account_id": 412910858,
    "personaname": "Vahee",
    "steamid": "76561198373176586",
    "avatar": "https://avatars.steamstatic.com/..."
  },
  "rank_tier": 80,
  "leaderboard_rank": null
}
```

**Stato:** ✅ **ID valido e funzionante su OpenDota**

---

## 🔍 **PUNTI CRITICI VERIFICATI**

### **1. Database Schema** ✅
- ✅ Colonna `dota_account_id` esiste
- ✅ Tipo `bigint` corretto (supporta numeri grandi)
- ✅ Nullable corretto (può essere null)

### **2. RLS Policies** ✅
- ✅ UPDATE policy presente e corretta
- ✅ Verifica `auth.uid() = id` corretta
- ✅ Permette aggiornamento solo del proprio record

### **3. Codice Flusso** ✅
- ✅ `loadUserSettings()` carica da database
- ✅ `handleSave()` salva in database
- ✅ `PlayerIdContext` carica da database
- ✅ Nessun localStorage per Player ID

### **4. Gestione Errori** ✅
- ✅ Errori 403 gestiti con reindirizzamento
- ✅ Errori permission denied gestiti
- ✅ Logging dettagliato per debug

---

## ⚠️ **POSSIBILI PROBLEMI**

### **1. Se vedi "permission denied" (code: 42501)**

**Causa Possibile:**
- Sessione non valida o token JWT scaduto
- RLS policy non riconosce l'utente

**Soluzione:**
1. Verifica che l'utente sia loggato (controlla cookies `sb-auth-token`)
2. Fai logout e login di nuovo
3. Verifica che le policies siano attive (già verificato ✅)

### **2. Se vedi "Sessione scaduta" durante salvataggio**

**Causa Possibile:**
- Il controllo `getSession()` era troppo restrittivo (✅ **FIXATO**)
- Token refresh in corso

**Soluzione:**
- ✅ **FIX IMPLEMENTATO:** Rimosso controllo ridondante
- Il client Supabase gestisce automaticamente la sessione

### **3. Se l'ID non viene salvato**

**Causa Possibile:**
- Errore nella query UPDATE
- RLS policy blocca l'update

**Verifica:**
- Controlla console per errori dettagliati
- Verifica che `user.id` corrisponda all'ID nella tabella

---

## 🧪 **TEST MANUALE CONSIGLIATO**

1. **Login:** Accedi con un account
2. **Settings:** Vai su `/dashboard/settings`
3. **Inserisci ID:** Inserisci `412910858`
4. **Salva:** Clicca "Salva Impostazioni"
5. **Verifica:** Controlla console per errori
6. **Ricarica:** Ricarica la pagina e verifica che l'ID sia ancora presente
7. **Dashboard:** Vai su `/dashboard` e verifica che i dati vengano caricati

---

## 📊 **RISULTATO ATTESO**

### **Se tutto funziona:**
- ✅ Player ID viene salvato nel database
- ✅ Player ID viene caricato al reload
- ✅ Dashboard mostra statistiche per ID 412910858
- ✅ Nessun errore "sessione scaduta" durante salvataggio
- ✅ Nessun errore "permission denied"

### **Se ci sono problemi:**
- ⚠️ Controlla console per errori dettagliati
- ⚠️ Verifica che l'utente sia autenticato
- ⚠️ Verifica che le policies siano attive

---

**Stato:** ✅ **FLUSSO VERIFICATO TEORICAMENTE**

**Prossimi passi:**
1. Test manuale in browser
2. Verifica che l'ID venga salvato correttamente
3. Verifica che i dati vengano caricati dalla dashboard

