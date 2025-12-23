# 🔧 Fix: "Nessuna chiave API trovata nella richiesta"

**Errore:** `{"message":"Nessuna chiave API trovata nella richiesta","hint":"Non è stata trovata alcuna intestazione di richiesta `apikey` o parametro URL."}`

---

## 🔍 **CAUSA IDENTIFICATA**

L'errore indica che il client Supabase non sta inviando correttamente l'header `apikey` nelle richieste HTTP a Supabase.

**Possibili cause:**
1. Le variabili d'ambiente non sono configurate su Vercel
2. Il client Supabase non include correttamente l'apikey nei global headers
3. Le variabili d'ambiente non sono disponibili al momento della creazione del client

---

## ✅ **SOLUZIONE IMPLEMENTATA**

### **Fix 1: Migliorato Configurazione Client Supabase**

**File:** `lib/supabase.ts`

**Modifiche:**
1. ✅ Aggiunto `Authorization` header come fallback
2. ✅ Aggiunto schema `public` esplicito
3. ✅ Aggiunto controllo validità apikey

**Codice:**
```typescript
const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey, // Assicura che apikey sia sempre presente
      'Authorization': `Bearer ${supabaseAnonKey}`, // Fallback per compatibilità
    },
  },
  db: {
    schema: 'public',
  },
})
```

---

## ⚠️ **VERIFICA VARIABILI D'AMBIENTE SU VERCEL**

### **Passo 1: Verifica Environment Variables**

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `dota2-coaching-platform`
3. Vai su **Settings** → **Environment Variables**
4. Verifica che ci siano:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Passo 2: Verifica che le Variabili Siano per Tutti gli Ambienti**

Assicurati che le variabili siano configurate per:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### **Passo 3: Redeploy dopo Modifiche**

Se hai modificato le variabili d'ambiente:
1. Vai su **Deployments**
2. Clicca sui **3 puntini** sull'ultimo deployment
3. Seleziona **Redeploy**
4. Oppure fai un nuovo push su `main`

---

## 🔍 **DEBUG: Verifica che l'Apikey Sia Inclusa**

### **Test 1: Controlla Console Browser**

Apri la Console del Browser (F12) e cerca:
- ✅ `NEXT_PUBLIC_SUPABASE_URL: ✅ Set`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set`
- ❌ Se vedi `❌ Missing`, le variabili non sono configurate

### **Test 2: Controlla Network Tab**

1. Apri **Network Tab** (F12)
2. Filtra per `supabase.co`
3. Clicca su una richiesta
4. Vai su **Headers**
5. Verifica che ci sia:
   - ✅ `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ✅ `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Test 3: Verifica Variabili in Runtime**

Aggiungi questo codice temporaneamente per debug:

```typescript
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 Debug Supabase Config:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
  })
}
```

---

## 🚨 **SE IL PROBLEMA PERSISTE**

### **1. Hard Refresh del Browser**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### **2. Logout e Login**
1. Fai logout dall'app
2. Pulisci i cookies del browser
3. Fai login di nuovo

### **3. Verifica Log Vercel**
1. Vai su Vercel Dashboard → Progetto → **Deployments**
2. Clicca sull'ultimo deployment
3. Controlla **Function Logs** per errori

### **4. Verifica Supabase Dashboard**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Vai su **Settings** → **API**
3. Verifica che l'**anon/public key** sia corretta
4. Copia la key e confrontala con quella su Vercel

---

## 📊 **CHECKLIST COMPLETA**

- [ ] Variabili d'ambiente configurate su Vercel
- [ ] Variabili configurate per Production, Preview, Development
- [ ] Progetto Vercel redeployato dopo modifiche
- [ ] Hard refresh del browser fatto
- [ ] Logout/Login fatto
- [ ] Console browser mostra variabili "✅ Set"
- [ ] Network tab mostra header `apikey` nelle richieste
- [ ] Supabase Dashboard mostra anon key corretta

---

## 🎯 **RISULTATO ATTESO**

Dopo il fix:
- ✅ Nessun errore "Nessuna chiave API trovata"
- ✅ Richieste a Supabase includono header `apikey`
- ✅ Player ID può essere salvato/caricato correttamente
- ✅ Nessun errore 403 Forbidden

---

**Stato:** ✅ **FIX IMPLEMENTATO**

**Prossimi passi:**
1. Verifica variabili d'ambiente su Vercel
2. Redeploy progetto se necessario
3. Test salvataggio Player ID

