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
              // Decode URI component per gestire caratteri speciali
              cookies.push({ name: name.trim(), value: decodeURIComponent(rest.join('=')) })
            }
          })
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

