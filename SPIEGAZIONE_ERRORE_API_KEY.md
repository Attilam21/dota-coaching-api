# 🔍 Perché l'Errore "Nessuna chiave API trovata" si Verifica

**Errore:** `{"message":"Nessuna chiave API trovata nella richiesta","hint":"Non è stata trovata alcuna intestazione di richiesta `apikey` o parametro URL."}`

---

## 🤔 **PERCHÉ SUCCEDE?**

Anche se le variabili d'ambiente sono configurate correttamente su Vercel, l'errore può verificarsi per questi motivi:

### **1. Client Supabase Creato come Singleton** ⚠️

**Problema:**
```typescript
// lib/supabase.ts
const supabase = createSupabaseClient() // ← Viene creato UNA VOLTA quando il modulo viene caricato
```

**Cosa succede:**
- Il client viene creato quando il file `lib/supabase.ts` viene importato per la prima volta
- Se le variabili d'ambiente non sono disponibili in quel momento (build time vs runtime), il client viene creato con valori `undefined` o `placeholder`
- Anche se le variabili sono configurate su Vercel, potrebbero non essere disponibili al momento della creazione del client

### **2. Next.js e Variabili NEXT_PUBLIC_*** ⚠️

**Problema:**
- Le variabili `NEXT_PUBLIC_*` vengono iniettate al **build time** in Next.js
- Se il build è stato fatto **prima** di configurare le variabili su Vercel, il client viene creato con valori mancanti
- Anche se le variabili sono presenti su Vercel, il codice compilato potrebbe non averle

**Soluzione:**
- ✅ **Redeploy necessario** dopo aver configurato le variabili
- ✅ Le variabili devono essere presenti **prima** del build

### **3. Supabase Client e apikey Header** ⚠️

**Problema:**
- Quando passi l'anonymous key come secondo parametro a `createClient()`, Supabase dovrebbe automaticamente includerla come header `apikey`
- Tuttavia, se il client è stato creato con valori errati, questo meccanismo potrebbe non funzionare
- Anche se aggiungiamo l'apikey nei `global.headers`, se il client è stato creato con valori `undefined`, potrebbe non funzionare

### **4. Cache del Browser** ⚠️

**Problema:**
- Il browser potrebbe avere in cache una versione vecchia del codice JavaScript
- Anche se fai un redeploy, il browser potrebbe usare ancora il codice vecchio
- Le variabili potrebbero essere state aggiunte dopo il primo deploy

---

## ✅ **SOLUZIONI IMPLEMENTATE**

### **Fix 1: Aggiunto apikey nei Global Headers**

**File:** `lib/supabase.ts`

```typescript
global: {
  headers: {
    'apikey': supabaseAnonKey, // ← Assicura che apikey sia sempre presente
    'Authorization': `Bearer ${supabaseAnonKey}`, // ← Fallback
  },
}
```

**Perché funziona:**
- Anche se Supabase dovrebbe includere automaticamente l'apikey, lo specifichiamo esplicitamente
- Questo garantisce che l'apikey sia sempre presente in ogni richiesta

### **Fix 2: Validazione Variabili**

**File:** `lib/supabase.ts`

```typescript
if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error('❌ Supabase ANON_KEY sembra non valida!')
}
```

**Perché funziona:**
- Verifica che l'apikey sia valida prima di creare il client
- Mostra errori chiari se le variabili non sono configurate

---

## 🎯 **PERCHÉ L'ERRORE SI VERIFICA ANCORA**

Anche con le variabili configurate, l'errore può verificarsi se:

1. **Build fatto prima delle variabili** ❌
   - Se il build è stato fatto prima di configurare le variabili su Vercel
   - Il codice compilato non ha le variabili
   - **Soluzione:** Redeploy dopo aver configurato le variabili

2. **Cache del browser** ❌
   - Il browser ha in cache il codice vecchio
   - Anche se fai un redeploy, il browser usa ancora il codice vecchio
   - **Soluzione:** Hard refresh (`Ctrl + Shift + R`)

3. **Client creato con valori undefined** ❌
   - Se il client è stato creato quando le variabili non erano disponibili
   - Anche se le variabili sono presenti ora, il client è già stato creato
   - **Soluzione:** Redeploy forza la ricreazione del client

---

## 📊 **SEQUENZA EVENTI**

### **Scenario 1: Variabili Configurate DOPO il Build** ❌

```
1. Build fatto su Vercel (senza variabili)
   → Client creato con valori undefined/placeholder
   
2. Variabili aggiunte su Vercel
   → Ma il codice è già compilato senza le variabili
   
3. Richiesta a Supabase
   → Client usa valori undefined
   → Errore "Nessuna chiave API trovata"
```

**Soluzione:** ✅ **Redeploy** dopo aver configurato le variabili

---

### **Scenario 2: Variabili Configurate PRIMA del Build** ✅

```
1. Variabili configurate su Vercel
   
2. Build fatto su Vercel
   → Variabili iniettate nel codice
   → Client creato con valori corretti
   
3. Richiesta a Supabase
   → Client usa valori corretti
   → apikey header incluso
   → ✅ Funziona!
```

**Soluzione:** ✅ **Già corretto** - variabili configurate prima del build

---

## 🔧 **VERIFICA SE IL FIX FUNZIONA**

### **Test 1: Controlla Network Tab**

1. Apri **Network Tab** (F12)
2. Filtra per `supabase.co`
3. Clicca su una richiesta
4. Vai su **Headers**
5. Verifica:
   - ✅ `apikey: eyJhbGci0iJIUzI1NiIsInR5...` ← **Deve essere presente**
   - ✅ `Authorization: Bearer eyJhbGci0iJIUzI1NiIsInR5...` ← **Deve essere presente**

### **Test 2: Controlla Console**

Cerca nella console:
- ✅ `NEXT_PUBLIC_SUPABASE_URL: ✅ Set`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set`
- ❌ Se vedi `❌ Missing`, le variabili non sono disponibili

---

## 🎯 **CONCLUSIONE**

**Perché l'errore si verifica:**
1. Il client Supabase viene creato come singleton quando il modulo viene caricato
2. Se le variabili non sono disponibili in quel momento, il client viene creato con valori errati
3. Anche se le variabili sono configurate su Vercel, se il build è stato fatto prima, il codice compilato non le ha
4. Il browser potrebbe avere in cache il codice vecchio

**Soluzione:**
1. ✅ Variabili configurate su Vercel (già fatto)
2. ✅ Fix implementato nel codice (apikey nei global headers)
3. ⏳ **Redeploy necessario** per applicare le modifiche
4. ⏳ **Hard refresh** del browser dopo redeploy

---

**Stato:** ✅ **Fix implementato - Redeploy necessario**

