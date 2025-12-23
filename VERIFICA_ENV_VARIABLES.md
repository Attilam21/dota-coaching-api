# 🔍 Verifica Environment Variables

## ❌ **ERRORE**: "Nessuna chiave API trovata nella richiesta"

Questo errore significa che l'header `apikey` non viene inviato nelle richieste a Supabase.

---

## ✅ **SOLUZIONE**

### 1. Verifica `.env.local`

Apri `.env.local` nella root del progetto e verifica:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**IMPORTANTE**:
- ✅ Usa la **anon key (legacy)**, NON la publishable key
- ✅ Le variabili devono iniziare con `NEXT_PUBLIC_` per essere disponibili nel browser
- ✅ NON ci devono essere spazi o caratteri speciali

### 2. Riavvia il Server di Sviluppo

Dopo aver modificato `.env.local`:

```bash
# Ferma il server (Ctrl + C)
# Riavvia
npm run dev
# oppure
yarn dev
```

**IMPORTANTE**: Le environment variables vengono caricate solo all'avvio del server!

### 3. Verifica che le Variabili Siano Caricate

Apri console browser (F12) e esegui:

```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

**Se vedi `undefined`**:
- Le variabili non sono caricate
- Riavvia il server di sviluppo
- Verifica che `.env.local` sia nella root del progetto

### 4. Verifica Network Tab

1. Apri Network tab (F12)
2. Fai una richiesta (es: salva Player ID)
3. Trova richiesta a Supabase (es: `rest/v1/users`)
4. Controlla Headers:
   - ✅ Deve avere `apikey: eyJhbGci...`
   - ✅ Deve avere `Authorization: Bearer eyJhbGci...` (JWT utente, NON anon key)

**Se `apikey` manca**:
- Le environment variables non sono caricate
- Riavvia il server

---

## 🐛 **SE ANCORA NON FUNZIONA**

### Verifica Build

Se stai usando build di produzione:

```bash
# Build
npm run build

# Verifica che le variabili siano incluse
# Le variabili NEXT_PUBLIC_* vengono incluse nel build
```

### Verifica Vercel (se deployato)

1. Vai su Vercel Dashboard
2. Settings → Environment Variables
3. Verifica che ci siano:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Redeploy** dopo aver modificato le variabili

### Test Diretto

Apri console browser e testa:

```javascript
// Test 1: Verifica variabili
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Test 2: Test richiesta diretta
const response = await fetch('https://yzfjtrteezvyoudpfccb.supabase.co/rest/v1/users', {
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  }
})
console.log('Test response:', response.status, await response.text())
```

---

## ✅ **CHECKLIST**

- [ ] `.env.local` esiste nella root del progetto
- [ ] Variabili iniziano con `NEXT_PUBLIC_`
- [ ] Usa anon key (legacy), NON publishable key
- [ ] Server di sviluppo riavviato dopo modifiche
- [ ] Console mostra variabili (non `undefined`)
- [ ] Network tab mostra header `apikey` nelle richieste

---

**Status**: ✅ Fix applicato - Verifica environment variables

