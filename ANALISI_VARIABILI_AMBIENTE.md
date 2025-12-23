# 🔍 Analisi Variabili d'Ambiente Vercel

## ❓ FAQ: SUPABASE_SERVICE_ROLE_KEY era il problema?

**NO**, `SUPABASE_SERVICE_ROLE_KEY` NON era il problema perché:

1. **Non viene mai usata nel codice di produzione**
   - Cercata in `app/`: ❌ Nessun risultato
   - Cercata in `lib/`: ❌ Nessun risultato
   - Usata SOLO in `scripts/*.js` (script locali di sviluppo)

2. **Tutte le operazioni usano `NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - `lib/supabase.ts` → usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `lib/supabase-server-action.ts` → usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `app/actions/update-player-id.ts` → usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Il problema reale era:**
   - La sessione JWT non veniva passata correttamente nelle Server Actions
   - `auth.uid()` nelle RLS policies non funzionava perché la sessione non era impostata
   - Risolto con `createServerActionSupabaseClient()` che usa `setSession()`

4. **Service Role Key bypassa RLS, ma:**
   - Non è mai stata usata nel codice
   - Non sarebbe stata una soluzione corretta (bypassa sicurezza)
   - Le RLS policies sono la soluzione corretta per sicurezza

**Conclusione:** Il problema era la gestione della sessione, non la mancanza di service role key.

---

# 🔍 Analisi Variabili d'Ambiente Vercel

## Variabili Attualmente Configurate

1. ✅ `NEXT_PUBLIC_SUPABASE_URL` - **CORRETTA** - Usata in tutto il codice
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **CORRETTA** - Usata in tutto il codice
3. ⚠️ `OPEN_AI_KEY` - **INCONSISTENTE** - Il codice cerca `OPENAI_API_KEY` o `OPEN_AI_API_KEY` o `OPEN_AI_KEY` (funziona ma non standard)
4. ✅ `GEMINI_API_KEY` - **CORRETTA** - Usata correttamente
5. ❌ `SUPABASE_SERVICE_ROLE_KEY` - **NON NECESSARIA** - Usata solo in scripts locali, non nel codice di produzione
6. ❌ `NEXT_PUBLIC_APP_URL` - **NON USATA** - Non referenziata da nessuna parte nel codice

## Problemi Trovati

### 1. ❌ `SUPABASE_SERVICE_ROLE_KEY` - NON SERVE IN VERCEL
**Problema:** Questa variabile è usata solo in scripts locali (`scripts/*.js`), non nel codice di produzione.

**Dove viene usata:**
- `scripts/execute-restore.js`
- `scripts/execute-restore-with-token.js`
- `scripts/execute-cleanup.js`
- `scripts/verifica-trigger-api.js`

**Soluzione:** Rimuovere da Vercel (è solo per sviluppo locale).

### 2. ⚠️ `OPEN_AI_KEY` - NOME INCONSISTENTE
**Problema:** Il codice cerca in questo ordine:
```typescript
process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.OPEN_AI_KEY
```

**Dove viene usata:**
- `app/api/ai-summary/profile/[id]/route.ts`
- `app/api/ai-summary/match/[id]/route.ts`
- `app/api/insights/profile/route.ts`
- `app/api/player/[id]/coaching/route.ts`
- `app/api/player/[id]/meta-comparison/route.ts`
- `app/api/player/[id]/win-conditions/route.ts`

**Soluzione:** Standardizzare su `OPENAI_API_KEY` (nome più comune) o `OPEN_AI_API_KEY` (più coerente con `OPEN_AI_KEY` attuale).

### 3. ❌ `NEXT_PUBLIC_APP_URL` - NON USATA
**Problema:** Questa variabile non è referenziata da nessuna parte nel codice.

**Soluzione:** Rimuovere da Vercel se non serve per il futuro.

## Raccomandazioni

### Variabili da RIMUOVERE:
1. `SUPABASE_SERVICE_ROLE_KEY` - Solo per scripts locali
2. `NEXT_PUBLIC_APP_URL` - Non usata

### Variabili da RINOMINARE:
1. `OPEN_AI_KEY` → `OPENAI_API_KEY` (standard più comune) o `OPEN_AI_API_KEY` (più coerente)

### Variabili CORRETTE (mantenere):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `GEMINI_API_KEY`

## Configurazione Finale Consigliata

```env
# Supabase (richieste)
NEXT_PUBLIC_SUPABASE_URL=https://yzfjtrteezvyoudpfccb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# AI APIs (almeno una richiesta)
OPENAI_API_KEY=sk-proj-...  # RINOMINARE da OPEN_AI_KEY
GEMINI_API_KEY=AIzaSy...    # Opzionale (fallback a OpenAI)
```

## Note

- Il codice ha fallback per `OPEN_AI_KEY`, quindi funziona anche con il nome attuale
- `SUPABASE_SERVICE_ROLE_KEY` non è mai usata nel codice di produzione Next.js
- `NEXT_PUBLIC_APP_URL` potrebbe essere utile in futuro per redirects, ma attualmente non serve

