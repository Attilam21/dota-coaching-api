# 🔑 SPIEGAZIONE CREDENZIALI GOOGLE OAuth

## ❌ COSA NON SERVE
- **NON serve un account Google "dedicato"** - Puoi usare il tuo account Google personale
- **NON serve una Gmail business** - Qualsiasi account Google va bene

## ✅ COSA SERVE VERAMENTE

Le credenziali che vedi in Supabase (il campo "Client IDs" con l'email) **NON sono corrette**.

Devi creare **nuove credenziali OAuth** da Google Cloud Console.

---

## 🎯 COME OTTENERE LE CREDENZIALI GIUSTE

### Step 1: Vai su Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. **Usa il tuo account Google personale** (quello che vuoi, anche f02hmktg@gmail.com va bene!)
3. Accedi con quell'account

### Step 2: Crea un Progetto (o usa uno esistente)

1. In alto a sinistra, clicca sul selettore progetti
2. Clicca **"New Project"**
3. Nome: "Dota Coaching API" (o quello che preferisci)
4. Clicca **Create**

### Step 3: Crea OAuth Credentials

1. Nel menu laterale: **APIs & Services** → **Credentials**
2. Se è la prima volta, ti chiede di configurare **OAuth consent screen**:
   - **User Type**: Scegli **External** (per utenti generali)
   - Clicca **Create**
   - Compila:
     - **App name**: "Dota Coaching API"
     - **User support email**: La tua email (f02hmktg@gmail.com va bene)
     - **Developer contact**: La tua email
   - Clicca **Save and Continue**
   - Nelle schermate successive, continua (non serve aggiungere scopes per ora)
   - Clicca **Back to Dashboard**

3. Ora crea le credenziali OAuth:
   - Clicca **+ CREATE CREDENTIALS** → **OAuth client ID**
   - **Application type**: Seleziona **Web application**
   - **Name**: "Dota Coaching API Web Client"
   - **Authorized redirect URIs**: Aggiungi:
     ```
     https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
     ```
     *(Sostituisci <TUO-PROGETTO-ID> con l'ID del tuo progetto Supabase)*
   - Clicca **Create**

4. **IMPORTANTE**: Ti apparirà una finestra con:
   - **Your Client ID**: Un codice lungo tipo `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Your Client Secret**: Un codice tipo `GOCSPX-xxxxxxxxxxxxx`

   **COPIA ENTRAMBI** - ti serviranno!

---

## ✅ COSA INSERIRE IN SUPABASE

Torna su Supabase Dashboard → Authentication → Providers → Google

### Campo "Client IDs"
**NON inserire l'email!** 

Inserisci il **Client ID** che hai copiato da Google Cloud Console:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```
(Senza spazi, tutto attaccato)

### Campo "Client Secret (for OAuth)"
Inserisci il **Client Secret** che hai copiato da Google Cloud Console:
```
GOCSPX-xxxxxxxxxxxxx
```

### Toggle "Enable Sign in with Google"
Attivalo (ON)

### Salva
Clicca **Save**

---

## 🔍 RIEPILOGO

1. **Account Google**: Usa qualsiasi account Google (anche personale) ✅
2. **Google Cloud Console**: Crea un progetto e OAuth credentials ✅
3. **Supabase**: Inserisci Client ID e Client Secret (NON l'email!) ✅

L'email che vedi in Supabase probabilmente è un placeholder o un valore errato. 
**Devi sostituirla** con il Client ID che ottieni da Google Cloud Console.

---

## ❓ DOMANDE FREQUENTI

**Q: Devo pagare per Google Cloud Console?**  
A: No, c'è un free tier generoso. Non paghi nulla per OAuth.

**Q: Posso usare il mio account Google personale?**  
A: Sì, assolutamente! Non serve un account dedicato.

**Q: L'email che vedo in Supabase è corretta?**  
A: No, quello è il campo sbagliato. Devi creare nuove credenziali OAuth da Google Cloud Console e inserire il Client ID (non l'email) in quel campo.

**Q: Dove trovo il mio Project ID di Supabase?**  
A: Vai su Supabase Dashboard → Settings → API → Vedi "Project URL" (es: `https://abcdefghijklmnop.supabase.co`) → L'ID è `abcdefghijklmnop`

