/**
 * Utility functions for safe fetch operations with timeout and error handling
 */

interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * Fetch with timeout support using AbortController
 * Prevents hanging requests that can cause disconnections
 * For internal API calls, adds bypass headers to avoid Vercel Deployment Protection
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options // Default 10 seconds

  // Check if this is an internal API call (server-side and same origin)
  // Fix: Only check VERCEL_URL if it's actually defined and not empty
  // Previously: url.includes(process.env.VERCEL_URL || '') was always true when VERCEL_URL is undefined
  // because url.includes('') returns true for any string, causing all external API calls
  // (OpenDota, OpenAI, Gemini) to receive internal call headers incorrectly
  const vercelUrl = process.env.VERCEL_URL
  const isInternalCall = typeof window === 'undefined' && 
    (url.startsWith('/api/') || 
     (vercelUrl && vercelUrl.trim() !== '' && url.includes(vercelUrl)) ||
     url.includes('localhost') ||
     url.includes('127.0.0.1'))

  // Add bypass headers for internal server-to-server calls
  const headers = new Headers(fetchOptions.headers)
  if (isInternalCall) {
    // Add internal call identifier to bypass Vercel protection
    headers.set('x-internal-call', 'true')
    // If we have a bypass token from env, use it
    const bypassToken = process.env.VERCEL_PROTECTION_BYPASS_TOKEN
    if (bypassToken) {
      headers.set('x-vercel-protection-bypass', bypassToken)
    }
    // Also add user-agent to identify as internal call
    headers.set('user-agent', 'Internal-API-Call/1.0')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`)
    }
    throw error
  }
}

/**
 * Fetch multiple URLs with timeout, returns all results even if some fail
 * Uses Promise.allSettled internally to prevent one failure from blocking others
 */
export async function fetchMultipleSettled(
  urls: string[],
  options: FetchOptions = {}
): Promise<Array<{ url: string; response?: Response; error?: Error }>> {
  const { timeout = 10000, ...fetchOptions } = options

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        timeout,
      })
      return { url, response }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      url: urls[index],
      error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
    }
  })
}