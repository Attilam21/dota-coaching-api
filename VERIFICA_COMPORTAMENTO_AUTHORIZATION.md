# 🔍 Verifica Comportamento Authorization Header

**Domanda:** L'`Authorization: Bearer ${anonKey}` nei global headers viene sovrascritto da Supabase quando c'è una sessione?

---

## 🧪 **TEST PRATICO RICHIESTO**

### **Step 1: Apri Network Tab**

1. Apri Console Browser (F12)
2. Vai su **Network Tab**
3. Filtra per `supabase.co`

### **Step 2: Fai Login e Prova Salvataggio**

1. Fai login nell'app
2. Vai su `/dashboard/settings`
3. Inserisci un Player ID (es: `412910858`)
4. Clicca "Salva Impostazioni"

### **Step 3: Verifica Headers**

1. Clicca sulla richiesta a `rest/v1/users` (PATCH o GET)
2. Vai su **Headers** → **Request Headers**
3. Cerca `Authorization` header
4. **COPIA il valore completo** dell'Authorization header

### **Step 4: Confronta**

**Se Authorization contiene:**
- `Bearer eyJhbGci...` (anon key - inizia con la stessa stringa di `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - ❌ **BUG CONFERMATO** - Usa anon key invece del token utente
  - **Soluzione:** Rimuovere Authorization dai global headers

- `Bearer eyJhbGci...` (JWT utente - stringa diversa da anon key, più lunga)
  - ✅ **OK** - Supabase sovrascrive automaticamente
  - Ma allora perché "permission denied"? → Altro problema

---

## 📊 **ANALISI TEORICA**

### **Come Funziona Supabase Client**

**Secondo documentazione:**
1. Quando passi `anonKey` come secondo parametro a `createClient()`, Supabase lo usa automaticamente come `apikey` header
2. Quando c'è una sessione, Supabase aggiunge automaticamente `Authorization: Bearer ${session.access_token}`
3. I global headers vengono **aggiunti** a ogni richiesta
4. Se c'è un conflitto (Authorization sia in global headers che da sessione), dipende dall'implementazione

**Possibilità:**
- Supabase **sovrascrive** Authorization con session.access_token quando presente ✅ (comportamento atteso)
- Supabase **usa** Authorization dai global headers se presente ❌ (causerebbe il bug)

---

## 🎯 **CONCLUSIONE**

**Test pratico necessario per confermare:**
- Se Authorization usa anon key → ❌ Bug confermato
- Se Authorization usa JWT utente → ✅ OK, ma allora il problema è altrove

---

**Stato:** ⏳ **IN ATTESA TEST PRATICO**

