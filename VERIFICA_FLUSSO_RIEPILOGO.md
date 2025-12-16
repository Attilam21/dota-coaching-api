# 📋 Riepilogo Verifica Flusso - Risposte Rapide

## 1️⃣ DOVE VIENE LETTA `public.users.dota_account_id`

### **2 punti principali**:

#### **A) `lib/usePlayerId.ts`** (Hook - NON più usato dalle pagine dashboard)
- **Riga 22-25**: `SELECT dota_account_id FROM users WHERE id = user.id`
- **Query**: `.from('users').select('dota_account_id').eq('id', user.id).single()`
- **Quando**: Hook chiamato quando `user` cambia (ma ora dashboard usa `PlayerIdContext`)

#### **B) `app/dashboard/settings/page.tsx`** (Settings Page - ATTIVO)
- **LETTURA (riga 33-37)**: `SELECT dota_account_id FROM users WHERE id = user.id`
- **SCRITTURA (riga 84-87)**: `UPDATE users SET dota_account_id = $1 WHERE id = $2`

---

## 2️⃣ COME LOGGARE IN CONSOLE

### **Frontend**:

#### **A) Auth User (user.id)**:
```typescript
// lib/auth-context.tsx - dopo setUser()
console.log('[AuthContext] User:', { id: session?.user?.id, email: session?.user?.email })
```

#### **B) Query Supabase Users**:
```typescript
// app/dashboard/settings/page.tsx - dopo SELECT (riga 37)
console.log('[Settings] SELECT:', { user_id: user.id, data, error })

// app/dashboard/settings/page.tsx - dopo UPDATE (riga 87)
console.log('[Settings] UPDATE:', { user_id: user.id, dota_account_id: accountIdValue, error })
```

#### **C) localStorage Player ID**:
```typescript
// lib/playerIdContext.tsx - dopo localStorage.getItem() (riga 31)
console.log('[PlayerIdContext] localStorage loaded:', saved)

// lib/playerIdContext.tsx - dopo localStorage.setItem() (riga 46)
console.log('[PlayerIdContext] localStorage saved:', trimmedId)
```

### **Server Routes**:
- Nessuna API route legge `users.dota_account_id` attualmente

---

## 3️⃣ 3 TEST MANUALI STEP-BY-STEP

### **TEST 1: Login → Dashboard (prima volta)**
1. Logout (se loggato)
2. Login → `/auth/login` → inserisci credenziali → "Sign in"
3. Verifica redirect a `/dashboard`
4. **Console**: `[AuthContext] User:` mostra UUID valido?
5. **Dashboard**: Mostra form "Inserisci Player ID" (blu)?
6. **Network**: NON ci sono chiamate a `/api/player/[id]/stats`?

**✅ Risultato Atteso**: Form input visibile, nessun dato caricato

---

### **TEST 2: Inserimento Player ID → Navigazione**
1. In Dashboard, inserisci Player ID (es. `1903287666`) → "Carica"
2. **Console**: `[PlayerIdContext] localStorage saved:` mostra il Player ID?
3. **Network**: Chiamata a `/api/player/1903287666/stats` con successo?
4. Naviga: Performance → Hero Pool → Teammates → Dashboard
5. **Verifica**: Ogni sezione NON chiede Player ID di nuovo?
6. **Application Tab**: `fzth_player_id` contiene il Player ID in localStorage?

**✅ Risultato Atteso**: Player ID persiste, nessun input duplicato

---

### **TEST 3: Settings Update → Refresh**
1. Vai a Settings ("Profilo Utente")
2. **Console**: `[Settings] SELECT:` mostra query result?
3. Inserisci Player ID (es. `86745912`) → "Salva Impostazioni"
4. **Console**: `[Settings] UPDATE:` mostra `error: null`?
5. **Supabase Dashboard** (opzionale): Verifica `users.dota_account_id` salvato?
6. **Refresh pagina** (F5)
7. **Dashboard**: Carica dati automaticamente o mostra form input?

**⚠️ Risultato DA VERIFICARE**: Potrebbe esserci disallineamento localStorage ↔ DB

---

## 4️⃣ VERIFICA SCHEMA E MATCHING

### ✅ **TUTTO CORRETTO**:
- Tabella: `public.users` ✅
- Colonna `id`: `UUID` → `.eq('id', user.id)` ✅
- Colonna `dota_account_id`: `BIGINT` → `.select('dota_account_id')` ✅
- Query UPDATE: `.update({ dota_account_id: ... })` ✅

**Nessun mismatch trovato nelle query.**

---

## ⚠️ POTENZIALI PROBLEMI IDENTIFICATI

### **PROBLEMA 1: Disallineamento localStorage ↔ Supabase** ⚠️

**Situazione**:
- `PlayerIdContext` usa **localStorage** (`fzth_player_id`)
- `Settings` salva in **Supabase** (`users.dota_account_id`)
- **Non sono sincronizzati!**

**Impatto**:
- Se salvi in Settings → salvato in DB, ma localStorage potrebbe essere vuoto
- Dopo refresh, Dashboard legge da localStorage (vuoto) → mostra form input anche se DB ha valore

**Come verificare (TEST 3)**:
- Salva in Settings
- Refresh pagina
- Dashboard dovrebbe ancora mostrare form input (perché localStorage è vuoto)

---

### **PROBLEMA 2: `usePlayerIdWithManual` ancora presente** ✅ NON PROBLEMA

**Situazione**:
- File `lib/usePlayerIdWithManual.ts` esiste ancora
- Usa localStorage key `manual_player_id` (diverso da `fzth_player_id`)
- **MA**: Non è più importato/usato dalle pagine dashboard
- ✅ Non crea conflitto (non usato)

---

### **PROBLEMA 3: RLS Policy** ⚠️ DA VERIFICARE

**Situazione**:
- RLS abilitato su `public.users`
- Policy: `auth.uid() = id` per UPDATE/SELECT
- Se vedi errore `permission denied` in Settings, RLS sta bloccando

**Come verificare**:
- Esegui TEST 3
- Se in Settings vedi errore `403` o `permission denied` → problema RLS

---

## 🎯 PRIORITÀ VERIFICHE

1. **TEST 3** è il più importante → verifica sincronizzazione Settings ↔ Dashboard
2. Se dopo Settings save + refresh, Dashboard mostra ancora form input → **PROBLEMA CONFERMATO**
3. Verifica RLS se vedi errori `permission denied`

---

## 📝 COMANDI UTILI PER DEBUG

### Verifica localStorage (Browser Console):
```javascript
// Verifica Player ID in localStorage
localStorage.getItem('fzth_player_id')
localStorage.getItem('manual_player_id')  // vecchio, non più usato

// Pulisci localStorage per test
localStorage.removeItem('fzth_player_id')
```

### Verifica Auth User (Browser Console):
```javascript
// Dopo login, verifica session
// (usa Supabase client se disponibile in console)
```

---

## ✅ CHECKLIST PRIMA DI PROSEGUIRE

- [ ] Eseguito TEST 1 → Login/Dashboard funziona?
- [ ] Eseguito TEST 2 → Navigazione persiste Player ID?
- [ ] Eseguito TEST 3 → Settings save → Refresh → Dashboard carica dati o mostra form?
- [ ] Verificato Console logs → Nessun errore Supabase?
- [ ] Verificato localStorage → `fzth_player_id` contiene valore?
- [ ] Verificato Supabase Dashboard → `users.dota_account_id` salvato correttamente?

---

## 🚨 SE TROVI MISMATCH

**FERMATI e dimmi**:
1. Quale query/quale file
2. Quale colonna/tabella è diversa
3. Quale errore vedi in console
4. Screenshot o log completo

**NON fare refactor ora** → prima documenta il problema, poi fix mirato.

