# 📊 Analisi Log Supabase - Conferma Bug

**Data:** Analisi log API Supabase  
**Risultato:** 🔴 **BUG CONFERMATO**

---

## 🔴 **ERRORI IDENTIFICATI NEI LOG**

### **Errori 403 Forbidden (Permission Denied)**

**Richieste a `/rest/v1/users`:**
- `403 /rest/v1/users ?select=dota_account_id, dota_account_verified_at, dota_...` → **37 volte**
- `403 /rest/v1/users ?select=dota_account_id, dota_account_verified_at, dota_...` → **13 volte**
- `403 /rest/v1/users ?select=dota_account_id&id=eq.d50ada81...` → **6 volte**

**Richieste a `/rest/v1/utenti`:**
- `403 /rest/v1/utenti ?select=dota_account_id&id=eq.10c328e5...` → **13 volte**
- `403 /rest/v1/utenti ?id=eq.10c328e5...` → **3 volte**

### **Errori 401 Unauthorized**

**Richieste a `/rest/v1/users`:**
- `401 /rest/v1/users ?select=dota_account_id, dota_account_verified_at, dota_...` → **11 volte**
- `401 /rest/v1/users ?select=dota_account_id&id=eq.d50ada81...` → **3 volte**

---

## 🔍 **ANALISI ERRORI**

### **403 Forbidden (Permission Denied)**
**Causa:** RLS policies bloccano l'accesso perché:
- `auth.uid()` restituisce `null` (non può estrarre user_id dal JWT)
- RLS policy verifica: `auth.uid() = id` → `null = "xxx"` → **FALSE**
- Query bloccata

**Perché `auth.uid()` è null?**
- Authorization header contiene anon key invece del JWT utente
- Supabase non può estrarre user_id da anon key
- Risultato: `auth.uid() = null`

### **401 Unauthorized**
**Causa:** Token JWT non valido o mancante
- Potrebbe essere che il token sia scaduto
- O che l'Authorization header non contenga un JWT valido

---

## 🎯 **CONFERMA BUG**

**I log confermano:**
1. ✅ Le richieste a `users` falliscono con 403/401
2. ✅ Il problema è di autenticazione/autorizzazione
3. ✅ `auth.uid()` è null (non può estrarre user_id)
4. ✅ RLS policies bloccano correttamente (comportamento atteso quando auth.uid() è null)

**Causa Root:**
- `Authorization: Bearer ${anonKey}` nei global headers sovrascrive il token utente
- Supabase server riceve anon key invece del JWT utente
- `auth.uid()` restituisce null
- RLS policies bloccano l'accesso

---

## ✅ **SOLUZIONE**

**Fix Richiesto:**
Rimuovere `Authorization: Bearer ${supabaseAnonKey}` da `lib/supabase.ts` riga 91

**Dopo il fix:**
- Supabase userà automaticamente `session.access_token` (JWT utente)
- `auth.uid()` estrae correttamente user_id
- RLS policies permettono accesso
- Nessun errore 403/401

---

**Stato:** 🔴 **BUG CONFERMATO DAI LOG**

