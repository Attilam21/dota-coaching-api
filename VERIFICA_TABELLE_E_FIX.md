# 🔍 Verifica Tabelle, Conflitti e Fix

**Data**: Dicembre 2025  
**Problema**: Errori 401 "No API key found" nelle richieste a Supabase

---

## ✅ Verifica Struttura Tabelle

### Tabella `users`
- ✅ **Colonna `id`**: UUID, PRIMARY KEY, FOREIGN KEY a `auth.users.id`
- ✅ **Default rimosso**: `id` non ha più `uuid_generate_v4()` (deve essere uguale a `auth.users.id`)
- ✅ **Colonna `auth_id`**: Esiste ma non usata (nullable, unique)
- ✅ **Colonne personalizzazione**: `display_name`, `avatar_url` presenti
- ✅ **Foreign Key**: `users_id_fkey` → `auth.users(id)` ON DELETE CASCADE

### Constraints
- ✅ PRIMARY KEY: `id`
- ✅ UNIQUE: `email`, `username`, `dota_account_id`, `auth_id`
- ✅ FOREIGN KEY: `id` → `auth.users.id`

---

## ✅ Verifica RLS Policies

**RLS abilitato**: ✅ `rowsecurity = true`

**Policies configurate**:
1. ✅ **SELECT**: `auth.uid() = id` - Utente può vedere solo il proprio profilo
2. ✅ **UPDATE**: `auth.uid() = id` - Utente può aggiornare solo il proprio profilo
3. ✅ **INSERT**: `auth.uid() = id` - Utente può inserire solo il proprio profilo

---

## ✅ Verifica Trigger

**Trigger presente**: ✅ `on_auth_user_created`
- **Evento**: `AFTER INSERT ON auth.users`
- **Funzione**: `handle_new_user()`
- **Comportamento**: Crea automaticamente profilo in `public.users` quando si registra

**Funzione `handle_new_user`**:
```sql
INSERT INTO public.users (id, email)
VALUES (NEW.id, NEW.email)
ON CONFLICT (id) DO NOTHING;
```

---

## ✅ Test Salvataggio Interno

**Test eseguito**: ✅ Funziona quando si bypassa RLS
- ✅ UPSERT funziona correttamente
- ✅ UPDATE funziona correttamente
- ✅ Dati salvati correttamente

**Risultato test**:
```sql
SELECT * FROM test_user_upsert(
  'fa2cace2-e17c-4e3d-b499-118bfc687801'::UUID,
  'attiliomazzetti@gmail.com',
  'Test Display Name',
  'https://example.com/avatar.jpg',
  123456
);
-- ✅ Success: true
```

---

## ❌ Problema Identificato

**Errore**: 401 "No API key found in request"

**Causa**: Il client Supabase JS nel browser non passa automaticamente l'header `apikey` nelle richieste REST quando c'è una sessione autenticata.

**Log Supabase mostrano**:
- `GET /rest/v1/users` → 401
- `POST /rest/v1/users` → 401
- `PATCH /rest/v1/users` → 401

**Tutte le richieste mancano l'header `apikey`**.

---

## ✅ Fix Applicato

### 1. Rimosso Default da `id`
```sql
ALTER TABLE public.users 
ALTER COLUMN id DROP DEFAULT;
```

### 2. Custom Fetch per Includere Sempre API Key

Modificato `lib/supabase.ts` per usare un custom `fetch` che include sempre l'API key:

```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey,
  },
  fetch: (url, options = {}) => {
    const headers = new Headers(options.headers)
    if (!headers.has('apikey')) {
      headers.set('apikey', supabaseAnonKey)
    }
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${supabaseAnonKey}`)
    }
    return fetch(url, { ...options, headers })
  },
}
```

**Nota**: Se c'è una sessione, Supabase JS aggiungerà automaticamente il token JWT come `Authorization: Bearer <token>`, ma dobbiamo comunque includere l'API key come `apikey`.

---

## 🧪 Test da Eseguire

1. **Ricarica la pagina** (hard refresh: `Ctrl + Shift + R`)
2. **Vai su `/dashboard/settings`**
3. **Modifica display_name o avatar_url**
4. **Clicca "Salva Impostazioni"**
5. **Verifica che non ci siano più errori 401**

---

## 📋 Checklist Finale

- [x] Tabella `users` corretta (default rimosso da `id`)
- [x] Foreign key `id` → `auth.users.id` presente
- [x] RLS abilitato
- [x] Policies RLS corrette (3 policies)
- [x] Trigger `on_auth_user_created` presente
- [x] Funzione `handle_new_user` corretta
- [x] Test salvataggio funziona (con SECURITY DEFINER)
- [x] Custom fetch per includere sempre API key
- [ ] Test end-to-end nel browser

---

**Status**: ✅ **FIX APPLICATO - IN ATTESA DI TEST**

