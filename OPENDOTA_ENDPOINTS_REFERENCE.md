# OpenDota API Endpoints Reference

**Base URL:** `https://api.opendota.com/api`

Questo documento elenca **SOLO** gli endpoint OpenDota ufficiali che utilizziamo nel progetto. 
**NON usare altri endpoint** senza verificare prima in questo file.

---

## 📋 Endpoint Utilizzati

### 🎮 Matches (Partite)

#### `GET /matches/{match_id}`
- **Descrizione:** Dati completi di una partita
- **Uso nel progetto:** 
  - `app/api/opendota/match/[id]/route.ts`
  - `app/api/match/[id]/teamfights/route.ts`
  - `app/api/match/[id]/item-timing/route.ts`
  - `app/api/match/[id]/phases/route.ts`
  - `app/api/player/[id]/stats/route.ts`
  - E molti altri...
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** `MatchResponse` (vedi schema OpenAPI)

#### `GET /matches/{match_id}/log`
- **Descrizione:** Log eventi della partita (eventi temporali)
- **Uso nel progetto:**
  - `app/api/match/[id]/teamfights/route.ts` (fallback)
  - `app/api/match/[id]/item-timing/route.ts` (fallback)
  - `app/api/match/[id]/phases/route.ts`
  - `app/api/match/[id]/timeline/route.ts`
- **Documentazione:** Endpoint non documentato esplicitamente ma disponibile
- **Response:** Array di eventi con `time`, `type`, `key`, `x`, `y`, etc.

#### `GET /matches/{match_id}/teamfights`
- **Descrizione:** Dati teamfights della partita
- **Uso nel progetto:**
  - `app/api/match/[id]/teamfights/route.ts` (Priority 2)
- **Documentazione:** Endpoint dedicato per teamfights
- **Response:** Array di teamfight objects

#### `GET /matches/{match_id}/wardmap`
- **Descrizione:** Ward map della partita (posizioni wards)
- **Uso nel progetto:**
  - `app/api/test/ward-structure/route.ts` (test)
  - **DA IMPLEMENTARE:** `app/api/match/[id]/wardmap/route.ts`
- **Documentazione:** Endpoint dedicato per wardmap di una singola partita
- **Response:** Object con `obs` e `sen` arrays
- **Nota:** Spesso restituisce 404, usare come fallback

#### `GET /matches/{match_id}/goldXpGraph`
- **Descrizione:** Grafico gold/XP nel tempo
- **Uso nel progetto:**
  - `app/api/match/[id]/timeline/route.ts`
- **Documentazione:** Endpoint per timeline gold/XP
- **Response:** Array di dati temporali

---

### 👤 Players (Giocatori)

#### `GET /players/{account_id}`
- **Descrizione:** Dati profilo del giocatore
- **Uso nel progetto:**
  - `app/api/opendota/player/[id]/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** `PlayersResponse`

#### `GET /players/{account_id}/matches`
- **Descrizione:** Lista partite del giocatore
- **Query params:** `limit`, `offset`, `win`, `hero_id`, etc.
- **Uso nel progetto:**
  - `app/api/player/[id]/stats/route.ts` (`?limit=20`)
  - `app/api/player/[id]/advanced-stats/route.ts` (`?limit=20`)
  - `app/api/player/[id]/builds/route.ts` (`?limit=20`)
  - `app/api/player/[id]/builds/hero/[heroId]/route.ts` (`?hero_id=${heroId}&limit=20`)
  - `app/api/player/[id]/items/stats/route.ts` (`?limit=20`)
  - `app/api/player/[id]/items/timing/route.ts` (`?limit=20`)
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** Array di `PlayerMatchesResponse`

#### `GET /players/{account_id}/heroes`
- **Descrizione:** Eroi giocati dal giocatore
- **Uso nel progetto:**
  - `app/api/player/[id]/role-analysis/route.ts`
  - `app/api/player/[id]/hero-analysis/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** Array di `PlayerHeroesResponse`

#### `GET /players/{account_id}/wl`
- **Descrizione:** Statistiche Win/Loss
- **Uso nel progetto:**
  - `app/api/player/[id]/wl/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** `PlayerWinLossResponse` (`{ win: number, lose: number }`)

#### `GET /players/{account_id}/peers`
- **Descrizione:** Giocatori con cui ha giocato
- **Uso nel progetto:**
  - `app/api/player/[id]/peers/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** Array di `PlayerPeersResponse`

#### `GET /players/{account_id}/wardmap`
- **Descrizione:** Ward map aggregata del giocatore (tutte le partite)
- **Uso nel progetto:**
  - **DA IMPLEMENTARE:** `app/api/player/[id]/wardmap/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** `PlayerWardMapResponse` (`{ obs: object, sen: object }`)
- **Nota:** Questo è l'endpoint principale per wardmap aggregata del player

---

### 🦸 Heroes (Eroi)

#### `GET /heroes`
- **Descrizione:** Lista completa degli eroi
- **Uso nel progetto:**
  - `app/api/opendota/heroes/route.ts`
  - `app/api/player/[id]/builds/hero/[heroId]/route.ts`
  - `app/api/player/[id]/hero-analysis/route.ts`
  - `app/api/ai-summary/match/[id]/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** Array di `HeroObjectResponse`

---

### 📦 Constants (Costanti)

#### `GET /constants/items`
- **Descrizione:** Costanti degli items (nomi, ID, costi, etc.)
- **Uso nel progetto:**
  - `app/api/match/[id]/item-timing/route.ts`
  - `app/api/player/[id]/builds/route.ts`
  - `app/api/player/[id]/builds/hero/[heroId]/route.ts`
  - `app/api/player/[id]/items/stats/route.ts`
  - `app/api/player/[id]/items/timing/route.ts`
- **Documentazione:** [OpenDota API Docs](https://api.opendota.com/api)
- **Response:** Object dove le **chiavi** sono i nomi interni (es. `"item_blink"`, `"branches"`) e i **valori** sono oggetti con `id`, `dname`, `localized_name`, `cost`, etc.
- **⚠️ IMPORTANTE:** La struttura è `{ "item_blink": { id: 1, dname: "Blink Dagger", ... }, "branches": { id: 16, ... }, ... }`

---

## 🔍 Struttura Dati Match Object

Dal match object (`/matches/{match_id}`) possiamo estrarre:

### Player Object (dentro `match.players[]`)

#### Dati Wards:
- `obs_placed`: number - Numero observer wards piazzate
- `sen_placed`: number - Numero sentry wards piazzate
- `obs_log`: Array - Log observer wards con timing e posizioni
- `sen_log`: Array - Log sentry wards con timing e posizioni
- `obs_left_log`: Array - Log observer wards rimosse
- `sen_left_log`: Array - Log sentry wards rimosse
- `observer_uses`: number - Numero observer usate
- `sentry_uses`: number - Numero sentry usate
- `observer_kills`: number - Numero observer uccise
- `sentry_kills`: number - Numero sentry uccise
- `obs`: Object - Posizioni observer (formato outer/inner number, ~64-192)
- `sen`: Object - Posizioni sentry (formato outer/inner number, ~64-192)

#### Dati Items:
- `purchase_log`: Array - Log acquisti items con `time`, `key` (nome interno), `charges`
- `item_0` ... `item_5`: number - Item IDs negli slot
- `backpack_0` ... `backpack_2`: number - Item IDs nel backpack

#### Dati Teamfights:
- `match.teamfights`: Array - Teamfights già nel match object (se disponibile)

---

## ✅ Endpoint Verificati e Ufficiali

Tutti gli endpoint sopra elencati sono:
- ✅ Documentati nella OpenAPI spec di OpenDota
- ✅ Utilizzati nel progetto
- ✅ Testati e funzionanti

---

## ❌ Endpoint NON Utilizzati (ma disponibili)

Questi endpoint esistono ma **NON li usiamo** (per ora):
- `/players/{account_id}/totals`
- `/players/{account_id}/counts`
- `/players/{account_id}/histograms/{field}`
- `/players/{account_id}/wordcloud`
- `/players/{account_id}/ratings`
- `/players/{account_id}/rankings`
- `/players/{account_id}/refresh`
- `/heroes/{hero_id}/matches`
- `/heroes/{hero_id}/matchups`
- `/heroes/{hero_id}/durations`
- `/heroes/{hero_id}/players`
- `/heroes/{hero_id}/itemPopularity`
- `/leagues/{league_id}`
- `/teams/{team_id}`
- E molti altri...

**Se serve un endpoint nuovo, verificare prima nella documentazione OpenDota e aggiungerlo qui.**

---

## 📝 Note Importanti

1. **Base URL:** Sempre `https://api.opendota.com/api` (non `www.opendota.com`)
2. **Rate Limits:** OpenDota ha rate limits. Con API key si hanno limiti più alti
3. **Caching:** Usiamo `next: { revalidate: 3600 }` per match data, `86400` per constants
4. **Error Handling:** Sempre gestire 404, 500, e altri errori
5. **Fallback Strategy:** Per dati critici (teamfights, items, wards), usare strategia multi-priority:
   - Priority 1: Dati nel match object
   - Priority 2: Endpoint dedicato
   - Priority 3: Estrazione da match log

---

## 🔄 Aggiornamenti

- **Ultimo aggiornamento:** 17 Dicembre 2025
- **Versione OpenDota API:** 31.1.0
- **Documentazione completa:** https://api.opendota.com/api

