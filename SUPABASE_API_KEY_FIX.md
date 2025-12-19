# 🔧 Fix: "No API key found in request" - Supabase

**Errore**: `{"message":"No API key found in request","hint":"No `api ` request header or url param was found."}`

## 🔍 CAUSA

L'errore indica che Supabase non riceve l'API key nelle richieste. Questo può accadere per:

1. **Variabili d'ambiente non configurate** su Vercel
2. **API key non passata correttamente** nelle richieste
3. **Client Supabase non inizializzato** correttamente

## ✅ SOLUZIONE IMPLEMENTATA

Ho modificato `lib/supabase.ts` per:
1. ✅ Aggiungere logging dettagliato per debug
2. ✅ Includere esplicitamente l'API key negli headers globali
3. ✅ Verificare che non siano usati valori placeholder

## 🔧 VERIFICA E CONFIGURAZIONE

### 1. Verifica Variabili d'Ambiente su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `dota-2` o `dota-coaching-api`
3. Vai su **Settings** → **Environment Variables**
4. Verifica che ci siano:

```
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (la tua anon key)
```

### 2. Come Ottenere l'Anon Key da Supabase

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Vai su **Settings** → **API**
3. Copia la **anon/public** key (NON la service_role key!)
4. Incollala in Vercel come `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Redeploy su Vercel

**IMPORTANTE**: Dopo aver aggiunto/modificato le variabili d'ambiente:
1. Vai su **Deployments**
2. Clicca sui 3 puntini dell'ultimo deployment
3. Seleziona **Redeploy**
4. Oppure fai un nuovo commit e push (trigger automatico)

### 4. Verifica Locale (Development)

Crea un file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_anon_key_qui
```

**⚠️ NON committare `.env.local` nel repository!**

## 🐛 DEBUG

### Controlla la Console del Browser

Apri la console (F12) e verifica:
- ❌ Se vedi "Supabase configuration missing!" → Variabili d'ambiente non configurate
- ❌ Se vedi "Supabase using placeholder values!" → Valori placeholder ancora presenti
- ✅ Se non vedi errori → Configurazione corretta

### Controlla Network Tab

1. Apri **Network** tab (F12)
2. Prova a fare signup
3. Cerca richieste a `supabase.co`
4. Verifica che l'header `apikey` sia presente nella richiesta

### Test Diretto

Apri la console del browser e esegui:

```javascript
// Verifica che Supabase sia configurato
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

## 📋 CHECKLIST

- [ ] Variabili d'ambiente configurate su Vercel
- [ ] Anon key corretta (non service_role)
- [ ] URL Supabase corretto
- [ ] Redeploy fatto dopo aver cambiato env vars
- [ ] `.env.local` configurato per sviluppo locale
- [ ] Console browser senza errori Supabase
- [ ] Network tab mostra header `apikey` nelle richieste

## 🔄 SE IL PROBLEMA PERSISTE

1. **Verifica che il progetto Supabase sia attivo**
   - Vai su Supabase Dashboard
   - Verifica che il progetto non sia in pausa

2. **Controlla i log di Supabase**
   - Vai su **Logs** → **API Logs**
   - Verifica se ci sono errori 400/401

3. **Verifica RLS Policies**
   - Vai su **Authentication** → **Policies**
   - Verifica che le policies siano attive

4. **Test con Supabase Client direttamente**
   ```javascript
   // In console browser
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(
     'https://yzfjtrteezvyoudpfccb.supabase.co',
     'your_anon_key_here'
   )
   supabase.auth.signUp({ email: 'test@test.com', password: 'test123' })
   ```

## 📞 SUPPORTO

Se il problema persiste dopo aver seguito tutti i passaggi:
1. Controlla i log di Vercel (Deployments → Function Logs)
2. Controlla i log di Supabase (Dashboard → Logs → API Logs)
3. Verifica che non ci siano rate limits attivi

