/**
 * OpenDota API Wrapper
 * 
 * Centralizza tutte le chiamate a OpenDota con:
 * - API key automatica (solo server-side)
 * - Rate limiting e retry
 * - Concurrency control
 * - Timeout handling
 */

const OPENDOTA_API_KEY = process.env.OPENDOTA_API_KEY
const OPENDOTA_BASE_URL = 'https://api.opendota.com/api'

// Cache in-memory semplice (best-effort)
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Costruisce URL OpenDota con API key
 * @param pathOrUrl - Path relativo (es: "/players/123") o URL completo
 * @returns URL completo con API key
 */
export function buildOpenDotaUrl(pathOrUrl: string): string {
  // Se è già un URL completo, usalo direttamente
  let url: string
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    url = pathOrUrl
  } else {
    // Path relativo, costruisci URL completo
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
    url = `${OPENDOTA_BASE_URL}${cleanPath}`
  }

  // Aggiungi API key se disponibile e non già presente
  if (OPENDOTA_API_KEY && !url.includes('api_key=')) {
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}api_key=${OPENDOTA_API_KEY}`
  }

  return url
}

/**
 * Fetch OpenDota con retry automatico su 429
 * @param pathOrUrl - Path o URL OpenDota
 * @param init - Opzioni fetch standard
 * @returns Promise con i dati
 */
export async function fetchOpenDota<T>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const url = buildOpenDotaUrl(pathOrUrl)
  const maxRetries = 3
  const backoffDelays = [1000, 2000, 4000] // ms

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Timeout con AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })

      clearTimeout(timeoutId)

      // Se 429, retry con backoff
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const delay = backoffDelays[attempt]
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        } else {
          throw new Error('OpenDota rate limited: too many retries')
        }
      }

      if (!response.ok) {
        throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`)
      }

      return await response.json() as T
    } catch (error) {
      // Se è l'ultimo tentativo o non è un 429, rilancia
      if (attempt === maxRetries || (error instanceof Error && !error.message.includes('rate limited'))) {
        throw error
      }
      // Altrimenti continua il retry
    }
  }

  throw new Error('OpenDota fetch failed after retries')
}

/**
 * Esegue chiamate con concorrenza limitata
 * @param items - Array di items da processare
 * @param maxConcurrency - Numero massimo di chiamate parallele (default: 6)
 * @param fn - Funzione async da eseguire per ogni item
 * @returns Array di risultati (null per errori)
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  maxConcurrency = 6
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null)
  const executing: Array<{ promise: Promise<void>; index: number }> = []

  for (let i = 0; i < items.length; i++) {
    // Se abbiamo raggiunto il limite, aspetta che uno completi PRIMA di aggiungere
    if (executing.length >= maxConcurrency) {
      // Crea promise che risolvono con l'index quando completano
      const racePromises = executing.map((e, idx) => 
        e.promise.then(() => idx).catch(() => idx)
      )
      
      // Aspetta che QUALSIASI promise completi e ottieni il suo index nell'array
      const completedArrayIndex = await Promise.race(racePromises)
      
      // Rimuovi il promise che ha completato dall'array
      executing.splice(completedArrayIndex, 1)
    }

    // Crea e aggiungi il nuovo promise (dopo aver rimosso uno se necessario)
    const promise = (async () => {
      try {
        results[i] = await fn(items[i], i)
      } catch (error) {
        console.warn(`Error processing item ${i}:`, error instanceof Error ? error.message : error)
        results[i] = null
      }
    })()

    const task = { promise, index: i }
    executing.push(task)
  }

  // Aspetta che tutte finiscano
  await Promise.all(executing.map(e => e.promise))

  return results
}

/**
 * Cache helper - get
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Cache helper - set
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Cache helper - clear (utile per test)
 */
export function clearCache(): void {
  cache.clear()
}
