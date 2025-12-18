# ⚠️ OpenDota Errors & Limits

## Rate Limits

### Ufficiale
**OpenDota non ha rate limit ufficiale documentato**, ma:

- **Best Practice**: Non fare più di 1-2 chiamate al secondo
- **Raccomandato**: Cache tutte le risposte
- **Pattern**: Usa Next.js ISR caching (`next: { revalidate }`)

### Caching Consigliato

```typescript
// Match data (cambia raramente)
fetch(url, { next: { revalidate: 3600 } }) // 1 ora

// Heroes list (non cambia mai)
fetch(url, { next: { revalidate: 86400 } }) // 24 ore

// Player stats (cambia spesso)
fetch(url, { next: { revalidate: 1800 } }) // 30 minuti
```

---

## Status Codes

### 200 OK
✅ Risposta valida, procedi normalmente.

### 404 Not Found
**Causa**: Match/Player non esiste o non è pubblico

**Gestione**:
```typescript
if (response.status === 404) {
  return NextResponse.json(
    { error: 'Match not found' },
    { status: 404 }
  )
}
```

**Best Practice**: Gestisci gracefully, mostra messaggio utente, non crashare.

### 429 Too Many Requests
**Causa**: Rate limit raggiunto (raro, ma possibile)

**Gestione**:
```typescript
if (response.status === 429) {
  // Retry con exponential backoff
  await new Promise(resolve => setTimeout(resolve, 2000)) // 2 secondi
  // Retry la chiamata (max 3 tentativi)
}
```

**Pattern Retry**:
```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { next: { revalidate: 3600 } })
      
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 5xx Server Error
**Causa**: OpenDota server down o temporaneamente indisponibile

**Gestione**:
```typescript
if (response.status >= 500) {
  // Retry con backoff
  // Se fallisce dopo 3 tentativi, mostra errore generico
  return NextResponse.json(
    { error: 'OpenDota service temporarily unavailable' },
    { status: 503 }
  )
}
```

---

## Error Handling Pattern nel Progetto

### Pattern Attuale (API Routes)

```typescript
export async function GET(request: NextRequest, { params }) {
  try {
    const { id } = await params
    
    const response = await fetch(`https://api.opendota.com/api/...`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      // Gestisci 404, 429, 5xx
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Not found' },
          { status: 404 }
        )
      }
      
      // Per altri errori, ritorna status originale
      return NextResponse.json(
        { error: 'Failed to fetch' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Pattern Frontend (Client-side)

```typescript
try {
  const response = await fetch(`/api/player/${playerId}/stats`)
  
  if (!response.ok) {
    if (response.status === 404) {
      setError('Player not found')
    } else {
      setError('Failed to load data')
    }
    return
  }
  
  const data = await response.json()
  setStats(data.stats)
} catch (err) {
  setError('Network error')
}
```

---

## Best Practices

### 1. Sempre Cache
✅ **Fai**: Usa `next: { revalidate }` in tutte le fetch
❌ **Non fare**: Fetch senza cache (eccetto dati real-time)

### 2. Gestisci Optional Fields
✅ **Fai**: Usa optional chaining `?.` e fallback
```typescript
const gpm = player.gold_per_min || 0
const heroName = heroesMap[hero_id]?.localized_name || `Hero ${hero_id}`
```

❌ **Non fare**: Accedere direttamente a campi opzionali
```typescript
const gpm = player.gold_per_min // ❌ Potrebbe essere undefined
```

### 3. Validazione Dati
✅ **Fai**: Valida che i dati esistano prima di usarli
```typescript
if (!match || !match.players || match.players.length !== 10) {
  throw new Error('Invalid match data')
}
```

### 4. Fallback a OpenDota Diretto
✅ **Fai**: Se API route fallisce, fallback diretto
```typescript
let response = await fetch(`/api/opendota/match/${matchId}`)
if (!response.ok) {
  response = await fetch(`https://api.opendota.com/api/matches/${matchId}`)
}
```

### 5. Non Fare Chiamate Duplicate
✅ **Fai**: Cache heroes list in memoria o context
❌ **Non fare**: Fetch heroes list in ogni componente

---

## Timeout

**Raccomandato**: 10 secondi timeout per chiamate OpenDota

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)

try {
  const response = await fetch(url, {
    signal: controller.signal,
    next: { revalidate: 3600 }
  })
  clearTimeout(timeoutId)
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    // Timeout
  }
}
```

---

## Monitoring

**Consigliato**: Log errori per debugging

```typescript
if (!response.ok) {
  console.error('OpenDota API error:', {
    url,
    status: response.status,
    statusText: response.statusText
  })
}
```

---

**Nota**: OpenDota è un servizio gratuito e community-driven. Sii rispettoso con le chiamate.

