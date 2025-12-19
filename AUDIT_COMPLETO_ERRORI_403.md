# 🔍 AUDIT COMPLETO - Errori 403 "Permission Denied"

## 📊 RISULTATI AUDIT SUPABASE

### ✅ CONFIGURAZIONE CORRETTA

1. **RLS Policies** ✅
   - RLS è abilitato sulla tabella `users`
   - 3 policies configurate correttamente:
     - SELECT: `auth.uid() = id`
     - UPDATE: `auth.uid() = id` (USING e WITH CHECK)
     - INSERT: `auth.uid() = id` (WITH CHECK)
   - Nessuna policy duplicata o conflittuale

2. **Struttura Tabella** ✅
   - Primary Key: `id` (UUID, foreign key a `auth.users.id`)
   - Constraint corretti
   - Nessun trigger che interferisce

3. **Client Supabase** ✅
   - Configurazione corretta: `persistSession: true`, `autoRefreshToken: true`
   - Nessun custom fetch che interferisce
   - JWT token viene passato correttamente (verificato negli header HTTP)

### ❌ PROBLEMA IDENTIFICATO

**IL JWT TOKEN VIENE PASSATO MA SUPABASE RLS NON LO RICONOSCE**

Dall'analisi degli header HTTP:
- ✅ `Authorization: Bearer <jwt_token>` presente
- ✅ `apikey: <anon_key>` presente
- ✅ Token JWT valido (875 caratteri, formato corretto)
- ❌ **Ma Supabase RLS ritorna ancora 403**

## 🔍 ANALISI DEL FLUSSO

### Flusso Atteso:
1. Utente fa login → Supabase crea sessione con JWT
2. JWT viene salvato in localStorage (`sb-auth-token`)
3. Client Supabase legge JWT da localStorage
4. Client Supabase aggiunge `Authorization: Bearer <jwt>` alle richieste REST
5. Supabase RLS legge JWT e estrae `auth.uid()`
6. RLS verifica `auth.uid() = id` nella policy
7. Query viene eseguita ✅

### Flusso Reale (PROBLEMA):
1. ✅ Utente fa login → Sessione creata
2. ✅ JWT salvato in localStorage
3. ✅ Client Supabase legge JWT
4. ✅ Client Supabase aggiunge `Authorization: Bearer <jwt>` (verificato negli header)
5. ❌ **Supabase RLS NON riconosce il JWT o `auth.uid()` ritorna NULL**
6. ❌ RLS nega l'accesso → 403

## 🎯 CAUSE POSSIBILI

### 1. **Problema con il Ruolo nel JWT** (PIÙ PROBABILE)
Il JWT potrebbe avere `role: "authenticated"` ma Supabase potrebbe aspettarsi un ruolo diverso.

**Verifica necessaria:**
- Decodificare il JWT e verificare il campo `role`
- Verificare che sia `"authenticated"` e non `"anon"`

### 2. **Problema con `auth.uid()` in RLS**
Quando Supabase RLS valuta `auth.uid()`, potrebbe ritornare NULL anche se il JWT è presente.

**Possibili cause:**
- JWT scaduto (ma i log mostrano che non è scaduto)
- JWT non valido per il contesto RLS
- Problema con la configurazione Supabase Auth

### 3. **Problema con la Colonna `auth_id`**
La tabella ha sia `id` che `auth_id`. Anche se le policies usano `id`, potrebbe esserci confusione.

**Nota:** `auth_id` esiste ma non viene usata. Le policies usano correttamente `id`.

### 4. **Problema con UPSERT**
L'operazione `upsert` potrebbe avere problemi con RLS perché:
- INSERT policy verifica `WITH CHECK (auth.uid() = id)`
- UPDATE policy verifica `USING (auth.uid() = id) AND WITH CHECK (auth.uid() = id)`
- UPSERT fa sia INSERT che UPDATE, potrebbe fallire su uno dei due

## 🔧 SOLUZIONI PROPOSTE

### Soluzione 1: Verificare il JWT Token
Decodificare il JWT e verificare:
- Campo `role`: deve essere `"authenticated"`
- Campo `sub`: deve corrispondere a `user.id`
- Campo `exp`: deve essere nel futuro

### Soluzione 2: Test Diretto con Service Role Key
Testare se il problema è con RLS o con il JWT:
- Usare service role key (bypass RLS) per verificare se le query funzionano
- Se funzionano, il problema è con RLS/JWT
- Se non funzionano, il problema è con la struttura dati

### Soluzione 3: Separare INSERT e UPDATE
Invece di usare `upsert`, provare:
1. Prima fare SELECT per vedere se esiste
2. Se esiste → UPDATE
3. Se non esiste → INSERT

### Soluzione 4: Verificare Configurazione Supabase
- Verificare che JWT secret sia corretto
- Verificare che le policies siano veramente attive
- Verificare che non ci siano override di RLS

## 📝 PROSSIMI PASSI

1. ✅ Audit completato
2. ⏳ Decodificare JWT per verificare ruolo
3. ⏳ Testare con query diretta usando service role
4. ⏳ Implementare fallback INSERT/UPDATE separati
5. ⏳ Verificare configurazione Supabase Auth

