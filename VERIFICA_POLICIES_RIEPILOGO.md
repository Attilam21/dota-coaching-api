# 🔍 Verifica RLS Policies - Riepilogo

**Data:** Verifica policies dopo rimozione localStorage per Player ID  
**Stato:** ⏸️ **IN ATTESA VERIFICA IN SUPABASE**

---

## 📋 **POLICIES RICHIESTE**

### **Tabella `users` (3 policies obbligatorie)**

1. **SELECT** - Lettura del proprio profilo
   ```sql
   CREATE POLICY "Users can view own profile" ON public.users
     FOR SELECT 
     USING (auth.uid() = id);
   ```
   - ✅ Permette di leggere solo il proprio record
   - ✅ Necessaria per `loadUserSettings()` che fa `SELECT dota_account_id`

2. **UPDATE** - Aggiornamento del proprio profilo
   ```sql
   CREATE POLICY "Users can update own profile" ON public.users
     FOR UPDATE 
     USING (auth.uid() = id)
     WITH CHECK (auth.uid() = id);
   ```
   - ✅ Permette di aggiornare solo il proprio record
   - ✅ Necessaria per `handleSave()` che fa `UPDATE dota_account_id`

3. **INSERT** - Creazione del proprio profilo
   ```sql
   CREATE POLICY "Users can insert own profile" ON public.users
     FOR INSERT 
     WITH CHECK (auth.uid() = id);
   ```
   - ✅ Permette di creare solo il proprio record
   - ✅ Necessaria per trigger `on_auth_user_created` e UPSERT

---

### **Tabella `match_analyses` (minimo 3 policies)**

1. **SELECT** - Lettura delle proprie analisi
   ```sql
   CREATE POLICY "Users can view own analyses" ON public.match_analyses
     FOR SELECT 
     USING (auth.uid() = user_id);
   ```

2. **INSERT** - Creazione delle proprie analisi
   ```sql
   CREATE POLICY "Users can insert own analyses" ON public.match_analyses
     FOR INSERT 
     WITH CHECK (auth.uid() = user_id);
   ```

3. **UPDATE** - Aggiornamento delle proprie analisi
   ```sql
   CREATE POLICY "Users can update own analyses" ON public.match_analyses
     FOR UPDATE 
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```

4. **DELETE** (opzionale) - Eliminazione delle proprie analisi
   ```sql
   CREATE POLICY "Users can delete own analyses" ON public.match_analyses
     FOR DELETE 
     USING (auth.uid() = user_id);
   ```

---

## ✅ **CHECKLIST VERIFICA**

### **Database (Supabase SQL Editor):**

Esegui `supabase/VERIFICA_POLICIES_COMPLETA.sql` e verifica:

- [ ] **RLS abilitato** su `users` → Deve mostrare `✅ RLS ABILITATO`
- [ ] **RLS abilitato** su `match_analyses` → Deve mostrare `✅ RLS ABILITATO`
- [ ] **3 policies** per `users` → Deve mostrare `✅ CORRETTO (3 policies)`
- [ ] **Almeno 3 policies** per `match_analyses` → Deve mostrare `✅ CORRETTO`
- [ ] **Nessun duplicato** → Deve mostrare `✅ NESSUN DUPLICATO`
- [ ] **Policies corrette** → Tutte devono mostrare `✅ CORRETTA`

---

## 🔧 **SE QUALCOSA NON VA**

### **Problema 1: RLS non abilitato**
**Soluzione:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analyses ENABLE ROW LEVEL SECURITY;
```

### **Problema 2: Policies mancanti**
**Soluzione:** Esegui `supabase/fix_rls_policies.sql`

### **Problema 3: Policies duplicate**
**Soluzione:** Esegui `supabase/fix_all_policies.sql`

### **Problema 4: Policies errate**
**Soluzione:** Esegui `supabase/fix_rls_policies.sql` (ricrea tutte le policies)

---

## 📝 **SCRIPT DISPONIBILI**

1. **`supabase/VERIFICA_POLICIES_COMPLETA.sql`** ← **USA QUESTO PER VERIFICARE**
   - Verifica completa di tutte le policies
   - Mostra stato dettagliato
   - Identifica problemi

2. **`supabase/fix_rls_policies.sql`**
   - Fix policies per tabella `users`
   - Ricrea le 3 policies corrette

3. **`supabase/fix_all_policies.sql`**
   - Rimuove tutte le policies e ricrea solo quelle corrette
   - Utile se ci sono duplicati

4. **`supabase/quick_check.sql`**
   - Check rapido dello stato
   - Meno dettagliato ma più veloce

---

## 🎯 **RISULTATO ATTESO**

Dopo aver eseguito `VERIFICA_POLICIES_COMPLETA.sql`, dovresti vedere:

```
✅ RLS ABILITATO su users
✅ RLS ABILITATO su match_analyses
✅ CORRETTO (3 policies) per users
✅ CORRETTO (3+ policies) per match_analyses
✅ NESSUN DUPLICATO
✅ CORRETTA per tutte le policies
```

---

## ⚠️ **IMPORTANTE**

Le policies devono essere **ESATTAMENTE** come specificato:
- `USING (auth.uid() = id)` per `users`
- `USING (auth.uid() = user_id)` per `match_analyses`
- `WITH CHECK` deve corrispondere a `USING` per UPDATE/INSERT

Se le policies sono diverse, potrebbero causare errori 403 Forbidden.

---

**⏸️ IN ATTESA VERIFICA IN SUPABASE**

**Prossimi passi:**
1. Eseguire `VERIFICA_POLICIES_COMPLETA.sql` in Supabase SQL Editor
2. Verificare che tutti i check siano ✅
3. Se ci sono problemi, eseguire script di fix appropriati
4. Ripetere verifica fino a quando tutto è ✅

