# 🔧 Fix: RLS Policies - Permission Denied Error

**Data**: Dicembre 2025  
**Problema**: "permission denied for table users" quando si cerca di salvare le impostazioni

---

## ❌ Problema Identificato

**Errore**: `Failed to save settings: Error: permission denied for table users`

**Causa**: Le RLS policies sulla tabella `users` usavano `auth_id` invece di `id` per verificare l'utente autenticato.

---

## ✅ Soluzione Applicata

### 1. Fix RLS Policies

**Prima** (SBAGLIATO):
```sql
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = auth_id)  -- ❌ SBAGLIATO
  WITH CHECK (auth.uid() = auth_id);
```

**Dopo** (CORRETTO):
```sql
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)  -- ✅ CORRETTO
  WITH CHECK (auth.uid() = id);
```

### 2. Fix Codice

**File corretti**:
- `app/dashboard/settings/page.tsx` - Usa `id` invece di `auth_id`
- `lib/playerIdContext.tsx` - Usa `id` invece di `auth_id`
- `components/Navbar.tsx` - Usa `id` invece di `auth_id`

**Prima**:
```typescript
.eq('auth_id', user.id)  // ❌
.upsert({ auth_id: user.id, ... })  // ❌
```

**Dopo**:
```typescript
.eq('id', user.id)  // ✅
.upsert({ id: user.id, ... })  // ✅
```

### 3. Fix Trigger Function

**Funzione `handle_new_user`** aggiornata per usare `id`:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)  -- ✅ Usa id
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Aggiunta Foreign Key Constraint

Aggiunto constraint per assicurare che `id` sia foreign key a `auth.users.id`:
```sql
ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 📋 Migrations Applicate

1. ✅ `fix_users_rls_policies` - Corrette RLS policies
2. ✅ `add_users_foreign_key` - Aggiunto foreign key constraint
3. ✅ `fix_handle_new_user_function` - Corretta funzione trigger

---

## ✅ Verifica

**RLS Policies corrette**:
- ✅ SELECT: `auth.uid() = id`
- ✅ UPDATE: `auth.uid() = id`
- ✅ INSERT: `auth.uid() = id`

**Foreign Key**:
- ✅ `id` → `auth.users.id` (CASCADE on delete)

**Codice**:
- ✅ Tutti i file usano `id` invece di `auth_id`
- ✅ Build completato con successo
- ✅ Nessun errore di linting

---

## 🧪 Test

Dopo il fix, testa:
1. **Registrazione**: Crea nuovo account → Verifica che profilo sia creato
2. **Settings**: Vai su `/dashboard/settings` → Modifica display_name/avatar → Salva
3. **Verifica**: Controlla che non ci siano più errori "permission denied"

---

## 📝 Note

- La tabella `users` ha sia `id` (primary key, foreign key a auth.users.id) che `auth_id` (nullable, unique)
- Usiamo sempre `id` per le operazioni, non `auth_id`
- Le RLS policies devono sempre usare `id` per verificare l'utente autenticato

---

**Status**: ✅ **RISOLTO**

