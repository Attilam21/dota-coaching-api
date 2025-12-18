# 📚 OpenDota Knowledge Base

## Scopo

Questa knowledge base contiene informazioni di riferimento su:
- Endpoint OpenDota API utilizzati nel progetto
- Struttura payload JSON (match, player, heroes)
- Gestione errori e rate limits
- Best practices per chiamate e caching

**Questa KB è la fonte di verità primaria per tutto il codice che interagisce con OpenDota.**

## Come Usarla

### Per me (sviluppatore)

Quando devi lavorare su codice OpenDota, dì a Cursor:

> "Prima consulta `/_kb/opendota/` e poi [descrivi il task]"

Oppure:

> "Usa la KB OpenDota per [fare X]"

### Per Cursor (AI)

**Prima di rispondere a qualsiasi task relativo a OpenDota:**
1. Consulta `/_kb/opendota/` (specialmente `calculations.md` per calcoli)
2. Cita il file da cui stai prendendo le info
3. Proponi la soluzione basata sulla KB

**Per calcoli e analisi:**
- Consulta sempre `calculations.md` per formule corrette
- Usa i pattern documentati per evitare errori comuni
- Verifica best practices prima di implementare nuovi calcoli

## Struttura KB

- `quick-reference.md` - **Guida rapida** (formule essenziali, pattern critici) ⚡
- `endpoints.md` - Lista endpoint, parametri, esempi URL
- `payloads.md` - Campi JSON importanti, mapping, naming
- `calculations.md` - **Formule complete, pattern di calcolo, best practices** ⭐
- `errors-and-limits.md` - Gestione errori, rate limits, caching
- `examples/` - JSON di esempio (match, player, heroes)

## Note Importanti

### Rate Limits
- OpenDota non ha rate limit ufficiale documentato
- **Best practice**: Cache le risposte (1 ora per match, 24 ore per heroes)
- Evita chiamate duplicate nella stessa richiesta

### Base URL
```
https://api.opendota.com/api
```

### Formato Risposte
- Tutti gli endpoint ritornano JSON
- Alcuni campi possono essere `null` o `undefined`
- Alcuni endpoint possono ritornare array vuoti `[]`

### Caching (Next.js)
Usa `next: { revalidate: SECONDS }` nelle fetch:
```typescript
fetch(url, { next: { revalidate: 3600 } }) // Cache 1 ora
```

### Error Handling
- 404 = Match/Player non trovato (gestisci gracefully)
- 429 = Rate limit (retry con backoff)
- 5xx = Server error (retry con backoff)

Vedi `errors-and-limits.md` per dettagli.

## Pattern Usato nel Progetto

1. **OpenDota = Source of Truth**
   - Tutti i dati match/player vengono da OpenDota
   - Non salviamo dati match completi in Supabase
   - Supabase solo per analisi custom salvate dall'utente

2. **API Routes come Proxy**
   - Frontend chiama `/api/opendota/*` (nostre route)
   - Le route chiamano OpenDota e aggiungono cache
   - Fallback diretto a OpenDota se route fallisce

3. **Naming Convention**
   - `match_id` (number) - ID match
   - `account_id` / `player_id` (number) - ID giocatore
   - `hero_id` (number) - ID eroe
   - `player_slot` (0-9) - Slot giocatore (0-4 Radiant, 5-9 Dire)

---

**Ultimo aggiornamento**: Gennaio 2025

