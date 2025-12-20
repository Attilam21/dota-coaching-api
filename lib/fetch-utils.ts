/**
 * Utility functions for safe fetch operations with timeout and error handling
 */

interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * Fetch with timeout support using AbortController
 * Prevents hanging requests that can cause disconnections
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options // Default 10 seconds

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
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


