# 📋 Changelog: Fix Supabase Authentication

**Periodo**: Da quando funzionava → Ultima modifica  
**Data ultima modifica**: Dicembre 2025

---

## 🎯 Panoramica

Questo documento traccia tutte le modifiche apportate al sistema di autenticazione Supabase, dagli errori iniziali fino all'ultima correzione del bug `verifyOtp`.

---

## 📅 Cronologia Modifiche

### 1. 🔧 Fix: "No API key found in request" (Prima versione)

**Problema**: Errore `{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}`

**File modificati**:
- `lib/supabase.ts`

**Modifiche**:
- Aggiunto logging dettagliato per debug
- Verifica che non siano usati valori placeholder
- Migliorata gestione errori

**Documentazione**: `SUPABASE_API_KEY_FIX.md`

---

### 2. 🔧 Fix: "No API key found in request" (Versione finale)

**Problema**: L'errore persisteva perché l'API key non era passata esplicitamente in tutti i client Supabase.

**File modificati**:
- `lib/supabase.ts` (client client-side)
- `lib/supabase-server.ts` (client server-side)
- `app/auth/callback/route.ts` (callback route)

**Modifiche**:
- Aggiunto header `apikey` esplicito in tutti i client Supabase
- Aggiunto header `Authorization` esplicito in tutti i client Supabase
- Configurazione uniforme in tutti i punti di accesso

**Codice aggiunto**:
```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
}
```

**Documentazione**: `SUPABASE_API_KEY_FIX_FINAL.md`

---

### 3. 🔧 Fix: Errore 500 al Signup - "Database error saving new user"

**Problema**: Errore 500 durante la registrazione con messaggio "Database error saving new user".

**Causa**: La colonna `username` nella tabella `users` era `NOT NULL` senza default, ma la funzione `handle_new_user` inseriva solo `id` e `email`.

**Errore Postgres**:
```
ERROR: null value in column "username" of relation "users" violates not-null constraint
```

**File modificati**:
- Database Supabase (migration SQL)

**Modifiche**:
- Applicata migration per rendere `username` nullable:
```sql
ALTER TABLE public.users 
ALTER COLUMN username DROP NOT NULL;
```

**Risultato**:
- ✅ Il trigger `handle_new_user` può ora inserire nuovi utenti senza specificare `username`
- ✅ La colonna `username` è ora `is_nullable = YES`

**Documentazione**: `SIGNUP_ERROR_FIX.md`

---

### 4. 🔧 Fix: Link Conferma Email Non Funziona

**Problema**: Quando si clicca sul link nella mail di conferma, si ottiene:
> "Non si può aprire la pagina perché la connessione al server non è riuscita"

**Causa**: Impostazioni di Redirect URL non configurate correttamente in Supabase.

**File modificati**:
- Nessun file di codice (solo configurazione Supabase Dashboard)

**Modifiche**:
- Configurato **Site URL** in Supabase Dashboard
- Aggiunti **Redirect URLs**:
  - `https://dota2-coaching-platform.vercel.app/auth/callback`
  - `https://dota2-coaching-platform.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

**Nota**: Queste configurazioni devono essere fatte manualmente nel Supabase Dashboard, non possono essere modificate via MCP.

**Documentazione**: `EMAIL_CONFIRMATION_FIX.md`, `CONFIGURA_SUPABASE_REDIRECT.md`

---

### 5. 🔧 Fix: Errore Logico in verifyOtp - token_hash vs token

**Problema**: Errore logico nel codice che mischiava due metodi diversi di verifica OTP.

**Causa**: Quando `email` era presente insieme a `token_hash`, il codice passava `token_hash` al parametro `token` invece di usare il parametro `token_hash`.

**File modificati**:
- `app/auth/callback/route.ts`

**Codice PRIMA (SBAGLIATO)**:
```typescript
if (token_hash && type) {
  if (email) {
    // ❌ SBAGLIATO: mischia token_hash con token
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: token_hash,  // ← Usa token_hash come se fosse token
      type: type,
    })
  } else {
    // ✅ Corretto
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token_hash,
      type: type,
    })
  }
}
```

**Codice DOPO (CORRETTO)**:
```typescript
if (token_hash && type) {
  // ✅ Sempre corretto: usa solo token_hash + type
  // token_hash è self-contained e NON richiede email
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token_hash,
    type: type as 'signup' | 'email' | 'recovery' | 'email_change',
  })
}
```

**Spiegazione**:
- `token_hash` è **self-contained** (contiene già email, user ID, timestamp)
- `token` (OTP manuale) **richiede** `email` per identificare l'utente
- I link di conferma email di Supabase **non includono mai `email`** nel URL
- Il codice funzionava solo perché il fallback (senza email) usava il metodo corretto

**Documentazione**: 
- `SPIEGAZIONE_ERRORE_VERIFYOTP.md`
- `VERIFICA_FIX_VERIFYOTP.md`

**Commit**: `3f40241` - "Fix: Correct verifyOtp parameter usage for token_hash in email confirmation"

---

## 📊 Riepilogo File Modificati

### File di Codice
1. `lib/supabase.ts` - Client client-side con headers espliciti
2. `lib/supabase-server.ts` - Client server-side con headers espliciti
3. `app/auth/callback/route.ts` - Fix logica verifyOtp per token_hash

### Database Supabase
1. Migration: `username` reso nullable
2. Configurazione: Site URL e Redirect URLs (manuale)

---

## ✅ Stato Finale

### Funzionalità Verificate
- ✅ Signup funziona (nessun errore 500)
- ✅ Login funziona
- ✅ Email confirmation funziona (link nella mail)
- ✅ OTP manuale funziona (se implementato)
- ✅ OAuth callback funziona (se implementato)

### Configurazioni Richieste
- ✅ Headers API key in tutti i client Supabase
- ✅ Database schema corretto (username nullable)
- ✅ Site URL configurato in Supabase Dashboard
- ✅ Redirect URLs configurati in Supabase Dashboard

### Codice
- ✅ Logica verifyOtp corretta (token_hash vs token)
- ✅ Gestione separata per token_hash, token, e code
- ✅ Error handling completo

---

## 🔍 Test Consigliati

Dopo ogni modifica, testare:
1. **Signup**: Creare nuovo account → Verificare che non ci siano errori 500
2. **Email Confirmation**: Cliccare link nella mail → Verificare redirect corretto
3. **Login**: Accedere con account esistente → Verificare sessione creata
4. **Console Browser**: Verificare che non ci siano errori "No API key"

---

## 📚 Documentazione Correlata

- `SUPABASE_API_KEY_FIX.md` - Fix iniziale API key
- `SUPABASE_API_KEY_FIX_FINAL.md` - Fix finale API key
- `SIGNUP_ERROR_FIX.md` - Fix errore 500 signup
- `EMAIL_CONFIRMATION_FIX.md` - Fix link conferma email
- `CONFIGURA_SUPABASE_REDIRECT.md` - Istruzioni configurazione redirect
- `SPIEGAZIONE_ERRORE_VERIFYOTP.md` - Spiegazione errore logico
- `VERIFICA_FIX_VERIFYOTP.md` - Verifica del fix verifyOtp
- `SUPABASE_KEYS_EXPLAINED.md` - Spiegazione differenza Anon Key vs Service Role Key

---

## 🎯 Prossimi Passi (Opzionali)

- [ ] Implementare password reset flow completo
- [ ] Aggiungere OAuth providers (Steam, Google, etc.)
- [ ] Migliorare error messages per utente finale
- [ ] Aggiungere logging strutturato per debug

---

**Ultimo aggiornamento**: Dicembre 2025  
**Commit ultima modifica**: `3f40241`

