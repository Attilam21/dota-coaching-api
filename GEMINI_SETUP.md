# 🤖 Setup Gemini API per Riassunto IA

## Configurazione

### 1. Aggiungi la variabile d'ambiente

**Locale (.env.local):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Vercel (Production):**
1. Vai su [Vercel Dashboard](https://vercel.com/attilios-projects-a4228cc9/dota-2)
2. Settings → Environment Variables
3. Aggiungi:
   - Key: `GEMINI_API_KEY`
   - Value: `[la tua chiave API]`
4. Redeploy

## Funzionalità

### Riassunto Partita
- Endpoint: `/api/ai-summary/match/[id]`
- Genera riassunto intelligente di una singola partita
- Include: esito, performance, punti di forza/debolezze, suggerimenti

### Riassunto Profilo
- Endpoint: `/api/ai-summary/profile/[id]`
- Genera riassunto completo del profilo giocatore
- Include: ruolo, stile, trend, punti di forza/debolezze, raccomandazioni strategiche

## Limiti Gratuiti Gemini

- **60 richieste/minuto**
- **1.500 richieste/minuto** (burst)
- **1M token/giorno**
- **Completamente gratuito** per uso normale

## Note

La chiave API è già configurata. Se necessario, puoi generarne una nuova su:
https://aistudio.google.com/apikey

