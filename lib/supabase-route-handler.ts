import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Create Supabase client for Route Handlers (API Routes)
 * 
 * IMPORTANTE: Route Handlers hanno accesso ai cookie tramite request.headers.get('cookie')
 * ma cookies() da next/headers potrebbe non funzionare correttamente in Route Handlers.
 * 
 * Questo client legge i cookie direttamente dalla richiesta HTTP per garantire
 * che l'autenticazione funzioni correttamente in API routes.
 */
export function createRouteHandlerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Leggi i cookie direttamente dalla richiesta HTTP
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Crea un client che legge i cookie dalla richiesta
  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse cookie header string into array of cookies
        const cookies: Array<{ name: string; value: string }> = []
        if (cookieHeader) {
          cookieHeader.split(';').forEach((cookie) => {
            const [name, ...rest] = cookie.trim().split('=')
            if (name && rest.length > 0) {
              try {
                // Decode URI component per gestire caratteri speciali
                const decodedValue = decodeURIComponent(rest.join('='))
                cookies.push({ name: name.trim(), value: decodedValue })
              } catch (err) {
                // Se decodeURIComponent fallisce, usa il valore raw
                console.warn(`[RouteHandler] Failed to decode cookie ${name}:`, err)
                cookies.push({ name: name.trim(), value: rest.join('=') })
              }
            }
          })
        }
        
        // DEBUG: Log solo i cookie Supabase per non loggare tutto
        const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-') || c.name.includes('supabase'))
        if (supabaseCookies.length > 0) {
          console.log('[RouteHandler] 🔍 Parsed Supabase cookies:', {
            count: supabaseCookies.length,
            names: supabaseCookies.map(c => c.name)
          })
        } else {
          console.warn('[RouteHandler] ⚠️ No Supabase cookies found in request')
        }
        
        return cookies
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        // In Route Handlers, non possiamo impostare cookie nella risposta direttamente
        // I cookie vengono gestiti automaticamente da Supabase Auth tramite le risposte
        // Questo è solo per compatibilità con l'API
        cookiesToSet.forEach(({ name, value, options }) => {
          // Non fare nulla - i cookie vengono gestiti dalla risposta HTTP
        })
      },
    },
  })
  
  return client as unknown as SupabaseClient<Database>
}