# 📋 Variabili d'Ambiente - Riepilogo Completo

Questo documento elenca tutte le variabili d'ambiente necessarie per il progetto, suddivise per categoria e priorità.

---

## ✅ **VARIABILI OBBLIGATORIE** (Senza queste l'app non funziona)

### Supabase (Autenticazione e Database)
```env
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Dove vengono usate:**
- `lib/supabase.ts` - Client Supabase principale
- `lib/supabase-server.ts` - Client Supabase per Server Components
- `app/auth/callback/route.ts` - Callback OAuth
- `app/dashboard/settings/page.tsx` - Salvataggio Player ID
- Tutti i componenti che usano autenticazione

**Note:**
- Entrambe devono iniziare con `NEXT_PUBLIC_` per essere disponibili nel browser
- Il client Supabase include automaticamente l'header `apikey` (configurato in `lib/supabase.ts`)

---

## 🔧 **VARIABILI OPZIONALI** (Funzionalità avanzate)

### AI/ML (Gemini e OpenAI)
```env
GEMINI_API_KEY=<your-gemini-key>
OPENAI_API_KEY=<your-openai-key>
# Alternative naming supportati:
OPEN_AI_API_KEY=<your-openai-key>
OPEN_AI_KEY=<your-openai-key>
```

**Dove vengono usate:**
- `app/api/player/[id]/coaching/route.ts` - Coaching insights
- `app/api/player/[id]/meta-comparison/route.ts` - Meta comparison
- `app/api/player/[id]/win-conditions/route.ts` - Win conditions
- `app/api/insights/profile/route.ts` - Profile insights
- `app/api/ai-summary/profile/[id]/route.ts` - AI profile summary
- `app/api/ai-summary/match/[id]/route.ts` - AI match summary

**Note:**
- Se non presenti, le funzionalità AI vengono disabilitate
- Il codice gestisce gracefully l'assenza di queste chiavi

---

### Google AdSense (Monetizzazione)
```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=<your-adsense-client-id>
NEXT_PUBLIC_ADSENSE_SLOT_TOP=<your-slot-id>
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=<your-slot-id>
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=<your-slot-id>
NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT=<your-slot-id>
```

**Dove vengono usate:**
- `components/AdSense.tsx`
- `components/AdPlaceholder.tsx`
- `components/AdBanner.tsx`
- `lib/adsense-utils.ts`

**Note:**
- Se non presenti, gli annunci non vengono mostrati
- L'app funziona normalmente senza AdSense

---

### Vercel (Deploy e Protezione)
```env
VERCEL_URL=<auto-set-by-vercel>
VERCEL_PROTECTION_BYPASS_TOKEN=<your-bypass-token>
```

**Dove vengono usate:**
- `lib/fetch-utils.ts` - Bypass protezione Vercel per richieste interne

**Note:**
- `VERCEL_URL` è impostata automaticamente da Vercel
- `VERCEL_PROTECTION_BYPASS_TOKEN` è opzionale, usato solo per bypassare la protezione in sviluppo

---

## 🚫 **VARIABILI NON NECESSARIE PER L'APP** (Solo per script)

Queste variabili sono usate solo in script di utilità e **NON sono necessarie** per far funzionare l'applicazione:

```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Solo per script
SUPABASE_DB_PASSWORD=<db-password>            # Solo per script
```

**Dove vengono usate:**
- `scripts/verifica-trigger-api.js`
- `scripts/verifica-trigger.js`
- `scripts/execute-restore-with-token.js`
- `scripts/execute-restore.js`
- `scripts/execute-cleanup-direct.js`
- `scripts/execute-cleanup.js`

**Note:**
- Queste sono usate solo per operazioni amministrative via script
- L'applicazione web **NON** le usa

---

## 📝 **VARIABILI DI SISTEMA** (Gestite automaticamente)

```env
NODE_ENV=development|production  # Impostata automaticamente da Next.js
```

**Dove viene usata:**
- Controlli di debug/logging in tutto il codice
- Comportamento condizionale (es. errori dettagliati solo in development)

---

## ✅ **CHECKLIST CONFIGURAZIONE**

### Per sviluppo locale (`.env.local`):
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `GEMINI_API_KEY` (opzionale)
- [ ] `OPENAI_API_KEY` (opzionale)
- [ ] `NEXT_PUBLIC_ADSENSE_*` (opzionale)

### Per produzione (Vercel Environment Variables):
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `GEMINI_API_KEY` (opzionale)
- [ ] `OPENAI_API_KEY` (opzionale)
- [ ] `NEXT_PUBLIC_ADSENSE_*` (opzionale)
- [ ] `VERCEL_PROTECTION_BYPASS_TOKEN` (opzionale)

---

## 🔍 **VERIFICA CONFIGURAZIONE**

Per verificare che le variabili siano configurate correttamente:

1. **Controlla i log del browser** (Console DevTools):
   - Se mancano variabili Supabase, vedrai errori in `lib/supabase.ts`
   
2. **Controlla i log del server** (Terminal):
   - Errori di autenticazione indicano problemi con `NEXT_PUBLIC_SUPABASE_*`

3. **Test funzionalità:**
   - Login/Registrazione → Verifica `NEXT_PUBLIC_SUPABASE_*`
   - Salvataggio Player ID → Verifica `NEXT_PUBLIC_SUPABASE_*`
   - AI Features → Verifica `GEMINI_API_KEY` o `OPENAI_API_KEY`

---

## 🛠️ **RISOLUZIONE PROBLEMI**

### Errore: "No API key found in request"
**Causa:** Header `apikey` mancante nelle richieste Supabase
**Soluzione:** ✅ **RISOLTO** - Il client in `lib/supabase.ts` include automaticamente l'header `apikey`

### Errore: "Non autenticato" quando salvi Player ID
**Causa:** Sessione Supabase non valida o scaduta
**Soluzione:** 
- Verifica che l'utente sia loggato
- Controlla che `NEXT_PUBLIC_SUPABASE_*` siano configurate correttamente
- Il client Supabase gestisce automaticamente il refresh del token

### Funzionalità AI non disponibili
**Causa:** Chiavi API mancanti
**Soluzione:** Aggiungi `GEMINI_API_KEY` o `OPENAI_API_KEY` (almeno una)

---

## 📚 **RIFERIMENTI**

- **Supabase Docs:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

**Ultimo aggiornamento:** Dopo fix "No API key found in request"
**Stato:** ✅ Tutte le variabili necessarie sono documentate e il codice è coerente

