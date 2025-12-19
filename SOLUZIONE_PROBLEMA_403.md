# 🔧 SOLUZIONE PROBLEMA 403 - JWT Non Riconosciuto da RLS

## 🎯 PROBLEMA IDENTIFICATO

**CONFLITTO TRA `apikey` E `Authorization` HEADER**

Dall'analisi degli header HTTP della richiesta:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Ik9xSkVZZzB3VTFLYTVMSHQi... (JWT)
```

**Il problema:** Quando Supabase riceve sia `apikey` che `Authorization`, potrebbe:
1. Usare solo `apikey` (anon key) e ignorare `Authorization`
2. Questo fa sì che RLS veda la richiesta come "anon" invece di "authenticated"
3. RLS quindi nega l'accesso perché `auth.uid()` ritorna NULL per utenti anon

## 🔍 VERIFICA

Secondo la documentazione Supabase e issue su GitHub:
- **NON si dovrebbero inviare entrambi gli header simultaneamente**
- Se `apikey` è presente, Supabase potrebbe usare quello invece del JWT
- Il JWT in `Authorization` viene ignorato se `apikey` ha priorità

## ✅ SOLUZIONE

### Opzione 1: Rimuovere `apikey` quando c'è un JWT (CONSIGLIATO)

Il client Supabase JS dovrebbe gestire questo automaticamente, ma potrebbe non farlo correttamente.

**Modifica necessaria:**
- Verificare che Supabase JS non aggiunga `apikey` quando c'è un JWT valido
- Oppure usare un custom fetch che rimuove `apikey` se `Authorization` è presente

### Opzione 2: Usare solo JWT (senza apikey)

Per richieste autenticate, usare solo `Authorization: Bearer <jwt>` senza `apikey`.

### Opzione 3: Verificare Configurazione Supabase

Potrebbe essere un problema di configurazione Supabase dove:
- L'anonymous key non è configurata correttamente
- Il JWT secret non corrisponde
- Le policies RLS non sono attive correttamente

## 📝 IMPLEMENTAZIONE

### Step 1: Verificare come Supabase JS gestisce gli header

Supabase JS dovrebbe:
- Aggiungere `apikey` solo per richieste anonime
- Aggiungere `Authorization: Bearer <jwt>` per richieste autenticate
- **NON** aggiungere entrambi simultaneamente

### Step 2: Se il problema persiste, usare custom fetch

Creare un custom fetch che:
1. Verifica se c'è un JWT valido nella sessione
2. Se c'è JWT → usa solo `Authorization`, NON `apikey`
3. Se non c'è JWT → usa solo `apikey`

### Step 3: Test

Dopo la modifica, verificare che:
- Le richieste autenticate usino solo `Authorization`
- Le richieste anonime usino solo `apikey`
- RLS riconosca correttamente l'utente autenticato

