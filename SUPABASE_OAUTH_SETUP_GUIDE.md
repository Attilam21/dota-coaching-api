# 🔧 GUIDA SETUP OAuth su Supabase Dashboard

## 📍 Dove Andare

1. Vai su [Supabase Dashboard](https://app.supabase.com/)
2. Seleziona il tuo progetto
3. Nel menu laterale sinistro: **Authentication** → **Providers**

---

## 🔐 CONFIGURAZIONE GOOGLE

### Step 1: Google Cloud Console (Prima di Supabase)

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Vai a **APIs & Services** → **Credentials**
4. Clicca **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Se è la prima volta, configura OAuth consent screen:
   - Scegli **External** (per utenti generali)
   - Compila informazioni base (nome app, email supporto)
   - Aggiungi il tuo dominio alle autorizzazioni
6. Crea OAuth Client ID:
   - **Application type**: Web application
   - **Name**: "Dota Coaching API" (o quello che preferisci)
   - **Authorized redirect URIs**: 
     ```
     https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
     ```
     *(Sostituisci <TUO-PROGETTO-ID> con il tuo progetto Supabase - lo trovi nell'URL del dashboard)*
7. Clicca **Create**
8. **COPIA** il **Client ID** e **Client Secret** (serviranno dopo)

### Step 2: Supabase Dashboard

1. Vai in **Authentication** → **Providers**
2. Trova **Google** nella lista
3. Clicca per espandere/aprire le opzioni
4. **Enable Google provider** (toggle ON)
5. Incolla:
   - **Client ID (for OAuth)**: Il Client ID da Google Cloud
   - **Client secret (for OAuth)**: Il Client Secret da Google Cloud
6. Clicca **Save**

✅ **Fatto!** Google è configurato.

---

## 🎮 CONFIGURAZIONE DISCORD

### Step 1: Discord Developer Portal

1. Vai su [Discord Developer Portal](https://discord.com/developers/applications)
2. Clicca **New Application**
3. Nome: "Dota Coaching API" (o quello che preferisci)
4. Clicca **Create**
5. Vai in **OAuth2** nel menu laterale
6. In **Redirects**, aggiungi:
   ```
   https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
   ```
   *(Sostituisci <TUO-PROGETTO-ID> con il tuo progetto Supabase)*
7. Clicca **Add**
8. **COPIA** il **Client ID** e **Client Secret**

### Step 2: Supabase Dashboard

1. Vai in **Authentication** → **Providers**
2. Trova **Discord** nella lista
3. Clicca per espandere/aprire le opzioni
4. **Enable Discord provider** (toggle ON)
5. Incolla:
   - **Client ID (for OAuth)**: Il Client ID da Discord
   - **Client secret (for OAuth)**: Il Client Secret da Discord
6. Clicca **Save**

✅ **Fatto!** Discord è configurato.

---

## 🐙 CONFIGURAZIONE GITHUB (Opzionale)

### Step 1: GitHub Settings

1. Vai su [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Clicca **OAuth Apps** → **New OAuth App**
3. Compila:
   - **Application name**: "Dota Coaching API"
   - **Homepage URL**: `https://tuodominio.com` (o localhost per dev)
   - **Authorization callback URL**: 
     ```
     https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
     ```
4. Clicca **Register application**
5. **COPIA** il **Client ID**
6. Genera **Client Secret** (clicca "Generate a new client secret") e **COPIALO**

### Step 2: Supabase Dashboard

1. Vai in **Authentication** → **Providers**
2. Trova **GitHub** nella lista
3. Clicca per espandere/aprire le opzioni
4. **Enable GitHub provider** (toggle ON)
5. Incolla:
   - **Client ID (for OAuth)**: Il Client ID da GitHub
   - **Client secret (for OAuth)**: Il Client Secret da GitHub
6. Clicca **Save**

✅ **Fatto!** GitHub è configurato.

---

## 🎬 CONFIGURAZIONE TWITCH (Opzionale)

### Step 1: Twitch Developer Console

1. Vai su [Twitch Developer Console](https://dev.twitch.com/console/apps)
2. Clicca **Register Your Application**
3. Compila:
   - **Name**: "Dota Coaching API"
   - **OAuth Redirect URLs**: 
     ```
     https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
     ```
   - **Category**: Website Integration
4. Clicca **Create**
5. **COPIA** il **Client ID**
6. Genera **Client Secret** (clicca "New Secret") e **COPIALO**

### Step 2: Supabase Dashboard

1. Vai in **Authentication** → **Providers**
2. Trova **Twitch** nella lista
3. Clicca per espandere/aprire le opzioni
4. **Enable Twitch provider** (toggle ON)
5. Incolla:
   - **Client ID (for OAuth)**: Il Client ID da Twitch
   - **Client secret (for OAuth)**: Il Client Secret da Twitch
6. Clicca **Save**

✅ **Fatto!** Twitch è configurato.

---

## ⚠️ IMPORTANTE: Trovare il Tuo Progetto ID Supabase

Il Redirect URI deve essere:
```
https://<TUO-PROGETTO-ID>.supabase.co/auth/v1/callback
```

**Come trovare il tuo Progetto ID:**
1. Vai su Supabase Dashboard
2. Guarda l'URL nella barra degli indirizzi: `https://app.supabase.com/project/<QUESTO-È-IL-TUO-ID>`
3. Oppure vai in **Settings** → **API** → Vedi **Project URL** (senza `https://` e senza `/auth/v1/callback`)

Esempio: Se il tuo Project URL è `https://abcdefghijklmnop.supabase.co`, allora:
- Redirect URI: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

---

## ✅ CHECKLIST RAPIDA

- [ ] Google Cloud Console: App creata, Redirect URI aggiunto, Client ID/Secret copiati
- [ ] Supabase: Google provider abilitato, credenziali inserite
- [ ] Discord Developer Portal: App creata, Redirect URI aggiunto, Client ID/Secret copiati
- [ ] Supabase: Discord provider abilitato, credenziali inserite
- [ ] (Opzionale) GitHub/Twitch configurati

---

## 🚀 Dopo la Configurazione

Una volta configurati i provider su Supabase, il codice frontend sarà pronto per usarli. Non serve configurazione extra nel codice - Supabase gestisce tutto automaticamente!

